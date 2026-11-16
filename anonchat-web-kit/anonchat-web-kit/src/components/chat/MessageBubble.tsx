import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Message } from '@/types/api';

interface MessageBubbleProps {
  message: Message;
  partnerAvatarColor: string;
  partnerPseudonym: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  partnerAvatarColor,
  partnerPseudonym,
}) => {
  const isMine = message.mine;
  const isOptimistic = message.id.startsWith('temp-');

  return (
    <div
      className={cn(
        'flex items-end gap-2 group',
        isMine ? 'justify-end' : 'justify-start',
      )}
      data-testid={`message-${message.id}`}
    >
      {!isMine && (
        <div className="shrink-0 mb-1">
          <Avatar
            anonUsername={partnerPseudonym}
            avatarColor={partnerAvatarColor}
            size="sm"
          />
        </div>
      )}

      <div
        className={cn(
          'relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-[85%] sm:max-w-[70%] break-words shadow-sm transition-all',
          isMine
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-surface-2 border border-border text-text rounded-bl-sm',
          isOptimistic && 'opacity-70',
        )}
      >
        <p className="whitespace-pre-wrap">{message.body}</p>

        <div
          className={cn(
            'flex items-center gap-1.5 mt-1 text-[10px] select-none',
            isMine ? 'justify-end text-white/80' : 'justify-start text-muted',
          )}
        >
          <span>{formatTime(message.createdAt)}</span>

          {isMine && (
            <span title={message.readAt ? 'Read' : 'Delivered'}>
              {message.readAt ? (
                <CheckCheck className="h-3.5 w-3.5 text-white stroke-[2.5]" aria-label="Read" />
              ) : (
                <Check className="h-3.5 w-3.5 text-white/70 stroke-[2]" aria-label="Delivered" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

