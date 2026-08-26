'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { checkProfanity } from '@/utils/profanityCheck';
import { useTeamInboxSocket, type TeamInboxSocketMessage } from '@/hooks/useTeamInboxSocket';
import type { TeamConversation, TeamConversationDetail } from './types';

// Polling fallback so the list stays fresh even if the socket is down
const LIST_POLL_MS = 15000;

export function useTeamInboxPage(lang: string) {
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();
  const token = (staff as { backendToken?: string } | null)?.backendToken;

  const [conversations, setConversations] = useState<TeamConversation[]>([]);
  const [selected, setSelected] = useState<TeamConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [profanityWarning, setProfanityWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Latest selection for socket callbacks without re-subscribing
  const selectedRef = useRef<TeamConversationDetail | null>(null);
  selectedRef.current = selected;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      // block:'nearest' keeps the scroll inside the messages pane — the default
      // ('start') also scrolls the page itself down to the composer.
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'nearest' });
    }, 100);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/editor/login`);
  }, [logout, router, lang]);

  // Auth check
  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${lang}/editor/login`);
    }
  }, [authLoading, staff, isEditor, lang, router]);

  const loadConversations = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!token) return;
      try {
        if (!opts?.silent) setLoading(true);
        const response = await fetch('/api/editor/team-inbox/conversations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setConversations(data.data);
        } else {
          setError(data.message);
        }
      } catch {
        if (!opts?.silent) setError('Failed to load conversations');
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [token]
  );

  const loadConversationDetail = useCallback(
    async (conversationId: number, opts?: { silent?: boolean }) => {
      if (!token) return;
      try {
        const response = await fetch(`/api/editor/team-inbox/conversations/${conversationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setSelected(data.data);
          // Opening marks the thread read for the whole team — reflect that locally
          setConversations((prev) =>
            prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
          );
          scrollToBottom(opts?.silent ? 'auto' : 'smooth');
        } else {
          setError(data.message);
        }
      } catch {
        setError('Failed to load conversation');
      }
    },
    [token, scrollToBottom]
  );

  // Initial list load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Deep link: /editor/team-inbox?conversation=ID (used by "Message Seller")
  const openedFromUrl = useRef(false);
  useEffect(() => {
    if (!token || openedFromUrl.current) return;
    openedFromUrl.current = true;
    const param = new URLSearchParams(window.location.search).get('conversation');
    const conversationId = param ? parseInt(param, 10) : NaN;
    if (!isNaN(conversationId)) {
      loadConversationDetail(conversationId);
    }
  }, [token, loadConversationDetail]);

  // Polling fallback
  useEffect(() => {
    if (!token) return;
    const timer = setInterval(() => loadConversations({ silent: true }), LIST_POLL_MS);
    return () => clearInterval(timer);
  }, [token, loadConversations]);

  // Real-time: any message in any team thread (user replies AND other editors'
  // sends). Re-pull the open thread (also refreshes shared read state) and the list.
  const { isConnected } = useTeamInboxSocket({
    token: token || null,
    onMessageNew: (message: TeamInboxSocketMessage) => {
      const open = selectedRef.current;
      if (open && message?.conversationId === open.id) {
        loadConversationDetail(open.id, { silent: true });
      }
      loadConversations({ silent: true });
    },
  });

  const handleSelectConversation = (conversation: TeamConversation) => {
    loadConversationDetail(conversation.id);
  };

  // Mobile master-detail: clear the open conversation to return to the list
  const handleBackToList = () => {
    setSelected(null);
  };

  const handleSendMessage = async () => {
    const content = newMessage.trim();
    if (!content || !selected || !token) return;

    const { hasProfanity } = checkProfanity(content);
    if (hasProfanity) {
      setProfanityWarning(
        'Please use respectful language. Offensive words are not allowed on Thulo Bazaar.'
      );
      setTimeout(() => setProfanityWarning(null), 5000);
      return;
    }
    setProfanityWarning(null);

    try {
      setSendingMessage(true);
      const response = await fetch(`/api/editor/team-inbox/conversations/${selected.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (data.success) {
        setSelected((prev) => {
          if (!prev) return prev;
          if (prev.messages.some((m) => m.id === data.data.id)) return prev;
          return { ...prev, messages: [...prev.messages, data.data] };
        });
        setNewMessage('');
        scrollToBottom();
        loadConversations({ silent: true });
      } else {
        setError(data.message);
      }
    } catch {
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      c.user?.fullName?.toLowerCase().includes(search) ||
      c.user?.email?.toLowerCase().includes(search) ||
      c.ad?.title?.toLowerCase().includes(search)
    );
  });

  return {
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
  };
}
