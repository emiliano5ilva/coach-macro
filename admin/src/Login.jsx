import React, { useState } from 'react';

const S = {
  page: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: '#080808', padding: 24,
  },
  card: {
    width: '100%', maxWidth: 400,
    background: '#111', border: '1px solid #1e1e1e',
    padding: '40px 36px',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32,
  },
  logoText: {
    fontSize: 16, fontWeight: 700, letterSpacing: '0.08em',
    color: '#f0f0f0', textTransform: 'uppercase',
  },
  adminBadge: {
    fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
    color: '#dc2626', textTransform: 'uppercase', marginLeft: 2,
  },
  heading: { fontSize: 22, fontWeight: 700, color: '#f0f0f0', marginBottom: 6 },
  sub: { fontSize: 13, color: '#666', marginBottom: 28 },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' },
  input: {
    width: '100%', padding: '11px 14px', fontSize: 14,
    background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#f0f0f0',
    outline: 'none', marginBottom: 16, borderRadius: 0,
    transition: 'border-color 0.15s',
  },
  button: {
    width: '100%', padding: '13px 20px', fontSize: 14, fontWeight: 600,
    letterSpacing: '0.05em', background: '#dc2626', color: '#fff',
    border: 'none', cursor: 'pointer', transition: 'background 0.15s',
    marginTop: 8,
  },
  error: {
    padding: '10px 14px', background: 'rgba(220,38,38,0.1)',
    border: '1px solid rgba(220,38,38,0.3)', color: '#f87171',
    fontSize: 13, marginBottom: 16,
  },
  lockout: {
    padding: '10px 14px', background: 'rgba(250,160,0,0.08)',
    border: '1px solid rgba(250,160,0,0.25)', color: '#fbbf24',
    fontSize: 13, marginBottom: 16,
  },
};

export default function Login({ onLogin }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const isLockout = error.toLowerCase().includes('locked');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin-login', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Fetch email from verify endpoint
        const vRes = await fetch('/api/admin-verify', { credentials: 'include' });
        const vData = await vRes.json();
        onLogin({ email: vData.email });
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <svg width="28" height="20" viewBox="0 0 36 26" fill="none">
            <rect y="0"    width="36" height="5" rx="2.5" fill="#dc2626" />
            <rect y="10.5" width="27" height="5" rx="2.5" fill="#dc2626" />
            <rect y="21"   width="18" height="5" rx="2.5" fill="#dc2626" />
          </svg>
          <span style={S.logoText}>
            COACH<span style={{ color: '#dc2626' }}>MACRO</span>
            <span style={S.adminBadge}> · ADMIN</span>
          </span>
        </div>

        <h1 style={S.heading}>Sign in</h1>
        <p style={S.sub}>Restricted access — authorised personnel only.</p>

        {error && (
          <div style={isLockout ? S.lockout : S.error}>{error}</div>
        )}

        <form onSubmit={submit} autoComplete="off">
          <label style={S.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={S.input}
            required
            autoFocus
            disabled={loading}
          />
          <label style={S.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={S.input}
            required
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ ...S.button, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Verifying…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
