import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 text-primary border border-border shadow-sm mb-4">
        <HelpCircle className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-text">Page Not Found</h1>
      <p className="mt-2 text-sm text-muted max-w-sm">
        The page you are looking for doesn't exist, has been moved, or is restricted.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/">
          <Button variant="secondary" size="md" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Home
          </Button>
        </Link>
        <Link to="/app">
          <Button variant="primary" size="md">
            Go to App
          </Button>
        </Link>
      </div>
    </div>
  );
};
