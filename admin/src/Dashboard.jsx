import React, { useState, useEffect, useCallback } from 'react';
import InfrastructureSection from './sections/InfrastructureSection.jsx';
import FinancialSection      from './sections/FinancialSection.jsx';
import GrowthSection         from './sections/GrowthSection.jsx';
import UserHealthSection     from './sections/UserHealthSection.jsx';
import ForecastSection       from './sections/ForecastSection.jsx';
import SupportSection        from './sections/SupportSection.jsx';
import CompetitionIntel      from './sections/CompetitionIntel.jsx';
import SessionsSection       from './sections/SessionsSection.jsx';

// ── Styles ────────────────────────────────────────────────────────────────────

const css = `
  * { box-sizing: border-box; }
  body { margin: 0; }
  .admin-layout { display: flex; height: 100vh; overflow: hidden; }
  .sidebar {
    width: 220px; flex-shrink: 0;
    background: #0e0e0e; border-right: 1px solid #1a1a1a;
    display: flex; flex-direction: column;
    padding: 24px 0;
  }
  .sidebar-logo {
    padding: 0 20px 24px;
    border-bottom: 1px solid #1a1a1a; margin-bottom: 16px;
  }
  .sidebar-logo-text {
    font-size: 13px; font-weight: 700; letter-spacing: 0.08em;
    color: #f0f0f0; text-transform: uppercase;
  }
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 20px; cursor: pointer;
    font-size: 13px; font-weight: 500; color: #666;
    transition: all 0.1s; border: none; background: none;
    width: 100%; text-align: left;
  }
  .nav-item:hover { color: #ccc; background: #151515; }
  .nav-item.active { color: #f0f0f0; background: #1a1a1a; border-left: 2px solid #dc2626; padding-left: 18px; }
  .nav-item .icon { font-size: 15px; width: 18px; text-align: center; }
  .nav-spacer { flex: 1; }
  .sidebar-footer { border-top: 1px solid #1a1a1a; padding-top: 12px; }
  .main { flex: 1; overflow-y: auto; background: #080808; }
  .topbar {
    position: sticky; top: 0; z-index: 10;
    background: #0c0c0c; border-bottom: 1px solid #1a1a1a;
    padding: 16px 32px; display: flex; align-items: center; justify-content: space-between;
  }
  .topbar-title { font-size: 18px; font-weight: 700; color: #f0f0f0; }
  .topbar-meta { font-size: 12px; color: #444; }
  .content { padding: 32px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .card {
    background: #111; border: 1px solid #1e1e1e;
    padding: 20px 24px;
  }
  .card-label { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #555; margin-bottom: 8px; }
  .card-value { font-size: 28px; font-weight: 700; color: #f0f0f0; line-height: 1; }
  .card-sub { font-size: 12px; color: #555; margin-top: 6px; }
  .card-red .card-value { color: #dc2626; }
  .card-green .card-value { color: #22c55e; }
  .card-blue .card-value { color: #3b82f6; }
  .section-title { font-size: 14px; font-weight: 700; color: #888; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 16px; margin-top: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; font-weight: 600; color: #555; letter-spacing: 0.07em; text-transform: uppercase; padding: 10px 16px; border-bottom: 1px solid #1a1a1a; }
  td { font-size: 13px; color: #ccc; padding: 11px 16px; border-bottom: 1px solid #141414; }
  tr:hover td { background: #111; }
  .badge { display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 600; border-radius: 2px; }
  .badge-green { background: rgba(34,197,94,0.12); color: #4ade80; }
  .badge-red   { background: rgba(220,38,38,0.12); color: #f87171; }
  .badge-blue  { background: rgba(59,130,246,0.12); color: #60a5fa; }
  .badge-gray  { background: rgba(255,255,255,0.06); color: #888; }
  .export-bar { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; font-size: 12px; font-weight: 600;
    cursor: pointer; border: none; transition: opacity 0.15s;
    letter-spacing: 0.04em;
  }
  .btn:hover { opacity: 0.85; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-sheets { background: #1a6b3c; color: #86efac; }
  .btn-csv    { background: #1a2c6b; color: #93c5fd; }
  .btn-red    { background: #dc2626; color: #fff; }
  .btn-ghost  { background: #1e1e1e; color: #888; }
  .health-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 8px; }
  .health-healthy  { background: #22c55e; box-shadow: 0 0 8px #22c55e88; }
  .health-degraded { background: #fbbf24; box-shadow: 0 0 8px #fbbf2488; }
  .health-incident { background: #dc2626; box-shadow: 0 0 8px #dc262688; }
  .pagination { display: flex; align-items: center; gap: 10px; margin-top: 16px; }
  .pagination button { padding: 6px 14px; font-size: 12px; background: #1a1a1a; border: 1px solid #2a2a2a; color: #888; cursor: pointer; }
  .pagination button:hover:not(:disabled) { background: #222; color: #ccc; }
  .pagination button:disabled { opacity: 0.3; cursor: not-allowed; }
  .pagination span { font-size: 12px; color: #555; }
  .search-input {
    padding: 8px 14px; font-size: 13px; background: #111;
    border: 1px solid #2a2a2a; color: #f0f0f0; outline: none;
    width: 260px; margin-bottom: 16px;
  }
  .search-input:focus { border-color: #444; }
  .bar-chart { display: flex; flex-direction: column; gap: 8px; }
  .bar-row { display: flex; align-items: center; gap: 12px; }
  .bar-label { font-size: 12px; color: #888; width: 140px; truncate: true; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bar-track { flex: 1; height: 8px; background: #1a1a1a; }
  .bar-fill  { height: 100%; background: #dc2626; transition: width 0.4s; }
  .bar-val   { font-size: 12px; color: #666; width: 60px; text-align: right; }
  .spinner { width: 20px; height: 20px; border: 2px solid #2a2a2a; border-top-color: #dc2626; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .empty { text-align: center; padding: 48px 20px; color: #555; font-size: 14px; }
  .error-msg { padding: 14px 18px; background: rgba(220,38,38,0.1); border: 1px solid rgba(220,38,38,0.2); color: #f87171; font-size: 13px; margin-bottom: 16px; }
  .looker-link { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; background: #1a1a1a; border: 1px solid #2a2a2a; color: #888; font-size: 13px; text-decoration: none; margin-bottom: 20px; }
  .looker-link:hover { background: #222; color: #ccc; }
  @media (max-width: 900px) { .grid-4 { grid-template-columns: repeat(2,1fr); } .grid-3 { grid-template-columns: repeat(2,1fr); } }
`;

