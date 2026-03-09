'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { analyzeSentiment, analyzeThread, type ThreadMessage } from '@/lib/message-analyzer';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Channel = 'whatsapp' | 'instagram_dm' | 'messenger' | 'ig_comment' | 'fb_comment';
type ThreadStatus = 'open' | 'closed' | 'snoozed';
type ChannelFilter = 'all' | Channel;

interface Thread {
  id: string;
  channel: Channel;
  external_id: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_ig_handle: string | null;
  contact_fb_id: string | null;
  contact_avatar: string | null;
  lead_id: string | null;
  client_id: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  status: ThreadStatus;
  unread_count: number;
  last_message_at: string | null;
  last_message: string | null;
  last_message_type: string | null;
  created_at: string;
}

interface Message {
  id: string;
  thread_id: string;
  external_id: string | null;
  direction: 'inbound' | 'outbound';
  channel: Channel;
  content: string;
  media_url: string | null;
  media_type: string;
  sent_by: string | null;
  sent_by_name: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface InboxSummary {
  total_unread_threads: number;
  whatsapp_unread: number;
  ig_dm_unread: number;
  messenger_unread: number;
  comments_unread: number;
  open_count: number;
  closed_count: number;
  snoozed_count: number;
}

interface StaffMember {
  id: string;
  name: string;
}

interface ContactProfile {
  thread_id: string;
  lead: {
    id: string; name: string; phone: string; email: string; source: string;
    stage: string; quality: string; interest: string; notes: string;
    booked_treatment: string; booking_value: number; score: number;
    score_factors: string; treatments_viewed: string; utm_source: string;
    utm_medium: string; utm_campaign: string; landing_page: string;
    visit_count: number; time_on_site: number; created_at: string;
    last_activity_at: string;
    instagram_handle: string | null; facebook_id: string | null;
    whatsapp_number: string | null;
  } | null;
  client: {
    id: string; name: string; phone: string; email: string; gender: string;
    date_of_birth: string; created_at: string;
  } | null;
  appointments: Array<{
    id: string; treatment: string; date: string; time: string; status: string;
    created_at: string;
  }>;
  payments: Array<{
    id: string; amount: number; currency: string; treatment: string;
    status: string; created_at: string;
  }>;
  behavior_events: Array<{
    event_type: string; page_url: string; page_title: string;
    metadata: Record<string, unknown>; session_id: string; created_at: string;
  }>;
  journey: {
    landing_page: string | null; pages_visited: number; page_list: string[];
    cta_clicked: boolean; form_submitted: boolean; total_time: number;
  } | null;
  match_suggestions: Array<{
    type: 'lead' | 'client'; id: string; name: string; phone: string;
    email: string; stage?: string; source?: string;
  }>;
}

/* ------------------------------------------------------------------ */
/*  Channel config                                                     */
/* ------------------------------------------------------------------ */

const CHANNEL_CONFIG: Record<Channel, { label: string; icon: string; color: string; bgColor: string; outboundBg: string; outboundText: string }> = {
  whatsapp: {
    label: 'WhatsApp',
    icon: '\u{1F4AC}',
    color: '#25D366',
    bgColor: 'bg-[#25D366]/10',
    outboundBg: 'bg-[#DCF8C6]',
    outboundText: 'text-gray-900',
  },
  instagram_dm: {
    label: 'Instagram',
    icon: '\u{1F4F7}',
    color: '#E1306C',
    bgColor: 'bg-[#E1306C]/10',
    outboundBg: 'bg-gradient-to-r from-[#833AB4]/90 via-[#E1306C]/90 to-[#F77737]/90',
    outboundText: 'text-white',
  },
  messenger: {
    label: 'Messenger',
    icon: '\u{1F4E8}',
    color: '#0084FF',
    bgColor: 'bg-[#0084FF]/10',
    outboundBg: 'bg-[#0084FF]',
    outboundText: 'text-white',
  },
  ig_comment: {
    label: 'IG Comment',
    icon: '\u{1F4DD}',
    color: '#E1306C',
    bgColor: 'bg-[#E1306C]/10',
    outboundBg: 'bg-gray-200',
    outboundText: 'text-gray-900',
  },
  fb_comment: {
    label: 'FB Comment',
    icon: '\u{1F4DD}',
    color: '#1877F2',
    bgColor: 'bg-[#1877F2]/10',
    outboundBg: 'bg-gray-200',
    outboundText: 'text-gray-900',
  },
};

const CHANNEL_FILTERS: { key: ChannelFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'instagram_dm', label: 'Instagram' },
  { key: 'messenger', label: 'Messenger' },
  { key: 'ig_comment', label: 'Comments' },
];

