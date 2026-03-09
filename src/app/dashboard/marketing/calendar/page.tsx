'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LogEntry {
  id: string;
  agent?: string;
  action?: string;
  decision?: string;
  result?: string;
  created_at?: string;
}

interface CalendarPost {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'reel' | 'carousel' | 'post' | 'video';
  title: string;
  agent?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TYPE_COLORS: Record<string, string> = {
  reel: 'bg-purple-500',
  carousel: 'bg-blue-500',
  post: 'bg-amber-500',
  video: 'bg-green-500',
};

const TYPE_LABELS: Record<string, string> = {
  reel: 'Reel',
  carousel: 'Carousel',
  post: 'Post',
  video: 'Video',
};

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function detectType(action: string): 'reel' | 'carousel' | 'post' | 'video' {
  const a = action.toLowerCase();
  if (a.includes('reel')) return 'reel';
  if (a.includes('carousel')) return 'carousel';
  if (a.includes('video') || a.includes('ad_creative')) return 'video';
  return 'post';
}

function getMonthLabel(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const cells = getCalendarDays(year, month);
  const today = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : -1;

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, logRes] = await Promise.all([
        fetch('/api/dashboard/marketing/executions').then((r) => r.json()).catch(() => null),
        fetch('/api/dashboard/marketing/log?limit=100').then((r) => r.json()).catch(() => null),
      ]);
      setConnected(statusRes?.connected === true);

      const allLog: LogEntry[] = logRes?.log ?? [];

      // Convert log entries to calendar posts
      const calPosts: CalendarPost[] = allLog
        .filter((e) => e.created_at && (
          e.action?.includes('publish') ||
          e.action?.includes('post') ||
          e.action?.includes('reel') ||
          e.action?.includes('carousel') ||
          e.action?.includes('video')
        ))
        .map((e) => ({
          id: e.id,
          date: new Date(e.created_at!).toISOString().split('T')[0],
          type: detectType(e.action ?? ''),
          title: e.decision || e.result || e.action || 'Post',
          agent: e.agent,
        }));

      setPosts(calPosts);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
    setSelectedDay(null);
  }

  // Get posts for a specific day
  function getPostsForDay(day: number): CalendarPost[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return posts.filter((p) => p.date === dateStr);
  }

  // Get selected day's posts
  const selectedPosts = selectedDay ? getPostsForDay(selectedDay) : [];

  // Count total scheduled
  const monthPosts = posts.filter((p) => {
    const d = new Date(p.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/marketing"
            className="text-text-muted hover:text-text-dark transition-colors text-sm"
          >
            Marketing Studio
          </Link>
          <span className="text-text-muted">/</span>
          <h1 className="font-serif text-2xl font-semibold text-text-dark">Content Calendar</h1>
        </div>
        {connected ? (
          <div className="flex items-center gap-3">
            {/* Type legend */}
            <div className="hidden md:flex items-center gap-3">
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[key]}`} />
                  <span className="text-[10px] text-text-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          !loading && (
            <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
              Pipeline not connected
            </span>
          )
        )}
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-border overflow-hidden mb-6">
        {/* Month header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
          <button
            onClick={prevMonth}
            className="text-text-muted hover:text-text-dark transition-colors p-1"
          >
            &#9664;
          </button>
          <div className="text-center">
            <h2 className="text-sm font-semibold text-text-dark">{getMonthLabel(year, month)}</h2>
            <span className="text-xs text-text-muted">
              {monthPosts.length} post{monthPosts.length !== 1 ? 's' : ''} this month
            </span>
          </div>
          <button
            onClick={nextMonth}
            className="text-text-muted hover:text-text-dark transition-colors p-1"
          >
            &#9654;
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-border-light">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-text-muted"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dayPosts = day ? getPostsForDay(day) : [];
            const isSelected = day === selectedDay;

            return (
              <div
                key={i}
                onClick={() => day && setSelectedDay(isSelected ? null : day)}
                className={`
                  min-h-[80px] px-2 py-1.5 border-b border-r border-border-light cursor-pointer transition-colors
                  ${day === null ? 'bg-warm-white/50 cursor-default' : 'bg-white hover:bg-warm-white/50'}
                  ${day === today ? 'ring-1 ring-inset ring-gold/30' : ''}
                  ${isSelected ? 'bg-gold-pale/30 ring-1 ring-inset ring-gold/50' : ''}
                `}
              >
                {day !== null && (
                  <>
                    <span
                      className={`
                        inline-flex items-center justify-center w-6 h-6 rounded-full text-xs
                        ${day === today ? 'bg-gold text-white font-bold' : 'text-text-light'}
                      `}
                    >
                      {day}
                    </span>
                    {/* Post indicators */}
                    {dayPosts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {dayPosts.slice(0, 3).map((p) => (
                          <div
                            key={p.id}
                            className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[p.type]}`}
                            title={`${TYPE_LABELS[p.type]}: ${p.title}`}
                          />
                        ))}
                        {dayPosts.length > 3 && (
                          <span className="text-[8px] text-text-muted">+{dayPosts.length - 3}</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <h2 className="text-sm font-semibold text-text-dark mb-3">
            {new Date(year, month, selectedDay).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h2>
          {selectedPosts.length > 0 ? (
            <div className="space-y-2">
              {selectedPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-3 py-2 border-b border-border-light last:border-0"
                >
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${TYPE_COLORS[post.type]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-dark truncate">{post.title}</p>
                    <p className="text-[10px] text-text-muted">
                      {TYPE_LABELS[post.type]}
                      {post.agent ? ` by ${post.agent}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted">No posts on this day.</p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <p className="text-sm font-medium text-text-dark">
            {connected ? 'No published content yet' : 'Scheduled posts will appear here'}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {connected
              ? 'Once you create and publish reels, carousels, and posts through the pipeline, they will appear on this calendar.'
              : 'Once the marketing pipeline is connected, your scheduled reels, carousels, and posts will show on the calendar.'}
          </p>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <p className="text-sm text-text-muted">Loading calendar data...</p>
        </div>
      )}
    </div>
  );
}
