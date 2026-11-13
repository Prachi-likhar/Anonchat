import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, GenderBadge } from '@/components/ui/Badge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

describe('UI Primitives', () => {
  describe('Button', () => {
    it('renders text and handles clicks', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const btn = screen.getByRole('button', { name: /click me/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows loading indicator and disables button when isLoading is true', () => {
      const handleClick = vi.fn();
      render(
        <Button isLoading onClick={handleClick}>
          Submit
        </Button>,
      );

      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
      expect(screen.getByRole('status')).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Avatar', () => {
    it('renders initials extracted from anonymous username', () => {
      render(<Avatar anonUsername="Anonymous_4821" avatarColor="#7C3AED" />);
      expect(screen.getByText('48')).toBeInTheDocument();
    });

    it('renders online presence dot when showOnlineStatus is true', () => {
      render(<Avatar anonUsername="Anonymous_1204" showOnlineStatus isOnline />);
      expect(screen.getByTitle('Online')).toBeInTheDocument();
    });
  });

  describe('Badge & GenderBadge', () => {
    it('renders standard badge', () => {
      render(<Badge variant="primary">Verified</Badge>);
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('renders male badge with icon and label', () => {
      render(<GenderBadge gender="male" />);
      expect(screen.getByText('male')).toBeInTheDocument();
      expect(screen.getByText('♂')).toBeInTheDocument();
    });

    it('renders female badge with icon and label', () => {
      render(<GenderBadge gender="female" />);
      expect(screen.getByText('female')).toBeInTheDocument();
      expect(screen.getByText('♀')).toBeInTheDocument();
    });
  });

  describe('ThemeToggle', () => {
    it('renders toggle button', () => {
      render(<ThemeToggle />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
