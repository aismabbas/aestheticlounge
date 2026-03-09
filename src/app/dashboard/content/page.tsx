'use client';

import { useState, useEffect } from 'react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  treatment: string;
  headline: string;
  caption: string;
  creative_url: string;
  creative_type: string;
  budget_daily: number;
}

export default function ContentApprovalPage() {
  const [pending, setPending] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    const res = await fetch('/api/dashboard/campaigns?status=pending_approval');
    const data = await res.json();
    setPending(Array.isArray(data.campaigns) ? data.campaigns : Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/dashboard/campaigns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    fetchPending();
  };

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border-light rounded w-48" />
          <div className="h-64 bg-border-light rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-semibold text-text-dark">Content Approval</h1>
        <span className="text-sm text-text-muted">{pending.length} pending</span>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <div className="text-4xl mb-3 text-text-muted">&#10003;</div>
          <p className="text-lg font-medium text-text-dark">All caught up</p>
          <p className="text-sm text-text-muted mt-1">No content waiting for approval.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pending.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-border overflow-hidden">
              {/* Creative preview */}
              {item.creative_url ? (
                item.creative_type === 'video' ? (
                  <video src={item.creative_url} className="w-full h-64 object-cover bg-black" controls />
                ) : (
                  <img src={item.creative_url} alt={item.name} className="w-full h-64 object-cover" />
                )
              ) : (
                <div className="w-full h-48 bg-gold-pale flex items-center justify-center">
                  <span className="text-gold-dark text-sm">No creative uploaded</span>
                </div>
              )}

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-text-dark">{item.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-medium">
                    Pending
                  </span>
                </div>

                <p className="text-xs text-text-muted mb-2">Treatment: {item.treatment}</p>

                {item.headline && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Headline</p>
                    <p className="text-sm text-text-dark">{item.headline}</p>
                  </div>
                )}

                {item.caption && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Caption</p>
                    <p className="text-sm text-text-light whitespace-pre-wrap">{item.caption}</p>
                  </div>
                )}

                <p className="text-xs text-text-muted mb-4">
                  Budget: CAD ${item.budget_daily}/day
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(item.id, 'active')}
                    className="flex-1 px-4 py-2.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(item.id, 'draft')}
                    className="flex-1 px-4 py-2.5 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
