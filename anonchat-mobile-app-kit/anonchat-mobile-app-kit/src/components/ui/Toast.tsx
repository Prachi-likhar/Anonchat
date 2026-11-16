import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { useToastStore, ToastMessage } from '../../store/toastStore';
import { cn } from '../../lib/cn';

export const ToastContainer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { toasts, hideToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 z-50 items-center px-4"
      style={{ top: Math.max(insets.top, 16) }}
    >
      {toasts.map((item) => (
        <ToastItem key={item.id} item={item} onDismiss={() => hideToast(item.id)} />
      ))}
    </View>
  );
};

const ToastItem: React.FC<{ item: ToastMessage; onDismiss: () => void }> = ({
  item,
  onDismiss,
}) => {
  const isSuccess = item.type === 'success';
  const isError = item.type === 'error';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onDismiss}
      className={cn(
        'w-full max-w-sm flex-row items-center p-3.5 mb-2 rounded-2xl border shadow-lg',
        isSuccess && 'bg-green-950/90 border-green-500/40 text-green-200',
        isError && 'bg-red-950/90 border-red-500/40 text-red-200',
        !isSuccess && !isError && 'bg-surface-light/95 dark:bg-surface-dark/95 border-border-light dark:border-border-dark'
      )}
    >
      <View className="mr-3">
        {isSuccess && <CheckCircle2 size={20} color="#22C55E" />}
        {isError && <AlertCircle size={20} color="#EF4444" />}
        {!isSuccess && !isError && <Info size={20} color="#3B82F6" />}
      </View>

      <Text
        className={cn(
          'flex-1 text-sm font-medium',
          isSuccess && 'text-green-100',
          isError && 'text-red-100',
          !isSuccess && !isError && 'text-content-light dark:text-content-dark'
        )}
      >
        {item.message}
      </Text>

      <TouchableOpacity onPress={onDismiss} className="p-1 ml-2">
        <X size={16} color="#8E92B0" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};
