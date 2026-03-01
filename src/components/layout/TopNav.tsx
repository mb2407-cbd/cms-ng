/**
 * @file TopNav.tsx
 * @description Main top navigation bar with menu options
 * @author VLS Team
 * @date 2026-02-15
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Tv,
  Film,
  Package,
  LayoutTemplate,
  BarChart3,
  GitBranch,
  Settings,
  MessageCircle,
  Palette,
  Check,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp, type ThemeName } from '../../context/AppContext';

interface NavItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/', icon: <Home size={18} /> },
  { label: 'Channels', path: '/channels', icon: <Tv size={18} /> },
  { label: 'Assets', path: '/assets', icon: <Package size={18} /> },
  { label: 'Programs', path: '/programs', icon: <Film size={18} /> },
  { label: 'Homepages', path: '/homepages', icon: <LayoutTemplate size={18} /> },
  {
    label: 'Workflows',
    icon: <GitBranch size={18} />,
    children: [
      { label: 'Program Mapping', path: '/workflows/program-mapping', icon: <GitBranch size={16} /> },
    ],
  },
  {
    label: 'Reports',
    icon: <BarChart3 size={18} />,
    children: [
      { label: 'Published Channels', path: '/reports/published/channels', icon: <Tv size={16} /> },
      { label: 'Published Assets', path: '/reports/published/assets', icon: <Package size={16} /> },
      { label: 'Published Programs', path: '/reports/published/programs', icon: <Film size={16} /> },
    ],
  },
  {
    label: 'Admin',
    icon: <Settings size={18} />,
    children: [
      { label: 'Settings', path: '/admin/settings', icon: <Settings size={16} /> },
    ],
  },
];

const TopNav: React.FC = () => {
  const { user, logout } = useAuth();
  const { chatOpen, setChatOpen, themeName, setTheme } = useApp();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  /** Check if any child route of a dropdown parent is active */
  const isChildActive = (children?: NavItem[]) => {
    if (!children) return false;
    return children.some(child => child.path && isActive(child.path));
  };

  /** Get the active child item (for displaying its label on the parent button) */
  const getActiveChild = (children?: NavItem[]): NavItem | undefined => {
    if (!children) return undefined;
    return children.find(child => child.path && isActive(child.path));
  };

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const handleDropdownClose = () => {
    setOpenDropdown(null);
  };

  const THEME_CYCLE: ThemeName[] = ['vls-dark', 'vls-light', 'checkbox-dark', 'checkbox-light'];
  const THEME_LABELS: Record<ThemeName, string> = {
    'vls-dark': 'VLS Dark',
    'vls-light': 'VLS Light',
    'checkbox-dark': 'Checkbox Dark',
    'checkbox-light': 'Checkbox Light',
  };
  const isCheckboxTheme = themeName.startsWith('checkbox');

  return (
    <nav className="bg-[var(--color-neutral-900)] text-white shadow-lg relative z-50">
      <div className="max-w-full mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
              {isCheckboxTheme ? (
                <>
                  <img src="/cms.svg" alt="CMS Logo" className="w-8 h-8 rounded-lg" />
                  <span className="hidden sm:inline">CMS</span>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-accent-400)] rounded-lg flex items-center justify-center text-sm font-bold">
                    V
                  </div>
                  <span className="hidden sm:inline">VLS</span>
                </>
              )}
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <div key={item.label} className="relative">
                  {(() => {
                    const childActive = isChildActive(item.children);
                    const activeChild = getActiveChild(item.children);
                    return (
                      <>
                        <button
                          onClick={() => handleDropdownToggle(item.label)}
                          onBlur={() => setTimeout(handleDropdownClose, 200)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors
                            ${childActive
                              ? 'bg-[var(--color-primary-600)] text-white'
                              : openDropdown === item.label
                                ? 'bg-[var(--color-neutral-700)] text-white'
                                : 'text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-800)] hover:text-white'
                            }`}
                        >
                          {item.icon}
                          {item.label}
                          {activeChild && (
                            <>
                              <span className="text-white/40 mx-0.5">›</span>
                              <span className="text-white/90 text-xs">{activeChild.label}</span>
                            </>
                          )}
                          <ChevronDown size={14} className={`transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                        </button>
                        {openDropdown === item.label && (
                          <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--color-neutral-800)] rounded-lg shadow-xl border border-[var(--color-neutral-700)] py-1 animate-fade-in">
                            {item.children!.map((child) => (
                              <Link
                                key={child.label}
                                to={child.path || '#'}
                                className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                                  isActive(child.path)
                                    ? 'bg-[var(--color-primary-600)]/20 text-[var(--color-primary-300)] font-medium'
                                    : 'text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-700)] hover:text-white'
                                }`}
                                onClick={handleDropdownClose}
                              >
                                {child.icon}
                                {child.label}
                                {isActive(child.path) && (
                                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-primary-400)]" />
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <Link
                  key={item.label}
                  to={item.path || '#'}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive(item.path)
                      ? 'bg-[var(--color-primary-600)] text-white'
                      : 'text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-800)] hover:text-white'
                    }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setThemeMenuOpen((v) => !v)}
                onBlur={() => setTimeout(() => setThemeMenuOpen(false), 200)}
                className="p-2 rounded-md text-[var(--color-neutral-300)] hover:text-white hover:bg-[var(--color-neutral-800)] transition-colors"
                title={`Theme: ${THEME_LABELS[themeName]}`}
              >
                <Palette size={18} />
              </button>
              {themeMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-[var(--color-neutral-800)] rounded-lg shadow-xl border border-[var(--color-neutral-700)] py-1 animate-fade-in z-50">
                  {THEME_CYCLE.map((theme) => {
                    const active = theme === themeName;
                    return (
                      <button
                        key={theme}
                        onClick={() => { setTheme(theme); setThemeMenuOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                          active
                            ? 'bg-[var(--color-primary-600)]/20 text-[var(--color-primary-300)]'
                            : 'text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-700)] hover:text-white'
                        }`}
                      >
                        <span className="w-4 h-4 inline-flex items-center justify-center">
                          {active && <Check size={14} />}
                        </span>
                        {THEME_LABELS[theme]}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={`p-2 rounded-md transition-colors ${
                chatOpen
                  ? 'bg-[var(--color-primary-600)] text-white'
                  : 'text-[var(--color-neutral-400)] hover:text-white hover:bg-[var(--color-neutral-800)]'
              }`}
              title="AI Chat Assistant"
            >
              <MessageCircle size={18} />
            </button>

            {user && (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[var(--color-neutral-700)]">
                <span className="text-sm text-[var(--color-neutral-400)] hidden sm:inline">
                  {user.username}
                </span>
                <button
                  onClick={logout}
                  className="p-2 rounded-md text-[var(--color-neutral-400)] hover:text-red-400 hover:bg-[var(--color-neutral-800)] transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-[var(--color-neutral-400)] hover:text-white"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--color-neutral-800)] border-t border-[var(--color-neutral-700)] animate-slide-in">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <div key={item.label}>
                  <div className={`px-3 py-2 text-sm font-medium ${
                    isChildActive(item.children)
                      ? 'text-[var(--color-primary-300)]'
                      : 'text-[var(--color-neutral-400)]'
                  }`}>
                    {item.label}
                  </div>
                  {item.children.map((child) => (
                    <Link
                      key={child.label}
                      to={child.path || '#'}
                      className={`flex items-center gap-2 pl-6 pr-3 py-2 text-sm rounded-md ${
                        isActive(child.path)
                          ? 'bg-[var(--color-primary-600)] text-white font-medium'
                          : 'text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-700)]'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {child.icon}
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={item.label}
                  to={item.path || '#'}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                    ${isActive(item.path)
                      ? 'bg-[var(--color-primary-600)] text-white'
                      : 'text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-700)]'
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default TopNav;
