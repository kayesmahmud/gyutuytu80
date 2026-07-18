'use client';

import { useSession } from 'next-auth/react';
import { useBackendToken } from '@/hooks/useBackendToken';
import ConversationList from '../ConversationList';
import ChatWindow from '../ChatWindow';
import { useMessagesPageState } from './useMessagesPageState';
import { EmptyState } from './EmptyState';
import { ErrorToast } from './ErrorToast';
import { NotLoggedInState, TokenLoadingState, TokenErrorState } from './LoadingStates';

export default function MessagesPage() {
  const { data: session } = useSession();
  const { backendToken, loading: tokenLoading, error: tokenError } = useBackendToken();

  const currentUserId = session?.user?.id ? parseInt(session.user.id) : undefined;

  const {
    conversations,
    selectedConversation,
    loading,
    error,
    conversationMessages,
    connected,
    socketError,
    typingUsers,
    handleSelectConversation,
    handleSendMessage,
    clearSelectedConversation,
    clearError,
    startTyping,
    stopTyping,
  } = useMessagesPageState({ token: backendToken, currentUserId });

  // Auth states
  if (!session) {
    return <NotLoggedInState />;
  }

  if (tokenLoading) {
    return <TokenLoadingState />;
  }

  if (tokenError || (!backendToken && !tokenLoading)) {
    return <TokenErrorState error={tokenError} />;
  }

  const isRealtimeConfigured = typeof window !== 'undefined' && !!(process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_HOSTNAME);

  return (
    <div className="relative flex h-full bg-gray-50 overflow-hidden">
      {/* Connection status */}
      {isRealtimeConfigured && !connected && socketError && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-300 px-4 py-2 text-sm text-yellow-800 text-center z-50">
          Reconnecting... Messages will update automatically.
        </div>
      )}

      {/* Sidebar */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'
        } w-full md:w-2/5 lg:w-1/3 xl:w-1/4 border-r border-gray-200 bg-white flex-shrink-0 flex-col`}>
        <div className="flex-1 overflow-hidden">
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            loading={loading}
            currentUserId={currentUserId}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'
        } flex-1 flex-col min-w-0`}>
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={conversationMessages}
            typingUsers={typingUsers}
            onSendMessage={handleSendMessage}
            onStartTyping={() => startTyping(selectedConversation.id)}
            onStopTyping={() => stopTyping(selectedConversation.id)}
            connected={connected}
            currentUserId={currentUserId}
            onBack={clearSelectedConversation}
            token={backendToken || undefined}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Error Toast */}
      {error && <ErrorToast error={error} onClose={clearError} />}
    </div>
  );
}
