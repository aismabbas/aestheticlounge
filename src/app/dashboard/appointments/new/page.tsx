'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { categories } from '@/data/services';

interface Staff {
  id: string;
  name: string;
  role: string;
  active: boolean;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: searchParams.get('name') || '',
    phone: searchParams.get('phone') || '',
    client_id: searchParams.get('client_id') || '',
    lead_id: searchParams.get('lead_id') || '',
    treatment: '',
    doctor: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    duration_min: 30,
    price: 0,
    notes: '',
  });

  useEffect(() => {
    fetch('/api/dashboard/staff')
      .then((r) => r.json())
      .then((stf) => {
        setStaff((Array.isArray(stf) ? stf : stf.staff || []).filter((s: Staff) => s.active && s.role === 'doctor'));
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/dashboard/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create appointment');
      }

      router.push('/dashboard/appointments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
        <Link href="/dashboard/appointments" className="hover:text-gold transition-colors">Appointments</Link>
        <span>/</span>
        <span className="text-text-dark">New Appointment</span>
      </div>

      <h1 className="font-serif text-2xl font-semibold text-text-dark mb-6">Book New Appointment</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 space-y-5">
        {/* Client Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">
              Client Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">
              Phone *
            </label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
              placeholder="+92 3XX XXXXXXX"
            />
          </div>
        </div>

        {/* Treatment */}
        <div>
          <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">
            Treatment *
          </label>
          <select
            required
            value={form.treatment}
            onChange={(e) => setForm({ ...form, treatment: e.target.value })}
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
          >
            <option value="">Select treatment...</option>
            {categories.map((cat) => (
              <optgroup key={cat.slug} label={cat.name}>
                {cat.treatments.map((t) => (
                  <option key={t.slug} value={t.name}>
                    {t.name} — {t.priceDisplay}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Doctor */}
        <div>
          <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">
            Doctor
          </label>
          <select
            value={form.doctor}
            onChange={(e) => setForm({ ...form, doctor: e.target.value })}
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
          >
            <option value="">Any available doctor</option>
            {staff.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">
              Date *
            </label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">
              Time *
            </label>
            <input
              type="time"
              required
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">
              Duration (min)
            </label>
            <input
              type="number"
              value={form.duration_min}
              onChange={(e) => setForm({ ...form, duration_min: parseInt(e.target.value) || 30 })}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">
            Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold resize-none"
            placeholder="Any special instructions..."
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/dashboard/appointments"
            className="text-sm text-text-muted hover:text-text-dark transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}
