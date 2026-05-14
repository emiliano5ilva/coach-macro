import React from 'react';

function scoreColor(score) {
  if (score >= 8) return '#22c55e';
  if (score >= 6) return '#4ade80';
  if (score >= 4) return '#fbbf24';
  return '#f87171';
}

export default function UserHealthSection({ data, loading, error }) {
  if (loading) return <div style={{ padding: 48, color: '#555', textAlign: 'center' }}>Loading…</div>;
  if (error)   return <div style={{ padding: '14px 18px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#f87171', fontSize: 13 }}>Error: {error}</div>;
  if (!data)   return null;

  const d           = data;
  const maxCount    = Math.max(...(d.distribution || []).map((r) => r.count), 1);
  const healthyPct  = d.totalScored > 0
    ? (((d.distribution || []).filter((r) => r.score >= 7).reduce((s, r) => s + r.count, 0)) / d.totalScored * 100).toFixed(0)
    : 0;

  return (
    <>
      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Avg Health Score', value: `${d.avgScore}/10`, color: scoreColor(parseFloat(d.avgScore)), sub: `across ${d.totalScored} users` },
          { label: 'At-Risk Users', value: d.atRiskCount, color: d.atRiskCount > 0 ? '#f87171' : '#22c55e', sub: 'score ≤ 3' },
          { label: 'Healthy Users', value: `${healthyPct}%`, color: '#22c55e', sub: 'score ≥ 7' },
          { label: 'Users Scored', value: d.totalScored, sub: 'from most recent 300' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #1e1e1e', padding: '20px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#555', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color || '#f0f0f0', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 6 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Score distribution */}
      <div style={{ fontWeight: 700, fontSize: 12, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        Score Distribution (1 = at risk → 10 = highly engaged)
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e', padding: '24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
          {(d.distribution || []).map((r) => (
            <div key={r.score} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 10, color: '#555' }}>{r.count}</div>
              <div style={{
                width: '100%',
                height: `${maxCount > 0 ? (r.count / maxCount) * 80 : 0}px`,
                background: scoreColor(r.score),
                opacity: 0.8,
                transition: 'height 0.4s',
              }} />
              <div style={{ fontSize: 11, color: '#666' }}>{r.score}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#555', textAlign: 'center' }}>
          Scoring: Pro status (+3) · Active this week (+2) · Active today (+2) · Feature diversity (+2) · High usage (+1)
        </div>
      </div>

      {/* At-risk users */}
      <div style={{ fontWeight: 700, fontSize: 12, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        At-Risk Users — Score ≤ 3
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Email', 'Score', 'Plan', 'Last Active', 'Joined'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #1a1a1a' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(d.atRiskUsers || []).length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#4ade80', fontSize: 13 }}>No at-risk users — great engagement!</td></tr>
            )}
            {(d.atRiskUsers || []).map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #141414' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12 }}>{u.email}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: scoreColor(u.score) }}>{u.score}</span>
                  <span style={{ fontSize: 11, color: '#555', marginLeft: 4 }}>/10</span>
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ padding: '2px 8px', fontSize: 11, fontWeight: 600, background: u.is_pro ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)', color: u.is_pro ? '#4ade80' : '#888', borderRadius: 2 }}>
                    {u.is_pro ? 'Pro' : 'Free'}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: '#666' }}>{u.lastSeen ? u.lastSeen.slice(0, 10) : 'Never'}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: '#555' }}>{u.created_at?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
