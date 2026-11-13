import React from 'react';
import { Card } from '@/components/ui/Card';
import { Compass } from 'lucide-react';

export const Discover: React.FC = () => {
  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Compass className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Discover Members</h1>
          <p className="text-xs text-muted">Browse and search anonymous members (Phase 3)</p>
        </div>
      </div>
      <Card>
        <p className="text-sm text-muted">
          Member discovery grid, gender/online filters, search, and instant conversation starter
          coming in Phase 3.
        </p>
      </Card>
    </div>
  );
};
