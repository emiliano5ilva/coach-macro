import React from 'react';

function ProgressBar({ value, max, label }) {
  const pct  = Math.min(100, Math.round((value / max) * 100));
  const color = pct >= 80 ? '#dc2626' : pct >= 60 ? '#fbbf24' : '#22c55e';
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', marginBottom: 4 }}>
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

function Card({ title, children, highlight }) {
  return (
    <div style={{
      background: '#111', border: `1px solid ${highlight ? '#dc262630' : '#1e1e1e'}`,
      padding: '18px 22px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#555', marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function BigStat({ value, unit, sub, color = '#f0f0f0' }) {
  return (
    <div>
      <span style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{value ?? '—'}</span>
      {unit && <span style={{ fontSize: 14, color: '#666', marginLeft: 6 }}>{unit}</span>}
      {sub && <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function InfrastructureSection({ data, loading, lastUpdated }) {
  if (loading && !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 48, color: '#555' }}>
        <div style={{ width: 18, height: 18, border: '2px solid #2a2a2a', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Loading infrastructure data…
      </div>
    );
  }

  if (!data) return <div style={{ padding: 32, color: '#555' }}>No infrastructure data available.</div>;

  const db    = data.database  || {};
  const err   = data.errors    || {};
  const ai    = data.ai        || {};
  const rt    = data.realtime  || {};

  const connPct    = db.connectionLimit > 0 && db.activeConnections != null
    ? Math.round((db.activeConnections / db.connectionLimit) * 100) : null;
  const sizePct    = db.dbSizeMb != null ? Math.round((db.dbSizeMb / 500) * 100) : null;
  const cacheColor = db.cacheHitRatio >= 95 ? '#22c55e' : db.cacheHitRatio >= 90 ? '#fbbf24' : '#f87171';

  const projCost  = parseFloat(ai.projectedMonthCost || 0);
  const costColor = projCost > 200 ? '#f87171' : projCost > 100 ? '#fbbf24' : '#f0f0f0';

  return (
    <>
      {/* Last updated bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, fontSize: 12, color: '#444' }}>
        {loading && <div style={{ width: 12, height: 12, border: '1.5px solid #333', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
        Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}
        <span style={{ marginLeft: 'auto' }}>Auto-refreshes every 60s</span>
      </div>

      {/* Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 16 }}>
        <Card title="DB Connections" highlight={connPct >= 80}>
          <BigStat
            value={db.activeConnections ?? '—'}
            sub={`of ${db.connectionLimit} limit`}
            color={connPct >= 80 ? '#f87171' : connPct >= 60 ? '#fbbf24' : '#22c55e'}
          />
          {connPct != null && (
            <ProgressBar value={db.activeConnections} max={db.connectionLimit} label="Usage" />
          )}
          {connPct >= 80 && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#f87171' }}>⚠ Consider upgrading Supabase</div>
          )}
        </Card>

        <Card title="Active Users Now">
          <BigStat value={rt.activeUsersNow} sub="in last 5 minutes" color="#60a5fa" />
          <div style={{ marginTop: 12, fontSize: 11, color: '#555' }}>
            Admin sessions: {rt.activeAdminSessions ?? '—'}
          </div>
        </Card>

        <Card title="Database Size" highlight={sizePct >= 80}>
          <BigStat
            value={db.dbSizeMb != null ? `${db.dbSizeMb}` : '—'}
            unit="MB"
            sub="of 500 MB free tier"
            color={sizePct >= 80 ? '#f87171' : sizePct >= 60 ? '#fbbf24' : '#f0f0f0'}
          />
          {sizePct != null && (
            <ProgressBar value={db.dbSizeMb} max={500} label="Capacity" />
          )}
          {sizePct >= 80 && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#f87171' }}>⚠ Approaching free tier limit</div>
          )}
        </Card>

        <Card title="Cache Hit Ratio">
          <BigStat
            value={db.cacheHitRatio != null ? `${db.cacheHitRatio}%` : '—'}
            sub="database cache efficiency"
            color={cacheColor}
          />
          <div style={{ marginTop: 12, fontSize: 11, color: '#555' }}>
            {db.cacheHitRatio >= 95 ? 'Excellent — minimal disk reads' :
             db.cacheHitRatio >= 90 ? 'Good — room to improve' :
             db.cacheHitRatio != null ? 'Low — check indexes' : 'No data yet'}
          </div>
        </Card>
      </div>

      {/* Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <Card title="Errors (24h)" highlight={err.last24Hours > 50}>
          <BigStat
            value={err.last24Hours ?? 0}
            sub={`Yesterday: ${err.yesterday ?? 0} | Trend: ${err.trend != null ? `${err.trend > 0 ? '+' : ''}${err.trend}%` : '—'}`}
            color={err.last24Hours > 100 ? '#f87171' : err.last24Hours > 50 ? '#fbbf24' : '#f0f0f0'}
          />
        </Card>

        <Card title="AI Cost This Month">
          <BigStat
            value={`$${parseFloat(ai.estimatedCostThisMonth || 0).toFixed(2)}`}
            sub={`Projected: $${ai.projectedMonthCost} · $${ai.costPerActiveUser}/user`}
            color={costColor}
          />
          {projCost > 200 && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#fbbf24' }}>⚡ Review token usage</div>
          )}
        </Card>

        <Card title="Rate Limit Hits (24h)">
          <BigStat
            value={err.rateLimitHits ?? 0}
            sub={err.rateLimitHits > 20 ? 'Elevated — possible abuse' : 'Normal'}
            color={err.rateLimitHits > 50 ? '#f87171' : err.rateLimitHits > 20 ? '#fbbf24' : '#22c55e'}
          />
        </Card>

        <Card title="AI Tokens This Month">
          <BigStat
            value={(ai.totalTokensThisMonth / 1_000_000).toFixed(2)}
            unit="M tokens"
            sub={`${ai.activeAiUsers} users consumed tokens`}
          />
        </Card>
      </div>

      {/* Recent errors */}
      <div style={{ fontWeight: 700, fontSize: 12, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        Recent Critical Errors
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #1a1a1a' }}>Message</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #1a1a1a' }}>Path</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #1a1a1a' }}>When</th>
            </tr>
          </thead>
          <tbody>
            {(err.criticalErrors || []).length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: 32, color: '#4ade80', fontSize: 13 }}>No critical errors in last 24h</td></tr>
            )}
            {(err.criticalErrors || []).map((e, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #141414' }}>
                <td style={{ padding: '10px 16px', fontSize: 12, color: '#f87171', maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.message}</td>
                <td style={{ padding: '10px 16px', fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{e.request_path || '—'}</td>
                <td style={{ padding: '10px 16px', fontSize: 11, color: '#555' }}>{e.created_at?.slice(0, 19).replace('T', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Row counts */}
      <div style={{ fontWeight: 700, fontSize: 12, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12, marginTop: 24 }}>
        Table Row Counts
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {(db.rowCounts || []).map((t) => (
          <div key={t.table} style={{ background: '#111', border: '1px solid #1a1a1a', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 12, color: '#888', fontFamily: 'monospace' }}>{t.table}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f0' }}>{(t.count).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </>
  );
}
