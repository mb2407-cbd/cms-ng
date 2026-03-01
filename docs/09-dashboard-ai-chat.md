# Dashboard & AI Chat Features

## Overview

The Dashboard provides quick access to key information and navigation. The AI Chat panel offers an intelligent assistant for user queries and agentic workflows. Together they create a central hub for users.

## Completed Tasks

### [x] Dashboard with Quick Navigation Cards

**Status**: Complete

**File**: `src/pages/dashboard/DashboardPage.tsx`

**Features**:
- Quick navigation cards to major features
- Card icons and descriptions
- Responsive grid layout
- Dark mode support
- Hover effects for interactivity

**Card Layout**:
```
┌────────────────────────────────────────┐
│ Dashboard                              │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────┐ ┌──────────┐           │
│  │ Programs │ │ Channels │           │
│  │   Icon   │ │   Icon   │           │
│  │ Manage   │ │ Configure│           │
│  │programs  │ │ channels │           │
│  └──────────┘ └──────────┘           │
│                                        │
│  ┌──────────┐ ┌──────────┐           │
│  │Schedules │ │  Assets  │           │
│  │   Icon   │ │   Icon   │           │
│  │ Plan     │ │ Manage   │           │
│  │schedules │ │  assets  │           │
│  └──────────┘ └──────────┘           │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Program Mapping  │  Publishing   │ │
│  │   Icon           │    Icon       │ │
│  │ Manage program   │ View live     │ │
│  │ provider mappings│ content       │ │
│  └──────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

**Component Implementation**:
```tsx
const navigationItems = [
  {
    id: 'programs',
    label: 'Programs',
    description: 'Manage program metadata and versions',
    icon: 'Film',
    href: '/programs',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'channels',
    label: 'Channels',
    description: 'Configure channels and platform settings',
    icon: 'Tv',
    href: '/channels',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'schedules',
    label: 'Schedules',
    description: 'Plan and manage broadcast schedules',
    icon: 'Calendar',
    href: '/schedules',
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 'assets',
    label: 'Assets',
    description: 'Manage digital assets and images',
    icon: 'Images',
    href: '/assets',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    id: 'mapping',
    label: 'Program Mapping',
    description: 'Map provider programs to VLS',
    icon: 'Link',
    href: '/workflows/mapping',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    id: 'publishing',
    label: 'Publishing',
    description: 'View published content on platforms',
    icon: 'Broadcast',
    href: '/publishing/channels',
    color: 'bg-cyan-100 text-cyan-600',
  },
];

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what you can do.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {navigationItems.map(item => {
          const IconComponent = lucideIcons[item.icon];
          return (
            <NavCard
              key={item.id}
              item={item}
              icon={IconComponent}
            />
          );
        })}
      </div>

      <QuickStatsWidgets />
      <RecentActivityPanel />
    </div>
  );
}
```

### [x] Quick Stats Widgets (Placeholder Data)

**Status**: Complete

**Features**:
- Display key metrics in widget format
- Currently using placeholder data
- Ready for API integration (pending task)
- Icons and color-coded displays
- Support for up/down trends

**Widget Layout**:
```
┌─────────────────────────────────────────┐
│ Quick Statistics                        │
├─────────────────────────────────────────┤
│                                         │
│  Programs: 1,234     Channels: 42      │
│  ↑ 12 new this week  ↓ 2 archived      │
│                                         │
│  Schedules: 156      Assets: 5,432     │
│  ✓ All published     → 12 orphaned     │
│                                         │
│  Mappings:  89       Publish Queue: 3  │
│  ✓ Confirmed        ⏳ Pending...       │
│                                         │
└─────────────────────────────────────────┘
```

**Component**:
```tsx
export function QuickStatsWidgets() {
  // TODO: Replace with API calls once endpoints available
  const stats = {
    programs: { count: 1234, trend: 12, trendDirection: 'up' },
    channels: { count: 42, status: 'All active' },
    schedules: { count: 156, status: 'All published' },
    assets: { count: 5432, issues: 12 },
    mappings: { confirmed: 89, pending: 5 },
    publishQueue: { pending: 3 },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatWidget
        title="Programs"
        value={stats.programs.count}
        subtitle={`+${stats.programs.trend} this week`}
        icon="Film"
        color="blue"
      />
      <StatWidget
        title="Channels"
        value={stats.channels.count}
        subtitle={stats.channels.status}
        icon="Tv"
        color="purple"
      />
      <StatWidget
        title="Schedules"
        value={stats.schedules.count}
        subtitle={stats.schedules.status}
        icon="Calendar"
        color="green"
      />
      <StatWidget
        title="Assets"
        value={stats.assets.count}
        subtitle={`${stats.assets.issues} orphaned`}
        icon="Images"
        color="orange"
      />
      <StatWidget
        title="Mappings"
        value={`${stats.mappings.confirmed} confirmed`}
        subtitle={`${stats.mappings.pending} pending`}
        icon="Link"
        color="pink"
      />
      <StatWidget
        title="Publish Queue"
        value={stats.publishQueue.pending}
        subtitle="Items awaiting publish"
        icon="Send"
        color="cyan"
      />
    </div>
  );
}

