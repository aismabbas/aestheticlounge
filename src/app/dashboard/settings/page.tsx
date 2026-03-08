'use client';

import { useState, useEffect } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Staff {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string;
  active: boolean;
}

interface AssignmentSettings {
  auto_assign_enabled: boolean;
  assignable_roles: string[];
  max_leads_per_day: number;
}

interface AssignmentStat {
  staff_id: string;
  name: string;
  role: string;
  assigned_today: number;
  responded: number;
  avg_response_time: number;
}

/* ------------------------------------------------------------------ */
/*  Helper                                                             */
/* ------------------------------------------------------------------ */

function fmtTime(seconds: number): string {
  if (seconds <= 0) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

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

  // Assignment settings state
  const [assignSettings, setAssignSettings] = useState<AssignmentSettings>({
    auto_assign_enabled: true,
    assignable_roles: ['receptionist', 'manager', 'admin'],
    max_leads_per_day: 0,
  });
  const [assignStats, setAssignStats] = useState<AssignmentStat[]>([]);
  const [assignLoading, setAssignLoading] = useState(true);
  const [assignSaving, setAssignSaving] = useState(false);

  const fetchStaff = async () => {
    const res = await fetch('/api/dashboard/staff');
    const data = await res.json();
    setStaff(data.staff || data);
    setLoading(false);
  };

  const fetchAssignmentSettings = async () => {
    try {
      const res = await fetch('/api/dashboard/settings/assignment');
      if (res.ok) {
        const data = await res.json();
        setAssignSettings(data.settings);
        setAssignStats(data.stats || []);
      }
    } catch {
      // silent
    }
    setAssignLoading(false);
  };

  useEffect(() => {
    fetchStaff();
    fetchAssignmentSettings();
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

  const saveAssignmentSettings = async () => {
    setAssignSaving(true);
    try {
      await fetch('/api/dashboard/settings/assignment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignSettings),
      });
      await fetchAssignmentSettings();
    } catch {
      // silent
    }
    setAssignSaving(false);
  };

  const toggleRole = (role: string) => {
    setAssignSettings((prev) => {
      const roles = prev.assignable_roles.includes(role)
        ? prev.assignable_roles.filter((r) => r !== role)
        : [...prev.assignable_roles, role];
      return { ...prev, assignable_roles: roles };
    });
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

  // Compute max for distribution bars
  const maxAssigned = Math.max(...assignStats.map((s) => s.assigned_today), 1);

  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-2xl font-semibold text-text-dark mb-6">Settings</h1>

      {/* ============================================================ */}
      {/*  Lead Assignment Settings                                     */}
      {/* ============================================================ */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Lead Assignment</h2>

        {assignLoading ? (
          <div className="animate-pulse h-32 bg-border-light rounded-lg" />
        ) : (
          <>
            {/* Auto-assign toggle */}
            <div className="flex items-center justify-between py-3 border-b border-border-light">
              <div>
                <p className="text-sm font-medium text-text-dark">Auto-assign new leads</p>
                <p className="text-xs text-text-muted">Automatically assign incoming leads to staff using round-robin</p>
              </div>
              <button
                onClick={() => setAssignSettings((prev) => ({ ...prev, auto_assign_enabled: !prev.auto_assign_enabled }))}
                className={`w-10 h-5 rounded-full transition-colors relative inline-block ${
                  assignSettings.auto_assign_enabled ? 'bg-gold' : 'bg-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    assignSettings.auto_assign_enabled ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Assignable roles */}
            <div className="py-3 border-b border-border-light">
              <p className="text-sm font-medium text-text-dark mb-2">Roles that receive leads</p>
              <div className="flex gap-3">
                {['receptionist', 'manager', 'admin'].map((role) => (
                  <label key={role} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignSettings.assignable_roles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="w-4 h-4 rounded border-border text-gold focus:ring-gold"
                    />
                    <span className="text-sm text-text-dark capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Max per day */}
            <div className="py-3 border-b border-border-light">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-dark">Max leads per person per day</p>
                  <p className="text-xs text-text-muted">Set to 0 for no limit</p>
                </div>
                <input
                  type="number"
                  min={0}
                  value={assignSettings.max_leads_per_day}
                  onChange={(e) => setAssignSettings((prev) => ({ ...prev, max_leads_per_day: parseInt(e.target.value) || 0 }))}
                  className="w-20 px-3 py-1.5 border border-border rounded-lg text-sm text-center focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end mt-4 mb-6">
              <button
                onClick={saveAssignmentSettings}
                disabled={assignSaving}
                className="px-5 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
              >
                {assignSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

            {/* Today's distribution chart */}
            {assignStats.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-3">
                  Today&apos;s Assignment Distribution
                </h3>
                <div className="space-y-2">
                  {assignStats.map((stat) => {
                    const pct = maxAssigned > 0 ? (stat.assigned_today / maxAssigned) * 100 : 0;
                    const responsePct = stat.assigned_today > 0
                      ? Math.round((stat.responded / stat.assigned_today) * 100)
                      : 0;
                    return (
                      <div key={stat.staff_id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {stat.name[0]?.toUpperCase()}
                            </span>
                            <span className="font-medium text-text-dark">{stat.name}</span>
                            <span className="text-text-muted capitalize">({stat.role})</span>
                          </div>
                          <div className="flex items-center gap-3 text-text-muted">
                            <span>{stat.assigned_today} assigned</span>
                            <span>{stat.responded} responded ({responsePct}%)</span>
                            <span>Avg: {fmtTime(stat.avg_response_time)}</span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-border-light rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gold rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/*  Staff Management (existing)                                  */}
      {/* ============================================================ */}
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
