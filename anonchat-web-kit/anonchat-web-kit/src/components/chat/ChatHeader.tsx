import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Flag, ShieldAlert, XCircle, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import type { Conversation } from '@/types/api';

interface ChatHeaderProps {
  conversation: Conversation;
  onBack?: () => void;
  isTyping?: boolean;
  onReport: () => void;
  onBlock: () => void;
  onEnd: () => void;
  onDelete: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onBack,
  isTyping = false,
  onReport,
  onBlock,
  onEnd,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { other, status } = conversation;
  const isEnded = status === 'ended';

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="h-16 px-4 border-b border-border bg-surface flex items-center justify-between shrink-0 relative z-20">
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-muted hover:text-text rounded-xl hover:bg-surface-2 transition-colors"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        <Avatar
          anonUsername={other.anonUsername}
          avatarColor={other.avatarColor}
          size="md"
          showOnlineStatus={true}
          isOnline={other.isOnline}
        />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-text truncate">
              {other.anonUsername}
            </h3>
            {isEnded && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/20 text-muted">
                Ended
              </span>
            )}
          </div>
          <p className="text-xs">
            {isTyping ? (
              <span className="text-primary font-medium italic animate-pulse">
                Typing...
              </span>
            ) : other.isOnline ? (
              <span className="text-online font-medium flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-online animate-pulse" />
                Online
              </span>
            ) : (
              <span className="text-muted">Offline</span>
            )}
          </p>
        </div>
      </div>

      {/* Action Dropdown Menu */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-muted hover:text-text rounded-xl hover:bg-surface-2 transition-colors"
          aria-label="Chat options"
          aria-expanded={menuOpen}
        >
          <MoreVertical className="h-5 w-5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl border border-border bg-surface shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            {!isEnded && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEnd();
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-text hover:bg-surface-2 flex items-center gap-2.5 transition-colors"
              >
                <XCircle className="h-4 w-4 text-muted" />
                End Conversation
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className="w-full text-left px-3.5 py-2 text-xs font-medium text-text hover:bg-surface-2 flex items-center gap-2.5 transition-colors"
            >
              <Trash2 className="h-4 w-4 text-muted" />
              Delete Conversation
            </button>

            <div className="my-1 border-t border-border" />

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onReport();
              }}
              className="w-full text-left px-3.5 py-2 text-xs font-medium text-amber-500 hover:bg-amber-500/10 flex items-center gap-2.5 transition-colors"
            >
              <Flag className="h-4 w-4" />
              Report User
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onBlock();
              }}
              className="w-full text-left px-3.5 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
            >
              <ShieldAlert className="h-4 w-4" />
              Block User
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

