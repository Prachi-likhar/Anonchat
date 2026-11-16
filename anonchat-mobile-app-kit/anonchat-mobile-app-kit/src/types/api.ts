export type Gender = 'male' | 'female';
export type Role = 'user' | 'admin';
export type Theme = 'system' | 'light' | 'dark';

export interface PublicMember {
  id: string;
  anonUsername: string;
  gender: Gender;
  avatarColor: string;
  isOnline: boolean;
  blockedByMe?: boolean;
}

export interface Me {
  id: string;
  anonUsername: string;
  fullName: string;
  email: string;
  gender: Gender;
  avatarColor: string;
  role: Role;
  theme: Theme;
  createdAt: string;
}

export interface ConversationLastMessage {
  id: string;
  body: string;
  createdAt: string;
  mine: boolean;
}

export interface Conversation {
  id: string;
  other: PublicMember;
  lastMessage: ConversationLastMessage | null;
  unreadCount: number;
  status: 'active' | 'ended';
  endedByMe: boolean;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  mine: boolean;
  body: string;
  createdAt: string;
  readAt: string | null;
  clientMsgId?: string;
  senderId?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: {
    until?: string;
    reason?: string;
    retryAfter?: number;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export interface AdminStats {
  totalUsers: number;
  male: number;
  female: number;
  onlineNow: number;
  newToday: number;
  new7d: number;
  suspended: number;
  banned: number;
  openReports: number;
  messagesToday: number;
  conversationsActive: number;
}

export interface AdminUser {
  id: string;
  anonUsername: string;
  email: string;
  gender: Gender;
  status: 'active' | 'suspended' | 'banned' | 'unverified';
  role: Role;
  isOnline: boolean;
  reportCount: number;
  createdAt: string;
  lastSeenAt: string;
  suspendedUntil: string | null;
}

export interface AdminReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reporterAnon: string;
  reportedAnon: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'impersonation' | 'other';
  details: string | null;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  snapshot?: {
    messages: Message[];
  };
}

export interface AdminAuditEntry {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}
