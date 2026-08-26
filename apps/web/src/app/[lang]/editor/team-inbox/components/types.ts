export interface TeamConversation {
  id: number;
  adId: number | null;
  ad: { id: number; title: string; slug: string } | null;
  user: {
    id: number;
    fullName: string;
    avatar: string | null;
    email: string | null;
  } | null;
  lastMessageAt: string | null;
  unreadCount: number;
  lastMessage: {
    id: number;
    content: string;
    type: string | null;
    fromTeam: boolean;
    createdAt: string | null;
  } | null;
}

export interface TeamMessage {
  id: number;
  content: string;
  type: string | null;
  attachmentUrl: string | null;
  isEdited: boolean | null;
  isDeleted: boolean | null;
  createdAt: string | null;
  fromTeam: boolean;
  /** The staff member who wrote a team message — editor-panel display only */
  sentBy: { id: number; fullName: string } | null;
}

export interface TeamConversationDetail {
  id: number;
  adId: number | null;
  ad: { id: number; title: string; slug: string } | null;
  user: {
    id: number;
    fullName: string;
    avatar: string | null;
    email: string | null;
    phone: string | null;
  };
  messages: TeamMessage[];
}
