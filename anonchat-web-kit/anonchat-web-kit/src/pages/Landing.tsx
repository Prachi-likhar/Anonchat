import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Sparkles,
  MessageSquare,
  Lock,
  ArrowRight,
  UserCheck,
  EyeOff,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';

export const Landing: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  const steps = [
    {
      num: '01',
      title: 'Verify Your Email',
      desc: 'Register with your private credentials and enter a 6-digit OTP code. Your real name and email are permanently sealed.',
      icon: <UserCheck className="h-5 w-5 text-primary" />,
    },
    {
      num: '02',
      title: 'Receive Your Pseudonym',
      desc: 'Our system assigns an unchangeable anonymous identifier (e.g. Anonymous_4821) and custom avatar color.',
      icon: <EyeOff className="h-5 w-5 text-pink-500" />,
    },
    {
      num: '03',
      title: 'Connect & Chat Privately',
      desc: 'Browse active members, start 1-on-1 direct conversations, and chat in real-time with zero snooping.',
      icon: <MessageSquare className="h-5 w-5 text-emerald-500" />,
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="pointer-events-none absolute top-[500px] -right-40 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-3xl -z-10" />

      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-4 pt-16 sm:pt-24 pb-16 text-center sm:px-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary mb-6 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Real-time Anonymous 1-on-1 Community</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-text leading-tight">
          Talk freely.{' '}
          <span className="bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
            Stay anonymous.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted leading-relaxed">
          Connect one-to-one with community members under permanent, verified pseudonyms. No real
          names, no profile photos, no tracking. Real-time conversations with total peace of mind.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
          {isAuthenticated ? (
            <Link to="/app">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Open App ({user?.anonUsername})
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
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
              Component Gallery (/dev/ui)
            </Button>
          </Link>
        </div>

        {/* Live Persona Demonstration Widget */}
        <div className="mt-14 mx-auto max-w-md rounded-2xl border border-border bg-surface/80 backdrop-blur-md p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-border text-xs text-muted">
            <span className="font-semibold text-text flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-primary" /> Active Community Identity
            </span>
            <span className="inline-flex items-center gap-1 text-online font-medium">
              <span className="h-2 w-2 rounded-full bg-online animate-pulse" /> Live Now
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <Avatar
              anonUsername="Anonymous_4821"
              avatarColor="#7C3AED"
              size="lg"
              showOnlineStatus
              isOnline
            />
            <div className="text-left">
              <p className="font-mono font-bold text-sm text-text">Anonymous_4821</p>
              <p className="text-xs text-muted">Pseudonym assigned permanently</p>
              <span className="mt-1 inline-block text-[10px] text-primary bg-primary/10 rounded-md px-2 py-0.5 font-medium">
                Real name & email shielded
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="border-t border-border bg-surface/50 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              How It Works
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
              Three simple steps to absolute privacy
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {steps.map((step) => (
              <Card key={step.num} variant="glass" className="relative space-y-4">
                <span className="text-2xl font-black font-mono text-muted/30">{step.num}</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 border border-border">
                  {step.icon}
                </div>
                <h4 className="font-semibold text-text text-base">{step.title}</h4>
                <p className="text-xs text-muted leading-relaxed">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Guarantees & Honest Limitations */}
      <section className="py-16 sm:py-24 mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Shield className="h-4 w-4" />
              <span>Strict Privacy Architecture</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
              Engineered from the ground up to prevent de-anonymization.
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Every route, message bubble, database query, and socket event conforms strictly to our
              privacy contract. Other users can never view your email, registration name, or
              timestamp of registration.
            </p>

            <ul className="space-y-2.5 text-xs text-muted pt-2">
              <li className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <span>Zero profile pictures, bios, ages, or locations</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <span>One-click block and report with 30-message audit snapshots</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <span>In-memory short-lived access tokens with secure httpOnly cookies</span>
              </li>
            </ul>
          </div>

          <Card variant="glass" className="space-y-4 border-amber-500/20 bg-amber-500/5">
            <h4 className="font-semibold text-text text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Honest Community Note</span>
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              In smaller community cohorts, member categories (e.g. gender and online status) can
              sometimes enable informed guesses about real identities.
            </p>
            <p className="text-xs text-muted leading-relaxed">
              To maximize privacy, please maintain mutual anonymity and never share personal
              identifying information during conversations.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
};
