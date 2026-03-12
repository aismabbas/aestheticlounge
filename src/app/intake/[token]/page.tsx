'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

/* ------------------------------------------------------------------ */
/* Treatment list (flat) for the interest dropdown                      */
/* ------------------------------------------------------------------ */
const TREATMENT_OPTIONS = [
  'Classical Facial', 'Glow and Go Facial', 'Oxygen Facial', 'Acne Facial',
  'Microdermabrasion Facial', 'Microneedling Facial', 'Chemical Peel Facial',
  'Back Facial', 'Signature Facial', 'BB Glow Facial',
  'HydraFacial Signature', 'HydraFacial Deluxe', 'HydraFacial Platinum',
  'Botox', 'Dermal Fillers', 'Lip Enhancement', 'Non-Surgical Rhinoplasty',
  'PRP Hair Restoration', 'PRP Facial Rejuvenation', 'Mesotherapy',
  'Laser Hair Removal', 'IPL Photofacial', 'Fractional CO2 Laser',
  'Carbon Laser Peel', 'Tattoo Removal',
  'CoolSculpting', 'RF Body Contouring', 'Cavitation', 'Body Sculpting',
  'IV Drip Therapy', 'Vitamin Injections',
  'Teeth Whitening', 'Dental Veneers',
  'Other / Not Sure',
];

const MEDICAL_CONDITIONS = [
  'Diabetes', 'Heart Disease', 'Blood Disorders', 'Autoimmune Condition',
  'Thyroid Disorder', 'Pregnancy', 'None',
];

const SKIN_CONCERNS = [
  'Acne', 'Pigmentation', 'Wrinkles', 'Scarring', 'Hair Loss',
  'Dryness', 'Sensitivity', 'Other',
];

/* ------------------------------------------------------------------ */
/* Form data shape                                                     */
/* ------------------------------------------------------------------ */
interface IntakeFormData {
  full_name: string;
  phone: string;
  email: string;
  gender: string;
  date_of_birth: string;
  allergies: string;
  medications: string;
  conditions: string[];
  previous_treatments: string;
  skin_concerns: string[];
  skin_type: string;
  treatment_interest: string;
  photo_consent: boolean;
  wa_consent: boolean;
  terms_confirmed: boolean;
}

