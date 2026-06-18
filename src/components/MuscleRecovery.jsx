import { useState, useEffect } from 'react';
import BodyMap from './BodyMap';
import { getRecoveryData, getOptimizationData } from '../services/recoveryService';
import { thermalAt, THERMAL_NODATA, THERMAL_CSS } from '../data/thermalPalette';

const MUSCLE_MAP = {
  chest:     ['chest'],
  back:      ['traps', 'lats'],
  shoulders: ['shoulders-f', 'rear-delts'],
  arms:      ['biceps', 'forearms-f', 'triceps', 'forearms-b'],
  core:      ['abs', 'hip-flexors', 'lower-back'],
  legs:      ['quads', 'calves-f', 'glutes', 'hamstrings', 'calves-b'],
};

const NAMES = { chest:'Chest', back:'Back', shoulders:'Shoulders', arms:'Arms', core:'Core', legs:'Legs' };

// Recovery: pct 0–100 where 100=fully rested (cold/blue), 0=just trained (hot/yellow)
// t = 1 - pct/100 → pct=100→t=0→blue, pct=0→t=1→yellow
function thermalColor(pct) {
  if (pct === null || pct === undefined) return THERMAL_NODATA;
  return thermalAt(1 - pct / 100);
}

// Optimization: 4 representative positions on the gradient
function optColor(status) {
  if (status === 'OVERLOADED')   return thermalAt(0.95); // hot
  if (status === 'OPTIMAL')      return thermalAt(0.62); // red/primed
  if (status === 'UNDERTRAINED') return thermalAt(0.10); // cold
  return THERMAL_NODATA;                                 // UNTRAINED / no data
}

function recoveryStatus(pct) {
  if (pct === null || pct === undefined) return 'UNTRAINED';
  if (pct >= 85) return 'FRESH';
  if (pct >= 70) return 'PRIMED';
  if (pct >= 50) return 'RECOVERING';
  return 'FATIGUED';
}

function buildRecoveryCoachText(data) {
  if (!data) return 'Loading recovery data...';
  const entries = Object.entries(data).filter(([, v]) => v.percent != null);
  if (!entries.length) return 'Start logging workouts to see recovery status.';
  const sorted = [...entries].sort((a, b) => a[1].percent - b[1].percent);
  const worst = sorted[0];
  const best  = sorted[sorted.length - 1];
  const worstName = NAMES[worst[0]];
  const bestName  = NAMES[best[0]];
  if (worst[1].percent < 50) {
    return `"${worstName} is still hot — needs more time. ${bestName} is cold and fully primed."`;
  }
  return `"${bestName} is fully recovered. ${worstName} is warming back up — keep it moderate."`;
}

function buildOptCoachText(data) {
  if (!data) return 'Loading optimization data...';
  const under = Object.entries(data).filter(([, v]) => v.status === 'UNDERTRAINED').map(([g]) => NAMES[g]);
  if (under.length > 0) {
    return `"${under.join(' and ')} volume is below the growth threshold. Add sessions this week."`;
  }
  const over = Object.entries(data).filter(([, v]) => v.status === 'OVERLOADED').map(([g]) => NAMES[g]);
  if (over.length > 0) {
    return `"${over.join(' and ')} is running hot — reduce volume before you burn out."`;
  }
  return '"Volume is well distributed across all groups. Stay the course."';
}

