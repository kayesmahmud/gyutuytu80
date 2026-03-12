'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { User, CheckCircle, XCircle, Calendar, ExternalLink } from 'lucide-react';
import {
  useSupportClient,
  TicketsList,
  TicketChat,
  NewTicketModal,
} from './components';

export default function SupportClient() {
  const router = useRouter();
  const t = useTranslations('support');
  const {
    sessionStatus,
    tokenLoading,
    hasSession,
    tickets,
    selectedTicket,
    loading,
    error,
    setError,
    showNewTicketForm,
    setShowNewTicketForm,
    newTicket,
    setNewTicket,
    submitting,
    messageInput,
    sendingMessage,
    isOtherTyping,
    typingUser,
    isConnected,
    messagesEndRef,
    loadTicketDetail,
    setSelectedTicket,
    handleCreateTicket,
    handleSendMessage,
    handleInputChange,
    handleFileUpload,
    sendingFile,
    isInternal,
    setIsInternal,
    macros,
    handleSubmitCsat,
  } = useSupportClient();

  // Auth check
  if (sessionStatus === 'loading' || tokenLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('pleaseSignIn')}</h1>
          <p className="text-gray-600 mb-6">{t('signInRequired')}</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            {t('signIn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('supportCenter')}</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">{t('supportSubtitle')}</p>
          </div>
          <button
            onClick={() => setShowNewTicketForm(true)}
            className="mt-3 md:mt-0 bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('newSupportRequest')}
          </button>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Tickets List */}
          <TicketsList
            tickets={tickets}
            selectedTicket={selectedTicket}
            loading={loading}
            onSelectTicket={loadTicketDetail}
          />

          {/* Chat Window */}
          <div className={`${!selectedTicket ? 'hidden lg:flex' : 'flex'} flex-1 flex-col bg-white rounded-lg shadow`}>
            <TicketChat
              selectedTicket={selectedTicket}
              isConnected={isConnected}
              isOtherTyping={isOtherTyping}
              typingUser={typingUser}
              messageInput={messageInput}
              sendingMessage={sendingMessage}
              messagesEndRef={messagesEndRef}
              onClose={() => setSelectedTicket(null)}
              onInputChange={handleInputChange}
              onSendMessage={handleSendMessage}
              onFileUpload={handleFileUpload}
              sendingFile={sendingFile}
              isInternal={isInternal}
              setIsInternal={setIsInternal}
              macros={macros}
              onSubmitCsat={(score, comment) => handleSubmitCsat(selectedTicket!.id, score, comment)}
            />
          </div>

          {/* User Context Sidebar (Staff Only) */}
          {selectedTicket?.userContext && (
            <div className="hidden xl:flex w-80 flex-col bg-white rounded-lg shadow overflow-hidden border border-gray-100">
              <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
                <User size={18} className="text-gray-500" />
                <h3 className="font-semibold text-gray-800">User Context</h3>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Profile</h4>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-900">{selectedTicket.userContext.fullName}</p>
                    <p className="text-gray-600 truncate">{selectedTicket.userContext.email}</p>
                    {selectedTicket.userContext.phone && <p className="text-gray-600">{selectedTicket.userContext.phone}</p>}
                    <p className="text-gray-500 flex items-center gap-1.5 mt-2">
                      <Calendar size={14} /> Joined {format(new Date(selectedTicket.userContext.joinedAt), 'MMM yyyy')}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Verification</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {selectedTicket.userContext.identityVerified ? 
                        <CheckCircle size={16} className="text-green-500" /> : 
                        <XCircle size={16} className="text-gray-300" />}
                      <span className={selectedTicket.userContext.identityVerified ? 'text-gray-900' : 'text-gray-500'}>Identity Verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedTicket.userContext.businessVerified ? 
                        <CheckCircle size={16} className="text-green-500" /> : 
                        <XCircle size={16} className="text-gray-300" />}
                      <span className={selectedTicket.userContext.businessVerified ? 'text-gray-900' : 'text-gray-500'}>Business Verified</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Recent Ads ({selectedTicket.userContext.activeAds.length})</h4>
                  {selectedTicket.userContext.activeAds.length > 0 ? (
                    <ul className="space-y-3">
                      {selectedTicket.userContext.activeAds.map(ad => (
                        <li key={ad.id} className="text-sm border rounded p-2 hover:bg-gray-50">
                          <a href={`/ads/${ad.id}`} target="_blank" rel="noreferrer" className="group block">
                            <p className="font-medium text-blue-600 group-hover:underline line-clamp-1">{ad.title}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-gray-600 font-semibold">${ad.price}</span>
                              <ExternalLink size={12} className="text-gray-400 group-hover:text-blue-500" />
                            </div>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No active ads.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      <NewTicketModal
        show={showNewTicketForm}
        newTicket={newTicket}
        setNewTicket={setNewTicket}
        submitting={submitting}
        onClose={() => setShowNewTicketForm(false)}
        onSubmit={handleCreateTicket}
      />
    </div>
  );
}
