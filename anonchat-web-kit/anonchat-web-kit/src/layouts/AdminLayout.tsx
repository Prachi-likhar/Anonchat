import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Flag,
  Activity,
  ArrowLeft,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

export const AdminLayout: React.FC = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const adminNav = [
    { label: 'Overview', path: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Users', path: '/admin/users', icon: <Users className="h-4 w-4" /> },
    { label: 'Reports', path: '/admin/reports', icon: <Flag className="h-4 w-4" /> },
    { label: 'Activity', path: '/admin/activity', icon: <Activity className="h-4 w-4" /> },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-text">
      {/* Admin Sidebar */}
      <aside className="w-64 flex flex-col justify-between border-r border-border bg-surface p-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-text">Admin Console</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="warning" size="sm">
                  Staff
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {adminNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold'
                      : 'text-muted hover:bg-surface-2 hover:text-text',
                  )
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer controls */}
        <div className="space-y-3 pt-4 border-t border-border">
          <Link
            to="/app"
            className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium text-muted hover:text-text hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to User App</span>
          </Link>

          <div className="flex items-center justify-between px-2 pt-2">
            <span className="text-xs text-muted truncate">{user?.email}</span>
            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
};
