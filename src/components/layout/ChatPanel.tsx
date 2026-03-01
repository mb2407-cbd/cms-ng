/**
 * @file ChatPanel.tsx
 * @description Floating AI chat panel for future agent integration
 * @author VLS Team
 * @date 2026-02-15
 */
import React, { useState } from 'react';
import { X, Send, Bot, Minimize2, Maximize2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatPanel: React.FC = () => {
  const { chatOpen, setChatOpen } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m the VLS AI Assistant. I can help you manage channels, programs, and schedules. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [minimized, setMinimized] = useState(false);

  if (!chatOpen) return null;

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Placeholder for AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'This feature is coming soon. AI-powered metadata management will allow you to make configuration changes through natural language.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  return (
    <div
      className={`fixed right-4 bottom-12 z-40 bg-white dark:bg-[var(--color-neutral-800)] rounded-xl shadow-2xl border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] flex flex-col transition-all duration-300 ${
        minimized ? 'w-72 h-12' : 'w-96 h-[32rem]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] rounded-t-xl bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-primary-700)] text-white">
        <div className="flex items-center gap-2">
          <Bot size={18} />
          <span className="font-semibold text-sm">VLS AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1 rounded hover:bg-white/20 transition-colors"
          >
            {minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button
            onClick={() => setChatOpen(false)}
            className="p-1 rounded hover:bg-white/20 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-[var(--color-primary-600)] text-white'
                      : 'bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-700)] text-[var(--color-neutral-800)] dark:text-[var(--color-neutral-200)]'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask the AI assistant..."
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] text-[var(--color-neutral-800)] dark:text-[var(--color-neutral-200)]"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-3 py-2 bg-[var(--color-primary-600)] text-white rounded-lg hover:bg-[var(--color-primary-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatPanel;
