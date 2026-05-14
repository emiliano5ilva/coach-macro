import React from 'react';

export default function SupportSection({ data, loading, error }) {
  if (loading) return <div style={{ padding: 48, color: '#555', textAlign: 'center' }}>Loading…</div>;
  if (error)   return <div style={{ padding: '14px 18px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#f87171', fontSize: 13 }}>Error: {error}</div>;
  if (!data)   return null;

  const d   = data;
  const cats = Object.entries(d.categories || {}).sort((a, b) => b[1] - a[1]);
  const maxCat = cats[0]?.[1] || 1;

  const statusColor = { open: '#fbbf24', closed: '#22c55e', pending: '#60a5fa' };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Tickets Today',     value: d.today,    color: d.today > 10 ? '#fbbf24' : '#f0f0f0' },
          { label: 'Tickets This Week', value: d.thisWeek, color: '#f0f0f0' },
          { label: 'Categories',        value: cats.length, sub: cats.slice(0, 3).map(([c]) => c).join(', ') || '—' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #1e1e1e', padding: '20px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#555', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: 12, color: '#555', marginTop: 6 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {cats.length > 0 && (
        <>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
            Common Issues This Week
          </div>
          <div style={{ background: '#111', border: '1px solid #1e1e1e', padding: 20, marginBottom: 24 }}>
            {cats.map(([cat, count]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 100, fontSize: 12, color: '#888', textTransform: 'capitalize' }}>{cat}</div>
                <div style={{ flex: 1, height: 8, background: '#1a1a1a' }}>
                  <div style={{ height: '100%', width: `${(count / maxCat) * 100}%`, background: '#dc2626' }} />
                </div>
                <div style={{ width: 30, fontSize: 12, color: '#666', textAlign: 'right' }}>{count}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ fontWeight: 700, fontSize: 12, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        Recent Tickets
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Name', 'Email', 'Category', 'Subject', 'Status', 'Date'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #1a1a1a' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(d.recent || []).length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#555', fontSize: 13 }}>
                No tickets yet. Support emails route to support@coach-macro.com
              </td></tr>
            )}
            {(d.recent || []).map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #141414' }}>
                <td style={{ padding: '10px 16px', fontSize: 13, color: '#ccc' }}>{t.name || '—'}</td>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 11, color: '#888' }}>{t.email || '—'}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ padding: '2px 8px', fontSize: 11, background: 'rgba(59,130,246,0.12)', color: '#60a5fa', fontWeight: 600, textTransform: 'capitalize', borderRadius: 2 }}>{t.category || 'general'}</span>
                </td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: '#ccc', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ padding: '2px 8px', fontSize: 11, background: 'rgba(255,255,255,0.06)', color: statusColor[t.status] || '#888', fontWeight: 600, borderRadius: 2 }}>{t.status || 'open'}</span>
                </td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: '#555' }}>{t.created_at?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
