import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore, type ToastType, type ToastMessage } from '@/store/toastStore';
import { cn } from '@/lib/cn';

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-online flex-shrink-0" />,
  error: <AlertCircle className="h-5 w-5 text-danger flex-shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />,
  info: <Info className="h-5 w-5 text-primary flex-shrink-0" />,
};

const toastBorders: Record<ToastType, string> = {
  success: 'border-online/20',
  error: 'border-danger/20',
  warning: 'border-amber-500/20',
  info: 'border-primary/20',
};

export const ToastItem: React.FC<{ toast: ToastMessage }> = ({ toast }) => {
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      className={cn(
        'flex w-full max-w-sm items-start gap-3 rounded-2xl bg-surface p-4 shadow-xl border backdrop-blur-md pointer-events-auto',
        toastBorders[toast.type],
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="pt-0.5">{toastIcons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        {toast.title && <h4 className="text-sm font-semibold text-text">{toast.title}</h4>}
        <p className="text-xs text-muted leading-relaxed break-words">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss notification"
        className="text-muted hover:text-text rounded p-0.5 transition-colors focus:outline-none"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center sm:items-end justify-end p-4 sm:p-6 gap-2"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
};
