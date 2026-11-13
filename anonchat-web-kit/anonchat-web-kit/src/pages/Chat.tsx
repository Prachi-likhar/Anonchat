import React from 'react';
import { Card } from '@/components/ui/Card';
import { MessageSquare } from 'lucide-react';

export const Chat: React.FC = () => {
  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Messages</h1>
          <p className="text-xs text-muted">1-on-1 private conversations (Phase 4)</p>
        </div>
      </div>
      <Card>
        <p className="text-sm text-muted">
          Two-pane conversation list, real-time message stream, typing indicator, and report/block
          dialogs coming in Phase 4.
        </p>
      </Card>
    </div>
  );
};
