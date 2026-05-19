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
      position: 'fixed', inset: 0, zIndex: 9000,
      background: '#050810',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Barlow Condensed', sans-serif",
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '48px 24px 0' }}>
        <div style={{
          fontSize: 11, letterSpacing: '0.2em', color: '#ef4444',
          fontFamily: "'DM Mono', monospace", marginBottom: 8,
        }}>
          // WARM-UP
        </div>
        <div style={{
          fontSize: 36, fontWeight: 800, color: '#fff',
          lineHeight: 1, textTransform: 'uppercase', marginBottom: 12,
        }}>
          BEFORE {sessionLabel}<span style={{ color: '#ef4444' }}>.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444', borderRadius: 20, padding: '3px 12px',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
            fontFamily: "'DM Mono', monospace",
          }}>
            ~{durationMins} MIN
          </span>
          <span style={{ fontSize: 13, color: '#666', letterSpacing: '0.05em' }}>
            {exercises.length} EXERCISES
          </span>
        </div>
        {sorenessNote && (
          <div style={{ fontSize: 11, fontFamily:"'DM Mono',monospace", color: '#666', fontStyle:'italic', marginBottom: 8, lineHeight:1.4 }}>
            {sorenessNote}
          </div>
        )}
        <div style={{ fontSize: 13, color: '#555', marginBottom: 28 }}>
          Complete this warm-up to prime your body and reduce injury risk.
        </div>
      </div>

      {/* Exercise list */}
      <div style={{ flex: 1, padding: '0 24px', paddingBottom: 16 }}>
        {exercises.map((ex, i) => {
          const color = TYPE_COLOR[ex.type] || '#aaa';
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              paddingBottom: 16, marginBottom: 16,
              borderBottom: i < exercises.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              {/* Colored dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: color, marginTop: 6, flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
                    {ex.name}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
                    color, opacity: 0.8, fontFamily: "'DM Mono', monospace",
                  }}>
                    {TYPE_LABEL[ex.type] || ex.type?.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#888' }}>
                  {ex.sets} {parseInt(ex.sets) === 1 ? 'set' : 'sets'} × {ex.reps}
                </div>
                {ex.notes && (
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2, lineHeight: 1.4 }}>
                    {ex.notes}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div style={{
          display: 'flex', gap: 20, marginTop: 8, paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {Object.entries(TYPE_LABEL).map(([type, label]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: TYPE_COLOR[type] }} />
              <span style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed bottom buttons */}
      <div style={{
        padding: '16px 24px 40px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: '#050810',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <button
          onClick={onStart}
          style={{
            width: '100%', padding: '18px 0',
            background: '#ef4444', border: 'none', borderRadius: 12,
            color: '#fff', fontSize: 18, fontWeight: 800,
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          START WORKOUT →
        </button>
        <button
          onClick={onSkip}
          style={{
            width: '100%', padding: '14px 0',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            color: '#666', fontSize: 14, fontWeight: 600,
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          SKIP WARM-UP
        </button>
      </div>
    </div>
  );
}
