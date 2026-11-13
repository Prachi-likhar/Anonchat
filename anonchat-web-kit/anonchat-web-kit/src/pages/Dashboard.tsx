import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Users,
  Compass,
  Copy,
  Check,
  Shield,
  ArrowRight,
  Sparkles,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, GenderBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { useConversations } from '@/hooks/useConversations';
import { useMembers } from '@/hooks/useMembers';
import { formatConversationDate } from '@/lib/format';
import { toast } from '@/store/toastStore';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { conversations, unreadCount, isLoading: convosLoading, startConversation, isStarting } =
    useConversations(10);

  const { members, isLoading: membersLoading } = useMembers({ filter: 'online', limit: 8 });

  const handleCopyUsername = () => {
    if (!user?.anonUsername) return;
    navigator.clipboard.writeText(user.anonUsername);
    setCopied(true);
    toast.success('Anonymous username copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const topConversations = conversations.slice(0, 3);
  const recommendedMembers = members.filter((m) => m.id !== user?.id).slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 space-y-8">
      {/* 1. Header & Identity Persona Banner */}
      <Card variant="glass" className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <Avatar
              anonUsername={user?.anonUsername}
              avatarColor={user?.avatarColor}
              size="xl"
              showOnlineStatus
              isOnline
            />

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted uppercase tracking-wider font-semibold">
                  Anonymous Community Persona
                </span>
                {user?.role === 'admin' && (
                  <Badge variant="warning" size="sm">
                    Admin
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-wide text-text">
                  {user?.anonUsername || 'Anonymous Member'}
                </h1>
                <button
                  type="button"
                  onClick={handleCopyUsername}
                  title="Copy permanent anonymous username"
                  className="rounded-lg p-1.5 text-muted hover:text-text hover:bg-surface-2 transition-colors focus:outline-none"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-online" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                {user?.gender && <GenderBadge gender={user.gender} size="sm" />}
                <span className="text-xs text-online font-medium flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-online animate-pulse" />
                  Encrypted & Active
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/app/discover">
              <Button variant="primary" rightIcon={<Compass className="h-4 w-4" />}>
                Discover Members
              </Button>
            </Link>
            <Link to="/app/chat">
              <Button variant="secondary" rightIcon={<MessageSquare className="h-4 w-4" />}>
                All Chats
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* 2. Quick Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass" className="p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Unread Messages</p>
            <h3 className="text-2xl font-bold text-text mt-0.5">{unreadCount}</h3>
          </div>
        </Card>

        <Card variant="glass" className="p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-500">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Active Conversations</p>
            <h3 className="text-2xl font-bold text-text mt-0.5">{conversations.length}</h3>
          </div>
        </Card>

        <Card variant="glass" className="p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-online/10 text-online">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Online Members</p>
            <h3 className="text-2xl font-bold text-text mt-0.5">{members.length}</h3>
          </div>
        </Card>
      </div>

      {/* 3. Continue Chatting Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span>Continue Chatting</span>
          </h2>
          <Link
            to="/app/chat"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {convosLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i} className="p-4 flex items-center gap-3">
                <Skeleton variant="circular" className="h-10 w-10 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : topConversations.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-5 w-5" />}
            title="No active conversations yet"
            description="Start connecting anonymously with members online right now."
            action={{
              label: 'Explore Discover Grid',
              onClick: () => navigate('/app/discover'),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topConversations.map((convo) => (
              <Card
                key={convo.id}
                isHoverable
                onClick={() => navigate(`/app/chat/${convo.id}`)}
                className="cursor-pointer p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      anonUsername={convo.other.anonUsername}
                      avatarColor={convo.other.avatarColor}
                      size="sm"
                      showOnlineStatus
                      isOnline={convo.other.isOnline}
                    />
                    <span className="font-mono font-semibold text-xs text-text truncate">
                      {convo.other.anonUsername}
                    </span>
                  </div>

                  {convo.unreadCount > 0 && (
                    <Badge variant="primary" size="sm">
                      {convo.unreadCount} new
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted truncate">
                  {convo.lastMessage ? convo.lastMessage.body : 'Conversation started'}
                </p>

                <div className="text-[10px] text-muted text-right">
                  {formatConversationDate(convo.updatedAt)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 4. Meet Someone New Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-pink-500" />
            <span>Meet Someone New</span>
          </h2>
          <Link
            to="/app/discover"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>Browse directory</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {membersLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-3 text-center space-y-2">
                <Skeleton variant="circular" className="h-12 w-12 mx-auto" />
                <Skeleton className="h-3 w-3/4 mx-auto" />
                <Skeleton className="h-7 w-full" />
              </Card>
            ))}
          </div>
        ) : recommendedMembers.length === 0 ? (
          <p className="text-xs text-muted">No other active members online right now.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {recommendedMembers.map((member) => (
              <Card
                key={member.id}
                variant="glass"
                className="p-3 text-center flex flex-col items-center justify-between space-y-2.5"
              >
                <Avatar
                  anonUsername={member.anonUsername}
                  avatarColor={member.avatarColor}
                  size="md"
                  showOnlineStatus
                  isOnline={member.isOnline}
                />
                <div className="w-full">
                  <p className="font-mono font-semibold text-xs text-text truncate">
                    {member.anonUsername}
                  </p>
                  <GenderBadge gender={member.gender} size="sm" className="mt-1" />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  isLoading={isStarting}
                  onClick={() => startConversation(member.id)}
                  className="text-[11px] py-1"
                >
                  Say Hi 👋
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 5. Safety Tips Card */}
      <Card variant="glass" className="border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white flex-shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-text text-sm">Community Safety Reminder</h4>
            <p className="text-muted leading-relaxed">
              Your conversations are private and shielded. Never reveal phone numbers, social
              handles, or real-life locations. You can report or block users at any time using the
              chat header options.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
