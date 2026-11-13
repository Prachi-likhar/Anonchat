import React, { useState } from 'react';
import { Sparkles, Shield, MessageSquare, Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SegmentedControl } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, GenderBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { toast } from '@/store/toastStore';
import type { Gender } from '@/types/api';

export const DevUI: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedGender, setSelectedGender] = useState<Gender>('male');
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  return (
    <div className="mx-auto max-w-6xl p-6 sm:p-10 space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Design System & Primitives Gallery</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text mt-1">AnonChat UI Kit</h1>
          <p className="text-sm text-muted mt-1">
            Standard design tokens, interactive components, themes, and states.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle showLabels />
        </div>
      </div>

      {/* 1. Theme & Color Tokens */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-text">1. Theme Tokens (DESIGN_SYSTEM.md)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          <div className="rounded-xl border border-border p-3 bg-bg">
            <div className="h-8 rounded-lg bg-bg border border-border" />
            <p className="mt-2 text-xs font-semibold text-text">bg</p>
            <p className="text-[10px] text-muted">Page Background</p>
          </div>
          <div className="rounded-xl border border-border p-3 bg-surface">
            <div className="h-8 rounded-lg bg-surface border border-border" />
            <p className="mt-2 text-xs font-semibold text-text">surface</p>
            <p className="text-[10px] text-muted">Card / Sidebar</p>
          </div>
          <div className="rounded-xl border border-border p-3 bg-surface-2">
            <div className="h-8 rounded-lg bg-surface-2 border border-border" />
            <p className="mt-2 text-xs font-semibold text-text">surface-2</p>
            <p className="text-[10px] text-muted">Input / Hover</p>
          </div>
          <div className="rounded-xl border border-border p-3 bg-surface">
            <div className="h-8 rounded-lg bg-primary" />
            <p className="mt-2 text-xs font-semibold text-text">primary</p>
            <p className="text-[10px] text-muted">Violet Accent</p>
          </div>
          <div className="rounded-xl border border-border p-3 bg-surface">
            <div className="h-8 rounded-lg bg-accent-gradient" />
            <p className="mt-2 text-xs font-semibold text-text">accent-gradient</p>
            <p className="text-[10px] text-muted">Violet → Pink</p>
          </div>
          <div className="rounded-xl border border-border p-3 bg-surface">
            <div className="h-8 rounded-lg bg-online" />
            <p className="mt-2 text-xs font-semibold text-text">online</p>
            <p className="text-[10px] text-muted">Presence Dot</p>
          </div>
        </div>
      </section>

      {/* 2. Buttons */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-text">2. Buttons</h2>
        <Card className="flex flex-wrap items-center gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" isLoading>
            Loading
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="primary" leftIcon={<Shield className="h-4 w-4" />}>
            With Left Icon
          </Button>
          <Button variant="secondary" rightIcon={<MessageSquare className="h-4 w-4" />}>
            With Right Icon
          </Button>
        </Card>
      </section>

      {/* 3. Inputs & Forms */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-text">3. Inputs & Selects</h2>
        <Card className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <Input
            label="Standard Input"
            placeholder="Type something..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setInputError(e.target.value.length < 3 ? 'Minimum 3 chars required' : '');
            }}
            hint="Helper text explaining field"
            error={inputError}
          />

          <Input
            label="Search Input"
            placeholder="Search anon members..."
            leftIcon={<Search className="h-4 w-4" />}
          />

          <Input
            label="Password Input"
            type="password"
            defaultValue="Secret123!"
            hint="Supports show/hide toggle"
          />

          <Select
            label="Dropdown Select"
            options={[
              { value: 'all', label: 'All Members' },
              { value: 'online', label: 'Online Only' },
              { value: 'female', label: 'Female Only' },
              { value: 'male', label: 'Male Only' },
            ]}
          />

          <div className="sm:col-span-2">
            <SegmentedControl
              label="Gender Segmented Control"
              value={selectedGender}
              onChange={setSelectedGender}
              options={[
                { value: 'male', label: 'Male', icon: <span>♂</span> },
                { value: 'female', label: 'Female', icon: <span>♀</span> },
              ]}
            />
          </div>
        </Card>
      </section>

      {/* 4. Avatars & Badges */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-text">4. Avatars & Badges</h2>
        <Card className="space-y-6">
          <div className="flex flex-wrap items-center gap-6">
            <Avatar
              anonUsername="Anonymous_4821"
              avatarColor="#7C3AED"
              size="xl"
              showOnlineStatus
              isOnline
            />
            <Avatar
              anonUsername="Anonymous_1204"
              avatarColor="#EC4899"
              size="lg"
              showOnlineStatus
              isOnline
            />
            <Avatar
              anonUsername="Anonymous_8832"
              avatarColor="#0EA5E9"
              size="md"
              showOnlineStatus
              isOnline={false}
            />
            <Avatar
              anonUsername="Anonymous_9901"
              avatarColor="#10B981"
              size="sm"
              showOnlineStatus
              isOnline
            />
            <Avatar anonUsername="Anonymous_5544" avatarColor="#F59E0B" size="xs" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <GenderBadge gender="male" />
            <GenderBadge gender="female" />
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Online</Badge>
            <Badge variant="danger">Banned</Badge>
            <Badge variant="warning">Suspended</Badge>
            <Badge variant="neutral">Offline</Badge>
          </div>
        </Card>
      </section>

      {/* 5. Toast Notifications */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-text">5. Toast Notifications</h2>
        <Card className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => toast.info('Welcome to AnonChat anonymous messaging!')}
          >
            Info Toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.success('Your anonymous identity was verified!', 'Success')}
          >
            Success Toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.warning('You have 2 minutes before rate-limit resets.', 'Warning')}
          >
            Warning Toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.error('Failed to deliver message. Please retry.', 'Error')}
          >
            Error Toast
          </Button>
        </Card>
      </section>

      {/* 6. Modals & Dialogs */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-text">6. Modals & Dialogs</h2>
        <Card className="flex flex-wrap gap-4">
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Open Sample Modal
          </Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Open Confirm Dialog
          </Button>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Anonymous Guidelines"
            description="Important privacy notices for members"
          >
            <div className="space-y-3 text-sm text-muted">
              <p>1. Never share real names, emails, phone numbers, or social handles.</p>
              <p>2. Your anonymous username is permanently linked to your verified account.</p>
              <div className="pt-2 flex justify-end">
                <Button variant="primary" onClick={() => setModalOpen(false)}>
                  Got it
                </Button>
              </div>
            </div>
          </Modal>

          <ConfirmDialog
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={() => {
              setConfirmOpen(false);
              toast.success('Action successfully confirmed.');
            }}
            title="Block Anonymous_4821?"
            description="You will no longer receive messages from this member. Active conversation will be terminated."
            confirmText="Block Member"
          />
        </Card>
      </section>

      {/* 7. Loading Skeletons & Spinners */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-text">7. Skeletons & Spinners</h2>
        <Card className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" className="h-10 w-10" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>

          <div className="flex items-center justify-around">
            <Spinner size="xs" />
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </div>
        </Card>
      </section>

      {/* 8. Empty State */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-text">8. Empty State</h2>
        <EmptyState
          icon={<Heart className="h-6 w-6" />}
          title="No conversations yet"
          description="Start exploring verified anonymous community members to begin a private conversation."
          action={{
            label: 'Explore Discover Grid',
            onClick: () => toast.info('Navigating to Discover...'),
          }}
        />
      </section>
    </div>
  );
};
