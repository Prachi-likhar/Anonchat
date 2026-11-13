import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Register } from '@/pages/Register';
import { VerifyEmail } from '@/pages/VerifyEmail';
import { Login } from '@/pages/Login';
import { calculatePasswordStrength } from '@/lib/validators';
import { authApi } from '@/api/auth';

vi.mock('@/api/auth', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    verifyEmail: vi.fn(),
    resendOtp: vi.fn(),
  },
}));

describe('Auth Pages & Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PasswordStrength utility', () => {
    it('rates short passwords as Weak', () => {
      const res = calculatePasswordStrength('short1');
      expect(res.label).toBe('Weak');
      expect(res.score).toBe(1);
    });

    it('rates complex passwords as Good or Strong', () => {
      const res = calculatePasswordStrength('StrongP@ssw0rd!');
      expect(res.score).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Register page', () => {
    it('renders all required registration fields and privacy notice', () => {
      render(
        <BrowserRouter>
          <Register />
        </BrowserRouter>,
      );

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByText(/100% anonymous identity/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('shows validation errors when submitting empty form', async () => {
      render(
        <BrowserRouter>
          <Register />
        </BrowserRouter>,
      );

      const submitBtn = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('VerifyEmail page', () => {
    it('renders 6 input boxes for OTP verification', () => {
      render(
        <BrowserRouter>
          <VerifyEmail />
        </BrowserRouter>,
      );

      for (let i = 1; i <= 6; i++) {
        expect(screen.getByLabelText(`Digit ${i}`)).toBeInTheDocument();
      }
      expect(
        screen.getByRole('button', { name: /verify & unlock pseudonym/i }),
      ).toBeInTheDocument();
    });

    it('updates digit value when typed', () => {
      render(
        <BrowserRouter>
          <VerifyEmail />
        </BrowserRouter>,
      );

      const firstBox = screen.getByLabelText('Digit 1') as HTMLInputElement;
      fireEvent.change(firstBox, { target: { value: '5' } });
      expect(firstBox.value).toBe('5');
    });
  });

  describe('Login page', () => {
    it('renders email, password, and sign in button', () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>,
      );

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in to app/i })).toBeInTheDocument();
    });

    it('displays suspension modal when API returns ACCOUNT_SUSPENDED', async () => {
      vi.mocked(authApi.login).mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          data: {
            error: {
              code: 'ACCOUNT_SUSPENDED',
              message: 'Account suspended',
              details: {
                until: '2026-12-01T00:00:00Z',
                reason: 'Spamming behavior detected',
              },
            },
          },
        },
      });

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>,
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const submitBtn = screen.getByRole('button', { name: /sign in to app/i });

      fireEvent.change(emailInput, { target: { value: 'suspended@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'ValidPassword1' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/account suspended/i)).toBeInTheDocument();
        expect(screen.getByText(/spamming behavior detected/i)).toBeInTheDocument();
      });
    });

    it('displays ban banner when API returns ACCOUNT_BANNED', async () => {
      vi.mocked(authApi.login).mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          data: {
            error: {
              code: 'ACCOUNT_BANNED',
              message: 'Account permanently banned',
            },
          },
        },
      });

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>,
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const submitBtn = screen.getByRole('button', { name: /sign in to app/i });

      fireEvent.change(emailInput, { target: { value: 'banned@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'ValidPassword1' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/account permanently banned/i)).toBeInTheDocument();
      });
    });
  });
});
