'use client';

import { useState, useEffect, useCallback } from 'react';
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
  treatments: unknown[];
  preferred_doctor: string;
  notes: string;
}

type SortKey = 'name' | 'phone' | 'visit_count' | 'total_spent' | 'last_visit' | 'preferred_doctor';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('last_visit');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchClients = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('sort', sortKey);
    params.set('order', sortDir.toUpperCase());
    const res = await fetch(`/api/dashboard/clients?${params}`);
    const data = await res.json();
    setClients(data.clients || data);
    setLoading(false);
  }, [search, sortKey, sortDir]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="text-border ml-1">&#x25B4;&#x25BE;</span>;
    return <span className="text-gold ml-1">{sortDir === 'asc' ? '\u25B4' : '\u25BE'}</span>;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border-light rounded w-48" />
          <div className="h-96 bg-border-light rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-semibold text-text-dark">Clients</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold w-72"
          />
          <span className="text-sm text-text-muted">{clients.length} clients</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-warm-white">
              {([
                ['name', 'Name'],
                ['phone', 'Phone'],
                ['visit_count', 'Visits'],
                ['total_spent', 'Total Spent'],
                ['last_visit', 'Last Visit'],
                ['preferred_doctor', 'Preferred Doctor'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted cursor-pointer hover:text-gold select-none"
                >
                  {label}
                  <SortIcon col={key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-border-light hover:bg-warm-white transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="text-sm font-medium text-text-dark hover:text-gold transition-colors"
                  >
                    {client.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-text-light">{client.phone}</td>
                <td className="px-4 py-3 text-sm text-text-dark font-medium">{client.visit_count}</td>
                <td className="px-4 py-3 text-sm text-text-dark">
                  {client.total_spent > 0 ? `PKR ${client.total_spent.toLocaleString()}` : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-text-light">
                  {client.last_visit ? new Date(client.last_visit).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-text-light">{client.preferred_doctor || '-'}</td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-text-muted">
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
