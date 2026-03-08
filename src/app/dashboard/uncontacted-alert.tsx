'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface UncontactedData {
  count: number;
  oldest_seconds: number;
  leads: Array<{
    id: string;
    name: string;
    phone: string;
    seconds_waiting: number;
  }>;
}

function fmtTime(seconds: number): string {
  if (seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function UncontactedAlertCard() {
  const [data, setData] = useState<UncontactedData | null>(null);
  const [tickOffset, setTickOffset] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/leads/uncontacted?scope=mine');
        if (res.ok) {
          const d = await res.json();
          setData(d);
          setTickOffset(0);
        }
      } catch {
        // silent
      }
    }
    fetchData();
    const refresh = setInterval(fetchData, 30000);
    return () => clearInterval(refresh);
  }, []);

  // Tick every second to keep timer live
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (data && data.count > 0) {
      timerRef.current = setInterval(() => {
        setTickOffset((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [data]);

  if (!data || data.count === 0) return null;

  const oldestWait = data.oldest_seconds + tickOffset;
  const isUrgent = oldestWait > 900; // > 15 min

  return (
    <Link href="/dashboard/leads?filter=my-uncontacted">
      <div
        className={`rounded-xl border-2 px-5 py-4 mb-6 cursor-pointer hover:shadow-md transition-all ${
          isUrgent
            ? 'border-red-400 bg-red-50 animate-pulse'
            : 'border-amber-300 bg-amber-50'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isUrgent && (
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
            )}
            <div>
              <p className={`text-sm font-semibold ${isUrgent ? 'text-red-800' : 'text-amber-800'}`}>
                {data.count} Uncontacted Lead{data.count !== 1 ? 's' : ''}
              </p>
              <p className={`text-xs mt-0.5 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
                Oldest waiting: <span className="font-bold tabular-nums">{fmtTime(oldestWait)}</span>
                {isUrgent && ' — Contact immediately!'}
              </p>
            </div>
          </div>
          <span className={`text-xs font-medium ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
            View Leads &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
