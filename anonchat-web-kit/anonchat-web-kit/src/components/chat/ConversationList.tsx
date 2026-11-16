import React, { useState, useMemo } from 'react';
import { Search, X, MessageSquare, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ConversationItem } from './ConversationItem';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Conversation } from '@/types/api';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
  typingMap?: Record<string, boolean>;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  isLoading,
  typingMap = {},
}) => {
  const [search, setSearch] = useState('');

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase().trim();
    return conversations.filter((c) =>
      c.other.anonUsername.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border w-full md:w-80 lg:w-96 shrink-0">
      {/* Search Header */}
      <div className="p-3.5 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Chats
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {conversations.length}
          </span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-xl border border-border bg-surface-2 pl-9 pr-9 py-2 text-xs text-text placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text p-0.5"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton variant="circular" className="w-10 h-10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-3/5 h-3.5" />
                  <Skeleton className="w-4/5 h-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full">
            {search ? (
              <>
                <p className="text-xs text-muted mb-2">No conversations match &quot;{search}&quot;</p>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                  <Compass className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-text mb-1">No active chats</h3>
                <p className="text-xs text-muted max-w-xs mb-4">
                  Connect with someone anonymously in the community to start messaging.
                </p>
                <Link
                  to="/app/discover"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-hover transition-colors shadow-sm"
                >
                  <Compass className="h-3.5 w-3.5" />
                  Discover Members
                </Link>
              </>
            )}
          </div>
        ) : (
          filteredConversations.map((convo) => (
            <ConversationItem
              key={convo.id}
              conversation={convo}
              isSelected={convo.id === selectedId}
              isTyping={!!typingMap[convo.id]}
              onClick={() => onSelect(convo.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

