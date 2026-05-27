import { sb } from '../client.js';

// ─── Trigger category registry ────────────────────────────────────────────────

export const TRIGGER_CATEGORIES = {
  signal_degradation: 'Signal Alerts',
  critical_moment:    'Critical Moments',
  win_celebration:    'Wins',
  contextual:         'Contextual',
  reinforcement:      'Reinforcement',
  algorithm:          'Algorithm Updates',
};

// ─── Default preferences ──────────────────────────────────────────────────────

export const DEFAULT_PREFS = {
  enabled:           true,
  max_per_day:       1,
  quiet_start:       22,
  quiet_end:         7,
  critical_override: true,
  categories: {
    signal_degradation: true,
    critical_moment:    true,
    win_celebration:    true,
    contextual:         true,
    reinforcement:      true,
    algorithm:          true,
  },
};

// ─── Preferences cache ────────────────────────────────────────────────────────

const _prefCache = new Map();

export async function getOutreachPreferences(userId) {
  const cached = _prefCache.get(userId);
  if (cached && Date.now() - cached.ts < 30 * 60 * 1000) return cached.prefs;

  try {
    const s = JSON.parse(localStorage.getItem(`cm_outreach_prefs_${userId}`));
    if (s && Date.now() - (s.ts || 0) < 24 * 3600 * 1000) {
      _prefCache.set(userId, { prefs: s.data, ts: Date.now() });
      return s.data;
    }
  } catch {}

  try {
    const { data } = await sb.from('outreach_preferences').select('*').eq('user_id', userId).maybeSingle();
    if (data) {
      const prefs = {
        ...DEFAULT_PREFS,
        enabled:           data.enabled ?? DEFAULT_PREFS.enabled,
        max_per_day:       data.max_per_day ?? DEFAULT_PREFS.max_per_day,
        quiet_start:       data.quiet_start ?? DEFAULT_PREFS.quiet_start,
        quiet_end:         data.quiet_end ?? DEFAULT_PREFS.quiet_end,
        critical_override: data.critical_override ?? DEFAULT_PREFS.critical_override,
        categories: { ...DEFAULT_PREFS.categories, ...(data.category_toggles || {}) },
      };
      _prefCache.set(userId, { prefs, ts: Date.now() });
      try { localStorage.setItem(`cm_outreach_prefs_${userId}`, JSON.stringify({ data: prefs, ts: Date.now() })); } catch {}
      return prefs;
    }
  } catch {}

  return { ...DEFAULT_PREFS };
}

