import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemberCard } from '@/components/members/MemberCard';
import { MemberFilters } from '@/components/members/MemberFilters';
import { AvatarColorPicker } from '@/components/profile/AvatarColorPicker';
import { AVATAR_COLORS } from '@/lib/constants';
import { Profile } from '@/pages/Profile';
import { useAuthStore } from '@/store/authStore';
import type { PublicMember, Me } from '@/types/api';

vi.mock('@/api/me', () => ({
  meApi: {
    getMe: vi.fn(),
    updateMe: vi.fn(),
    changePassword: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

vi.mock('@/api/members', () => ({
  membersApi: {
    getMembers: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
  },
}));

vi.mock('@/api/conversations', () => ({
  conversationsApi: {
    getConversations: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    getUnreadCount: vi.fn().mockResolvedValue({ total: 0 }),
    startConversation: vi.fn(),
  },
}));

vi.mock('@/api/blocks', () => ({
  blocksApi: {
    getBlockedUsers: vi.fn().mockResolvedValue({ items: [] }),
    unblockUser: vi.fn(),
  },
}));

const mockMember: PublicMember = {
  id: 'user-uuid-1',
  anonUsername: 'Anonymous_4821',
  gender: 'male',
  avatarColor: '#7C3AED',
  isOnline: true,
  blockedByMe: false,
};

const mockMe: Me = {
  id: 'me-uuid',
  anonUsername: 'Anonymous_9999',
  fullName: 'Real Private Name',
  email: 'private_user@example.com',
  gender: 'female',
  avatarColor: '#EC4899',
  role: 'user',
  theme: 'system',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('Phase 3: Member Discovery, Profile & Settings', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useAuthStore.getState().setAuth(mockMe, 'mock-access-token');
  });

  describe('MemberCard', () => {
    it('renders pseudonym, avatar, and online indicator with strict privacy', () => {
      const handleStartChat = vi.fn();
      const { container } = render(
        <MemberCard member={mockMember} onStartChat={handleStartChat} />,
      );

      // Verify pseudonym visible
      expect(screen.getByText('Anonymous_4821')).toBeInTheDocument();
      expect(screen.getByText('male')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();

      // Strict privacy assertions
      const html = container.innerHTML;
      expect(html).not.toMatch(/@/);
      expect(html).not.toMatch(/email/i);
      expect(html).not.toMatch(/fullName/i);
      expect(html).not.toMatch(/Real Private Name/i);

      // Verify Start Chat button
      const btn = screen.getByRole('button', { name: /start chat/i });
      fireEvent.click(btn);
      expect(handleStartChat).toHaveBeenCalledWith(mockMember.id);
    });
  });

  describe('MemberFilters', () => {
    it('renders search input and filter chips and invokes callbacks', () => {
      const onSearchChange = vi.fn();
      const onFilterChange = vi.fn();

      render(
        <MemberFilters
          search="4821"
          onSearchChange={onSearchChange}
          filter="all"
          onFilterChange={onFilterChange}
          totalCount={42}
        />,
      );

      expect(screen.getByDisplayValue('4821')).toBeInTheDocument();
      expect(screen.getByText(/showing/i)).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();

      // Click Online filter chip
      const onlineChip = screen.getByRole('button', { name: /online/i });
      fireEvent.click(onlineChip);
      expect(onFilterChange).toHaveBeenCalledWith('online');

      // Click Male Only filter chip
      const maleChip = screen.getByRole('button', { name: /♂\s*Male Only/i });
      fireEvent.click(maleChip);
      expect(onFilterChange).toHaveBeenCalledWith('male');
    });
  });

  describe('AvatarColorPicker', () => {
    it('renders 12 color swatches and triggers onChange', () => {
      const handleChange = vi.fn();
      render(<AvatarColorPicker value="#7C3AED" onChange={handleChange} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(12);

      // Click second color swatch
      fireEvent.click(buttons[1]);
      expect(handleChange).toHaveBeenCalledWith(AVATAR_COLORS[1]);
    });
  });

  describe('Profile Page', () => {
    it('masks email address and shows permanent anonymous pseudonym', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Profile />
          </BrowserRouter>
        </QueryClientProvider>,
      );

      // Verify permanent pseudonym
      expect(screen.getByText('Anonymous_9999')).toBeInTheDocument();

      // Verify masked email (should NOT render plain email)
      expect(screen.queryByDisplayValue('private_user@example.com')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('p***r@example.com')).toBeInTheDocument();

      // Verify save changes button
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      // Verify danger zone delete button
      expect(screen.getByRole('button', { name: /delete account permanently/i })).toBeInTheDocument();
    });
  });
});
