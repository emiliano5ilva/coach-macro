import React from 'react';

function BarChart({ data, valueKey, labelKey, color = '#dc2626', maxVal }) {
  const max = maxVal ?? Math.max(...(data || []).map((d) => d[valueKey]), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(data || []).map((row, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 80, fontSize: 11, color: '#666', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row[labelKey]}</div>
          <div style={{ flex: 1, height: 8, background: '#1a1a1a' }}>
            <div style={{ height: '100%', width: `${(row[valueKey] / max) * 100}%`, background: color, transition: 'width 0.4s' }} />
          </div>
          <div style={{ width: 40, fontSize: 11, color: '#666', textAlign: 'right' }}>{row[valueKey]}</div>
        </div>
      ))}
    </div>
  );
}

export default function GrowthSection({ data, loading, error }) {
  if (loading) return <div style={{ padding: 48, color: '#555', textAlign: 'center' }}>Loading…</div>;
  if (error)   return <div style={{ padding: '14px 18px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#f87171', fontSize: 13 }}>Error: {error}</div>;
  if (!data)   return null;

  const d          = data;
  const wow        = parseFloat(d.wowGrowthRate);
  const wowColor   = wow > 0 ? '#22c55e' : wow < 0 ? '#f87171' : '#888';
  const viralColor = parseFloat(d.viralCoefficient) >= 1 ? '#22c55e' : '#ccc';

  return (
    <>
      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'WoW Growth', value: d.wowGrowthRate != null ? `${wow > 0 ? '+' : ''}${d.wowGrowthRate}%` : '—', color: wowColor, sub: 'week-over-week new signups' },
          { label: 'Viral Coefficient', value: d.viralCoefficient, color: viralColor, sub: 'referrals per user — want > 1' },
          { label: 'Total Users', value: d.totalUsers, sub: 'registered accounts' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #1e1e1e', padding: '20px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#555', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color || '#f0f0f0', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 6 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Weekly growth chart */}
      <div style={{ fontWeight: 700, fontSize: 12, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        Weekly New Signups (Last 8 Weeks)
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e', padding: '20px 24px', marginBottom: 24 }}>
        <BarChart data={d.weeklyGrowth} valueKey="newUsers" labelKey="week" color="#dc2626" />
      </div>

      {/* Feature adoption */}
      <div style={{ fontWeight: 700, fontSize: 12, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        Feature Adoption (Last 30 Days)
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Feature / Event', 'Active Users', 'Adoption Rate', 'Bar'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #1a1a1a' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(d.featureAdoption || []).length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: '#555' }}>No event data yet</td></tr>
            )}
            {(d.featureAdoption || []).map((f) => (
              <tr key={f.event} style={{ borderBottom: '1px solid #141414' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: '#ccc' }}>{f.event}</td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#f0f0f0' }}>{f.activeUsers}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ fontSize: 13, color: parseFloat(f.adoptionPct) >= 50 ? '#22c55e' : parseFloat(f.adoptionPct) >= 20 ? '#fbbf24' : '#888' }}>
                    {f.adoptionPct}%
                  </span>
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ height: 6, background: '#1a1a1a', width: 120 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, f.adoptionPct)}%`, background: '#dc2626' }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
