import React from 'react';

export default function ForecastSection({ data, loading, error }) {
  if (loading) return <div style={{ padding: 48, color: '#555', textAlign: 'center' }}>Loading…</div>;
  if (error)   return <div style={{ padding: '14px 18px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#f87171', fontSize: 13 }}>Error: {error}</div>;
  if (!data)   return null;

  const d   = data;
  const allMrr = [
    ...(d.history || []).map((r) => ({ month: r.month, mrr: parseFloat(d.currentMrr), type: 'actual', newPro: r.newPro })),
    ...(d.forecast || []).map((r) => ({ month: r.month, mrr: parseFloat(r.projectedMrr), type: 'forecast', newPro: r.projectedPro })),
  ];
  const maxMrr = Math.max(...allMrr.map((r) => r.mrr), 1);
  const endYearMrr = d.forecast?.slice(-1)[0]?.projectedMrr;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Current MRR',         value: `$${d.currentMrr}`,    color: '#22c55e' },
          { label: 'Avg New Pro / Month',  value: `+${d.avgNewProPerMonth}`, sub: 'last 3 months', color: '#60a5fa' },
          { label: 'End-of-Year MRR',      value: endYearMrr ? `$${parseFloat(endYearMrr).toFixed(2)}` : '—', color: '#fbbf24', sub: 'linear projection' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #1e1e1e', padding: '20px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#555', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color || '#f0f0f0', lineHeight: 1 }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: 12, color: '#555', marginTop: 6 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ fontWeight: 700, fontSize: 12, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        MRR Chart — History (6mo) + Forecast (6mo)
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e', padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
          {allMrr.map((r, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 9, color: '#555', writingMode: 'vertical-rl', height: 20 }}>{r.mrr > 0 ? `$${r.mrr.toFixed(0)}` : ''}</div>
              <div style={{
                width: '100%',
                height: `${(r.mrr / maxMrr) * 100}px`,
                background: r.type === 'forecast' ? '#fbbf2460' : '#22c55e',
                border: r.type === 'forecast' ? '1px dashed #fbbf24' : 'none',
                transition: 'height 0.4s',
              }} />
              <div style={{ fontSize: 9, color: r.type === 'forecast' ? '#fbbf24' : '#666', writingMode: 'vertical-rl', height: 28 }}>{r.month.slice(0, 7)}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 11, color: '#555' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: '#22c55e', display: 'inline-block' }} /> Actual</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: '#fbbf24', display: 'inline-block', opacity: 0.6 }} /> Forecast (linear)</span>
        </div>
      </div>

      <div style={{ fontWeight: 700, fontSize: 12, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        6-Month Forecast
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Month', 'Projected Pro Users', 'Projected MRR', 'Growth vs Now'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #1a1a1a' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(d.forecast || []).map((r) => {
              const growthPct = d.currentMrr > 0
                ? (((parseFloat(r.projectedMrr) - parseFloat(d.currentMrr)) / parseFloat(d.currentMrr)) * 100).toFixed(0)
                : 0;
              return (
                <tr key={r.month} style={{ borderBottom: '1px solid #141414' }}>
                  <td style={{ padding: '10px 16px', color: '#fbbf24', fontWeight: 600 }}>{r.month}</td>
                  <td style={{ padding: '10px 16px' }}>{r.projectedPro}</td>
                  <td style={{ padding: '10px 16px', color: '#22c55e', fontWeight: 600 }}>${parseFloat(r.projectedMrr).toFixed(2)}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ color: growthPct > 0 ? '#4ade80' : '#888', fontSize: 13 }}>
                      {growthPct > 0 ? '+' : ''}{growthPct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: '#555' }}>
        Based on linear extrapolation of last 3 months. Assumes no churn events or pricing changes.
      </div>
    </>
  );
}