function StatWidget({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: string;
}) {
  const IconComponent = lucideIcons[icon];
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    pink: 'bg-pink-50 text-pink-600 border-pink-200',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-200',
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold opacity-70">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs mt-2 opacity-70">{subtitle}</p>
        </div>
        <IconComponent className="w-6 h-6 opacity-50" />
      </div>
    </div>
  );
}
```

### [x] AI Chat Panel UI (Floating, Minimizable)

**Status**: Complete

**File**: `src/components/layout/ChatPanel.tsx`

**Features**:
- Floating chat widget in bottom-right corner
- Minimize/expand toggle
- Message history with clear button
- Input field for user queries
- Typing indicator while waiting for response
- Error state display
- Responsive design

**UI Layout**:
```
┌─ AI Assistant ─────────────────┐
│ [−]          [×]               │
├────────────────────────────────┤
│ Assistant: Hi there! How can   │
│ I help you today?              │
│                                │
│ You: Can you publish all       │
│ schedules for HBO HD?          │
│                                │
│ Assistant: I'll help with      │
│ that. Processing...  ⌛        │
├────────────────────────────────┤
│ [Input message...        ] [↑] │
├────────────────────────────────┤
│ [✓ Powered by Claude]          │
└────────────────────────────────┘
```

**Component**:
```tsx
export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi there! I\'m your VLS assistant. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // TODO: Call AI chat API
      const response = await chatService.sendMessage(input);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white rounded-full p-4 shadow-lg hover:bg-blue-600"
        title="Open AI Assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white dark:bg-slate-800 rounded-lg shadow-2xl flex flex-col max-h-[600px] z-40">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg p-4 flex items-center justify-between">
        <h3 className="font-bold">AI Assistant</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-blue-700 p-1 rounded"
            title="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMessages([])}
            className="hover:bg-blue-700 p-1 rounded"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
              }`}
            >
              <ReactMarkdown className="text-sm">
                {message.content}
              </ReactMarkdown>
              <p className="text-xs mt-1 opacity-70">
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-slate-700 px-3 py-2 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t dark:border-slate-700 p-4 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-center text-gray-500">
          Powered by Claude AI
        </p>
      </div>
    </div>
  );
}
```

## Pending Tasks

### [ ] Dashboard Real-Time Stats from API

**Status**: Not Started

**Objective**: Replace placeholder stats with live data from backend.

**Tasks**:

#### 1. Create Statistics Service
**File**: `src/services/statistics.service.ts`

```typescript
export const statisticsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    return get('/statistics/dashboard');
  },

  async getProgramStats(): Promise<ProgramStats> {
    return get('/statistics/programs');
  },

  async getChannelStats(): Promise<ChannelStats> {
    return get('/statistics/channels');
  },

  async getScheduleStats(): Promise<ScheduleStats> {
    return get('/statistics/schedules');
  },

  async getAssetStats(): Promise<AssetStats> {
    return get('/statistics/assets');
  },
};
```

#### 2. Create Dashboard Stats Type
```typescript
interface DashboardStats {
  programs: {
    total: number;
    newThisWeek: number;
    archived: number;
  };
  channels: {
    total: number;
    active: number;
    inactive: number;
  };
  schedules: {
    total: number;
    published: number;
    pending: number;
  };
  assets: {
    total: number;
    orphaned: number;
    duplicates: number;
  };
  mappings: {
    confirmed: number;
    pending: number;
    rejected: number;
  };
  publishing: {
    queueSize: number;
    lastPublishDate?: string;
  };
}
```

#### 3. Update Dashboard Component
```tsx
export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => statisticsService.getDashboardStats(),
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) return <SkeletonLoader />;

  return (
    <>
      <QuickStatsWidgets stats={stats} />
      {/* Rest of dashboard */}
    </>
  );
}
```

#### 4. API Endpoints
```
GET /statistics/dashboard      - All dashboard stats
GET /statistics/programs       - Program statistics
GET /statistics/channels       - Channel statistics
GET /statistics/schedules      - Schedule statistics
GET /statistics/assets         - Asset statistics
```

### [ ] AI Chat Integration with Backend Agent

**Status**: Not Started

**Objective**: Connect chat UI to backend AI agent for intelligent assistance.

**Features**:
- Process user queries with backend AI
- Support agentic workflows
- Command parsing (e.g., "publish all schedules for HBO")
- Contextual help and suggestions
- Error recovery and clarification
- Action confirmation before execution

**Service Layer**:
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedActions?: Action[];
}

interface Action {
  id: string;
  label: string;
  type: 'navigate' | 'execute' | 'confirm';
  data?: any;
}