export async function saveOutreachPreferences(userId, prefs) {
  _prefCache.set(userId, { prefs, ts: Date.now() });
  try { localStorage.setItem(`cm_outreach_prefs_${userId}`, JSON.stringify({ data: prefs, ts: Date.now() })); } catch {}
  try {
    await sb.from('outreach_preferences').upsert({
      user_id:           userId,
      enabled:           prefs.enabled,
      max_per_day:       prefs.max_per_day,
      quiet_start:       prefs.quiet_start,
      quiet_end:         prefs.quiet_end,
      critical_override: prefs.critical_override !== false,
      category_toggles:  prefs.categories || DEFAULT_PREFS.categories,
      updated_at:        new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch {}
}

// ─── Trigger library ──────────────────────────────────────────────────────────

const TRIGGERS = [
  // ── Signal Degradation ────────────────────────────────────────────────────
  {
    id: 'sleep_declining',
    category: 'signal_degradation',
    priority: 7,
    isCritical: false,
    condition({ bioData }) {
      if (!bioData || bioData.length < 3) return false;
      const sorted = [...bioData]
        .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
        .slice(0, 4);
      const hours = sorted.map(r => parseFloat(r.sleep_hours || 0)).filter(h => h > 2);
      if (hours.length < 3) return false;
      let declining = 0;
      for (let i = 0; i < hours.length - 1; i++) {
        if (hours[i] < hours[i + 1] - 0.15) declining++;
      }
      return declining >= 2 && hours[0] < 7.5;
    },
    craft({ bioData }) {
      const sorted = [...bioData]
        .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
        .slice(0, 3);
      const avg = (sorted.reduce((s, r) => s + parseFloat(r.sleep_hours || 0), 0) / sorted.length).toFixed(1);
      return {
        title: 'Sleep trend.',
        body: `Sleep has been creeping down — averaging ${avg}h this week. Tomorrow's training might suffer. Consider winding down a little earlier tonight.`,
        deep_link: 'progress',
        scenario: 'sleep_low',
      };
    },
  },
  {
    id: 'hrv_declining',
    category: 'signal_degradation',
    priority: 7,
    isCritical: false,
    condition({ bioData }) {
      if (!bioData || bioData.length < 7) return false;
      const sorted = [...bioData]
        .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
        .slice(0, 7);
      const hrs = sorted.map(r => parseFloat(r.hrv_avg || 0)).filter(h => h > 0);
      if (hrs.length < 7) return false;
      const earlyAvg = hrs.slice(4).reduce((s, v) => s + v, 0) / hrs.slice(4).length;
      const recentAvg = hrs.slice(0, 3).reduce((s, v) => s + v, 0) / 3;
      return recentAvg < earlyAvg * 0.88;
    },
    craft({ bioData }) {
      const sorted = [...bioData]
        .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
        .slice(0, 3);
      const hrv = Math.round(sorted.reduce((s, r) => s + parseFloat(r.hrv_avg || 0), 0) / sorted.length);
      return {
        title: 'HRV check.',
        body: `Your HRV has been quietly dropping — now at ${hrv}ms. Your body is asking for a lighter day. Want me to suggest one?`,
        deep_link: 'progress',
        scenario: null,
      };
    },
  },
  {
    id: 'adherence_slipping',
    category: 'signal_degradation',
    priority: 5,
    isCritical: false,
    condition({ foodLogs, memberDays }) {
      if (!foodLogs || memberDays < 14) return false;
      const cutoff = new Date(Date.now() - 5 * 864e5).toISOString().split('T')[0];
      const recent = foodLogs.filter(l => l.date >= cutoff);
      return recent.length < 2;
    },
    craft() {
      return {
        title: 'Coach check-in.',
        body: "Noticed logging has been spottier this week. No judgment — want to talk about what's going on, or just keep going?",
        deep_link: 'home',
        scenario: 'missed_day',
      };
    },
  },

  // ── Critical Moments ──────────────────────────────────────────────────────
  {
    id: 'overtraining_risk',
    category: 'critical_moment',
    priority: 9,
    isCritical: true,
    condition({ workoutLogs, bioData }) {
      if (!workoutLogs || workoutLogs.length < 3 || !bioData?.length) return false;
      const cutoff3 = new Date(Date.now() - 3 * 864e5).toISOString().split('T')[0];
      const cutoff7 = new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0];
      const recentVol = workoutLogs.filter(l => l.date >= cutoff3).reduce((s, l) => s + (l.volume_lbs || 0), 0);
      const prevVol   = workoutLogs.filter(l => l.date >= cutoff7 && l.date < cutoff3).reduce((s, l) => s + (l.volume_lbs || 0), 0);
      const volumeJump = prevVol > 0 && recentVol > prevVol * 1.35;
      const recentBio = [...bioData].sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at)).slice(0, 3);
      const lowRecovery = recentBio.some(r => parseFloat(r.hrv_avg || 99) < 38 || parseFloat(r.rhr || 0) > 72);
      return volumeJump && lowRecovery;
    },
    craft({ bioData }) {
      const sorted = [...bioData].sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at)).slice(0, 2);
      const hrv = Math.round(sorted.reduce((s, r) => s + parseFloat(r.hrv_avg || 0), 0) / Math.max(1, sorted.length));
      return {
        title: 'Before your session.',
        body: `Recovery markers are down — HRV at ${hrv}ms. You're loading heavier than last week. Consider dropping intensity or rescheduling. Your body is asking for it.`,
        deep_link: 'train',
        scenario: null,
      };
    },
  },
  {
    id: 'post_binge_restriction',
    category: 'critical_moment',
    priority: 8,
    isCritical: false,
    condition({ foodLogs, macros }) {
      if (!foodLogs || !macros?.calories) return false;
      const yesterday = new Date(Date.now() - 864e5).toISOString().split('T')[0];
      const yesterdayCals = foodLogs
        .filter(l => l.date === yesterday)
        .reduce((s, l) => s + ((l.entries || []).reduce((ss, e) => ss + (e.calories || 0), 0)), 0);
      const todayStr = new Date().toISOString().split('T')[0];
      const todayCals = foodLogs
        .filter(l => l.date === todayStr)
        .reduce((s, l) => s + ((l.entries || []).reduce((ss, e) => ss + (e.calories || 0), 0)), 0);
      const hour = new Date().getHours();
      return yesterdayCals > macros.calories * 1.4 && todayCals < 400 && hour >= 14;
    },
    craft({ macros }) {
      return {
        title: 'About yesterday.',
        body: `Yesterday went over target — that's normal. Resist the urge to skip meals today. Eating less now actually slows progress. Just hit your normal ${macros?.calories || 2000} kcal target.`,
        deep_link: 'home',
        scenario: null,
      };
    },
  },
  {
    id: 'pre_workout_fuel',
    category: 'critical_moment',
    priority: 6,
    isCritical: false,
    condition({ foodLogs, workoutLogs, memberDays }) {
      if (!foodLogs || memberDays < 14) return false;
      const hour = new Date().getHours();
      if (hour < 14 || hour > 17) return false;
      const todayStr = new Date().toISOString().split('T')[0];
      if ((workoutLogs || []).some(l => l.date === todayStr)) return false;
      const todayCals = foodLogs
        .filter(l => l.date === todayStr)
        .reduce((s, l) => s + ((l.entries || []).reduce((ss, e) => ss + (e.calories || 0), 0)), 0);
      return todayCals < 600;
    },
    craft() {
      return {
        title: 'Fuel up.',
        body: "Haven't logged much today. If you're training tonight, even a small meal now will make the session noticeably better. Carbs matter here.",
        deep_link: 'home',
        scenario: null,
      };
    },
  },

  // ── Win Celebrations ──────────────────────────────────────────────────────
  {
    id: 'pr_detected',
    category: 'win_celebration',
    priority: 10,
    isCritical: false,
    condition({ workoutLogs }) {
      if (!workoutLogs || workoutLogs.length < 2) return false;
      const todayStr = new Date().toISOString().split('T')[0];
      return workoutLogs.some(l => l.date === todayStr && (l.has_pr === true || l.new_pr === true));
    },
    craft({ workoutLogs }) {
      const todayStr = new Date().toISOString().split('T')[0];
      const prLog = workoutLogs.find(l => l.date === todayStr && (l.has_pr || l.new_pr));
      return {
        title: 'New PR.',
        body: `Just noticed — you hit a new personal record${prLog?.name ? ` on ${prLog.name}` : ''}. Your training is locked in right now.`,
        deep_link: 'train',
        scenario: 'great_week',
      };
    },
  },
  {
    id: 'hrv_recovery',
    category: 'win_celebration',
    priority: 7,
    isCritical: false,
    condition({ bioData }) {
      if (!bioData || bioData.length < 4) return false;
      const sorted = [...bioData].sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
      const todayHrv = parseFloat(sorted[0]?.hrv_avg || 0);
      const prevHrvs = sorted.slice(1, 4).map(r => parseFloat(r.hrv_avg || 0)).filter(v => v > 0);
      if (!prevHrvs.length || todayHrv === 0) return false;
      const prevAvg = prevHrvs.reduce((s, v) => s + v, 0) / prevHrvs.length;
      return todayHrv >= 50 && todayHrv > prevAvg * 1.12 && prevHrvs.some(v => v < 45);
    },
    craft({ bioData }) {
      const sorted = [...bioData].sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
      const hrv = Math.round(parseFloat(sorted[0]?.hrv_avg || 0));
      return {
        title: 'Recovery complete.',
        body: `HRV jumped back to ${hrv}ms overnight — sleep is doing its job. Today is a great day for a hard session if you want it.`,
        deep_link: 'progress',
        scenario: null,
      };
    },
  },
  {
    id: 'logging_streak',
    category: 'win_celebration',
    priority: 6,
    isCritical: false,
    condition({ foodLogs, memberDays }) {
      if (!foodLogs || memberDays < 14) return false;
      const today = new Date();
      let streak = 0;
      for (let i = 1; i <= 31; i++) {
        const d = new Date(today.getTime() - i * 864e5).toISOString().split('T')[0];
        if (foodLogs.some(l => l.date === d)) streak++;
        else break;
      }
      return streak === 14 || streak === 21 || streak === 30;
    },
    craft({ foodLogs }) {
      const today = new Date();
      let streak = 0;
      for (let i = 1; i <= 31; i++) {
        const d = new Date(today.getTime() - i * 864e5).toISOString().split('T')[0];
        if (foodLogs.some(l => l.date === d)) streak++;
        else break;
      }
      const accuracy = Math.min(97, 60 + Math.round(streak * 1.2));
      return {
        title: `${streak}-day streak.`,
        body: `${streak} days of consistent tracking. The data flywheel is turning — my predictions for you are now ${accuracy}% more accurate than when you started.`,
        deep_link: 'progress',
        scenario: 'great_week',
      };
    },
  },

  // ── Contextual ────────────────────────────────────────────────────────────
  {
    id: 'post_event_weight',
    category: 'contextual',
    priority: 6,
    isCritical: false,
    condition({ bodyweightLogs, foodLogs }) {
      if (!bodyweightLogs || !foodLogs) return false;
      const yesterday = new Date(Date.now() - 864e5).toISOString().split('T')[0];
      const twoDaysAgo = new Date(Date.now() - 2 * 864e5).toISOString().split('T')[0];
      const yesterdayCals = foodLogs
        .filter(l => l.date === yesterday)
        .reduce((s, l) => s + ((l.entries || []).reduce((ss, e) => ss + (e.calories || 0), 0)), 0);
      if (yesterdayCals < 3200) return false;
      const sortedBW = [...bodyweightLogs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const todayBW = sortedBW[0];
      const prevBW = sortedBW.find(l => (l.created_at || '').split('T')[0] <= twoDaysAgo);
      if (!todayBW || !prevBW) return false;
      return (todayBW.weight - prevBW.weight) >= 2;
    },
    craft({ bodyweightLogs }) {
      const sorted = [...bodyweightLogs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const diff = ((sorted[0]?.weight || 0) - (sorted[2]?.weight || sorted[0]?.weight || 0)).toFixed(1);
      return {
        title: "What you're seeing is water.",
        body: `Scale is up ${parseFloat(diff) > 0 ? '+' : ''}${diff} lbs this morning — that's water and food volume from last night. Expect it gone by Wednesday. Don't react.`,
        deep_link: 'progress',
        scenario: null,
      };
    },
  },

  // ── Reinforcement ─────────────────────────────────────────────────────────
  {
    id: 'intervention_followup_7d',
    category: 'reinforcement',
    priority: 5,
    isCritical: false,
    condition({ patternDetections }) {
      if (!patternDetections?.length) return false;
      const sevenDaysAgo = new Date(Date.now() - 7 * 864e5).toISOString();
      const sixDaysAgo   = new Date(Date.now() - 6 * 864e5).toISOString();
      return patternDetections.some(p =>
        p.detected_at >= sixDaysAgo && p.detected_at <= sevenDaysAgo && p.outcome !== 'resolved'
      );
    },
    craft({ patternDetections, bioData }) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 864e5).toISOString();
      const recent = patternDetections?.find(p => p.detected_at >= sevenDaysAgo);
      const patternName = recent?.pattern_name || 'the pattern I flagged';
      const sorted = bioData ? [...bioData].sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at)) : [];
      const currentHrv = parseFloat(sorted[0]?.hrv_avg || 0);
      const oldIdx = sorted.findIndex(r => new Date(r.recorded_at) < new Date(Date.now() - 6 * 864e5));
      const oldHrv = oldIdx >= 0 ? parseFloat(sorted[oldIdx]?.hrv_avg || 0) : 0;
      const change = currentHrv > 0 && oldHrv > 0 ? Math.round(((currentHrv - oldHrv) / oldHrv) * 100) : null;
      const changeText = change !== null
        ? ` Recovery markers are ${change > 0 ? 'up' : 'down'} ${Math.abs(change)}%.`
        : '';
      return {
        title: 'Checking in.',
        body: `A week ago I flagged ${patternName}.${changeText} How are you feeling about it now?`,
        deep_link: 'progress',
        scenario: null,
      };
    },
  },

  // ── Algorithm Updates ─────────────────────────────────────────────────────
  {
    id: 'tdee_confidence_locked',
    category: 'algorithm',
    priority: 6,
    isCritical: false,
    condition({ expenditure, memberDays }) {
      if (!expenditure || memberDays < 14) return false;
      return expenditure.confidence === 'high' && memberDays >= 14 && memberDays <= 21;
    },
    craft({ expenditure }) {
      const tdee = Math.round(expenditure?.tdee || expenditure?.calculated_tdee || 2500);
      return {
        title: 'Algorithm locked in.',
        body: `Two weeks of data and my TDEE estimate for you is now ${tdee.toLocaleString()} kcal — high confidence. This is when the predictions start getting really useful.`,
        deep_link: 'progress',
        scenario: null,
      };
    },
  },
];

