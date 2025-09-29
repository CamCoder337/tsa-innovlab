export interface Message {
  id: string;
  missionId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export interface ChatRoom {
  id: string;
  missionId: string;
  participants: {
    avatar: string;
    id: string;
    name: string;
    role: 'affreteur' | 'transporteur';
  }[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
}

export interface SendMessageDto {
  missionId: string;
  content: string;
}

export interface MarkAsReadDto {
  messageIds: string[];
}
