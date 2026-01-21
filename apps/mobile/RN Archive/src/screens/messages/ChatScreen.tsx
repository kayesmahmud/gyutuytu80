import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/api';
import { useChatSocket } from '../../hooks/useSocket';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/config';

interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  adId: number;
  message: string;
  isRead: boolean;
  createdAt: Date | string;
}

interface ChatScreenProps {
  route: {
    params: {
      conversationId?: number;
      recipientId: number;
      recipientName: string;
      adId?: number;
      adTitle?: string;
    };
  };
  navigation: any;
}

function formatMessageTime(date: Date | string): string {
  const messageDate = new Date(date);
  const now = new Date();
  const isToday = messageDate.toDateString() === now.toDateString();

  const timeStr = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return timeStr;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${timeStr}`;
  }

  return `${messageDate.toLocaleDateString()} ${timeStr}`;
}

export default function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { conversationId, recipientId, recipientName, adId, adTitle } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Socket connection
  const { isConnected, sendMessage, sendTyping, on } = useChatSocket(conversationId || 0);

  // Set header title
  useEffect(() => {
    navigation.setOptions({
      title: recipientName,
      headerBackTitle: 'Messages',
    });
  }, [navigation, recipientName]);

  // Load initial messages
  useEffect(() => {
    if (conversationId) {
      loadMessages();
    } else {
      setLoading(false);
    }
  }, [conversationId]);

  // Socket event listeners
  useEffect(() => {
    if (!isConnected) return;

    // Listen for new messages
    const unsubMessage = on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      // Scroll to bottom when new message arrives
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    // Listen for typing indicator
    const unsubTyping = on('user_typing', (data: { userId: number; isTyping: boolean }) => {
      if (data.userId === recipientId) {
        setOtherUserTyping(data.isTyping);
      }
    });

    // Listen for message read status
    const unsubRead = on('messages_read', (data: { conversationId: number }) => {
      if (data.conversationId === conversationId) {
        setMessages(prev =>
          prev.map(msg => ({ ...msg, isRead: true }))
        );
      }
    });

    return () => {
      unsubMessage();
      unsubTyping();
      unsubRead();
    };
  }, [isConnected, conversationId, recipientId, on]);

  const loadMessages = async () => {
    if (!conversationId) return;

    try {
      const response = await apiClient.getMessages(conversationId);
      if (response.success && response.data) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || sending) return;

    setSending(true);
    setInputText('');

    try {
      // Optimistically add message
      const tempId = Date.now();
      const optimisticMessage: Message = {
        id: tempId,
        senderId: user?.id || 0,
        recipientId,
        adId: adId || 0,
        message: trimmedText,
        isRead: false,
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, optimisticMessage]);

      // Send via API
      const response = await apiClient.sendMessage({
        recipientId,
        adId: adId || 0,
        message: trimmedText,
      });

      if (response.success && response.data) {
        // Replace optimistic message with real one
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId ? response.data : msg
          )
        );
      }

      // Also emit via socket for real-time delivery
      if (isConnected) {
        sendMessage(trimmedText);
      }

      // Scroll to bottom
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== Date.now()));
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setInputText(text);

    // Send typing indicator
    if (isConnected) {
      sendTyping(true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
      }, 2000);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderId === user?.id;
    const showTime = index === 0 ||
      new Date(item.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 300000;

    return (
      <View className={`px-4 mb-2 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {showTime && (
          <Text className="text-xs text-gray-400 text-center w-full mb-2">
            {formatMessageTime(item.createdAt)}
          </Text>
        )}
        <View
          className={`max-w-[80%] px-4 py-2 rounded-2xl ${
            isOwnMessage
              ? 'bg-primary-500 rounded-br-sm'
              : 'bg-white rounded-bl-sm'
          }`}
        >
          <Text className={isOwnMessage ? 'text-white' : 'text-gray-900'}>
            {item.message}
          </Text>
        </View>
        {isOwnMessage && item.isRead && index === messages.length - 1 && (
          <Text className="text-xs text-gray-400 mt-1">Read</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-100"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Ad Context Header */}
      {adTitle && (
        <View className="bg-white border-b border-gray-200 px-4 py-2">
          <Text className="text-xs text-gray-500">Regarding:</Text>
          <Text className="text-sm font-medium text-primary-600" numberOfLines={1}>
            {adTitle}
          </Text>
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => `msg-${item.id}`}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingVertical: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-5xl mb-4">👋</Text>
            <Text className="text-gray-500 text-center">
              Start the conversation!
            </Text>
          </View>
        }
      />

      {/* Typing Indicator */}
      {otherUserTyping && (
        <View className="px-4 pb-2">
          <View className="bg-white px-4 py-2 rounded-2xl rounded-bl-sm self-start">
            <Text className="text-gray-500 text-sm">{recipientName} is typing...</Text>
          </View>
        </View>
      )}

      {/* Input Area */}
      <View
        className="flex-row items-end px-4 py-3 bg-white border-t border-gray-200"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <TextInput
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-base max-h-24"
          placeholder="Type a message..."
          placeholderTextColor={COLORS.gray[400]}
          value={inputText}
          onChangeText={handleTyping}
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          className={`ml-2 w-11 h-11 rounded-full justify-center items-center ${
            inputText.trim() ? 'bg-primary-500' : 'bg-gray-300'
          }`}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white text-lg">➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
