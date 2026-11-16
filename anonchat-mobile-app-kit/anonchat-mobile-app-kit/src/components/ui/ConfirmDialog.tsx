import React from 'react';
import { View, Text, Modal, TouchableWithoutFeedback } from 'react-native';
import { Button } from './Button';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <TouchableWithoutFeedback>
            <View className="w-full max-w-sm rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 shadow-2xl">
              <Text className="text-xl font-bold text-content-light dark:text-content-dark mb-2">
                {title}
              </Text>
              <Text className="text-sm text-muted-light dark:text-muted-dark mb-6 leading-relaxed">
                {message}
              </Text>

              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Button
                    title={cancelLabel}
                    variant="secondary"
                    size="md"
                    onPress={onCancel}
                    disabled={loading}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    title={confirmLabel}
                    variant={isDestructive ? 'danger' : 'primary'}
                    size="md"
                    onPress={onConfirm}
                    loading={loading}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
