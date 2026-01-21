import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../../lib/api';
import { COLORS, API_BASE_URL } from '../../constants/config';
import { useAuth } from '../../contexts/AuthContext';

interface Conversation {
  id: number;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage: string;
  lastMessageAt: Date | string;
  unreadCount: number;
  adTitle?: string;
  adId?: number;
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const messageDate = new Date(date);
  const diffMs = now.getTime() - messageDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return messageDate.toLocaleDateString();
}

function getAvatarUrl(path: string | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}/uploads/${path}`;
}

export default function ConversationsListScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.getConversations();
      if (response.success && response.data) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  // Reload on screen focus
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      recipientId: conversation.otherUserId,
      recipientName: conversation.otherUserName,
      adId: conversation.adId,
      adTitle: conversation.adTitle,
    });
  };

  if (!isAuthenticated) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        <Text className="text-5xl mb-4">💬</Text>
        <Text className="text-xl font-semibold text-gray-900 mb-2">
          Sign in to view messages
        </Text>
        <Text className="text-gray-500 text-center mb-6">
          Connect with buyers and sellers about ads you're interested in
        </Text>
        <TouchableOpacity
          className="bg-primary-500 px-8 py-3 rounded-xl"
          onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
        >
          <Text className="text-white font-semibold text-base">Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const renderConversation = ({ item }: { item: Conversation }) => {
    const avatarUrl = getAvatarUrl(item.otherUserAvatar);
    const hasUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        className={`flex-row items-center px-4 py-3 bg-white border-b border-gray-100 ${
          hasUnread ? 'bg-primary-50' : ''
        }`}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View className="w-12 h-12 rounded-full bg-gray-200 mr-3 overflow-hidden">
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 48, height: 48 }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View className="w-full h-full justify-center items-center">
              <Text className="text-xl">{item.otherUserName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View className="flex-1 mr-2">
          <View className="flex-row items-center justify-between mb-0.5">
            <Text
              className={`text-base ${hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}
              numberOfLines={1}
            >
              {item.otherUserName}
            </Text>
            <Text className="text-xs text-gray-400">
              {formatTimeAgo(item.lastMessageAt)}
            </Text>
          </View>

          {item.adTitle && (
            <Text className="text-xs text-primary-600 mb-0.5" numberOfLines={1}>
              Re: {item.adTitle}
            </Text>
          )}

          <Text
            className={`text-sm ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>

        {/* Unread Badge */}
        {hasUnread && (
          <View className="bg-primary-500 rounded-full min-w-[20px] h-5 px-1.5 justify-center items-center">
            <Text className="text-white text-xs font-bold">
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {conversations.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-5xl mb-4">📭</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            No messages yet
          </Text>
          <Text className="text-gray-500 text-center">
            Start a conversation by contacting a seller on an ad you're interested in
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => `conv-${item.id}`}
          renderItem={renderConversation}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </View>
  );
}
