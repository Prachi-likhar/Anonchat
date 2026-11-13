import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

export const AdminRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/admin" replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-bg p-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-text">Access Denied</h1>
        <p className="mt-2 text-sm text-muted max-w-sm">
          You do not have staff permissions to view the administration portal.
        </p>
        <div className="mt-6">
          <Button variant="primary" onClick={() => (window.location.href = '/app')}>
            Back to App
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
