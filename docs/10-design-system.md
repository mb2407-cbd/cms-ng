# Design System & Polish

## Overview

The Design System defines the visual language, components, and patterns used throughout the VLS UI. This ensures consistency, improves user experience, and makes development faster.

## Completed Tasks

### [x] Color Palette with CSS Variables

**Status**: Complete

**File**: `src/index.css` (or `src/styles/colors.css`)

**Color System**:
CSS variables defined for Tailwind theming with a complete palette supporting light and dark modes.

**Primary Colors**:
- Blue: Primary action, links, highlights
- Purple: Secondary actions, categories
- Green: Success, completion states
- Red: Errors, warnings, destructive actions
- Orange: Warnings, alerts
- Gray: Backgrounds, borders, disabled states

**Usage Example**:
```css
:root {
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;

  --color-success-500: #10b981;
  --color-error-500: #ef4444;
  --color-warning-500: #f59e0b;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary: #0f172a;
    --color-bg-secondary: #1e293b;
    --color-text-primary: #f1f5f9;
    --color-text-secondary: #cbd5e1;
  }
}
```

**Tailwind Configuration**:
```typescript
// tailwind.config.ts
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          // ...
        },
        success: {
          500: 'var(--color-success-500)',
        },
        error: {
          500: 'var(--color-error-500)',
        },
      },
    },
  },
};
```

**Usage in Components**:
```tsx
<div className="bg-blue-50 dark:bg-slate-900 text-blue-900 dark:text-blue-100">
  Content with theme support
</div>

<button className="bg-green-500 hover:bg-green-600 text-white">
  Success Action
</button>
```

### [x] Dark Mode Support

**Status**: Complete

**Implementation**:
- CSS custom properties with `prefers-color-scheme` media query
- Tailwind `dark:` class prefix support
- System preference detection
- Manual theme toggle option (future)

**Approach**:
1. Detect system dark mode preference: `prefers-color-scheme: dark`
2. Apply `dark` class to `<html>` element when needed
3. Use `dark:` prefix on classes for dark mode styles

**Example Component**:
```tsx
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow">
      <div className="text-gray-900 dark:text-gray-100">
        {children}
      </div>
    </div>
  );
}
```

**Theme Toggle Hook** (for future manual toggle):
```typescript
export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return { isDark, toggleTheme };
}
```

### [x] Typography System

**Status**: Complete

**Font Stack**:
```css
:root {
  --font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
    'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
    'Helvetica Neue', sans-serif;
  --font-family-mono: 'Menlo', 'Monaco', 'Courier New', monospace;
}
```

**Font Sizes** (Tailwind defaults with additions):
```
xs  = 0.75rem   (12px)
sm  = 0.875rem  (14px)
base= 1rem      (16px)
lg  = 1.125rem  (18px)
xl  = 1.25rem   (20px)
2xl = 1.5rem    (24px)
3xl = 1.875rem  (30px)
4xl = 2.25rem   (36px)
```

**Font Weights**:
```
normal: 400
medium: 500
semibold: 600
bold: 700
```

**Line Heights**:
```
tight: 1.25
normal: 1.5
relaxed: 1.625
loose: 2
```

**Usage Examples**:
```tsx
// Heading
<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
  Page Title
</h1>

// Subheading
<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
  Section Title
</h2>

// Body
<p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
  Regular paragraph text
</p>

// Small
<p className="text-sm text-gray-500 dark:text-gray-500">
  Helper text or captions
</p>

// Monospace
<code className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
  code_example
</code>
```

### [x] Animation Keyframes

**Status**: Complete

