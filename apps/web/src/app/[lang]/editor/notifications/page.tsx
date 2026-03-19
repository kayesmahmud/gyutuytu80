'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Send,
  Calendar,
  Trash2,
  Edit3,
  Users,
  Building2,
  User,
  Clock,
  CheckCircle,
  Loader2,
  X,
  Plus,
} from 'lucide-react';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getEditorNavSections } from '@/lib/navigation';
import {
  broadcastNotification,
  scheduleNotification,
  getScheduledNotifications,
  updateScheduledNotification,
  deleteScheduledNotification,
  type ScheduledNotification,
} from '@/lib/editorApi';

type TabType = 'broadcast' | 'scheduled';
type AudienceType = 'all' | 'business' | 'individual';

export default function NotificationsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, logout } = useStaffAuth();

  const [activeTab, setActiveTab] = useState<TabType>('broadcast');
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Broadcast form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<AudienceType>('all');

  // Schedule form state
  const [schedTitle, setSchedTitle] = useState('');
  const [schedBody, setSchedBody] = useState('');
  const [schedAudience, setSchedAudience] = useState<AudienceType>('all');
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');

  // Scheduled list
  const [scheduled, setScheduled] = useState<ScheduledNotification[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);

  // Edit modal
  const [editItem, setEditItem] = useState<ScheduledNotification | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  const loadScheduled = useCallback(async () => {
    setLoadingScheduled(true);
    try {
      const res = await getScheduledNotifications();
      if (res.success) setScheduled(res.data);
    } catch {
      console.error('Failed to load scheduled notifications');
    } finally {
      setLoadingScheduled(false);
    }
  }, []);

  useEffect(() => {
    if (staff && activeTab === 'scheduled') {
      loadScheduled();
    }
  }, [staff, activeTab, loadScheduled]);

  const clearMessages = () => {
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleBroadcast = async () => {
    if (!title.trim() || !body.trim()) {
      setErrorMsg('Title and body are required');
      return;
    }
    clearMessages();
    setSending(true);
    try {
      const res = await broadcastNotification({
        title: title.trim(),
        body: body.trim(),
        type: 'announcement',
        targetAudience: audience,
      });
      setSuccessMsg(`Sent to ${res.recipientCount} users`);
      setTitle('');
      setBody('');
      setAudience('all');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleSchedule = async () => {
    if (!schedTitle.trim() || !schedBody.trim() || !schedDate || !schedTime) {
      setErrorMsg('All fields are required');
      return;
    }
    const scheduledFor = new Date(`${schedDate}T${schedTime}`).toISOString();
    if (new Date(scheduledFor) <= new Date()) {
      setErrorMsg('Scheduled time must be in the future');
      return;
    }
    clearMessages();
    setSending(true);
    try {
      await scheduleNotification({
        title: schedTitle.trim(),
        body: schedBody.trim(),
        type: 'announcement',
        targetAudience: schedAudience,
        scheduledFor,
      });
      setSuccessMsg('Notification scheduled');
      setSchedTitle('');
      setSchedBody('');
      setSchedAudience('all');
      setSchedDate('');
      setSchedTime('');
      loadScheduled();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to schedule');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this scheduled notification?')) return;
    try {
      await deleteScheduledNotification(id);
      setScheduled(prev => prev.filter(s => s.id !== id));
      setSuccessMsg('Deleted');
    } catch {
      setErrorMsg('Failed to delete');
    }
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    try {
      await updateScheduledNotification(editItem.id, {
        title: editTitle.trim(),
        body: editBody.trim(),
      });
      setEditItem(null);
      setSuccessMsg('Updated');
      loadScheduled();
    } catch {
      setErrorMsg('Failed to update');
    }
  };

  const openEdit = (item: ScheduledNotification) => {
    setEditItem(item);
    setEditTitle(item.title);
    setEditBody(item.body);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const audienceOptions: { value: AudienceType; label: string; icon: typeof Users }[] = [
    { value: 'all', label: 'All Users', icon: Users },
    { value: 'business', label: 'Business Only', icon: Building2 },
    { value: 'individual', label: 'Individual Only', icon: User },
  ];

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName || 'Editor'}
      userEmail={staff?.email || ''}
      navSections={getEditorNavSections(params.lang)}
      theme="editor"
      onLogout={handleLogout}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-600" />
            Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">Send announcements to users or schedule for later</p>
        </div>

        {/* Success/Error messages */}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center justify-between">
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" />{successMsg}</span>
            <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4" /></button>
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-6">
          <button
            onClick={() => { setActiveTab('broadcast'); clearMessages(); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'broadcast'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Send className="w-4 h-4" />
            Send Now
          </button>
          <button
            onClick={() => { setActiveTab('scheduled'); clearMessages(); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'scheduled'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Schedule
          </button>
        </div>

        {/* Broadcast Tab */}
        {activeTab === 'broadcast' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Broadcast</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. System Maintenance Tonight"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  maxLength={255}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Write your notification message..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <div className="flex gap-2">
                  {audienceOptions.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setAudience(opt.value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          audience === opt.value
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleBroadcast}
                disabled={sending || !title.trim() || !body.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Sending...' : 'Send to All Users'}
              </button>
            </div>
          </div>
        )}

        {/* Scheduled Tab */}
        {activeTab === 'scheduled' && (
          <div className="space-y-6">
            {/* Create new scheduled notification */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Schedule New Notification
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={schedTitle}
                    onChange={e => setSchedTitle(e.target.value)}
                    placeholder="Notification title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    maxLength={255}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={schedBody}
                    onChange={e => setSchedBody(e.target.value)}
                    placeholder="Write your message..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={schedDate}
                      onChange={e => setSchedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      value={schedTime}
                      onChange={e => setSchedTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                  <div className="flex gap-2">
                    {audienceOptions.map(opt => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setSchedAudience(opt.value)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                            schedAudience === opt.value
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleSchedule}
                  disabled={sending || !schedTitle.trim() || !schedBody.trim() || !schedDate || !schedTime}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                  {sending ? 'Scheduling...' : 'Schedule Notification'}
                </button>
              </div>
            </div>

            {/* Scheduled list */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Scheduled Notifications</h2>
              </div>

              {loadingScheduled ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                </div>
              ) : scheduled.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">
                  No scheduled notifications
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {scheduled.map(item => (
                    <div key={item.id} className="px-6 py-4 flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.status === 'sent'
                          ? 'bg-emerald-50 text-emerald-500'
                          : 'bg-amber-50 text-amber-500'
                      }`}>
                        {item.status === 'sent' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            item.status === 'sent'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{item.body}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>Scheduled: {new Date(item.scheduledFor).toLocaleString()}</span>
                          <span>Audience: {item.targetAudience}</span>
                          {item.recipientCount != null && <span>Sent to: {item.recipientCount}</span>}
                          <span>By: {item.createdBy}</span>
                        </div>
                      </div>

                      {item.status === 'pending' && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Edit Scheduled Notification</h3>
              <button onClick={() => setEditItem(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setEditItem(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
