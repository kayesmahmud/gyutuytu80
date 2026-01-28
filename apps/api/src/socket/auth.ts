import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import type { AuthenticatedSocket, JwtPayload } from './types.js';

/**
 * Authentication middleware for Socket.IO
 */
export function createAuthMiddleware() {
  return (socket: any, next: (err?: Error) => void) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

      const authSocket = socket as AuthenticatedSocket;
      authSocket.userId = decoded.userId;
      authSocket.userEmail = decoded.email;
      authSocket.userRole = decoded.role;

      console.log(`✅ Socket.IO: User ${decoded.email} (ID: ${decoded.userId}) authenticated`);
      next();
    } catch (error) {
      const err = error as Error;
      console.error('❌ Socket.IO authentication failed:', err.message);
      return next(new Error('Invalid or expired token'));
    }
  };
}


