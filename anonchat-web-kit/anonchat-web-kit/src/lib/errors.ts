import axios from 'axios';
import type { ApiErrorResponse } from '@/types/api';

export const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Invalid input. Please check the fields and try again.',
  UNAUTHENTICATED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  ACCOUNT_SUSPENDED: 'Your account has been suspended.',
  ACCOUNT_BANNED: 'Your account has been permanently banned.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address to continue.',
  USER_BLOCKED: 'You cannot communicate with this member.',
  NOT_FOUND: 'The requested resource was not found.',
  CONFLICT: 'A conflict occurred with this request.',
  CONVERSATION_ENDED: 'This conversation has ended. No new messages can be sent.',
  RATE_LIMITED: 'Too many requests. Please slow down and try again shortly.',
  DUPLICATE_MESSAGE: 'Duplicate message detected. Please wait before re-sending.',
  INTERNAL: 'A server error occurred. Please try again later.',
};

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.error?.code && ERROR_MESSAGES[data.error.code]) {
      // If server provided custom message, prefer it or code mapping
      return data.error.message || ERROR_MESSAGES[data.error.code];
    }
    if (data?.error?.message) {
      return data.error.message;
    }
    if (error.response?.status === 429) {
      return ERROR_MESSAGES.RATE_LIMITED;
    }
    if (error.response?.status === 404) {
      return ERROR_MESSAGES.NOT_FOUND;
    }
    if (error.response?.status === 403) {
      return ERROR_MESSAGES.FORBIDDEN;
    }
    if (error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
      return 'Network error. Please check your internet connection.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
