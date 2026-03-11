'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/* ---------- types ---------- */

interface LocationInfo {
  title: string;
  address: { addressLines: string[]; locality: string; administrativeArea: string; postalCode: string };
  phoneNumbers: { primaryPhone: string };
  websiteUri: string;
  regularHours?: { periods: { openDay: string; openTime: string; closeDay: string; closeTime: string }[] };
  profile?: { description: string };
}

interface Review {
  reviewId: string;
  reviewer: { displayName: string; profilePhotoUrl?: string };
  starRating: string;
  comment?: string;
  createTime: string;
  reviewReply?: { comment: string; updateTime: string };
}

interface Insights {
  searchViews: number;
  mapViews: number;
  websiteClicks: number;
  directionRequests: number;
  phoneCalls: number;
  topSearchQueries: { query: string; count: number }[];
}

interface GBPPost {
  name: string;
  summary: string;
  media?: { sourceUrl: string }[];
  callToAction?: { actionType: string; url: string };
  createTime: string;
  state: string;
}

interface GBPPhoto {
  name: string;
  googleUrl: string;
  category: string;
  createTime: string;
}

const STAR_MAP: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
function starNum(s: string): number { return STAR_MAP[s] ?? 0; }
function stars(n: number): string { return '\u2605'.repeat(n) + '\u2606'.repeat(5 - n); }

type Tab = 'overview' | 'reviews' | 'insights' | 'posts' | 'photos';

/* ---------- component ---------- */

