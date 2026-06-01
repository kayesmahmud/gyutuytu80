export interface ReportedUser {
  reportId: number;
  reportedUserId: number;
  reportedUserName: string;
  reportedUserEmail: string;
  reportedUserAvatar: string | null;
  reportedUserShopSlug: string | null;
  reportedUserActive: boolean;
  reason: string;
  description: string;
  status: string;
  conversationId: number | null;
  adminNotes?: string;
  reportedAt: string;
  reporterId: number;
  reporterName: string;
  reporterEmail: string;
}

export type TabStatus = 'pending' | 'resolved' | 'dismissed';

export const TABS: { id: TabStatus; label: string; icon: string; color: string }[] = [
  { id: 'pending', label: 'Pending Review', icon: '👤', color: 'orange' },
  { id: 'resolved', label: 'Suspended Users', icon: '🚫', color: 'red' },
  { id: 'dismissed', label: 'Dismissed', icon: '✅', color: 'gray' },
];

export const REASON_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  spam: { label: 'Spam', icon: '📢', color: 'yellow' },
  scam: { label: 'Scam/Fraud', icon: '⚠️', color: 'red' },
  harassment: { label: 'Harassment', icon: '🚫', color: 'purple' },
  inappropriate: { label: 'Inappropriate', icon: '🔞', color: 'orange' },
  impersonation: { label: 'Impersonation', icon: '🎭', color: 'blue' },
  other: { label: 'Other', icon: '📝', color: 'gray' },
};

export interface TabCounts {
  pending: number;
  resolved: number;
  dismissed: number;
}
