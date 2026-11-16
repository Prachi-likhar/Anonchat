import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  X,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Clock,
  Eye,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { adminApi, type SuspendUserPayload, type BanUserPayload } from '@/api/admin';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { GenderBadge, Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/store/toastStore';
import { getErrorMessage } from '@/lib/errors';
import { formatTimeAgo } from '@/lib/format';
import type { AdminUser, PaginatedResponse } from '@/types/api';

export const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');

  // Selected user for Detail Modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Moderation state
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);
  const [suspendDurationDays, setSuspendDurationDays] = useState<number>(7);
  const [suspendReason, setSuspendReason] = useState<string>('');

  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState<string>('');

  const [reinstateTarget, setReinstateTarget] = useState<AdminUser | null>(null);

  // Fetch users list
  const { data: usersData, isLoading: usersLoading } = useQuery<PaginatedResponse<AdminUser>>({
    queryKey: ['admin-users', { q: search, status: statusFilter, gender: genderFilter }],
    queryFn: () =>
      adminApi.getUsers({
        q: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        gender: genderFilter !== 'all' ? genderFilter : undefined,
        limit: 50,
      }),
  });

  // Fetch user details when selected
  const { data: userDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-user-detail', selectedUserId],
    queryFn: () => adminApi.getUserDetail(selectedUserId!),
    enabled: !!selectedUserId,
  });

  // Moderation Mutations
  const suspendMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SuspendUserPayload }) =>
      adminApi.suspendUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      if (selectedUserId) {
        queryClient.invalidateQueries({ queryKey: ['admin-user-detail', selectedUserId] });
      }
      toast.success('User has been suspended.', 'Suspension Active');
      setSuspendTarget(null);
      setSuspendReason('');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err), 'Failed to Suspend User');
    },
  });

  const banMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BanUserPayload }) =>
      adminApi.banUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      if (selectedUserId) {
        queryClient.invalidateQueries({ queryKey: ['admin-user-detail', selectedUserId] });
      }
      toast.success('User has been permanently banned.', 'Account Banned');
      setBanTarget(null);
      setBanReason('');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err), 'Failed to Ban User');
    },
  });

  const reinstateMutation = useMutation({
    mutationFn: (id: string) => adminApi.reinstateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      if (selectedUserId) {
        queryClient.invalidateQueries({ queryKey: ['admin-user-detail', selectedUserId] });
      }
      toast.success('User account has been reinstated to active status.', 'Account Reinstated');
      setReinstateTarget(null);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err), 'Failed to Reinstate User');
    },
  });

  const handleConfirmSuspend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendTarget || !suspendReason.trim()) return;

    const untilDate = new Date();
    untilDate.setDate(untilDate.getDate() + suspendDurationDays);

    suspendMutation.mutate({
      id: suspendTarget.id,
      payload: {
        until: untilDate.toISOString(),
        reason: suspendReason.trim(),
      },
    });
  };

  const handleConfirmBan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!banTarget || !banReason.trim()) return;

    banMutation.mutate({
      id: banTarget.id,
      payload: {
        reason: banReason.trim(),
      },
    });
  };

  const handleConfirmReinstate = () => {
    if (!reinstateTarget) return;
    reinstateMutation.mutate(reinstateTarget.id);
  };

  const users = usersData?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text">User Directory & Moderation</h1>
          <p className="text-xs text-muted">
            Inspect accounts, review report histories, and apply disciplinary actions.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface border border-border text-muted">
          Showing <strong className="text-text">{users.length}</strong> users
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by anonymous ID or email..."
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

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-surface-2 py-2 px-3 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium shrink-0">Gender:</span>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="rounded-xl border border-border bg-surface-2 py-2 px-3 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-border text-muted font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reports</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usersLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs text-muted">Loading directory...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    No users match your criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  return (
                    <tr key={u.id} className="hover:bg-surface-2/60 transition-colors">
                      {/* Member */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            anonUsername={u.anonUsername}
                            size="sm"
                            isOnline={u.isOnline}
                            showOnlineStatus={true}
                          />
                          <div>
                            <span className="font-semibold text-text block">
                              {u.anonUsername}
                            </span>
                            {u.role === 'admin' && (
                              <Badge variant="warning" size="sm">
                                Admin
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 font-mono text-[11px] text-muted">
                        {u.email}
                      </td>

                      {/* Gender */}
                      <td className="py-3 px-4">
                        <GenderBadge gender={u.gender} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {u.status === 'active' ? (
                          <Badge variant="success" size="sm">
                            Active
                          </Badge>
                        ) : u.status === 'suspended' ? (
                          <Badge variant="warning" size="sm">
                            Suspended
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">
                            Banned
                          </Badge>
                        )}
                      </td>

                      {/* Reports against */}
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            u.reportCount > 0 ? 'text-amber-500 font-bold' : 'text-muted'
                          }`}
                        >
                          {u.reportCount}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="py-3 px-4 text-muted text-[11px]">
                        {formatTimeAgo(u.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedUserId(u.id)}
                            className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors"
                            title="View details"
                            aria-label={`View details for ${u.anonUsername}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {u.status === 'active' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setSuspendTarget(u)}
                                className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors"
                                title="Suspend user"
                                aria-label={`Suspend ${u.anonUsername}`}
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setBanTarget(u)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                                title="Ban user"
                                aria-label={`Ban ${u.anonUsername}`}
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setReinstateTarget(u)}
                              className="p-1.5 rounded-lg text-online hover:bg-online/10 transition-colors"
                              title="Reinstate user"
                              aria-label={`Reinstate ${u.anonUsername}`}
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Detail Modal */}
      {selectedUserId && (
        <Modal
          isOpen={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
          title={userDetail?.anonUsername || 'Member Details'}
          description="Detailed member profile, reports filed against them, and audit trail."
          maxWidth="lg"
        >
          {detailLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : userDetail ? (
            <div className="space-y-6 pt-2 text-xs">
              {/* Profile Summary */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-2 border border-border">
                <Avatar
                  anonUsername={userDetail.anonUsername}
                  size="lg"
                  isOnline={userDetail.isOnline}
                  showOnlineStatus={true}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-text">{userDetail.anonUsername}</h3>
                    <GenderBadge gender={userDetail.gender} size="sm" />
                    {userDetail.status === 'active' ? (
                      <Badge variant="success" size="sm">
                        Active
                      </Badge>
                    ) : userDetail.status === 'suspended' ? (
                      <Badge variant="warning" size="sm">
                        Suspended
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm">
                        Banned
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted font-mono">{userDetail.email}</p>
                  <p className="text-[11px] text-muted">
                    Joined {new Date(userDetail.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Reports Against */}
              <div className="space-y-2">
                <h4 className="font-bold text-text flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  Reports Filed Against User ({userDetail.reportsAgainst?.length || 0})
                </h4>
                {!userDetail.reportsAgainst || userDetail.reportsAgainst.length === 0 ? (
                  <p className="text-muted p-3 rounded-xl bg-surface-2 text-center">
                    No reports filed against this member.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {userDetail.reportsAgainst.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl bg-surface-2 border border-border space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-text uppercase tracking-wider text-[10px]">
                            {r.reason}
                          </span>
                          <span className="text-[10px] text-muted">
                            {formatTimeAgo(r.createdAt)}
                          </span>
                        </div>
                        {r.details && <p className="text-muted">{r.details}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </Modal>
      )}

      {/* Suspend User Modal */}
      {suspendTarget && (
        <Modal
          isOpen={!!suspendTarget}
          onClose={() => setSuspendTarget(null)}
          title={`Suspend ${suspendTarget.anonUsername}`}
          description="Temporarily ban this user from accessing Anonchat."
          maxWidth="md"
        >
          <form onSubmit={handleConfirmSuspend} className="space-y-4 pt-2 text-xs">
            {/* Duration Selector */}
            <div className="space-y-1.5">
              <label className="font-semibold text-text">Suspension Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '24 Hours', days: 1 },
                  { label: '7 Days', days: 7 },
                  { label: '30 Days', days: 30 },
                  { label: '90 Days', days: 90 },
                ].map((dur) => (
                  <button
                    key={dur.days}
                    type="button"
                    onClick={() => setSuspendDurationDays(dur.days)}
                    className={`py-2 px-2 text-center rounded-xl border font-semibold transition-all ${
                      suspendDurationDays === dur.days
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                        : 'border-border bg-surface-2 text-muted hover:text-text'
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label htmlFor="suspend-reason" className="font-semibold text-text">
                Suspension Reason (Logged in Audit History)
              </label>
              <textarea
                id="suspend-reason"
                required
                rows={3}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Describe reason for suspension (e.g. repeated spam, inappropriate behavior)..."
                className="w-full rounded-xl border border-border bg-surface-2 p-3 text-xs text-text placeholder-muted focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSuspendTarget(null)}
                disabled={suspendMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={!suspendReason.trim() || suspendMutation.isPending}
              >
                {suspendMutation.isPending ? 'Suspending...' : 'Confirm Suspension'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Ban User Modal */}
      {banTarget && (
        <Modal
          isOpen={!!banTarget}
          onClose={() => setBanTarget(null)}
          title={`Permanently Ban ${banTarget.anonUsername}`}
          description="Permanent bans invalidate all sessions, disconnect active chats, and prevent future logins."
          maxWidth="md"
        >
          <form onSubmit={handleConfirmBan} className="space-y-4 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                This action will immediately blacklist <strong>{banTarget.anonUsername}</strong>.
                They will be disconnected from Socket.IO and blocked permanently.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ban-reason" className="font-semibold text-text">
                Ban Justification Reason (Required)
              </label>
              <textarea
                id="ban-reason"
                required
                rows={3}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Detailed reason for permanent ban..."
                className="w-full rounded-xl border border-border bg-surface-2 p-3 text-xs text-text placeholder-muted focus:border-danger focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setBanTarget(null)}
                disabled={banMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={!banReason.trim() || banMutation.isPending}
              >
                {banMutation.isPending ? 'Banning...' : 'Confirm Permanent Ban'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reinstate User Confirm Dialog */}
      {reinstateTarget && (
        <ConfirmDialog
          isOpen={!!reinstateTarget}
          onClose={() => setReinstateTarget(null)}
          onConfirm={handleConfirmReinstate}
          title={`Reinstate ${reinstateTarget.anonUsername}?`}
          description={`Are you sure you want to lift restrictions on ${reinstateTarget.anonUsername}? Their account will return to active status and they will be able to log in and chat again.`}
          confirmText="Reinstate Account"
          variant="primary"
          isLoading={reinstateMutation.isPending}
        />
      )}
    </div>
  );
};
