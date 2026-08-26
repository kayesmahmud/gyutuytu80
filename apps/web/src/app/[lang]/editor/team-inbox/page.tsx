'use client';

import { use } from 'react';
import { DashboardLayout } from '@/components/admin';
import { getEditorNavSections } from '@/lib/navigation';
import { useTeamInboxPage, ConversationsList, TeamChatArea } from './components';

export default function TeamInboxPage({
  params: paramsPromise,
}: {
  params: Promise<{ lang: string }>;
}) {
  const params = use(paramsPromise);

  const {
    staff,
    authLoading,
    handleLogout,
    filteredConversations,
    selected,
    loading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    newMessage,
    setNewMessage,
    sendingMessage,
    isConnected,
    messagesEndRef,
    profanityWarning,
    setProfanityWarning,
    handleSelectConversation,
    handleBackToList,
    handleSendMessage,
  } = useTeamInboxPage(params.lang);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-4xl text-white">📨</span>
          </div>
          <div className="text-lg font-semibold text-gray-700">Loading team inbox...</div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName || 'Editor User'}
      userEmail={staff?.email || 'editor@thulobazaar.com.np'}
      navSections={getEditorNavSections(params.lang)}
      theme="editor"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* On mobile, an open conversation takes over the screen (same
            master-detail pattern as Support Chat). */}
        <div className={`${selected ? 'hidden lg:block' : ''}`}>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Team Inbox</h1>
          <p className="text-gray-600 mt-1">
            All conversations with users, sent as Thulo Bazaar Team — shared across every editor
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-1 ${selected ? 'hidden lg:block' : ''}`}>
            <ConversationsList
              conversations={filteredConversations}
              selectedId={selected?.id ?? null}
              loading={loading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onSelect={handleSelectConversation}
            />
          </div>

          <div className={`lg:col-span-2 ${selected ? '' : 'hidden lg:block'}`}>
            <TeamChatArea
              conversation={selected}
              isConnected={isConnected}
              messagesEndRef={messagesEndRef}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              sendingMessage={sendingMessage}
              profanityWarning={profanityWarning}
              onDismissProfanityWarning={() => setProfanityWarning(null)}
              onSendMessage={handleSendMessage}
              onBack={handleBackToList}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
