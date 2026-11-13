import React from 'react';
import { Card } from '@/components/ui/Card';
import { ShieldAlert, Users as UsersIcon, Flag, Activity as ActivityIcon } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Admin Overview</h1>
          <p className="text-xs text-muted">Platform health and key metrics (Phase 6)</p>
        </div>
      </div>
      <Card>
        <p className="text-sm text-muted">
          Real-time metrics, active user stats, reports summary, and activity graphs coming in Phase
          6.
        </p>
      </Card>
    </div>
  );
};

export const UsersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
          <UsersIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">User Management</h1>
          <p className="text-xs text-muted">Search, audit, suspend, and ban users (Phase 6)</p>
        </div>
      </div>
      <Card>
        <p className="text-sm text-muted">User table with moderation actions coming in Phase 6.</p>
      </Card>
    </div>
  );
};

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
          <Flag className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Content & Member Reports</h1>
          <p className="text-xs text-muted">
            Inspect 30-message snapshots and take actions (Phase 6)
          </p>
        </div>
      </div>
      <Card>
        <p className="text-sm text-muted">Report triage workflow coming in Phase 6.</p>
      </Card>
    </div>
  );
};

export const ActivityPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
          <ActivityIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Admin Audit Log</h1>
          <p className="text-xs text-muted">Audit trail of moderation actions (Phase 6)</p>
        </div>
      </div>
      <Card>
        <p className="text-sm text-muted">Audit trail viewer coming in Phase 6.</p>
      </Card>
    </div>
  );
};
