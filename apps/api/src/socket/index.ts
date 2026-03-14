/**
 * Socket.IO Handler - TypeScript Version
 * - JWT Authentication at connection time
 * - Error handling and reconnection support
 * - Real-time messaging with typing indicators
 * - Read receipts and online status
 */

import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { prisma } from '@thulobazaar/database';
import config from '../config/index.js';
import { createAuthMiddleware } from './auth.js';
import { initializeMessageHandlers } from './handlers/messageHandlers.js';
import { initializeTypingHandlers } from './handlers/typingHandlers.js';
import { initializeConversationHandlers } from './handlers/conversationHandlers.js';
import { initializeSupportHandlers } from './handlers/supportHandlers.js';
import { joinUserConversations, broadcastUserOnlineStatus } from './utils/roomManagement.js';
import type { AuthenticatedSocket } from './types.js';

// In-memory store for online users (use Redis in production for multi-server scaling)
const onlineUsers = new Map<number, string>(); // userId -> socketId

/**
 * Initialize Socket.IO with JWT authentication
 */
export function initializeSocketIO(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: (requestOrigin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!requestOrigin) return callback(null, true);

        // Check against allowed origins
        if (config.CORS_ORIGINS.includes(requestOrigin)) {
          callback(null, true);
        } else {
          console.log(`❌ Blocked by CORS: ${requestOrigin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(createAuthMiddleware());

  // Connection handler
  io.on('connection', (socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const userId = authSocket.userId;
    console.log(`🔌 Socket.IO: User ${userId} connected (Socket: ${socket.id})`);

    // Store online user
    onlineUsers.set(userId, socket.id);

    // Broadcast user online status to their conversations
    broadcastUserOnlineStatus(io, userId, true);

    // Join user's conversation rooms
    joinUserConversations(socket, userId);

    // Initialize event handlers
    initializeMessageHandlers(io, authSocket, onlineUsers);
    initializeTypingHandlers(io, authSocket);
    initializeConversationHandlers(io, authSocket, onlineUsers);
    initializeSupportHandlers(io, authSocket);

    // =====================
    // DISCONNECT
    // =====================

    socket.on('disconnect', () => {
      console.log(`🔌 Socket.IO: User ${userId} disconnected (Socket: ${socket.id})`);

      // Remove from online users
      onlineUsers.delete(userId);

      // Broadcast user offline status
      broadcastUserOnlineStatus(io, userId, false);

      // Clean up typing indicators
      prisma.typing_indicators
        .deleteMany({ where: { user_id: userId } })
        .catch((err) => console.error('Error cleaning typing indicators:', err));
    });

    // =====================
    // ERROR HANDLING
    // =====================

    socket.on('error', (error) => {
      console.error(`❌ Socket.IO error for user ${userId}:`, error);
    });
  });

  console.log('✅ Socket.IO initialized with authentication');
  return io;
}

/**
 * Get online users (for admin dashboard)
 */
export function getOnlineUsers(): number[] {
  return Array.from(onlineUsers.keys());
}

/**
 * Check if a user is currently connected via Socket.IO
 */
export function isUserOnline(userId: number): boolean {
  return onlineUsers.has(userId);
}
