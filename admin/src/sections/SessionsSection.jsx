import React, { useState } from 'react';

export default function SessionsSection({ data, loading, error }) {
  const [revoking, setRevoking] = useState(false);
  const [revoked,  setRevoked]  = useState(false);

  if (loading) return <div style={{ padding: 48, color: '#555', textAlign: 'center' }}>Loading…</div>;
  if (error)   return <div style={{ padding: '14px 18px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#f87171', fontSize: 13 }}>Error: {error}</div>;
  if (!data)   return null;

  const { current, all } = data;
  const others = (all || []).filter((s) => !s.isCurrent);

  const fmt = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const revoke = async () => {
    if (!confirm('Revoke all other sessions? They will need to re-authenticate.')) return;
    setRevoking(true);
    try {
      const res = await fetch('/api/admin-revoke', { method: 'POST', credentials: 'include' });
      if (res.ok) setRevoked(true);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <>
      {/* Current session */}
      <div style={{ fontWeight: 700, fontSize: 12, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        Current Session
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e', padding: '20px 22px', marginBottom: 24 }}>
        {current ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {[
              { label: 'IP Address',  value: current.ip || 'Unknown' },
              { label: 'Started',     value: fmt(current.startedAt) },
              { label: 'Expires',     value: fmt(current.expiresAt) },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#555', marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 14, color: '#ccc', fontFamily: item.label === 'IP Address' ? 'monospace' : undefined }}>{item.value}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#555', fontSize: 13 }}>Session info unavailable</div>
        )}
      </div>

      {/* All sessions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Active Sessions ({(all || []).length})
        </div>
        {others.length > 0 && !revoked && (
          <button
            onClick={revoke}
            disabled={revoking}
            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: 'rgba(220,38,38,0.1)', color: '#f87171', border: '1px solid rgba(220,38,38,0.3)', cursor: revoking ? 'not-allowed' : 'pointer', opacity: revoking ? 0.6 : 1 }}
          >
            {revoking ? 'Revoking…' : `Revoke ${others.length} other${others.length === 1 ? '' : 's'}`}
          </button>
        )}
        {revoked && (
          <span style={{ fontSize: 12, color: '#22c55e' }}>Other sessions revoked</span>
        )}
      </div>

      <div style={{ background: '#111', border: '1px solid #1e1e1e' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['IP Address', 'Started', 'Expires', 'Status'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #1a1a1a' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(all || []).length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: '#555', fontSize: 13 }}>No active sessions</td></tr>
            )}
            {(all || []).map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #141414' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: '#ccc' }}>{s.ip || '—'}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: '#888' }}>{fmt(s.startedAt)}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: '#666' }}>{fmt(s.expiresAt)}</td>
                <td style={{ padding: '10px 16px' }}>
                  {s.isCurrent ? (
                    <span style={{ padding: '2px 8px', fontSize: 11, background: 'rgba(34,197,94,0.12)', color: '#22c55e', fontWeight: 600, borderRadius: 2 }}>Current</span>
                  ) : (
                    <span style={{ padding: '2px 8px', fontSize: 11, background: 'rgba(255,255,255,0.04)', color: '#555', fontWeight: 600, borderRadius: 2 }}>Active</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
