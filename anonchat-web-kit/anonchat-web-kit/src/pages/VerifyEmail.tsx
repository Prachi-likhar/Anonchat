import React from 'react';
import { Card } from '@/components/ui/Card';
import { Mail } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 text-center space-y-4">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold text-text">Verify Email</h1>
        <p className="text-xs text-muted">
          6-digit OTP verification interface will be implemented in Phase 2.
        </p>
      </Card>
    </div>
  );
};
