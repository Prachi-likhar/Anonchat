import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';

import { Landing } from '@/pages/Landing';
import { Register } from '@/pages/Register';
import { VerifyEmail } from '@/pages/VerifyEmail';
import { Login } from '@/pages/Login';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';

import { Dashboard } from '@/pages/Dashboard';
import { Discover } from '@/pages/Discover';
import { Chat } from '@/pages/Chat';
import { Profile } from '@/pages/Profile';
import { Settings } from '@/pages/Settings';

import { AdminDashboard, UsersPage, ReportsPage, ActivityPage } from '@/pages/admin/AdminDashboard';

import { DevUI } from '@/pages/DevUI';
import { NotFound } from '@/pages/NotFound';

export const router = createBrowserRouter([
  // Public marketing & dev preview
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'dev/ui', element: <DevUI /> },
    ],
  },

  // Public-only guest flows (redirects to /app if already logged in)
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: 'register', element: <Register /> },
          { path: 'verify-email', element: <VerifyEmail /> },
          { path: 'login', element: <Login /> },
          { path: 'forgot-password', element: <ForgotPassword /> },
          { path: 'reset-password', element: <ResetPassword /> },
        ],
      },
    ],
  },

  // Authenticated App Routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/app',
        element: <AppLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'discover', element: <Discover /> },
          { path: 'chat', element: <Chat /> },
          { path: 'chat/:id', element: <Chat /> },
          { path: 'profile', element: <Profile /> },
          { path: 'settings', element: <Settings /> },
        ],
      },
    ],
  },

  // Admin Routes (staff only)
  {
    element: <AdminRoute />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'activity', element: <ActivityPage /> },
        ],
      },
    ],
  },

  // Redirects and 404
  {
    path: '/chat',
    element: <Navigate to="/app/chat" replace />,
  },
  {
    path: '*',
    element: <PublicLayout />,
    children: [{ path: '*', element: <NotFound /> }],
  },
]);
