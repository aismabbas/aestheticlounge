'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'email' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to send OTP');
        return;
      }

      setStep('otp');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Invalid OTP');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="w-full max-w-md mx-4">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1A1A1A] mb-4">
            <span className="text-gold font-serif text-2xl font-bold">AL</span>
          </div>
          <h1 className="font-serif text-2xl text-text-dark">Staff Dashboard</h1>
          <p className="text-text-muted text-sm mt-1">Aesthetic Lounge</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-border-light">
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit}>
              <label className="block text-sm font-medium text-text-dark mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@aestheticloungeofficial.com"
                className="w-full px-4 py-3 rounded-lg border border-border bg-white text-text-dark placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition"
              />
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3 rounded-lg bg-gold text-white font-medium hover:bg-gold-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <p className="text-sm text-text-light mb-4">
                Enter the verification code sent to <strong>{email}</strong>
              </p>
              <label className="block text-sm font-medium text-text-dark mb-2">
                Verification Code
              </label>
              <input
                type="text"
                required
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-3 rounded-lg border border-border bg-white text-text-dark text-center text-2xl tracking-[0.5em] placeholder:text-text-muted placeholder:tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition font-mono"
              />
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3 rounded-lg bg-gold text-white font-medium hover:bg-gold-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                className="w-full mt-3 py-2 text-sm text-text-light hover:text-text-dark transition"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          Staff access only. Contact admin if you need an account.
        </p>
      </div>
    </div>
  );
}