// ── Helpers ────────────────────────────────────────────────────────────────────

function useSection(section) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const load = useCallback((params = '') => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin-data?section=${section}${params}`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [section]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

function Loader() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>;
}

function ErrorBox({ msg }) {
  return <div className="error-msg">Failed to load data: {msg}</div>;
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`card${color ? ` card-${color}` : ''}`}>
      <div className="card-label">{label}</div>
      <div className="card-value">{value ?? '—'}</div>
      {sub && <div className="card-sub">{sub}</div>}
    </div>
  );
}

function exportCSV(rows, filename) {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const lines   = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

async function pushToSheets(sheet, setExporting) {
  setExporting(sheet);
  try {
    const r = await fetch('/api/admin-export-sheets', {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ sheet }),
    });
    const d = await r.json();
    if (!r.ok) alert(`Export failed: ${d.error}`);
    else alert('Exported to Google Sheets.');
  } catch { alert('Network error.'); }
  finally { setExporting(null); }
}

// ── Section: Overview ─────────────────────────────────────────────────────────

function OverviewSection() {
  const { data, loading, error } = useSection('overview');
  if (loading) return <Loader />;
  if (error)   return <ErrorBox msg={error} />;
  if (!data)   return null;

  const d = data;
  return (
    <>
      <div className="section-title">Revenue</div>
      <div className="grid-3">
        <StatCard label="MRR"   value={`$${d.mrr}`}   sub={`ARR: $${d.arr}`}        color="green" />
        <StatCard label="Pro Users" value={d.proUsers} sub="Paying subscribers"      color="green" />
        <StatCard label="AI Cost This Month" value={`$${d.aiCostThisMonth}`} sub={`${(d.totalTokensThisMonth / 1_000_000).toFixed(2)}M tokens`} color="red" />
      </div>
      <div className="section-title">Users</div>
      <div className="grid-4">
        <StatCard label="Total Users"   value={d.totalUsers}  />
        <StatCard label="Active 30d"    value={d.active30}    />
        <StatCard label="Active 7d"     value={d.active7}     />
        <StatCard label="Active Today"  value={d.activeToday} />
      </div>
      <div className="grid-4">
        <StatCard label="Waitlist Total"       value={d.waitlistTotal}     />
        <StatCard label="Waitlist Confirmed"   value={d.waitlistConfirmed} color="blue" />
        <StatCard label="Net Profit / Month"   value={`$${d.netProfitThisMonth}`} color={parseFloat(d.netProfitThisMonth) >= 0 ? 'green' : 'red'} />
        <StatCard label="Tokens This Month"    value={d.totalTokensThisMonth?.toLocaleString()} sub="tokens used" />
      </div>
    </>
  );
}

// ── Section: Revenue ──────────────────────────────────────────────────────────

function RevenueSection() {
  const { data, loading, error } = useSection('revenue');
  const [exporting, setExporting] = useState(null);
  if (loading) return <Loader />;
  if (error)   return <ErrorBox msg={error} />;
  if (!data)   return null;

  const d = data;
  return (
    <>
      <div className="export-bar">
        <button className="btn btn-sheets" onClick={() => pushToSheets('revenue', setExporting)} disabled={!!exporting}>
          📊 {exporting === 'revenue' ? 'Exporting…' : 'Sync to Sheets'}
        </button>
        <button className="btn btn-csv" onClick={() => exportCSV(d.history, 'revenue.csv')}>
          📥 Download CSV
        </button>
      </div>
      <div className="grid-3">
        <StatCard label="Current MRR"  value={`$${d.currentMrr}`}  color="green" />
        <StatCard label="ARR"          value={`$${d.currentArr}`}   color="green" />
        <StatCard label="Price / User" value={`$${d.pricePerUser}`} sub="per month" />
      </div>
      <div className="section-title">6-Month History</div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Month</th><th>MRR</th><th>AI Cost</th>
              <th>Net Margin</th><th>Tokens</th>
            </tr>
          </thead>
          <tbody>
            {(d.history || []).map((r) => {
              const mrr    = parseFloat(r.mrr || 0);
              const cost   = parseFloat(r.aiCost);
              const profit = mrr - cost;
              const margin = mrr > 0 ? ((profit / mrr) * 100).toFixed(1) : '—';
              return (
                <tr key={r.month}>
                  <td>{r.month}</td>
                  <td style={{ color: '#4ade80' }}>{mrr ? `$${mrr.toFixed(2)}` : '—'}</td>
                  <td style={{ color: '#f87171' }}>${cost.toFixed(4)}</td>
                  <td>{margin !== '—' ? <span className={`badge ${profit >= 0 ? 'badge-green' : 'badge-red'}`}>{margin}%</span> : '—'}</td>
                  <td style={{ color: '#555' }}>{(r.tokens / 1000).toFixed(1)}K</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Section: Users ────────────────────────────────────────────────────────────

function UsersSection() {
  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState('');
  const [query,  setQuery]  = useState('');
  const { data, loading, error, reload } = useSection('users');

  useEffect(() => {
    reload(`&page=${page}&search=${encodeURIComponent(query)}`);
  }, [page, query]);

  const submitSearch = (e) => { e.preventDefault(); setPage(1); setQuery(search); };

  if (error) return <ErrorBox msg={error} />;

  const users = data?.users || [];
  const total = data?.total || 0;
  const pages = Math.ceil(total / (data?.perPage || 25));

  return (
    <>
      <div className="export-bar">
        <button className="btn btn-sheets" onClick={() => pushToSheets('users', () => {})}>📊 Sync to Sheets</button>
      </div>
      <form onSubmit={submitSearch} style={{ marginBottom: 4 }}>
        <input
          className="search-input"
          placeholder="Search by email or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {' '}
        <button type="submit" className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}>Search</button>
      </form>
      {loading ? <Loader /> : (
        <>
          <div className="card">
            <table>
              <thead><tr><th>Email</th><th>Plan</th><th>Referrals</th><th>Tier</th><th>Joined</th></tr></thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#555', padding: 32 }}>No users found</td></tr>
                )}
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ color: '#f0f0f0', fontFamily: 'monospace', fontSize: 12 }}>{u.email}</td>
                    <td>
                      {u.is_pro
                        ? <span className="badge badge-green">Pro</span>
                        : <span className="badge badge-gray">Free</span>}
                    </td>
                    <td>{u.referral_count || 0}</td>
                    <td>{u.referral_tier > 0 ? <span className="badge badge-blue">T{u.referral_tier}</span> : '—'}</td>
                    <td style={{ color: '#555', fontSize: 12 }}>{u.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            <span>Page {page} of {pages || 1} ({total} users)</span>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>Next →</button>
          </div>
        </>
      )}
    </>
  );
}

// ── Section: Churn ────────────────────────────────────────────────────────────

function ChurnSection() {
  const { data, loading, error } = useSection('churn');
  if (loading) return <Loader />;
  if (error)   return <ErrorBox msg={error} />;
  if (!data)   return null;

  const d = data;
  return (
    <>
      <div className="grid-4">
        <StatCard label="Total Users"      value={d.totalUsers}     />
        <StatCard label="Pro Users"        value={d.proUsers}       color="green" />
        <StatCard label="Conversion Rate"  value={d.conversionRate} color={parseFloat(d.conversionRate) >= 20 ? 'green' : 'red'} />
        <StatCard label="Active (30d)"     value={d.activeUsers30d} />
      </div>
      <div className="section-title">Dormant Users — signed up 90+ days ago, inactive 30+ days, never paid</div>
      <div className="card">
        <table>
          <thead><tr><th>Email</th><th>Joined</th><th>Status</th></tr></thead>
          <tbody>
            {(d.dormantUsers || []).length === 0 && (
              <tr><td colSpan={3} className="empty">No dormant users — great retention!</td></tr>
            )}
            {(d.dormantUsers || []).map((u) => (
              <tr key={u.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{u.email}</td>
                <td style={{ color: '#555', fontSize: 12 }}>{u.created_at?.slice(0, 10)}</td>
                <td><span className="badge badge-gray">Dormant</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Section: Features ─────────────────────────────────────────────────────────

function FeaturesSection() {
  const { data, loading, error } = useSection('features');
  const [exporting, setExporting] = useState(null);
  if (loading) return <Loader />;
  if (error)   return <ErrorBox msg={error} />;
  if (!data)   return null;

  const features = data.features || [];
  const maxCalls  = Math.max(...features.map((f) => f.callsThisWeek), 1);

  return (
    <>
      <div className="export-bar">
        <button className="btn btn-sheets" onClick={() => pushToSheets('features', setExporting)} disabled={!!exporting}>
          📊 {exporting === 'features' ? 'Exporting…' : 'Sync to Sheets'}
        </button>
      </div>
      <div className="section-title">This Week vs Last Week</div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="bar-chart">
          {features.map((f) => (
            <div className="bar-row" key={f.name}>
              <div className="bar-label" title={f.name}>{f.name}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(f.callsThisWeek / maxCalls) * 100}%` }} />
              </div>
              <div className="bar-val">{f.callsThisWeek.toLocaleString()}</div>
              <div style={{ width: 60, textAlign: 'right', fontSize: 11, color: f.wowChange > 0 ? '#4ade80' : f.wowChange < 0 ? '#f87171' : '#555' }}>
                {f.wowChange != null ? `${f.wowChange > 0 ? '+' : ''}${f.wowChange}%` : '—'}
              </div>
            </div>
          ))}
          {features.length === 0 && <div className="empty">No event data yet</div>}
        </div>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Feature / Event</th><th>Calls This Week</th><th>Unique Users</th><th>Last Week</th><th>WoW</th></tr></thead>
          <tbody>
            {features.map((f) => (
              <tr key={f.name}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{f.name}</td>
                <td>{f.callsThisWeek.toLocaleString()}</td>
                <td>{f.uniqueUsers}</td>
                <td style={{ color: '#555' }}>{f.callsLastWeek}</td>
                <td>
                  {f.wowChange != null
                    ? <span className={`badge ${f.wowChange > 0 ? 'badge-green' : f.wowChange < 0 ? 'badge-red' : 'badge-gray'}`}>
                        {f.wowChange > 0 ? '+' : ''}{f.wowChange}%
                      </span>
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Section: Referrals ────────────────────────────────────────────────────────

function ReferralsSection() {
  const { data, loading, error } = useSection('referrals');
  if (loading) return <Loader />;
  if (error)   return <ErrorBox msg={error} />;
  if (!data)   return null;

  const { referrers = [], tiers = {} } = data;
  const tierColors = { bronze: '#b87333', silver: '#c0c0c0', gold: '#fbbf24', platinum: '#60a5fa' };

  return (
    <>
      {Object.keys(tiers).length > 0 && (
        <>
          <div className="section-title">Tier Distribution</div>
          <div className="grid-4" style={{ marginBottom: 24 }}>
            {Object.entries(tiers).map(([tier, count]) => (
              <div className="card" key={tier}>
                <div className="card-label">{tier}</div>
                <div className="card-value" style={{ color: tierColors[tier] || '#888' }}>{count}</div>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="section-title">Top Referrers</div>
      <div className="card">
        <table>
          <thead><tr><th>Email</th><th>Referrals</th><th>Tier</th></tr></thead>
          <tbody>
            {referrers.length === 0 && (
              <tr><td colSpan={3} className="empty">No referrals yet</td></tr>
            )}
            {referrers.map((r) => (
              <tr key={r.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.email}</td>
                <td><strong style={{ color: '#f0f0f0' }}>{r.referral_count}</strong></td>
                <td>
                  {r.referral_tier
                    ? <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: tierColors[r.referral_tier] || '#888' }}>{r.referral_tier}</span>
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Section: Waitlist ─────────────────────────────────────────────────────────

function WaitlistSection() {
  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState('');
  const [query,  setQuery]  = useState('');
  const { data, loading, error, reload } = useSection('waitlist');
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    reload(`&page=${page}&search=${encodeURIComponent(query)}`);
  }, [page, query]);

  const submitSearch = (e) => { e.preventDefault(); setPage(1); setQuery(search); };

  if (error) return <ErrorBox msg={error} />;

  const entries = data?.entries || [];
  const total   = data?.total   || 0;
  const pages   = Math.ceil(total / (data?.perPage || 50));

  return (
    <>
      <div className="export-bar">
        <button className="btn btn-sheets" onClick={() => pushToSheets('waitlist', setExporting)} disabled={!!exporting}>
          📊 {exporting === 'waitlist' ? 'Exporting…' : 'Export to Sheets'}
        </button>
        <button className="btn btn-csv" onClick={() => exportCSV(entries, 'waitlist.csv')}>
          📥 Download CSV
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <span className="badge badge-blue" style={{ marginRight: 8, padding: '4px 12px', fontSize: 13 }}>{total} total</span>
        <span className="badge badge-green" style={{ padding: '4px 12px', fontSize: 13 }}>{data?.entries?.filter((e) => e.confirmed).length || 0} confirmed on this page</span>
      </div>

      <form onSubmit={submitSearch} style={{ marginBottom: 4 }}>
        <input
          className="search-input"
          placeholder="Search by email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {' '}
        <button type="submit" className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}>Search</button>
      </form>

      {loading ? <Loader /> : (
        <>
          <div className="card">
            <table>
              <thead><tr><th>Email</th><th>Name</th><th>Confirmed</th><th>Confirmed At</th><th>Signed Up</th></tr></thead>
              <tbody>
                {entries.length === 0 && (
                  <tr><td colSpan={5} className="empty">No entries found</td></tr>
                )}
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{e.emailMasked}</td>
                    <td style={{ color: '#888' }}>{e.first_name || '—'}</td>
                    <td>
                      <span className={`badge ${e.confirmed ? 'badge-green' : 'badge-gray'}`}>
                        {e.confirmed ? 'Yes' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ color: '#555', fontSize: 12 }}>{e.confirmed_at?.slice(0, 10) || '—'}</td>
                    <td style={{ color: '#555', fontSize: 12 }}>{e.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            <span>Page {page} of {pages || 1} ({total} entries)</span>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>Next →</button>
          </div>
        </>
      )}
    </>
  );
}

// ── Section: Promo Codes ──────────────────────────────────────────────────────

function PromoCodesSection() {
  const { data, loading, error } = useSection('promo-codes');
  const [exporting, setExporting] = useState(null);
  if (loading) return <Loader />;
  if (error)   return <ErrorBox msg={error} />;
  if (!data)   return null;

  const codes = data.codes || [];

  return (
    <>
      <div className="export-bar">
        <button className="btn btn-sheets" onClick={() => pushToSheets('promo-codes', setExporting)} disabled={!!exporting}>
          📊 {exporting === 'promo-codes' ? 'Exporting…' : 'Sync to Sheets'}
        </button>
        <button className="btn btn-csv" onClick={() => exportCSV(codes, 'promo-codes.csv')}>
          📥 Download CSV
        </button>
      </div>
      {data.error && <div className="error-msg">Note: {data.error}</div>}
      <div className="card">
        <table>
          <thead><tr><th>Code</th><th>Type</th><th>Discount</th><th>Uses</th><th>Max</th><th>Active</th><th>Notes</th><th>Created</th></tr></thead>
          <tbody>
            {codes.length === 0 && (
              <tr><td colSpan={8} className="empty">No promo codes yet</td></tr>
            )}
            {codes.map((c) => (
              <tr key={c.id || c.code}>
                <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#f0f0f0' }}>{c.code}</td>
                <td><span className="badge badge-blue">{c.discount_type || '—'}</span></td>
                <td style={{ color: '#4ade80' }}>{c.discount_value != null ? `${c.discount_value}${c.discount_type === 'percent' ? '%' : '¢'}` : '—'}</td>
                <td>{c.current_uses ?? 0}</td>
                <td style={{ color: '#555' }}>{c.max_uses ?? '∞'}</td>
                <td><span className={`badge ${c.active ? 'badge-green' : 'badge-red'}`}>{c.active ? 'Yes' : 'No'}</span></td>
                <td style={{ color: '#666', fontSize: 12 }}>{c.notes || '—'}</td>
                <td style={{ color: '#555', fontSize: 12 }}>{c.created_at?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Section: Health ───────────────────────────────────────────────────────────

function HealthSection() {
  const { data, loading, error } = useSection('health');
  if (loading) return <Loader />;
  if (error)   return <ErrorBox msg={error} />;
  if (!data)   return null;

  const d = data;
  const statusLabel = { healthy: 'Healthy', degraded: 'Degraded', incident: 'Incident' };

  return (
    <>
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className={`health-dot health-${d.status}`} />
        <span style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0' }}>{statusLabel[d.status]}</span>
        <span style={{ fontSize: 12, color: '#555', marginLeft: 'auto' }}>Last checked: {new Date(d.timestamp).toLocaleTimeString()}</span>
      </div>
      <div className="grid-4">
        <StatCard label="Errors (24h)"   value={d.errorsLast24h}  color={d.errorsLast24h > 0   ? 'red' : undefined} />
        <StatCard label="Errors (1h)"    value={d.errorsLastHour} color={d.errorsLastHour > 0  ? 'red' : undefined} />
        <StatCard label="Active Sessions"  value={d.activeSessions}  />
        <StatCard label="Expired Sessions" value={d.expiredSessions} />
      </div>
      <div className="section-title">Recent Errors</div>
      <div className="card">
        <table>
          <thead><tr><th>Level</th><th>Message</th><th>Path</th><th>When</th></tr></thead>
          <tbody>
            {(d.recentErrors || []).length === 0 && (
              <tr><td colSpan={4} className="empty" style={{ color: '#4ade80' }}>No recent errors</td></tr>
            )}
            {(d.recentErrors || []).map((e, i) => (
              <tr key={i}>
                <td><span className={`badge ${e.level === 'error' ? 'badge-red' : 'badge-gray'}`}>{e.level}</span></td>
                <td style={{ fontSize: 12, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.message}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#555' }}>{e.request_path || '—'}</td>
                <td style={{ color: '#555', fontSize: 12 }}>{e.created_at?.slice(0, 19).replace('T', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Wrapped section components (inject useSection data) ───────────────────────

function WrappedFinancial()    { const s = useSection('financial');   return <FinancialSection    {...s} />; }
function WrappedGrowth()       { const s = useSection('growth');      return <GrowthSection       {...s} />; }
function WrappedUserHealth()   { const s = useSection('user-health'); return <UserHealthSection   {...s} />; }
function WrappedForecast()     { const s = useSection('forecast');    return <ForecastSection     {...s} />; }
function WrappedSupport()      { const s = useSection('support');     return <SupportSection      {...s} />; }
function WrappedSessions()     { const s = useSection('sessions');    return <SessionsSection     {...s} />; }

// ── Global alert banners ───────────────────────────────────────────────────────

function GlobalAlerts({ infra }) {
  if (!infra) return null;
  const alerts = [];

  const connPct    = infra.database?.activeConnections != null
    ? (infra.database.activeConnections / (infra.database.connectionLimit || 60)) * 100 : 0;
  const projCost   = parseFloat(infra.ai?.projectedMonthCost || 0);
  const errCount   = infra.errors?.last24Hours || 0;

  if (connPct >= 80) alerts.push({ type: 'red',   msg: '⚠️ DATABASE CONNECTIONS AT 80% — Consider upgrading Supabase to Pro' });
  if (errCount > 100) alerts.push({ type: 'red',  msg: '⚠️ HIGH ERROR RATE — ' + errCount + ' errors in last 24h. Check Infrastructure → Errors.' });
  if (projCost > 200) alerts.push({ type: 'amber', msg: '⚡ AI COSTS ELEVATED — Projected $' + projCost + '/month. Review token usage.' });

  if (!alerts.length) return null;
  return (
    <div style={{ padding: '12px 32px 0' }}>
      {alerts.map((a, i) => (
        <div key={i} style={{
          padding: '10px 16px', marginBottom: 8, fontSize: 12, fontWeight: 500,
          background: a.type === 'red' ? 'rgba(220,38,38,0.12)' : 'rgba(251,191,36,0.08)',
          border:     `1px solid ${a.type === 'red' ? 'rgba(220,38,38,0.3)' : 'rgba(251,191,36,0.25)'}`,
          color:      a.type === 'red' ? '#f87171' : '#fbbf24',
        }}>
          {a.msg}
        </div>
      ))}
    </div>
  );
}

// ── Nav config ─────────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  { label: 'Business',
    items: [
      { id: 'overview',    label: 'Overview',    icon: '◼' },
      { id: 'revenue',     label: 'Revenue',     icon: '＄' },
      { id: 'financial',   label: 'Financial',   icon: '◈' },
      { id: 'forecast',    label: 'Forecast',    icon: '▲' },
    ]
  },
  { label: 'Users',
    items: [
      { id: 'users',        label: 'Users',       icon: '⊞' },
      { id: 'churn',        label: 'Churn',       icon: '↓' },
      { id: 'user-health',  label: 'User Health', icon: '◉' },
      { id: 'growth',       label: 'Growth',      icon: '↑' },
      { id: 'referrals',    label: 'Referrals',   icon: '↗' },
    ]
  },
  { label: 'Product',
    items: [
      { id: 'features',    label: 'Features',    icon: '⚡' },
      { id: 'promo-codes', label: 'Promo Codes', icon: '✦' },
      { id: 'waitlist',    label: 'Waitlist',    icon: '☰' },
      { id: 'competition', label: 'Competition', icon: '◎' },
    ]
  },
  { label: 'System',
    items: [
      { id: 'infra',    label: 'Infrastructure', icon: '⬡' },
      { id: 'health',   label: 'Logs',           icon: '♥' },
      { id: 'support',  label: 'Support',        icon: '✉' },
      { id: 'sessions', label: 'Sessions',       icon: '⚿' },
    ]
  },
];

const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items);

const SECTION_COMPONENTS = {
  overview:    OverviewSection,
  revenue:     RevenueSection,
  users:       UsersSection,
  churn:       ChurnSection,
  'promo-codes': PromoCodesSection,
  features:    FeaturesSection,
  referrals:   ReferralsSection,
  health:      HealthSection,
  waitlist:    WaitlistSection,
  financial:   WrappedFinancial,
  growth:      WrappedGrowth,
  'user-health': WrappedUserHealth,
  forecast:    WrappedForecast,
  support:     WrappedSupport,
  sessions:    WrappedSessions,
  competition: CompetitionIntel,
  infra:       null, // rendered specially below (needs infra props)
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard({ adminEmail, onLogout }) {
  const [active, setActive] = useState('overview');

  // Infrastructure data polled at Dashboard level (for global alerts + infra section)
  const [infraData,        setInfraData]        = useState(null);
  const [infraLoading,     setInfraLoading]     = useState(true);
  const [infraLastUpdated, setInfraLastUpdated] = useState(null);

  const loadInfra = useCallback(() => {
    setInfraLoading(true);
    fetch('/api/admin-infrastructure', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setInfraData(d); setInfraLoading(false); setInfraLastUpdated(new Date()); })
      .catch(() => setInfraLoading(false));
  }, []);

  useEffect(() => {
    loadInfra();
    const interval = setInterval(loadInfra, 60000);
    return () => clearInterval(interval);
  }, [loadInfra]);

  const navTitle      = ALL_NAV.find((n) => n.id === active)?.label || active;
  const ActiveSection = SECTION_COMPONENTS[active];

  const renderSection = () => {
    if (active === 'infra') {
      return <InfrastructureSection data={infraData} loading={infraLoading} lastUpdated={infraLastUpdated} />;
    }
    if (ActiveSection) return <ActiveSection key={active} />;
    return <div style={{ padding: 32, color: '#555' }}>Section not found.</div>;
  };

  return (
    <>
      <style>{css}</style>
      <div className="admin-layout">
        {/* Sidebar */}
        <nav className="sidebar" style={{ overflowY: 'auto' }}>
          <div className="sidebar-logo">
            <svg width="22" height="16" viewBox="0 0 36 26" fill="none" style={{ display: 'block', marginBottom: 8 }}>
              <rect y="0"    width="36" height="5" rx="2.5" fill="#dc2626" />
              <rect y="10.5" width="27" height="5" rx="2.5" fill="#dc2626" />
              <rect y="21"   width="18" height="5" rx="2.5" fill="#dc2626" />
            </svg>
            <div className="sidebar-logo-text">
              COACH<span style={{ color: '#dc2626' }}>MACRO</span>
              <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.12em', marginTop: 2 }}>ADMIN</div>
            </div>
          </div>

          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div style={{ padding: '12px 20px 4px', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#333', textTransform: 'uppercase' }}>
                {group.label}
              </div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item${active === item.id ? ' active' : ''}`}
                  onClick={() => setActive(item.id)}
                >
                  <span className="icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}

          <div className="nav-spacer" />

          <div className="sidebar-footer">
            <div style={{ padding: '4px 20px 10px', fontSize: 11, color: '#444', wordBreak: 'break-all' }}>
              {adminEmail}
            </div>
            <button className="nav-item" onClick={onLogout} style={{ color: '#dc2626' }}>
              <span className="icon">⏻</span> Logout
            </button>
          </div>
        </nav>

        {/* Main */}
        <main className="main">
          <div className="topbar">
            <div className="topbar-title">{navTitle}</div>
            <div className="topbar-meta">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              {' · '}
              <a
                href="https://lookerstudio.google.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#3b82f6', textDecoration: 'none' }}
              >
                📊 Looker Studio →
              </a>
            </div>
          </div>
          <GlobalAlerts infra={infraData} />
          <div className="content">
            {renderSection()}
          </div>
        </main>
      </div>
    </>
  );
}
