import React from 'react';
import { Card } from '@/components/ui/Card';
import { LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <LayoutDashboard className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Welcome back, {user?.anonUsername}</h1>
          <p className="text-xs text-muted">Your anonymous dashboard (Phase 3)</p>
        </div>
      </div>
      <Card>
        <p className="text-sm text-muted">
          Dashboard widgets, recent chats, online member recommendations, and safety tips will be
          built in Phase 3.
        </p>
      </Card>
    </div>
  );
};
