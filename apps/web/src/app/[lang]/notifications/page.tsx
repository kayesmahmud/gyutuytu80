'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { apiClient } from '@/lib/api';
import type { AppNotification } from '@thulobazaar/types';
import {
  Bell,
  BellOff,
  CheckCircle,
  XCircle,
  ShieldCheck,
  ShieldOff,
  CreditCard,
  MessageCircle,
  MessageSquare,
  TrendingDown,
  Clock,
  PartyPopper,
  Megaphone,
  ArrowLeft,
  Trash2,
  CheckCheck,
  Loader2,
  Rocket,
  Timer,
  MailWarning,
  Bookmark,
  Sparkles,
  HeartOff,
  Eye,
  MapPin,
  TrendingUp,
  Tag,
  Reply,
} from 'lucide-react';

const ICON_MAP: Record<string, typeof Bell> = {
  ad_approved: CheckCircle,
  ad_rejected: XCircle,
  ad_suspended: XCircle,
  ad_unsuspended: CheckCircle,
  verification_approved: ShieldCheck,
  verification_rejected: ShieldOff,
  payment_confirmed: CreditCard,
  new_message: MessageCircle,
  new_inquiry: MessageSquare,
  price_drop: TrendingDown,
  ad_expiring: Clock,
  ad_expired: Clock,
  verification_expiring: Clock,
  verification_expired: Clock,
  promotion_started: Rocket,
  promotion_expiring: Timer,
  promotion_expired: Timer,
  unread_messages_reminder: MailWarning,
  abandoned_bookmark: Bookmark,
  weekly_bookmarks: Bookmark,
  win_back: Sparkles,
  favorite_removed: HeartOff,
  ad_views_milestone: Eye,
  viewed_not_acted: Eye,
  new_ad_area: MapPin,
  trending_area: TrendingUp,
  nearby_seller: MapPin,
  better_deal_nearby: Tag,
  inquiry_reply: Reply,
  welcome: PartyPopper,
  announcement: Megaphone,
};

const COLOR_MAP: Record<string, string> = {
  ad_approved: 'text-emerald-500 bg-emerald-50',
  verification_approved: 'text-emerald-500 bg-emerald-50',
  payment_confirmed: 'text-emerald-500 bg-emerald-50',
  promotion_started: 'text-emerald-500 bg-emerald-50',
  ad_rejected: 'text-red-500 bg-red-50',
  ad_suspended: 'text-red-500 bg-red-50',
  ad_unsuspended: 'text-emerald-500 bg-emerald-50',
  verification_rejected: 'text-red-500 bg-red-50',
  favorite_removed: 'text-red-500 bg-red-50',
  new_message: 'text-blue-500 bg-blue-50',
  new_inquiry: 'text-blue-500 bg-blue-50',
  unread_messages_reminder: 'text-blue-500 bg-blue-50',
  price_drop: 'text-emerald-500 bg-emerald-50',
  ad_expiring: 'text-amber-500 bg-amber-50',
  ad_expired: 'text-amber-500 bg-amber-50',
  verification_expiring: 'text-amber-500 bg-amber-50',
  verification_expired: 'text-amber-500 bg-amber-50',
  promotion_expiring: 'text-amber-500 bg-amber-50',
  promotion_expired: 'text-amber-500 bg-amber-50',
  abandoned_bookmark: 'text-purple-500 bg-purple-50',
  weekly_bookmarks: 'text-purple-500 bg-purple-50',
  win_back: 'text-purple-500 bg-purple-50',
  ad_views_milestone: 'text-blue-500 bg-blue-50',
  inquiry_reply: 'text-blue-500 bg-blue-50',
  viewed_not_acted: 'text-amber-500 bg-amber-50',
  new_ad_area: 'text-teal-500 bg-teal-50',
  nearby_seller: 'text-teal-500 bg-teal-50',
  trending_area: 'text-orange-500 bg-orange-50',
  better_deal_nearby: 'text-emerald-500 bg-emerald-50',
  welcome: 'text-purple-500 bg-purple-50',
  announcement: 'text-purple-500 bg-purple-50',
};

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'en';
  const { isAuthenticated } = useUserAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const observerRef = useRef<HTMLDivElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${lang}/auth/signin`);
    }
  }, [isAuthenticated, router, lang]);

  const fetchNotifications = useCallback(async (pageNum: number, refresh = false) => {
    try {
      setIsLoading(true);
      const response = await apiClient.getNotifications(pageNum, 20);
      if (response.success && response.data) {
        const items = response.data.data;
        if (refresh) {
          setNotifications(items);
        } else {
          setNotifications(prev => [...prev, ...items]);
        }
        setHasMore(items.length === 20);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await apiClient.getUnreadNotificationCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(1, true);
      fetchUnreadCount();
    }
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

  // Infinite scroll
  useEffect(() => {
    if (!observerRef.current || !hasMore || isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchNotifications(nextPage);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, page, fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await apiClient.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: number) => {
    const wasUnread = notifications.find(n => n.id === id && !n.isRead);
    try {
      await apiClient.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    const data = notification.data as Record<string, string> | null;
    const route = data?.route;
    const adId = data?.adId;

    if (route === '/ad' && adId) {
      router.push(`/${lang}/ad/${adId}`);
    } else if (route === '/verification') {
      router.push(`/${lang}/verification`);
    } else if (route === '/promotion') {
      router.push(`/${lang}/dashboard`);
    } else if (route === '/chat') {
      const conversationId = data?.conversationId;
      if (conversationId) {
        router.push(`/${lang}/messages?conversation=${conversationId}`);
      }
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-xs font-semibold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BellOff className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No notifications yet</p>
            <p className="text-gray-400 text-sm mt-1">
              We&apos;ll notify you when something happens
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {notifications.map((notification) => {
              const IconComponent = ICON_MAP[notification.type] || Bell;
              const colorClass = COLOR_MAP[notification.type] || 'text-gray-500 bg-gray-50';

              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors group ${
                    !notification.isRead ? 'bg-blue-50/40' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'} text-gray-900 leading-snug`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimestamp(notification.createdAt)}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more trigger */}
        {hasMore && notifications.length > 0 && (
          <div ref={observerRef} className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}
