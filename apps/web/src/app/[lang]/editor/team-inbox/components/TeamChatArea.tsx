'use client';

import { ArrowLeft, Send } from 'lucide-react';
import type { RefObject } from 'react';
import type { TeamConversationDetail } from './types';

interface TeamChatAreaProps {
  conversation: TeamConversationDetail | null;
  isConnected: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  newMessage: string;
  setNewMessage: (value: string) => void;
  sendingMessage: boolean;
  profanityWarning: string | null;
  onDismissProfanityWarning: () => void;
  onSendMessage: () => void;
  onBack: () => void;
}

export function TeamChatArea({
  conversation,
  isConnected,
  messagesEndRef,
  newMessage,
  setNewMessage,
  sendingMessage,
  profanityWarning,
  onDismissProfanityWarning,
  onSendMessage,
  onBack,
}: TeamChatAreaProps) {
  if (!conversation) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex items-center justify-center text-center text-gray-500">
        <div>
          <div className="text-4xl mb-3">💬</div>
          <p className="font-semibold">Select a conversation</p>
          <p className="text-sm mt-1">
            Messages here are sent as <span className="font-semibold">Thulo Bazaar Team</span> —
            every editor sees the same threads.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="lg:hidden p-1 -ml-1 text-gray-600 hover:text-gray-900"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center font-bold flex-shrink-0">
            {conversation.user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-gray-900 truncate">{conversation.user.fullName}</div>
            <div className="text-xs text-gray-500 truncate">
              {[conversation.user.email, conversation.user.phone].filter(Boolean).join(' · ')}
            </div>
          </div>
          <span
            className={`flex-shrink-0 px-2 py-1 text-xs font-semibold rounded-full ${
              isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {isConnected ? '● Live' : '○ Polling'}
          </span>
        </div>
        {conversation.ad && (
          <div className="mt-2 px-3 py-1.5 bg-teal-50 border border-teal-100 rounded-lg text-xs text-teal-800 truncate">
            About: <span className="font-semibold">{conversation.ad.title}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conversation.messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-8">
            No messages yet — say hello as Thulo Bazaar Team.
          </div>
        ) : (
          conversation.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.fromTeam ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[80%]">
                <div
                  className={`px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                    message.fromTeam
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  } ${message.isDeleted ? 'italic opacity-60' : ''}`}
                >
                  {message.type === 'image' && message.attachmentUrl && !message.isDeleted ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={message.attachmentUrl}
                      alt="Attachment"
                      className="rounded-lg max-w-full max-h-64"
                    />
                  ) : null}
                  {message.content && <div>{message.content}</div>}
                </div>
                <div
                  className={`mt-1 text-[11px] text-gray-400 flex items-center gap-1.5 ${
                    message.fromTeam ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Attribution is staff-only: users never see which editor wrote it */}
                  {message.fromTeam && message.sentBy && (
                    <span className="italic">via {message.sentBy.fullName}</span>
                  )}
                  {message.isEdited && <span>(edited)</span>}
                  {message.createdAt && (
                    <span>
                      {new Date(message.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Profanity warning */}
      {profanityWarning && (
        <div className="mx-4 mb-2 p-3 bg-amber-50 border border-amber-300 text-amber-800 text-sm rounded-lg flex justify-between items-center">
          <span>{profanityWarning}</span>
          <button onClick={onDismissProfanityWarning} className="font-bold ml-3">
            &times;
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSendMessage();
              }
            }}
            placeholder="Reply as Thulo Bazaar Team..."
            rows={2}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={onSendMessage}
            disabled={sendingMessage || !newMessage.trim()}
            className="p-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-gray-400">
          Sent as <span className="font-semibold">Thulo Bazaar Team</span> — your name is visible
          only to other editors.
        </p>
      </div>
    </div>
  );
}
