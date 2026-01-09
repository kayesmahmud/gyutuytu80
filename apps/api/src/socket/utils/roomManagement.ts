import { Server, Socket } from 'socket.io';
import { prisma } from '@thulobazaar/database';
import type { AuthenticatedSocket } from '../types.js';

/**
 * Join user to their conversation rooms
 */
export async function joinUserConversations(socket: Socket, userId: number): Promise<void> {
  try {
    const participants = await prisma.conversation_participants.findMany({
      where: { user_id: userId },
      select: { conversation_id: true },
    });

    participants.forEach((row) => {
      const roomName = `conversation:${row.conversation_id}`;
      socket.join(roomName);
      console.log(`  📨 User ${userId} joined room: ${roomName}`);
    });
  } catch (error) {
    console.error('❌ Error joining conversations:', error);
  }
}

/**
 * Check if user is a conversation member
 */
export async function checkConversationMembership(userId: number, conversationId: number): Promise<boolean> {
  const participant = await prisma.conversation_participants.findFirst({
    where: {
      user_id: userId,
      conversation_id: conversationId,
    },
  });
  return !!participant;
}

/**
 * Broadcast user online/offline status
 */
export async function broadcastUserOnlineStatus(io: Server, userId: number, isOnline: boolean): Promise<void> {
  try {
    const participants = await prisma.conversation_participants.findMany({
      where: { user_id: userId },
      select: { conversation_id: true },
    });

    participants.forEach((row) => {
      io.to(`conversation:${row.conversation_id}`).emit('user:status', {
        userId,
        isOnline,
        timestamp: new Date(),
      });
    });
  } catch (error) {
    console.error('❌ Error broadcasting online status:', error);
  }
}

