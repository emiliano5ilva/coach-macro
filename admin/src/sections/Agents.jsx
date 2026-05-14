import React, { useState, useRef, useEffect } from 'react';

// ── SSE streaming helper ──────────────────────────────────────────────────────
async function streamAgent(agentId, body, onChunk, onMeta, onDone, onError) {
  try {
    const res = await fetch(`/api/admin-agents?agent=${agentId}`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify(body),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || `HTTP ${res.status}`);
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '', fullText = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split('\n\n');
      buf = parts.pop();
      for (const part of parts) {
        if (!part.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(part.slice(6));
          if (data.error) throw new Error(data.error);
          if (data.meta)  onMeta(data.meta);
          if (data.text)  { fullText += data.text; onChunk(fullText); }
        } catch (e) { if (e.message !== 'Unexpected end of JSON input') throw e; }
      }
    }
    onDone(fullText);
  } catch (err) {
    onError(err.message);
  }
}

// ── Auto-scrolling text box ───────────────────────────────────────────────────
function StreamBox({ text, isStreaming, isError }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && isStreaming) ref.current.scrollTop = ref.current.scrollHeight;
  }, [text, isStreaming]);

  return (
    <div ref={ref} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px', maxHeight: 320, overflowY: 'auto' }}>
      <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: isError ? '#f87171' : '#c8c8c8', lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {text}
        {isStreaming && <span style={{ display: 'inline-block', width: 2, height: 13, background: '#dc2626', marginLeft: 2, verticalAlign: 'middle', animation: 'blink 1s infinite' }} />}
      </pre>
    </div>
  );
}

// ── Meta chips ────────────────────────────────────────────────────────────────
function MetaChips({ agentId, meta }) {
  if (!meta) return null;

  const chip = (label, value, color) => (
    <div key={label} style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 11 }}>
      <span style={{ color: '#555', marginRight: 5 }}>{label}</span>
      <span style={{ color, fontWeight: 700 }}>{value}</span>
    </div>
  );

  if (agentId === 'ceo') return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {chip('MRR',    `$${meta.mrr}`,             '#22c55e')}
        {chip('Users',  meta.totalUsers,             '#60a5fa')}
        {chip('Pro',    meta.proUsers,               '#a78bfa')}
        {chip('Churn',  meta.churnedThisMonth,       '#f87171')}
        {chip('AI $',   `$${meta.aiCostThisMonth}`,  '#f59e0b')}
        {chip('Profit', `$${meta.netProfit}`,        parseFloat(meta.netProfit) >= 0 ? '#22c55e' : '#f87171')}
        {chip('Errors', meta.errorsLast24h,          meta.errorsLast24h > 0 ? '#f87171' : '#555')}
      </div>
    </>
  );

  if (agentId === 'churn') return (
    <div style={{ padding: '9px 14px', background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: 12, marginBottom: 14 }}>
      ⚠️ {meta.atRiskCount} at-risk Pro users · ${(meta.revenueAtRisk || 0).toFixed(2)}/month at risk · {meta.totalPro} total Pro
    </div>
  );

  if (agentId === 'financial') return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
      {chip('MRR',     `$${meta.mrr}`,    '#22c55e')}
      {chip('AI Cost', `$${meta.aiCost}`, '#f87171')}
      {chip('Margin',  `${meta.margin}%`, parseFloat(meta.margin) > 50 ? '#22c55e' : '#f59e0b')}
      {chip('$/User',  `$${meta.costPerUser}`, '#60a5fa')}
      {chip('Profit',  `$${meta.netProfit}`,   parseFloat(meta.netProfit) >= 0 ? '#22c55e' : '#f87171')}
    </div>
  );

  if (agentId === 'growth') return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
      {chip('Signups',   meta.newSignups30days,     '#60a5fa')}
      {chip('Converted', meta.convertedToPro,       '#22c55e')}
      {chip('Conv %',    `${meta.conversionRate}%`, '#f59e0b')}
      {chip('Referrals', meta.referralSignups,      '#a78bfa')}
    </div>
  );

  return null;
}