export const chatService = {
  async sendMessage(message: string, context?: any): Promise<ChatMessage> {
    return post('/chat/messages', { message, context });
  },

  async executeAction(actionId: string): Promise<any> {
    return post(`/chat/actions/${actionId}/execute`);
  },

  async getChatHistory(limit: number = 50): Promise<ChatMessage[]> {
    return get('/chat/history', { limit });
  },
};
```

**Component Integration**:
```tsx
const handleSendMessage = async () => {
  // ... existing code ...

  try {
    const response = await chatService.sendMessage(input, {
      currentPage: location.pathname,
      userId: user?.id,
    });

    const assistantMessage: ChatMessage = {
      ...response,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    // If assistant suggests actions, show them
    if (response.suggestedActions?.length) {
      setSuggestedActions(response.suggestedActions);
    }
  } catch (error) {
    // ... error handling ...
  }
};
```

**Agentic Workflow Example**:
User: "Publish all schedules for HBO HD"

Backend agent:
1. Parse intent: Publish schedules
2. Extract parameters: channel = "HBO HD"
3. Find channel: Query channels, match "HBO HD"
4. Validate action: Check user permissions
5. Get unpublished schedules: Query unpublished schedules for HBO HD
6. Ask for confirmation: "Found 3 unpublished schedules for HBO HD. Publish all?"
7. On confirmation: Publish each schedule
8. Report results: "Successfully published 3 schedules"

### [ ] Chat History Persistence

**Status**: Not Started

**Objective**: Save chat history for later reference.

**Features**:
- Store messages in database
- Load previous conversations
- Clear history option
- Search chat history
- Export conversation as PDF/text

**Service**:
```typescript
export const chatHistoryService = {
  async saveMessage(message: ChatMessage): Promise<void> {
    return post('/chat/history', message);
  },

  async loadHistory(limit: number = 50): Promise<ChatMessage[]> {
    return get('/chat/history', { limit });
  },

  async clearHistory(): Promise<void> {
    return delete('/chat/history');
  },

  async searchHistory(query: string): Promise<ChatMessage[]> {
    return get('/chat/history/search', { query });
  },

  async exportConversation(format: 'pdf' | 'txt'): Promise<Blob> {
    return get(`/chat/export?format=${format}`);
  },
};
```

**API Endpoints**:
```
GET    /chat/history                - Get chat history
POST   /chat/history                - Save message
DELETE /chat/history                - Clear history
GET    /chat/history/search         - Search history
GET    /chat/export                 - Export conversation
```

### [ ] Agentic Workflows

**Status**: Not Started

**Objective**: Support complex workflows through conversational interface.

**Example Workflows**:

#### 1. Publish All Schedules for Channel
```
User: "Publish all unpublished schedules for HBO HD"
Agent: "Found 3 unpublished schedules. Running validation..."
Agent: "All valid. Ready to publish?"
User: "Yes"
Agent: "Publishing... (3/3 complete) Done!"
```

#### 2. Bulk Import Programs
```
User: "Import programs from GraceNote for sports"
Agent: "How many programs? What date range?"
User: "Last 100 programs from this week"
Agent: "Fetching 100 programs from GraceNote..."
Agent: "Found 87 matching programs. Import all?"
User: "Yes, but skip duplicates"
Agent: "Importing 72 new programs... Complete!"
```

#### 3. Find Missing Content
```
User: "Which programs are missing genres?"
Agent: "Found 42 programs without genres"
Agent: "Would you like to see them or fix them?"
User: "Show me"
Agent: "[displays list]"
User: "Assign action movies to all with 'action' in title"
Agent: "Updating 12 programs... Complete!"
```

**Agentic Capabilities**:
- Natural language understanding
- Intent recognition (publish, search, update, delete)
- Parameter extraction
- Validation and confirmation
- Error recovery
- Progress tracking
- Action execution with callbacks
- Results reporting

**Implementation**:
```typescript
interface AgentRequest {
  query: string;
  context: {
    userId: string;
    currentPage: string;
    selectedFilters?: any;
  };
}

interface AgentResponse {
  intent: string;
  parameters: Record<string, any>;
  requiresConfirmation: boolean;
  confirmationMessage?: string;
  suggestedActions?: Action[];
  response: string;  // Natural language response
}

// Backend receives query, uses Claude to:
// 1. Understand intent
// 2. Extract parameters
// 3. Validate against schema
// 4. Request confirmation if needed
// 5. Execute action
// 6. Report results
```

## Implementation Order

1. Dashboard Real-Time Stats from API
2. AI Chat Integration with Backend
3. Chat History Persistence
4. Agentic Workflows (start with one workflow)
5. Additional Workflows as needed

## Testing Checklist

- [ ] Dashboard loads and displays placeholder stats
- [ ] Stats update without page refresh
- [ ] Chat panel opens/closes and minimizes
- [ ] Messages send and receive responses
- [ ] Chat history loads on next visit
- [ ] AI agent understands basic commands
- [ ] Publish workflow executes correctly
- [ ] Search workflow finds correct items
- [ ] Error messages display appropriately
- [ ] User confirmation required before actions
- [ ] Action results display to user
