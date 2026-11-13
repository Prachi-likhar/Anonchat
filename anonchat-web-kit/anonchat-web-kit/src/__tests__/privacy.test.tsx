import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '@/components/ui/Avatar';
import { GenderBadge } from '@/components/ui/Badge';
import type { PublicMember } from '@/types/api';

describe('Privacy and Security Safeguards', () => {
  it('PublicMember representation never leaks real name or email', () => {
    const member: PublicMember = {
      id: 'd9b2d62d-3efc-4e89-9a7f-712803b0dcf8',
      anonUsername: 'Anonymous_7719',
      gender: 'female',
      avatarColor: '#8B5CF6',
      isOnline: true,
      blockedByMe: false,
    };

    const { container } = render(
      <div>
        <Avatar
          anonUsername={member.anonUsername}
          avatarColor={member.avatarColor}
          isOnline={member.isOnline}
          showOnlineStatus
        />
        <span>{member.anonUsername}</span>
        <GenderBadge gender={member.gender} />
      </div>,
    );

    const renderedHtml = container.innerHTML;

    // Strict privacy assertions
    expect(renderedHtml).not.toMatch(/@/);
    expect(renderedHtml).not.toMatch(/email/i);
    expect(renderedHtml).not.toMatch(/fullName/i);
    expect(renderedHtml).not.toMatch(/full_name/i);
    expect(renderedHtml).not.toMatch(/lastSeen/i);
    expect(renderedHtml).not.toMatch(/createdAt/i);

    // Pseudonym is visible
    expect(screen.getByText('Anonymous_7719')).toBeInTheDocument();
    expect(screen.getByText('77')).toBeInTheDocument();
  });
});
