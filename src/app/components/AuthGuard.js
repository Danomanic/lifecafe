'use client';

import { useState, useEffect } from 'react';
import { isAuthenticated, setAuth } from '@/lib/auth';

export default function AuthGuard({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = isAuthenticated();
      setAuthenticated(isAuth);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passcode }),
      });

      if (response.ok) {
        // Save authentication
        setAuth();
        setAuthenticated(true);
        setPasscode('');
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid passcode');
        setPasscode('');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to verify passcode');
      setPasscode('');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasscodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 4) {
      setPasscode(value);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">LifeCafe</h1>
            <p className="text-gray-600">Enter your 4-digit passcode</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={passcode}
                onChange={handlePasscodeChange}
                placeholder="••••"
                className="w-full text-center text-4xl font-bold tracking-[1em] px-6 py-4 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                autoFocus
                disabled={submitting}
              />
            </div>

            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={passcode.length !== 4 || submitting}
              className="w-full bg-indigo-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {submitting ? 'Verifying...' : 'Unlock'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Your device will stay logged in for 24 hours
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
