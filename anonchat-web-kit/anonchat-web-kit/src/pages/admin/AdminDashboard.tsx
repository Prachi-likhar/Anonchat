import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldAlert,
  Flag,
  MessageSquare,
  Activity,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { adminApi } from '@/api/admin';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatTimeAgo } from '@/lib/format';
import type { AdminStats, ReportItem, AdminActivityItem, PaginatedResponse } from '@/types/api';

export const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats(),
    refetchInterval: 30000,
  });

  const { data: openReportsData, isLoading: reportsLoading } = useQuery<PaginatedResponse<ReportItem>>({
    queryKey: ['admin-reports-preview'],
    queryFn: () => adminApi.getReports({ status: 'open', limit: 5 }),
    refetchInterval: 30000,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery<PaginatedResponse<AdminActivityItem>>({
    queryKey: ['admin-activity-preview'],
    queryFn: () => adminApi.getActivity({ limit: 5 }),
    refetchInterval: 30000,
  });

  const openReports = openReportsData?.items || [];
  const recentActivity = activityData?.items || [];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text">Admin Overview</h1>
          <p className="text-xs text-muted">
            Live platform metrics, community safety reports, and moderation activity.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Total Members</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text">{stats?.totalUsers ?? 0}</span>
              <span className="text-[11px] text-online font-medium flex items-center gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-online animate-pulse" />
                {stats?.onlineNow ?? 0} online
              </span>
            </div>
          )}
        </Card>

        {/* Open Reports */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Open Reports</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Flag className="h-4 w-4" />
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold ${
                  (stats?.openReports ?? 0) > 0 ? 'text-amber-500' : 'text-text'
                }`}
              >
                {stats?.openReports ?? 0}
              </span>
              {(stats?.openReports ?? 0) > 0 && (
                <Badge variant="warning" size="sm">
                  Requires Review
                </Badge>
              )}
            </div>
          )}
        </Card>

        {/* Active Chats & Messages */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Active Chats</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text">
                {stats?.conversationsActive ?? 0}
              </span>
              <span className="text-[11px] text-muted">
                {stats?.messagesToday ?? 0} msg today
              </span>
            </div>
          )}
        </Card>

        {/* Suspended & Banned */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Restricted</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger/10 text-danger">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-danger">
                {(stats?.suspended ?? 0) + (stats?.banned ?? 0)}
              </span>
              <span className="text-[11px] text-muted">
                {stats?.suspended ?? 0} susp / {stats?.banned ?? 0} ban
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Analytics & Demographic Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gender Demographic Split */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text">Community Gender Split</h3>
            <span className="text-xs text-muted">Total: {stats?.totalUsers ?? 0}</span>
          </div>

          {statsLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="space-y-3">
              {/* Progress Bar */}
              {(() => {
                const total = Math.max((stats?.male ?? 0) + (stats?.female ?? 0), 1);
                const malePct = Math.round(((stats?.male ?? 0) / total) * 100);
                const femalePct = 100 - malePct;

                return (
                  <>
                    <div className="h-3 w-full rounded-full bg-surface-2 overflow-hidden flex shadow-inner">
                      <div
                        style={{ width: `${malePct}%` }}
                        className="bg-gender-male transition-all duration-500"
                        title={`Male: ${malePct}%`}
                      />
                      <div
                        style={{ width: `${femalePct}%` }}
                        className="bg-gender-female transition-all duration-500"
                        title={`Female: ${femalePct}%`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-gender-male" />
                        <span className="text-muted">
                          Male: <strong className="text-text">{stats?.male ?? 0}</strong> ({malePct}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-gender-female" />
                        <span className="text-muted">
                          Female: <strong className="text-text">{stats?.female ?? 0}</strong> ({femalePct}%)
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </Card>

        {/* Member Signups Summary */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text">Growth & Acquisition</h3>
            <span className="text-xs text-muted flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-online" />
              Active
            </span>
          </div>

          {statsLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-surface-2 space-y-1">
                <span className="text-xs text-muted">New Today</span>
                <p className="text-xl font-bold text-text">{stats?.newToday ?? 0}</p>
                <span className="text-[10px] text-muted">Past 24 hours</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-2 space-y-1">
                <span className="text-xs text-muted">Past 7 Days</span>
                <p className="text-xl font-bold text-text">{stats?.new7d ?? 0}</p>
                <span className="text-[10px] text-muted">Weekly new members</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Tables Preview: Open Reports & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Reports */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-text">Reports Requiring Triage</h3>
            </div>
            <Link
              to="/admin/reports"
              className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {reportsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : openReports.length === 0 ? (
            <p className="text-xs text-muted py-6 text-center">
              All clear! No open reports pending review.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {openReports.map((report) => (
                <div key={report.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text truncate">
                        {report.reportedAnonName || 'Anonymous Member'}
                      </span>
                      <Badge variant="warning" size="sm">
                        {report.reason}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted truncate mt-0.5">
                      Reported by {report.reporterAnonName || 'Anonymous'} · {formatTimeAgo(report.createdAt)}
                    </p>
                  </div>
                  <Link
                    to={`/admin/reports`}
                    className="px-2.5 py-1 rounded-lg bg-surface-2 border border-border text-[11px] font-medium text-text hover:bg-surface hover:border-primary/40 transition-colors shrink-0"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Moderation Activity */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-text">Recent Moderation Actions</h3>
            </div>
            <Link
              to="/admin/activity"
              className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
            >
              View log
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {activityLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-xs text-muted py-6 text-center">
              No recent audit activity recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {recentActivity.map((act) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-medium text-text">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-mono font-semibold">
                        {act.action}
                      </span>
                      <span className="text-muted text-[11px]">on {act.targetType}</span>
                    </div>
                    <p className="text-[11px] text-muted truncate mt-0.5 font-mono">
                      {formatTimeAgo(act.createdAt)} · IP: {act.ipAddress || 'unknown'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
