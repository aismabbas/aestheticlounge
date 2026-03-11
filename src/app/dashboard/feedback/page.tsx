'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Feedback {
  id: string;
  client_name: string | null;
  treatment: string | null;
  rating: number;
  feedback: string;
  would_recommend: boolean | null;
  improvements: string | null;
  created_at: string;
}

interface Complaint {
  id: string;
  complaint: string;
  category: string;
  client_name: string | null;
  client_phone: string | null;
  is_anonymous: boolean;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

type Tab = 'feedback' | 'complaints';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  reviewing: 'bg-amber-50 text-amber-700 border-amber-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  dismissed: 'bg-gray-100 text-gray-500 border-gray-200',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Service Quality': 'bg-purple-50 text-purple-700',
  'Wait Times': 'bg-orange-50 text-orange-700',
  'Staff Behavior': 'bg-red-50 text-red-700',
  'Cleanliness': 'bg-teal-50 text-teal-700',
  'Billing': 'bg-indigo-50 text-indigo-700',
  'Other': 'bg-gray-50 text-gray-700',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function FeedbackDashboardPage() {
  const [tab, setTab] = useState<Tab>('feedback');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Admin notes modal
  const [notesModal, setNotesModal] = useState<Complaint | null>(null);
  const [notesText, setNotesText] = useState('');

  const fetchFeedback = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (ratingFilter) params.set('rating', ratingFilter.toString());
      const res = await fetch(`/api/feedback?${params}`);
      if (res.ok) setFeedbacks(await res.json());
    } catch (err) {
      console.error('[feedback] Fetch error:', err);
    }
  }, [ratingFilter]);

  const fetchComplaints = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      const res = await fetch(`/api/feedback/complaint?${params}`);
      if (res.ok) setComplaints(await res.json());
    } catch (err) {
      console.error('[feedback] Complaints fetch error:', err);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchFeedback(), fetchComplaints()]).finally(() =>
      setLoading(false),
    );
  }, [fetchFeedback, fetchComplaints]);

  async function updateComplaint(
    id: string,
    updates: { status?: string; admin_notes?: string },
  ) {
    try {
      const res = await fetch('/api/feedback/complaint', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComplaints((prev) =>
          prev.map((c) => (c.id === id ? updated : c)),
        );
      }
    } catch (err) {
      console.error('[feedback] Update complaint error:', err);
    }
  }

  function handleSaveNotes() {
    if (!notesModal) return;
    updateComplaint(notesModal.id, { admin_notes: notesText });
    setNotesModal(null);
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  const avgRating =
    feedbacks.length > 0
      ? feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length
      : 0;

  const recommendPct =
    feedbacks.filter((f) => f.would_recommend !== null).length > 0
      ? (feedbacks.filter((f) => f.would_recommend === true).length /
          feedbacks.filter((f) => f.would_recommend !== null).length) *
        100
      : 0;

  const thisMonth = feedbacks.filter((f) => {
    const d = new Date(f.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const ratingDistribution = [5, 4, 3, 2, 1].map((r) => ({
    stars: r,
    count: feedbacks.filter((f) => f.rating === r).length,
    pct: feedbacks.length > 0
      ? (feedbacks.filter((f) => f.rating === r).length / feedbacks.length) * 100
      : 0,
  }));

  const complaintsByStatus = {
    new: complaints.filter((c) => c.status === 'new').length,
    reviewing: complaints.filter((c) => c.status === 'reviewing').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
  };

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border-light rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-border-light rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-border-light rounded-xl" />
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-semibold text-text-dark">
          Feedback & Complaints
        </h1>

        {/* Tab switcher */}
        <div className="flex bg-white rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setTab('feedback')}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === 'feedback'
                ? 'bg-gold text-white'
                : 'text-text-light hover:bg-warm-white'
            }`}
          >
            Feedback
          </button>
          <button
            onClick={() => setTab('complaints')}
            className={`px-5 py-2.5 text-sm font-medium transition-colors relative ${
              tab === 'complaints'
                ? 'bg-gold text-white'
                : 'text-text-light hover:bg-warm-white'
            }`}
          >
            Complaints
            {complaintsByStatus.new > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {complaintsByStatus.new}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── FEEDBACK TAB ─────────────────────────────────────────────────── */}
      {tab === 'feedback' && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">
                Average Rating
              </p>
              <p className="text-3xl font-semibold mt-2 text-text-dark flex items-baseline gap-2">
                {avgRating.toFixed(1)}
                <span className="text-gold text-lg">&#9733;</span>
              </p>
              <p className="text-xs text-text-muted mt-1">
                {feedbacks.length} total reviews
              </p>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">
                Total Reviews
              </p>
              <p className="text-3xl font-semibold mt-2 text-text-dark">
                {feedbacks.length}
              </p>
              <p className="text-xs text-text-muted mt-1">All time</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">
                Would Recommend
              </p>
              <p className={`text-3xl font-semibold mt-2 ${recommendPct >= 80 ? 'text-green-600' : recommendPct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {recommendPct.toFixed(0)}%
              </p>
              <p className="text-xs text-text-muted mt-1">Of respondents</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">
                This Month
              </p>
              <p className="text-3xl font-semibold mt-2 text-text-dark">
                {thisMonth}
              </p>
              <p className="text-xs text-text-muted mt-1">New reviews</p>
            </div>
          </div>

          {/* Rating distribution */}
          <div className="bg-white rounded-xl border border-border p-6 mb-6">
            <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">
              Rating Distribution
            </h2>
            <div className="space-y-3">
              {ratingDistribution.map((row) => (
                <div key={row.stars} className="flex items-center gap-3">
                  <span className="text-sm text-text-dark w-16 shrink-0">
                    {row.stars} star{row.stars !== 1 ? 's' : ''}
                  </span>
                  <div className="flex-1 bg-border-light rounded-full h-3">
                    <div
                      className="bg-gold rounded-full h-3 transition-all"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="text-sm text-text-muted w-16 text-right">
                    {row.count} ({row.pct.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-text-muted">Filter:</span>
            <button
              onClick={() => setRatingFilter(null)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                ratingFilter === null
                  ? 'bg-gold text-white'
                  : 'bg-white border border-border text-text-light hover:border-gold'
              }`}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map((r) => (
              <button
                key={r}
                onClick={() => setRatingFilter(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  ratingFilter === r
                    ? 'bg-gold text-white'
                    : 'bg-white border border-border text-text-light hover:border-gold'
                }`}
              >
                {r} &#9733;
              </button>
            ))}
          </div>

          {/* Feedback list */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {feedbacks.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-12 text-center">
                <p className="text-text-muted">No feedback yet.</p>
              </div>
            ) : (
              feedbacks.map((f) => (
                <div
                  key={f.id}
                  className="bg-white rounded-xl border border-border p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {/* Stars */}
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span
                            key={s}
                            className={`text-lg ${
                              s <= f.rating ? 'text-gold' : 'text-gray-200'
                            }`}
                          >
                            &#9733;
                          </span>
                        ))}
                      </div>
                      {f.treatment && (
                        <span className="text-xs bg-warm-white border border-border rounded-md px-2 py-0.5 text-text-muted">
                          {f.treatment}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-text-muted">
                      {new Date(f.created_at).toLocaleDateString('en-PK', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <p className="text-sm text-text-dark leading-relaxed mb-2">
                    &ldquo;{f.feedback}&rdquo;
                  </p>

                  {f.improvements && (
                    <p className="text-xs text-text-muted italic mb-2">
                      Improvement suggestion: {f.improvements}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">
                      {f.client_name || 'Anonymous'}
                    </span>
                    {f.would_recommend !== null && (
                      <span
                        className={`text-xs font-medium ${
                          f.would_recommend ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        {f.would_recommend
                          ? 'Would recommend'
                          : 'Would not recommend'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ─── COMPLAINTS TAB ───────────────────────────────────────────────── */}
      {tab === 'complaints' && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">
                New (Unreviewed)
              </p>
              <p className={`text-3xl font-semibold mt-2 ${complaintsByStatus.new > 0 ? 'text-blue-600' : 'text-text-dark'}`}>
                {complaintsByStatus.new}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">
                Reviewing
              </p>
              <p className="text-3xl font-semibold mt-2 text-amber-600">
                {complaintsByStatus.reviewing}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">
                Resolved
              </p>
              <p className="text-3xl font-semibold mt-2 text-green-600">
                {complaintsByStatus.resolved}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-sm text-text-muted">Status:</span>
            {['', 'new', 'reviewing', 'resolved', 'dismissed'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                  statusFilter === s
                    ? 'bg-gold text-white'
                    : 'bg-white border border-border text-text-light hover:border-gold'
                }`}
              >
                {s || 'All'}
              </button>
            ))}

            <span className="text-sm text-text-muted ml-4">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-md border border-border bg-white px-3 py-1.5 text-xs text-text-dark focus:border-gold focus:outline-none"
            >
              <option value="">All</option>
              {[
                'Service Quality',
                'Wait Times',
                'Staff Behavior',
                'Cleanliness',
                'Billing',
                'Other',
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Complaints list */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {complaints.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-12 text-center">
                <p className="text-text-muted">No complaints found.</p>
              </div>
            ) : (
              complaints.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-xl border border-border p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium rounded-md px-2.5 py-1 ${
                          CATEGORY_COLORS[c.category] || 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {c.category}
                      </span>
                      <span
                        className={`text-xs font-medium rounded-md px-2.5 py-1 border capitalize ${
                          STATUS_COLORS[c.status] || ''
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted">
                      {new Date(c.created_at).toLocaleDateString('en-PK', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <p className="text-sm text-text-dark leading-relaxed mb-3">
                    {c.complaint}
                  </p>

                  {!c.is_anonymous && (c.client_name || c.client_phone) && (
                    <p className="text-xs text-text-muted mb-3">
                      Contact: {c.client_name || ''}{' '}
                      {c.client_phone ? `(${c.client_phone})` : ''}
                    </p>
                  )}

                  {c.admin_notes && (
                    <div className="bg-warm-white rounded-lg px-4 py-2.5 mb-3 border-l-2 border-gold">
                      <p className="text-xs font-medium text-text-muted mb-0.5">
                        Admin Notes
                      </p>
                      <p className="text-sm text-text-dark">{c.admin_notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border-light">
                    {c.status !== 'reviewing' && (
                      <button
                        onClick={() =>
                          updateComplaint(c.id, { status: 'reviewing' })
                        }
                        className="text-xs font-medium text-amber-600 hover:text-amber-700 px-3 py-1.5 rounded-md hover:bg-amber-50 transition-colors"
                      >
                        Mark Reviewing
                      </button>
                    )}
                    {c.status !== 'resolved' && (
                      <button
                        onClick={() =>
                          updateComplaint(c.id, { status: 'resolved' })
                        }
                        className="text-xs font-medium text-green-600 hover:text-green-700 px-3 py-1.5 rounded-md hover:bg-green-50 transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {c.status !== 'dismissed' && (
                      <button
                        onClick={() =>
                          updateComplaint(c.id, { status: 'dismissed' })
                        }
                        className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Dismiss
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setNotesModal(c);
                        setNotesText(c.admin_notes || '');
                      }}
                      className="text-xs font-medium text-text-muted hover:text-text-dark px-3 py-1.5 rounded-md hover:bg-warm-white transition-colors ml-auto"
                    >
                      {c.admin_notes ? 'Edit Notes' : 'Add Notes'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ─── Notes Modal ──────────────────────────────────────────────────── */}
      {notesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl border border-border w-full max-w-lg p-6">
            <h3 className="font-serif text-lg font-semibold text-text-dark mb-1">
              Admin Notes
            </h3>
            <p className="text-xs text-text-muted mb-4">
              Complaint #{notesModal.id.slice(0, 8)} &mdash;{' '}
              {notesModal.category}
            </p>
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              rows={4}
              placeholder="Add internal notes about this complaint..."
              className="w-full rounded-lg border border-border bg-warm-white px-4 py-3 text-sm text-text-dark placeholder:text-text-muted/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 transition-colors resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setNotesModal(null)}
                className="px-4 py-2 text-sm text-text-light hover:text-text-dark transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-6 py-2 rounded-lg bg-gold text-sm font-semibold text-white hover:-translate-y-0.5 transition-all"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
