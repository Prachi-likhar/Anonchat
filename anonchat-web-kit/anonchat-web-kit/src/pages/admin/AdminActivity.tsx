import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, Loader2 } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { Card } from '@/components/ui/Card';
import { formatTimeAgo } from '@/lib/format';
import type { AdminActivityItem, PaginatedResponse } from '@/types/api';

const ACTION_FILTERS = [
  { value: 'all', label: 'All Actions' },
  { value: 'user_suspended', label: 'Suspensions' },
  { value: 'user_banned', label: 'Bans' },
  { value: 'user_reinstated', label: 'Reinstatements' },
  { value: 'report_resolved', label: 'Reports Resolved' },
  { value: 'report_dismissed', label: 'Reports Dismissed' },
];

export const AdminActivity: React.FC = () => {
  const [actionFilter, setActionFilter] = useState('all');

  const { data: activityData, isLoading } = useQuery<PaginatedResponse<AdminActivityItem>>({
    queryKey: ['admin-activity', actionFilter],
    queryFn: () => adminApi.getActivity({ limit: 50 }),
  });

  const allItems = activityData?.items || [];
  const filteredItems =
    actionFilter === 'all'
      ? allItems
      : allItems.filter((i) => i.action.toLowerCase() === actionFilter.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text">Audit Activity Stream</h1>
          <p className="text-xs text-muted">
            Immutable log of all administrative actions, suspensions, bans, and report decisions.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface border border-border text-muted">
          Showing <strong className="text-text">{filteredItems.length}</strong> events
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex items-center gap-2 overflow-x-auto">
        <Filter className="h-4 w-4 text-muted shrink-0" />
        <span className="text-xs text-muted font-medium shrink-0">Filter Action:</span>
        <div className="flex items-center gap-1.5">
          {ACTION_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setActionFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                actionFilter === f.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-2 text-muted hover:text-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Activity Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-border text-muted font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Type & ID</th>
                <th className="py-3 px-4">Details / Rationale</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs text-muted">Loading audit history...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">
                    No activity records found matching this filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-2/60 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-muted font-mono text-[11px] whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString()}
                      <span className="block text-[10px] text-muted/70">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold ${
                          item.action.includes('ban')
                            ? 'bg-red-500/10 text-red-500'
                            : item.action.includes('suspend')
                              ? 'bg-amber-500/10 text-amber-500'
                              : item.action.includes('reinstate')
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {item.action}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-text uppercase text-[10px] block">
                        {item.targetType}
                      </span>
                      <span className="text-muted font-mono text-[10px] truncate max-w-[120px] block">
                        {item.targetId}
                      </span>
                    </td>

                    {/* Details / Context */}
                    <td className="py-3 px-4 text-muted text-xs max-w-xs truncate">
                      {item.details ? (
                        typeof item.details === 'string' ? (
                          item.details
                        ) : (
                          JSON.stringify(item.details)
                        )
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* IP Address */}
                    <td className="py-3 px-4 text-right font-mono text-muted text-[11px]">
                      {item.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
