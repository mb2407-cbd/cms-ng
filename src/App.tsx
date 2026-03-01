/**
 * @file App.tsx
 * @description Root application component with routing and context providers
 * @author VLS Team
 * @date 2026-02-15
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/login/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProgramsPage from './pages/programs/ProgramsPage';
import ProgramDetailPage from './pages/programs/ProgramDetailPage';
import ChannelsPage from './pages/channels/ChannelsPage';
import ChannelDetailPage from './pages/channels/ChannelDetailPage';
import SchedulePage from './pages/schedules/SchedulePage';
import AssetsPage from './pages/assets/AssetsPage';
import AssetDetailPage from './pages/assets/AssetDetailPage';
import ProgramMappingPage from './pages/workflows/ProgramMappingPage';
import HomepagesPage from './pages/homepages/HomepagesPage';

/** React Query client with sensible defaults */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Placeholder page component for features not yet implemented.
 */
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h2 className="text-xl font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
        {title}
      </h2>
      <p className="text-[var(--color-neutral-500)] mt-2">
        This feature is under development.
      </p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes within main layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="homepages" element={<HomepagesPage />} />
                <Route path="programs" element={<ProgramsPage />} />
                <Route path="programs/:id" element={<ProgramDetailPage />} />
                <Route path="channels" element={<ChannelsPage />} />
                <Route path="channels/:channelId" element={<ChannelDetailPage />} />
                <Route path="channels/:channelId/schedule" element={<SchedulePage />} />
                <Route path="schedules" element={<PlaceholderPage title="Schedule Management" />} />
                <Route path="assets" element={<AssetsPage />} />
                <Route path="assets/:assetId/:dmsId" element={<AssetDetailPage />} />
                <Route path="reports/published/channels" element={<PlaceholderPage title="Published Channels (Read Only)" />} />
                <Route path="reports/published/assets" element={<PlaceholderPage title="Published Assets (Read Only)" />} />
                <Route path="reports/published/programs" element={<PlaceholderPage title="Published Programs (Read Only)" />} />
                <Route path="publishing/channels" element={<Navigate to="/reports/published/channels" replace />} />
                <Route path="publishing/assets" element={<Navigate to="/reports/published/assets" replace />} />
                <Route path="publishing/programs" element={<Navigate to="/reports/published/programs" replace />} />
                <Route path="workflows/program-mapping" element={<ProgramMappingPage />} />
                <Route path="admin/settings" element={<PlaceholderPage title="Admin Settings" />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
