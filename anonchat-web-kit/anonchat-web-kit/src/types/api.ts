/**
 * API Contract Types — Anonymous Community Chat
 * Matches docs/API_CONTRACT.md 1:1
 */

export type Gender = 'male' | 'female';
export type UserRole = 'user' | 'admin';
export type UserTheme = 'system' | 'light' | 'dark';
export type UserStatus = 'active' | 'suspended' | 'banned' | 'unverified';
export type ConversationStatus = 'active' | 'ended';
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'impersonation' | 'other';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  error: ApiError;
}

/**
 * Public user object (what other users may see)
 * NEVER add email, fullName, lastSeen, or createdAt here.
 */
export interface PublicMember {
  id: string;
  anonUsername: string;
  gender: Gender;
  avatarColor: string;
  isOnline: boolean;
  blockedByMe: boolean;
}

/**
 * Own user object
 */
export interface Me {
  id: string;
  anonUsername: string;
  fullName: string;
  email: string;
  gender: Gender;
  avatarColor: string;
  role: UserRole;
  theme: UserTheme;
  createdAt: string;
}

/**
 * Conversation item
 */
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
  status: ConversationStatus;
  endedByMe: boolean;
  updatedAt: string;
}

/**
 * Message object
 */
export interface Message {
  id: string;
  conversationId: string;
  mine: boolean;
  body: string;
  createdAt: string;
  readAt: string | null;
  clientMsgId?: string;
}

/**
 * Paginated list format
 */
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * Auth Responses
 */
export interface RegisterResponse {
  message: string;
  email: string;
}

export interface AuthSuccessResponse {
  accessToken: string;
  user: Me;
  refreshToken?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface MessageResponse {
  message: string;
}

export interface UnreadCountResponse {
  total: number;
}

/**
 * Admin types
 */
export interface AdminUser {
  id: string;
  anonUsername: string;
  email: string;
  gender: Gender;
  status: UserStatus;
  role: UserRole;
  isOnline: boolean;
  reportCount: number;
  createdAt: string;
  lastSeenAt: string | null;
  suspendedUntil: string | null;
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

export interface ReportItem {
  id: string;
  reporterId: string;
  reportedUserId: string;
  conversationId?: string | null;
  reason: ReportReason;
  details?: string | null;
  status: ReportStatus;
  resolutionNote?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  reporterAnonName?: string;
  reportedAnonName?: string;
}

export interface ReportDetail extends ReportItem {
  snapshotMessages?: Message[];
}

export interface AdminActivityItem {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

/**
 * Socket.IO event payloads
 */
export interface SocketNewMessagePayload {
  message: Message;
  conversation: Conversation;
}

export interface SocketMessageReadPayload {
  conversationId: string;
  readAt: string;
}

export interface SocketTypingPayload {
  conversationId: string;
  isTyping: boolean;
}

export interface SocketPresencePayload {
  memberId: string;
  isOnline: boolean;
}

export interface SocketConversationEndedPayload {
  conversationId: string;
}

export interface SocketForceLogoutPayload {
  reason: 'suspended' | 'banned' | 'password-changed';
}
