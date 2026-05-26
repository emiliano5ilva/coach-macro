import { useState, useEffect, useRef } from "react";
import { sb } from "../supabase.js";
import { displayWeightCompact, displayWeight, displayDistance, runDistanceStatLabel, weightLabel } from "../utils/units.js";
import { calculateTrainingDNA, getDominantDimension } from "../services/trainingDnaService.js";

// ── Athlete Title System ──────────────────────────────────────────────────────
const ATHLETE_TITLES = {
  strength:    'IRON ATHLETE',
  endurance:   'DISTANCE MACHINE',
  power:       'POWER ATHLETE',
  consistency: 'THE GRINDER',
  nutrition:   'PRECISION ATHLETE',
  recovery:    'RECOVERY SPECIALIST',
};

function getAthleteTitle(dna) {
  if (!dna) return null;
  const dominant = Object.entries(dna).sort((a, b) => b[1] - a[1])[0];
  return dominant ? ATHLETE_TITLES[dominant[0]] || null : null;
}

// ── Format Helpers ────────────────────────────────────────────────────────────

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Available Stats ───────────────────────────────────────────────────────────
const AVAILABLE_STATS = [
  // ── STRENGTH ────────────────────────────────────────────────────────────────
  {
    id: 'total_volume',
    label: 'Total lifted',
    group: 'STRENGTH',
    query: async (userId, wUnit) => {
      const { data } = await sb
        .from('workout_logs')
        .select('workout')
        .eq('user_id', userId);
      let total = 0;
      (data || []).forEach(row => {
        (row.workout?.exercises || []).forEach(ex => {
          (ex.sets || []).forEach(s => {
            const w = parseFloat(s.weight || 0), r = parseInt(s.reps || 0);
            if (w > 0 && r > 0) total += w * r;
          });
        });
      });
      return displayWeightCompact(total, wUnit);
    },
  },
  {
    id: 'top_pr',
    label: 'Top PR',
    group: 'STRENGTH',
    query: async (userId, wUnit) => {
      const { data } = await sb
        .from('workout_logs')
        .select('workout')
        .eq('user_id', userId);
      let topPR = 0;
      (data || []).forEach(row => {
        (row.workout?.exercises || []).forEach(ex => {
          (ex.sets || []).forEach(s => {
            const w = parseFloat(s.weight || 0);
            if (w > 0) topPR = Math.max(topPR, w);
          });
        });
      });
      return topPR > 0 ? displayWeight(topPR, wUnit) : null;
    },
  },
  {
    id: 'sessions_logged',
    label: 'Sessions logged',
    group: 'STRENGTH',
    query: async (userId) => {
      const { count } = await sb
        .from('workout_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      return (count || 0).toString();
    },
  },
  // ── STREAKS ──────────────────────────────────────────────────────────────────
  {
    id: 'best_streak',
    label: 'Best streak',
    group: 'STREAKS',
    query: async (userId) => {
      const { data } = await sb
        .from('workout_logs')
        .select('date')
        .eq('user_id', userId)
        .order('date', { ascending: true });
      if (!data?.length) return '0 days';
      const dates = [...new Set(data.map(r => r.date))].sort();
      let best = 1, curr = 1;
      for (let i = 1; i < dates.length; i++) {
        const diff = Math.round((new Date(dates[i]) - new Date(dates[i - 1])) / (1000 * 60 * 60 * 24));
        if (diff === 1) { curr++; best = Math.max(best, curr); }
        else if (diff > 1) curr = 1;
      }
      return `${best} days`;
    },
  },
  {
    id: 'consistency',
    label: 'Consistency',
    group: 'STREAKS',
    query: async (userId) => {
      const [{ data: prof }, { count }] = await Promise.all([
        sb.from('profiles').select('created_at').eq('id', userId).single(),
        sb.from('workout_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);
      const days = Math.max(1, Math.floor((Date.now() - new Date(prof?.created_at || Date.now())) / (1000 * 60 * 60 * 24)));
      const pct = Math.min(100, Math.round(((count || 0) / days) * 100));
      return `${pct}%`;
    },
  },
  // ── RUNNING ──────────────────────────────────────────────────────────────────
  {
    id: 'total_distance',
    label: 'Total run',
    group: 'RUNNING',
    query: async (userId, wUnit) => {
      try {
        const { data, error } = await sb.from('run_logs').select('distance_km').eq('user_id', userId);
        if (error) return null;
        const total = (data || []).reduce((sum, r) => sum + (r.distance_km || 0), 0);
        return displayDistance(total, wUnit);
      } catch { return null; }
    },
  },
  {
    id: 'best_5k',
    label: 'Best 5K',
    group: 'RUNNING',
    query: async (userId) => {
      try {
        const { data, error } = await sb.from('run_logs')
          .select('duration_seconds, distance_km')
          .eq('user_id', userId)
          .gte('distance_km', 4.9)
          .lte('distance_km', 5.1)
          .order('duration_seconds', { ascending: true })
          .limit(1)
          .single();
        if (error || !data) return null;
        return formatTime(data.duration_seconds);
      } catch { return null; }
    },
  },
  {
    id: 'best_mile',
    label: 'Best mile',
    group: 'RUNNING',
    query: async (userId) => {
      try {
        const { data, error } = await sb.from('run_logs')
          .select('duration_seconds, distance_km')
          .eq('user_id', userId)
          .gte('distance_km', 1.55)
          .lte('distance_km', 1.65)
          .order('duration_seconds', { ascending: true })
          .limit(1)
          .single();
        if (error || !data) return null;
        return formatTime(data.duration_seconds);
      } catch { return null; }
    },
  },
  // ── NUTRITION ─────────────────────────────────────────────────────────────────
  {
    id: 'protein_days',
    label: 'Protein days hit',
    group: 'NUTRITION',
    query: async (userId) => {
      const [{ data: prof }, { data: logs }] = await Promise.all([
        sb.from('profiles').select('profile_data').eq('id', userId).single(),
        sb.from('food_logs').select('date, entries').eq('user_id', userId),
      ]);
      const target = prof?.profile_data?.protein || 0;
      if (!target || !logs?.length) return '0 days';
      const byDay = {};
      logs.forEach(log => {
        const p = (log.entries || []).reduce((s, e) => s + (parseFloat(e.protein_g || e.protein || 0)), 0);
        byDay[log.date] = (byDay[log.date] || 0) + p;
      });
      const hits = Object.values(byDay).filter(p => p >= target).length;
      return `${hits} days`;
    },
  },
  {
    id: 'calorie_accuracy',
    label: 'Calorie accuracy',
    group: 'NUTRITION',
    query: async (userId) => {
      const [{ data: prof }, { data: logs }] = await Promise.all([
        sb.from('profiles').select('profile_data').eq('id', userId).single(),
        sb.from('food_logs').select('date, entries').eq('user_id', userId),
      ]);
      const target = prof?.profile_data?.goalCals || prof?.profile_data?.calorie_target || 0;
      if (!target || !logs?.length) return null;
      const byDay = {};
      logs.forEach(log => {
        const c = (log.entries || []).reduce((s, e) => s + (parseFloat(e.calories || 0)), 0);
        byDay[log.date] = (byDay[log.date] || 0) + c;
      });
      const days = Object.values(byDay);
      const accurate = days.filter(c => Math.abs(c - target) / target <= 0.10).length;
      return days.length > 0 ? `${Math.round(accurate / days.length * 100)}%` : null;
    },
  },
];

const DEFAULT_STATS = ['total_volume', 'top_pr', 'sessions_logged', 'best_streak', 'consistency'];
const STAT_GROUPS = ['STRENGTH', 'STREAKS', 'RUNNING', 'NUTRITION'];

// ── Icons ─────────────────────────────────────────────────────────────────────
function ShareIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        position: 'relative',
        width: 40, height: 22,
        borderRadius: 11,
        background: on ? '#e8341c' : 'rgba(245,245,240,0.08)',
        border: `1px solid ${on ? '#e8341c' : 'rgba(245,245,240,0.12)'}`,
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 2,
        left: on ? 20 : 2,
        width: 16, height: 16,
        borderRadius: '50%',
        background: '#f5f5f0',
        transition: 'left 0.2s',
      }}/>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function PassportBadge({ type }) {
  const defs = {
    PRO:             { bg: '#FEA020', color: '#000', label: 'PRO' },
    VERIFIED:        { bg: '#1D9BF0', color: '#fff', label: 'VERIFIED ✓' },
    VERIFIED_WHITE:  { bg: '#f5f5f0', color: '#000', label: 'VERIFIED ✓' },
    VIP:             { bg: '#FFD740', color: '#000', label: 'VIP' },
  };
  const d = defs[type];
  if (!d) return null;
  return (
    <span style={{
      background: d.bg, color: d.color,
      borderRadius: 4, padding: '2px 8px',
      fontFamily: "'DM Mono','SF Mono',monospace",
      fontSize: 8, fontWeight: 700,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      display: 'inline-block',
    }}>
      {d.label}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AthletePassport({ userId }) {
  const [profile, setProfile] = useState(null);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [dnaScores, setDnaScores] = useState(null);
  const [statValues, setStatValues] = useState({});
  const [statLoading, setStatLoading] = useState(true);
  const [selectedStats, setSelectedStats] = useState(DEFAULT_STATS);
  const [sharing, setSharing] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [showMaxToast, setShowMaxToast] = useState(false);
  const passportRef = useRef(null);
  const toastTimerRef = useRef(null);

  // ── Derived values ──────────────────────────────────────────────────────────
  const profileData = profile?.profile_data || {};
  const wUnit = profileData.wUnit || 'lbs';
  const startD = profileData.startDate ? new Date(profileData.startDate) : (profile?.created_at ? new Date(profile.created_at) : new Date());
  const daysSince = Math.max(0, Math.floor((new Date() - startD) / 86400000));
  const memberSince = startD.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();

  const nameParts = (profileData.name || 'ATHLETE').trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');

  const athleteTitle = dnaScores && daysSince >= 30 ? getAthleteTitle(dnaScores) : null;
  const watermarkText = athleteTitle || 'COACH MACRO';

  // Badge conditions
  const tier = (profileData.subscriptionTier || '').toLowerCase();
  const isPro = !!profileData.is_pro || ['pro', 'plus', 'ultra'].includes(tier);
  const isVerified = workoutCount >= 1;
  const referralTier = profile?.referral_tier || 0;
  const isVip = !!profileData.isVip || referralTier >= 2;

  // ── Load data on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      const [{ data: prof }, { count: wCount }] = await Promise.all([
        sb.from('profiles').select('profile_data, referral_count, referral_tier, passport_stats, created_at').eq('id', userId).single(),
        sb.from('workout_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      if (cancelled) return;

      setProfile(prof);
      setWorkoutCount(wCount || 0);

      // Load saved stats selection
      const saved = prof?.passport_stats;
      const validIds = new Set(AVAILABLE_STATS.map(s => s.id));
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setSelectedStats(saved.filter(id => validIds.has(id)).slice(0, 5));
      }

      // Calculate DNA scores via shared service
      const dna = await calculateTrainingDNA(userId);
      if (!cancelled) setDnaScores(dna);
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  // ── Load stat values whenever selectedStats changes ─────────────────────────
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setStatLoading(true);

    const statsToLoad = [...selectedStats];
    Promise.all(
      statsToLoad.map(id => {
        const def = AVAILABLE_STATS.find(s => s.id === id);
        if (!def) return Promise.resolve([id, null]);
        return def.query(userId, wUnit).then(v => [id, v]).catch(() => [id, null]);
      })
    ).then(results => {
      if (cancelled) return;
      const vals = {};
      results.forEach(([id, v]) => { vals[id] = v; });
      setStatValues(vals);
      setStatLoading(false);
    });

    return () => { cancelled = true; };
  }, [userId, selectedStats.join(','), wUnit]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function saveStats(ns) {
    setSelectedStats(ns);
    if (userId) await sb.from('profiles').update({ passport_stats: ns }).eq('id', userId);
  }

  function toggleStat(id) {
    if (selectedStats.includes(id)) {
      saveStats(selectedStats.filter(s => s !== id));
    } else if (selectedStats.length < 5) {
      saveStats([...selectedStats, id]);
    } else {
      // Show max toast
      setShowMaxToast(true);
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setShowMaxToast(false), 2000);
    }
  }

  async function sharePassport() {
    if (!passportRef.current) return;
    setSharing(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(passportRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: false,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'coach-macro-passport.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: 'My Coach Macro Passport',
            text: 'Check out my athlete stats on Coach Macro',
            files: [file],
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'coach-macro-passport.png';
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (e) {
      console.error('[sharePassport]', e);
    }
    setSharing(false);
  }

  // ── Stat cell ───────────────────────────────────────────────────────────────
  function StatCell({ id, value, label, locked }) {
    const isLoading = statLoading && !locked;
    return (
      <div style={{
        background: '#0d0d0d',
        padding: '10px 8px',
        textAlign: 'center',
        opacity: locked ? 0.6 : 1,
      }}>
        {isLoading ? (
          <>
            <style>{`@keyframes passport-pulse{0%,100%{opacity:.35}50%{opacity:.7}}`}</style>
            <div style={{ height: 16, borderRadius: 4, background: 'rgba(245,245,240,0.06)', marginBottom: 4, animation: 'passport-pulse 1.4s ease-in-out infinite' }}/>
            <div style={{ height: 10, borderRadius: 3, background: 'rgba(245,245,240,0.04)', animation: 'passport-pulse 1.4s ease-in-out infinite 0.2s' }}/>
          </>
        ) : (
          <>
            <div style={{ fontFamily: "'Barlow Condensed','Barlow',sans-serif", fontStyle: 'italic', fontWeight: 900, fontSize: 16, color: '#f5f5f0', lineHeight: 1, marginBottom: 2 }}>
              {value || '—'}
            </div>
            <div style={{ fontFamily: "'DM Mono','SF Mono',monospace", fontSize: 7, color: 'rgba(245,245,240,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.3 }}>
              {label}
            </div>
            {locked && (
              <div style={{ fontFamily: "'DM Mono','SF Mono',monospace", fontSize: 6, color: 'rgba(232,52,28,0.4)', letterSpacing: '0.08em', marginTop: 2 }}>
                LOCKED
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const badges = [
    isPro && 'PRO',
    (isVerified || referralTier >= 3) && 'VERIFIED',
    isVip && 'VIP',
    referralTier >= 4 && 'VERIFIED_WHITE',
  ].filter(Boolean).slice(0, 4);

  const displayStats = selectedStats.slice(0, 5);

  return (
    <div style={{ marginBottom: 4 }}>
      <style>{`@keyframes passport-pulse{0%,100%{opacity:.35}50%{opacity:.7}}`}</style>

      {/* ── PASSPORT CARD ─────────────────────────────────────────────────── */}
      <div
        ref={passportRef}
        id="passport-card"
        style={{
          background: 'linear-gradient(145deg, #0d0d0d 0%, #0a0408 60%, #110008 100%)',
          borderRadius: 16,
          padding: '22px 20px 18px',
          border: '1px solid rgba(232,52,28,0.2)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 10,
        }}
      >
        {/* Atmospheric glows */}
        <div style={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, background: 'radial-gradient(circle, rgba(232,52,28,0.14) 0%, transparent 70%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -40, left: -20, width: 160, height: 160, background: 'radial-gradient(circle, rgba(232,52,28,0.06) 0%, transparent 70%)', pointerEvents: 'none' }}/>

        {/* Watermark */}
        <div style={{
          position: 'absolute',
          bottom: -10, right: -12,
          fontFamily: "'Barlow Condensed','Barlow',sans-serif",
          fontStyle: 'italic',
          fontWeight: 900,
          fontSize: 72,
          color: 'rgba(245,245,240,0.04)',
          textTransform: 'uppercase',
          letterSpacing: '-2px',
          lineHeight: 1,
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}>
          {watermarkText.split(' ').length > 1
            ? watermarkText.split(' ').map((w, i) => <div key={i}>{w}</div>)
            : watermarkText}
        </div>

        {/* Coach Macro logo */}
        <div style={{ position: 'absolute', top: 18, right: 18, textAlign: 'right' }}>
          <div style={{ fontFamily: "'DM Mono','SF Mono',monospace", fontSize: 8, color: 'rgba(232,52,28,0.6)', letterSpacing: '0.16em', textTransform: 'uppercase', lineHeight: 1.3 }}>COACH</div>
          <div style={{ fontFamily: "'DM Mono','SF Mono',monospace", fontSize: 8, color: 'rgba(232,52,28,0.6)', letterSpacing: '0.16em', textTransform: 'uppercase', lineHeight: 1.3 }}>MACRO</div>
        </div>

        {/* Badge row */}
        {badges.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: referralTier >= 4 ? 6 : 14, flexWrap: 'wrap', alignItems: 'center' }}>
            {badges.map(b => <PassportBadge key={b} type={b}/>)}
          </div>
        )}

        {/* Referral count — bragging rights, shown only after max tier */}
        {referralTier >= 4 && (profile?.referral_count || 0) > 0 && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
            <span style={{ fontFamily: "'Barlow Condensed','Barlow',sans-serif", fontStyle: 'italic', fontWeight: 900, fontSize: 18, color: '#FFD740', lineHeight: 1 }}>
              {profile.referral_count}
            </span>
            <span style={{ fontFamily: "'DM Mono','SF Mono',monospace", fontSize: 7, color: 'rgba(255,215,64,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              referrals
            </span>
          </div>
        )}

        {/* Athlete identity */}
        <div style={{ fontFamily: "'DM Mono','SF Mono',monospace", fontSize: 10, color: 'rgba(245,245,240,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2, position: 'relative', zIndex: 1 }}>
          ATHLETE
        </div>
        <div style={{ fontFamily: "'Barlow Condensed','Barlow',sans-serif", fontStyle: 'italic', fontWeight: 900, fontSize: 32, color: '#f5f5f0', lineHeight: 0.92, marginBottom: 4, textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>
          {firstName}
          {lastName ? ` ${lastName}` : ''}
          <span style={{ color: '#e8341c' }}>.</span>
        </div>
        <div style={{
          fontFamily: "'Barlow Condensed','Barlow',sans-serif",
          fontStyle: 'italic',
          fontWeight: 900,
          fontSize: 16,
          marginBottom: 18,
          textTransform: 'uppercase',
          color: athleteTitle ? '#e8341c' : 'rgba(245,245,240,0.4)',
          position: 'relative',
          zIndex: 1,
        }}>
          {athleteTitle || 'ATHLETE IN PROGRESS'}
        </div>

        {/* Stats grid — 5 selected + Athlete Since */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          background: 'rgba(232,52,28,0.1)',
          borderRadius: 10,
          overflow: 'hidden',
          gap: 1,
          marginBottom: 16,
          position: 'relative',
          zIndex: 1,
        }}>
          {displayStats.map(id => {
            const def = AVAILABLE_STATS.find(s => s.id === id);
            return (
              <StatCell
                key={id}
                id={id}
                value={statValues[id]}
                label={
                  id === 'total_distance' ? runDistanceStatLabel(wUnit) :
                  id === 'total_volume' ? `Total ${weightLabel(wUnit)} lifted` :
                  def?.label || id
                }
              />
            );
          })}
          {/* Fill empty cells if < 5 stats selected */}
          {Array.from({ length: Math.max(0, 5 - displayStats.length) }).map((_, i) => (
            <div key={`empty-${i}`} style={{ background: '#0d0d0d', padding: '10px 8px' }}/>
          ))}
          {/* Athlete Since — always last, always locked */}
          <StatCell
            id="athlete_since"
            value={memberSince}
            label="Athlete since"
            locked
          />
        </div>

        {/* Bottom bar */}
        <div style={{
          paddingTop: 12,
          borderTop: '1px solid rgba(232,52,28,0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1,
        }}>
          <span style={{ fontFamily: "'DM Mono','SF Mono',monospace", fontSize: 8, color: 'rgba(245,245,240,0.25)', letterSpacing: '0.1em' }}>coach-macro.com</span>
          <span style={{ fontFamily: "'DM Mono','SF Mono',monospace", fontSize: 8, color: 'rgba(245,245,240,0.25)', letterSpacing: '0.08em' }}>{memberSince}</span>
        </div>
      </div>

      {/* ── ACTION BUTTONS ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <button
          onClick={sharePassport}
          disabled={sharing || statLoading}
          style={{
            background: '#e8341c',
            border: 'none',
            borderRadius: 10,
            padding: 12,
            color: '#ffffff',
            fontFamily: "'DM Mono','SF Mono',monospace",
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: sharing ? 'default' : 'pointer',
            opacity: sharing ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'opacity 0.15s',
          }}
        >
          <ShareIcon/>
          {sharing ? 'SHARING...' : 'SHARE'}
        </button>
        <button
          onClick={() => setCustomizing(c => !c)}
          style={{
            background: 'rgba(245,245,240,0.04)',
            border: '1px solid rgba(245,245,240,0.1)',
            borderRadius: 10,
            padding: 12,
            color: customizing ? '#f5f5f0' : 'rgba(245,245,240,0.6)',
            fontFamily: "'DM Mono','SF Mono',monospace",
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <SettingsIcon/>
          CUSTOMISE
        </button>
      </div>

      {/* ── CUSTOMISE PANEL ───────────────────────────────────────────────── */}
      {customizing && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: "'DM Mono','SF Mono',monospace", fontSize: 9, color: '#e8341c', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 500 }}>
            // CUSTOMISE STATS
          </div>
          <div style={{ background: '#111827', borderRadius: 12, border: '1px solid rgba(245,245,240,0.07)', overflow: 'hidden', marginBottom: 12 }}>
            {/* Selected count */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(245,245,240,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: "'DM Mono','SF Mono',monospace", fontSize: 9, color: 'rgba(245,245,240,0.4)' }}>Stats selected</span>
              <span style={{
                background: 'rgba(232,52,28,0.12)',
                border: '1px solid rgba(232,52,28,0.3)',
                borderRadius: 20,
                padding: '2px 10px',
                fontFamily: "'DM Mono','SF Mono',monospace",
                fontSize: 9,
                color: '#e8341c',
              }}>
                {selectedStats.length} / 5
              </span>
            </div>

            {/* Stat groups */}
            {STAT_GROUPS.map(group => {
              const groupStats = AVAILABLE_STATS.filter(s => s.group === group);
              return (
                <div key={group}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(245,245,240,0.06)', fontFamily: "'DM Mono','SF Mono',monospace", fontSize: 8, color: '#e8341c', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    {group}
                  </div>
                  <div style={{ padding: '10px 16px 4px' }}>
                    {groupStats.map((stat, i) => {
                      const isSel = selectedStats.includes(stat.id);
                      const canAdd = !isSel && selectedStats.length < 5;
                      return (
                        <div
                          key={stat.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: i < groupStats.length - 1 ? 8 : 12,
                            opacity: !isSel && !canAdd ? 0.4 : 1,
                          }}
                        >
                          <span style={{ fontFamily: "'Barlow',sans-serif", fontSize: 13, color: '#f5f5f0' }}>{stat.label}</span>
                          <Toggle on={isSel} onChange={() => toggleStat(stat.id)}/>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Locked Athlete Since row */}
            <div style={{ padding: '12px 16px', opacity: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 13, color: '#f5f5f0' }}>Athlete Since</div>
                <div style={{ fontFamily: "'DM Mono','SF Mono',monospace", fontSize: 8, color: 'rgba(245,245,240,0.4)', marginTop: 2 }}>Always shown — cannot be removed</div>
              </div>
              <div style={{ color: 'rgba(245,245,240,0.35)' }}><LockIcon/></div>
            </div>
          </div>

          <div style={{ fontFamily: "'DM Mono','SF Mono',monospace", fontSize: 9, color: 'rgba(245,245,240,0.3)', textAlign: 'center', letterSpacing: '0.06em' }}>
            Max 5 stats · Athlete Since is always shown
          </div>
        </div>
      )}

      {/* ── MAX STAT TOAST ────────────────────────────────────────────────── */}
      {showMaxToast && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#111827',
          border: '1px solid rgba(232,52,28,0.3)',
          borderRadius: 8,
          padding: '10px 16px',
          fontFamily: "'DM Mono','SF Mono',monospace",
          fontSize: 10,
          color: '#f5f5f0',
          zIndex: 9999,
          whiteSpace: 'nowrap',
        }}>
          Remove a stat to add another
        </div>
      )}
    </div>
  );
}
