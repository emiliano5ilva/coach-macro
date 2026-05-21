import { getWarmupProtocol } from '../data/warmups.js';

const TYPE_COLOR = {
  mobility: '#60a5fa',
  activation: '#FEA020',
  ramp: '#22c55e',
};

const TYPE_LABEL = {
  mobility: 'MOBILITY',
  activation: 'ACTIVATION',
  ramp: 'RAMP UP',
};

const SESSION_LABEL = {
  push: 'PUSH SESSION',
  pull: 'PULL SESSION',
  legs: 'LEG SESSION',
  upper: 'UPPER BODY SESSION',
  lower: 'LOWER BODY SESSION',
  run: 'RUN SESSION',
  hyrox: 'HYROX SESSION',
};

const MOBILITY_FOR_MUSCLE = {
  'Quads':      { name:'Quad Stretch',                  sets:1, reps:'40 sec each', notes:'Pull heel to glute — hold and breathe through it', type:'mobility' },
  'Hamstrings': { name:'Standing Hamstring Stretch',    sets:1, reps:'40 sec each', notes:'Hinge forward, soft knee — feel the pull not the pain', type:'mobility' },
  'Glutes':     { name:'Pigeon Stretch',                sets:1, reps:'40 sec each', notes:'Hip opens fully — breathe into the tight spots', type:'mobility' },
  'Calves':     { name:'Calf Stretch',                  sets:1, reps:'30 sec each', notes:'Straight leg then bent leg — hits both calf muscles', type:'mobility' },
  'Chest':      { name:'Doorframe Chest Stretch',       sets:1, reps:'30 sec each', notes:'Elbow at 90 degrees — rotate away slowly', type:'mobility' },
  'Back':       { name:'Cat-Cow Stretch',               sets:2, reps:'10',          notes:'Slow and controlled — full range each direction', type:'mobility' },
  'Shoulders':  { name:'Cross-Body Shoulder Stretch',   sets:1, reps:'30 sec each', notes:'Pull across chest — keep shoulder down', type:'mobility' },
  'Arms':       { name:'Bicep Wall Stretch',            sets:1, reps:'30 sec each', notes:'Palm on wall, rotate away — feel the bicep lengthen', type:'mobility' },
  'Core':       { name:'Cobra Stretch',                 sets:2, reps:'20 sec',      notes:'Press up slowly — decompress the spine', type:'mobility' },
};

