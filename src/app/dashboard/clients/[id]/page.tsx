'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

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
  photo_consent: boolean;
  do_not_disturb: boolean;
  medical_history: {
    conditions?: string;
    medications?: string;
    previous_treatments?: string;
    contact_frequency?: string;
  };
  skin_type: string;
  allergies: string;
  gender: string;
  date_of_birth: string;
  tags: string[];
  wa_opted_in: boolean;
  wa_quality: string;
  nps_score: number;
  referral_count: number;
  updated_at: string;
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

interface ClientPhoto {
  id: string;
  client_id: string;
  treatment: string;
  photo_type: 'before' | 'after';
  photo_url: string;
  thumbnail_url?: string;
  full_url?: string;
  drive_file_id?: string;
  taken_at: string;
  notes: string;
  uploaded_by: string;
  created_at: string;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
}

type TabKey = 'overview' | 'medical' | 'photos' | 'communication' | 'notes';

/* ------------------------------------------------------------------ */
/* Status badge colours                                                */
/* ------------------------------------------------------------------ */

const statusBadge: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  arrived: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-600',
  no_show: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-400 line-through',
};

/* ------------------------------------------------------------------ */
/* Toggle switch component                                             */
/* ------------------------------------------------------------------ */

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-gold' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [photos, setPhotos] = useState<ClientPhoto[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  // Medical form state
  const [medForm, setMedForm] = useState({
    gender: '',
    date_of_birth: '',
    skin_type: '',
    allergies: '',
    conditions: '',
    medications: '',
    previous_treatments: '',
  });

  // Communication form state
  const [commForm, setCommForm] = useState({
    do_not_disturb: false,
    wa_opted_in: false,
    contact_frequency: '',
  });

  // Photo form
  const [photoForm, setPhotoForm] = useState({
    treatment: '',
    photo_type: 'before' as 'before' | 'after',
    taken_at: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [driveConfigured, setDriveConfigured] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState<ClientPhoto | null>(null);
  const [lightboxList, setLightboxList] = useState<ClientPhoto[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Tags
  const [newTag, setNewTag] = useState('');

  // Intake forms
  interface IntakeForm {
    id: string;
    token: string;
    status: string;
    sent_via: string;
    submitted_at: string | null;
    created_at: string;
  }
  const [intakeForms, setIntakeForms] = useState<IntakeForm[]>([]);
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [intakeUrl, setIntakeUrl] = useState('');
  const [intakeCopied, setIntakeCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboard/clients/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setClient(data.client);
        setAppointments(data.appointments || []);
        setPayments(data.payments || []);

        // Fetch photos separately to get drive_configured flag
        fetch(`/api/dashboard/clients/${id}/photos`)
          .then((r) => r.json())
          .then((pData) => {
            setPhotos(pData.photos || data.photos || []);
            if (pData.drive_configured !== undefined) {
              setDriveConfigured(pData.drive_configured);
            }
          })
          .catch(() => {
            setPhotos(data.photos || []);
          });

        // Init medical form
        const c = data.client;
        const mh = c.medical_history || {};
        setMedForm({
          gender: c.gender || '',
          date_of_birth: c.date_of_birth || '',
          skin_type: c.skin_type || '',
          allergies: c.allergies || '',
          conditions: mh.conditions || '',
          medications: mh.medications || '',
          previous_treatments: mh.previous_treatments || '',
        });

        // Init communication form
        setCommForm({
          do_not_disturb: c.do_not_disturb || false,
          wa_opted_in: c.wa_opted_in || false,
          contact_frequency: mh.contact_frequency || '',
        });

        setLoading(false);

        // Fetch intake forms for this client
        fetch(`/api/intake?client_id=${data.client.id}`)
          .then((r) => r.json())
          .then((iData) => setIntakeForms(iData.forms || []))
          .catch(() => {});
      });
  }, [id]);

  /* ---- Intake form helpers ---- */

  const createIntakeForm = async (sentVia: 'whatsapp' | 'link' | 'ipad') => {
    setIntakeLoading(true);
    setIntakeUrl('');
    setIntakeCopied(false);
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: client?.id, sent_via: sentVia }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (sentVia === 'ipad') {
        window.open(`${data.url}?mode=ipad`, '_blank');
      } else {
        setIntakeUrl(data.url);
      }

      // Refresh list
      setIntakeForms((prev) => [
        { id: data.id, token: data.token, status: data.status, sent_via: data.sent_via, submitted_at: null, created_at: data.created_at },
        ...prev,
      ]);
    } catch (err) {
      console.error('Failed to create intake form:', err);
    } finally {
      setIntakeLoading(false);
    }
  };

  const copyIntakeUrl = async () => {
    if (!intakeUrl) return;
    try {
      await navigator.clipboard.writeText(intakeUrl);
      setIntakeCopied(true);
      setTimeout(() => setIntakeCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = intakeUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setIntakeCopied(true);
      setTimeout(() => setIntakeCopied(false), 2000);
    }
  };

  /* ---- Helpers ---- */

  const patchClient = async (updates: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error);
      setClient((prev) => (prev ? { ...prev, ...updated } : prev));
      return updated;
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!client || !noteText.trim()) return;
    const existing = client.notes || '';
    const updated = existing
      ? `${existing}\n[${new Date().toLocaleDateString()}] ${noteText}`
      : `[${new Date().toLocaleDateString()}] ${noteText}`;
    await patchClient({ notes: updated });
    setNoteText('');
  };

  const saveMedical = async () => {
    const medicalHistory = {
      ...(client?.medical_history || {}),
      conditions: medForm.conditions,
      medications: medForm.medications,
      previous_treatments: medForm.previous_treatments,
    };
    await patchClient({
      gender: medForm.gender,
      date_of_birth: medForm.date_of_birth || null,
      skin_type: medForm.skin_type,
      allergies: medForm.allergies,
      medical_history: medicalHistory,
    });
  };

  const saveCommunication = async () => {
    const medicalHistory = {
      ...(client?.medical_history || {}),
      contact_frequency: commForm.contact_frequency,
    };
    await patchClient({
      do_not_disturb: commForm.do_not_disturb,
      wa_opted_in: commForm.wa_opted_in,
      medical_history: medicalHistory,
    });
  };

  const togglePhotoConsent = async (val: boolean) => {
    await patchClient({ photo_consent: val });
  };

  const addTag = async () => {
    if (!client || !newTag.trim()) return;
    const currentTags = Array.isArray(client.tags) ? client.tags : [];
    if (currentTags.includes(newTag.trim())) {
      setNewTag('');
      return;
    }
    await patchClient({ tags: [...currentTags, newTag.trim()] });
    setNewTag('');
  };

  const removeTag = async (tag: string) => {
    if (!client) return;
    const currentTags = Array.isArray(client.tags) ? client.tags : [];
    await patchClient({ tags: currentTags.filter((t) => t !== tag) });
  };

  const addPhoto = async () => {
    if (!photoForm.treatment || selectedFiles.length === 0) return;
    setSaving(true);
    setUploadProgress(0);

    try {
      const totalFiles = selectedFiles.length;
      const uploaded: ClientPhoto[] = [];

      for (let i = 0; i < totalFiles; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('treatment', photoForm.treatment);
        formData.append('photo_type', photoForm.photo_type);
        formData.append('taken_at', photoForm.taken_at || new Date().toISOString().split('T')[0]);
        if (photoForm.notes) formData.append('notes', photoForm.notes);

        const res = await fetch(`/api/dashboard/clients/${id}/photos`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const photo = await res.json();
          uploaded.push(photo);
        }

        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      if (uploaded.length > 0) {
        setPhotos((prev) => [...uploaded, ...prev]);
        setPhotoForm({
          treatment: '',
          photo_type: 'before',
          taken_at: new Date().toISOString().split('T')[0],
          notes: '',
        });
        setSelectedFiles([]);
        setShowPhotoForm(false);
      }
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/'),
    );
    if (files.length > 0) setSelectedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith('image/'),
    );
    if (files.length > 0) setSelectedFiles((prev) => [...prev, ...files]);
    // Reset input so the same file can be selected again
    e.target.value = '';
  }, []);

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const deletePhoto = async (photoId: string) => {
    if (!confirm('Delete this photo permanently?')) return;
    try {
      const res = await fetch(`/api/dashboard/clients/${id}/photos/${photoId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        if (lightboxPhoto?.id === photoId) setLightboxPhoto(null);
      }
    } catch (err) {
      console.error('Delete photo error:', err);
    }
  };

  const openLightbox = (photo: ClientPhoto, allPhotos: ClientPhoto[]) => {
    setLightboxList(allPhotos);
    const idx = allPhotos.findIndex((p) => p.id === photo.id);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxPhoto(photo);
  };

  const lightboxNav = (dir: -1 | 1) => {
    const newIdx = lightboxIndex + dir;
    if (newIdx >= 0 && newIdx < lightboxList.length) {
      setLightboxIndex(newIdx);
      setLightboxPhoto(lightboxList[newIdx]);
    }
  };

  /* ---- Loading ---- */

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
  const clientTags = Array.isArray(client.tags) ? client.tags : [];

  // Group photos by treatment
  const photoGroups: Record<string, ClientPhoto[]> = {};
  photos.forEach((p) => {
    if (!photoGroups[p.treatment]) photoGroups[p.treatment] = [];
    photoGroups[p.treatment].push(p);
  });

  /* ---- Tabs ---- */

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'medical', label: 'Medical Profile' },
    { key: 'photos', label: 'Before & After' },
    { key: 'communication', label: 'Communication' },
    { key: 'notes', label: 'Notes & Tags' },
  ];

  return (
    <div className="max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
        <Link href="/dashboard/clients" className="hover:text-gold transition-colors">Clients</Link>
        <span>/</span>
        <span className="text-text-dark">{client.name}</span>
      </div>

      {/* Contact card */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
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

        {/* Quick stats */}
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

      {/* Main grid: tabs + sidebar */}
      <div className="grid grid-cols-4 gap-6">
        {/* Main content (3 cols) */}
        <div className="col-span-3 space-y-6">
          {/* Tab navigation */}
          <div className="border-b border-border">
            <nav className="flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab.key
                      ? 'text-gold'
                      : 'text-text-muted hover:text-text-dark'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* ============================================================ */}
          {/* TAB 1: Overview                                               */}
          {/* ============================================================ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Treatment History */}
              <div className="bg-white rounded-xl border border-border p-6">
                <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Treatment History</h2>
                {treatments.length === 0 ? (
                  <p className="text-sm text-text-muted">No treatment records yet.</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-xs font-semibold uppercase text-text-muted">Treatment</th>
                        <th className="text-left py-2 text-xs font-semibold uppercase text-text-muted">Date</th>
                        <th className="text-right py-2 text-xs font-semibold uppercase text-text-muted">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {treatments.map((t, i) => (
                        <tr key={i} className="border-b border-border-light last:border-0">
                          <td className="py-2.5 text-sm font-medium text-text-dark">{t.name}</td>
                          <td className="py-2.5 text-sm text-text-light">
                            {t.date ? new Date(t.date).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-2.5 text-sm text-text-dark text-right">
                            {t.amount ? `PKR ${t.amount.toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Appointments */}
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
          )}

          {/* ============================================================ */}
          {/* TAB 2: Medical Profile                                        */}
          {/* ============================================================ */}
          {activeTab === 'medical' && (
            <div className="space-y-6">
              {/* Send Intake Form */}
              <div className="bg-white rounded-xl border border-border p-6">
                <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Send Intake Form</h2>
                <p className="text-sm text-text-light mb-4">
                  Send a digital intake form for the client to fill out on their phone or an in-clinic iPad.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => createIntakeForm('whatsapp')}
                    disabled={intakeLoading}
                    className="px-4 py-2 text-sm font-medium bg-whatsapp/10 text-whatsapp rounded-lg hover:bg-whatsapp/20 transition-colors disabled:opacity-50"
                  >
                    {intakeLoading ? 'Creating...' : 'Send via WhatsApp'}
                  </button>
                  <button
                    onClick={() => createIntakeForm('ipad')}
                    disabled={intakeLoading}
                    className="px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    iPad Mode
                  </button>
                  <button
                    onClick={() => createIntakeForm('link')}
                    disabled={intakeLoading}
                    className="px-4 py-2 text-sm font-medium bg-gray-100 text-text-dark rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Copy Link
                  </button>
                </div>

                {/* Show generated URL */}
                {intakeUrl && (
                  <div className="flex items-center gap-2 p-3 bg-warm-white rounded-lg border border-border-light">
                    <input
                      type="text"
                      readOnly
                      value={intakeUrl}
                      className="flex-1 bg-transparent text-sm text-text-dark focus:outline-none truncate"
                    />
                    <button
                      onClick={copyIntakeUrl}
                      className="px-3 py-1.5 text-xs font-medium bg-gold text-white rounded-md hover:bg-gold-dark transition-colors shrink-0"
                    >
                      {intakeCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                )}

                {/* Form history */}
                {intakeForms.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs font-semibold uppercase text-text-muted mb-2 tracking-wide">Form History</h3>
                    <div className="space-y-1.5">
                      {intakeForms.map((f) => (
                        <div key={f.id} className="flex items-center justify-between py-2 px-3 bg-warm-white rounded-lg text-sm">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              f.status === 'completed' ? 'bg-green-100 text-green-700' :
                              f.status === 'expired' ? 'bg-gray-100 text-gray-500' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {f.status}
                            </span>
                            <span className="text-text-muted text-xs capitalize">{f.sent_via}</span>
                          </div>
                          <span className="text-xs text-text-muted">
                            {new Date(f.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-lg font-semibold text-text-dark">Medical Intake Form</h2>
                {client.updated_at && (
                  <span className="text-xs text-text-muted">
                    Last updated: {new Date(client.updated_at).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1.5">Gender</label>
                  <select
                    value={medForm.gender}
                    onChange={(e) => setMedForm((f) => ({ ...f, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={medForm.date_of_birth}
                    onChange={(e) => setMedForm((f) => ({ ...f, date_of_birth: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
                  />
                </div>

                {/* Skin Type */}
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1.5">Skin Type (Fitzpatrick)</label>
                  <select
                    value={medForm.skin_type}
                    onChange={(e) => setMedForm((f) => ({ ...f, skin_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
                  >
                    <option value="">Select...</option>
                    <option value="I">Type I - Very fair, always burns</option>
                    <option value="II">Type II - Fair, usually burns</option>
                    <option value="III">Type III - Medium, sometimes burns</option>
                    <option value="IV">Type IV - Olive, rarely burns</option>
                    <option value="V">Type V - Brown, very rarely burns</option>
                    <option value="VI">Type VI - Dark brown/black, never burns</option>
                  </select>
                </div>

                {/* Allergies */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-dark mb-1.5">Known Allergies</label>
                  <textarea
                    value={medForm.allergies}
                    onChange={(e) => setMedForm((f) => ({ ...f, allergies: e.target.value }))}
                    rows={2}
                    placeholder="List any known allergies (medications, substances, etc.)"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold resize-none"
                  />
                </div>

                {/* Medical Conditions */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-dark mb-1.5">Medical Conditions</label>
                  <textarea
                    value={medForm.conditions}
                    onChange={(e) => setMedForm((f) => ({ ...f, conditions: e.target.value }))}
                    rows={2}
                    placeholder="Any existing medical conditions (diabetes, hypertension, autoimmune, etc.)"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold resize-none"
                  />
                </div>

                {/* Current Medications */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-dark mb-1.5">Current Medications</label>
                  <textarea
                    value={medForm.medications}
                    onChange={(e) => setMedForm((f) => ({ ...f, medications: e.target.value }))}
                    rows={2}
                    placeholder="List current medications including supplements"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold resize-none"
                  />
                </div>

                {/* Previous Treatments */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-dark mb-1.5">Previous Aesthetic Treatments (elsewhere)</label>
                  <textarea
                    value={medForm.previous_treatments}
                    onChange={(e) => setMedForm((f) => ({ ...f, previous_treatments: e.target.value }))}
                    rows={2}
                    placeholder="Any treatments done at other clinics (Botox, fillers, laser, etc.)"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={saveMedical}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Medical Profile'}
                </button>
              </div>
            </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: Before & After Photos                                  */}
          {/* ============================================================ */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              {/* Google Drive not configured banner */}
              {!driveConfigured && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-amber-800">Google Drive Not Configured</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Photo uploads require Google Drive integration. Set <code className="bg-amber-100 px-1 py-0.5 rounded text-xs">GOOGLE_SERVICE_ACCOUNT_JSON</code> and <code className="bg-amber-100 px-1 py-0.5 rounded text-xs">GOOGLE_DRIVE_ROOT_FOLDER_ID</code> environment variables to enable file uploads.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Photo consent banner */}
              <div className={`rounded-xl border p-4 flex items-center justify-between ${
                client.photo_consent
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{client.photo_consent ? '\uD83D\uDCF8' : '\u26A0\uFE0F'}</span>
                  <div>
                    <p className="text-sm font-medium text-text-dark">
                      {client.photo_consent
                        ? 'Client has given consent for before/after photography'
                        : 'Photo consent not obtained \u2014 before/after photos cannot be taken'}
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={client.photo_consent || false}
                  onChange={togglePhotoConsent}
                />
              </div>

              {/* Add photos button */}
              {client.photo_consent && driveConfigured && (
                <div className="flex justify-end">
                  <button
                    onClick={() => { setShowPhotoForm(!showPhotoForm); setSelectedFiles([]); }}
                    className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
                  >
                    {showPhotoForm ? 'Cancel' : '+ Upload Photos'}
                  </button>
                </div>
              )}

              {/* Upload photo form */}
              {showPhotoForm && client.photo_consent && driveConfigured && (
                <div className="bg-white rounded-xl border border-border p-6">
                  <h3 className="font-serif text-base font-semibold text-text-dark mb-4">Upload Photos</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1">Treatment *</label>
                      <input
                        type="text"
                        value={photoForm.treatment}
                        onChange={(e) => setPhotoForm((f) => ({ ...f, treatment: e.target.value }))}
                        placeholder="e.g. Hydrafacial, Botox"
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1">Photo Type *</label>
                      <select
                        value={photoForm.photo_type}
                        onChange={(e) => setPhotoForm((f) => ({ ...f, photo_type: e.target.value as 'before' | 'after' }))}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
                      >
                        <option value="before">Before</option>
                        <option value="after">After</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1">Date Taken</label>
                      <input
                        type="date"
                        value={photoForm.taken_at}
                        onChange={(e) => setPhotoForm((f) => ({ ...f, taken_at: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1">Notes</label>
                      <input
                        type="text"
                        value={photoForm.notes}
                        onChange={(e) => setPhotoForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="Optional notes"
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
                      />
                    </div>
                  </div>

                  {/* Drag & drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      dragOver
                        ? 'border-gold bg-gold/5'
                        : 'border-border hover:border-gold/50 bg-warm-white'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16V4m0 0l-4 4m4-4l4 4M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
                      </svg>
                      <p className="text-sm text-text-muted">
                        <span className="font-medium text-gold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-text-muted">JPG, PNG, HEIC up to 20MB each</p>
                    </div>
                  </div>

                  {/* Selected files preview */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-text-dark mb-2">{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected</p>
                      <div className="flex flex-wrap gap-3">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-20 h-20 object-cover rounded-lg border border-border"
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); removeSelectedFile(idx); }}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              x
                            </button>
                            <p className="text-[10px] text-text-muted mt-0.5 truncate w-20">{file.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload progress */}
                  {uploadProgress !== null && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-muted">Uploading to Google Drive...</span>
                        <span className="text-xs font-medium text-gold">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-border-light rounded-full h-2">
                        <div
                          className="bg-gold h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={addPhoto}
                      disabled={saving || !photoForm.treatment || selectedFiles.length === 0}
                      className="px-6 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
                    >
                      {saving ? `Uploading... ${uploadProgress || 0}%` : `Upload ${selectedFiles.length || ''} Photo${selectedFiles.length !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </div>
              )}

              {/* Photo grid grouped by treatment */}
              {Object.keys(photoGroups).length === 0 ? (
                <div className="bg-white rounded-xl border border-border p-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-12 h-12 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-text-muted">No photos uploaded yet.</p>
                    {client.photo_consent && driveConfigured && (
                      <button
                        onClick={() => setShowPhotoForm(true)}
                        className="text-sm text-gold hover:text-gold-dark font-medium"
                      >
                        Upload the first photo
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                Object.entries(photoGroups).map(([treatment, treatmentPhotos]) => {
                  const beforePhotos = treatmentPhotos.filter((p) => p.photo_type === 'before');
                  const afterPhotos = treatmentPhotos.filter((p) => p.photo_type === 'after');
                  const latestDate = treatmentPhotos[0]?.taken_at;
                  const allTreatmentPhotos = [...beforePhotos, ...afterPhotos];

                  return (
                    <div key={treatment} className="bg-white rounded-xl border border-border p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-serif text-base font-semibold text-text-dark">{treatment}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-muted">
                            {treatmentPhotos.length} photo{treatmentPhotos.length !== 1 ? 's' : ''}
                          </span>
                          {latestDate && (
                            <span className="text-xs text-text-muted">
                              &middot; {new Date(latestDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Before column */}
                        <div>
                          <p className="text-xs font-semibold uppercase text-text-muted mb-2">Before</p>
                          {beforePhotos.length === 0 ? (
                            <div className="aspect-[4/3] bg-warm-white rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                              <span className="text-sm text-text-muted">No before photo</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {beforePhotos.map((p) => (
                                <div key={p.id} className="relative group">
                                  <img
                                    src={p.thumbnail_url || p.photo_url}
                                    alt={`Before - ${treatment}`}
                                    className="w-full aspect-[4/3] object-cover rounded-lg border border-border cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => openLightbox(p, allTreatmentPhotos)}
                                  />
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); deletePhoto(p.id); }}
                                      className="w-7 h-7 bg-red-500/90 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                                      title="Delete photo"
                                    >
                                      x
                                    </button>
                                  </div>
                                  <div className="mt-1 flex items-center justify-between">
                                    {p.notes && <p className="text-xs text-text-muted truncate">{p.notes}</p>}
                                    <p className="text-[10px] text-text-muted ml-auto">{p.taken_at ? new Date(p.taken_at).toLocaleDateString() : ''}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* After column */}
                        <div>
                          <p className="text-xs font-semibold uppercase text-text-muted mb-2">After</p>
                          {afterPhotos.length === 0 ? (
                            <div className="aspect-[4/3] bg-warm-white rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                              <span className="text-sm text-text-muted">No after photo</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {afterPhotos.map((p) => (
                                <div key={p.id} className="relative group">
                                  <img
                                    src={p.thumbnail_url || p.photo_url}
                                    alt={`After - ${treatment}`}
                                    className="w-full aspect-[4/3] object-cover rounded-lg border border-border cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => openLightbox(p, allTreatmentPhotos)}
                                  />
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); deletePhoto(p.id); }}
                                      className="w-7 h-7 bg-red-500/90 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                                      title="Delete photo"
                                    >
                                      x
                                    </button>
                                  </div>
                                  <div className="mt-1 flex items-center justify-between">
                                    {p.notes && <p className="text-xs text-text-muted truncate">{p.notes}</p>}
                                    <p className="text-[10px] text-text-muted ml-auto">{p.taken_at ? new Date(p.taken_at).toLocaleDateString() : ''}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Lightbox overlay */}
          {lightboxPhoto && (
            <div
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
              onClick={() => setLightboxPhoto(null)}
            >
              <div
                className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button
                  onClick={() => setLightboxPhoto(null)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors text-lg"
                >
                  x
                </button>

                {/* Image */}
                <div className="flex-1 relative bg-black flex items-center justify-center min-h-0">
                  {/* Nav arrows */}
                  {lightboxIndex > 0 && (
                    <button
                      onClick={() => lightboxNav(-1)}
                      className="absolute left-3 z-10 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors text-xl"
                    >
                      &#8249;
                    </button>
                  )}
                  {lightboxIndex < lightboxList.length - 1 && (
                    <button
                      onClick={() => lightboxNav(1)}
                      className="absolute right-3 z-10 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors text-xl"
                    >
                      &#8250;
                    </button>
                  )}
                  <img
                    src={lightboxPhoto.full_url || lightboxPhoto.photo_url}
                    alt={`${lightboxPhoto.photo_type} - ${lightboxPhoto.treatment}`}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                </div>

                {/* Photo details */}
                <div className="p-4 border-t border-border bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-sm font-semibold text-text-dark">{lightboxPhoto.treatment}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          lightboxPhoto.photo_type === 'before'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {lightboxPhoto.photo_type === 'before' ? 'Before' : 'After'}
                        </span>
                      </div>
                      {lightboxPhoto.notes && (
                        <p className="text-xs text-text-muted mt-1">{lightboxPhoto.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-muted">
                        {lightboxPhoto.taken_at ? new Date(lightboxPhoto.taken_at).toLocaleDateString() : ''}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        by {lightboxPhoto.uploaded_by}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {lightboxIndex + 1} of {lightboxList.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: Communication Preferences                              */}
          {/* ============================================================ */}
          {activeTab === 'communication' && (
            <div className="bg-white rounded-xl border border-border p-6 space-y-6">
              <h2 className="font-serif text-lg font-semibold text-text-dark">Communication Preferences</h2>

              {/* Do Not Disturb */}
              <div className="flex items-center justify-between py-4 border-b border-border-light">
                <div>
                  <p className="text-sm font-medium text-text-dark">Do Not Disturb</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Client has requested not to be contacted for marketing
                  </p>
                </div>
                <Toggle
                  checked={commForm.do_not_disturb}
                  onChange={(v) => setCommForm((f) => ({ ...f, do_not_disturb: v }))}
                />
              </div>

              {/* WhatsApp Opt-in */}
              <div className="flex items-center justify-between py-4 border-b border-border-light">
                <div>
                  <p className="text-sm font-medium text-text-dark">WhatsApp Messages</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Client consents to receiving WhatsApp messages
                  </p>
                </div>
                <Toggle
                  checked={commForm.wa_opted_in}
                  onChange={(v) => setCommForm((f) => ({ ...f, wa_opted_in: v }))}
                />
              </div>

              {/* WhatsApp Quality */}
              <div className="flex items-center justify-between py-4 border-b border-border-light">
                <div>
                  <p className="text-sm font-medium text-text-dark">WhatsApp Quality Rating</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Auto-tracked quality of WhatsApp interactions
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  client.wa_quality === 'green' ? 'bg-green-100 text-green-700' :
                  client.wa_quality === 'yellow' ? 'bg-amber-100 text-amber-700' :
                  client.wa_quality === 'red' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {client.wa_quality || 'N/A'}
                </span>
              </div>

              {/* Contact Frequency */}
              <div className="py-4 border-b border-border-light">
                <label className="block text-sm font-medium text-text-dark mb-1.5">
                  Contact Frequency Preference
                </label>
                <select
                  value={commForm.contact_frequency}
                  onChange={(e) => setCommForm((f) => ({ ...f, contact_frequency: e.target.value }))}
                  className="w-full max-w-xs px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
                >
                  <option value="">No preference</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="never">Never</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={saveCommunication}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: Notes & Tags                                           */}
          {/* ============================================================ */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              {/* Tags */}
              <div className="bg-white rounded-xl border border-border p-6">
                <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {clientTags.length === 0 && (
                    <p className="text-sm text-text-muted">No tags assigned.</p>
                  )}
                  {clientTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gold/10 text-gold font-medium"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-gold/60 hover:text-red-500 transition-colors"
                        title="Remove tag"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addTag(); }}
                    placeholder="Add a tag..."
                    className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold flex-1 max-w-xs"
                  />
                  <button
                    onClick={addTag}
                    disabled={!newTag.trim()}
                    className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-xl border border-border p-6">
                <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Notes</h2>
                {client.notes && (
                  <pre className="text-sm text-text-light whitespace-pre-wrap bg-warm-white rounded-lg p-4 mb-4 font-sans max-h-96 overflow-y-auto">
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
                    disabled={saving || !noteText.trim()}
                    className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Add Note'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* Sidebar (visible on all tabs)                                  */}
        {/* ============================================================ */}
        <div className="space-y-6">
          {/* Client Flags / Badges */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-serif text-sm font-semibold text-text-dark mb-3 uppercase tracking-wide">Status</h3>
            <div className="space-y-2.5">
              {/* DND */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                client.do_not_disturb
                  ? 'bg-red-50 text-red-700'
                  : 'bg-green-50 text-green-700'
              }`}>
                <span>{client.do_not_disturb ? '\uD83D\uDD34' : '\u2705'}</span>
                {client.do_not_disturb ? 'Do Not Disturb' : 'Contactable'}
              </div>

              {/* Photo Consent */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                client.photo_consent
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                <span>{'\uD83D\uDCF8'}</span>
                {client.photo_consent ? 'Photo Consent' : 'No Photo Consent'}
              </div>

              {/* WhatsApp */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                client.wa_opted_in
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-50 text-gray-500'
              }`}>
                <span>{'\uD83D\uDCAC'}</span>
                {client.wa_opted_in ? 'WhatsApp Opted In' : 'WhatsApp Opted Out'}
              </div>
            </div>
          </div>

          {/* Preferred Doctor */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-serif text-sm font-semibold text-text-dark mb-2 uppercase tracking-wide">Preferred Doctor</h3>
            <p className="text-sm text-text-dark">{client.preferred_doctor || 'Not set'}</p>
          </div>

          {/* Quick Note */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-serif text-sm font-semibold text-text-dark mb-3 uppercase tracking-wide">Quick Note</h3>
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
                disabled={saving || !noteText.trim()}
                className="w-full px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
