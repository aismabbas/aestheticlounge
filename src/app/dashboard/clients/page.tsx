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
  do_not_disturb: boolean;
  photo_consent: boolean;
  tags: string[];
}

type SortKey = 'name' | 'phone' | 'visit_count' | 'total_spent' | 'last_visit' | 'preferred_doctor';

interface FilterState {
  dnd: boolean;
  photo_consent: boolean;
  vip: boolean;
  new: boolean;
  tag: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('last_visit');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    dnd: false,
    photo_consent: false,
    vip: false,
    new: false,
    tag: '',
  });

  const fetchClients = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('sort', sortKey);
    params.set('order', sortDir.toUpperCase());
    if (filters.dnd) params.set('dnd', 'true');
    if (filters.photo_consent) params.set('photo_consent', 'true');
    if (filters.vip) params.set('vip', 'true');
    if (filters.new) params.set('new', 'true');
    if (filters.tag) params.set('tag', filters.tag);
    const res = await fetch(`/api/dashboard/clients?${params}`);
    const data = await res.json();
    setClients(Array.isArray(data.clients) ? data.clients : Array.isArray(data) ? data : []);
    setAllTags(Array.isArray(data.allTags) ? data.allTags : []);
    setLoading(false);
  }, [search, sortKey, sortDir, filters]);

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

  const toggleFilter = (key: keyof FilterState) => {
    if (key === 'tag') return;
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
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
            placeholder="Search by name, phone, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold w-72"
          />
          <span className="text-sm text-text-muted">{clients.length} clients</span>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-semibold uppercase text-text-muted mr-1">Filters:</span>
        {([
          { key: 'dnd' as const, label: 'Do Not Disturb', icon: '\uD83D\uDD34' },
          { key: 'photo_consent' as const, label: 'Photo Consent', icon: '\uD83D\uDCF8' },
          { key: 'vip' as const, label: 'VIP', icon: '\u2B50' },
          { key: 'new' as const, label: 'New (30d)', icon: '\uD83C\uDD95' },
        ]).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              filters[key]
                ? 'bg-gold text-white border-gold'
                : 'bg-white text-text-light border-border hover:border-gold hover:text-gold'
            }`}
          >
            {icon} {label}
          </button>
        ))}

        {/* Tag filter dropdown */}
        {allTags.length > 0 && (
          <select
            value={filters.tag}
            onChange={(e) => setFilters((prev) => ({ ...prev, tag: e.target.value }))}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border appearance-none pr-6 ${
              filters.tag
                ? 'bg-gold text-white border-gold'
                : 'bg-white text-text-light border-border hover:border-gold'
            }`}
          >
            <option value="">All Tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}

        {/* Clear filters */}
        {(filters.dnd || filters.photo_consent || filters.vip || filters.new || filters.tag) && (
          <button
            onClick={() => setFilters({ dnd: false, photo_consent: false, vip: false, new: false, tag: '' })}
            className="px-3 py-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            Clear all
          </button>
        )}
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
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="text-sm font-medium text-text-dark hover:text-gold transition-colors"
                    >
                      {client.name}
                    </Link>
                    {client.do_not_disturb && (
                      <span title="Do Not Disturb" className="text-xs">{'\uD83D\uDD34'}</span>
                    )}
                    {client.tags && client.tags.length > 0 && (
                      <div className="flex gap-1">
                        {client.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded-full text-[10px] bg-gold/10 text-gold font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                        {client.tags.length > 2 && (
                          <span className="text-[10px] text-text-muted">+{client.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
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
