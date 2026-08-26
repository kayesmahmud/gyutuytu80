'use client';

import { formatDistanceToNow } from 'date-fns';
import { Search } from 'lucide-react';
import type { TeamConversation } from './types';

interface ConversationsListProps {
  conversations: TeamConversation[];
  selectedId: number | null;
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onSelect: (conversation: TeamConversation) => void;
}

export function ConversationsList({
  conversations,
  selectedId,
  loading,
  searchTerm,
  setSearchTerm,
  onSelect,
}: ConversationsListProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
        <h3 className="font-bold text-gray-900">Conversations ({conversations.length})</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email or ad..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>
      <div className="overflow-y-auto max-h-[600px]">
        {loading ? (
          <div className="p-5 sm:p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-5 sm:p-8 text-center text-gray-500">
            <div className="text-2xl sm:text-4xl mb-2">📭</div>
            <p>No conversations yet</p>
            <p className="text-xs mt-1">
              Use &quot;Message Seller&quot; on an ad in Ad Management to start one.
            </p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedId === conversation.id}
              onClick={() => onSelect(conversation)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: TeamConversation;
  isSelected: boolean;
  onClick: () => void;
}

function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  const name = conversation.user?.fullName || 'Unknown user';
  const hasUnread = conversation.unreadCount > 0;

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-teal-50 border-l-4 border-l-teal-500' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center font-bold flex-shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}
            >
              {name}
            </span>
            {conversation.lastMessage?.createdAt && (
              <span className="text-xs text-gray-500 flex-shrink-0">
                {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span className={`text-xs truncate ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
              {conversation.lastMessage
                ? `${conversation.lastMessage.fromTeam ? 'Team: ' : ''}${
                    conversation.lastMessage.type === 'image'
                      ? '📷 Image'
                      : conversation.lastMessage.content
                  }`
                : 'No messages yet'}
            </span>
            {hasUnread && (
              <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">
                {conversation.unreadCount}
              </span>
            )}
          </div>
          {conversation.ad && (
            <div className="text-xs text-gray-400 truncate mt-0.5">About: {conversation.ad.title}</div>
          )}
        </div>
      </div>
    </div>
  );
}
