import React, { useState, useEffect } from 'react';

export default function SetupScreen({ onSetupComplete }) {
  const [step,        setStep]        = useState('loading'); // loading | qr | verify | codes
  const [secret,      setSecret]      = useState('');
  const [qrUrl,       setQrUrl]       = useState('');
  const [code,        setCode]        = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [copied,      setCopied]      = useState(false);

  useEffect(() => {
    fetch('/api/admin-setup')
      .then((r) => r.json())
      .then((d) => {
        if (d.needsSetup) {
          setSecret(d.secret);
          setQrUrl(d.qrUrl);
          setStep('qr');
        } else {
          setStep('done');
        }
      })
      .catch(() => setStep('error'));
  }, []);

  const verify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/admin-setup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBackupCodes(data.backupCodes);
        setStep('codes');
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCodes = () => {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'coach-macro-admin-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const cardStyle = {
    width: '100%', maxWidth: 440, background: '#111',
    border: '1px solid #1e1e1e', padding: '44px 36px',
  };
  const pageStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: '#080808', padding: 24,
  };

  const Logo = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
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
  );

  if (step === 'loading') {
    return (
      <div style={pageStyle}>
        <div style={{ width: 24, height: 24, border: '2px solid #333', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <Logo />
          <p style={{ color: '#888', fontSize: 14 }}>TOTP is already configured. Reload to sign in.</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <Logo />
          <p style={{ color: '#f87171', fontSize: 14 }}>Failed to load setup. Check your connection and refresh.</p>
        </div>
      </div>
    );
  }

  if (step === 'qr') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <Logo />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f0f0f0', marginBottom: 6 }}>Set up 2-factor auth</h1>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>
            Scan this QR code with Google Authenticator (or any TOTP app), then enter the 6-digit code below to confirm.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <img src={qrUrl} alt="TOTP QR code" width={180} height={180} style={{ border: '4px solid #fff', display: 'block' }} />
          </div>

          <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', padding: '10px 14px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Manual entry key</div>
            <div style={{ fontFamily: 'monospace', fontSize: 14, color: '#888', letterSpacing: '0.1em', wordBreak: 'break-all' }}>{secret}</div>
          </div>

          <form onSubmit={verify}>
            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              6-digit verification code
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoFocus
              style={{
                width: '100%', padding: '12px 14px', fontSize: 22, fontWeight: 700,
                textAlign: 'center', letterSpacing: '0.25em',
                background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#f0f0f0',
                outline: 'none', borderRadius: 0, marginBottom: 16, fontFamily: 'monospace',
              }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || code.length < 6}
              style={{
                width: '100%', padding: '13px 20px', fontSize: 14, fontWeight: 600,
                letterSpacing: '0.05em', background: '#dc2626', color: '#fff',
                border: 'none', cursor: loading || code.length < 6 ? 'not-allowed' : 'pointer',
                opacity: loading || code.length < 6 ? 0.5 : 1,
              }}
            >
              {loading ? 'Verifying…' : 'Confirm & Enable'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'codes') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <Logo />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0' }}>TOTP enabled</div>
              <div style={{ fontSize: 12, color: '#555' }}>Save these backup codes — they won't be shown again.</div>
            </div>
          </div>

          <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {backupCodes.map((c, i) => (
                <div key={i} style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#f0f0f0', letterSpacing: '0.12em', padding: '6px 10px', background: '#111', border: '1px solid #1a1a1a' }}>
                  {c}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <button
              onClick={copyAll}
              style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, background: copied ? 'rgba(34,197,94,0.15)' : '#1a1a1a', color: copied ? '#22c55e' : '#888', border: '1px solid #2a2a2a', cursor: 'pointer' }}
            >
              {copied ? 'Copied!' : 'Copy all'}
            </button>
            <button
              onClick={downloadCodes}
              style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a', cursor: 'pointer' }}
            >
              Download .txt
            </button>
          </div>

          <button
            onClick={onSetupComplete}
            style={{ width: '100%', padding: '13px 20px', fontSize: 14, fontWeight: 600, letterSpacing: '0.05em', background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Continue to sign in
          </button>
        </div>
      </div>
    );
  }

  return null;
}