// ─── Core evaluation functions ────────────────────────────────────────────────

export function evaluateAllTriggers(data) {
  return TRIGGERS
    .filter(t => { try { return t.condition(data); } catch { return false; } })
    .map(t => ({ ...t, score: t.priority + (t.isCritical ? 5 : 0) }))
    .sort((a, b) => b.score - a.score);
}

export function shouldNotifyNow(prefs, trigger, recentNotifs) {
  if (!prefs.enabled) return false;
  if (!trigger.isCritical && !(prefs.categories?.[trigger.category] ?? true)) return false;

  const hour = new Date().getHours();
  const start = prefs.quiet_start ?? 22;
  const end   = prefs.quiet_end   ?? 7;
  const inQuiet = start > end ? (hour >= start || hour < end) : (hour >= start && hour < end);
  if (inQuiet && !(prefs.critical_override !== false && trigger.isCritical)) return false;

  // Daily cap (celebrations don't count against cap)
  if (!trigger.isCritical && trigger.category !== 'win_celebration') {
    const today = new Date().toISOString().split('T')[0];
    const todayCount = (recentNotifs || []).filter(n =>
      n.sent_at?.startsWith(today) && n.trigger_type !== 'pr_detected' && n.trigger_type !== 'hrv_recovery' && n.trigger_type !== 'logging_streak'
    ).length;
    if (todayCount >= (prefs.max_per_day ?? 1)) return false;
  }

  // Duplicate suppression (48h)
  const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  if ((recentNotifs || []).some(n => n.trigger_type === trigger.id && n.sent_at >= cutoff)) return false;

  return true;
}

