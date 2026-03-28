/**
 * useSocket Hook - 2025 Best Practices
 * Socket.IO client for real-time messaging
 * Features: Auto-reconnection, JWT auth, event listeners
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  token: string | null;
  autoConnect?: boolean;
}

interface SocketState {
  connected: boolean;
  error: string | null;
}

export function useSocket({ token, autoConnect = true }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<SocketState>({
    connected: false,
    error: null,
  });
  // Track whether a token refresh is in progress to avoid concurrent refreshes
  const refreshingRef = useRef(false);

  // Initialize socket connection
  useEffect(() => {
    console.log('🔌 [useSocket] Token status:', token ? `Present (${token.substring(0, 20)}...)` : 'NULL/UNDEFINED');

    if (!token || !autoConnect) {
      return;
    }

    // Build socket URL: use NEXT_PUBLIC_BACKEND_URL, or construct from API hostname (for browser access)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
      || (process.env.NEXT_PUBLIC_API_HOSTNAME ? `https://${process.env.NEXT_PUBLIC_API_HOSTNAME}` : null);
    if (!backendUrl) {
      console.warn('⚠️ [useSocket] No backend URL set, skipping socket connection');
      return;
    }

    console.log('🔌 [useSocket] Connecting to:', backendUrl);

    const socket = io(backendUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ [useSocket] Socket.IO connected:', socket.id);
      setState({ connected: true, error: null });
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [useSocket] Socket.IO disconnected:', reason);
      setState({ connected: false, error: null });
    });

    socket.on('connect_error', async (error) => {
      console.error('❌ [useSocket] Connection error:', error.message);
      setState({ connected: false, error: error.message });

      // If the error is about an expired/invalid token, auto-refresh it
      const isAuthError = error.message.includes('expired')
        || error.message.includes('Invalid')
        || error.message.includes('Authentication');

      if (isAuthError && !refreshingRef.current) {
        refreshingRef.current = true;
        console.log('🔄 [useSocket] Auth error detected — refreshing token...');
        try {
          const res = await fetch('/api/auth/refresh-token', { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            const newToken = data.data?.token || data.token;
            if (newToken) {
              // Update socket auth so the next reconnect attempt uses the fresh token
              socket.auth = { token: newToken };
              localStorage.setItem('backend_jwt_token', newToken);
              console.log('✅ [useSocket] Token refreshed — next reconnect will use new token');
            }
          }
        } catch (e) {
          console.error('❌ [useSocket] Token refresh failed:', e);
        } finally {
          refreshingRef.current = false;
        }
      }
    });

    socket.on('error', (error) => {
      console.error('❌ [useSocket] Socket.IO error:', error);
      setState((prev) => ({ ...prev, error: error.message || 'Socket error' }));
    });

    // Proactive token refresh: refresh every 12 hours to prevent expiry during long sessions
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    const refreshInterval = setInterval(async () => {
      if (refreshingRef.current) return;
      refreshingRef.current = true;
      try {
        const res = await fetch('/api/auth/refresh-token', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          const newToken = data.data?.token || data.token;
          if (newToken) {
            socket.auth = { token: newToken };
            localStorage.setItem('backend_jwt_token', newToken);
            console.log('🔄 [useSocket] Proactive token refresh complete');
          }
        }
      } catch (e) {
        console.error('❌ [useSocket] Proactive token refresh failed:', e);
      } finally {
        refreshingRef.current = false;
      }
    }, TWELVE_HOURS_MS);

    // Cleanup on unmount
    return () => {
      console.log('🧹 [useSocket] Cleaning up socket connection');
      clearInterval(refreshInterval);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, autoConnect]);

  // Emit event with callback
  const emit = useCallback((event: string, data: any, callback?: (response: any) => void) => {
    if (!socketRef.current?.connected) {
      console.warn('⚠️ Socket not connected, cannot emit:', event);
      if (callback) {
        callback({ error: 'Socket not connected' });
      }
      return;
    }

    socketRef.current.emit(event, data, callback);
  }, []);

  // Subscribe to event
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
  }, []);

  // Unsubscribe from event
  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    socketRef.current?.off(event, handler);
  }, []);

  return {
    socket: socketRef.current,
    connected: state.connected,
    error: state.error,
    emit,
    on,
    off,
  };
}

/**
 * useMessages Hook - Messaging-specific functionality
 */
export function useMessages(token: string | null) {
  const { socket, connected, error, emit, on, off } = useSocket({ token });

  // Send message
  const sendMessage = useCallback(
    (conversationId: number, content: string, type = 'text') => {
      return new Promise((resolve, reject) => {
        emit(
          'message:send',
          { conversationId, content, type },
          (response: any) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response.message);
            }
          }
        );
      });
    },
    [emit]
  );

  // Mark messages as read
  const markAsRead = useCallback(
    (conversationId: number) => {
      return new Promise((resolve, reject) => {
        emit('message:read', { conversationId }, (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },
    [emit]
  );

  // Edit message
  const editMessage = useCallback(
    (messageId: number, newContent: string) => {
      return new Promise((resolve, reject) => {
        emit('message:edit', { messageId, newContent }, (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },
    [emit]
  );

  // Delete message
  const deleteMessage = useCallback(
    (messageId: number) => {
      return new Promise((resolve, reject) => {
        emit('message:delete', { messageId }, (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },
    [emit]
  );

  // Typing indicators
  const startTyping = useCallback(
    (conversationId: number) => {
      emit('typing:start', { conversationId });
    },
    [emit]
  );

  const stopTyping = useCallback(
    (conversationId: number) => {
      emit('typing:stop', { conversationId });
    },
    [emit]
  );

  return {
    socket,
    connected,
    error,
    sendMessage,
    markAsRead,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping,
  };
}