export default function MuscleRecovery({ userId, recoveryData: propRecovery, optimizationData: propOptim, recoveryPromise }) {
  const [mode, setMode] = useState('recovery');
  const [localRecovery, setLocalRecovery] = useState(null);
  const [localOptim, setLocalOptim]       = useState(null);
  const [loading, setLoading]             = useState(false);

  async function fetchData(uid) {
    setLoading(true);
    try {
      const [rec, opt] = await Promise.all([
        getRecoveryData(uid).catch(() => null),
        getOptimizationData(uid).catch(() => null),
      ]);
      if (rec) setLocalRecovery(rec);
      if (opt) setLocalOptim(opt);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userId) return;
    // Case A: prefetch already resolved — both props present, skip fetch entirely
    if (propRecovery && propOptim) { return; }
    // Case B: prefetch in flight — hook into shared promise to avoid double-fetch
    if (recoveryPromise) {
      setLoading(true);
      recoveryPromise
        .then(result => {
          if (result?.rec) setLocalRecovery(result.rec);
          if (result?.opt) setLocalOptim(result.opt);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }
    // Case C: no prefetch (first-render race) — own fetch as fallback
    fetchData(userId);
  }, [userId]);

  // Refresh when a workout completes
  useEffect(() => {
    if (!userId) return;
    const handler = async (e) => {
      if (e.detail?.userId === userId) {
        const rec = await getRecoveryData(userId).catch(() => null);
        if (rec) setLocalRecovery(rec);
        const opt = await getOptimizationData(userId).catch(() => null);
        if (opt) setLocalOptim(opt);
      }
    };
    window.addEventListener('workoutCompleted', handler);
    return () => window.removeEventListener('workoutCompleted', handler);
  }, [userId]);

  // Refresh when soreness is logged
  useEffect(() => {
    if (!userId) return;
    const handler = async () => {
      const rec = await getRecoveryData(userId).catch(() => null);
      if (rec) setLocalRecovery(rec);
    };
    window.addEventListener('sorenessLogged', handler);
    return () => window.removeEventListener('sorenessLogged', handler);
  }, [userId]);

  // Refresh when app comes back to foreground
  useEffect(() => {
    if (!userId) return;
    const handler = () => fetchData(userId);
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [userId]);

  const recoveryData     = localRecovery ?? propRecovery;
  const optimizationData = localOptim    ?? propOptim;

  function getColors() {
    if (loading && !recoveryData) {
      const dim = {};
      Object.values(MUSCLE_MAP).flat().forEach(id => { dim[id] = 'rgba(245,245,240,0.06)'; });
      return dim;
    }
    const colors = {};
    Object.entries(MUSCLE_MAP).forEach(([group, ids]) => {
      const color = mode === 'recovery'
        ? thermalColor(recoveryData?.[group]?.percent ?? null)
        : optColor(optimizationData?.[group]?.status);
      ids.forEach(id => { colors[id] = color; });
    });
    return colors;
  }

  const getChips = () => {
    const data = mode === 'recovery'
      ? Object.keys(MUSCLE_MAP).map(g => ({
          group: g,
          status: recoveryStatus(recoveryData?.[g]?.percent),
          color: thermalColor(recoveryData?.[g]?.percent ?? null),
          pct: recoveryData?.[g]?.percent ?? null,
        }))
      : Object.keys(MUSCLE_MAP).map(g => ({
          group: g,
          status: optimizationData?.[g]?.status ?? 'UNTRAINED',
          color: optColor(optimizationData?.[g]?.status),
          pct: null,
        }));
    const order = { FATIGUED:0, OVERLOADED:0, RECOVERING:1, UNDERTRAINED:1, PRIMED:2, OPTIMAL:2, FRESH:3 };
    return data.sort((a, b) => (order[a.status] ?? 2) - (order[b.status] ?? 2));
  };

  const coachText = mode === 'recovery'
    ? buildRecoveryCoachText(recoveryData)
    : buildOptCoachText(optimizationData);

  return (
    <div style={s.wrapper}>
      {/* Mode tabs */}
      <div style={s.tabs}>
        {['recovery', 'optimization'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{ ...s.tab, ...(mode === m ? s.tabActive : {}) }}>
            {m}
          </button>
        ))}
      </div>

      <div style={s.eyebrow}>// Muscle status</div>

      {/* Body map */}
      <div style={s.mapWrap}>
        <BodyMap colors={getColors()} />
        <div style={s.legend}>
          <span style={s.legendLabel}>cold · rested</span>
          <div style={s.legendBar} />
          <span style={s.legendLabel}>hot · fatigued</span>
        </div>
      </div>

      {/* Status chips */}
      <div style={s.chipGrid}>
        {getChips().map(({ group, status, color, pct }) => (
          <div key={group} style={{ ...s.chip, border: `1px solid ${color}30` }}>
            <div style={{ ...s.chipBar, background: color, boxShadow: `0 0 6px ${color}60` }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={s.chipLabel}>{NAMES[group]}</div>
              <div style={{ ...s.chipStatus, color }}>{status}</div>
            </div>
            {pct !== null && <div style={s.chipPct}>{pct}%</div>}
          </div>
        ))}
      </div>

      {/* Coach card */}
      <div style={s.coachCard}>
        <div style={s.coachLabel}>// Coach</div>
        <div style={s.coachText}>{coachText}</div>
      </div>
      {!recoveryData&&!loading&&(
        <div style={{textAlign:"center",padding:"16px 0 4px"}}>
          <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"rgba(245,245,240,0.3)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>LOG SESSIONS TO SEE YOUR MUSCLE RECOVERY MAP.</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,color:"rgba(245,245,240,0.35)",lineHeight:1.5}}>Complete your first session and Coach Macro will track which muscles need rest and which are ready to train.</div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrapper: {
    backgroundColor: '#0a0a0a',
    borderRadius: 14,
    border: '1px solid rgba(245,245,240,0.07)',
    padding: 16,
    marginBottom: 16,
  },
  tabs: {
    display: 'flex',
    flexDirection: 'row',
    borderBottom: '1px solid rgba(245,245,240,0.07)',
    margin: '-16px -16px 16px -16px',
  },
  tab: {
    fontFamily: "'DM Mono', 'SF Mono', monospace",
    fontSize: 9,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    padding: '10px 16px',
    color: 'rgba(245,245,240,0.35)',
    border: 'none',
    borderBottom: '2px solid transparent',
    background: 'none',
    cursor: 'pointer',
  },
  tabActive: {
    color: '#e8341c',
    borderBottom: '2px solid #e8341c',
  },
  eyebrow: {
    fontFamily: "'DM Mono', 'SF Mono', monospace",
    fontSize: 9,
    color: '#e8341c',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  mapWrap: {
    backgroundColor: '#000000',
    borderRadius: 10,
    padding: 8,
    marginBottom: 14,
  },
  legend: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingLeft: 4,
    paddingRight: 4,
  },
  legendLabel: {
    fontFamily: "'DM Mono', 'SF Mono', monospace",
    fontSize: 8,
    color: 'rgba(245,245,240,0.3)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  legendBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    margin: '0 8px',
    background: THERMAL_CSS,
  },
  chipGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(10,10,10,0.8)',
    borderRadius: 8,
    padding: 8,
    width: 'calc(50% - 3px)',
    boxSizing: 'border-box',
  },
  chipBar: {
    width: 4,
    height: 28,
    borderRadius: 2,
    flexShrink: 0,
  },
  chipLabel: {
    fontFamily: "'DM Mono', 'SF Mono', monospace",
    fontSize: 8,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'rgba(245,245,240,0.35)',
    marginBottom: 3,
  },
  chipStatus: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontStyle: 'italic',
    fontWeight: 700,
    fontSize: 13,
    textTransform: 'uppercase',
  },
  chipPct: {
    fontFamily: "'DM Mono', 'SF Mono', monospace",
    fontSize: 9,
    color: 'rgba(245,245,240,0.3)',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  coachCard: {
    backgroundColor: 'rgba(232,52,28,0.05)',
    borderLeft: '3px solid #e8341c',
    borderRadius: '0 8px 8px 0',
    padding: 12,
  },
  coachLabel: {
    fontFamily: "'DM Mono', 'SF Mono', monospace",
    fontSize: 8,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: '#e8341c',
    marginBottom: 5,
  },
  coachText: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontStyle: 'italic',
    fontSize: 14,
    color: '#f5f5f0',
    lineHeight: '20px',
  },
};
