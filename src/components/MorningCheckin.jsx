import React, { useState } from 'react';
import { sb } from '../client.js';
import InteractiveBodyMap from './InteractiveBodyMap.jsx';
import { processDomsMorningCheckin } from '../services/domsLearningService.js';
import { processCycleMorningCheckin } from '../services/cyclePatternService.js';

const READINESS = [
  { key: 'great', emoji: '😁', label: 'Great'  },
  { key: 'good',  emoji: '🙂', label: 'Good'   },
  { key: 'okay',  emoji: '😐', label: 'Okay'   },
  { key: 'tired', emoji: '😓', label: 'Tired'  },
  { key: 'rough', emoji: '💀', label: 'Rough'  },
];

export default function MorningCheckin({ userId, onComplete, onSkip, profile, workoutLogs }) {
  const [readiness, setReadiness]       = useState(null);
  const [soreness, setSoreness]         = useState(0);
  const [primaryZones, setPrimaryZones] = useState([]);
  const [secondaryZones, setSecondaryZones] = useState([]);
  const [saving, setSaving]             = useState(false);

  function handleMapChange(primary, secondary) {
    setPrimaryZones(primary);
    setSecondaryZones(secondary);
  }

  async function handleSubmit() {
    if (!readiness) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const row = {
        user_id:            userId,
        date:               today,
        overall_soreness:   soreness,
        primary_soreness:   primaryZones,
        secondary_soreness: secondaryZones,
        readiness,
      };
      const { error } = await sb.from('morning_checkins').upsert(row, { onConflict: 'user_id,date' });
      if (error) console.error('[MorningCheckin] save error:', error.message);
      // DOMS + cycle learning — fire-and-forget, never blocks the UI
      processDomsMorningCheckin(userId, row, workoutLogs ?? [], profile).catch(() => {});
      processCycleMorningCheckin(userId, row, profile).catch(() => {});
      onComplete?.(row);
    } catch (e) {
      console.error('[MorningCheckin] error:', e);
      onComplete?.(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    // Record a null check-in (just readiness=null) so we don't re-prompt
    try {
      const today = new Date().toISOString().split('T')[0];
      await sb.from('morning_checkins').upsert(
        { user_id: userId, date: today, readiness: null },
        { onConflict: 'user_id,date' }
      );
    } catch {}
    onSkip?.();
  }

  const canSubmit = !!readiness && !saving;

  return (
    <div style={{
      background: '#0d0d0d',
      border: '1px solid rgba(245,245,240,0.09)',
      borderLeft: '3px solid #FF3B30',
      borderRadius: '4px 14px 14px 4px',
      padding: '20px 18px 16px',
      marginBottom: 12,
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{
        fontFamily: "'Barlow Condensed',sans-serif",
        fontWeight: 900, fontStyle: 'italic',
        fontSize: 26, color: '#f5f5f0',
        textTransform: 'uppercase', lineHeight: 1.05,
        marginBottom: 18,
      }}>
        How's your body<br /><span style={{ color: '#FF3B30' }}>today?</span>
      </div>

      {/* Readiness row */}
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(245,245,240,0.45)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
        // Readiness
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
        {READINESS.map(r => (
          <button
            key={r.key}
            onClick={() => setReadiness(r.key)}
            style={{
              flex: 1, padding: '10px 4px',
              background: readiness === r.key ? 'rgba(255,59,48,0.10)' : 'rgba(245,245,240,0.03)',
              border: `1.5px solid ${readiness === r.key ? '#FF3B30' : 'rgba(245,245,240,0.12)'}`,
              borderRadius: 10, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 20 }}>{r.emoji}</span>
            <span style={{
              fontFamily: "'DM Mono',monospace", fontSize: 9,
              color: readiness === r.key ? '#FF3B30' : 'rgba(245,245,240,0.5)',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>{r.label}</span>
          </button>
        ))}
      </div>

      {/* Soreness slider */}
      <div style={{ marginBottom: soreness > 0 ? 20 : 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(245,245,240,0.45)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            // Overall soreness
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20, color: soreness === 0 ? 'rgba(245,245,240,0.35)' : soreness >= 7 ? '#FF3B30' : soreness >= 4 ? '#FF8C00' : '#34C759' }}>
            {soreness}<span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(245,245,240,0.3)' }}>/10</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(245,245,240,0.3)' }}>0</span>
          <input
            type="range" min={0} max={10} step={1} value={soreness}
            onChange={e => setSoreness(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#FF3B30', cursor: 'pointer' }}
          />
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(245,245,240,0.3)' }}>10</span>
        </div>
      </div>

      {/* Soreness map — only when slider > 0 */}
      {soreness > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(245,245,240,0.45)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
            // Where are you feeling it?
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'rgba(245,245,240,0.35)', marginBottom: 12 }}>
            Tap once = mild &nbsp;·&nbsp; Tap twice = sore
          </div>
          <InteractiveBodyMap onChange={handleMapChange} />
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: '100%', padding: '14px 0',
          background: canSubmit ? '#FF3B30' : 'rgba(255,255,255,0.06)',
          color: canSubmit ? '#fff' : 'rgba(245,245,240,0.25)',
          border: 'none', borderRadius: 12, cursor: canSubmit ? 'pointer' : 'not-allowed',
          fontFamily: "'Barlow Condensed',sans-serif",
          fontWeight: 900, fontStyle: 'italic',
          fontSize: 18, letterSpacing: '0.05em',
          textTransform: 'uppercase', marginBottom: 10,
          transition: 'background 0.15s',
        }}
      >
        {saving ? 'Saving…' : 'Log check-in →'}
      </button>

      {/* Skip */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleSkip}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'DM Mono',monospace", fontSize: 11,
            color: 'rgba(245,245,240,0.35)', letterSpacing: '0.08em',
            textTransform: 'uppercase', padding: 0,
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
