'use client';

import Link from 'next/link';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCalendarDays(): (number | null)[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getMonthLabel(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function CalendarPage() {
  const cells = getCalendarDays();
  const today = new Date().getDate();

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
        <button
          disabled
          className="px-5 py-2.5 bg-gold/40 text-white text-sm font-medium rounded-lg cursor-not-allowed"
        >
          Connect Pipeline
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {/* Month header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
          <h2 className="text-sm font-semibold text-text-dark">{getMonthLabel()}</h2>
          <span className="text-xs text-text-muted">0 scheduled posts</span>
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
          {cells.map((day, i) => (
            <div
              key={i}
              className={`
                min-h-[80px] px-2 py-1.5 border-b border-r border-border-light
                ${day === null ? 'bg-warm-white/50' : 'bg-white'}
                ${day === today ? 'ring-1 ring-inset ring-gold/30' : ''}
              `}
            >
              {day !== null && (
                <span
                  className={`
                    inline-flex items-center justify-center w-6 h-6 rounded-full text-xs
                    ${day === today ? 'bg-gold text-white font-bold' : 'text-text-light'}
                  `}
                >
                  {day}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Empty state below calendar */}
      <div className="bg-white rounded-xl border border-border p-8 text-center mt-6">
        <p className="text-sm font-medium text-text-dark">Scheduled posts will appear here</p>
        <p className="text-xs text-text-muted mt-1">
          Once the marketing pipeline is connected, your scheduled reels, carousels, and posts will show on the calendar.
        </p>
      </div>
    </div>
  );
}