export default function WarmupScreen({ sessionType = 'push', skillLevel = 'beginner', soreness = null, onStart, onSkip }) {
  const protocol = getWarmupProtocol(sessionType, skillLevel);
  const baseExercises = Array.isArray(protocol) ? protocol : (protocol?.exercises || []);
  const sessionLabel = SESSION_LABEL[sessionType] || `${sessionType.toUpperCase()} SESSION`;

  const mobilityAddons = (soreness?.soreness_score >= 4)
    ? (soreness.sore_muscles || []).map(m => MOBILITY_FOR_MUSCLE[m]).filter(Boolean)
    : [];
  const exercises = [...mobilityAddons, ...baseExercises];
  const sorenessNote = mobilityAddons.length > 0
    ? `Soreness detected in ${soreness.sore_muscles.join(', ')}. Extra mobility added.`
    : null;

  const totalMins = exercises.reduce((sum, ex) => {
    const s = parseInt(ex.sets || 1);
    const r = parseInt(ex.reps || 10);
    const isTime = String(ex.reps || '').toLowerCase().includes('s') || String(ex.reps || '').toLowerCase().includes('min');
    return sum + (isTime ? s * 0.5 : s * r * 0.04);
  }, 0);
  const durationMins = Math.max(5, Math.round(totalMins));

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9000,
      background: '#000000',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      fontFamily: "'Barlow Condensed', sans-serif",
    }}>
      {/* Header */}
      <div style={{ padding: 'max(env(safe-area-inset-top),48px) 24px 0' }}>
        <div style={{
          fontSize: 11,
          letterSpacing: '0.2em',
          color: '#e8341c',
          fontFamily: "'DM Mono', monospace",
          marginBottom: 8,
        }}>
          // WARM-UP
        </div>
        <div style={{
          fontSize: 36,
          fontWeight: 900,
          fontStyle: 'italic',
          color: '#f5f5f0',
          lineHeight: 1,
          textTransform: 'uppercase',
          marginBottom: 14,
        }}>
          BEFORE {sessionLabel}<span style={{ color: '#e8341c' }}>.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{
            background: 'rgba(232,52,28,0.12)',
            border: '1px solid rgba(232,52,28,0.3)',
            color: '#e8341c',
            borderRadius: 20,
            padding: '3px 12px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            fontFamily: "'DM Mono', monospace",
          }}>
            ~{durationMins} MIN
          </span>
          <span style={{
            fontSize: 11,
            color: 'rgba(245,245,240,0.45)',
            letterSpacing: '0.1em',
            fontFamily: "'DM Mono', monospace",
          }}>
            {exercises.length} EXERCISES
          </span>
        </div>
        {sorenessNote && (
          <div style={{
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: '#FEA020',
            marginBottom: 8,
            lineHeight: 1.4,
          }}>
            {sorenessNote}
          </div>
        )}
        <div style={{
          fontSize: 14,
          color: 'rgba(245,245,240,0.45)',
          marginBottom: 28,
          lineHeight: 1.5,
        }}>
          Complete this warm-up to prime your body and reduce injury risk.
        </div>
      </div>

      {/* Exercise list */}
      <div style={{ padding: '0 24px', paddingBottom: 24 }}>
        {exercises.length === 0 && (
          <div style={{
            padding: '24px',
            background: '#0d0d0d',
            borderRadius: 12,
            border: '1px solid rgba(245,245,240,0.06)',
            textAlign: 'center',
            color: 'rgba(245,245,240,0.4)',
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.1em',
          }}>
            No protocol found for {sessionType} / {skillLevel}
          </div>
        )}
        {exercises.map((ex, i) => {
          const color = TYPE_COLOR[ex.type] || 'rgba(245,245,240,0.5)';
          return (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              paddingBottom: 18,
              marginBottom: 18,
              borderBottom: i < exercises.length - 1 ? '1px solid rgba(245,245,240,0.06)' : 'none',
            }}>
              {/* Type dot */}
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: color,
                marginTop: 8,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 17,
                    fontWeight: 900,
                    color: '#f5f5f0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                  }}>
                    {ex.name}
                  </span>
                  <span style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color,
                    fontFamily: "'DM Mono', monospace",
                  }}>
                    {TYPE_LABEL[ex.type] || (ex.type || '').toUpperCase()}
                  </span>
                </div>
                <div style={{
                  fontSize: 13,
                  color: 'rgba(245,245,240,0.65)',
                  fontFamily: "'DM Mono', monospace",
                  marginBottom: ex.notes ? 4 : 0,
                }}>
                  {ex.sets} {parseInt(ex.sets) === 1 ? 'set' : 'sets'} × {ex.reps}
                </div>
                {ex.notes && (
                  <div style={{
                    fontSize: 12,
                    color: 'rgba(245,245,240,0.4)',
                    lineHeight: 1.5,
                  }}>
                    {ex.notes}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Type legend */}
        <div style={{
          display: 'flex',
          gap: 20,
          marginTop: 8,
          paddingTop: 16,
          borderTop: '1px solid rgba(245,245,240,0.06)',
        }}>
          {Object.entries(TYPE_LABEL).map(([type, label]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: TYPE_COLOR[type],
              }} />
              <span style={{
                fontSize: 10,
                color: 'rgba(245,245,240,0.3)',
                letterSpacing: '0.1em',
                fontFamily: "'DM Mono', monospace",
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom spacer for sticky buttons */}
        <div style={{ height: 160 }} />
      </div>

      {/* Sticky bottom buttons */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        padding: '16px 24px',
        paddingBottom: 'max(env(safe-area-inset-bottom),32px)',
        borderTop: '1px solid rgba(245,245,240,0.08)',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <button
          onClick={onStart}
          style={{
            width: '100%',
            padding: '16px 0',
            background: '#e8341c',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          START WORKOUT →
        </button>
        <button
          onClick={onSkip}
          style={{
            width: '100%',
            padding: '14px 0',
            background: 'transparent',
            border: '1px solid rgba(245,245,240,0.15)',
            borderRadius: 12,
            color: 'rgba(245,245,240,0.45)',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          SKIP WARM-UP →
        </button>
      </div>
    </div>
  );
}
