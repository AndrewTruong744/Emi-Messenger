export interface User {
  id: string,
  online: boolean,
  username: string,
  email: string,
  sub: string,
};

export interface Conversation {
  isGroup: boolean,
  online: boolean,
  recentMessage: string | null,
  timeStamp: string,
  participants: string[],
  participantNames?: string[],
  id: string,
  name: string,
}

export interface Message {
  id: string,
  sent: string,
  content: string,
  senderId: string,
  conversationId: string
}