**CSS Animations Defined**:
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes slideIn {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

**Tailwind Animation Classes**:
```tsx
// Spinner
<div className="animate-spin">
  <Loader className="w-6 h-6" />
</div>

// Pulse (skeleton loaders)
<div className="animate-pulse bg-gray-200 h-12 rounded" />

// Bounce
<div className="animate-bounce">
  Click me!
</div>

// Custom animation
<div className="animation-slideIn">
  Animated content
</div>
```

**Animation Timings**:
```
duration-75  = 75ms
duration-100 = 100ms
duration-150 = 150ms
duration-200 = 200ms
duration-300 = 300ms
duration-500 = 500ms
duration-700 = 700ms
duration-1000= 1000ms
```

## Pending Tasks

### [ ] Component Library Documentation

**Status**: Not Started

**Objective**: Document all reusable components and their usage patterns.

**Components to Document**:

#### Common Components
- Button (primary, secondary, danger, loading states)
- Input (text, email, password, disabled, error states)
- Select (dropdown, multi-select, searchable)
- Checkbox (single, group, indeterminate)
- Radio (single, group)
- Toggle Switch (on/off)
- TextArea (with character counter)
- DatePicker (single date, range)

#### Layout Components
- Card (basic container)
- Modal/Dialog (with confirm/cancel)
- Sidebar (navigation)
- Tabs (multiple panes)
- Accordion (collapsible sections)
- Breadcrumbs (navigation path)
- Pagination (page navigation)

#### Data Display
- Table (sortable, filterable)
- DataGrid (large datasets)
- List (unordered, ordered)
- Timeline (vertical timeline)
- Badge (small labels)
- Alert (info, success, warning, error)
- Toast/Notification (temporary messages)

#### Feedback
- LoadingSpinner (loading state)
- SkeletonLoader (content placeholder)
- ErrorBoundary (error catching)
- ConfirmDialog (user confirmation)

**Documentation Template**:
```markdown
## Button Component

### Overview
Primary action button with multiple variants.

### Props
- `variant`: 'primary' | 'secondary' | 'danger' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean
- `disabled`: boolean
- `onClick`: () => void
- `children`: React.ReactNode

### Examples
\`\`\`tsx
<Button variant="primary" size="md">
  Click Me
</Button>

<Button variant="danger" isLoading={isLoading}>
  Delete
</Button>
\`\`\`

### Accessibility
- Proper button role
- Keyboard support (Enter, Space)
- Focus management
- Loading state announces to screen readers
```

**File Structure**:
```
src/components/
├── common/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   └── ...
├── layout/
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Sidebar.tsx
│   └── ...
└── README.md (component library index)
```

### [ ] Accessibility Audit (WCAG AA)

**Status**: Not Started

**Objective**: Ensure application meets WCAG AA accessibility standards.

**Areas to Audit**:

#### 1. Keyboard Navigation
- All interactive elements accessible via keyboard
- Logical tab order
- Focus visible at all times
- Escape key closes modals
- Arrow keys work in lists/menus

**Testing**:
```
[ ] Can navigate entire app with keyboard
[ ] Tab order makes sense
[ ] Focus ring visible on all elements
[ ] Form submission works with Enter
[ ] Menus dismiss with Escape
```

#### 2. Screen Reader Support
- Semantic HTML (buttons, forms, landmarks)
- ARIA labels and descriptions where needed
- Form labels associated with inputs
- Error messages linked to fields
- Loading states announced
- Dynamic content updates announced

**Testing**:
```
[ ] Run with screen reader (NVDA, JAWS, VoiceOver)
[ ] All buttons have accessible names
[ ] Forms properly labeled
[ ] Errors announced
[ ] Navigation landmarks present
```

#### 3. Color Contrast
- Text contrast >= 4.5:1 (normal text)
- Text contrast >= 3:1 (large text)
- Don't rely on color alone for meaning
- Use patterns or icons with colors

**Checking Tool**:
```bash
npm install -D axe-core
# Run accessibility tests with axe
```

#### 4. Images
- All images have alt text
- Decorative images use empty alt
- Complex images have long description
- SVG icons have titles/labels

**Examples**:
```tsx
// Good
<img src="program.jpg" alt="Game of Thrones promotional poster" />

// Decorative
<img src="divider.svg" alt="" aria-hidden="true" />

// Icon button
<button title="Delete program" aria-label="Delete program">
  <Trash2 />
</button>
```

#### 5. Form Accessibility
- Labels associated with inputs
- Error messages linked to inputs
- Required fields marked
- Instructions clear and associated
- Placeholder not used as label

```tsx
// Good
<div>
  <label htmlFor="email">Email *</label>
  <input
    id="email"
    type="email"
    required
    aria-describedby="email-error"
  />
  <span id="email-error" role="alert">
    {error}
  </span>
</div>

// Bad
<input placeholder="Email" />
```

#### 6. Motion & Animation
- Respect `prefers-reduced-motion`
- Animations not essential to functionality
- Avoid flashing/strobing effects
- Loading animations have reduced-motion alternative

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### 7. Language
- Page language specified in HTML
- Language changes within content marked
- Text is clear and simple

```tsx
<html lang="en">
  <body>
    <p>
      The word <span lang="es">hola</span> means hello.
    </p>
  </body>
</html>
```

**Automated Testing**:
```bash
npm install -D @axe-core/react
# In test files:
import { axe, toHaveNoViolations } from 'jest-axe';
expect(await axe(container)).toHaveNoViolations();
```

**Manual Checklist**:
- [ ] Run axe DevTools browser extension
- [ ] Test with keyboard only
- [ ] Test with screen reader
- [ ] Check color contrast with WebAIM
- [ ] Verify focus visible on all elements
- [ ] Test on mobile with accessibility features enabled
- [ ] Check for flashing/strobing content

### [ ] Responsive Design Testing

**Status**: Not Started

**Objective**: Ensure application works well on all screen sizes.

**Breakpoints** (Tailwind defaults):
```
sm: 640px   (smartphones landscape)
md: 768px   (tablets)
lg: 1024px  (desktop)
xl: 1280px  (desktop large)
2xl: 1536px (desktop extra large)
```

**Testing Process**:

#### 1. Mobile-First Development
Build for mobile first, then enhance for larger screens.

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

#### 2. Test Common Device Sizes
```
iPhone 12: 390x844
iPad: 768x1024
iPad Pro: 1024x1366
Desktop: 1920x1080
Desktop Large: 2560x1440
```

#### 3. Responsive Components
- Tables should scroll horizontally on mobile
- Navigation collapses to hamburger on mobile
- Modals should fit on small screens
- Images should scale appropriately
- Touch targets >= 44x44px on mobile

**Mobile Navigation Example**:
```tsx
export function TopNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-slate-800 shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Logo />

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu />
          </button>

          {/* Desktop navigation */}
          <div className="hidden md:flex gap-6">
            <NavLink href="/programs">Programs</NavLink>
            <NavLink href="/channels">Channels</NavLink>
            <NavLink href="/schedules">Schedules</NavLink>
          </div>
        </div>

        {/* Mobile navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <MobileNavLink href="/programs">Programs</MobileNavLink>
            <MobileNavLink href="/channels">Channels</MobileNavLink>
            <MobileNavLink href="/schedules">Schedules</MobileNavLink>
          </div>
        )}
      </div>
    </nav>
  );
}
```

#### 4. Testing Tools
```bash
# Chrome DevTools - toggle device toolbar (Ctrl+Shift+M)
# Firefox Responsive Design Mode (Ctrl+Shift+M)
# Real device testing (BrowserStack, Sauce Labs)
```

**Checklist**:
```
[ ] Mobile layout flows naturally
[ ] No horizontal scrolling on mobile
[ ] Touch targets large enough
[ ] Text readable without zooming
[ ] Images scale properly
[ ] Forms work on mobile
[ ] Navigation accessible on mobile
[ ] Performance acceptable on slow connections
```

### [ ] Skeleton Loaders for All Pages

**Status**: Not Started

**Objective**: Show placeholder content while data loads.

**Benefits**:
- Better perceived performance
- Professional appearance
- Smooth content transition
- No layout shift when content loads

**SkeletonLoader Component**:
```tsx
export function SkeletonLoader({ lines = 3, type = 'text' }: Props) {
  if (type === 'card') {
    return (
      <div className="border rounded-lg p-4 animate-pulse">
        <div className="w-full h-32 bg-gray-200 dark:bg-slate-700 rounded mb-4" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 dark:bg-slate-700 rounded"
          style={{ width: i === lines - 1 ? '80%' : '100%' }}
        />
      ))}
    </div>
  );
}
```

**Usage**:
```tsx
export function ProgramsList() {
  const { data: programs, isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: () => programService.getPrograms(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLoader key={i} type="card" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {programs.map(program => (
        <ProgramCard key={program.id} program={program} />
      ))}
    </div>
  );
}
```

**Patterns**:
- Table skeleton: Skeleton rows
- Card skeleton: Image + text lines
- Form skeleton: Input fields with skeleton labels
- List skeleton: Multiple line skeletons

### [ ] Error Boundary Components

**Status**: Not Started

**Objective**: Catch and display errors gracefully.

**ErrorBoundary Component**:
```tsx
interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg">
            <h2 className="text-lg font-bold text-red-800 dark:text-red-200">
              Something went wrong
            </h2>
            <p className="text-red-700 dark:text-red-300 mt-2">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

**Usage**:
```tsx
<ErrorBoundary fallback={<CustomErrorPage />}>
  <ProgramsList />
</ErrorBoundary>
```

### [ ] Toast Notification System

**Status**: Not Started

**Objective**: Display temporary notifications for actions and feedback.

**Toast Component**:
```tsx
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const toastStyles: Record<ToastType, string> = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
};

