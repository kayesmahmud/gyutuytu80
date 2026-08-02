import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMessages } from '@/hooks/useSocket';
import { messagingApi } from '@/lib/messaging';

const POLL_INTERVAL_MS = 10_000; // 10 seconds when socket is down

interface UseMessagesPageStateProps {
  token: string | null;
  currentUserId?: number;
}

export function useMessagesPageState({ token, currentUserId }: UseMessagesPageStateProps) {
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Conversation messages
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);

  // Typing users for current conversation (managed directly via socket.on)
  const [typingUsers, setTypingUsers] = useState<number[]>([]);

  // Socket.IO connection
  const {
    connected,
    error: socketError,
    sendMessage: socketSendMessage,
    markAsRead: socketMarkAsRead,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    socket,
  } = useMessages(token);

  // REST API fallback for sending messages
  const sendMessageViaApi = useCallback(async (conversationId: number, content: string) => {
    const response = await fetch(`/api/messages/conversations/${conversationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to send message');
    }

    return response.json();
  }, [token]);

  const sendMessage = connected ? socketSendMessage : sendMessageViaApi;
  const markAsRead = connected ? socketMarkAsRead : async () => { };

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await messagingApi.getConversations(token);
      setConversations(response.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load conversations on mount
  useEffect(() => {
    if (!token) return;
    loadConversations();
  }, [token, loadConversations]);

  // Re-sync on socket reconnect to pick up missed messages
  useEffect(() => {
    if (!socket || !connected || !token) return;

    const handleReconnect = () => {
      console.log('🔄 Socket reconnected — re-syncing conversations');
      loadConversations();
      // Re-fetch active conversation messages if one is selected
      if (selectedConversation) {
        handleSelectConversation(selectedConversation);
      }
    };

    socket.io.on('reconnect', handleReconnect);
    return () => {
      socket.io.off('reconnect', handleReconnect);
    };
  }, [socket, connected, token, loadConversations, selectedConversation]);

  // Auto-select conversation from URL
  useEffect(() => {
    const conversationId = searchParams?.get('conversation');
    if (!conversationId || conversations.length === 0 || !token) return;

    const conversation = conversations.find((c) => c.id === parseInt(conversationId));
    if (conversation && (!selectedConversation || selectedConversation.id !== conversation.id)) {
      console.log('Auto-selecting conversation from URL:', conversationId);
      handleSelectConversation(conversation);
    }
  }, [searchParams, conversations, token]);

  // Socket.IO: Listen for conversation updates
  useEffect(() => {
    if (!socket || !connected) return;

    const currentlyViewingId = selectedConversation?.id;

    const handleConversationUpdated = (data: any) => {
      setConversations((prevConversations) => {
        const updatedConversations = prevConversations.map((conv) => {
          if (conv.id === data.conversationId) {
            const isCurrentlyViewing = currentlyViewingId === data.conversationId;
            return {
              ...conv,
              lastMessage: data.lastMessage,
              last_message: data.lastMessage,
              last_message_at: data.timestamp,
              lastMessageAt: data.timestamp,
              unreadCount: isCurrentlyViewing ? 0 : (conv.unreadCount || 0) + 1,
              unread_count: isCurrentlyViewing ? 0 : (conv.unread_count || 0) + 1,
            };
          }
          return conv;
        });

        return updatedConversations.sort((a, b) => {
          const dateA = new Date(a.lastMessageAt || a.last_message_at || 0).getTime();
          const dateB = new Date(b.lastMessageAt || b.last_message_at || 0).getTime();
          return dateB - dateA;
        });
      });
    };

    socket.on('conversation:updated', handleConversationUpdated);
    return () => {
      socket.off('conversation:updated', handleConversationUpdated);
    };
  }, [socket, connected, selectedConversation?.id]);

  // Socket.IO: Listen for new messages
  useEffect(() => {
    if (!socket || !connected || !selectedConversation) return;

    const handleNewMessage = (messageData: any) => {
      if (messageData.conversationId === selectedConversation.id) {
        // Skip own messages (already added via optimistic update in handleSendMessage)
        if (currentUserId && messageData.senderId === currentUserId) return;

        setConversationMessages((prev) => {
          const exists = prev.some((msg) => msg.id === messageData.id);
          if (exists) return prev;
          return [...prev, messageData];
        });
      }
    };

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [socket, connected, selectedConversation, currentUserId]);

  // Socket.IO: Listen for message edits/deletes (server echoes to the whole room, incl. sender)
  useEffect(() => {
    if (!socket || !connected || !selectedConversation) return;

    const handleMessageEdited = (data: { messageId: number; newContent: string; editedAt: string }) => {
      setConversationMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, content: data.newContent, isEdited: true } : msg
        )
      );
    };

    const handleMessageDeleted = (data: { messageId: number }) => {
      setConversationMessages((prev) =>
        prev.map((msg) => (msg.id === data.messageId ? { ...msg, isDeleted: true } : msg))
      );
    };

    socket.on('message:edited', handleMessageEdited);
    socket.on('message:deleted', handleMessageDeleted);
    return () => {
      socket.off('message:edited', handleMessageEdited);
      socket.off('message:deleted', handleMessageDeleted);
    };
  }, [socket, connected, selectedConversation]);

  // Socket.IO: Listen for typing indicators (direct socket.on — same proven pattern as message:new)
  useEffect(() => {
    if (!socket || !connected || !selectedConversation) return;

    const handleTypingStart = (data: { conversationId: number; userId: number }) => {
      if (data.conversationId !== selectedConversation.id) return;
      if (data.userId === currentUserId) return;
      setTypingUsers((prev) => (prev.includes(data.userId) ? prev : [...prev, data.userId]));
    };

    const handleTypingStop = (data: { conversationId: number; userId: number }) => {
      if (data.conversationId !== selectedConversation.id) return;
      setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
    };

    // Clear typing state when switching conversations
    setTypingUsers([]);

    socket.on('typing:user-started', handleTypingStart);
    socket.on('typing:user-stopped', handleTypingStop);
    return () => {
      socket.off('typing:user-started', handleTypingStart);
      socket.off('typing:user-stopped', handleTypingStop);
    };
  }, [socket, connected, selectedConversation, currentUserId]);

  // =====================
  // POLLING FALLBACK — when socket is down, poll for updates every 10s
  // =====================
  const selectedConversationRef = useRef(selectedConversation);
  selectedConversationRef.current = selectedConversation;

  useEffect(() => {
    // Only poll when socket is NOT connected
    if (connected || !token) return;

    console.log('📡 [Polling] Socket disconnected — starting polling fallback');

    const poll = async () => {
      try {
        // 1. Refresh conversation list (for sidebar updates)
        const convResponse = await messagingApi.getConversations(token);
        if (convResponse.data) {
          setConversations(convResponse.data);
        }

        // 2. If a conversation is open, fetch new messages
        const currentConv = selectedConversationRef.current;
        if (currentConv) {
          const msgResponse = await messagingApi.getConversation(token, currentConv.id);
          if (msgResponse.data?.messages) {
            setConversationMessages((prev) => {
              // Merge: keep existing messages, add any new ones from server
              const existingIds = new Set(prev.map((m: any) => m.id));
              const newMsgs = msgResponse.data.messages.filter(
                (m: any) => !existingIds.has(m.id)
              );
              if (newMsgs.length === 0) return prev;
              return [...prev, ...newMsgs];
            });
          }
        }
      } catch (err) {
        console.error('📡 [Polling] Error:', err);
      }
    };

    // Initial poll immediately
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      console.log('📡 [Polling] Stopped (socket reconnected or unmount)');
      clearInterval(interval);
    };
  }, [connected, token]);

  // Select conversation handler
  const handleSelectConversation = useCallback(async (conversation: any) => {
    if (!token) return;
    try {
      setSelectedConversation(conversation);

      // Ensure socket is in this conversation's room (handles new/REST-created conversations)
      if (socket && connected) {
        socket.emit('room:join', { room: `conversation:${conversation.id}` });
      }

      const response = await messagingApi.getConversation(token, conversation.id);
      const conversationData = response.data;
      setSelectedConversation(conversationData);

      if (conversationData.messages) {
        setConversationMessages(conversationData.messages);
      } else {
        setConversationMessages([]);
      }

      await markAsRead(conversation.id);
    } catch (err: any) {
      console.error('Failed to load conversation:', err);
      setError(err.message);
    }
  }, [token, markAsRead, socket, connected]);

  // Send message handler
  const handleSendMessage = useCallback(async (content: string, type: string = 'text', attachmentUrl?: string) => {
    if (!selectedConversation || !token) return;

    try {
      if (type === 'image' && attachmentUrl) {
        const response = await fetch(`/api/messages/conversations/${selectedConversation.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ content, type, attachmentUrl }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to send image message');
        }

        const result = await response.json();
        if (result?.data) {
          setConversationMessages((prev) => [...prev, result.data]);
        }
      } else {
        const result = await sendMessage(selectedConversation.id, content);
        // Add message immediately (socket echo will be skipped for own messages)
        if (result) {
          const messageToAdd = result.data || result;
          setConversationMessages((prev) => {
            const exists = prev.some((msg) => msg.id === messageToAdd.id);
            if (exists) return prev;
            return [...prev, messageToAdd];
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err.message);
    }
  }, [selectedConversation, token, sendMessage, connected]);

  // Clear selection handlers
  const clearSelectedConversation = useCallback(() => {
    setSelectedConversation(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    conversations,
    selectedConversation,
    loading,
    error,
    conversationMessages,
    connected,
    socketError,
    typingUsers,

    // Handlers
    handleSelectConversation,
    handleSendMessage,
    editMessage,
    deleteMessage,
    clearSelectedConversation,
    clearError,
    startTyping,
    stopTyping,
  };
}
