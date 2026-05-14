import React, { useState } from 'react';

function Card({ label, value, sub, color = '#f0f0f0', note }) {
  return (
    <div style={{ background: '#111', border: '1px solid #1e1e1e', padding: '20px 22px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#555', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value ?? '—'}</div>
      {sub  && <div style={{ fontSize: 12, color: '#555', marginTop: 6 }}>{sub}</div>}
      {note && <div style={{ fontSize: 11, color: '#444', marginTop: 8, borderTop: '1px solid #1a1a1a', paddingTop: 8 }}>{note}</div>}
    </div>
  );
}

function Row({ label, value, note, color = '#ccc' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '12px 0', borderBottom: '1px solid #141414' }}>
      <div>
        <span style={{ fontSize: 13, color: '#888' }}>{label}</span>
        {note && <span style={{ fontSize: 11, color: '#555', marginLeft: 10 }}>{note}</span>}
      </div>
      <span style={{ fontSize: 15, fontWeight: 600, color }}>{value}</span>
    </div>
  );
}

export default function FinancialSection({ data, loading, error }) {
  const [cac, setCac]       = useState('');
  const [fixedCosts, setFixed] = useState('');

  if (loading) return <div style={{ padding: 48, color: '#555', textAlign: 'center' }}>Loading…</div>;
  if (error)   return <div style={{ padding: '14px 18px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#f87171', fontSize: 13 }}>Error: {error}</div>;
  if (!data)   return null;

  const d        = data;
  const cacVal   = parseFloat(cac)        || null;
  const fixedVal = parseFloat(fixedCosts) || 0;
  const ltvcac   = cacVal && parseFloat(d.ltv) > 0 ? (parseFloat(d.ltv) / cacVal).toFixed(1) : null;
  const payback  = cacVal && parseFloat(d.arpu) > 0 ? (cacVal / parseFloat(d.arpu)).toFixed(1) : null;
  const burnRate = (parseFloat(d.aiCostThisMonth) + fixedVal).toFixed(2);
  const netMrr   = (parseFloat(d.mrr) - parseFloat(burnRate)).toFixed(2);

  const ltvcacColor = ltvcac >= 3 ? '#22c55e' : ltvcac >= 1 ? '#fbbf24' : '#f87171';

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 16 }}>
        <Card label="MRR"   value={`$${d.mrr}`}  sub={`ARR: $${d.arr}`}                 color="#22c55e" />
        <Card label="ARPU"  value={`$${d.arpu}`} sub="avg revenue per user/month"        />
        <Card label="LTV"   value={`$${d.ltv}`}  sub={`Assumes ${d.ltvAssumedMonths}mo avg retention`} note="Update when you have real churn data" />
        <Card label="Margin" value={`${d.marginPct}%`} sub={`Net: $${d.netRevenue}/mo`}  color={parseFloat(d.marginPct) >= 50 ? '#22c55e' : '#fbbf24'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <Card label="Viral Coefficient" value={d.viralCoefficient}
          sub={`${d.totalReferrals} total referrals`}
          color={parseFloat(d.viralCoefficient) >= 1 ? '#22c55e' : '#ccc'}
          note={parseFloat(d.viralCoefficient) >= 1 ? 'Viral growth!' : 'Target > 1 for viral growth'} />
        <Card label="AI Cost / Month" value={`$${d.aiCostThisMonth}`} sub="blended input+output" color="#f87171" />
        <Card label="Pro Users"  value={d.proUsers}  sub={`of ${d.totalUsers} total`} />
        <Card label="ARR"        value={`$${d.arr}`} sub="annualized recurring" color="#22c55e" />
      </div>

      {/* Manual inputs for CAC/fixed costs */}
      <div style={{ background: '#111', border: '1px solid #1e1e1e', padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 16 }}>Manual Inputs (not tracked in DB)</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#555', letterSpacing: '0.07em', textTransform: 'uppercase' }}>CAC ($ per paying user)</span>
            <input
              type="number"
              placeholder="e.g. 5.00"
              value={cac}
              onChange={(e) => setCac(e.target.value)}
              style={{ padding: '8px 12px', background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#f0f0f0', fontSize: 13, width: 160, outline: 'none' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#555', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Other Monthly Fixed Costs ($)</span>
            <input
              type="number"
              placeholder="e.g. 50.00"
              value={fixedCosts}
              onChange={(e) => setFixed(e.target.value)}
              style={{ padding: '8px 12px', background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#f0f0f0', fontSize: 13, width: 200, outline: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* Derived metrics */}
      <div style={{ background: '#111', border: '1px solid #1e1e1e', padding: '20px 24px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 4 }}>Derived Metrics</div>
        <Row label="Monthly Burn Rate"  value={`$${burnRate}`}     note="AI cost + fixed costs" />
        <Row label="Net MRR"            value={`$${netMrr}`}       color={parseFloat(netMrr) >= 0 ? '#22c55e' : '#f87171'} />
        <Row label="LTV : CAC"          value={ltvcac ? `${ltvcac}:1` : 'Enter CAC above'}   color={ltvcac ? ltvcacColor : '#555'} note="Target > 3:1" />
        <Row label="Payback Period"     value={payback ? `${payback} months` : 'Enter CAC above'} note="Months to recover CAC" />
        <Row label="Viral Coefficient"  value={d.viralCoefficient}  color={parseFloat(d.viralCoefficient) >= 1 ? '#22c55e' : '#ccc'} note="Referrals per user — want > 1" />
      </div>
    </>
  );
}
