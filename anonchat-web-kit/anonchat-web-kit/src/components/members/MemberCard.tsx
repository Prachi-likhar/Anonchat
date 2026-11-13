import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { GenderBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { PublicMember } from '@/types/api';

export interface MemberCardProps {
  member: PublicMember;
  onStartChat: (memberId: string) => void;
  isStarting?: boolean;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onStartChat,
  isStarting = false,
}) => {
  return (
    <Card variant="glass" isHoverable className="flex flex-col justify-between p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            anonUsername={member.anonUsername}
            avatarColor={member.avatarColor}
            size="lg"
            showOnlineStatus
            isOnline={member.isOnline}
          />
          <div className="min-w-0">
            <h3 className="font-mono font-bold text-sm sm:text-base text-text truncate">
              {member.anonUsername}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <GenderBadge gender={member.gender} size="sm" />
              <span
                className={`text-[11px] font-medium flex items-center gap-1 ${
                  member.isOnline ? 'text-online' : 'text-muted'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    member.isOnline ? 'bg-online' : 'bg-muted/40'
                  }`}
                />
                {member.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-border/60">
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          isLoading={isStarting}
          onClick={() => onStartChat(member.id)}
          leftIcon={<MessageSquare className="h-3.5 w-3.5 text-primary" />}
          className="hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
        >
          Start Chat
        </Button>
      </div>
    </Card>
  );
};

