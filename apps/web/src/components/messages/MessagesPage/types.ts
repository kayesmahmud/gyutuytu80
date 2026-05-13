export interface MessagesPageState {
  conversations: any[];
  selectedConversation: any | null;
  loading: boolean;
  error: string | null;
  conversationMessages: any[];
}
