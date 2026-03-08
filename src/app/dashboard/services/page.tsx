'use client';

import { useState, useEffect } from 'react';

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  short_desc: string;
  duration_min: number;
  price_pkr: number;
  price_display: string;
  active: boolean;
  slug: string;
  total_leads?: number;
  total_booked?: number;
  conversion_rate?: string;
}

export default function ServicesPage() {
  const [servicesByCategory, setServicesByCategory] = useState<Record<string, Service[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Service>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    category: '',
    duration_min: 30,
    price_pkr: 0,
    price_display: '',
    description: '',
  });

  const fetchServices = async () => {
    const res = await fetch('/api/dashboard/services');
    const data = await res.json();

    // Handle grouped or flat response
    if (data.services && typeof data.services === 'object' && !Array.isArray(data.services)) {
      setServicesByCategory(data.services);
    } else {
      const svcs = Array.isArray(data) ? data : data.services || [];
      const grouped: Record<string, Service[]> = {};
      for (const svc of svcs) {
        const cat = svc.category || 'Other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(svc);
      }
      setServicesByCategory(grouped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const startEdit = (svc: Service) => {
    setEditingId(svc.id);
    setEditForm({
      name: svc.name,
      price_pkr: svc.price_pkr,
      price_display: svc.price_display,
      duration_min: svc.duration_min,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await fetch('/api/dashboard/services', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingId, ...editForm }),
    });
    setEditingId(null);
    fetchServices();
  };

  const toggleActive = async (svc: Service) => {
    await fetch('/api/dashboard/services', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: svc.id, active: !svc.active }),
    });
    fetchServices();
  };

  const addService = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/dashboard/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newService),
    });
    setShowAdd(false);
    setNewService({ name: '', category: '', duration_min: 30, price_pkr: 0, price_display: '', description: '' });
    fetchServices();
  };

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border-light rounded w-48" />
          <div className="h-96 bg-border-light rounded-lg" />
        </div>
      </div>
    );
  }

  const categories = Object.keys(servicesByCategory).sort();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-semibold text-text-dark">Services</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-5 py-2.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
        >
          + Add Service
        </button>
      </div>

      {/* Add new service form */}
      {showAdd && (
        <form onSubmit={addService} className="bg-white rounded-xl border border-border p-5 mb-6">
          <h3 className="font-serif text-lg font-semibold text-text-dark mb-4">New Service</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Name *</label>
              <input
                type="text"
                required
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Category *</label>
              <input
                type="text"
                required
                value={newService.category}
                onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
                placeholder="e.g., Facials, Laser, Body"
                list="categories"
              />
              <datalist id="categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Price (PKR)</label>
              <input
                type="number"
                value={newService.price_pkr}
                onChange={(e) => setNewService({ ...newService, price_pkr: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Price Display</label>
              <input
                type="text"
                value={newService.price_display}
                onChange={(e) => setNewService({ ...newService, price_display: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
                placeholder="e.g., Rs. 5,000"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Duration (min)</label>
              <input
                type="number"
                value={newService.duration_min}
                onChange={(e) => setNewService({ ...newService, duration_min: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="px-6 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
              >
                Add Service
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Services grouped by category */}
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category} className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3 bg-warm-white border-b border-border">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-text-dark">{category}</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-muted">Name</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-muted">Price</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-muted">Duration</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-muted">Active</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-muted">Leads</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-muted">Booked</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-muted">Conv %</th>
                  <th className="text-right px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {servicesByCategory[category].map((svc) => (
                  <tr key={svc.id} className="border-b border-border-light last:border-0 hover:bg-warm-white transition-colors">
                    <td className="px-5 py-3">
                      {editingId === svc.id ? (
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-2 py-1 border border-gold rounded text-sm focus:outline-none"
                        />
                      ) : (
                        <span className="text-sm font-medium text-text-dark">{svc.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingId === svc.id ? (
                        <input
                          type="number"
                          value={editForm.price_pkr || 0}
                          onChange={(e) => setEditForm({ ...editForm, price_pkr: parseInt(e.target.value) || 0 })}
                          className="w-24 px-2 py-1 border border-gold rounded text-sm focus:outline-none text-right"
                        />
                      ) : (
                        <span className="text-sm text-text-dark">{svc.price_display || `PKR ${svc.price_pkr?.toLocaleString()}`}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingId === svc.id ? (
                        <input
                          type="number"
                          value={editForm.duration_min || 30}
                          onChange={(e) => setEditForm({ ...editForm, duration_min: parseInt(e.target.value) || 30 })}
                          className="w-16 px-2 py-1 border border-gold rounded text-sm focus:outline-none text-right"
                        />
                      ) : (
                        <span className="text-sm text-text-light">{svc.duration_min}min</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(svc)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          svc.active ? 'bg-gold' : 'bg-border'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            svc.active ? 'left-5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-text-light">{svc.total_leads ?? '-'}</td>
                    <td className="px-4 py-3 text-right text-sm text-text-light">{svc.total_booked ?? '-'}</td>
                    <td className="px-4 py-3 text-right text-sm text-text-light">{svc.conversion_rate ?? '-'}%</td>
                    <td className="px-5 py-3 text-right">
                      {editingId === svc.id ? (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={saveEdit}
                            className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(svc)}
                          className="text-xs text-gold hover:text-gold-dark font-medium"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
