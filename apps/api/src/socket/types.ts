import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  userId: number;
  userEmail: string;
  userRole?: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role?: string;
}

export interface SendMessagePayload {
  conversationId: number;
  content: string;
  type?: 'text' | 'image' | 'file';
  attachmentUrl?: string;
}

export interface CreateConversationPayload {
  participantIds: number[];
  type?: 'direct' | 'group';
  title?: string;
  adId?: number;
}