export default function GoogleBusinessPage() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>('overview');

  // overview
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [reviewSummary, setReviewSummary] = useState<{ total: number; average: number; recent: Review[] } | null>(null);
  const [overviewInsights, setOverviewInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  // reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsAvg, setReviewsAvg] = useState(0);
  const [reviewFilter, setReviewFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1' | 'replied' | 'unreplied'>('all');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyLoading, setReplyLoading] = useState<string | null>(null);

  // insights
  const [insights, setInsights] = useState<Insights | null>(null);
  const [prevInsights, setPrevInsights] = useState<Insights | null>(null);

  // posts
  const [posts, setPosts] = useState<GBPPost[]>([]);
  const [newPost, setNewPost] = useState({ summary: '', mediaUrl: '', ctaType: '', ctaUrl: '' });
  const [postLoading, setPostLoading] = useState(false);

  // photos
  const [photos, setPhotos] = useState<GBPPhoto[]>([]);
  const [newPhoto, setNewPhoto] = useState({ category: 'EXTERIOR', url: '' });
  const [photoLoading, setPhotoLoading] = useState(false);

  // editing
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState({ title: '', phone: '', website: '', description: '' });
  const [saveLoading, setSaveLoading] = useState(false);

  /* ---------- data fetching ---------- */

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/google?type=overview');
      const data = await res.json();
      if (!data.configured) {
        setConfigured(false);
        setMissing(data.missing || []);
        return;
      }
      setConfigured(true);
      setLocation(data.location);
      setReviewSummary(data.reviews);
      setOverviewInsights(data.insights);
      if (data.location) {
        setEditFields({
          title: data.location.title || '',
          phone: data.location.phoneNumbers?.primaryPhone || '',
          website: data.location.websiteUri || '',
          description: data.location.profile?.description || '',
        });
      }
    } catch (err) {
      console.error('[google] Overview fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/google/reviews?pageSize=50');
      const data = await res.json();
      if (data.configured === false) return;
      setReviews(data.reviews || []);
      setReviewsTotal(data.totalReviewCount || 0);
      setReviewsAvg(data.averageRating || 0);
    } catch (err) {
      console.error('[google] Reviews fetch error:', err);
    }
  }, []);

  const fetchInsights = useCallback(async () => {
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      const prevEnd = new Date(start);
      const prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 30);

      const [curRes, prevRes] = await Promise.all([
        fetch(`/api/dashboard/google?type=insights&start=${fmt(start)}&end=${fmt(end)}`),
        fetch(`/api/dashboard/google?type=insights&start=${fmt(prevStart)}&end=${fmt(prevEnd)}`),
      ]);
      const cur = await curRes.json();
      const prev = await prevRes.json();
      if (cur.insights) setInsights(cur.insights);
      if (prev.insights) setPrevInsights(prev.insights);
    } catch (err) {
      console.error('[google] Insights fetch error:', err);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/google/posts');
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
    } catch (err) {
      console.error('[google] Posts fetch error:', err);
    }
  }, []);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/google/photos');
      const data = await res.json();
      if (data.photos) setPhotos(data.photos);
    } catch (err) {
      console.error('[google] Photos fetch error:', err);
    }
  }, []);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  useEffect(() => {
    if (!configured) return;
    if (tab === 'reviews') fetchReviews();
    if (tab === 'insights') fetchInsights();
    if (tab === 'posts') fetchPosts();
    if (tab === 'photos') fetchPhotos();
  }, [tab, configured, fetchReviews, fetchInsights, fetchPosts, fetchPhotos]);

  /* ---------- actions ---------- */

  async function handleSaveInfo() {
    setSaveLoading(true);
    try {
      const res = await fetch('/api/dashboard/google', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editFields.title,
          phoneNumbers: { primaryPhone: editFields.phone },
          websiteUri: editFields.website,
          profile: { description: editFields.description },
        }),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      setEditing(false);
      fetchOverview();
    } catch (err) {
      console.error('[google] Save info error:', err);
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleReply(reviewId: string) {
    const reply = replyDrafts[reviewId]?.trim();
    if (!reply) return;
    setReplyLoading(reviewId);
    try {
      const res = await fetch('/api/dashboard/google/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, reply }),
      });
      if (!res.ok) throw new Error(`Reply failed: ${res.status}`);
      setReplyDrafts((d) => ({ ...d, [reviewId]: '' }));
      fetchReviews();
    } catch (err) {
      console.error('[google] Reply error:', err);
    } finally {
      setReplyLoading(null);
    }
  }

  async function handleCreatePost() {
    if (!newPost.summary.trim()) return;
    setPostLoading(true);
    try {
      const body: Record<string, unknown> = { summary: newPost.summary };
      if (newPost.mediaUrl) body.media = { url: newPost.mediaUrl };
      if (newPost.ctaType && newPost.ctaUrl) body.callToAction = { actionType: newPost.ctaType, url: newPost.ctaUrl };
      const res = await fetch('/api/dashboard/google/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Create post failed: ${res.status}`);
      setNewPost({ summary: '', mediaUrl: '', ctaType: '', ctaUrl: '' });
      fetchPosts();
    } catch (err) {
      console.error('[google] Create post error:', err);
    } finally {
      setPostLoading(false);
    }
  }

  async function handleUploadPhoto() {
    if (!newPhoto.url.trim()) return;
    setPhotoLoading(true);
    try {
      const res = await fetch('/api/dashboard/google/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPhoto),
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      setNewPhoto({ category: 'EXTERIOR', url: '' });
      fetchPhotos();
    } catch (err) {
      console.error('[google] Upload photo error:', err);
    } finally {
      setPhotoLoading(false);
    }
  }

  /* ---------- not configured ---------- */

  if (configured === false) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-serif text-2xl font-semibold text-text-dark mb-6">Google Business Profile</h1>
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mb-4">
            <span className="text-3xl">G</span>
          </div>
          <h2 className="font-serif text-lg font-semibold text-text-dark mb-2">Setup Required</h2>
          <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">
            Connect your Google Business Profile to manage your listing, reviews, and insights directly from this dashboard.
          </p>
          <div className="bg-warm-white rounded-lg p-4 text-left max-w-md mx-auto mb-6">
            <p className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-3">Missing environment variables</p>
            <div className="space-y-2">
              {missing.map((v) => (
                <div key={v} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <code className="text-sm text-text-dark font-mono">{v}</code>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-warm-white rounded-lg p-4 text-left max-w-md mx-auto">
            <p className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-3">Setup steps</p>
            <ol className="text-sm text-text-light space-y-2 list-decimal list-inside">
              <li>Create a Google Cloud project and enable the Business Profile API</li>
              <li>Create a service account and download the JSON key</li>
              <li>Grant the service account access to your Business Profile</li>
              <li>Set Google service account credentials (<code className="font-mono text-xs bg-white px-1 py-0.5 rounded">GOOGLE_SA_CLIENT_EMAIL</code> + <code className="font-mono text-xs bg-white px-1 py-0.5 rounded">GOOGLE_SA_PRIVATE_KEY</code>)</li>
              <li>Set <code className="font-mono text-xs bg-white px-1 py-0.5 rounded">GBP_ACCOUNT_ID</code> (format: <code className="font-mono text-xs">accounts/123456</code>)</li>
              <li>Set <code className="font-mono text-xs bg-white px-1 py-0.5 rounded">GBP_LOCATION_ID</code> (format: <code className="font-mono text-xs">locations/789012</code>)</li>
              <li>Restart the app</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- loading ---------- */

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border-light rounded w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-border-light rounded-xl" />)}
          </div>
          <div className="h-96 bg-border-light rounded-xl" />
        </div>
      </div>
    );
  }

  /* ---------- tab bar ---------- */

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'insights', label: 'Insights' },
    { key: 'posts', label: 'Posts' },
    { key: 'photos', label: 'Photos' },
  ];

  /* ---------- filtered reviews ---------- */

  const filteredReviews = reviews.filter((r) => {
    if (reviewFilter === 'all') return true;
    if (reviewFilter === 'replied') return !!r.reviewReply;
    if (reviewFilter === 'unreplied') return !r.reviewReply;
    return starNum(r.starRating) === Number(reviewFilter);
  });

  const repliedCount = reviews.filter((r) => r.reviewReply).length;
  const thisMonthReviews = reviews.filter((r) => {
    const d = new Date(r.createTime);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-text-dark mb-6">Google Business Profile</h1>

      {/* Tabs */}
      <div className="flex bg-white rounded-lg border border-border overflow-hidden mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-gold text-white' : 'text-text-light hover:bg-warm-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">Rating</p>
              <p className="text-2xl font-semibold text-text-dark mt-2">
                {reviewSummary?.average?.toFixed(1) || '-'}
              </p>
              <p className="text-xs text-gold mt-1">{stars(Math.round(reviewSummary?.average || 0))}</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">Total Reviews</p>
              <p className="text-2xl font-semibold text-text-dark mt-2">{reviewSummary?.total || 0}</p>
              <p className="text-xs text-text-muted mt-1">All time</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">Search Views</p>
              <p className="text-2xl font-semibold text-text-dark mt-2">
                {overviewInsights?.searchViews?.toLocaleString() || '-'}
              </p>
              <p className="text-xs text-text-muted mt-1">Last 30 days</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">Actions</p>
              <p className="text-2xl font-semibold text-text-dark mt-2">
                {overviewInsights
                  ? (overviewInsights.websiteClicks + overviewInsights.directionRequests + overviewInsights.phoneCalls).toLocaleString()
                  : '-'}
              </p>
              <p className="text-xs text-text-muted mt-1">Clicks + Calls + Directions</p>
            </div>
          </div>

          {/* Business info */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-semibold text-text-dark">Business Information</h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-gold border border-gold rounded-lg hover:bg-gold/5 transition-colors"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 text-sm text-text-muted hover:text-text-dark transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveInfo}
                    disabled={saveLoading}
                    className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
                  >
                    {saveLoading ? 'Saving...' : 'Update on Google'}
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Business Name</label>
                  <input
                    type="text"
                    value={editFields.title}
                    onChange={(e) => setEditFields({ ...editFields, title: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editFields.phone}
                      onChange={(e) => setEditFields({ ...editFields, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Website</label>
                    <input
                      type="url"
                      value={editFields.website}
                      onChange={(e) => setEditFields({ ...editFields, website: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editFields.description}
                    onChange={(e) => setEditFields({ ...editFields, description: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <InfoRow label="Name" value={location?.title || '-'} />
                <InfoRow label="Address" value={
                  location?.address
                    ? `${location.address.addressLines?.join(', ')}, ${location.address.locality}, ${location.address.administrativeArea} ${location.address.postalCode}`
                    : '-'
                } />
                <InfoRow label="Phone" value={location?.phoneNumbers?.primaryPhone || '-'} />
                <InfoRow label="Website" value={location?.websiteUri || '-'} />
                <InfoRow label="Description" value={location?.profile?.description || '-'} />
              </div>
            )}
          </div>

          {/* Hours */}
          {location?.regularHours && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Business Hours</h2>
              <div className="space-y-2">
                {location.regularHours.periods.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                    <span className="text-sm font-medium text-text-dark capitalize">{p.openDay.toLowerCase()}</span>
                    <span className="text-sm text-text-light">{p.openTime} - {p.closeTime}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== REVIEWS TAB ===== */}
      {tab === 'reviews' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">Total Reviews</p>
              <p className="text-2xl font-semibold text-text-dark mt-2">{reviewsTotal}</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">Average Rating</p>
              <p className="text-2xl font-semibold text-text-dark mt-2">{reviewsAvg.toFixed(1)}</p>
              <p className="text-xs text-gold mt-1">{stars(Math.round(reviewsAvg))}</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">This Month</p>
              <p className="text-2xl font-semibold text-text-dark mt-2">{thisMonthReviews}</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">Reply Rate</p>
              <p className="text-2xl font-semibold text-text-dark mt-2">
                {reviews.length > 0 ? `${Math.round((repliedCount / reviews.length) * 100)}%` : '-'}
              </p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All' },
              { key: '5', label: '5 Stars' },
              { key: '4', label: '4 Stars' },
              { key: '3', label: '3 Stars' },
              { key: '2', label: '2 Stars' },
              { key: '1', label: '1 Star' },
              { key: 'replied', label: 'Replied' },
              { key: 'unreplied', label: 'Unreplied' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setReviewFilter(f.key as typeof reviewFilter)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  reviewFilter === f.key
                    ? 'bg-gold text-white'
                    : 'bg-white border border-border text-text-light hover:border-gold'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Reviews list */}
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-8 text-center">
                <p className="text-sm text-text-muted">No reviews match this filter.</p>
              </div>
            ) : (
              filteredReviews.map((r) => (
                <div key={r.reviewId} className="bg-white rounded-xl border border-border p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-text-dark">{r.reviewer.displayName}</p>
                      <p className="text-xs text-text-muted">{new Date(r.createTime).toLocaleDateString()}</p>
                    </div>
                    <span className="text-gold text-sm">{stars(starNum(r.starRating))}</span>
                  </div>
                  {r.comment && <p className="text-sm text-text-light mb-3">{r.comment}</p>}

                  {r.reviewReply ? (
                    <div className="bg-warm-white rounded-lg p-3 border-l-2 border-gold">
                      <p className="text-xs font-semibold text-text-muted mb-1">Your reply</p>
                      <p className="text-sm text-text-light">{r.reviewReply.comment}</p>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={replyDrafts[r.reviewId] || ''}
                        onChange={(e) => setReplyDrafts({ ...replyDrafts, [r.reviewId]: e.target.value })}
                        className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
                      />
                      <button
                        onClick={() => handleReply(r.reviewId)}
                        disabled={replyLoading === r.reviewId || !replyDrafts[r.reviewId]?.trim()}
                        className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
                      >
                        {replyLoading === r.reviewId ? 'Posting...' : 'Post Reply'}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===== INSIGHTS TAB ===== */}
      {tab === 'insights' && (
        <div className="space-y-6">
          {/* Metric cards with comparison */}
          <div className="grid grid-cols-5 gap-4">
            {insights ? (
              [
                { label: 'Search Views', current: insights.searchViews, prev: prevInsights?.searchViews },
                { label: 'Map Views', current: insights.mapViews, prev: prevInsights?.mapViews },
                { label: 'Website Clicks', current: insights.websiteClicks, prev: prevInsights?.websiteClicks },
                { label: 'Direction Requests', current: insights.directionRequests, prev: prevInsights?.directionRequests },
                { label: 'Phone Calls', current: insights.phoneCalls, prev: prevInsights?.phoneCalls },
              ].map((m) => {
                const diff = m.prev != null && m.prev > 0 ? ((m.current - m.prev) / m.prev) * 100 : null;
                return (
                  <div key={m.label} className="bg-white rounded-xl border border-border p-5">
                    <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">{m.label}</p>
                    <p className="text-2xl font-semibold text-text-dark mt-2">{m.current.toLocaleString()}</p>
                    {diff !== null && (
                      <p className={`text-xs mt-1 font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {diff >= 0 ? '\u2191' : '\u2193'} {Math.abs(diff).toFixed(0)}% vs prev 30d
                      </p>
                    )}
                    {diff === null && <p className="text-xs text-text-muted mt-1">Last 30 days</p>}
                  </div>
                );
              })
            ) : (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-28 bg-border-light rounded-xl animate-pulse" />
              ))
            )}
          </div>

          {/* Simple bar chart */}
          {insights && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Activity Breakdown</h2>
              <div className="space-y-4">
                {[
                  { label: 'Search Views', value: insights.searchViews, color: 'bg-blue-500' },
                  { label: 'Map Views', value: insights.mapViews, color: 'bg-green-500' },
                  { label: 'Website Clicks', value: insights.websiteClicks, color: 'bg-gold' },
                  { label: 'Direction Requests', value: insights.directionRequests, color: 'bg-purple-500' },
                  { label: 'Phone Calls', value: insights.phoneCalls, color: 'bg-red-500' },
                ].map((bar) => {
                  const maxVal = Math.max(
                    insights.searchViews, insights.mapViews, insights.websiteClicks,
                    insights.directionRequests, insights.phoneCalls, 1,
                  );
                  const pct = (bar.value / maxVal) * 100;
                  return (
                    <div key={bar.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-text-dark">{bar.label}</span>
                        <span className="text-sm font-medium text-text-dark">{bar.value.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-border-light rounded-full h-3">
                        <div
                          className={`${bar.color} rounded-full h-3 transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top search queries */}
          {insights && insights.topSearchQueries.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Top Search Queries</h2>
              <div className="space-y-2">
                {insights.topSearchQueries.map((q, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                    <span className="text-sm text-text-dark">{q.query}</span>
                    <span className="text-sm font-medium text-text-light">{q.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== POSTS TAB ===== */}
      {tab === 'posts' && (
        <div className="space-y-6">
          {/* Create post form */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Create Google Post</h2>
            <p className="text-xs text-text-muted mb-4">Google posts are visible on your listing for 7 days.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Post Text *</label>
                <textarea
                  rows={3}
                  value={newPost.summary}
                  onChange={(e) => setNewPost({ ...newPost, summary: e.target.value })}
                  placeholder="Share an update, offer, or event..."
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white resize-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Image URL</label>
                  <input
                    type="url"
                    value={newPost.mediaUrl}
                    onChange={(e) => setNewPost({ ...newPost, mediaUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">CTA Type</label>
                  <select
                    value={newPost.ctaType}
                    onChange={(e) => setNewPost({ ...newPost, ctaType: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
                  >
                    <option value="">None</option>
                    <option value="LEARN_MORE">Learn More</option>
                    <option value="BOOK">Book</option>
                    <option value="CALL">Call</option>
                    <option value="ORDER">Order</option>
                    <option value="SHOP">Shop</option>
                    <option value="SIGN_UP">Sign Up</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">CTA URL</label>
                  <input
                    type="url"
                    value={newPost.ctaUrl}
                    onChange={(e) => setNewPost({ ...newPost, ctaUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleCreatePost}
                  disabled={postLoading || !newPost.summary.trim()}
                  className="px-5 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
                >
                  {postLoading ? 'Publishing...' : 'Publish Post'}
                </button>
              </div>
            </div>
          </div>

          {/* Existing posts */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Existing Posts</h2>
            {posts.length === 0 ? (
              <p className="text-sm text-text-muted">No posts yet.</p>
            ) : (
              <div className="space-y-4">
                {posts.map((p) => (
                  <div key={p.name} className="border border-border-light rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-text-dark">{p.summary}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                        p.state === 'LIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {p.state}
                      </span>
                    </div>
                    {p.callToAction && (
                      <p className="text-xs text-gold mb-1">
                        CTA: {p.callToAction.actionType.replace(/_/g, ' ')} &rarr; {p.callToAction.url}
                      </p>
                    )}
                    <p className="text-xs text-text-muted">{new Date(p.createTime).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== PHOTOS TAB ===== */}
      {tab === 'photos' && (
        <div className="space-y-6">
          {/* Upload form */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Upload Photo</h2>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Category *</label>
                <select
                  value={newPhoto.category}
                  onChange={(e) => setNewPhoto({ ...newPhoto, category: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
                >
                  <option value="EXTERIOR">Exterior</option>
                  <option value="INTERIOR">Interior</option>
                  <option value="PRODUCT">Product</option>
                  <option value="AT_WORK">At Work</option>
                  <option value="TEAM">Team</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Photo URL *</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newPhoto.url}
                    onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
                  />
                  <button
                    onClick={handleUploadPhoto}
                    disabled={photoLoading || !newPhoto.url.trim()}
                    className="px-5 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
                  >
                    {photoLoading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Photo grid */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Business Photos</h2>
            {photos.length === 0 ? (
              <p className="text-sm text-text-muted">No photos uploaded to Google yet.</p>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {photos.map((p) => (
                  <div key={p.name} className="relative group rounded-lg overflow-hidden border border-border-light">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.googleUrl} alt={p.category} className="w-full h-40 object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1.5">
                      <span className="text-[10px] font-medium text-white uppercase">{p.category.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- small components ---------- */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 py-2 border-b border-border-light last:border-0">
      <span className="text-xs font-semibold uppercase text-text-muted tracking-wider w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-text-dark">{value}</span>
    </div>
  );
}

function fmt(d: Date): string {
  return d.toISOString().split('T')[0];
}
