'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Appointment {
  id: string;
  client_id: string;
  lead_id: string;
  phone: string;
  name: string;
  treatment: string;
  doctor: string;
  date: string;
  time: string;
  duration_min: number;
  status: string;
  price: number;
  notes: string;
  calendar_event_id: string | null;
}

type ViewMode = 'day' | 'week' | 'month';

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  arrived: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-600',
  no_show: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-400',
};

const statusDot: Record<string, string> = {
  scheduled: 'bg-blue-500',
  confirmed: 'bg-green-500',
  arrived: 'bg-amber-500',
  completed: 'bg-gray-400',
  no_show: 'bg-red-500',
  cancelled: 'bg-gray-300',
};

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchAppointments = useCallback(async () => {
    const params = new URLSearchParams();
    if (viewMode === 'day') {
      params.set('date', selectedDate);
    } else if (viewMode === 'week') {
      params.set('range', 'week');
    } else {
      params.set('range', 'month');
    }
    if (filterDoctor) params.set('doctor', filterDoctor);
    if (filterStatus) params.set('status', filterStatus);

    const res = await fetch(`/api/dashboard/appointments?${params}`);
    const data = await res.json();
    setAppointments(Array.isArray(data.appointments) ? data.appointments : Array.isArray(data) ? data : []);
    setLoading(false);
  }, [selectedDate, filterDoctor, filterStatus, viewMode]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const updateStatus = async (aptId: string, newStatus: string) => {
    await fetch('/api/dashboard/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: aptId, status: newStatus }),
    });
    fetchAppointments();
  };

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(formatDate(d));
  };

  const doctors = [...new Set(appointments.map((a) => a.doctor).filter(Boolean))];

  const displayDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-text-dark">Appointments</h1>
          <p className="text-sm text-text-muted mt-1">{displayDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent('aa65335da7b2748caac0f24d1c9d48e2914f5490807998d8e3253c9ee6755522@group.calendar.google.com')}&ctz=Asia/Karachi`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 border border-border text-text-light text-sm font-medium rounded-lg hover:bg-warm-white transition-colors"
          >
            View Calendar
          </a>
          <Link
            href="/dashboard/appointments/new"
            className="px-5 py-2.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
          >
            + New Appointment
          </Link>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-6">
        {/* Date nav */}
        <div className="flex items-center bg-white rounded-lg border border-border">
          <button
            onClick={() => navigateDate(-1)}
            className="px-3 py-2 text-text-muted hover:text-gold transition-colors"
          >
            &larr;
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2 py-2 text-sm border-0 focus:outline-none"
          />
          <button
            onClick={() => navigateDate(1)}
            className="px-3 py-2 text-text-muted hover:text-gold transition-colors"
          >
            &rarr;
          </button>
        </div>

        <button
          onClick={() => setSelectedDate(formatDate(new Date()))}
          className="px-3 py-2 text-sm bg-white border border-border rounded-lg hover:bg-warm-white transition-colors"
        >
          Today
        </button>

        {/* View mode */}
        <div className="flex bg-white rounded-lg border border-border overflow-hidden">
          {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-2 text-sm capitalize transition-colors ${
                viewMode === mode ? 'bg-gold text-white' : 'text-text-light hover:bg-warm-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Filters */}
        <select
          value={filterDoctor}
          onChange={(e) => setFilterDoctor(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-gold"
        >
          <option value="">All Doctors</option>
          {doctors.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-gold"
        >
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="confirmed">Confirmed</option>
          <option value="arrived">Arrived</option>
          <option value="completed">Completed</option>
          <option value="no_show">No Show</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Appointment List */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-border-light rounded-lg" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <p className="text-text-muted text-sm">No appointments {viewMode === 'day' ? 'for this date' : `this ${viewMode}`}.</p>
          <Link
            href="/dashboard/appointments/new"
            className="inline-block mt-4 text-sm text-gold hover:text-gold-dark font-medium"
          >
            + Book an appointment
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className={`bg-white rounded-xl border border-border p-4 flex items-center gap-4 hover:shadow-sm transition-shadow ${
                apt.status === 'cancelled' ? 'opacity-50' : ''
              }`}
            >
              {/* Time */}
              <div className="w-20 text-center shrink-0">
                <p className="text-lg font-semibold text-text-dark">{apt.time}</p>
                <p className="text-xs text-text-muted">{apt.duration_min}min</p>
              </div>

              {/* Status dot */}
              <div className={`w-3 h-3 rounded-full shrink-0 ${statusDot[apt.status] || 'bg-gray-300'}`} />

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium text-text-dark ${apt.status === 'cancelled' ? 'line-through' : ''}`}>
                  {apt.name}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {apt.treatment}
                  {apt.doctor && ` \u00B7 ${apt.doctor}`}
                </p>
              </div>

              {/* Status badge */}
              <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${statusColors[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                {apt.status.replace('_', ' ')}
              </span>

              {/* Status actions */}
              <select
                value={apt.status}
                onChange={(e) => updateStatus(apt.id, e.target.value)}
                className="text-xs border border-border rounded px-2 py-1 bg-white focus:outline-none focus:border-gold shrink-0"
              >
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="arrived">Arrived</option>
                <option value="completed">Completed</option>
                <option value="no_show">No Show</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Calendar sync indicator */}
              {apt.calendar_event_id && (
                <span className="text-xs text-green-600 shrink-0" title="Synced to Google Calendar">
                  📅
                </span>
              )}

              {/* Price */}
              {apt.price > 0 && (
                <span className="text-sm text-text-dark font-medium shrink-0">
                  PKR {apt.price.toLocaleString()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {viewMode !== 'day' && (
        <div className="mt-6 bg-white rounded-xl border border-border p-8 text-center">
          <p className="text-sm text-text-muted">
            {viewMode === 'week' ? 'Week' : 'Month'} calendar view coming soon. Showing list view.
          </p>
        </div>
      )}
    </div>
  );
}
