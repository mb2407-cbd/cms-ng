/**
 * @file ProtectedRoute.tsx
 * @description Route guard component that redirects unauthenticated users to login
 * @author VLS Team
 * @date 2026-02-15
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRight?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRight }) => {
  const { isAuthenticated, loading, hasRight } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="lg" message="Verifying session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRight && !hasRight(requiredRight)) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
            Access Denied
          </h2>
          <p className="text-[var(--color-neutral-500)] mt-2">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
