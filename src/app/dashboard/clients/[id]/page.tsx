'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Client {
  id: string;
  lead_id: string;
  name: string;
  phone: string;
  email: string;
  first_visit: string;
  last_visit: string;
  visit_count: number;
  total_spent: number;
  treatments: { name: string; date: string; amount?: number }[];
  preferred_doctor: string;
  notes: string;
}

interface Appointment {
  id: string;
  treatment: string;
  doctor: string;
  date: string;
  time: string;
  status: string;
  price: number;
}

const statusBadge: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  arrived: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-600',
  no_show: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-400 line-through',
};

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    fetch(`/api/dashboard/clients/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setClient(data.client);
        setAppointments(data.appointments || []);
        setLoading(false);
      });
  }, [id]);

  const saveNotes = async () => {
    if (!client) return;
    const existing = client.notes || '';
    const updated = existing
      ? `${existing}\n[${new Date().toLocaleDateString()}] ${noteText}`
      : `[${new Date().toLocaleDateString()}] ${noteText}`;

    await fetch(`/api/dashboard/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: updated }),
    });
    setClient((prev) => (prev ? { ...prev, notes: updated } : prev));
    setNoteText('');
  };

  if (loading || !client) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border-light rounded w-64" />
          <div className="h-64 bg-border-light rounded-lg" />
        </div>
      </div>
    );
  }

  const treatments = Array.isArray(client.treatments) ? client.treatments : [];

  return (
    <div className="max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
        <Link href="/dashboard/clients" className="hover:text-gold transition-colors">Clients</Link>
        <span>/</span>
        <span className="text-text-dark">{client.name}</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main info */}
        <div className="col-span-2 space-y-6">
          {/* Contact card */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-serif text-2xl font-semibold text-text-dark">{client.name}</h1>
                <p className="text-sm text-text-light mt-1">{client.phone}</p>
                {client.email && <p className="text-sm text-text-light">{client.email}</p>}
              </div>
              <div className="flex gap-2">
                <a
                  href={`tel:${client.phone}`}
                  className="px-4 py-2 text-sm font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  Call
                </a>
                <a
                  href={`https://wa.me/${client.phone?.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-medium bg-whatsapp/10 text-whatsapp rounded-lg hover:bg-whatsapp/20 transition-colors"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-warm-white rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold text-gold">{client.visit_count}</p>
                <p className="text-xs text-text-muted mt-1">Visits</p>
              </div>
              <div className="bg-warm-white rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold text-gold">
                  {client.total_spent > 0 ? `${(client.total_spent / 1000).toFixed(0)}k` : '0'}
                </p>
                <p className="text-xs text-text-muted mt-1">Spent (PKR)</p>
              </div>
              <div className="bg-warm-white rounded-lg p-3 text-center">
                <p className="text-sm font-medium text-text-dark">
                  {client.first_visit ? new Date(client.first_visit).toLocaleDateString() : '-'}
                </p>
                <p className="text-xs text-text-muted mt-1">First Visit</p>
              </div>
              <div className="bg-warm-white rounded-lg p-3 text-center">
                <p className="text-sm font-medium text-text-dark">
                  {client.last_visit ? new Date(client.last_visit).toLocaleDateString() : '-'}
                </p>
                <p className="text-xs text-text-muted mt-1">Last Visit</p>
              </div>
            </div>
          </div>

          {/* Treatment History */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Treatment History</h2>
            {treatments.length === 0 ? (
              <p className="text-sm text-text-muted">No treatment records yet.</p>
            ) : (
              <div className="space-y-2">
                {treatments.map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                    <div>
                      <p className="text-sm font-medium text-text-dark">{t.name}</p>
                      {t.date && <p className="text-xs text-text-muted">{new Date(t.date).toLocaleDateString()}</p>}
                    </div>
                    {t.amount && (
                      <span className="text-sm text-text-dark">PKR {t.amount.toLocaleString()}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Appointment History */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-semibold text-text-dark">Appointments</h2>
              <Link
                href={`/dashboard/appointments/new?name=${encodeURIComponent(client.name)}&phone=${encodeURIComponent(client.phone || '')}&client_id=${client.id}`}
                className="text-sm text-gold hover:text-gold-dark transition-colors font-medium"
              >
                + New Appointment
              </Link>
            </div>
            {appointments.length === 0 ? (
              <p className="text-sm text-text-muted">No appointments.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-xs font-semibold uppercase text-text-muted">Date</th>
                    <th className="text-left py-2 text-xs font-semibold uppercase text-text-muted">Time</th>
                    <th className="text-left py-2 text-xs font-semibold uppercase text-text-muted">Treatment</th>
                    <th className="text-left py-2 text-xs font-semibold uppercase text-text-muted">Doctor</th>
                    <th className="text-left py-2 text-xs font-semibold uppercase text-text-muted">Status</th>
                    <th className="text-right py-2 text-xs font-semibold uppercase text-text-muted">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="border-b border-border-light">
                      <td className="py-2.5 text-sm text-text-dark">{new Date(apt.date).toLocaleDateString()}</td>
                      <td className="py-2.5 text-sm text-text-light">{apt.time}</td>
                      <td className="py-2.5 text-sm text-text-dark">{apt.treatment}</td>
                      <td className="py-2.5 text-sm text-text-light">{apt.doctor || '-'}</td>
                      <td className="py-2.5">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                          {apt.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 text-sm text-text-dark text-right">
                        {apt.price ? `PKR ${apt.price.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-serif text-lg font-semibold text-text-dark mb-2">Preferred Doctor</h2>
            <p className="text-sm text-text-dark">{client.preferred_doctor || 'Not set'}</p>
          </div>

          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-serif text-lg font-semibold text-text-dark mb-3">Notes</h2>
            {client.notes && (
              <pre className="text-sm text-text-light whitespace-pre-wrap bg-warm-white rounded-lg p-3 mb-3 font-sans max-h-64 overflow-y-auto">
                {client.notes}
              </pre>
            )}
            <div className="space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold resize-none"
              />
              <button
                onClick={saveNotes}
                className="w-full px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