export function Toast({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(onClose, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  return (
    <div className={`border rounded-lg p-4 mb-2 flex justify-between items-start ${toastStyles[toast.type]}`}>
      <p>{toast.message}</p>
      <div className="flex gap-2 ml-4">
        {toast.action && (
          <button onClick={toast.action.onClick} className="font-bold underline">
            {toast.action.label}
          </button>
        )}
        <button onClick={onClose}>✕</button>
      </div>
    </div>
  );
}
```

**Toast Context**:
```tsx
interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
```

**Usage**:
```tsx
const { addToast } = useToast();

const handleSave = async () => {
  try {
    await programService.updateProgram(program);
    addToast({
      type: 'success',
      message: 'Program saved successfully',
      duration: 3000,
    });
  } catch (error) {
    addToast({
      type: 'error',
      message: 'Failed to save program',
      duration: 5000,
    });
  }
};
```

### [ ] Confirmation Modal System

**Status**: Not Started

**Objective**: Confirm destructive actions before execution.

**ConfirmDialog Component**:
```tsx
interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(isLoading);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm w-full">
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-white rounded ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } disabled:opacity-50`}
          >
            {loading ? 'Loading...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Usage**:
```tsx
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

if (showDeleteConfirm) {
  return (
    <ConfirmDialog
      title="Delete Program?"
      message={`Are you sure you want to delete "${program.title}"? This action cannot be undone.`}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      isDangerous
      onConfirm={async () => {
        await programService.deleteProgram(program.id);
        navigateTo('/programs');
      }}
      onCancel={() => setShowDeleteConfirm(false)}
    />
  );
}

return (
  <button
    onClick={() => setShowDeleteConfirm(true)}
    className="bg-red-500 text-white"
  >
    Delete Program
  </button>
);
```

## Implementation Order

1. Component Library Documentation
2. Accessibility Audit (WCAG AA)
3. Responsive Design Testing
4. Skeleton Loaders for All Pages
5. Error Boundary Components
6. Toast Notification System
7. Confirmation Modal System

## Quality Checklist

```
Design System
─────────────
[ ] All colors use CSS variables
[ ] Dark mode works on all pages
[ ] Typography consistent throughout
[ ] Animations smooth and purposeful

Components
──────────
[ ] All common components documented
[ ] Components have prop types
[ ] Components handle loading/error states
[ ] Components accessible

Accessibility
─────────────
[ ] Keyboard navigation works
[ ] Screen reader compatible
[ ] Color contrast meets WCAG AA
[ ] Focus visible on all elements
[ ] Images have alt text
[ ] Forms properly labeled
[ ] Motion respects preferences

Responsive
──────────
[ ] Mobile layouts work (< 480px)
[ ] Tablet layouts work (481-768px)
[ ] Desktop layouts work (769+px)
[ ] No horizontal scrolling on mobile
[ ] Touch targets >= 44px
[ ] Text readable without zoom

Polish
──────
[ ] Skeleton loaders on all pages
[ ] Loading spinners show progress
[ ] Error boundaries catch errors
[ ] Toasts confirm user actions
[ ] Confirmation dialogs for destructive actions
[ ] Smooth transitions and animations
```

## References

- **Tailwind CSS**: https://tailwindcss.com
- **Web Content Accessibility Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility
- **Inclusive Components**: https://inclusive-components.design/
- **Web.dev Performance**: https://web.dev/performance/
