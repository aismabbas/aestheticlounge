'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface Payment {
  id: string;
  client_id: string;
  client_name: string;
  amount: number;
  currency: string;
  treatment: string;
  payment_method: string;
  status: string;
  receipt_number: string;
  notes: string;
  staff_id: string;
  created_at: string;
}

interface Stats {
  month_revenue: number;
  pending_total: number;
  today_collections: number;
  avg_transaction: number;
}

type SortKey = 'created_at' | 'amount' | 'client_name' | 'treatment' | 'status' | 'payment_method';

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  easypaisa: 'EasyPaisa',
  jazzcash: 'JazzCash',
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  refunded: 'bg-red-50 text-red-700 border-red-200',
  partial: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats>({ month_revenue: 0, pending_total: 0, today_collections: 0, avg_transaction: 0 });
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Client search
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/dashboard/clients?limit=500')
      .then((r) => r.json())
      .then((d) => setClients(d.clients || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClients = clientSearch.length > 0
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.phone.includes(clientSearch),
      ).slice(0, 10)
    : clients.slice(0, 10);

  // Form state
  const [form, setForm] = useState({
    client_name: '',
    client_id: '',
    amount: '',
    currency: 'PKR',
    treatment: '',
    payment_method: 'cash',
    status: 'completed',
    receipt_number: '',
    notes: '',
  });

  const fetchPayments = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('sort', sortKey);
    params.set('order', sortDir.toUpperCase());
    if (filterStatus) params.set('status', filterStatus);
    if (filterMethod) params.set('method', filterMethod);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);

    const res = await fetch(`/api/dashboard/payments?${params}`);
    const data = await res.json();
    setPayments(data.payments || []);
    setStats(data.stats || { month_revenue: 0, pending_total: 0, today_collections: 0, avg_transaction: 0 });
    setLoading(false);
  }, [sortKey, sortDir, filterStatus, filterMethod, dateFrom, dateTo]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({
          client_name: '',
          client_id: '',
          amount: '',
          currency: 'PKR',
          treatment: '',
          payment_method: 'cash',
          status: 'completed',
          receipt_number: '',
          notes: '',
        });
        fetchPayments();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border-light rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-border-light rounded-lg" />
            ))}
          </div>
          <div className="h-96 bg-border-light rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-semibold text-text-dark">Payments</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold/90 transition-colors"
        >
          {showForm ? 'Cancel' : 'Record Payment'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">This Month</p>
          <p className="text-xl font-semibold text-text-dark">{formatCurrency(stats.month_revenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Pending</p>
          <p className="text-xl font-semibold text-amber-600">{formatCurrency(stats.pending_total)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Today&apos;s Collections</p>
          <p className="text-xl font-semibold text-emerald-600">{formatCurrency(stats.today_collections)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Avg Transaction</p>
          <p className="text-xl font-semibold text-text-dark">{formatCurrency(stats.avg_transaction)}</p>
        </div>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Record New Payment</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div ref={clientRef} className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Client *</label>
              <input
                type="text"
                required
                value={form.client_name}
                onChange={(e) => {
                  setForm({ ...form, client_name: e.target.value, client_id: '' });
                  setClientSearch(e.target.value);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Search by name or phone..."
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
              />
              {showClientDropdown && filteredClients.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-border rounded-lg shadow-lg">
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, client_name: c.name, client_id: c.id });
                        setClientSearch('');
                        setShowClientDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-warm-white transition-colors flex items-center justify-between"
                    >
                      <span className="font-medium text-text-dark">{c.name}</span>
                      <span className="text-xs text-text-muted">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
              {form.client_id && (
                <p className="mt-1 text-xs text-emerald-600">Linked to client record</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Treatment *</label>
              <input
                type="text"
                required
                value={form.treatment}
                onChange={(e) => setForm({ ...form, treatment: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Amount (PKR) *</label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Payment Method *</label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="easypaisa">EasyPaisa</option>
                <option value="jazzcash">JazzCash</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
              >
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Receipt #</label>
              <input
                type="text"
                value={form.receipt_number}
                onChange={(e) => setForm({ ...form, receipt_number: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
          <option value="partial">Partial</option>
        </select>
        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
        >
          <option value="">All Methods</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="easypaisa">EasyPaisa</option>
          <option value="jazzcash">JazzCash</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
          placeholder="From"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
          placeholder="To"
        />
        {(filterStatus || filterMethod || dateFrom || dateTo) && (
          <button
            onClick={() => { setFilterStatus(''); setFilterMethod(''); setDateFrom(''); setDateTo(''); }}
            className="text-sm text-text-muted hover:text-gold transition-colors"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-sm text-text-muted">{payments.length} payments</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-warm-white">
              {([
                ['created_at', 'Date'],
                ['client_name', 'Client'],
                ['treatment', 'Treatment'],
                ['amount', 'Amount'],
                ['payment_method', 'Method'],
                ['status', 'Status'],
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
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Receipt #
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <>
                <tr
                  key={payment.id}
                  onClick={() => setExpandedId(expandedId === payment.id ? null : payment.id)}
                  className="border-b border-border-light hover:bg-warm-white transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm text-text-light">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-text-dark">
                    {payment.client_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-light">{payment.treatment}</td>
                  <td className="px-4 py-3 text-sm text-text-dark font-medium">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-light">
                    {METHOD_LABELS[payment.payment_method] || payment.payment_method}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border capitalize ${STATUS_COLORS[payment.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-light">
                    {payment.receipt_number || '-'}
                  </td>
                </tr>
                {expandedId === payment.id && (
                  <tr key={`${payment.id}-detail`} className="border-b border-border-light bg-warm-white">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Payment ID</p>
                          <p className="text-text-dark font-mono text-xs">{payment.id}</p>
                        </div>
                        <div>
                          <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Currency</p>
                          <p className="text-text-dark">{payment.currency}</p>
                        </div>
                        <div>
                          <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Staff ID</p>
                          <p className="text-text-dark">{payment.staff_id || '-'}</p>
                        </div>
                        <div>
                          <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Time</p>
                          <p className="text-text-dark">{new Date(payment.created_at).toLocaleTimeString()}</p>
                        </div>
                        {payment.notes && (
                          <div className="col-span-2 sm:col-span-4">
                            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Notes</p>
                            <p className="text-text-dark">{payment.notes}</p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-text-muted">
                  No payments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
