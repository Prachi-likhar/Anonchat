import { AxiosError } from 'axios';
import { ApiErrorResponse } from '../types/api';

export const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHENTICATED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  ACCOUNT_SUSPENDED: 'Your account is currently suspended.',
  ACCOUNT_BANNED: 'Your account has been permanently banned.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address to continue.',
  USER_BLOCKED: 'You cannot interact with this member because of a block.',
  NOT_FOUND: 'The requested resource was not found.',
  CONFLICT: 'A conflict occurred. Please refresh and try again.',
  CONVERSATION_ENDED: 'This conversation has ended. No new messages can be sent.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  DUPLICATE_MESSAGE: 'You sent the same message too quickly. Please wait.',
  INTERNAL: 'A server error occurred. Please try again later.',
  NETWORK_ERROR: 'Unable to connect to the server. Please check your connection.',
};

export function getErrorCode(error: unknown): string | null {
  if (isAxiosErrorWithApiPayload(error)) {
    return error.response?.data?.error?.code || null;
  }
  return null;
}

export function getErrorDetails(error: unknown): Record<string, unknown> | undefined {
  if (isAxiosErrorWithApiPayload(error)) {
    return error.response?.data?.error?.details;
  }
  return undefined;
}

export function formatErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback;

  if (isAxiosErrorWithApiPayload(error)) {
    const code = error.response?.data?.error?.code;
    const customMessage = error.response?.data?.error?.message;
    const details = error.response?.data?.error?.details;

    if (code === 'ACCOUNT_SUSPENDED' && details?.until) {
      const untilDate = new Date(details.until as string).toLocaleString();
      const reason = details.reason ? ` Reason: ${details.reason}` : '';
      return `Your account is suspended until ${untilDate}.${reason}`;
    }

    if (code === 'ACCOUNT_BANNED' && details?.reason) {
      return `Your account has been permanently banned. Reason: ${details.reason}`;
    }

    if (code && ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code];
    }

    if (customMessage) {
      return customMessage;
    }
  }

  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return 'The request timed out. Please check your internet connection.';
    }
    if (!error.response) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function isAxiosErrorWithApiPayload(error: unknown): error is AxiosError<ApiErrorResponse> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    Boolean((error as AxiosError).isAxiosError) &&
    typeof (error as AxiosError).response?.data === 'object' &&
    (error as AxiosError).response?.data !== null &&
    'error' in ((error as AxiosError).response?.data as object)
  );
}
