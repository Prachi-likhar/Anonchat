import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ConversationItem } from '@/components/chat/ConversationItem';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ReportModal } from '@/components/chat/ReportModal';
import {
  BlockConfirmDialog,
  EndChatDialog,
  DeleteChatDialog,
} from '@/components/chat/ChatDialogs';
import type { Conversation, Message } from '@/types/api';

const mockConversation: Conversation = {
  id: 'conv-123',
  other: {
    id: 'user-456',
    anonUsername: 'Anonymous_4821',
    gender: 'female',
    avatarColor: '#EC4899',
    isOnline: true,
    blockedByMe: false,
  },
  lastMessage: {
    id: 'msg-1',
    body: 'Hello there, how are you?',
    createdAt: new Date().toISOString(),
    mine: false,
  },
  unreadCount: 3,
  status: 'active',
  endedByMe: false,
  updatedAt: new Date().toISOString(),
};

const mockEndedConversation: Conversation = {
  ...mockConversation,
  id: 'conv-999',
  other: {
    ...mockConversation.other,
    anonUsername: 'Anonymous_9000',
    isOnline: false,
  },
  status: 'ended',
  unreadCount: 0,
};

const mockMyMessage: Message = {
  id: 'msg-mine',
  conversationId: 'conv-123',
  mine: true,
  body: 'Hey! Nice to meet you anonymously.',
  createdAt: new Date().toISOString(),
  readAt: new Date().toISOString(),
};

const mockOtherMessage: Message = {
  id: 'msg-other',
  conversationId: 'conv-123',
  mine: false,
  body: 'Nice to meet you too!',
  createdAt: new Date().toISOString(),
  readAt: null,
};

