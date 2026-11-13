import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Lock } from 'lucide-react';

export const Login: React.FC = () => {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gradient text-white">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Sign In</h1>
          <p className="text-xs text-muted">
            Phase 2 will complete the full interactive login and session restoration.
          </p>
        </div>

        <div className="text-center text-xs text-muted">
          Need an account?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Register
          </Link>
        </div>
      </Card>
    </div>
  );
};
