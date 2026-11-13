import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, MessageSquare, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';

export const Landing: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="relative overflow-hidden py-16 sm:py-24">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />

      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Next-gen Anonymous 1-on-1 Community</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-text leading-tight">
          Talk freely.{' '}
          <span className="bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
            Stay anonymous.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted leading-relaxed">
          Connect one-to-one with verified members under permanent pseudonyms. No real names, no
          photos, no snooping. Real-time private conversations with complete peace of mind.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {isAuthenticated ? (
            <Link to="/app">
              <Button size="lg" variant="primary">
                Open App Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button size="lg" variant="primary">
                  Create Anonymous Account
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="secondary">
                  Member Sign In
                </Button>
              </Link>
            </>
          )}
          <Link to="/dev/ui">
            <Button size="lg" variant="ghost">
              Explore Design System (/dev/ui)
            </Button>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3 text-left">
          <Card variant="glass" isHoverable>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-text text-base">Permanent Pseudonyms</h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Your real identity is strictly shielded. You are known only as Anonymous_xxxx with
              custom avatar styling.
            </p>
          </Card>

          <Card variant="glass" isHoverable>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500 mb-4">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-text text-base">Instant Real-Time Chat</h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Live typing indicators, real-time message delivery, and instant read receipts powered
              by secure WebSocket links.
            </p>
          </Card>

          <Card variant="glass" isHoverable>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 mb-4">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-text text-base">Community Safety</h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Block and report with 30-message audit snapshots. Robust anti-spam and strict rate
              limiting keep the space safe.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
