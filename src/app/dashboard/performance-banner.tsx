'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface BannerData {
  my_stats: {
    leads_handled: number;
    avg_response_seconds: number;
    fastest: number;
  };
  waiting_leads: Array<{
    lead_id: string;
    seconds_waiting: number;
  }>;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function PerformanceBanner() {
  const [data, setData] = useState<BannerData | null>(null);
  const [waitingSeconds, setWaitingSeconds] = useState<number>(0);
  const [waitingCount, setWaitingCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/performance?period=today');
        if (res.ok) {
          const d: BannerData = await res.json();
          setData(d);
          setWaitingCount(d.waiting_leads.length);
          // Use the longest waiting lead's time as the display timer
          if (d.waiting_leads.length > 0) {
            const maxWait = Math.max(...d.waiting_leads.map((wl) => wl.seconds_waiting));
            setWaitingSeconds(maxWait);
          }
        }
      } catch {
        // silent fail — banner is supplementary
      }
    }
    fetchData();
    const refresh = setInterval(fetchData, 30000);
    return () => clearInterval(refresh);
  }, []);

  // Tick the waiting timer every second
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (waitingCount > 0) {
      timerRef.current = setInterval(() => {
        setWaitingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [waitingCount]);

  if (!data) return null;

  const avg = data.my_stats.avg_response_seconds;
  const bgColor = avg <= 0
    ? 'bg-gray-50 border-gray-200'
    : avg < 300
      ? 'bg-green-50 border-green-200'
      : avg < 900
        ? 'bg-amber-50 border-amber-200'
        : 'bg-red-50 border-red-200';

  const textColor = avg <= 0
    ? 'text-gray-600'
    : avg < 300
      ? 'text-green-700'
      : avg < 900
        ? 'text-amber-700'
        : 'text-red-700';

  return (
    <Link href="/dashboard/performance">
      <div className={`rounded-xl border px-5 py-3 mb-6 flex items-center justify-between gap-4 flex-wrap cursor-pointer hover:shadow-sm transition-shadow ${bgColor}`}>
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Your Response Time Today</p>
            <p className={`text-lg font-semibold tabular-nums ${textColor}`}>
              {data.my_stats.leads_handled > 0 ? formatTime(avg) : '--'}
            </p>
          </div>

          {waitingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 rounded-lg">
              <span className="text-sm">&#x23F1;</span>
              <span className="text-sm font-medium text-red-700 tabular-nums">
                {waitingCount} lead{waitingCount !== 1 ? 's' : ''} waiting &mdash; {formatTime(waitingSeconds)}
              </span>
            </div>
          )}

          <div className="text-xs text-text-muted">
            <span className="font-medium text-text-dark">{data.my_stats.leads_handled}</span> leads handled today
            {data.my_stats.leads_handled > 0 && (
              <>
                {' | Avg: '}
                <span className={`font-medium ${textColor}`}>{formatTime(avg)}</span>
                {' | Best: '}
                <span className="font-medium text-green-600">{formatTime(data.my_stats.fastest)}</span>
              </>
            )}
          </div>
        </div>

        <span className="text-xs text-text-muted hover:text-gold transition-colors">
          View Details &rarr;
        </span>
      </div>
    </Link>
  );
}
