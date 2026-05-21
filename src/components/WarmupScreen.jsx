import { getWarmupProtocol } from '../data/warmups.js';

const SESSION_LABEL = {
  push:  'PUSH SESSION',
  pull:  'PULL SESSION',
  legs:  'LEG SESSION',
  upper: 'UPPER BODY SESSION',
  lower: 'LOWER BODY SESSION',
  run:   'RUN SESSION',
  hyrox: 'HYROX SESSION',
};

const STATIC_WARMUPS = {
  push: [
    { name: 'Arm Circles',        sets: '2 × 30 sec', note: 'Forward and backward — big slow circles' },
    { name: 'Band Pull-Aparts',   sets: '2 × 15 reps', note: 'Activate rear delts before pressing' },
    { name: 'Wall Slides',        sets: '2 × 10 reps', note: 'Shoulder mobility — keep lower back flat' },
    { name: 'Incline Push-Ups',   sets: '2 × 10 reps', note: 'Prime chest and triceps pattern' },
    { name: 'Empty Bar Bench',    sets: '1 × 15 reps', note: 'Movement pattern prep — light and controlled' },
  ],
  pull: [
    { name: 'Shoulder Rollouts',  sets: '2 × 10 each', note: 'Roll forward then backward slowly' },
    { name: 'Dead Hang',          sets: '2 × 20 sec',  note: 'Passive hang — decompress the spine' },
    { name: 'Band Pull-Aparts',   sets: '2 × 15 reps', note: 'Rear delt activation before rowing' },
    { name: 'Light Lat Pulldown', sets: '2 × 15 reps', note: 'Very light — feel lats engage' },
  ],
  legs: [
    { name: 'Hip Circles',        sets: '2 × 10 each', note: 'Hands on hips — big slow circles' },
    { name: 'Leg Swings',         sets: '2 × 12 each', note: 'Forward and back, holding wall for balance' },
    { name: 'Bodyweight Squat',   sets: '2 × 15 reps', note: 'Slow 3-sec descent — open the hips' },
    { name: 'Glute Bridge',       sets: '2 × 15 reps', note: 'Pause 1 sec at top — activate glutes' },
    { name: 'Light Goblet Squat', sets: '1 × 12 reps', note: 'Light dumbbell — movement pattern prep' },
  ],
  upper: [
    { name: 'Arm Circles',        sets: '2 × 20 each', note: 'Forward and backward — loosen shoulders' },
    { name: 'Band Pull-Aparts',   sets: '2 × 15 reps', note: 'Rear delt and scapula activation' },
    { name: 'Shoulder Rollouts',  sets: '2 × 10 each', note: 'Full range — both directions' },
    { name: 'Light Press',        sets: '2 × 15 reps', note: 'Empty bar or very light — pattern prep' },
  ],
  lower: [
    { name: 'Hip Circles',        sets: '2 × 10 each', note: 'Big slow circles in both directions' },
    { name: 'Leg Swings',         sets: '2 × 12 each', note: 'Lateral and forward/back' },
    { name: 'Bodyweight Squat',   sets: '2 × 15 reps', note: 'Slow descent — feel the range' },
    { name: 'Hip Flexor Stretch', sets: '2 × 30 sec',  note: 'Lunge position — hold and breathe' },
  ],
  run: [
    { name: 'Leg Swings',         sets: '2 × 15 each', note: 'Loosen hips before running' },
    { name: 'Ankle Circles',      sets: '2 × 10 each', note: 'Both directions — reduce ankle stiffness' },
    { name: 'High Knees (slow)',  sets: '2 × 30 sec',  note: 'Gentle — warm the hip flexors' },
    { name: 'Easy Jog',           sets: '1 × 3 min',   note: 'Build to aerobic pace gradually' },
  ],
  hyrox: [
    { name: 'Hip Circles',        sets: '2 × 10 each', note: 'Loosen hips and lower back' },
    { name: 'Arm Circles',        sets: '2 × 15 each', note: 'Full range — both directions' },
    { name: 'Glute Bridge',       sets: '2 × 15 reps', note: 'Activate posterior chain' },
    { name: 'Easy Jog',           sets: '1 × 3 min',   note: 'Build to aerobic pace' },
    { name: 'SkiErg Light',       sets: '2 × 20 reps', note: '60% effort — get the feel' },
  ],
};

export default function WarmupScreen({ sessionType = 'push', skillLevel = 'beginner', soreness = null, onStart, onSkip }) {
  const sessionLabel = SESSION_LABEL[sessionType] || `${(sessionType || 'push').toUpperCase()} SESSION`;

  // Load dynamic protocol, fall back to static
  const protocol = getWarmupProtocol(sessionType, skillLevel);
  const dynamicExercises = Array.isArray(protocol) ? protocol : (protocol?.exercises || []);
  const staticFallback = STATIC_WARMUPS[sessionType] || STATIC_WARMUPS['push'];

  // Build final list — prefer dynamic if it has entries
  const baseExercises = dynamicExercises.length > 0
    ? dynamicExercises.map(ex => ({ name: ex.name, sets: `${ex.sets} × ${ex.reps}`, note: ex.notes || '' }))
    : staticFallback;

  const exercises = baseExercises;

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
          marginBottom: 16,
        }}>
          BEFORE {sessionLabel}<span style={{ color: '#e8341c' }}>.</span>
        </div>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: 'rgba(245,245,240,0.4)',
          marginBottom: 28,
          letterSpacing: '0.08em',
        }}>
          {exercises.length} EXERCISES · COMPLETE BEFORE LOADING THE BAR
        </div>
      </div>

      {/* Exercise cards */}
      <div style={{ padding: '0 24px', paddingBottom: 200 }}>
        {exercises.map((ex, i) => (
          <div key={i} style={{
            background: '#0d0d0d',
            border: '1px solid rgba(232,52,28,0.08)',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontStyle: 'italic',
                fontWeight: 900,
                fontSize: 18,
                color: '#f5f5f0',
                textTransform: 'uppercase',
                lineHeight: 1.1,
                marginBottom: ex.note ? 3 : 0,
              }}>
                {ex.name}
              </div>
              {ex.note ? (
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  color: 'rgba(245,245,240,0.4)',
                  marginTop: 3,
                  lineHeight: 1.4,
                }}>
                  {ex.note}
                </div>
              ) : null}
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              color: '#e8341c',
              letterSpacing: '0.08em',
              flexShrink: 0,
              marginLeft: 12,
              textAlign: 'right',
            }}>
              {ex.sets}
            </div>
          </div>
        ))}
      </div>

      {/* Fixed bottom buttons — always visible */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px 24px',
        paddingBottom: 'max(env(safe-area-inset-bottom),24px)',
        background: '#000000',
        borderTop: '1px solid rgba(245,245,240,0.06)',
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
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          BEGIN SESSION →
        </button>
        <button
          onClick={onSkip}
          style={{
            width: '100%',
            padding: '13px 0',
            background: 'transparent',
            border: '1px solid rgba(245,245,240,0.15)',
            borderRadius: 12,
            color: 'rgba(245,245,240,0.4)',
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
