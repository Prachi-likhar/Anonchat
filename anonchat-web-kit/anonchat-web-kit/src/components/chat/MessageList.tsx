import React, { useEffect, useRef } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Loader2, Sparkles } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { Avatar } from '@/components/ui/Avatar';
import type { Message } from '@/types/api';

interface MessageListProps {
  messages: Message[];
  partnerAvatarColor: string;
  partnerPseudonym: string;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadEarlier: () => void;
  isPartnerTyping?: boolean;
}

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMMM d, yyyy');
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  partnerAvatarColor,
  partnerPseudonym,
  hasNextPage,
  isFetchingNextPage,
  onLoadEarlier,
  isPartnerTyping = false,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Auto-scroll to bottom on initial load or when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current || prevMessagesLengthRef.current === 0) {
      if (typeof bottomRef.current?.scrollIntoView === 'function') {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Also scroll down when partner starts typing
  useEffect(() => {
    if (isPartnerTyping && typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isPartnerTyping]);

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
    >
      {/* Load Earlier Messages Button */}
      {hasNextPage && (
        <div className="flex justify-center mb-2">
          <button
            type="button"
            onClick={onLoadEarlier}
            disabled={isFetchingNextPage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 border border-border text-xs text-muted hover:text-text hover:border-primary/40 transition-all disabled:opacity-50"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                Loading history...
              </>
            ) : (
              'Load earlier messages'
            )}
          </button>
        </div>
      )}

      {/* Empty Conversation Starter Prompt */}
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center my-auto">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-text mb-1">
            Say hi 👋
          </h3>
          <p className="text-xs text-muted max-w-sm mb-2">
            You&apos;re chatting privately with <strong className="text-text">{partnerPseudonym}</strong>.
          </p>
          <p className="text-[11px] text-muted/80 max-w-xs">
            Neither of you can see each other&apos;s real names, emails, or personal details. Keep the conversation respectful and fun!
          </p>
        </div>
      ) : (
        messages.map((message, idx) => {
          // Check if date header should be displayed
          const currentDate = format(new Date(message.createdAt), 'yyyy-MM-dd');
          const prevDate =
            idx > 0
              ? format(new Date(messages[idx - 1].createdAt), 'yyyy-MM-dd')
              : null;
          const showDateSeparator = currentDate !== prevDate;

          return (
            <React.Fragment key={message.id}>
              {showDateSeparator && (
                <div className="flex justify-center my-4 select-none">
                  <span className="px-3 py-1 rounded-full bg-surface-2 border border-border text-[11px] font-semibold text-muted">
                    {formatDateSeparator(message.createdAt)}
                  </span>
                </div>
              )}

              <MessageBubble
                message={message}
                partnerAvatarColor={partnerAvatarColor}
                partnerPseudonym={partnerPseudonym}
              />
            </React.Fragment>
          );
        })
      )}

      {/* Partner Typing Bubble */}
      {isPartnerTyping && (
        <div className="flex items-end gap-2 justify-start animate-in fade-in duration-150">
          <div className="shrink-0 mb-1">
            <Avatar
              anonUsername={partnerPseudonym}
              avatarColor={partnerAvatarColor}
              size="sm"
            />
          </div>
          <div className="px-4 py-3 rounded-2xl bg-surface-2 border border-border rounded-bl-sm flex items-center gap-1.5 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

