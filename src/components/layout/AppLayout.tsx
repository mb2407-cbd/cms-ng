/**
 * @file AppLayout.tsx
 * @description Main application layout with navigation, content area, and status bar
 * @author VLS Team
 * @date 2026-02-15
 */
import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import StatusBar from './StatusBar';
import ChatPanel from './ChatPanel';
import { useApp } from '../../context/AppContext';

const AppLayout: React.FC = () => {
  const { loadReferenceData } = useApp();

  // Load reference data (genres, ratings, etc.) on mount
  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  return (
    <div className="h-screen flex flex-col bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-900)]">
      <TopNav />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <ChatPanel />
      <StatusBar />
    </div>
  );
};

export default AppLayout;