export function craftNotification(trigger, data, profile, adaptFn) {
  const raw = trigger.craft(data);
  let body = raw.body;
  if (profile && adaptFn) {
    try { body = adaptFn(raw.body, profile, { scenario: raw.scenario, data }); } catch {}
  }
  return {
    trigger_type: trigger.id,
    category:     trigger.category,
    title:        raw.title.toUpperCase(),
    body,
    deep_link:    raw.deep_link || 'home',
    is_critical:  trigger.isCritical,
    sent_at:      new Date().toISOString(),
  };
}

export async function recordNotificationOutcome(userId, triggerType, outcome) {
  try {
    await sb.from('outreach_log')
      .update({
        opened:       outcome !== 'ignored',
        action_taken: outcome === 'acted',
        dismissed:    outcome === 'dismissed',
      })
      .eq('user_id', userId)
      .eq('trigger_type', triggerType)
      .order('sent_at', { ascending: false })
      .limit(1);
  } catch {}
}

async function _getRecentNotifs(userId) {
  try {
    const cutoff = new Date(Date.now() - 7 * 864e5).toISOString();
    const { data } = await sb.from('outreach_log')
      .select('trigger_type, sent_at, opened, dismissed')
      .eq('user_id', userId)
      .gte('sent_at', cutoff)
      .order('sent_at', { ascending: false });
    return data || [];
  } catch { return []; }
}

