import React from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pseudonym: string;
  isLoading?: boolean;
}

export const BlockConfirmDialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  pseudonym,
  isLoading = false,
}) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Block ${pseudonym}?`}
      description={`Are you sure you want to block ${pseudonym}? This will immediately end your conversation, prevent them from messaging you, and hide both of your profiles from discovery. You can unblock them anytime in Settings.`}
      confirmText="Block User"
      variant="danger"
      isLoading={isLoading}
    />
  );
};

export const EndChatDialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  pseudonym,
  isLoading = false,
}) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="End Conversation?"
      description={`Are you sure you want to end this conversation with ${pseudonym}? Neither of you will be able to send further messages in this thread.`}
      confirmText="End Conversation"
      variant="danger"
      isLoading={isLoading}
    />
  );
};

export const DeleteChatDialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  pseudonym,
  isLoading = false,
}) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Conversation?"
      description={`Are you sure you want to remove this conversation with ${pseudonym} from your inbox? This will hide the conversation on your side.`}
      confirmText="Delete"
      variant="danger"
      isLoading={isLoading}
    />
  );
};

