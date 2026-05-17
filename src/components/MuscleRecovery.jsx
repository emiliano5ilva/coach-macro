import { useState, useEffect, useRef } from 'react';
import bodyMapSvg from '../../public/body-map-thermal.svg?raw';

const THERMAL = {
  hot:  '#FFE500',
  warm: '#FF6D00',
  red:  '#CC1100',
  cool: '#00BFFF',
  cold: '#2a2a2a',
};

const MUSCLE_MAP = {
  chest:     ['chest'],
  back:      ['traps', 'lats'],
  shoulders: ['shoulders-f', 'rear-delts'],
  arms:      ['biceps', 'forearms-f', 'triceps', 'forearms-b'],
  core:      ['abs', 'hip-flexors', 'lower-back'],
  legs:      ['quads', 'calves-f', 'glutes', 'hamstrings', 'calves-b'],
};

const NAMES = { chest:'Chest', back:'Back', shoulders:'Shoulders', arms:'Arms', core:'Core', legs:'Legs' };

function thermalColor(pct) {
  if (pct === null || pct === undefined) return THERMAL.cold;
  if (pct >= 85) return THERMAL.cool;
  if (pct >= 70) return THERMAL.red;
  if (pct >= 50) return THERMAL.warm;
  return THERMAL.hot;
}

function optColor(status) {
  if (status === 'OVERLOADED')   return THERMAL.hot;
  if (status === 'OPTIMAL')      return THERMAL.red;
  if (status === 'UNDERTRAINED') return THERMAL.cool;
  return THERMAL.cold;
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

export default function MuscleRecovery({ recoveryData, optimizationData }) {
  const [mode, setMode] = useState('recovery');
  const svgRef = useRef(null);

  // Fix 2 — override any fixed width/height on the SVG element after inject
  useEffect(() => {
    const svg = svgRef.current?.querySelector('svg');
    if (!svg) return;
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', 'auto');
    svg.style.width   = '100%';
    svg.style.height  = 'auto';
    svg.style.display = 'block';
  }, []);

  // Fix 5 — apply thermal colors; bodyMapSvg is static so not a dep
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current.querySelector('svg');
    if (!svg) return;
    Object.entries(MUSCLE_MAP).forEach(([group, ids]) => {
      const color = mode === 'recovery'
        ? thermalColor(recoveryData?.[group]?.percent ?? null)
        : optColor(optimizationData?.[group]?.status);
      ids.forEach(id => {
        const el = svg.querySelector('#' + id);
        if (!el) return;
        el.setAttribute('fill', color);
        el.querySelectorAll('path, ellipse, rect').forEach(p => p.setAttribute('fill', color));
      });
    });
  }, [mode, recoveryData, optimizationData]);

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
      {/* Fix 3 — CSS hard override for SVG sizing */}
      <style>{`
        #muscle-svg-wrap svg {
          width: 100% !important;
          height: auto !important;
          display: block !important;
        }
      `}</style>

      {/* Mode tabs */}
      <div style={s.tabs}>
        {['recovery', 'optimization'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{ ...s.tab, ...(mode === m ? s.tabActive : {}) }}>
            {m}
          </button>
        ))}
      </div>

      <div style={s.eyebrow}>// Muscle status</div>

      {/* Body map — Fix 1: raw import, no fetch */}
      <div style={s.mapWrap}>
        <div
          id="muscle-svg-wrap"
          ref={svgRef}
          style={s.svgWrap}
          dangerouslySetInnerHTML={{ __html: bodyMapSvg }}
        />
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
  svgWrap: {
    width: '100%',
    overflow: 'hidden',
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
    background: 'linear-gradient(to right, #2a2a2a, #00BFFF, #CC1100, #FF6D00, #FFE500)',
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