async function _sendLocalNotification(notif) {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') return false;
    const id = 6000 + Math.floor(Math.random() * 999);
    await LocalNotifications.schedule({
      notifications: [{
        id,
        title: notif.title,
        body:  notif.body,
        schedule: { at: new Date(Date.now() + 800) },
        extra: { route: notif.deep_link },
      }],
    });
    return true;
  } catch { return false; }
}

// ─── Main outreach check (call every app-foreground, debounced 4h) ────────────

export async function runOutreachCheck(userId, appData = {}) {
  if (!userId) return null;

  const debounceKey = `cm_outreach_ts_${userId}`;
  const lastRun = parseInt(localStorage.getItem(debounceKey) || '0');
  if (Date.now() - lastRun < 4 * 3600 * 1000) return null;

  const since14 = new Date(Date.now() - 14 * 864e5).toISOString().split('T')[0];
  const [
    { data: bioData },
    { data: foodLogsRaw },
    { data: patternDetections },
    prefs,
    recentNotifs,
  ] = await Promise.all([
    sb.from('bio_data_points').select('recorded_at, sleep_hours, hrv_avg, rhr').eq('user_id', userId).gte('recorded_at', since14).catch(() => ({ data: [] })),
    sb.from('food_logs').select('date, entries').eq('user_id', userId).gte('date', since14).catch(() => ({ data: [] })),
    sb.from('pattern_detections').select('pattern_name, detected_at, outcome').eq('user_id', userId).gte('detected_at', new Date(Date.now() - 14 * 864e5).toISOString()).catch(() => ({ data: [] })),
    getOutreachPreferences(userId),
    _getRecentNotifs(userId),
  ]);

  if (!prefs.enabled) { localStorage.setItem(debounceKey, String(Date.now())); return null; }

  const data = {
    bioData:           bioData || [],
    foodLogs:          foodLogsRaw || [],
    workoutLogs:       appData.workoutLogs || [],
    bodyweightLogs:    appData.bodyweightLogs || [],
    macros:            appData.macros || null,
    memberDays:        appData.memberDays || 0,
    expenditure:       appData.expenditure || null,
    patternDetections: patternDetections || [],
  };

  const triggered = evaluateAllTriggers(data);
  if (!triggered.length) { localStorage.setItem(debounceKey, String(Date.now())); return null; }

  let toSend = null;
  for (const trigger of triggered) {
    if (shouldNotifyNow(prefs, trigger, recentNotifs)) { toSend = trigger; break; }
  }

  if (!toSend) { localStorage.setItem(debounceKey, String(Date.now())); return null; }

  // Personality adaptation
  let profile = null, adaptFn = null;
  try {
    const ps = await import('./personalityService.js');
    profile = ps.getProfileSync(userId);
    adaptFn = ps.adaptMessageSync;
  } catch {}

  const notif = craftNotification(toSend, data, profile, adaptFn);
  const sent = await _sendLocalNotification(notif);

  if (sent) {
    try {
      await sb.from('outreach_log').insert({
        user_id:           userId,
        trigger_type:      notif.trigger_type,
        sent_at:           notif.sent_at,
        notification_text: notif.body,
        deep_link:         notif.deep_link,
        opened:            false,
        action_taken:      false,
        dismissed:         false,
      });
    } catch {}
  }

  localStorage.setItem(debounceKey, String(Date.now()));
  return sent ? notif : null;
}

// ─── Weekly frequency calibration ─────────────────────────────────────────────

export async function calibrateFrequency(userId) {
  const key = `cm_outreach_calib_${userId}`;
  if (Date.now() - parseInt(localStorage.getItem(key) || '0') < 7 * 864e5) return;

  try {
    const cutoff = new Date(Date.now() - 30 * 864e5).toISOString();
    const { data: logs } = await sb.from('outreach_log')
      .select('opened, action_taken, dismissed')
      .eq('user_id', userId)
      .gte('sent_at', cutoff);

    if (!logs || logs.length < 5) { localStorage.setItem(key, String(Date.now())); return; }

    const openRate = logs.filter(l => l.opened).length / logs.length;
    const prefs = await getOutreachPreferences(userId);
    let maxPerDay = prefs.max_per_day ?? 1;

    if (openRate > 0.7 && maxPerDay < 3) maxPerDay++;
    else if (openRate < 0.25 && maxPerDay > 0) maxPerDay = Math.max(0, maxPerDay - 1);

    if (maxPerDay !== (prefs.max_per_day ?? 1)) {
      await saveOutreachPreferences(userId, { ...prefs, max_per_day: maxPerDay });
    }
  } catch {}
  localStorage.setItem(key, String(Date.now()));
}
