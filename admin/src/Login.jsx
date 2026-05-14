import React, { useState, useRef, useEffect, useCallback } from 'react';

const CIRCUMFERENCE = 2 * Math.PI * 20; // r=20

function CountdownRing({ seconds, total = 30 }) {
  const frac   = seconds / total;
  const offset = CIRCUMFERENCE * (1 - frac);
  const color  = seconds <= 5 ? '#ef4444' : seconds <= 10 ? '#f59e0b' : '#dc2626';

  return (
    <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="30" cy="30" r="20" fill="none" stroke="#222" strokeWidth="3" />
      <circle
        cx="30" cy="30" r="20" fill="none"
        stroke={color} strokeWidth="3"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
      />
    </svg>
  );
}

export default function Login({ onLogin }) {
  const [digits,      setDigits]      = useState(['', '', '', '', '', '']);
  const [backupMode,  setBackupMode]  = useState(false);
  const [backupCode,  setBackupCode]  = useState('');
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [shaking,     setShaking]     = useState(false);
  const [seconds,     setSeconds]     = useState(30 - (Math.floor(Date.now() / 1000) % 30));
  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    const tick = () => {
      const s = 30 - (Math.floor(Date.now() / 1000) % 30);
      setSeconds(s);
      // New TOTP window — clear digits
      if (s === 30) setDigits(['', '', '', '', '', '']);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, []);

  const shake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  const submit = useCallback(async (code) => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/admin-login', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ code }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const vRes  = await fetch('/api/admin-verify', { credentials: 'include' });
        const vData = await vRes.json();
        onLogin({ email: vData.email });
      } else {
        setError(data.error || 'Invalid code');
        shake();
        setDigits(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch {
      setError('Network error. Please try again.');
      shake();
    } finally {
      setLoading(false);
    }
  }, [loading, onLogin]);

  const handleDigit = (i, val) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
    if (next.every((d) => d !== '')) submit(next.join(''));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      setTimeout(() => submit(pasted), 0);
    }
  };

  const submitBackup = async (e) => {
    e.preventDefault();
    if (backupCode.trim().length === 0) return;
    await submit(backupCode.trim().toUpperCase());
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#080808' }}>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
        .otp-input {
          width:44px;height:56px;text-align:center;font-size:24px;font-weight:700;
          background:#0a0a0a;border:1px solid #2a2a2a;color:#f0f0f0;
          outline:none;border-radius:0;caret-color:transparent;
          transition:border-color 0.15s;
        }
        .otp-input:focus { border-color: #dc2626; }
        .otp-input:disabled { opacity: 0.4; }
      `}</style>

      <div style={{ width: '100%', maxWidth: 380, background: '#111', border: '1px solid #1e1e1e', padding: '44px 36px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <svg width="28" height="20" viewBox="0 0 36 26" fill="none">
            <rect y="0"    width="36" height="5" rx="2.5" fill="#dc2626" />
            <rect y="10.5" width="27" height="5" rx="2.5" fill="#dc2626" />
            <rect y="21"   width="18" height="5" rx="2.5" fill="#dc2626" />
          </svg>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.08em', color: '#f0f0f0', textTransform: 'uppercase' }}>
            COACH<span style={{ color: '#dc2626' }}>MACRO</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#dc2626', letterSpacing: '0.1em', marginLeft: 4 }}>· ADMIN</span>
          </span>
        </div>

        {!backupMode ? (
          <>
            {/* Countdown ring + lock icon */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
              <div style={{ position: 'relative', width: 60, height: 60 }}>
                <CountdownRing seconds={seconds} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
                    <rect x="1" y="9" width="16" height="10" rx="2" stroke="#888" strokeWidth="1.5" fill="none" />
                    <path d="M5 9V6a4 4 0 0 1 8 0v3" stroke="#888" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    <circle cx="9" cy="14" r="1.5" fill="#888" />
                  </svg>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 8 }}>{seconds}s</div>
            </div>

            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f0f0f0', marginBottom: 4, textAlign: 'center' }}>
              Enter your code
            </h1>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 24, textAlign: 'center' }}>
              Open Google Authenticator and enter the 6-digit code.
            </p>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
                {error}
              </div>
            )}

            {/* OTP inputs — two groups of 3 */}
            <div
              onPaste={handlePaste}
              style={{
                display: 'flex', justifyContent: 'center',
                animation: shaking ? 'shake 0.6s ease' : 'none',
                gap: 8, marginBottom: 24,
              }}
            >
              {[0, 1, 2].map((i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  className="otp-input"
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digits[i]}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={loading}
                  autoFocus={i === 0}
                />
              ))}
              <div style={{ width: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: 20 }}>·</div>
              {[3, 4, 5].map((i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  className="otp-input"
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digits[i]}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={loading}
                />
              ))}
            </div>

            {loading && (
              <div style={{ textAlign: 'center', color: '#555', fontSize: 13, marginBottom: 16 }}>Verifying…</div>
            )}

            <button
              onClick={() => { setBackupMode(true); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer', width: '100%', textAlign: 'center', padding: 0, marginTop: 4 }}
            >
              Use a backup code instead
            </button>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f0f0f0', marginBottom: 4, textAlign: 'center' }}>
              Backup code
            </h1>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 24, textAlign: 'center' }}>
              Enter one of your 8-character backup codes.
            </p>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={submitBackup}>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
                maxLength={8}
                autoFocus
                style={{
                  width: '100%', padding: '13px 14px', fontSize: 18, fontWeight: 700,
                  letterSpacing: '0.15em', textAlign: 'center',
                  background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#f0f0f0',
                  outline: 'none', borderRadius: 0, marginBottom: 16,
                  fontFamily: 'monospace',
                  animation: shaking ? 'shake 0.6s ease' : 'none',
                }}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || backupCode.length < 8}
                style={{
                  width: '100%', padding: '13px 20px', fontSize: 14, fontWeight: 600,
                  letterSpacing: '0.05em', background: '#dc2626', color: '#fff',
                  border: 'none', cursor: loading || backupCode.length < 8 ? 'not-allowed' : 'pointer',
                  opacity: loading || backupCode.length < 8 ? 0.5 : 1,
                }}
              >
                {loading ? 'Verifying…' : 'Verify Backup Code'}
              </button>
            </form>

            <button
              onClick={() => { setBackupMode(false); setError(''); setBackupCode(''); }}
              style={{ background: 'none', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer', width: '100%', textAlign: 'center', padding: 0, marginTop: 16 }}
            >
              ← Back to authenticator code
            </button>
          </>
        )}
      </div>
    </div>
  );
}
