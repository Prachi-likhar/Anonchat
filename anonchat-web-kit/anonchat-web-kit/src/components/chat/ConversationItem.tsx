import React from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { formatTimeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Conversation } from '@/types/api';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  isTyping?: boolean;
  onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  isTyping = false,
  onClick,
}) => {
  const { other, lastMessage, unreadCount, status } = conversation;
  const isEnded = status === 'ended';

  const previewText = isTyping
    ? 'Typing...'
    : lastMessage
      ? `${lastMessage.mine ? 'You: ' : ''}${lastMessage.body}`
      : 'No messages yet';

  const timestamp = lastMessage ? formatTimeAgo(lastMessage.createdAt) : formatTimeAgo(conversation.updatedAt);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all duration-150 relative select-none',
        isSelected
          ? 'bg-primary/10 border border-primary/20 shadow-sm'
          : 'hover:bg-surface-2 border border-transparent',
      )}
      aria-selected={isSelected}
    >
      <div className="relative shrink-0">
        <Avatar
          anonUsername={other.anonUsername}
          avatarColor={other.avatarColor}
          size="md"
          showOnlineStatus={true}
          isOnline={other.isOnline}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="font-semibold text-sm text-text truncate">
            {other.anonUsername}
          </span>
          <span className="text-[11px] text-muted shrink-0">{timestamp}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'text-xs truncate',
              isTyping
                ? 'text-primary font-medium italic animate-pulse'
                : unreadCount > 0
                  ? 'text-text font-semibold'
                  : 'text-muted',
            )}
          >
            {previewText}
          </p>

          <div className="flex items-center gap-1.5 shrink-0">
            {isEnded && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/20 text-muted">
                Ended
              </span>
            )}
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

