/**
 * Team Inbox Socket.IO Hook
 * Staff-only: joins the shared 'team:inbox' room and receives every message
 * flowing through "Thulo Bazaar Team" conversations in real time.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface TeamInboxSocketMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  type: string | null;
  attachmentUrl: string | null;
  createdAt: string | null;
  sender: { id: number; fullName: string; avatar: string | null; isStaff: boolean };
  /** Present only on team-sent messages (staff-room copy) */
  sentBy?: { id: number; fullName: string } | null;
}

interface UseTeamInboxSocketOptions {
  token: string | null;
  onMessageNew?: (message: TeamInboxSocketMessage) => void;
}

export function useTeamInboxSocket({ token, onMessageNew }: UseTeamInboxSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Latest callback in a ref so the socket doesn't reconnect on every render
  const onMessageNewRef = useRef(onMessageNew);
  onMessageNewRef.current = onMessageNew;

  useEffect(() => {
    if (!token) return;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const socket = io(backendUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('team-inbox:join', (response: { success?: boolean; error?: string }) => {
        if (response?.error) {
          console.error('Failed to join team inbox room:', response.error);
        }
      });
    });

    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', (error) => {
      console.error('Team inbox socket connection error:', error);
      setIsConnected(false);
    });

    socket.on('team-inbox:message-new', (message: TeamInboxSocketMessage) => {
      onMessageNewRef.current?.(message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  return { isConnected };
}