const STATUS_FILTERS: { key: ThreadStatus | 'all'; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'closed', label: 'Closed' },
  { key: 'snoozed', label: 'Snoozed' },
  { key: 'all', label: 'All' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getContactDisplay(thread: Thread): string {
  return (
    thread.contact_name ||
    thread.contact_ig_handle ||
    thread.contact_phone ||
    thread.contact_fb_id ||
    'Unknown'
  );
}

function getContactSub(thread: Thread): string {
  if (thread.channel === 'whatsapp' && thread.contact_phone) return thread.contact_phone;
  if (thread.contact_ig_handle) return `@${thread.contact_ig_handle}`;
  if (thread.contact_phone) return thread.contact_phone;
  return thread.channel;
}

function getInitial(thread: Thread): string {
  const name = getContactDisplay(thread);
  return name[0]?.toUpperCase() || '?';
}

const statusIcons: Record<string, string> = {
  sent: '\u2713',
  delivered: '\u2713\u2713',
  read: '\u2713\u2713',
  failed: '\u2717',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function UnifiedInboxPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [statusFilter, setStatusFilter] = useState<ThreadStatus | 'all'>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState<InboxSummary | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateParams, setTemplateParams] = useState('');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadTreatment, setNewLeadTreatment] = useState('');
  const [infoPanelOpen, setInfoPanelOpen] = useState(true);
  const [contactProfile, setContactProfile] = useState<ContactProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [linkClientId, setLinkClientId] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [bookingTreatment, setBookingTreatment] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (channelFilter !== 'all') {
        // Map the "ig_comment" filter to include both ig_comment and fb_comment
        if (channelFilter === 'ig_comment') {
          // For comments filter, we'll handle client-side or use 'all' and filter
          // Actually the API expects exact channel, so we'll fetch all and filter
        }
        params.set('channel', channelFilter);
      }
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/dashboard/inbox?${params}`);
      const data = await res.json();

      let filteredThreads = data.threads || [];
      // If comments filter is selected, include both ig_comment and fb_comment
      if (channelFilter === 'ig_comment') {
        const allRes = await fetch(`/api/dashboard/inbox?status=${statusFilter !== 'all' ? statusFilter : 'all'}${searchQuery ? `&search=${searchQuery}` : ''}`);
        const allData = await allRes.json();
        filteredThreads = (allData.threads || []).filter(
          (t: Thread) => t.channel === 'ig_comment' || t.channel === 'fb_comment',
        );
      }

      setThreads(filteredThreads);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Failed to fetch threads:', err);
    } finally {
      setLoading(false);
    }
  }, [channelFilter, statusFilter, searchQuery]);

  // Auto-sync from Meta on first load, then fetch threads
  const hasSynced = useRef(false);
  useEffect(() => {
    async function initLoad() {
      if (!hasSynced.current) {
        hasSynced.current = true;
        try {
          await fetch('/api/dashboard/inbox/sync', { method: 'POST' });
        } catch {
          // Sync failed, still show DB threads
        }
      }
      fetchThreads();
    }
    initLoad();
  }, [fetchThreads]);

  // Fetch staff for assignment dropdown
  useEffect(() => {
    fetch('/api/dashboard/inbox?_staff=1')
      .catch(() => null);
    // Simple staff fetch
    fetch('/api/dashboard/conversations')
      .then(() => {
        // Try to get staff from a known endpoint
        return fetch('/api/dashboard/inbox?channel=all&status=all');
      })
      .then((r) => r.json())
      .then((data) => {
        // Extract unique assigned_to_name values as staff
        const staffMap = new Map<string, string>();
        for (const t of data.threads || []) {
          if (t.assigned_to && t.assigned_to_name) {
            staffMap.set(t.assigned_to, t.assigned_to_name);
          }
        }
        setStaff(
          Array.from(staffMap.entries()).map(([id, name]) => ({ id, name })),
        );
      })
      .catch(() => {});
  }, []);

  // Poll for new messages every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchThreads();
      if (selectedThread) {
        loadMessages(selectedThread.id, true);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchThreads, selectedThread]);

  // Load messages for a thread
  const loadMessages = async (threadId: string, silent = false) => {
    if (!silent) setMessagesLoading(true);
    try {
      const res = await fetch(`/api/dashboard/inbox?thread_id=${threadId}`);
      const data = await res.json();
      setMessages(data.messages || []);
      if (!silent) {
        setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }),
          100,
        );
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  };

  const selectThread = async (thread: Thread) => {
    setSelectedThread(thread);
    await loadMessages(thread.id);
    // Mark as read in local state
    setThreads((prev) =>
      prev.map((t) => (t.id === thread.id ? { ...t, unread_count: 0 } : t)),
    );
    // Fetch contact profile
    fetchContactProfile(thread.id);
  };

  const fetchContactProfile = async (threadId: string) => {
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/dashboard/inbox/contact-profile?thread_id=${threadId}`);
      const data = await res.json();
      setContactProfile(data);
    } catch {
      setContactProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLinkContact = async (type: 'lead' | 'client', contactId: string) => {
    if (!selectedThread) return;
    try {
      if (type === 'lead') {
        // Link existing lead
        await fetch(`/api/dashboard/inbox/${selectedThread.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id: contactId }),
        });
      } else {
        await fetch(`/api/dashboard/inbox/${selectedThread.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'link_client', client_id: contactId }),
        });
      }
      // Refresh profile
      fetchContactProfile(selectedThread.id);
    } catch (err) {
      console.error('Link contact failed:', err);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedThread || !bookingTreatment || !bookingDate) return;
    try {
      await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactProfile?.lead?.name || contactProfile?.client?.name || getContactDisplay(selectedThread),
          phone: contactProfile?.lead?.phone || contactProfile?.client?.phone || selectedThread.contact_phone || '',
          email: contactProfile?.lead?.email || contactProfile?.client?.email || '',
          treatment: bookingTreatment,
          date: bookingDate,
          time: bookingTime || '10:00',
          source: `inbox_${selectedThread.channel}`,
        }),
      });
      setShowBooking(false);
      setBookingTreatment('');
      setBookingDate('');
      setBookingTime('');
      // Refresh profile to show new appointment
      fetchContactProfile(selectedThread.id);
    } catch (err) {
      console.error('Book appointment failed:', err);
    }
  };

  // Send message
  const handleSend = async () => {
    if (!selectedThread || !messageInput.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/dashboard/inbox/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: selectedThread.id,
          content: messageInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setMessageInput('');
        setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }),
          100,
        );
      }
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
    }
  };

  // Send template
  const handleSendTemplate = async () => {
    if (!selectedThread || !templateName.trim()) return;
    setSending(true);
    try {
      const params = templateParams
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      const res = await fetch('/api/dashboard/inbox/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: selectedThread.id,
          content: '',
          template_name: templateName.trim(),
          template_params: params,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setShowTemplateModal(false);
        setTemplateName('');
        setTemplateParams('');
        setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }),
          100,
        );
      }
    } catch (err) {
      console.error('Failed to send template:', err);
    } finally {
      setSending(false);
    }
  };

  // Sync
  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch('/api/dashboard/inbox/sync', { method: 'POST' });
      await fetchThreads();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Update thread status
  const updateThread = async (
    threadId: string,
    updates: { status?: ThreadStatus; assigned_to?: string },
  ) => {
    try {
      await fetch(`/api/dashboard/inbox/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, ...updates } : t,
        ),
      );
      if (selectedThread?.id === threadId) {
        setSelectedThread((prev) => (prev ? { ...prev, ...updates } : prev));
      }
    } catch (err) {
      console.error('Failed to update thread:', err);
    }
  };

  // Create lead from thread
  const handleCreateLead = async () => {
    if (!selectedThread) return;
    try {
      const res = await fetch(`/api/dashboard/inbox/${selectedThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_lead',
          name: newLeadName || getContactDisplay(selectedThread),
          phone: newLeadPhone || selectedThread.contact_phone || '',
          treatment: newLeadTreatment,
        }),
      });
      const data = await res.json();
      if (data.lead_id) {
        setSelectedThread((prev) =>
          prev ? { ...prev, lead_id: data.lead_id } : prev,
        );
        setShowCreateLead(false);
        setNewLeadName('');
        setNewLeadPhone('');
        setNewLeadTreatment('');
      }
    } catch (err) {
      console.error('Create lead failed:', err);
    }
  };

  // Check if WhatsApp 24h window might be expired
  const isWA24hExpired = (thread: Thread): boolean => {
    if (thread.channel !== 'whatsapp') return false;
    if (!thread.last_message_at) return true;
    const diff = Date.now() - new Date(thread.last_message_at).getTime();
    return diff > 24 * 60 * 60 * 1000;
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-serif text-2xl font-semibold text-text-dark">
          Inbox
          {summary && summary.total_unread_threads > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
              {summary.total_unread_threads}
            </span>
          )}
        </h1>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-warm-white transition-colors disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Sync All'}
        </button>
      </div>

      {/* Channel summary badges */}
      {summary && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {summary.whatsapp_unread > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#25D366]/10 text-[#25D366]">
              <span style={{ color: '#25D366' }}>{CHANNEL_CONFIG.whatsapp.icon}</span>
              {summary.whatsapp_unread} unread
            </span>
          )}
          {summary.ig_dm_unread > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#E1306C]/10 text-[#E1306C]">
              <span>{CHANNEL_CONFIG.instagram_dm.icon}</span>
              {summary.ig_dm_unread} unread
            </span>
          )}
          {summary.messenger_unread > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#0084FF]/10 text-[#0084FF]">
              <span>{CHANNEL_CONFIG.messenger.icon}</span>
              {summary.messenger_unread} unread
            </span>
          )}
          {summary.comments_unread > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {CHANNEL_CONFIG.ig_comment.icon} {summary.comments_unread} comments
            </span>
          )}
        </div>
      )}

      {/* Main Layout */}
      <div
        className="flex bg-white rounded-xl border border-border overflow-hidden"
        style={{ height: 'calc(100vh - 240px)' }}
      >
        {/* ---- Left Sidebar: Thread List ---- */}
        <div className="w-80 border-r border-border flex flex-col shrink-0">
          {/* Search */}
          <div className="p-3 border-b border-border">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-warm-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          {/* Channel filter tabs */}
          <div className="flex border-b border-border overflow-x-auto">
            {CHANNEL_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setChannelFilter(f.key)}
                className={`flex-1 min-w-0 px-2 py-2 text-[11px] font-medium whitespace-nowrap transition-colors ${
                  channelFilter === f.key
                    ? 'text-gold border-b-2 border-gold'
                    : 'text-text-muted hover:text-text-dark'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-1 px-3 py-2 border-b border-border-light">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                  statusFilter === f.key
                    ? 'bg-gold/15 text-gold'
                    : 'text-text-muted hover:bg-warm-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-text-muted">No conversations found.</p>
                <button
                  onClick={handleSync}
                  className="mt-3 text-xs text-gold font-medium hover:underline"
                >
                  Sync messages from Meta
                </button>
              </div>
            ) : (
              threads.map((thread) => {
                const cfg = CHANNEL_CONFIG[thread.channel];
                const isSelected = selectedThread?.id === thread.id;
                return (
                  <button
                    key={thread.id}
                    onClick={() => selectThread(thread)}
                    className={`w-full text-left px-4 py-3 border-b border-border-light hover:bg-warm-white transition-colors ${
                      isSelected ? 'bg-gold-pale' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar with channel indicator */}
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gold-pale flex items-center justify-center text-gold-dark text-sm font-semibold">
                          {getInitial(thread)}
                        </div>
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] border-2 border-white"
                          style={{ backgroundColor: cfg.color }}
                          title={cfg.label}
                        >
                          {' '}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-text-dark truncate">
                            {getContactDisplay(thread)}
                          </p>
                          <span className="text-[10px] text-text-muted shrink-0 ml-2">
                            {formatTime(thread.last_message_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{
                              backgroundColor: cfg.color + '15',
                              color: cfg.color,
                            }}
                          >
                            {cfg.label}
                          </span>
                          {thread.assigned_to_name && (
                            <span className="text-[10px] text-text-muted truncate">
                              {thread.assigned_to_name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted truncate mt-0.5">
                          {thread.last_message || 'No messages'}
                        </p>
                      </div>

                      {/* Unread badge */}
                      {thread.unread_count > 0 && (
                        <span
                          className="shrink-0 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
                          style={{ backgroundColor: cfg.color }}
                        >
                          {thread.unread_count > 9 ? '9+' : thread.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ---- Center Panel: Conversation ---- */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-3 opacity-30">
                  {CHANNEL_CONFIG.whatsapp.icon}
                  {CHANNEL_CONFIG.instagram_dm.icon}
                  {CHANNEL_CONFIG.messenger.icon}
                </div>
                <p className="text-lg text-text-muted">Select a conversation</p>
                <p className="text-sm text-text-muted mt-1">
                  Choose a thread from the left to view messages
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                {/* Back button (mobile) */}
                <button
                  onClick={() => setSelectedThread(null)}
                  className="lg:hidden text-text-muted hover:text-text-dark mr-1"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="12 16 6 10 12 4" />
                  </svg>
                </button>

                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gold-pale flex items-center justify-center text-gold-dark text-sm font-semibold">
                    {getInitial(selectedThread)}
                  </div>
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                    style={{ backgroundColor: CHANNEL_CONFIG[selectedThread.channel].color }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-dark truncate">
                      {getContactDisplay(selectedThread)}
                    </p>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor: CHANNEL_CONFIG[selectedThread.channel].color + '15',
                        color: CHANNEL_CONFIG[selectedThread.channel].color,
                      }}
                    >
                      {CHANNEL_CONFIG[selectedThread.channel].label}
                    </span>
                    {/* Thread sentiment badge */}
                    {messages.length > 0 && (() => {
                      const threadMsgs: ThreadMessage[] = messages
                        .filter((m) => m.content)
                        .map((m) => ({
                          id: m.id,
                          direction: m.direction,
                          content: m.content,
                          created_at: m.created_at,
                          agent: m.sent_by || undefined,
                        }));
                      if (threadMsgs.length === 0) return null;
                      const ta = analyzeThread(threadMsgs);
                      const sBg: Record<string, string> = {
                        positive: 'bg-green-100 text-green-700',
                        neutral: 'bg-gray-100 text-gray-600',
                        negative: 'bg-orange-100 text-orange-700',
                        angry: 'bg-red-100 text-red-700',
                      };
                      return (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${sBg[ta.overallSentiment] || ''}`}>
                          {ta.overallSentiment === 'positive' ? '\u{1F60A}' : ta.overallSentiment === 'neutral' ? '\u{1F610}' : ta.overallSentiment === 'negative' ? '\u{1F61F}' : '\u{1F621}'} {ta.overallSentiment}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-text-muted">{getContactSub(selectedThread)}</p>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-2">
                  {/* Assign dropdown */}
                  <select
                    value={selectedThread.assigned_to || ''}
                    onChange={(e) =>
                      updateThread(selectedThread.id, { assigned_to: e.target.value || undefined })
                    }
                    className="text-xs border border-border-light rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                    title="Assign to staff"
                  >
                    <option value="">Unassigned</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  {/* Status toggle */}
                  <div className="flex rounded-lg overflow-hidden border border-border-light">
                    {(['open', 'closed', 'snoozed'] as ThreadStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateThread(selectedThread.id, { status: s })}
                        className={`px-2 py-1 text-[10px] font-medium capitalize transition-colors ${
                          selectedThread.status === s
                            ? 'bg-gold text-white'
                            : 'text-text-muted hover:bg-warm-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Lead/Client link */}
                  {selectedThread.lead_id ? (
                    <a
                      href={`/dashboard/leads?id=${selectedThread.lead_id}`}
                      className="text-[10px] px-2 py-1 rounded bg-green-50 text-green-700 font-medium hover:bg-green-100"
                    >
                      View Lead
                    </a>
                  ) : selectedThread.client_id ? (
                    <a
                      href={`/dashboard/clients?id=${selectedThread.client_id}`}
                      className="text-[10px] px-2 py-1 rounded bg-blue-50 text-blue-700 font-medium hover:bg-blue-100"
                    >
                      View Client
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        setNewLeadName(selectedThread.contact_name || '');
                        setNewLeadPhone(selectedThread.contact_phone || '');
                        setShowCreateLead(true);
                      }}
                      className="text-[10px] px-2 py-1 rounded bg-amber-50 text-amber-700 font-medium hover:bg-amber-100"
                    >
                      + Lead
                    </button>
                  )}

                  {/* Info panel toggle */}
                  <button
                    onClick={() => setInfoPanelOpen(!infoPanelOpen)}
                    className={`p-1.5 rounded transition-colors ${infoPanelOpen ? 'bg-gold/15 text-gold' : 'text-text-muted hover:bg-warm-white'}`}
                    title={infoPanelOpen ? 'Hide info panel' : 'Show info panel'}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="8" cy="8" r="6" />
                      <line x1="8" y1="6" x2="8" y2="11" />
                      <circle cx="8" cy="4.5" r="0.5" fill="currentColor" stroke="none" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Declining sentiment warning */}
              {messages.length >= 4 && (() => {
                const inbound = messages.filter((m) => m.direction === 'inbound' && m.content);
                if (inbound.length < 3) return null;
                const recent = inbound.slice(-3);
                const scores = recent.map((m) => analyzeSentiment(m.content).score);
                const isDecline = scores[0] > scores[1] && scores[1] > scores[2] && scores[0] - scores[2] > 0.2;
                if (!isDecline) return null;
                return (
                  <div className="mx-4 mt-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                    <span className="text-amber-500 text-sm">{'\u26A0\uFE0F'}</span>
                    <p className="text-xs text-amber-800">
                      <span className="font-medium">Client sentiment declining</span> — consider an empathetic response
                    </p>
                  </div>
                );
              })()}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#f5f5f0]">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-pulse text-sm text-text-muted">
                      Loading messages...
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-text-muted">No messages yet</p>
                  </div>
                ) : (
                  <>
                    {/* Date separators + messages */}
                    {messages.map((msg, idx) => {
                      const cfg = CHANNEL_CONFIG[msg.channel];
                      const isOutbound = msg.direction === 'outbound';
                      const prevMsg = idx > 0 ? messages[idx - 1] : null;
                      const showDate =
                        !prevMsg ||
                        new Date(msg.created_at).toDateString() !==
                          new Date(prevMsg.created_at).toDateString();

                      // Comment context
                      const isComment =
                        msg.channel === 'ig_comment' || msg.channel === 'fb_comment';

                      return (
                        <div key={msg.id}>
                          {/* Date separator */}
                          {showDate && (
                            <div className="flex items-center justify-center my-3">
                              <span className="px-3 py-1 bg-white/80 rounded-full text-[10px] text-text-muted font-medium shadow-sm">
                                {new Date(msg.created_at).toLocaleDateString([], {
                                  weekday: 'long',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          )}

                          {/* Comment context label */}
                          {isComment && !isOutbound && (
                            <div className="flex justify-start mb-1">
                              <span className="text-[10px] text-text-muted italic ml-2">
                                Commented on post
                              </span>
                            </div>
                          )}
                          {isComment && isOutbound && (
                            <div className="flex justify-end mb-1">
                              <span className="text-[10px] text-text-muted italic mr-2">
                                Replied to comment
                              </span>
                            </div>
                          )}

                          {/* Message bubble */}
                          <div
                            className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                                isOutbound
                                  ? `${cfg.outboundBg} ${cfg.outboundText} rounded-br-md`
                                  : 'bg-white text-text-dark rounded-bl-md'
                              }`}
                            >
                              {/* Media */}
                              {msg.media_url && (
                                <div className="mb-2">
                                  {msg.media_type === 'image' ? (
                                    <img
                                      src={msg.media_url}
                                      alt="attachment"
                                      className="rounded-lg max-w-full max-h-48 object-cover"
                                    />
                                  ) : msg.media_type === 'video' ? (
                                    <video
                                      src={msg.media_url}
                                      controls
                                      className="rounded-lg max-w-full max-h-48"
                                    />
                                  ) : (
                                    <a
                                      href={msg.media_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs underline"
                                    >
                                      View attachment
                                    </a>
                                  )}
                                </div>
                              )}

                              {/* Text */}
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                              {/* Sentiment indicator for inbound messages */}
                              {!isOutbound && msg.content && (() => {
                                const s = analyzeSentiment(msg.content);
                                if (s.sentiment === 'neutral') return null;
                                const dotColor = s.sentiment === 'positive' ? 'bg-green-400' : s.sentiment === 'negative' ? 'bg-orange-400' : 'bg-red-500';
                                const label = `${s.sentiment} (${s.score >= 0 ? '+' : ''}${s.score.toFixed(2)})${s.urgency !== 'low' ? ` - ${s.urgency} urgency` : ''}`;
                                return (
                                  <div className="flex items-center gap-1 mt-0.5" title={label}>
                                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`} />
                                    <span className="text-[9px] text-text-muted capitalize">{s.sentiment}</span>
                                  </div>
                                );
                              })()}

                              {/* Footer: time, status, sent by */}
                              <div
                                className={`flex items-center gap-1.5 mt-1 ${
                                  isOutbound ? 'justify-end' : ''
                                }`}
                              >
                                {isOutbound && msg.sent_by_name && (
                                  <span
                                    className={`text-[10px] ${
                                      isOutbound &&
                                      cfg.outboundText === 'text-white'
                                        ? 'text-white/50'
                                        : 'text-text-muted'
                                    }`}
                                  >
                                    {msg.sent_by_name}
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] ${
                                    isOutbound &&
                                    cfg.outboundText === 'text-white'
                                      ? 'text-white/60'
                                      : 'text-text-muted'
                                  }`}
                                >
                                  {formatMessageTime(msg.created_at)}
                                </span>
                                {isOutbound && msg.status && (
                                  <span
                                    className={`text-[10px] ${
                                      msg.status === 'read'
                                        ? 'text-blue-400'
                                        : msg.status === 'failed'
                                          ? 'text-red-400'
                                          : isOutbound &&
                                              cfg.outboundText === 'text-white'
                                            ? 'text-white/60'
                                            : 'text-text-muted'
                                    }`}
                                  >
                                    {statusIcons[msg.status] || ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="px-4 py-3 border-t border-border bg-white">
                {/* Channel indicator */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: CHANNEL_CONFIG[selectedThread.channel].color + '15',
                      color: CHANNEL_CONFIG[selectedThread.channel].color,
                    }}
                  >
                    Sending via {CHANNEL_CONFIG[selectedThread.channel].label}
                  </span>

                  {isWA24hExpired(selectedThread) && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                      24h window expired — use Template
                    </span>
                  )}

                  {(selectedThread.channel === 'ig_comment' ||
                    selectedThread.channel === 'fb_comment') && (
                    <span className="text-[10px] text-text-muted italic">
                      Replying to comment by {getContactDisplay(selectedThread)}
                    </span>
                  )}
                </div>

                {/* Input row */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={
                      selectedThread.channel === 'ig_comment' ||
                      selectedThread.channel === 'fb_comment'
                        ? 'Write a reply...'
                        : 'Type a message...'
                    }
                    className="flex-1 px-4 py-2.5 bg-warm-white rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                    disabled={sending}
                  />

                  {/* Template button (WhatsApp only) */}
                  {selectedThread.channel === 'whatsapp' && (
                    <button
                      onClick={() => setShowTemplateModal(true)}
                      className="p-2.5 rounded-full bg-warm-white text-text-muted hover:text-text-dark hover:bg-gray-100 transition-colors"
                      title="Send template message"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="12" height="12" rx="2" />
                        <line x1="5" y1="5" x2="11" y2="5" />
                        <line x1="5" y1="8" x2="11" y2="8" />
                        <line x1="5" y1="11" x2="8" y2="11" />
                      </svg>
                    </button>
                  )}

                  {/* Send button */}
                  <button
                    onClick={handleSend}
                    disabled={!messageInput.trim() || sending}
                    className="px-5 py-2.5 rounded-full text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: messageInput.trim() && !sending
                        ? CHANNEL_CONFIG[selectedThread.channel].color
                        : '#ccc',
                    }}
                  >
                    {sending ? '...' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ---- Right Panel: Contact Info ---- */}
        {selectedThread && infoPanelOpen && (
          <div className="w-80 border-l border-border flex flex-col shrink-0 overflow-y-auto bg-warm-white">
            {profileLoading ? (
              <div className="p-4 space-y-3">
                <div className="h-6 bg-border-light rounded animate-pulse" />
                <div className="h-20 bg-border-light rounded animate-pulse" />
                <div className="h-20 bg-border-light rounded animate-pulse" />
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Contact Card */}
                <div className="bg-white rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gold-pale flex items-center justify-center text-gold-dark text-sm font-semibold">
                      {getInitial(selectedThread)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-dark truncate">
                        {contactProfile?.lead?.name || contactProfile?.client?.name || getContactDisplay(selectedThread)}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {contactProfile?.lead?.phone || contactProfile?.client?.phone || selectedThread.contact_phone || getContactSub(selectedThread)}
                      </p>
                      {(contactProfile?.lead?.email || contactProfile?.client?.email) && (
                        <p className="text-xs text-text-muted truncate">
                          {contactProfile?.lead?.email || contactProfile?.client?.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Social profiles */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {contactProfile?.lead?.instagram_handle && (
                      <a
                        href={`https://instagram.com/${contactProfile.lead.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[#E1306C]/10 text-[#E1306C] font-medium hover:bg-[#E1306C]/20"
                      >
                        @{contactProfile.lead.instagram_handle}
                      </a>
                    )}
                    {contactProfile?.lead?.facebook_id && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1877F2]/10 text-[#1877F2] font-medium">
                        FB: {contactProfile.lead.facebook_id.slice(0, 10)}...
                      </span>
                    )}
                    {contactProfile?.lead?.whatsapp_number && (
                      <a
                        href={`https://wa.me/${contactProfile.lead.whatsapp_number.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[#25D366]/10 text-[#25D366] font-medium hover:bg-[#25D366]/20"
                      >
                        WA: {contactProfile.lead.whatsapp_number}
                      </a>
                    )}
                    {/* Also show from thread if no lead linked */}
                    {!contactProfile?.lead && selectedThread.contact_ig_handle && (
                      <a
                        href={`https://instagram.com/${selectedThread.contact_ig_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[#E1306C]/10 text-[#E1306C] font-medium hover:bg-[#E1306C]/20"
                      >
                        @{selectedThread.contact_ig_handle}
                      </a>
                    )}
                    {!contactProfile?.lead && selectedThread.contact_fb_id && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1877F2]/10 text-[#1877F2] font-medium">
                        FB Connected
                      </span>
                    )}
                  </div>

                  {/* Lead/Client badge */}
                  <div className="flex flex-wrap gap-1.5">
                    {contactProfile?.lead && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                        Lead: {contactProfile.lead.stage || 'new'}
                      </span>
                    )}
                    {contactProfile?.client && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                        Client
                      </span>
                    )}
                    {contactProfile?.lead?.score != null && contactProfile.lead.score > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
                        Score: {contactProfile.lead.score}
                      </span>
                    )}
                    {contactProfile?.lead?.source && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                        {contactProfile.lead.source}
                      </span>
                    )}
                  </div>

                  {/* Lead details */}
                  {contactProfile?.lead?.utm_source && (
                    <div className="mt-2 text-[10px] text-text-muted">
                      <span className="font-medium">Campaign:</span>{' '}
                      {contactProfile.lead.utm_source}
                      {contactProfile.lead.utm_campaign ? ` / ${contactProfile.lead.utm_campaign}` : ''}
                    </div>
                  )}
                  {contactProfile?.lead?.interest && (
                    <div className="mt-1 text-[10px] text-text-muted">
                      <span className="font-medium">Interest:</span> {contactProfile.lead.interest}
                    </div>
                  )}
                  {contactProfile?.lead?.notes && (
                    <div className="mt-1 text-[10px] text-text-muted">
                      <span className="font-medium">Notes:</span> {contactProfile.lead.notes}
                    </div>
                  )}
                </div>

                {/* Match Suggestions — merge with contact */}
                {contactProfile?.match_suggestions && contactProfile.match_suggestions.length > 0 && (
                  <div className="bg-white rounded-xl border border-amber-200 p-4">
                    <h4 className="text-xs font-semibold text-amber-800 mb-2">Possible Matches</h4>
                    <div className="space-y-2">
                      {contactProfile.match_suggestions.map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50">
                          <div>
                            <p className="text-xs font-medium text-text-dark">{s.name}</p>
                            <p className="text-[10px] text-text-muted">{s.phone} {s.type === 'lead' ? `(${s.stage || 'lead'})` : '(client)'}</p>
                          </div>
                          <button
                            onClick={() => handleLinkContact(s.type, s.id)}
                            className="text-[10px] px-2 py-1 rounded bg-amber-100 text-amber-800 font-medium hover:bg-amber-200"
                          >
                            Link
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sentiment Summary */}
                {messages.length > 0 && (() => {
                  const threadMsgs: ThreadMessage[] = messages
                    .filter((m) => m.content && m.direction === 'inbound')
                    .map((m) => ({
                      id: m.id, direction: m.direction, content: m.content, created_at: m.created_at,
                      agent: m.sent_by || undefined,
                    }));
                  if (threadMsgs.length === 0) return null;
                  const ta = analyzeThread(messages.filter((m) => m.content).map((m) => ({
                    id: m.id, direction: m.direction, content: m.content, created_at: m.created_at,
                    agent: m.sent_by || undefined,
                  })));
                  const sentimentColor: Record<string, string> = {
                    positive: 'text-green-600', neutral: 'text-gray-600',
                    negative: 'text-orange-600', angry: 'text-red-600',
                  };
                  const sentimentBg: Record<string, string> = {
                    positive: 'bg-green-50', neutral: 'bg-gray-50',
                    negative: 'bg-orange-50', angry: 'bg-red-50',
                  };
                  return (
                    <div className="bg-white rounded-xl border border-border p-4">
                      <h4 className="text-xs font-semibold text-text-dark mb-2">Sentiment Analysis</h4>
                      <div className={`flex items-center gap-2 p-2.5 rounded-lg ${sentimentBg[ta.overallSentiment] || 'bg-gray-50'}`}>
                        <span className="text-lg">
                          {ta.overallSentiment === 'positive' ? '\u{1F60A}' : ta.overallSentiment === 'neutral' ? '\u{1F610}' : ta.overallSentiment === 'negative' ? '\u{1F61F}' : '\u{1F621}'}
                        </span>
                        <div>
                          <p className={`text-xs font-semibold capitalize ${sentimentColor[ta.overallSentiment] || ''}`}>
                            {ta.overallSentiment}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            Trend: {ta.sentimentTrend} &middot; Score: {ta.avgSentimentScore.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {ta.flagged && ta.flagReasons.length > 0 && (
                        <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-red-50 text-xs text-red-700 font-medium">
                          {ta.flagReasons[0]}
                        </div>
                      )}
                      {ta.topics.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {ta.topics.slice(0, 5).map((t) => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-text-muted">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* User Journey */}
                {contactProfile?.journey && (
                  <div className="bg-white rounded-xl border border-border p-4">
                    <h4 className="text-xs font-semibold text-text-dark mb-3">User Journey</h4>
                    <div className="space-y-2">
                      {/* Journey steps */}
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px] text-blue-700 font-bold">1</span>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-text-dark">Landing Page</p>
                          <p className="text-[10px] text-text-muted truncate max-w-[200px]">
                            {contactProfile.journey.landing_page || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px] text-blue-700 font-bold">2</span>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-text-dark">
                            Browsed {contactProfile.journey.pages_visited} pages
                          </p>
                          <p className="text-[10px] text-text-muted">
                            {Math.round(contactProfile.journey.total_time / 60)}min total time
                          </p>
                        </div>
                      </div>
                      {contactProfile.journey.page_list.length > 0 && (
                        <div className="ml-7 flex flex-wrap gap-1">
                          {contactProfile.journey.page_list.map((p) => (
                            <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-text-muted truncate max-w-[120px]">
                              {p.replace(/^https?:\/\/[^/]+/, '')}
                            </span>
                          ))}
                        </div>
                      )}
                      {contactProfile.journey.cta_clicked && (
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[10px] text-green-700 font-bold">3</span>
                          </div>
                          <p className="text-[11px] font-medium text-green-700">CTA Clicked</p>
                        </div>
                      )}
                      {contactProfile.journey.form_submitted && (
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[10px] text-gold-dark font-bold">{contactProfile.journey.cta_clicked ? '4' : '3'}</span>
                          </div>
                          <p className="text-[11px] font-medium text-gold-dark">Form Submitted</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Appointments */}
                {contactProfile?.appointments && contactProfile.appointments.length > 0 && (
                  <div className="bg-white rounded-xl border border-border p-4">
                    <h4 className="text-xs font-semibold text-text-dark mb-2">Appointments</h4>
                    <div className="space-y-2">
                      {contactProfile.appointments.map((appt) => (
                        <div key={appt.id} className="flex items-center justify-between p-2 rounded-lg bg-warm-white">
                          <div>
                            <p className="text-xs font-medium text-text-dark">{appt.treatment}</p>
                            <p className="text-[10px] text-text-muted">
                              {new Date(appt.date).toLocaleDateString()} {appt.time}
                            </p>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            appt.status === 'confirmed' ? 'bg-green-50 text-green-700'
                            : appt.status === 'cancelled' ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-700'
                          }`}>
                            {appt.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payments */}
                {contactProfile?.payments && contactProfile.payments.length > 0 && (
                  <div className="bg-white rounded-xl border border-border p-4">
                    <h4 className="text-xs font-semibold text-text-dark mb-2">Payments</h4>
                    <div className="space-y-2">
                      {contactProfile.payments.map((pay) => (
                        <div key={pay.id} className="flex items-center justify-between p-2 rounded-lg bg-warm-white">
                          <div>
                            <p className="text-xs font-medium text-text-dark">{pay.treatment}</p>
                            <p className="text-[10px] text-text-muted">
                              {new Date(pay.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-xs font-semibold text-text-dark">
                            {pay.currency} {Number(pay.amount).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-border p-4">
                  <h4 className="text-xs font-semibold text-text-dark mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {!contactProfile?.lead && !contactProfile?.client && (
                      <button
                        onClick={() => {
                          setNewLeadName(selectedThread.contact_name || '');
                          setNewLeadPhone(selectedThread.contact_phone || '');
                          setShowCreateLead(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors"
                      >
                        <span>+</span> Create Lead
                      </button>
                    )}
                    <button
                      onClick={() => setShowBooking(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold/10 text-gold-dark text-xs font-medium hover:bg-gold/20 transition-colors"
                    >
                      <span>&#9654;</span> Book Appt
                    </button>
                    {contactProfile?.lead && (
                      <a
                        href={`/dashboard/leads?id=${contactProfile.lead.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                      >
                        Open Lead
                      </a>
                    )}
                    {contactProfile?.client && (
                      <a
                        href={`/dashboard/clients?id=${contactProfile.client.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                      >
                        Open Client
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---- Booking Modal ---- */}
      {showBooking && selectedThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="font-serif text-lg font-semibold text-text-dark mb-4">
              Book Appointment
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Treatment</label>
                <select
                  value={bookingTreatment}
                  onChange={(e) => setBookingTreatment(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="">Select treatment...</option>
                  <option value="HydraFacial">HydraFacial</option>
                  <option value="Chemical Peel">Chemical Peel</option>
                  <option value="Laser Hair Removal">Laser Hair Removal</option>
                  <option value="Microneedling">Microneedling</option>
                  <option value="PRP Therapy">PRP Therapy</option>
                  <option value="Botox">Botox</option>
                  <option value="Dermal Fillers">Dermal Fillers</option>
                  <option value="Carbon Peel">Carbon Peel</option>
                  <option value="BB Glow">BB Glow</option>
                  <option value="Consultation">Consultation</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Time</label>
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="">Select time...</option>
                  {['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
                    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
                    '18:00', '18:30', '19:00'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowBooking(false)}
                className="px-4 py-2 text-sm text-text-muted hover:text-text-dark"
              >
                Cancel
              </button>
              <button
                onClick={handleBookAppointment}
                disabled={!bookingTreatment || !bookingDate}
                className="px-5 py-2 bg-gold text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Template Modal ---- */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="font-serif text-lg font-semibold text-text-dark mb-4">
              Send WhatsApp Template
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. appointment_reminder"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Parameters (comma-separated)
                </label>
                <input
                  type="text"
                  value={templateParams}
                  onChange={(e) => setTemplateParams(e.target.value)}
                  placeholder="e.g. Aisha, HydraFacial, March 10 at 3 PM"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-sm text-text-muted hover:text-text-dark"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTemplate}
                disabled={!templateName.trim() || sending}
                className="px-5 py-2 bg-[#25D366] text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Create Lead Modal ---- */}
      {showCreateLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="font-serif text-lg font-semibold text-text-dark mb-4">
              Create Lead from Conversation
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Treatment Interest
                </label>
                <input
                  type="text"
                  value={newLeadTreatment}
                  onChange={(e) => setNewLeadTreatment(e.target.value)}
                  placeholder="e.g. HydraFacial, Laser"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowCreateLead(false)}
                className="px-4 py-2 text-sm text-text-muted hover:text-text-dark"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLead}
                disabled={!newLeadName.trim()}
                className="px-5 py-2 bg-gold text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                Create Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
