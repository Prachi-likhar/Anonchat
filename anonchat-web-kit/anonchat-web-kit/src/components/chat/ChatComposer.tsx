import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ChatComposerProps {
  onSend: (body: string) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
  isEnded?: boolean;
  rateLimitCountdown?: number | null;
}

const MAX_MESSAGE_LENGTH = 2000;

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSend,
  onTyping,
  onStopTyping,
  disabled = false,
  isEnded = false,
  rateLimitCountdown = null,
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isRateLimited = rateLimitCountdown !== null && rateLimitCountdown > 0;
  const isInputDisabled = disabled || isEnded || isRateLimited;

  // Auto-grow textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_MESSAGE_LENGTH) {
      setText(val);
      if (val.trim()) {
        onTyping();
      } else {
        onStopTyping();
      }
    }
  };

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isInputDisabled) return;
    onSend(trimmed);
    setText('');
    onStopTyping();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="p-3 border-t border-border bg-surface shrink-0">
      {/* Rate limit banner */}
      {isRateLimited && (
        <div className="mb-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center gap-2 text-xs font-medium animate-in fade-in">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            Anti-spam rate limit active. Please wait <strong>{rateLimitCountdown}s</strong> before sending another message.
          </span>
        </div>
      )}

      {/* Ended banner */}
      {isEnded && (
        <div className="mb-2 p-2.5 rounded-xl bg-surface-2 border border-border text-muted flex items-center gap-2 text-xs font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>This conversation has ended. No further messages can be sent.</span>
        </div>
      )}

      <div className="relative flex items-end gap-2 bg-surface-2 border border-border rounded-2xl p-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isInputDisabled}
          rows={1}
          placeholder={
            isEnded
              ? 'Conversation ended'
              : isRateLimited
                ? `Cooling down (${rateLimitCountdown}s)...`
                : 'Type a message... (Enter to send, Shift+Enter for newline)'
          }
          className="flex-1 bg-transparent border-0 resize-none text-sm text-text placeholder-muted focus:outline-none focus:ring-0 max-h-36 py-1 px-2 disabled:cursor-not-allowed disabled:opacity-50"
        />

        {/* Character count & Send button */}
        <div className="flex items-center gap-2 pb-0.5 pr-0.5">
          {text.length > 1700 && (
            <span
              className={cn(
                'text-[10px] font-mono select-none',
                text.length >= MAX_MESSAGE_LENGTH
                  ? 'text-red-500 font-bold'
                  : 'text-muted',
              )}
            >
              {text.length}/{MAX_MESSAGE_LENGTH}
            </span>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim() || isInputDisabled}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

