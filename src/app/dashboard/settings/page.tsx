'use client';

import { useState, useEffect } from 'react';

interface Staff {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string;
  active: boolean;
}

export default function SettingsPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'receptionist',
    phone: '',
  });
  const [error, setError] = useState('');

  const fetchStaff = async () => {
    const res = await fetch('/api/dashboard/staff');
    const data = await res.json();
    setStaff(data.staff || data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const toggleActive = async (s: Staff) => {
    await fetch('/api/dashboard/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, active: !s.active }),
    });
    fetchStaff();
  };

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/dashboard/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStaff),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to add staff');
      return;
    }
    setShowAddStaff(false);
    setNewStaff({ name: '', email: '', role: 'receptionist', phone: '' });
    fetchStaff();
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
    <div className="max-w-4xl">
      <h1 className="font-serif text-2xl font-semibold text-text-dark mb-6">Settings</h1>

      {/* Staff Management */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold text-text-dark">Staff Management</h2>
          <button
            onClick={() => setShowAddStaff(!showAddStaff)}
            className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
          >
            + Add Staff
          </button>
        </div>

        {showAddStaff && (
          <form onSubmit={addStaff} className="bg-warm-white rounded-lg p-4 mb-4">
            {error && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Role *</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
                >
                  <option value="admin">Admin</option>
                  <option value="doctor">Doctor</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Phone</label>
                <input
                  type="tel"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setShowAddStaff(false)}
                className="px-4 py-2 text-sm text-text-muted hover:text-text-dark transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
              >
                Add Staff
              </button>
            </div>
          </form>
        )}

        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2.5 text-xs font-semibold uppercase text-text-muted tracking-wider">Name</th>
              <th className="text-left py-2.5 text-xs font-semibold uppercase text-text-muted tracking-wider">Email</th>
              <th className="text-left py-2.5 text-xs font-semibold uppercase text-text-muted tracking-wider">Role</th>
              <th className="text-left py-2.5 text-xs font-semibold uppercase text-text-muted tracking-wider">Phone</th>
              <th className="text-center py-2.5 text-xs font-semibold uppercase text-text-muted tracking-wider">Active</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-b border-border-light hover:bg-warm-white transition-colors">
                <td className="py-3 text-sm font-medium text-text-dark">{s.name}</td>
                <td className="py-3 text-sm text-text-light">{s.email}</td>
                <td className="py-3">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold-pale text-gold-dark capitalize">
                    {s.role}
                  </span>
                </td>
                <td className="py-3 text-sm text-text-light">{s.phone || '-'}</td>
                <td className="py-3 text-center">
                  <button
                    onClick={() => toggleActive(s)}
                    className={`w-10 h-5 rounded-full transition-colors relative inline-block ${
                      s.active ? 'bg-gold' : 'bg-border'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        s.active ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-text-muted">
                  No staff members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Business Hours */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Business Hours</h2>
        <div className="space-y-2">
          {[
            { day: 'Monday', hours: '10:00 AM - 9:00 PM' },
            { day: 'Tuesday', hours: '10:00 AM - 9:00 PM' },
            { day: 'Wednesday', hours: '10:00 AM - 9:00 PM' },
            { day: 'Thursday', hours: '10:00 AM - 9:00 PM' },
            { day: 'Friday', hours: '10:00 AM - 9:00 PM' },
            { day: 'Saturday', hours: '10:00 AM - 9:00 PM' },
            { day: 'Sunday', hours: 'Closed' },
          ].map((item) => (
            <div key={item.day} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
              <span className="text-sm font-medium text-text-dark">{item.day}</span>
              <span className={`text-sm ${item.hours === 'Closed' ? 'text-red-500' : 'text-text-light'}`}>
                {item.hours}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp Config Status */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">WhatsApp Integration</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-dark">WhatsApp Cloud API</p>
              <p className="text-xs text-text-muted">Managed via n8n pipeline</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              Connected
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-dark">Auto-response Agent</p>
              <p className="text-xs text-text-muted">AL Marketing Pipeline</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-dark">Business Phone</p>
              <p className="text-xs text-text-muted">+92-327-6620000</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
