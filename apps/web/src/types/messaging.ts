/**
 * Messaging Types
 * Shared types for web and mobile apps
 */

// ============================================
// Conversation Types
// ============================================

export type ConversationType = 'direct' | 'group';

export interface ConversationParticipant {
  id: number;
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  isOnline?: boolean;
}

export interface Conversation {
  id: number;
  type: ConversationType;
  title: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  participants: ConversationParticipant[];
  adId?: number;
  adTitle?: string;
  adImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  isMuted: boolean;
}

export interface ConversationsResponse {
  success: boolean;
  data: Conversation[];
  message?: string;
}

// ============================================
// Message Types
// ============================================

export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatarUrl: string | null;
  content: string;
  type: MessageType;
  attachmentUrl: string | null;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
  isEdited: boolean;
  editedAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
}

export interface ConversationDetailResponse {
  success: boolean;
  data: Conversation & { messages: Message[] };
  message?: string;
}

export interface SendMessageResponse {
  success: boolean;
  data: Message;
  message?: string;
}

// ============================================
// Utility Types
// ============================================

export interface ApiError {
  success: false;
  message: string;
}

export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    (response as ApiError).success === false
  );
}

/**
 * Format relative date for display
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

/**
 * Format full date with time
 */
export function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
