import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MessageSquare, Compass, ShieldCheck } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { useChatThread } from '@/hooks/useChatThread';
import { useSocket } from '@/hooks/useSocket';
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
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';
import type { ReportReason } from '@/types/api';

export const Chat: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Socket connection manager
  useSocket();

  // Conversations list & actions
  const {
    conversations,
    isLoading: isConversationsLoading,
    endConversation,
    deleteConversation,
    blockUser,
    submitReport,
    isReporting,
    isBlocking,
    isEnding,
    isDeleting,
  } = useConversations();

  // Active conversation object
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === id),
    [conversations, id],
  );

  // Active thread data and real-time state
  const {
    messages,
    isLoading: isMessagesLoading,
    sendMessage,
    isSending,
    isPartnerTyping,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    handleUserTyping,
    handleStopTyping,
    rateLimitCountdown,
  } = useChatThread(id);

  // Dialog & Modal states
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Typing state map for conversation list
  const typingMap = useMemo(() => {
    if (id && isPartnerTyping) {
      return { [id]: true };
    }
    return {};
  }, [id, isPartnerTyping]);

  const handleSelectConversation = (conversationId: string) => {
    navigate(`/app/chat/${conversationId}`);
  };

  const handleBack = () => {
    navigate('/app/chat');
  };

  const handleConfirmReport = (reason: ReportReason, details?: string) => {
    if (!activeConversation) return;
    submitReport({
      memberId: activeConversation.other.id,
      conversationId: activeConversation.id,
      reason,
      details,
    });
    setIsReportOpen(false);
  };

  const handleConfirmBlock = () => {
    if (!activeConversation) return;
    blockUser(activeConversation.other.id);
    setIsBlockOpen(false);
  };

  const handleConfirmEnd = () => {
    if (!activeConversation) return;
    endConversation(activeConversation.id);
    setIsEndOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!activeConversation) return;
    deleteConversation(activeConversation.id);
    setIsDeleteOpen(false);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-bg">
      {/* Left Pane: Conversation List */}
      <div
        className={cn(
          id ? 'hidden md:flex' : 'flex',
          'h-full w-full md:w-80 lg:w-96 shrink-0',
        )}
      >
        <ConversationList
          conversations={conversations}
          selectedId={id}
          onSelect={handleSelectConversation}
          isLoading={isConversationsLoading}
          typingMap={typingMap}
        />
      </div>

      {/* Right Pane: Active Thread or Placeholder */}
      <div
        className={cn(
          !id ? 'hidden md:flex' : 'flex',
          'flex-1 flex-col h-full bg-surface min-w-0 overflow-hidden relative',
        )}
      >
        {id ? (
          activeConversation ? (
            <>
              {/* Chat Header */}
              <ChatHeader
                conversation={activeConversation}
                onBack={handleBack}
                isTyping={isPartnerTyping}
                onReport={() => setIsReportOpen(true)}
                onBlock={() => setIsBlockOpen(true)}
                onEnd={() => setIsEndOpen(true)}
                onDelete={() => setIsDeleteOpen(true)}
              />

              {/* Message List */}
              {isMessagesLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Spinner size="lg" />
                </div>
              ) : (
                <MessageList
                  messages={messages}
                  partnerAvatarColor={activeConversation.other.avatarColor}
                  partnerPseudonym={activeConversation.other.anonUsername}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  onLoadEarlier={fetchNextPage}
                  isPartnerTyping={isPartnerTyping}
                />
              )}

              {/* Chat Composer */}
              <ChatComposer
                onSend={sendMessage}
                onTyping={handleUserTyping}
                onStopTyping={handleStopTyping}
                disabled={isSending}
                isEnded={activeConversation.status === 'ended'}
                rateLimitCountdown={rateLimitCountdown}
              />
            </>
          ) : isConversationsLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="h-14 w-14 rounded-2xl bg-muted/10 flex items-center justify-center text-muted mb-3">
                <MessageSquare className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-text mb-1">
                Conversation Not Found
              </h3>
              <p className="text-xs text-muted max-w-sm mb-4">
                This conversation may have been deleted or the participant account was closed.
              </p>
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-hover transition-colors"
              >
                Back to Messages
              </button>
            </div>
          )
        ) : (
          /* Empty Selection Placeholder (Desktop only) */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
            <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
              <MessageSquare className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold text-text mb-2">
              Select a conversation to start chatting
            </h2>
            <p className="text-xs text-muted max-w-md mb-6 leading-relaxed">
              All messages in Anonchat are 100% pseudonymous. You and your chat partner only see anonymous handles and curated avatar colors.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                to="/app/discover"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-hover transition-colors shadow-sm"
              >
                <Compass className="h-4 w-4" />
                Discover Members
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-2 text-xs text-muted/70">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Zero real names · Zero email leakage · Anti-spam protected</span>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Dialogs */}
      {activeConversation && (
        <>
          <ReportModal
            isOpen={isReportOpen}
            onClose={() => setIsReportOpen(false)}
            reportedPseudonym={activeConversation.other.anonUsername}
            onSubmit={handleConfirmReport}
            isSubmitting={isReporting}
          />

          <BlockConfirmDialog
            isOpen={isBlockOpen}
            onClose={() => setIsBlockOpen(false)}
            onConfirm={handleConfirmBlock}
            pseudonym={activeConversation.other.anonUsername}
            isLoading={isBlocking}
          />

          <EndChatDialog
            isOpen={isEndOpen}
            onClose={() => setIsEndOpen(false)}
            onConfirm={handleConfirmEnd}
            pseudonym={activeConversation.other.anonUsername}
            isLoading={isEnding}
          />

          <DeleteChatDialog
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleConfirmDelete}
            pseudonym={activeConversation.other.anonUsername}
            isLoading={isDeleting}
          />
        </>
      )}
    </div>
  );
};