// ── Action buttons shown after response ──────────────────────────────────────
function AgentActions({ agentId, text }) {
  const [copied, setCopied] = useState(false);

  const copyBtn = (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', color: copied ? '#22c55e' : '#666', cursor: 'pointer' }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );

  if (agentId === 'churn') {
    const subj = encodeURIComponent('We miss you — come back to Coach Macro');
    const body = encodeURIComponent('Hi there,\n\nWe noticed you haven\'t been using Coach Macro lately. Your fitness goals are still within reach — and we\'ve got new features to help you crush them.\n\nCome back today, your progress is waiting.\n\n— Coach Macro Team');
    return (
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        {copyBtn}
        <a href={`mailto:?subject=${subj}&body=${body}`} style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', cursor: 'pointer', textDecoration: 'none' }}>
          📧 Send Re-engagement Emails →
        </a>
      </div>
    );
  }

  if (agentId === 'content') return (
    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
      {copyBtn}
      <a href="https://app.higgsfield.ai" target="_blank" rel="noopener noreferrer" style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', textDecoration: 'none' }}>
        🎬 Open Higgsfield →
      </a>
    </div>
  );

  return <div style={{ marginTop: 14 }}>{copyBtn}</div>;
}

// ── Agent card config ─────────────────────────────────────────────────────────
const AGENTS = [
  { id: 'ceo',       icon: '👔', name: 'CEO Weekly Brief',  desc: 'Full business analysis with recommendations based on live data',                       btn: 'Get This Week\'s Brief' },
  { id: 'churn',     icon: '🚨', name: 'Churn Prevention',  desc: 'Identifies at-risk Pro users and generates re-engagement campaigns',                   btn: 'Analyze At-Risk Users' },
  { id: 'financial', icon: '💰', name: 'Financial Advisor', desc: 'Reviews costs, margins, and revenue with specific recommendations',                    btn: 'Review Financials' },
  { id: 'growth',    icon: '📈', name: 'Growth Advisor',    desc: 'Analyzes what\'s driving growth and where to double down',                             btn: 'Get Growth Report' },
  { id: 'content',   icon: '🎬', name: 'Content Agent',     desc: 'Upload competitor screenshots to generate Coach Macro content ideas + Higgsfield prompts', btn: 'Analyze & Generate', isContent: true },
];

const fresh = () => ({ status: 'idle', text: '', meta: null, lastRun: null });

// ── Main component ────────────────────────────────────────────────────────────
export default function AgentsSection() {
  const [states,   setStates]   = useState(() => Object.fromEntries(AGENTS.map(a => [a.id, fresh()])));
  const [images,   setImages]   = useState([]);   // [{ preview, b64 }]
  const [username, setUsername] = useState('');
  const [drag,     setDrag]     = useState(false);
  const fileRef = useRef();

  const update = (id, patch) =>
    setStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const run = (id, body = {}) => {
    update(id, { status: 'streaming', text: '', meta: null });
    streamAgent(
      id, body,
      (text) => update(id, { text }),
      (meta) => update(id, { meta }),
      (text) => update(id, { status: 'done', text, lastRun: new Date() }),
      (err)  => update(id, { status: 'error', text: err }),
    );
  };

  const handleFiles = (files) => {
    Array.from(files).filter(f => f.type.startsWith('image/')).forEach(f => {
      const reader = new FileReader();
      reader.onload = e => {
        const b64 = e.target.result.split(',')[1];
        setImages(prev => [...prev, { preview: e.target.result, b64 }]);
      };
      reader.readAsDataURL(f);
    });
  };

  return (
    <>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin   { to { transform: rotate(360deg); } }
        .agent-run-btn:hover { background: rgba(220,38,38,0.22) !important; }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: 16 }}>
        {AGENTS.map(agent => {
          const s          = states[agent.id];
          const isRunning  = s.status === 'streaming';
          const hasOutput  = isRunning || s.status === 'done' || s.status === 'error';
          const canRun     = !isRunning && !(agent.isContent && images.length === 0);

          return (
            <div key={agent.id} style={{ background: '#111', border: '1px solid #1e1e1e', padding: '22px 20px' }}>

              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{agent.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0', marginBottom: 4 }}>{agent.name}</div>
                    <div style={{ fontSize: 12, color: '#555', lineHeight: 1.55 }}>{agent.desc}</div>
                  </div>
                </div>
                {s.lastRun && (
                  <div style={{ fontSize: 10, color: '#3a3a3a', flexShrink: 0, marginLeft: 8 }}>
                    {s.lastRun.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>

              {/* Content agent: image upload area */}
              {agent.isContent && (
                <div style={{ marginBottom: 14 }}>
                  <input
                    type="text"
                    placeholder="Competitor @username (optional)"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 12, background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#ccc', outline: 'none', borderRadius: 0, marginBottom: 10, boxSizing: 'border-box' }}
                  />
                  <div
                    onDragOver={e => { e.preventDefault(); setDrag(true); }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
                    onClick={() => fileRef.current?.click()}
                    style={{ border: `1px dashed ${drag ? '#dc2626' : '#282828'}`, padding: 16, textAlign: 'center', cursor: 'pointer', background: drag ? 'rgba(220,38,38,0.04)' : 'transparent', transition: 'all 0.15s', minHeight: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}
                  >
                    <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
                    {images.length === 0 ? (
                      <span style={{ fontSize: 12, color: '#3a3a3a' }}>Drop competitor screenshots here or click to upload</span>
                    ) : (
                      images.map((img, i) => (
                        <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                          <img src={img.preview} alt="" style={{ width: 56, height: 56, objectFit: 'cover', border: '1px solid #2a2a2a', display: 'block' }} />
                          <button
                            onClick={e => { e.stopPropagation(); setImages(prev => prev.filter((_, j) => j !== i)); }}
                            style={{ position: 'absolute', top: -5, right: -5, width: 15, height: 15, background: '#dc2626', border: 'none', color: '#fff', fontSize: 8, cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                          >✕</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Run / loading button row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: hasOutput ? 14 : 0 }}>
                {!isRunning && (
                  <button
                    className="agent-run-btn"
                    disabled={!canRun}
                    onClick={() => {
                      if (agent.isContent) run(agent.id, { competitorImages: images.map(i => i.b64), competitorUsername: username });
                      else run(agent.id);
                    }}
                    style={{
                      padding: '8px 16px', fontSize: 13, fontWeight: 600,
                      background:   canRun ? 'rgba(220,38,38,0.13)' : '#141414',
                      border:       `1px solid ${canRun ? 'rgba(220,38,38,0.35)' : '#1e1e1e'}`,
                      color:        canRun ? '#f87171' : '#3a3a3a',
                      cursor:       canRun ? 'pointer' : 'not-allowed',
                      transition:   'background 0.15s',
                    }}
                  >
                    {s.status === 'done' || s.status === 'error' ? '↺ Run Again' : `${agent.btn} →`}
                  </button>
                )}
                {isRunning && (
                  <>
                    <div style={{ width: 14, height: 14, border: '2px solid #2a2a2a', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#444' }}>Agent is thinking…</span>
                  </>
                )}
              </div>

              {/* Meta chips */}
              {hasOutput && <MetaChips agentId={agent.id} meta={s.meta} />}

              {/* Streaming output */}
              {hasOutput && (
                <StreamBox text={s.text} isStreaming={isRunning} isError={s.status === 'error'} />
              )}

              {/* Post-response action buttons */}
              {s.status === 'done' && (
                <AgentActions agentId={agent.id} text={s.text} />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