describe('Phase 4: Chat Components & Flows', () => {
  describe('ConversationItem', () => {
    it('renders pseudonym, preview, time, unread count and preserves privacy', () => {
      const handleClick = vi.fn();
      const { container } = render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={false}
          onClick={handleClick}
        />,
      );

      expect(screen.getByText('Anonymous_4821')).toBeInTheDocument();
      expect(screen.getByText('Hello there, how are you?')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();

      // Privacy checks
      expect(container.textContent).not.toMatch(/@/);
      expect(container.textContent).not.toMatch(/gmail|yahoo|hotmail/i);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders typing preview when partner is typing', () => {
      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={false}
          isTyping={true}
          onClick={vi.fn()}
        />,
      );

      expect(screen.getByText('Typing...')).toBeInTheDocument();
    });

    it('renders Ended badge when conversation status is ended', () => {
      render(
        <ConversationItem
          conversation={mockEndedConversation}
          isSelected={false}
          onClick={vi.fn()}
        />,
      );

      expect(screen.getByText('Ended')).toBeInTheDocument();
    });
  });

  describe('ConversationList', () => {
    it('renders search input and filters conversations by pseudonym', async () => {
      const handleSelect = vi.fn();
      render(
        <BrowserRouter>
          <ConversationList
            conversations={[mockConversation, mockEndedConversation]}
            onSelect={handleSelect}
            isLoading={false}
          />
        </BrowserRouter>,
      );

      expect(screen.getByText('Anonymous_4821')).toBeInTheDocument();
      expect(screen.getByText('Anonymous_9000')).toBeInTheDocument();

      const searchInput = screen.getByPlaceholderText(/search conversations/i);
      await userEvent.type(searchInput, '9000');

      expect(screen.queryByText('Anonymous_4821')).not.toBeInTheDocument();
      expect(screen.getByText('Anonymous_9000')).toBeInTheDocument();
    });
  });

  describe('ChatHeader', () => {
    it('renders partner info, status, and dropdown menu actions', async () => {
      const handleReport = vi.fn();
      const handleBlock = vi.fn();
      const handleEnd = vi.fn();
      const handleDelete = vi.fn();

      render(
        <ChatHeader
          conversation={mockConversation}
          onReport={handleReport}
          onBlock={handleBlock}
          onEnd={handleEnd}
          onDelete={handleDelete}
        />,
      );

      expect(screen.getByText('Anonymous_4821')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();

      // Open options dropdown
      const menuButton = screen.getByLabelText(/chat options/i);
      fireEvent.click(menuButton);

      expect(screen.getByText(/end conversation/i)).toBeInTheDocument();
      expect(screen.getByText(/delete conversation/i)).toBeInTheDocument();
      expect(screen.getByText(/report user/i)).toBeInTheDocument();
      expect(screen.getByText(/block user/i)).toBeInTheDocument();

      // Click Report
      fireEvent.click(screen.getByText(/report user/i));
      expect(handleReport).toHaveBeenCalledTimes(1);
    });
  });

  describe('MessageBubble & MessageList', () => {
    it('renders mine message with double read ticks and other message with avatar', () => {
      const { container } = render(
        <MessageList
          messages={[mockMyMessage, mockOtherMessage]}
          partnerAvatarColor="#EC4899"
          partnerPseudonym="Anonymous_4821"
          hasNextPage={false}
          isFetchingNextPage={false}
          onLoadEarlier={vi.fn()}
        />,
      );

      expect(screen.getByText('Hey! Nice to meet you anonymously.')).toBeInTheDocument();
      expect(screen.getByText('Nice to meet you too!')).toBeInTheDocument();

      // Check read tick
      expect(screen.getByLabelText('Read')).toBeInTheDocument();

      // Privacy verification: absolute zero leakage of personal data
      expect(container.textContent).not.toMatch(/@/);
      expect(container.textContent).not.toMatch(/john|jane|smith|doe/i);
    });

    it('renders empty conversation prompt when no messages exist', () => {
      render(
        <MessageList
          messages={[]}
          partnerAvatarColor="#EC4899"
          partnerPseudonym="Anonymous_4821"
          hasNextPage={false}
          isFetchingNextPage={false}
          onLoadEarlier={vi.fn()}
        />,
      );

      expect(screen.getByText(/say hi/i)).toBeInTheDocument();
      expect(screen.getByText('Anonymous_4821')).toBeInTheDocument();
    });
  });

  describe('ChatComposer', () => {
    it('allows typing and triggers onSend on enter or click', async () => {
      const handleSend = vi.fn();
      const handleTyping = vi.fn();
      const handleStopTyping = vi.fn();

      render(
        <ChatComposer
          onSend={handleSend}
          onTyping={handleTyping}
          onStopTyping={handleStopTyping}
        />,
      );

      const textarea = screen.getByPlaceholderText(/type a message/i);
      await userEvent.type(textarea, 'Hello world');

      expect(handleTyping).toHaveBeenCalled();

      // Click send button
      const sendButton = screen.getByLabelText(/send message/i);
      fireEvent.click(sendButton);

      expect(handleSend).toHaveBeenCalledWith('Hello world');
      expect(textarea).toHaveValue('');
    });

    it('disables input and shows banner when conversation is ended', () => {
      render(
        <ChatComposer
          onSend={vi.fn()}
          onTyping={vi.fn()}
          onStopTyping={vi.fn()}
          isEnded={true}
        />,
      );

      expect(screen.getByText(/this conversation has ended/i)).toBeInTheDocument();
      const textarea = screen.getByPlaceholderText(/conversation ended/i);
      expect(textarea).toBeDisabled();
    });

    it('shows rate-limit countdown banner when active', () => {
      render(
        <ChatComposer
          onSend={vi.fn()}
          onTyping={vi.fn()}
          onStopTyping={vi.fn()}
          rateLimitCountdown={8}
        />,
      );

      expect(screen.getByText(/anti-spam rate limit active/i)).toBeInTheDocument();
      expect(screen.getByText(/8s/)).toBeInTheDocument();
    });
  });

  describe('ReportModal', () => {
    it('renders reasons, details input, snapshot notice, and submits data', async () => {
      const handleSubmit = vi.fn();
      const handleClose = vi.fn();

      render(
        <ReportModal
          isOpen={true}
          onClose={handleClose}
          reportedPseudonym="Anonymous_4821"
          onSubmit={handleSubmit}
        />,
      );

      expect(screen.getByText(/report anonymous_4821/i)).toBeInTheDocument();
      expect(screen.getByText(/harassment or bullying/i)).toBeInTheDocument();
      expect(screen.getByText(/snapshot of the latest messages/i)).toBeInTheDocument();

      // Change reason to Spam
      const spamRadio = screen.getByLabelText(/spam or advertising/i);
      fireEvent.click(spamRadio);

      // Enter details
      const detailsInput = screen.getByPlaceholderText(/provide any specific details/i);
      await userEvent.type(detailsInput, 'Sending repeated spam links');

      // Submit
      const submitButton = screen.getByRole('button', { name: /submit report/i });
      fireEvent.click(submitButton);

      expect(handleSubmit).toHaveBeenCalledWith('spam', 'Sending repeated spam links');
    });
  });

  describe('Chat Dialogs', () => {
    it('renders BlockConfirmDialog and triggers onConfirm', () => {
      const handleConfirm = vi.fn();
      render(
        <BlockConfirmDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={handleConfirm}
          pseudonym="Anonymous_4821"
        />,
      );

      expect(screen.getByRole('heading', { name: /block anonymous_4821\?/i })).toBeInTheDocument();
      const blockBtn = screen.getByRole('button', { name: /block user/i });
      fireEvent.click(blockBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('renders EndChatDialog and triggers onConfirm', () => {
      const handleConfirm = vi.fn();
      render(
        <EndChatDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={handleConfirm}
          pseudonym="Anonymous_4821"
        />,
      );

      expect(screen.getByRole('heading', { name: /end conversation\?/i })).toBeInTheDocument();
      const endBtn = screen.getByRole('button', { name: /end conversation/i });
      fireEvent.click(endBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('renders DeleteChatDialog and triggers onConfirm', () => {
      const handleConfirm = vi.fn();
      render(
        <DeleteChatDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={handleConfirm}
          pseudonym="Anonymous_4821"
        />,
      );

      expect(screen.getByRole('heading', { name: /delete conversation\?/i })).toBeInTheDocument();
      const deleteBtn = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });
  });
});

