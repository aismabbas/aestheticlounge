'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from 'next/image';

const ERROR_MESSAGES: Record<string, string> = {
  not_staff: 'This account is not linked to a staff member. Contact admin.',
  OAuthAccountNotLinked: 'This email is already linked to another sign-in method.',
  invalid_link: 'This login link is invalid. Please request a new one.',
  link_expired: 'This login link has expired. Please request a new one.',
  server_error: 'Something went wrong. Please try again.',
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [magicState, setMagicState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [magicMessage, setMagicMessage] = useState('');

  const errorParam = searchParams.get('error');
  const errorMessage = errorParam
    ? ERROR_MESSAGES[errorParam] || 'Sign in failed. Please try again.'
    : null;

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    await signIn('google', { callbackUrl: '/dashboard' });
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setMagicState('sending');
    setMagicMessage('');

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setMagicState('sent');
        setMagicMessage(data.message || 'Login link sent to your email.');
      } else {
        setMagicState('error');
        setMagicMessage(data.error || 'Failed to send login link.');
      }
    } catch {
      setMagicState('error');
      setMagicMessage('Network error. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="w-full max-w-md mx-4">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <Image
            src="/logo-icon.png"
            alt="Aesthetic Lounge"
            width={80}
            height={80}
            className="mx-auto mb-4 h-20 w-20"
            priority
          />
          <h1 className="font-serif text-2xl text-text-dark">Staff Dashboard</h1>
          <p className="text-text-muted text-sm mt-1">Aesthetic Lounge</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-border-light">
          {/* Error banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Google OAuth */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-border bg-white hover:bg-gray-50 text-text-dark font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border-light" />
            <span className="text-xs text-text-muted">or sign in with email</span>
            <div className="flex-1 h-px bg-border-light" />
          </div>

          {/* Magic Link */}
          {magicState === 'sent' ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✉️</span>
              </div>
              <p className="text-sm font-medium text-text-dark mb-1">Check your email</p>
              <p className="text-xs text-text-muted">{magicMessage}</p>
              <button
                onClick={() => { setMagicState('idle'); setEmail(''); }}
                className="mt-4 text-xs text-gold hover:text-gold-dark font-medium"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink}>
              <label htmlFor="email" className="block text-sm font-medium text-text-dark mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={magicState === 'sending'}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:border-gold transition disabled:opacity-50"
              />

              {magicState === 'error' && (
                <p className="text-red-500 text-xs mt-1.5">{magicMessage}</p>
              )}

              <button
                type="submit"
                disabled={magicState === 'sending' || !email.trim()}
                className="w-full mt-3 py-2.5 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {magicState === 'sending' ? 'Sending...' : 'Send login link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          Staff access only. Contact admin to get access.
        </p>
      </div>
    </div>
  );
}
