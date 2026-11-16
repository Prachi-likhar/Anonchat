import React, { useState } from 'react';
import { Flag, Info, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { ReportReason } from '@/types/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedPseudonym: string;
  onSubmit: (reason: ReportReason, details?: string) => void;
  isSubmitting?: boolean;
}

const REPORT_REASONS: Array<{ value: ReportReason; label: string; description: string }> = [
  {
    value: 'harassment',
    label: 'Harassment or Bullying',
    description: 'Targeted hostility, abusive language, or persistent unwanted attention.',
  },
  {
    value: 'spam',
    label: 'Spam or Advertising',
    description: 'Unsolicited promotional links, commercial messages, or repetitive bots.',
  },
  {
    value: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'Explicit, sexually suggestive, violent, or unlawful material.',
  },
  {
    value: 'impersonation',
    label: 'Impersonation or Fraud',
    description: 'Misleading identity or attempting to deceive community members.',
  },
  {
    value: 'other',
    label: 'Other Community Violation',
    description: 'Any other behavior violating anonymous community standards.',
  },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportedPseudonym,
  onSubmit,
  isSubmitting = false,
}) => {
  const [reason, setReason] = useState<ReportReason>('harassment');
  const [details, setDetails] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(reason, details.trim() || undefined);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Report ${reportedPseudonym}`}
      description="Help maintain a safe and respectful anonymous community."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Reasons Radio List */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text uppercase tracking-wider">
            Reason for report
          </label>
          <div className="space-y-2">
            {REPORT_REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  reason === r.value
                    ? 'border-primary bg-primary/5 text-text ring-1 ring-primary/20'
                    : 'border-border bg-surface hover:bg-surface-2 text-muted hover:text-text'
                }`}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="mt-0.5 h-4 w-4 text-primary border-border focus:ring-primary"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text">{r.label}</p>
                  <p className="text-[11px] text-muted">{r.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Optional Details */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="report-details" className="text-xs font-semibold text-text">
              Additional context (optional)
            </label>
            <span className="text-[10px] text-muted">{details.length}/500</span>
          </div>
          <textarea
            id="report-details"
            rows={3}
            maxLength={500}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Provide any specific details or context for moderators..."
            className="w-full rounded-xl border border-border bg-surface-2 p-3 text-xs text-text placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        {/* Message Snapshot Notice */}
        <div className="p-3 rounded-xl bg-surface-2 border border-border flex items-start gap-2.5 text-xs text-muted">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            A snapshot of the latest messages in this conversation will be attached to your report so administrators can review context without compromising overall chat privacy.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Flag className="h-4 w-4" />
                Submit Report
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

