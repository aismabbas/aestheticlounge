'use client';

import { useState, useEffect, useRef } from 'react';

interface Thread {
  phone: string;
  name: string;
  lastMessage: string;
  unread: number;
  messages: Message[];
}

interface Message {
  id: string;
  phone: string;
  direction: string;
  message_type: string;
  content: string;
  template_name: string;
  status: string;
  agent: string;
  created_at: string;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const statusIcons: Record<string, string> = {
  sent: '\u2713',
  delivered: '\u2713\u2713',
  read: '\u2713\u2713',
};

export default function ConversationsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/dashboard/conversations')
      .then((r) => r.json())
      .then((data) => {
        setThreads(data.threads || []);
        setLoading(false);
      });
  }, []);

  const selectThread = async (phone: string) => {
    setSelectedPhone(phone);
    const res = await fetch(`/api/dashboard/conversations?phone=${encodeURIComponent(phone)}`);
    const data = await res.json();
    const thread = data.threads?.[0];
    setMessages(thread?.messages || []);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border-light rounded w-48" />
          <div className="h-[600px] bg-border-light rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-text-dark mb-6">Conversations</h1>

      <div className="flex bg-white rounded-xl border border-border overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        {/* Thread List */}
        <div className="w-80 border-r border-border flex flex-col shrink-0">
          <div className="p-3 border-b border-border">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full px-3 py-2 bg-warm-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="p-6 text-center text-sm text-text-muted">No conversations yet.</div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.phone}
                  onClick={() => selectThread(thread.phone)}
                  className={`w-full text-left px-4 py-3 border-b border-border-light hover:bg-warm-white transition-colors ${
                    selectedPhone === thread.phone ? 'bg-gold-pale' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gold-pale flex items-center justify-center text-gold-dark text-sm font-semibold shrink-0">
                        {(thread.name || thread.phone)?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-dark truncate">
                          {thread.name || thread.phone}
                        </p>
                        <p className="text-xs text-text-muted truncate mt-0.5">
                          {thread.lastMessage || 'No messages'}
                        </p>
                      </div>
                    </div>
                    {thread.unread > 0 && (
                      <span className="bg-gold text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                        {thread.unread}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 flex flex-col">
          {!selectedPhone ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg text-text-muted">Select a conversation</p>
                <p className="text-sm text-text-muted mt-1">Choose from the list on the left</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gold-pale flex items-center justify-center text-gold-dark text-sm font-semibold">
                  {(threads.find((t) => t.phone === selectedPhone)?.name || selectedPhone)?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-dark">
                    {threads.find((t) => t.phone === selectedPhone)?.name || selectedPhone}
                  </p>
                  <p className="text-xs text-text-muted">{selectedPhone}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        msg.direction === 'outbound'
                          ? 'bg-gold text-white rounded-br-md'
                          : 'bg-warm-white text-text-dark rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div
                        className={`flex items-center gap-1 mt-1 ${
                          msg.direction === 'outbound' ? 'justify-end' : ''
                        }`}
                      >
                        <span
                          className={`text-[10px] ${
                            msg.direction === 'outbound' ? 'text-white/60' : 'text-text-muted'
                          }`}
                        >
                          {formatTime(msg.created_at)}
                        </span>
                        {msg.direction === 'outbound' && msg.status && (
                          <span className={`text-[10px] ${msg.status === 'read' ? 'text-blue-200' : 'text-white/60'}`}>
                            {statusIcons[msg.status] || ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message... (sends via n8n pipeline)"
                    className="flex-1 px-4 py-2.5 bg-warm-white rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                    disabled
                  />
                  <button
                    disabled
                    className="px-5 py-2.5 bg-gold/50 text-white text-sm font-medium rounded-full cursor-not-allowed"
                    title="Message sending is handled via the n8n pipeline"
                  >
                    Send
                  </button>
                </div>
                <p className="text-[10px] text-text-muted text-center mt-1.5">
                  Messages are sent through the WhatsApp n8n pipeline
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
