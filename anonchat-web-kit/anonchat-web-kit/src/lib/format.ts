import { format, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Format relative or short time for chat lists and messages
 */
export function formatMessageTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'HH:mm');
  } catch {
    return '';
  }
}

/**
 * Format date for conversation list preview
 */
export function formatConversationDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMM d');
  } catch {
    return '';
  }
}

/**
 * Format date separator for message stream
 */
export function formatDateSeparator(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return 'Today';
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMMM d, yyyy');
  } catch {
    return dateString;
  }
}

/**
 * Extract display initials/digits from Anonymous_<N> username
 */
export function getAnonInitials(anonUsername?: string): string {
  if (!anonUsername) return '??';
  const parts = anonUsername.split('_');
  if (parts.length > 1 && parts[1]) {
    // Return first 2 characters of digits, or full if short
    return parts[1].slice(0, 2);
  }
  return anonUsername.slice(0, 2).toUpperCase();
}

/**
 * Mask email for privacy on profile view: e.g. "alexander@gmail.com" -> "a***@gmail.com"
 */
export function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return '******';
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user[0]}*@${domain}`;
  }
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}
