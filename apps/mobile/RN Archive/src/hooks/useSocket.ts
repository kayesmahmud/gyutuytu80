import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { SOCKET_URL, STORAGE_KEYS } from '../constants/config';

interface UseSocketOptions {
  autoConnect?: boolean;
}

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<SocketState>({
    socket: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const connect = useCallback(async () => {
    if (socketRef.current?.connected) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);

      if (!token) {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: 'No auth token',
        }));
        return;
      }

      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        console.log('🔌 Socket connected');
        setState(prev => ({
          ...prev,
          socket,
          isConnected: true,
          isConnecting: false,
        }));
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        setState(prev => ({
          ...prev,
          isConnected: false,
        }));
      });

      socket.on('connect_error', (error) => {
        console.error('🔌 Socket connection error:', error.message);
        setState(prev => ({
          ...prev,
          isConnecting: false,
          isConnected: false,
          error: error.message,
        }));
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('🔌 Socket init error:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState({
        socket: null,
        isConnected: false,
        isConnecting: false,
        error: null,
      });
    }
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Emit helper
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('🔌 Socket not connected, cannot emit:', event);
    }
  }, []);

  // Subscribe to event
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback);
    return () => {
      socketRef.current?.off(event, callback);
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    emit,
    on,
  };
}

// Convenience hooks for specific features
export function useChatSocket(conversationId: string | number) {
  const { socket, isConnected, emit, on } = useSocket();

  useEffect(() => {
    if (isConnected && conversationId) {
      emit('join_conversation', { conversationId });

      return () => {
        emit('leave_conversation', { conversationId });
      };
    }
  }, [isConnected, conversationId, emit]);

  const sendMessage = useCallback((content: string) => {
    emit('send_message', { conversationId, content });
  }, [conversationId, emit]);

  const sendTyping = useCallback((isTyping: boolean) => {
    emit('typing', { conversationId, isTyping });
  }, [conversationId, emit]);

  return {
    socket,
    isConnected,
    sendMessage,
    sendTyping,
    on,
  };
}
