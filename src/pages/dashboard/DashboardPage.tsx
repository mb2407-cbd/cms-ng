/**
 * @file DashboardPage.tsx
 * @description Landing dashboard page with overview widgets
 * @author VLS Team
 * @date 2026-02-15
 */
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tv, Film, Calendar, Package, GitBranch, Activity, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

interface DashboardCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  color: string;
}

const DASHBOARD_CARDS: DashboardCard[] = [
  {
    title: 'Channels',
    description: 'Manage service channels, mappings, and configurations',
    icon: <Tv size={24} />,
    link: '/channels',
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Programs',
    description: 'Search, create, and edit program metadata',
    icon: <Film size={24} />,
    link: '/programs',
    color: 'from-[var(--color-primary-500)] to-[var(--color-primary-700)]',
  },
  {
    title: 'Schedules',
    description: 'View and manage channel schedules',
    icon: <Calendar size={24} />,
    link: '/schedules',
    color: 'from-teal-500 to-teal-600',
  },
  {
    title: 'Assets',
    description: 'VOD asset management and reporting',
    icon: <Package size={24} />,
    link: '/assets',
    color: 'from-orange-500 to-orange-600',
  },
  {
    title: 'Program Mapping',
    description: 'Map provider programs to VLS entities',
    icon: <GitBranch size={24} />,
    link: '/workflows/program-mapping',
    color: 'from-pink-500 to-pink-600',
  },
];

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { loadReferenceData } = useApp();

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-neutral-800)] dark:text-white">
          Welcome back, {user?.username || 'User'}
        </h1>
        <p className="text-[var(--color-neutral-500)] mt-1">
          VLS Media Metadata Management System
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Channels', value: '—', icon: <Activity size={20} />, trend: 'up' },
          { label: 'Programs Today', value: '—', icon: <Film size={20} />, trend: 'up' },
          { label: 'Pending Mappings', value: '—', icon: <Clock size={20} />, trend: 'neutral' },
          { label: 'Alerts', value: '—', icon: <AlertTriangle size={20} />, trend: 'down' },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[var(--color-neutral-800)] rounded-xl p-5 shadow-sm border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]"
          >
            <div className="flex items-center justify-between">
              <div className="text-[var(--color-neutral-500)]">{stat.icon}</div>
            </div>
            <p className="text-2xl font-bold text-[var(--color-neutral-800)] dark:text-white mt-3">
              {stat.value}
            </p>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Navigation Cards */}
      <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
        Quick Navigation
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DASHBOARD_CARDS.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className="group bg-white dark:bg-[var(--color-neutral-800)] rounded-xl p-6 shadow-sm border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] hover:shadow-md hover:border-[var(--color-primary-300)] dark:hover:border-[var(--color-primary-600)] transition-all"
          >
            <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${card.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
              {card.icon}
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white">
              {card.title}
            </h3>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
