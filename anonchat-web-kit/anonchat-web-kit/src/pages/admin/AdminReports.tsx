import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { adminApi, type UpdateReportPayload } from '@/api/admin';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/store/toastStore';
import { getErrorMessage } from '@/lib/errors';
import { formatTimeAgo, formatTime } from '@/lib/format';
import type { ReportItem, ReportDetail, PaginatedResponse, ReportStatus } from '@/types/api';

const STATUS_TABS: Array<{ value: ReportStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'reviewing', label: 'In Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

export const AdminReports: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ReportStatus>('open');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Triage state in modal
  const [resolutionNote, setResolutionNote] = useState('');
  const [moderationAction, setModerationAction] = useState<'none' | 'suspend' | 'ban'>('none');

  // Fetch reports list for current tab
  const { data: reportsData, isLoading: reportsLoading } = useQuery<PaginatedResponse<ReportItem>>({
    queryKey: ['admin-reports', activeTab],
    queryFn: () => adminApi.getReports({ status: activeTab, limit: 50 }),
  });

  // Fetch single report detail (with conversation snapshot)
  const { data: reportDetail, isLoading: detailLoading } = useQuery<ReportDetail>({
    queryKey: ['admin-report-detail', selectedReportId],
    queryFn: () => adminApi.getReportDetail(selectedReportId!),
    enabled: !!selectedReportId,
  });

  // Update Report Mutation
  const updateReportMutation = useMutation({
    mutationFn: (payload: UpdateReportPayload) =>
      adminApi.updateReport(selectedReportId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Report status and moderation action updated.', 'Report Updated');
      setSelectedReportId(null);
      setResolutionNote('');
      setModerationAction('none');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err), 'Failed to Update Report');
    },
  });

  const handleResolve = (status: 'resolved' | 'dismissed') => {
    updateReportMutation.mutate({
      status,
      resolutionNote: resolutionNote.trim() || undefined,
      action: moderationAction,
    });
  };

  const reports = reportsData?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text">Content & Member Reports</h1>
          <p className="text-xs text-muted">
            Review community flags, inspect message snapshots, and take disciplinary action.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.value
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-text hover:bg-surface-2'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-border text-muted font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Reported User</th>
                <th className="py-3 px-4">Reporter</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reportsLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs text-muted">Loading reports...</span>
                    </div>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    No {activeTab} reports in this view.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-surface-2/60 transition-colors">
                    {/* Reported User */}
                    <td className="py-3 px-4 font-semibold text-text">
                      {report.reportedAnonName || 'Anonymous User'}
                    </td>

                    {/* Reporter */}
                    <td className="py-3 px-4 text-muted">
                      {report.reporterAnonName || 'Anonymous Member'}
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4">
                      <Badge variant="warning" size="sm">
                        {report.reason}
                      </Badge>
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 text-muted max-w-xs truncate">
                      {report.details || '—'}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-muted text-[11px]">
                      {formatTimeAgo(report.createdAt)}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedReportId(report.id);
                          setResolutionNote(report.resolutionNote || '');
                          setModerationAction('none');
                        }}
                        className="gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Report Inspection Modal (with Conversation Snapshot) */}
      {selectedReportId && (
        <Modal
          isOpen={!!selectedReportId}
          onClose={() => setSelectedReportId(null)}
          title="Report Investigation & Snapshot"
          description="Review reported context and conversation snapshot before taking action."
          maxWidth="lg"
        >
          {detailLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reportDetail ? (
            <div className="space-y-5 pt-2 text-xs">
              {/* Report Summary Cards */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-surface-2 border border-border">
                <div className="space-y-1">
                  <span className="text-muted text-[11px] font-medium">Reported Member</span>
                  <p className="font-bold text-text text-sm">
                    {reportDetail.reportedAnonName || 'Anonymous User'}
                  </p>
                  <p className="text-muted font-mono text-[10px]">ID: {reportDetail.reportedUserId}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted text-[11px] font-medium">Flag Reason</span>
                  <div>
                    <Badge variant="warning" size="sm">
                      {reportDetail.reason}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted">
                    Reported {formatTimeAgo(reportDetail.createdAt)}
                  </p>
                </div>
              </div>

              {/* Reporter Context */}
              {reportDetail.details && (
                <div className="p-3 rounded-xl bg-surface-2 border border-border space-y-1">
                  <span className="font-semibold text-text">Reporter Notes:</span>
                  <p className="text-muted leading-relaxed">{reportDetail.details}</p>
                </div>
              )}

              {/* Conversation Snapshot Stream */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-text flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Conversation Snapshot History
                  </h4>
                  <span className="text-[10px] text-muted">
                    {reportDetail.snapshotMessages?.length || 0} messages attached
                  </span>
                </div>

                {!reportDetail.snapshotMessages || reportDetail.snapshotMessages.length === 0 ? (
                  <p className="text-muted p-4 rounded-xl bg-surface-2 text-center text-xs">
                    No snapshot messages were captured for this report.
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2 p-3 rounded-xl bg-surface border border-border">
                    {reportDetail.snapshotMessages.map((msg) => {
                      const isReportedUser = msg.senderId
                        ? msg.senderId === reportDetail.reportedUserId
                        : !msg.mine;
                      return (
                        <div
                          key={msg.id}
                          className={`p-2.5 rounded-xl border text-xs max-w-[85%] ${
                            isReportedUser
                              ? 'ml-auto bg-amber-500/10 border-amber-500/20 text-text'
                              : 'mr-auto bg-surface-2 border-border text-text'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1 text-[10px]">
                            <span className="font-bold text-text">
                              {isReportedUser
                                ? reportDetail.reportedAnonName || 'Reported User'
                                : reportDetail.reporterAnonName || 'Reporter'}
                            </span>
                            <span className="text-muted">{formatTime(msg.createdAt)}</span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.body}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Selection */}
              <div className="space-y-3 p-4 rounded-xl bg-surface-2 border border-border">
                <h4 className="font-bold text-text">Moderation Resolution</h4>

                <div className="space-y-1.5">
                  <label htmlFor="res-note" className="text-muted">
                    Resolution note (stored in audit log):
                  </label>
                  <textarea
                    id="res-note"
                    rows={2}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Enter audit notes or rationale for resolution..."
                    className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text placeholder-muted focus:border-primary focus:outline-none"
                  />
                </div>

                {reportDetail.status === 'open' || reportDetail.status === 'reviewing' ? (
                  <div className="space-y-1.5">
                    <label className="text-muted">Apply action to reported member:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'none', label: 'No Action' },
                        { value: 'suspend', label: 'Suspend (7d)' },
                        { value: 'ban', label: 'Permanent Ban' },
                      ].map((act) => (
                        <button
                          key={act.value}
                          type="button"
                          onClick={() => setModerationAction(act.value as 'none' | 'suspend' | 'ban')}
                          className={`py-2 px-2 text-center rounded-xl border font-semibold transition-all ${
                            moderationAction === act.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-surface text-muted hover:text-text'
                          }`}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedReportId(null)}
                  disabled={updateReportMutation.isPending}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleResolve('dismissed')}
                  disabled={updateReportMutation.isPending}
                  className="gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  Dismiss Report
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => handleResolve('resolved')}
                  disabled={updateReportMutation.isPending}
                  className="gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" />
                  Resolve & Apply
                </Button>
              </div>
            </div>
          ) : null}
        </Modal>
      )}
    </div>
  );
};