const emptyForm: IntakeFormData = {
  full_name: '',
  phone: '',
  email: '',
  gender: '',
  date_of_birth: '',
  allergies: '',
  medications: '',
  conditions: [],
  previous_treatments: '',
  skin_concerns: [],
  skin_type: '',
  treatment_interest: '',
  photo_consent: false,
  wa_consent: false,
  terms_confirmed: false,
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function IntakeFormPage() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const isIpad = searchParams.get('mode') === 'ipad';

  const [status, setStatus] = useState<'loading' | 'pending' | 'completed' | 'expired' | 'not_found'>('loading');
  const [form, setForm] = useState<IntakeFormData>({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/intake/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setStatus('not_found');
          return;
        }
        if (data.status === 'completed') {
          setStatus('completed');
          return;
        }
        if (data.status === 'expired') {
          setStatus('expired');
          return;
        }
        setStatus('pending');
        // Pre-fill from client data
        setForm((f) => ({
          ...f,
          full_name: data.client_name || '',
          phone: data.client_phone || '',
          email: data.client_email || '',
        }));
      })
      .catch(() => setStatus('not_found'));
  }, [token]);

  const updateField = <K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const toggleArrayItem = (key: 'conditions' | 'skin_concerns', item: string) => {
    setForm((f) => {
      const arr = f[key];
      // "None" clears everything else for conditions
      if (key === 'conditions' && item === 'None') {
        return { ...f, [key]: arr.includes('None') ? [] : ['None'] };
      }
      if (key === 'conditions' && arr.includes('None')) {
        return { ...f, [key]: [item] };
      }
      return {
        ...f,
        [key]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.full_name.trim()) { setError('Please enter your full name.'); return; }
    if (!form.phone.trim()) { setError('Please enter your phone number.'); return; }
    if (!form.terms_confirmed) { setError('Please confirm that the information is accurate.'); return; }

    setSubmitting(true);
    try {
      // Flatten conditions/skin_concerns for storage
      const formData = {
        ...form,
        conditions: form.conditions.join(', '),
        skin_concerns: form.skin_concerns.join(', '),
      };

      const res = await fetch(`/api/intake/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_data: formData }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Submission failed. Please try again.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextPatient = () => {
    setForm({ ...emptyForm });
    setSubmitted(false);
    setError('');
    // Create a new intake form for the next patient
    fetch('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sent_via: 'ipad' }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.token) {
          window.location.href = `/intake/${data.token}?mode=ipad`;
        } else {
          setError('Could not create a new form. Please try again.');
          setSubmitted(false);
        }
      })
      .catch(() => {
        // Fallback: redirect to the kiosk new page
        window.location.href = '/intake/new?mode=ipad';
      });
  };

  /* ---- Sizing classes for iPad mode ---- */
  const sz = {
    container: isIpad ? 'max-w-3xl' : 'max-w-xl',
    title: isIpad ? 'text-3xl' : 'text-2xl',
    subtitle: isIpad ? 'text-base' : 'text-sm',
    label: isIpad ? 'text-base' : 'text-sm',
    input: isIpad ? 'px-4 py-3.5 text-base' : 'px-3 py-2.5 text-sm',
    textarea: isIpad ? 'px-4 py-3.5 text-base' : 'px-3 py-2.5 text-sm',
    checkbox: isIpad ? 'w-6 h-6' : 'w-5 h-5',
    checkLabel: isIpad ? 'text-base' : 'text-sm',
    btn: isIpad ? 'px-8 py-4 text-base' : 'px-6 py-3 text-sm',
    section: isIpad ? 'p-8' : 'p-6',
    sectionTitle: isIpad ? 'text-xl' : 'text-lg',
    gap: isIpad ? 'gap-6' : 'gap-4',
  };

  /* ---- Non-pending states ---- */

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-12 h-12 rounded-full bg-[#B8924A]/20 mx-auto mb-4" />
          <p className="text-[#999] text-sm">Loading form...</p>
        </div>
      </div>
    );
  }

  if (status === 'not_found') {
    return (
      <MessageScreen
        title="Form Not Found"
        message="This intake form link is invalid or has been removed. Please contact the clinic for a new link."
        isIpad={isIpad}
      />
    );
  }

  if (status === 'expired') {
    return (
      <MessageScreen
        title="Form Expired"
        message="This intake form link has expired. Please contact the clinic for a new link."
        isIpad={isIpad}
      />
    );
  }

  if (status === 'completed' && !submitted) {
    return (
      <MessageScreen
        title="Already Submitted"
        message="This intake form has already been submitted. If you need to update your information, please contact the clinic."
        isIpad={isIpad}
      />
    );
  }

  /* ---- Success screen ---- */

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className={`font-serif ${isIpad ? 'text-3xl' : 'text-2xl'} font-semibold text-[#1A1A1A] mb-3`}>
            Thank You
          </h1>
          <p className={`${isIpad ? 'text-lg' : 'text-base'} text-[#6B6B6B] mb-8`}>
            Your form has been submitted successfully. The clinic will contact you shortly.
          </p>

          {isIpad && (
            <button
              onClick={handleNextPatient}
              className="px-8 py-4 bg-[#B8924A] text-white text-base font-semibold rounded-lg hover:bg-[#96742F] transition-colors"
            >
              Next Patient
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ---- Main form ---- */

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="bg-white border-b border-[#EAEAEA]">
        <div className={`${sz.container} mx-auto px-4 ${isIpad ? 'py-6' : 'py-4'} flex items-center gap-3`}>
          <div
            className="flex items-center justify-center rounded-full font-serif text-lg font-bold text-white"
            style={{
              width: isIpad ? 48 : 40,
              height: isIpad ? 48 : 40,
              background: 'linear-gradient(135deg, #D4B876 0%, #B8924A 40%, #96742F 70%, #D4B876 100%)',
            }}
          >
            A
          </div>
          <div>
            <div className={`font-serif ${isIpad ? 'text-2xl' : 'text-xl'} font-semibold tracking-tight`}>
              Aesthetic <span className="text-[#B8924A]">Lounge</span>
            </div>
            <p className={`${isIpad ? 'text-sm' : 'text-xs'} text-[#999]`}>Client Intake Form</p>
          </div>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className={`${sz.container} mx-auto px-4 ${isIpad ? 'py-8' : 'py-6'} space-y-6`}>

        {/* ---- Personal Information ---- */}
        <section className={`bg-white rounded-xl border border-[#EAEAEA] ${sz.section}`}>
          <h2 className={`font-serif ${sz.sectionTitle} font-semibold text-[#1A1A1A] mb-5`}>
            Personal Information
          </h2>
          <div className={`grid grid-cols-1 md:grid-cols-2 ${sz.gap}`}>
            <div className="md:col-span-2">
              <label className={`block ${sz.label} font-medium text-[#1A1A1A] mb-1.5`}>
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => updateField('full_name', e.target.value)}
                placeholder="Enter your full name"
                className={`w-full ${sz.input} border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#B8924A] transition-colors`}
              />
            </div>

            <div>
              <label className={`block ${sz.label} font-medium text-[#1A1A1A] mb-1.5`}>
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+92 3XX XXXXXXX"
                className={`w-full ${sz.input} border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#B8924A] transition-colors`}
              />
            </div>

            <div>
              <label className={`block ${sz.label} font-medium text-[#1A1A1A] mb-1.5`}>
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="your@email.com"
                className={`w-full ${sz.input} border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#B8924A] transition-colors`}
              />
            </div>

            <div>
              <label className={`block ${sz.label} font-medium text-[#1A1A1A] mb-1.5`}>Gender</label>
              <select
                value={form.gender}
                onChange={(e) => updateField('gender', e.target.value)}
                className={`w-full ${sz.input} border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#B8924A] transition-colors bg-white`}
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className={`block ${sz.label} font-medium text-[#1A1A1A] mb-1.5`}>Date of Birth</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => updateField('date_of_birth', e.target.value)}
                className={`w-full ${sz.input} border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#B8924A] transition-colors`}
              />
            </div>
          </div>
        </section>

        {/* ---- Medical History ---- */}
        <section className={`bg-white rounded-xl border border-[#EAEAEA] ${sz.section}`}>
          <h2 className={`font-serif ${sz.sectionTitle} font-semibold text-[#1A1A1A] mb-5`}>
            Medical History
          </h2>
          <div className={`space-y-5`}>
            <div>
              <label className={`block ${sz.label} font-medium text-[#1A1A1A] mb-1.5`}>
                Known Allergies
              </label>
              <textarea
                value={form.allergies}
                onChange={(e) => updateField('allergies', e.target.value)}
                rows={isIpad ? 3 : 2}
                placeholder="List any known allergies (medications, substances, food, etc.)"
                className={`w-full ${sz.textarea} border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#B8924A] transition-colors resize-none`}
              />
            </div>

            <div>
              <label className={`block ${sz.label} font-medium text-[#1A1A1A] mb-1.5`}>
                Current Medications
              </label>
              <textarea
                value={form.medications}
                onChange={(e) => updateField('medications', e.target.value)}
                rows={isIpad ? 3 : 2}
                placeholder="List current medications including vitamins and supplements"
                className={`w-full ${sz.textarea} border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#B8924A] transition-colors resize-none`}
              />
            </div>

            <div>
              <label className={`block ${sz.label} font-medium text-[#1A1A1A] mb-3`}>
                Medical Conditions
              </label>
              <div className={`grid grid-cols-2 ${isIpad ? 'md:grid-cols-3 gap-4' : 'md:grid-cols-3 gap-3'}`}>
                {MEDICAL_CONDITIONS.map((condition) => (
                  <label
                    key={condition}
                    className={`flex items-center ${isIpad ? 'gap-3' : 'gap-2.5'} cursor-pointer ${isIpad ? 'py-2' : 'py-1'}`}
                  >
                    <input
                      type="checkbox"
                      checked={form.conditions.includes(condition)}
                      onChange={() => toggleArrayItem('conditions', condition)}
                      className={`${sz.checkbox} rounded border-[#EAEAEA] text-[#B8924A] focus:ring-[#B8924A] accent-[#B8924A]`}
                    />
                    <span className={`${sz.checkLabel} text-[#1A1A1A]`}>{condition}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={`block ${sz.label} font-medium text-[#1A1A1A] mb-1.5`}>
                Previous Aesthetic Treatments
              </label>
              <textarea
                value={form.previous_treatments}
                onChange={(e) => updateField('previous_treatments', e.target.value)}
                rows={isIpad ? 3 : 2}
                placeholder="List any aesthetic treatments you've had before (Botox, fillers, laser, chemical peels, etc.)"
                className={`w-full ${sz.textarea} border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#B8924A] transition-colors resize-none`}
              />
            </div>

            <div>
              <label className={`block ${sz.label} font-medium text-[#1A1A1A] mb-3`}>
                Skin Concerns
              </label>
              <div className={`grid grid-cols-2 ${isIpad ? 'md:grid-cols-4 gap-4' : 'md:grid-cols-4 gap-3'}`}>
                {SKIN_CONCERNS.map((concern) => (
                  <label
                    key={concern}
                    className={`flex items-center ${isIpad ? 'gap-3' : 'gap-2.5'} cursor-pointer ${isIpad ? 'py-2' : 'py-1'}`}
                  >
                    <input
                      type="checkbox"
                      checked={form.skin_concerns.includes(concern)}
                      onChange={() => toggleArrayItem('skin_concerns', concern)}
                      className={`${sz.checkbox} rounded border-[#EAEAEA] text-[#B8924A] focus:ring-[#B8924A] accent-[#B8924A]`}
                    />
                    <span className={`${sz.checkLabel} text-[#1A1A1A]`}>{concern}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={`block ${sz.label} font-medium text-[#1A1A1A] mb-1.5`}>
                Skin Type (Fitzpatrick Scale)
              </label>
              <select
                value={form.skin_type}
                onChange={(e) => updateField('skin_type', e.target.value)}
                className={`w-full ${sz.input} border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#B8924A] transition-colors bg-white`}
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
          </div>
        </section>

        {/* ---- Treatment Interest ---- */}
        <section className={`bg-white rounded-xl border border-[#EAEAEA] ${sz.section}`}>
          <h2 className={`font-serif ${sz.sectionTitle} font-semibold text-[#1A1A1A] mb-5`}>
            Treatment Interest
          </h2>
          <div>
            <label className={`block ${sz.label} font-medium text-[#1A1A1A] mb-1.5`}>
              Which treatment are you interested in?
            </label>
            <select
              value={form.treatment_interest}
              onChange={(e) => updateField('treatment_interest', e.target.value)}
              className={`w-full ${sz.input} border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#B8924A] transition-colors bg-white`}
            >
              <option value="">Select a treatment...</option>
              {TREATMENT_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </section>

        {/* ---- Consent ---- */}
        <section className={`bg-white rounded-xl border border-[#EAEAEA] ${sz.section}`}>
          <h2 className={`font-serif ${sz.sectionTitle} font-semibold text-[#1A1A1A] mb-5`}>
            Consent
          </h2>

          {/* Privacy notice */}
          <div className="bg-[#B8924A]/5 border border-[#B8924A]/15 rounded-lg px-4 py-3 mb-5">
            <p className={`${isIpad ? 'text-sm' : 'text-xs'} text-[#6B6B6B] leading-relaxed`}>
              Your data is handled in accordance with our{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#B8924A] underline underline-offset-2 hover:text-[#96742F]"
              >
                Privacy Policy
              </a>
              . Medical information receives enhanced protection and is only accessible to your
              treating doctors and clinical staff.
            </p>
          </div>

          <div className="space-y-4">
            <label className={`flex items-start ${isIpad ? 'gap-4' : 'gap-3'} cursor-pointer ${isIpad ? 'py-2' : 'py-1'}`}>
              <input
                type="checkbox"
                checked={form.photo_consent}
                onChange={(e) => updateField('photo_consent', e.target.checked)}
                className={`${sz.checkbox} rounded border-[#EAEAEA] text-[#B8924A] focus:ring-[#B8924A] accent-[#B8924A] mt-0.5`}
              />
              <span className={`${sz.checkLabel} text-[#6B6B6B]`}>
                I consent to before/after photographs for treatment records
              </span>
            </label>

            <label className={`flex items-start ${isIpad ? 'gap-4' : 'gap-3'} cursor-pointer ${isIpad ? 'py-2' : 'py-1'}`}>
              <input
                type="checkbox"
                checked={form.wa_consent}
                onChange={(e) => updateField('wa_consent', e.target.checked)}
                className={`${sz.checkbox} rounded border-[#EAEAEA] text-[#B8924A] focus:ring-[#B8924A] accent-[#B8924A] mt-0.5`}
              />
              <span className={`${sz.checkLabel} text-[#6B6B6B]`}>
                I consent to receiving appointment reminders and follow-ups via WhatsApp
              </span>
            </label>

            <div className="border-t border-[#EAEAEA] pt-4">
              <label className={`flex items-start ${isIpad ? 'gap-4' : 'gap-3'} cursor-pointer ${isIpad ? 'py-2' : 'py-1'}`}>
                <input
                  type="checkbox"
                  checked={form.terms_confirmed}
                  onChange={(e) => updateField('terms_confirmed', e.target.checked)}
                  className={`${sz.checkbox} rounded border-[#EAEAEA] text-[#B8924A] focus:ring-[#B8924A] accent-[#B8924A] mt-0.5`}
                />
                <span className={`${sz.checkLabel} text-[#1A1A1A] font-medium`}>
                  I confirm the above information is accurate <span className="text-red-500">*</span>
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* ---- Error ---- */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className={`${isIpad ? 'text-base' : 'text-sm'} text-red-700`}>{error}</p>
          </div>
        )}

        {/* ---- Submit ---- */}
        <div className={isIpad ? 'pb-8' : 'pb-6'}>
          <button
            type="submit"
            disabled={submitting}
            className={`w-full ${sz.btn} font-semibold text-white rounded-lg transition-all disabled:opacity-50`}
            style={{
              background: 'linear-gradient(135deg, #D4B876 0%, #B8924A 40%, #96742F 70%, #D4B876 100%)',
              backgroundSize: '200% 200%',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Intake Form'}
          </button>
        </div>
      </form>

      {/* Footer */}
      <footer className="border-t border-[#EAEAEA] bg-white">
        <div className={`${sz.container} mx-auto px-4 py-4 text-center`}>
          <p className="text-xs text-[#999]">
            Aesthetic Lounge &middot; Plaza-126, BWB Phase 8, DHA Lahore Cantt &middot; +92-327-6660004
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reusable message screen                                             */
/* ------------------------------------------------------------------ */

function MessageScreen({
  title,
  message,
  isIpad,
}: {
  title: string;
  message: string;
  isIpad: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div
          className="flex items-center justify-center rounded-full font-serif text-2xl font-bold text-white mx-auto mb-6"
          style={{
            width: 56,
            height: 56,
            background: 'linear-gradient(135deg, #D4B876 0%, #B8924A 40%, #96742F 70%, #D4B876 100%)',
          }}
        >
          A
        </div>
        <h1 className={`font-serif ${isIpad ? 'text-3xl' : 'text-2xl'} font-semibold text-[#1A1A1A] mb-3`}>
          {title}
        </h1>
        <p className={`${isIpad ? 'text-lg' : 'text-base'} text-[#6B6B6B]`}>
          {message}
        </p>
      </div>
    </div>
  );
}
