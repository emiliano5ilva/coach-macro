import React, { useState, useEffect, useRef } from 'react';

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'Facebook'];

// ── Helpers ────────────────────────────────────────────────────────────────────

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = () => res(reader.result.split(',')[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function Btn({ onClick, children, style, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none', opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s', ...style,
      }}
    >
      {children}
    </button>
  );
}

function Tag({ color = '#1e1e1e', textColor = '#888', children }) {
  return <span style={{ padding: '2px 8px', background: color, color: textColor, fontSize: 11, fontWeight: 600, marginRight: 6, borderRadius: 2 }}>{children}</span>;
}

// ── Sub-sections ───────────────────────────────────────────────────────────────

function CompetitorsList({ competitors, onRemove }) {
  if (!competitors.length) {
    return <div style={{ padding: 24, color: '#555', fontSize: 13 }}>No competitors tracked yet.</div>;
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        {competitors.map((c) => (
          <tr key={c.id} style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '10px 16px', fontWeight: 600, color: '#f0f0f0', fontSize: 13 }}>{c.username}</td>
            <td style={{ padding: '10px 16px' }}>
              <Tag color="rgba(59,130,246,0.12)" textColor="#60a5fa">{c.platform}</Tag>
            </td>
            <td style={{ padding: '10px 16px', fontSize: 12, color: '#666' }}>{c.notes || '—'}</td>
            <td style={{ padding: '10px 16px' }}>
              <Btn onClick={() => onRemove(c.id)} style={{ background: 'rgba(220,38,38,0.1)', color: '#f87171', fontSize: 11 }}>Remove</Btn>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AnalysisResult({ result, onSaveToCalendar }) {
  const [copied, setCopied] = useState(null);

  const copy = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  if (!result?.ideas?.length) {
    return <div style={{ padding: 24, color: '#555' }}>No ideas generated.</div>;
  }

  return (
    <div>
      {/* Competitor analysis summary */}
      {result.analysis && (
        <div style={{ background: '#0e1a0e', border: '1px solid #1a2a1a', padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', letterSpacing: '0.07em', marginBottom: 10 }}>COMPETITOR ANALYSIS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {Object.entries(result.analysis).map(([k, v]) => (
              <div key={k}>
                <span style={{ fontSize: 11, color: '#555', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}: </span>
                <span style={{ fontSize: 12, color: '#ccc' }}>{Array.isArray(v) ? v.join(', ') : v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content ideas */}
      <div style={{ fontSize: 11, fontWeight: 600, color: '#555', letterSpacing: '0.07em', marginBottom: 12 }}>
        COACH MACRO CONTENT OPPORTUNITIES
      </div>
      {result.ideas.map((idea, i) => (
        <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', padding: '20px 22px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0', marginBottom: 4 }}>
                IDEA {i + 1}: {idea.title || idea.concept}
              </div>
              {idea.content_type && <Tag color="rgba(59,130,246,0.12)" textColor="#60a5fa">{idea.content_type}</Tag>}
              {idea.best_time && <Tag>{idea.best_time}</Tag>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {idea.hook && (
              <div>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>HOOK (first 3s)</div>
                <div style={{ fontSize: 13, color: '#e0e0e0', lineHeight: 1.5, background: '#0a0a0a', padding: '10px 12px', borderLeft: '2px solid #dc2626' }}>
                  {idea.hook}
                </div>
              </div>
            )}
            {idea.caption && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#555' }}>CAPTION</span>
                  <Btn onClick={() => copy(idea.caption, `cap-${i}`)} style={{ background: '#1a1a1a', color: '#888', padding: '4px 10px', fontSize: 10 }}>
                    {copied === `cap-${i}` ? '✓ Copied' : '📋 Copy'}
                  </Btn>
                </div>
                <div style={{ fontSize: 12, color: '#ccc', lineHeight: 1.6, background: '#0a0a0a', padding: '10px 12px', maxHeight: 120, overflow: 'auto' }}>
                  {idea.caption}
                </div>
              </div>
            )}
          </div>

          {idea.higgsfield_prompt && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#555' }}>HIGGSFIELD VIDEO PROMPT</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn
                    onClick={() => copy(idea.higgsfield_prompt, `hf-${i}`)}
                    style={{ background: '#1a1a1a', color: '#888', padding: '4px 10px', fontSize: 10 }}
                  >
                    {copied === `hf-${i}` ? '✓ Copied' : '📋 Copy Prompt'}
                  </Btn>
                  <Btn
                    onClick={() => window.open(`https://app.higgsfield.ai/create?prompt=${encodeURIComponent(idea.higgsfield_prompt)}`, '_blank')}
                    style={{ background: '#1a1040', color: '#a78bfa', padding: '4px 10px', fontSize: 10 }}
                  >
                    🎬 Open in Higgsfield
                  </Btn>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#a78bfa', background: '#0e0a1a', padding: '10px 12px', borderLeft: '2px solid #7c3aed', lineHeight: 1.5 }}>
                {idea.higgsfield_prompt}
              </div>
            </div>
          )}

          {idea.hashtags && (
            <div style={{ marginTop: 12, fontSize: 11, color: '#555' }}>
              {(Array.isArray(idea.hashtags) ? idea.hashtags : [idea.hashtags]).map((h) => (
                <span key={h} style={{ color: '#60a5fa', marginRight: 8 }}>{h}</span>
              ))}
            </div>
          )}

          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <Btn
              onClick={() => onSaveToCalendar(idea)}
              style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', fontSize: 11 }}
            >
              💾 Save to Calendar
            </Btn>
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentCalendar({ entries, onStatusChange }) {
  const statuses = ['idea', 'scheduled', 'posted', 'archived'];
  const statusColors = {
    idea: { bg: 'rgba(96,165,250,0.12)', text: '#60a5fa' },
    scheduled: { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24' },
    posted: { bg: 'rgba(34,197,94,0.12)', text: '#4ade80' },
    archived: { bg: 'rgba(255,255,255,0.06)', text: '#555' },
  };

  if (!entries.length) {
    return <div style={{ padding: 24, color: '#555', fontSize: 13 }}>No content saved yet. Analyze competitor content and save ideas here.</div>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {['Title', 'Type', 'Platform', 'Scheduled', 'Status', ''].map((h) => (
            <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #1a1a1a' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => {
          const sc = statusColors[e.status] || statusColors.idea;
          return (
            <tr key={e.id} style={{ borderBottom: '1px solid #141414' }}>
              <td style={{ padding: '10px 16px', color: '#f0f0f0', fontSize: 13, fontWeight: 500 }}>{e.title}</td>
              <td style={{ padding: '10px 16px', fontSize: 12, color: '#888' }}>{e.content_type || '—'}</td>
              <td style={{ padding: '10px 16px' }}><Tag>{e.platform || 'instagram'}</Tag></td>
              <td style={{ padding: '10px 16px', fontSize: 12, color: '#555' }}>{e.scheduled_date || '—'}</td>
              <td style={{ padding: '10px 16px' }}>
                <span style={{ padding: '2px 8px', background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 600, borderRadius: 2 }}>{e.status}</span>
              </td>
              <td style={{ padding: '10px 16px' }}>
                {e.status !== 'posted' && (
                  <Btn
                    onClick={() => onStatusChange(e.id, 'posted')}
                    style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', fontSize: 10, padding: '4px 10px' }}
                  >
                    Mark Posted
                  </Btn>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CompetitionIntel() {
  const [tab, setTab] = useState('analyze'); // analyze | calendar | competitors

  // Competitors state
  const [competitors, setCompetitors] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPlatform, setNewPlatform] = useState('Instagram');
  const [newNotes, setNewNotes]       = useState('');
  const [addingComp, setAddingComp]   = useState(false);

  // Analysis state
  const [images, setImages]     = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError]   = useState('');
  const fileInputRef = useRef(null);

  // Content calendar state
  const [calendarEntries, setCalendarEntries] = useState([]);

  // Load on mount
  useEffect(() => {
    loadCompetitors();
    loadCalendar();
  }, []);

  const loadCompetitors = async () => {
    const res = await fetch('/api/admin-competition?action=competitors', { credentials: 'include' });
    const { data } = await res.json();
    setCompetitors(data || []);
  };

  const loadCalendar = async () => {
    const res = await fetch('/api/admin-competition?action=calendar', { credentials: 'include' });
    const { data } = await res.json();
    setCalendarEntries(data || []);
  };

  const addCompetitor = async () => {
    if (!newUsername.trim()) return;
    setAddingComp(true);
    await fetch('/api/admin-competition', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_competitor', username: newUsername.trim(), platform: newPlatform, notes: newNotes.trim() || null }),
    });
    setNewUsername(''); setNewNotes('');
    await loadCompetitors();
    setAddingComp(false);
  };

  const removeCompetitor = async (id) => {
    await fetch('/api/admin-competition', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_competitor', id }),
    });
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
  };

  const handleFiles = async (files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 10);
    const b64s  = await Promise.all(valid.map(fileToBase64));
    setImages(b64s.map((data, i) => ({ data, mediaType: valid[i].type, name: valid[i].name })));
  };

  const analyzeContent = async () => {
    if (!images.length) return;
    setAnalyzing(true);
    setAnalysisError('');
    setAnalysisResult(null);

    const content = [
      ...images.map((img) => ({
        type: 'image',
        source: { type: 'base64', media_type: img.mediaType, data: img.data },
      })),
      {
        type: 'text',
        text: `Analyze these competitor fitness app social media posts/screenshots.

Return ONLY valid JSON in this exact structure:
{
  "analysis": {
    "content_type": "educational | demo | testimonial | comparison | lifestyle",
    "hook_strategy": "description of their hook technique",
    "effectiveness": "high | medium | low",
    "key_themes": ["theme1", "theme2"],
    "target_audience": "description"
  },
  "ideas": [
    {
      "title": "Short idea name",
      "concept": "What the content is about",
      "content_type": "educational | demo | testimonial | comparison | lifestyle",
      "hook": "First 3 seconds / opening line",
      "caption": "Full caption copy with emojis and CTAs",
      "higgsfield_prompt": "Detailed video generation prompt for Higgsfield AI",
      "best_time": "Day and time to post",
      "hashtags": ["#macro", "#nutrition", "#fitness"]
    }
  ]
}

Coach Macro brand context: AI-powered fitness app, dynamic macros that adapt to training, unified food + lifting tracker, real-time TDEE, restaurant AI scanner. Brand voice: direct, science-backed, no fluff.

Generate 3 content ideas.`,
      },
    ];

    try {
      const res = await fetch('/api/admin-claude', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ messages: [{ role: 'user', content }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API error');

      const text = data.content?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      const parsed = JSON.parse(jsonMatch[0]);
      setAnalysisResult(parsed);
    } catch (err) {
      setAnalysisError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const saveToCalendar = async (idea) => {
    await fetch('/api/admin-competition', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action:            'add_calendar',
        title:             idea.title || idea.concept,
        content_type:      idea.content_type,
        caption:           idea.caption,
        higgsfield_prompt: idea.higgsfield_prompt,
        platform:          'instagram',
        status:            'idea',
      }),
    });
    await loadCalendar();
    setTab('calendar');
  };

  const updateCalendarStatus = async (id, status) => {
    await fetch('/api/admin-competition', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_calendar_status', id, status }),
    });
    await loadCalendar();
  };

  const S = {
    sectionTitle: { fontWeight: 700, fontSize: 12, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 },
    card: { background: '#111', border: '1px solid #1e1e1e', padding: '20px 24px', marginBottom: 16 },
    input: { padding: '9px 12px', background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#f0f0f0', fontSize: 13, outline: 'none' },
  };

  return (
    <>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1a1a1a', marginBottom: 24 }}>
        {[
          { id: 'analyze',     label: 'Analyze Content' },
          { id: 'calendar',    label: `Calendar (${calendarEntries.length})` },
          { id: 'competitors', label: `Competitors (${competitors.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 20px', fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? '#f0f0f0' : '#555',
              background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #dc2626' : '2px solid transparent',
              cursor: 'pointer', marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ANALYZE TAB ── */}
      {tab === 'analyze' && (
        <>
          <div style={S.sectionTitle}>Upload Competitor Content</div>
          <div style={S.card}>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              style={{
                border: '1px dashed #333', padding: '32px 20px', textAlign: 'center',
                cursor: 'pointer', color: '#555', fontSize: 13, marginBottom: 16,
                transition: 'border-color 0.15s',
              }}
            >
              Drop competitor post screenshots here or click to select
              <div style={{ fontSize: 11, marginTop: 6, color: '#444' }}>Supports JPEG, PNG · Up to 10 images</div>
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFiles(e.target.files)} />

            {images.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {images.map((img, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={`data:${img.mediaType};base64,${img.data}`} alt={img.name} style={{ width: 80, height: 80, objectFit: 'cover', border: '1px solid #2a2a2a' }} />
                      <button onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10 }}>
                  <Btn
                    onClick={analyzeContent}
                    disabled={analyzing}
                    style={{ background: '#dc2626', color: '#fff', padding: '10px 20px', fontSize: 13 }}
                  >
                    {analyzing ? 'Analyzing with Claude…' : `Analyze ${images.length} Image${images.length > 1 ? 's' : ''}`}
                  </Btn>
                </div>
              </div>
            )}

            {analyzing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888', fontSize: 13, padding: '8px 0' }}>
                <div style={{ width: 16, height: 16, border: '2px solid #333', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Claude is analyzing competitor content and generating ideas…
              </div>
            )}

            {analysisError && (
              <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#f87171', fontSize: 13 }}>
                {analysisError}
              </div>
            )}
          </div>

          {analysisResult && (
            <>
              <div style={S.sectionTitle}>Analysis Results</div>
              <AnalysisResult result={analysisResult} onSaveToCalendar={saveToCalendar} />
            </>
          )}
        </>
      )}

      {/* ── CALENDAR TAB ── */}
      {tab === 'calendar' && (
        <>
          <div style={S.sectionTitle}>Content Calendar</div>
          <div style={{ background: '#111', border: '1px solid #1e1e1e' }}>
            <ContentCalendar entries={calendarEntries} onStatusChange={updateCalendarStatus} />
          </div>
        </>
      )}

      {/* ── COMPETITORS TAB ── */}
      {tab === 'competitors' && (
        <>
          <div style={S.sectionTitle}>Track Competitors</div>
          <div style={S.card}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              <input
                style={{ ...S.input, width: 200 }}
                placeholder="@username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
              />
              <select
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                style={{ ...S.input, width: 140 }}
              >
                {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
              </select>
              <input
                style={{ ...S.input, flex: 1, minWidth: 180 }}
                placeholder="Notes (optional)"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
              <Btn
                onClick={addCompetitor}
                disabled={addingComp || !newUsername.trim()}
                style={{ background: '#dc2626', color: '#fff', padding: '9px 18px', fontSize: 13 }}
              >
                + Add
              </Btn>
            </div>
          </div>

          <div style={{ background: '#111', border: '1px solid #1e1e1e' }}>
            <CompetitorsList competitors={competitors} onRemove={removeCompetitor} />
          </div>
        </>
      )}
    </>
  );
}
