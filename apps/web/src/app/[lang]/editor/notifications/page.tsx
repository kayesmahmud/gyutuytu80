'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Megaphone,
  BadgeCheck,
  MessageCircle,
  CheckCheck,
  Trash2,
  Loader2,
  Inbox,
} from 'lucide-react';
import type { AppNotification, NotificationType } from '@thulobazaar/types';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getEditorNavSections } from '@/lib/navigation';
import {
  getInboxNotifications,
  markInboxNotificationRead,
  markAllInboxNotificationsRead,
  deleteInboxNotification,
} from '@/lib/editorApi';

// Per-type visual treatment for the editor's operational alerts.
const TYPE_STYLES: Partial<Record<NotificationType, { icon: typeof Bell; bg: string; fg: string }>> = {
  new_ad_pending: { icon: Megaphone, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  verification_requested: { icon: BadgeCheck, bg: 'bg-blue-50', fg: 'text-blue-600' },
  support_message: { icon: MessageCircle, bg: 'bg-amber-50', fg: 'text-amber-600' },
};

function styleFor(type: NotificationType) {
  return TYPE_STYLES[type] ?? { icon: Bell, bg: 'bg-gray-100', fg: 'text-gray-500' };
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(0, Math.floor((now - then) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsInboxPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, logout } = useStaffAuth();

  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInboxNotifications(1, 50);
      if (res.success) setItems(res.data);
    } catch {
      console.error('[Inbox] Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (staff) load();
  }, [staff, load]);

  const unreadCount = items.filter((n) => !n.isRead).length;

  const handleOpen = async (n: AppNotification) => {
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      markInboxNotificationRead(n.id).catch(() => {});
    }
    const route = (n.data as { route?: string } | null)?.route;
    if (route) router.push(`/${params.lang}${route}`);
  };

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      await markAllInboxNotificationsRead();
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    } catch {
      console.error('[Inbox] Failed to mark all read');
    } finally {
      setMarking(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) => prev.filter((x) => x.id !== id));
    deleteInboxNotification(id).catch(() => {});
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName || 'Editor'}
      userEmail={staff?.email || ''}
      navSections={getEditorNavSections(params.lang)}
      theme="editor"
      onLogout={handleLogout}
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-emerald-600" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-xs font-bold text-white bg-rose-600 rounded-full px-2 py-0.5">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              New pending ads, verification requests, and support messages
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={marking}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
            >
              {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">You&apos;re all caught up</p>
              <p className="text-xs text-gray-400 mt-1">New alerts will appear here and on your phone.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((n) => {
                const { icon: Icon, bg, fg } = styleFor(n.type);
                const route = (n.data as { route?: string } | null)?.route;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleOpen(n)}
                    className={`group flex items-start gap-3 px-4 py-4 transition-colors ${route ? 'cursor-pointer' : ''} ${
                      n.isRead ? 'bg-white hover:bg-gray-50' : 'bg-emerald-50/40 hover:bg-emerald-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${bg} ${fg}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
                        <p className={`text-sm truncate ${n.isRead ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}>
                          {n.title}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-xs text-gray-400 mt-1">{relativeTime(n.createdAt)}</p>
                    </div>

                    <button
                      onClick={(e) => handleDelete(n.id, e)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Delete"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
