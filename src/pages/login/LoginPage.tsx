/**
 * @file LoginPage.tsx
 * @description Login page with authentication form
 * @author VLS Team
 * @date 2026-02-15
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle, Server, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  type EnvironmentName,
  ENVIRONMENTS,
  getStoredEnvironment,
  setStoredEnvironment,
} from '../../config/environment.config';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentName>(getStoredEnvironment());

  const from = (location.state as any)?.from?.pathname || '/';

  const handleEnvChange = (env: EnvironmentName) => {
    setSelectedEnv(env);
    setStoredEnvironment(env);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      await login({ username, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-primary-900)] via-[var(--color-primary-800)] to-[var(--color-neutral-900)]">
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-accent-400)] rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">V</span>
          </div>
          <h1 className="text-2xl font-bold text-white">VLS Media CMS</h1>
          <p className="text-[var(--color-primary-300)] mt-1 text-sm">Media Metadata Management System</p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[var(--color-neutral-800)] rounded-2xl shadow-xl p-8 space-y-5"
        >
          <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white text-center">
            Sign In
          </h2>

          {/* Demo Mode Notice */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm">
            <AlertCircle size={16} />
            <div>
              <strong>Demo Mode:</strong> Enter any username and password to explore the UI.
            </div>
          </div>

          {/* Environment Selector */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
              Environment
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(ENVIRONMENTS) as [EnvironmentName, (typeof ENVIRONMENTS)[EnvironmentName]][]).map(([key, env]) => {
                const isSelected = selectedEnv === key;
                const Icon = key === 'staging' ? Server : Shield;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleEnvChange(key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? key === 'staging'
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                          : 'border-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] hover:border-[var(--color-neutral-300)] dark:hover:border-[var(--color-neutral-600)]'
                    }`}
                  >
                    <Icon size={16} className={
                      isSelected
                        ? key === 'staging' ? 'text-amber-500' : 'text-green-500'
                        : 'text-[var(--color-neutral-400)]'
                    } />
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-medium ${
                        isSelected
                          ? 'text-[var(--color-neutral-800)] dark:text-white'
                          : 'text-[var(--color-neutral-500)]'
                      }`}>
                        {env.label}
                      </div>
                      <div className="text-[10px] text-[var(--color-neutral-400)] font-mono truncate">
                        {env.apiBaseUrl.replace('https://', '').split('/')[0]}
                      </div>
                    </div>
                    {isSelected && (
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        key === 'staging' ? 'bg-amber-400' : 'bg-green-400'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
              placeholder="Enter your username"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-primary-700)] text-white rounded-lg font-medium hover:from-[var(--color-primary-700)] hover:to-[var(--color-primary-800)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
