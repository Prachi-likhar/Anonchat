import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  MessageSquare,
  User,
  Settings,
  ShieldAlert,
  LogOut,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';

export const AppLayout: React.FC = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navItems = [
    { label: 'Dashboard', path: '/app', icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: 'Discover', path: '/app/discover', icon: <Compass className="h-5 w-5" /> },
    { label: 'Chats', path: '/app/chat', icon: <MessageSquare className="h-5 w-5" /> },
    { label: 'Profile', path: '/app/profile', icon: <User className="h-5 w-5" /> },
    { label: 'Settings', path: '/app/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-text">
      {/* Desktop Left Rail (lg:flex) */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-border bg-surface p-4">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-gradient text-white shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                AnonChat
              </span>
              <p className="text-[10px] text-muted">Private & Anonymous</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.path === '/app'
                  ? location.pathname === '/app'
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted hover:bg-surface-2 hover:text-text',
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            {isAdmin && (
              <NavLink
                to="/admin"
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors',
                  location.pathname.startsWith('/admin') && 'bg-amber-500/15 font-semibold',
                )}
              >
                <ShieldAlert className="h-5 w-5" />
                <span>Admin Portal</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* User Card & Controls at bottom */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                anonUsername={user?.anonUsername}
                avatarColor={user?.avatarColor}
                size="sm"
                isOnline={true}
                showOnlineStatus={true}
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-text font-mono">
                  {user?.anonUsername || 'Anonymous'}
                </p>
                <span className="text-[10px] text-muted capitalize">
                  {user?.gender || 'Member'}
                </span>
              </div>
            </div>

            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header (<lg) */}
        <header className="lg:hidden flex h-14 items-center justify-between border-b border-border bg-surface px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-gradient text-white">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
              AnonChat
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-1.5 text-muted hover:text-text hover:bg-surface-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-border bg-surface p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-text hover:bg-surface-2"
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-amber-500 hover:bg-amber-500/10"
              >
                <ShieldAlert className="h-5 w-5" />
                <span>Admin Portal</span>
              </NavLink>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10"
            >
              <LogOut className="h-5 w-5" />
              <span>Log out</span>
            </button>
          </div>
        )}

        {/* Workspace / View Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Tab Bar (<lg) */}
        <nav className="lg:hidden flex h-16 items-center justify-around border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)]">
          {navItems.slice(0, 4).map((item) => {
            const isActive =
              item.path === '/app'
                ? location.pathname === '/app'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors',
                  isActive ? 'text-primary font-semibold' : 'text-muted hover:text-text',
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
