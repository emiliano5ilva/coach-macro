import { sb } from '../client.js';

// ─── Personality type registry ────────────────────────────────────────────────

export const PERSONALITY_TYPES = {
  analyzer: {
    label: 'Data-Driven',
    tagline: 'You respond best to specific numbers, evidence, and transparent reasoning.',
    description: "We've noticed you engage most when coaching includes the logic and data behind every recommendation.",
    icon: '📊',
  },
  believer: {
    label: 'Progress-Focused',
    tagline: 'You respond best to encouragement, story-framing, and momentum-building language.',
    description: "We've noticed you respond best to coaching that celebrates progress and keeps momentum high.",
    icon: '🚀',
  },
  skeptic: {
    label: 'Evidence-First',
    tagline: 'You respond best when coaching shows its work and acknowledges uncertainty.',
    description: "We've noticed you engage most when the reasoning is transparent and you're invited to question it.",
    icon: '🔍',
  },
  perfectionist: {
    label: 'Consistency-Oriented',
    tagline: 'You respond best to reassurance, the long-view, and permission to be imperfect.',
    description: "We've noticed you're highly consistent and respond best when coaching zooms out to the full picture.",
    icon: '🎯',
  },
  coaster: {
    label: 'Direct',
    tagline: 'You respond best to clear, no-nonsense coaching without sugarcoating.',
    description: "We've noticed you respond best to straight-talking coaching with a clear call to action.",
    icon: '⚡',
  },
  craftsman: {
    label: 'Technical',
    tagline: 'You respond best to peer-level, technically detailed coaching.',
    description: "We've noticed you have advanced knowledge and respond best to coaching that treats you as a peer.",
    icon: '🔬',
  },
};

// ─── Module-level in-memory cache (session-scoped) ────────────────────────────
const _cache = new Map(); // userId → { profile, ts }

// ─── DB read/write ────────────────────────────────────────────────────────────

export async function getPersonalityProfile(userId) {
  if (!userId) return null;

  const hit = _cache.get(userId);
  if (hit && Date.now() - hit.ts < 30 * 60_000) return hit.profile;

  const lsKey = `cm_pers_${userId}`;
  try {
    const s = JSON.parse(localStorage.getItem(lsKey));
    if (s && Date.now() - s.ts < 7 * 864e5) {
      _cache.set(userId, { profile: s.p, ts: Date.now() });
      return s.p;
    }
  } catch {}

  const { data } = await sb.from('personality_profiles').select('*').eq('user_id', userId).single();
  if (!data) return null;

  const profile = {
    primaryType:    data.primary_type    || 'balanced',
    secondaryType:  data.secondary_type  || null,
    scores:         data.scores          || {},
    confidence:     data.confidence      || 0,
    manualOverride: data.manual_override || null,
    emotionalTone:  data.emotional_tone  || 'balanced',
    lastCalculated: data.last_calculated || null,
  };
  _cache.set(userId, { profile, ts: Date.now() });
  try { localStorage.setItem(lsKey, JSON.stringify({ p: profile, ts: Date.now() })); } catch {}
  return profile;
}

// Synchronous read from in-memory cache — returns null if not yet loaded
export function getProfileSync(userId) {
  return _cache.get(userId)?.profile ?? null;
}

async function savePersonalityProfile(userId, profile) {
  if (!userId) return;
  await sb.from('personality_profiles').upsert({
    user_id:         userId,
    primary_type:    profile.primaryType    ?? 'balanced',
    secondary_type:  profile.secondaryType  ?? null,
    scores:          profile.scores         ?? {},
    confidence:      profile.confidence     ?? 0,
    manual_override: profile.manualOverride ?? null,
    emotional_tone:  profile.emotionalTone  ?? 'balanced',
    last_calculated: new Date().toISOString().split('T')[0],
    updated_at:      new Date().toISOString(),
  }, { onConflict: 'user_id' });
  _cache.delete(userId);
  try { localStorage.removeItem(`cm_pers_${userId}`); } catch {}
}

// ─── Score calculation ────────────────────────────────────────────────────────

export async function calculatePersonalityScores(userId) {
  if (!userId) return null;
  const since = new Date(Date.now() - 90 * 864e5).toISOString().split('T')[0];
  const memberDays = await getMemberDays(userId);

  const [
    { data: food },
    { data: workouts },
    { data: bw },
    { data: insights },
    { data: patterns },
    { data: events },
    { data: profileRow },
  ] = await Promise.all([
    sb.from('food_logs').select('date, logged_at, entries').eq('user_id', userId).gte('date', since),
    sb.from('workout_logs').select('date, volume_lbs').eq('user_id', userId).gte('date', since),
    sb.from('bodyweight_logs').select('weight, created_at').eq('user_id', userId).gte('created_at', since + 'T00:00:00Z').order('created_at'),
    sb.from('validation_insights').select('insight_type, acted_upon, priority, date_generated').eq('user_id', userId).gte('date_generated', since),
    sb.from('pattern_detections').select('action_taken, dismissed_at').eq('user_id', userId).gte('detected_at', since + 'T00:00:00Z'),
    sb.from('user_events').select('event_type').eq('user_id', userId).gte('created_at', since + 'T00:00:00Z').limit(500),
    sb.from('profiles').select('experience_level, created_at').eq('id', userId).single(),
  ]);

  return {
    analyzer:      scoreAnalyzer(food, insights, events, memberDays),
    believer:      scoreBeliever(food, insights, events, memberDays),
    skeptic:       scoreSkeptic(insights, patterns, events, memberDays),
    perfectionist: scorePerfectionist(food, memberDays),
    coaster:       scoreCoaster(food, bw, patterns, insights, memberDays),
    craftsman:     scoreCraftsman(workouts, profileRow, memberDays),
  };
}

function scoreAnalyzer(food, insights, events, memberDays) {
  let s = 0;
  if (food?.length) {
    const precise = food.filter(l => /\d+\.\d+/.test(JSON.stringify(l.entries || ''))).length;
    s += Math.min(25, Math.round((precise / food.length) * 25));
    const logDays = new Set(food.map(l => l.date)).size;
    if (logDays / Math.min(memberDays || 1, 90) > 0.8) s += 15;
  }
  if (events?.length) {
    const detail = events.filter(e => ['view_expenditure_detail', 'expand_validation_insight'].includes(e.event_type)).length;
    s += Math.min(30, detail * 4);
  }
  if (insights?.length) s += Math.round((insights.filter(i => i.acted_upon).length / insights.length) * 20);
  if (memberDays >= 30) s += 10;
  return Math.min(100, s);
}

function scoreBeliever(food, insights, events, memberDays) {
  let s = 0;
  if (food?.length && memberDays >= 14) {
    const cons = new Set(food.map(l => l.date)).size / Math.min(memberDays, 90);
    s += cons >= 0.85 ? 30 : cons >= 0.7 ? 20 : cons >= 0.5 ? 10 : 0;
  }
  if (insights?.length) s += Math.round((insights.filter(i => i.acted_upon).length / insights.length) * 25);
  const detailRate = events?.length
    ? events.filter(e => ['expand_validation_insight', 'view_expenditure_detail'].includes(e.event_type)).length / events.length
    : 0;
  s += detailRate < 0.1 ? 20 : detailRate < 0.2 ? 10 : 0;
  if (!events?.length) s += 10; // new user default nudge
  return Math.min(100, s);
}

function scoreSkeptic(insights, patterns, events, memberDays) {
  let s = 0;
  if (insights?.length >= 3) {
    const ar = insights.filter(i => i.acted_upon).length / insights.length;
    s += ar < 0.2 ? 30 : ar < 0.4 ? 15 : 0;
  }
  if (events?.length) {
    s += Math.min(30, events.filter(e => e.event_type === 'expand_validation_insight').length * 5);
    s += Math.min(20, events.filter(e => e.event_type === 'view_expenditure_detail').length * 4);
  }
  if (patterns?.length >= 2) {
    s += Math.min(20, patterns.filter(p => p.dismissed_at && !p.action_taken).length * 5);
  }
  return Math.min(100, s);
}

function scorePerfectionist(food, memberDays) {
  if (!food?.length || memberDays < 21) return 0;
  let s = 0;
  const logDays = new Set(food.map(l => l.date)).size;
  const cons = logDays / Math.min(memberDays, 90);
  s += cons >= 0.9 ? 40 : cons >= 0.8 ? 20 : 0;

  const hours = food.map(l => l.logged_at ? new Date(l.logged_at).getHours() : null).filter(h => h !== null);
  if (hours.length >= 10) {
    const mean = hours.reduce((a, b) => a + b, 0) / hours.length;
    const std = Math.sqrt(hours.reduce((a, h) => a + (h - mean) ** 2, 0) / hours.length);
    s += std < 2 ? 30 : std < 4 ? 15 : 0;
  }

  const byDay = food.reduce((acc, l) => { acc[l.date] = (acc[l.date] || 0) + 1; return acc; }, {});
  const multiRate = Object.values(byDay).filter(n => n >= 3).length / logDays;
  s += multiRate > 0.5 ? 20 : multiRate > 0.3 ? 10 : 0;
  return Math.min(100, s);
}

function scoreCoaster(food, bw, patterns, insights, memberDays) {
  if (memberDays < 30) return 0;
  let s = 0;
  if (food?.length && memberDays >= 21) {
    const cons = new Set(food.map(l => l.date)).size / Math.min(memberDays, 90);
    s += (cons >= 0.4 && cons <= 0.7) ? 30 : cons < 0.4 ? 15 : 0;
  }
  if (bw?.length >= 10) {
    const w = bw.map(l => parseFloat(l.weight)).filter(n => !isNaN(n));
    const rAvg = w.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    const oAvg = w.slice(-5).reduce((a, b) => a + b, 0) / 5;
    if (Math.abs(rAvg - oAvg) < 1.5 && memberDays >= 45) s += 25;
  }
  if (patterns?.length >= 2) s += Math.min(25, patterns.filter(p => p.dismissed_at && !p.action_taken).length * 8);
  if (insights?.length >= 3 && insights.filter(i => i.acted_upon).length / insights.length < 0.15) s += 20;
  return Math.min(100, s);
}

function scoreCraftsman(workouts, profileRow, memberDays) {
  let s = 0;
  if (profileRow?.experience_level === 'advanced') s += 35;
  else if (profileRow?.experience_level === 'intermediate') s += 15;
  s += memberDays >= 365 ? 25 : memberDays >= 180 ? 15 : memberDays >= 90 ? 8 : 0;
  if (workouts?.length >= 20) {
    const avg = workouts.reduce((a, l) => a + (l.volume_lbs || 0), 0) / workouts.length;
    s += avg > 20000 ? 25 : avg > 10000 ? 15 : avg > 5000 ? 8 : 0;
    const weeks = Math.max(1, Math.ceil(Math.min(memberDays, 90) / 7));
    const perWk = workouts.length / weeks;
    s += perWk >= 4 ? 15 : perWk >= 3 ? 8 : 0;
  }
  return Math.min(100, s);
}

// ─── Personality detection (runs weekly) ─────────────────────────────────────

export async function detectPrimaryPersonality(userId) {
  if (!userId) return null;

  const profile = await getPersonalityProfile(userId);
  if (profile?.lastCalculated) {
    const daysSince = (Date.now() - new Date(profile.lastCalculated).getTime()) / 864e5;
    if (daysSince < 7 && (profile.confidence ?? 0) > 20) return profile;
  }

  const scores = await calculatePersonalityScores(userId);
  if (!scores) return null;

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const [primary, pScore] = sorted[0];
  const [secondary, sScore] = sorted[1];
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  const dominance  = total > 0 ? pScore / total : 0;
  const confidence = Math.min(90, Math.round(dominance * 70 + (pScore > 50 ? 20 : pScore > 30 ? 10 : 0)));

  const updated = {
    primaryType:    confidence < 25 ? 'balanced' : primary,
    secondaryType:  confidence >= 35 && sScore > 25 ? secondary : null,
    scores,
    confidence,
    manualOverride: profile?.manualOverride ?? null,
    emotionalTone:  profile?.emotionalTone ?? 'balanced', // preserve a seeded/user-set tone across the weekly recalc
    lastCalculated: new Date().toISOString().split('T')[0],
  };

  await savePersonalityProfile(userId, updated);
  return updated;
}

// ─── Message templates ────────────────────────────────────────────────────────

const _lc = s => (s || 'training').toLowerCase();

const T = {
  calorie_increase: {
    analyzer:      d => `TDEE: ${d.tdee||'~2,400'} kcal. ${d.days||14}-day deficit detected (${d.deficit||'~8'}%). Recommended: +${d.amount||200} kcal/day. Predicted stabilization: ${d.stabilize||5} days.`,
    believer:      d => `Your body is working hard and it needs more fuel. Bump up by ${d.amount||200} calories — you've earned this.`,
    skeptic:       d => `${d.days||14}-day TDEE data shows persistent ${d.deficit||'8'}% deficit. Confidence: ${d.confidence||65}%. Recommendation: +${d.amount||200} kcal/day. Supporting trend available if you want it.`,
    perfectionist: d => `This is the algorithm doing exactly what it should. Adding ${d.amount||200} calories is a precision adjustment — not a setback. You're doing this right.`,
    coaster:       d => `Add ${d.amount||200} calories. Under-eating is what's holding the algorithm back.`,
    craftsman:     d => `+${d.amount||200} kcal correction for ${d.days||14}-day deficit accumulation. Watch strength output as primary TDEE accuracy signal.`,
  },
  calorie_decrease: {
    analyzer:      d => `${d.days||14}-day surplus confirmed (${d.surplus||'~8'}% above TDEE). Adjustment: -${d.amount||200} kcal/day. Projected impact: ${d.impact||'~0.3'} lbs/week.`,
    believer:      d => `Small tweak — pull back ${d.amount||200} calories and your results are going to click into place. You're close.`,
    skeptic:       d => `${d.days||14}-day surplus signal. Recommendation: -${d.amount||200} kcal/day. Confidence: ${d.confidence||65}%. Check the trend data if you want to verify.`,
    perfectionist: d => `A small adjustment — nothing to worry about. Trimming ${d.amount||200} calories keeps everything perfectly on track.`,
    coaster:       d => `Cut ${d.amount||200} calories. The surplus is why the scale isn't moving.`,
    craftsman:     d => `Surplus confirmed over ${d.days||14} days. Pull -${d.amount||200} kcal. Monitor weekly delta before next adjustment.`,
  },
  weight_stall: {
    analyzer:      d => `Weight variance: ${d.range||'<1.5'} lbs/${d.days||14} days. Stall classification: ${d.type||'retention/adaptation'}. TDEE recalibration queued.`,
    believer:      _d => `The scale paused — but your body hasn't. This is a normal phase and it breaks. Stay consistent and it moves.`,
    skeptic:       d => `${d.days||14}-day stall confirmed (${d.range||'<1.5'} lb variance). Possible causes: water retention, metabolic adaptation, measurement error. What's your read on the ground?`,
    perfectionist: _d => `Stalls are expected and normal at this stage. Keep your routine exactly as it is — the scale will move.`,
    coaster:       _d => `Scale is flat. Log consistently for 7 days so the algorithm can recalibrate.`,
    craftsman:     d => `${d.days||14}-day plateau. Check sodium and training volume first — both are common confounders. If diet's clean, try a short refeed.`,
  },
  sleep_low: {
    analyzer:      d => `Sleep avg: ${d.avg||6.2}h over ${d.days||7} days (target: 7h). Estimated cortisol elevation: +${d.pct||15}%. TDEE compensation active.`,
    believer:      d => `Your body recovers at night. ${d.avg||6.2} hours isn't quite enough to support everything you're building. Protect tonight.`,
    skeptic:       d => `Sleep avg ${d.avg||6.2}h. Evidence: <7h correlates with 15% cortisol increase, elevated ghrelin, slower fat oxidation. This is likely in your numbers.`,
    perfectionist: d => `You're doing everything right with nutrition and training. Sleep is the one area to shore up — ${d.avg||6.2}h isn't matching your effort level yet.`,
    coaster:       d => `${d.avg||6.2}h sleep average. That's why recovery is slow. Fix the sleep first.`,
    craftsman:     d => `Sleep deficit: ${d.avg||6.2}h avg. Expect 5–10% performance degradation, impaired protein synthesis. Address before increasing training load.`,
  },
  great_week: {
    analyzer:      d => `Week summary: ${d.adherence||95}% adherence, ${d.sessions||4} sessions, ${d.change||'-0.7'} lbs net. Trajectory: on target.`,
    believer:      d => `That was a week. You showed up every day and it shows — ${d.sessions||4} sessions, ${d.change||'-0.7'} lbs. This is what progress looks like.`,
    skeptic:       d => `Data: ${d.adherence||95}% macro adherence, ${d.sessions||4} sessions logged, ${d.change||'-0.7'} lbs net. All signals trending positive.`,
    perfectionist: d => `${d.adherence||95}% adherence. Nearly perfect. These are the habits that compound — you're building them right.`,
    coaster:       d => `Good week: ${d.sessions||4} sessions, ${d.change||'-0.7'} lbs. Do it again.`,
    craftsman:     d => `Strong block: ${d.sessions||4} sessions, ${d.vol_delta||'+6'}% volume trend, ${d.change||'-0.7'} lbs. Maintain the progression scheme.`,
  },
  missed_day: {
    analyzer:      _d => `Single-day gap detected. Impact on 30-day trend: negligible. Resume logging today to maintain algorithm accuracy.`,
    believer:      _d => `Yesterday slipped — and that's okay. It doesn't undo your work. Today is a clean slate.`,
    skeptic:       _d => `One missed day has minimal statistical impact on the trend. The aggregate is the signal, not individual points.`,
    perfectionist: _d => `Missing one day changes nothing meaningful. Your long-run consistency is what matters — and that's excellent. Come back today.`,
    coaster:       _d => `Log today. One missed day is fine. Don't let it become a week.`,
    craftsman:     _d => `Single data gap — no trend impact. Maintain logging cadence.`,
  },
  plateau_panic: {
    analyzer:      d => `${d.days||14}-day plateau with calorie variance ${d.swings||'>600 kcal/day'}. Recommendation: standardize intake for 7 days, then reassess TDEE.`,
    believer:      _d => `The plateau is temporary. Your body is adapting — that's a sign of real change happening underneath. Stay steady.`,
    skeptic:       d => `${d.days||14}-day stall + calorie swings detected. Swings are likely extending the plateau. 7-day consistent intake is the diagnostic test.`,
    perfectionist: _d => `You haven't done anything wrong. Plateaus happen to everyone who trains seriously. Stay the course — the formula works.`,
    coaster:       _d => `Scale stalled because intake isn't consistent. Seven days of hitting your number will break it.`,
    craftsman:     d => `${d.days||14}-day plateau + deficit cycling. This is disrupting leptin adaptation. Standardize for a week, then reassess.`,
  },
  // train → fuel: voices today's macro target as a consequence of today's training.
  // data: {session, carbDelta, kcalDelta, proteinHeld, underTarget}. carbDelta null = no
  // baseline derivable; carbDelta<=0 = rest/recovery day. Branches on underTarget for the 2-state.
  train_to_fuel: {
    analyzer: d => {
      const S=d.session||'Training day',s=_lc(d.session);
      if(d.carbDelta==null) return d.underTarget?`Today's a bigger day than rest, and you're still under on carbs. Keep eating.`:`Today's numbers match your ${s}. You're on target.`;
      if(d.carbDelta<=0) return `Rest day: carbs down${d.kcalDelta?`, about ${Math.abs(d.kcalDelta)} fewer calories than a training day`:''}, protein steady${d.proteinG?` at ${d.proteinG}g`:''}.`;
      return `${S} adds up: +${d.carbDelta}g carbs, +${d.kcalDelta} calories vs a rest day.${d.proteinG?` Protein stays at ${d.proteinG}g.`:''}${d.underTarget?` You're still under on carbs.`:` You've hit your carb target.`}`;
    },
    believer: d => {
      const S=d.session||'Training day',s=_lc(d.session);
      if(d.carbDelta!=null&&d.carbDelta<=0) return `Rest day — let your body rebuild. Protein stays steady, and that's exactly what recovery needs.`;
      if(d.carbDelta==null) return d.underTarget?`${S} takes a lot out of you — keep eating, you've still got more to give.`:`You fueled ${s} just right today. Love to see it.`;
      return d.underTarget?`You crushed ${s} today, so I bumped your carbs ${d.carbDelta}g. Go fuel that comeback — you've still got room.`:`You crushed ${s} and fueled it right — a full ${d.carbDelta}g more carbs. That's how progress is built. Nailed it.`;
    },
    skeptic: d => {
      const s=_lc(d.session);
      if(d.carbDelta!=null&&d.carbDelta<=0) return `Lower demand today, so carbs come down a bit and protein holds. That's the reasoning — adjust if it doesn't feel right.`;
      if(d.carbDelta==null) return `Your ${s} likely needs more fuel than a rest day. ${d.underTarget?'Keep eating to hit it.':'Looks covered.'} Adjust if your recovery lags.`;
      return `Your ${s} burns more carbs, so today's target is up ${d.carbDelta}g${d.kcalDelta?` (${d.kcalDelta} more calories)`:''}. It's an estimate — adjust if you're not recovering.${d.underTarget?` You're under it right now.`:` You've reached it.`}`;
    },
    perfectionist: d => {
      const S=d.session||'Training day',s=_lc(d.session);
      if(d.carbDelta!=null&&d.carbDelta<=0) return `Rest day, so carbs ease back — and that's exactly right, not a step back. Protein stays steady. You're doing this well.`;
      if(d.carbDelta==null) return d.underTarget?`${S} asks a little more of you — fuel it when you can. The overall week matters most.`:`You matched your ${s} nicely. Right on track.`;
      return d.underTarget?`${S}, so carbs are up ${d.carbDelta}g. This is the plan working — hit it when you can, the week is what matters.`:`${S}, so carbs are up ${d.carbDelta}g, and you've hit it. Consistency like this is what counts.`;
    },
    coaster: d => {
      const S=d.session||'Training day';
      if(d.carbDelta!=null&&d.carbDelta<=0) return `Rest day. Carbs come down a bit, protein stays the same. Eat to your number.`;
      if(d.carbDelta==null) return d.underTarget?`${S}. You're under on carbs — keep eating to hit today's target.`:`${S}. Carbs are hit. Done.`;
      return d.underTarget?`${S}. Eat ${d.carbDelta}g more carbs today — that's the fuel the work needs. Not there yet.`:`${S}. ${d.carbDelta}g more carbs today, and you've already hit it. Done.`;
    },
    craftsman: d => {
      const S=d.session||'Training day',s=_lc(d.session);
      if(d.carbDelta!=null&&d.carbDelta<=0) return `Rest day: carbs down${d.kcalDelta?`, ${Math.abs(d.kcalDelta)} fewer calories`:''}, protein held${d.proteinG?` at ${d.proteinG}g`:''} so you keep muscle while you recover.`;
      if(d.carbDelta==null) return `Your ${s} needs more fuel than a rest day.${d.underTarget?' Still short — keep eating.':' Looks covered.'} Watch how recovery goes.`;
      return `${S}: +${d.carbDelta}g carbs, +${d.kcalDelta} calories vs rest${d.proteinG?`, protein held at ${d.proteinG}g to keep muscle`:''}.${d.underTarget?` Still some carbs to go — watch how your next session feels.`:` You've hit it — watch how your next session feels.`}`;
    },
  },
};

// ─── Emotional-tone moments (warm↔tough) ─────────────────────────────────────
// SIBLING to the T-map above — NOT merged. Base-copy selector: emotional tone picks
// the substance/warmth; the cognitive RULES then modify wording on top. Keyed
// (moment × tone). adaptMessageSync reads TONE_MOMENTS[context.moment][tone] BEFORE the
// cognitive confidence gate, so a seeded tone fires day one. Values are plain strings
// with {token} placeholders (e.g. {lift}, {number}) that the CALLER fills with user data.
const TONE_MOMENTS = {
  pr: {
    nurture: "Look at that — a new best on your {lift}. Do you see what you just did? That's not luck, that's the work showing up. Take a second and actually feel good about this one. You earned every pound.",
    balanced: "New {lift} PR — {number}. That's a real marker, and the progression's working exactly like it should. Logged. Now we build from here.",
    drive: "New PR on {lift}. Good. You know what that means? The old you is gone. That number you were scared of is your warm-up now. Don't celebrate too long — that's the new floor. Next week we take more."
  },
  disappeared_1: {
    nurture: "Hey — it's been a couple days, and that's completely okay. No guilt here. Whenever you're ready, I'm right here and we just start again.",
    balanced: "Couple days off. Happens to everyone, not worth a second thought. One session today and you're back in rhythm.",
    drive: "Couple days quiet. Alright. The clock doesn't care about the days you missed — only what you do next. Get one in today."
  },
  disappeared_2: {
    nurture: "Still here whenever you are. No pressure, no lost ground — just one small session to shake off the rust. That's all it takes to feel like yourself again.",
    balanced: "Few days now. Don't try to make up for it, don't overthink it. Just log one thing today — the rhythm comes back on its own.",
    drive: "Where you been? Doesn't matter — excuses don't build anything. One session. Today. No more hiding."
  },
  disappeared_3: {
    nurture: "You started this for a reason, and that reason is still true. It's still waiting for you, and so am I. One step back in — today's a good day for it.",
    balanced: "A week out. This is the point where it's easy to drift or easy to restart — your call. One session flips it. Let's do that.",
    drive: "A week gone. This is the moment most people quit for good. You're not most people — prove it. One session, right now. Start the comeback."
  },
  fried: {
    nurture: "I've been watching your numbers, and your body's asking for a break. Your recovery's low and you've put in real work. Today, rest is the smart move — it's part of the plan too, and you've earned it. Come back stronger tomorrow.",
    balanced: "HRV's down, sleep's short. You're carrying real fatigue — that's just what the data says. Training hard today digs the hole deeper. Take it easy or take it off. Back off today, train better tomorrow. Simple call.",
    drive: "Stop. Your numbers are trash and you know it. You think grinding today makes you tough? It makes you stupid. The strong move — the one nobody has the guts for — is to rest when your body's screaming and come back to punish it tomorrow. Sit down today. That's an order. Tomorrow you go to war."
  },
  plateau: {
    nurture: "Plateaus are normal, and this isn't your fault. Your body's adapting, which actually means it's working. We just change the input — this is fixable, and we'll fix it together.",
    balanced: "Scale's been flat two weeks. That's a signal, not a failure — bodies adapt. Time to adjust the plan. Nothing's wrong; something just needs to change.",
    drive: "Stalled. Plateaus don't break because you complain about them — they break when you change the stimulus. So we change it. No panic, no quitting. Adjust and attack."
  },
  showed_up: {
    nurture: "You slept badly and still showed up. Do you know how rare that is? That's the exact thing that builds a habit that lasts. I'm proud of you for this one.",
    balanced: "Rough night's sleep and you trained anyway. That's the consistency that actually moves the needle — not the perfect days, the stubborn ones. Noted.",
    drive: "Slept like garbage and showed up anyway. THAT'S who you're becoming. Anyone trains when it's easy. You trained when it wasn't. Remember this one — this is the rep that counts."
  },
  near_why: {
    nurture: "You're getting close to what you set out for. Remember why you started — that reason's still real, and it's working. You're almost there, and you did this.",
    balanced: "You're on track for your goal. The plan's working and the numbers back it up. Keep the momentum — this is the part where consistency pays off.",
    drive: "Goal's in sight. Here's where most people ease off and coast to the finish. You don't. This is where you press harder, not softer. Finish what you started."
  }
};

// why → emotional-tone seed (onboarding). aesthetic (and performance) → balanced is a
// DELIBERATE safety default: never auto-assign Drive to appearance-motivated users.
export function mapWhyToTone(why) {
  if (why === 'health' || why === 'confidence') return 'nurture';
  if (why === 'compete' || why === 'discipline') return 'drive';
  return 'balanced';
}

const _hasToken = s => typeof s === 'string' && /\{\w+\}/.test(s);

// ─── Contextual message builder (shared render core) ──────────────────────────
// The SINGLE place that turns a (moment, tone, data) triple into a finished string.
// Both the notification bridge and the in-app tone preview call this so they can
// never drift. Resolves TONE_MOMENTS[moment][profile.emotionalTone] (balanced
// fallback), fills {token} placeholders from `data`, then runs the token guardrail:
// if any {token} survives the fill, fall back to a token-free variant of the same
// moment, or return null (skip) rather than ship a message with a raw "{lift}" in it.
// Pure and gate-free — tone is user-chosen, not inferred, so it fires from day one.
export function buildContextualMessage(moment, profile, data = {}) {
  const bucket = moment && TONE_MOMENTS[moment];
  if (!bucket) return null;

  const tone = profile?.emotionalTone || 'balanced';
  const raw  = bucket[tone] || bucket.balanced;
  if (typeof raw !== 'string' || !raw) return null;

  const filled = raw.replace(/\{(\w+)\}/g, (m, k) =>
    (data[k] != null && data[k] !== '') ? String(data[k]) : m);

  // Guardrail: a clean fill (no surviving {token}) ships as-is.
  if (!_hasToken(filled)) return filled;

  // A token went unfilled → never surface a broken placeholder. Prefer any
  // token-free variant of this moment (selected tone first), else skip.
  const tokenFree = [bucket[tone], bucket.balanced, bucket.nurture, bucket.drive]
    .find(s => typeof s === 'string' && s && !_hasToken(s));
  return tokenFree || null;
}

// ─── Sync adaptation ──────────────────────────────────────────────────────────

export function adaptMessageSync(rawMessage, profile, context = {}) {
  if (!profile) return rawMessage;

  // ── Layer 1: emotional TONE selects the base copy. Seeded, NOT inferred → NO gate. ──
  let base = rawMessage;
  const tone = profile.emotionalTone || 'balanced';
  if (context.moment && TONE_MOMENTS[context.moment]) {
    const tf = TONE_MOMENTS[context.moment][tone] || TONE_MOMENTS[context.moment].balanced;
    if (tf) base = typeof tf === 'function' ? tf(context.data || {}) : tf;
  }
  if (!base) return rawMessage;

  // ── Layer 2: cognitive TYPE modifies the base. Inferred → keep the confidence gates. ──
  const type = profile.manualOverride || profile.primaryType || 'balanced';
  if (type === 'balanced' || (profile.confidence ?? 0) < 20) return base; // scoped: skip cognitive only

  // Legacy scenario path (no tone moment): T-map full replacement — unchanged behavior.
  if (!context.moment && context.scenario && T[context.scenario]) {
    const fn = T[context.scenario][type];
    if (fn) return fn(context.data || {});
  }

  // Tone-moment (or non-scenario) path: cognitive RULES MODIFY the tone base.
  return applyRules(base, type, profile.confidence ?? 0, context);
}

export async function adaptMessage(rawMessage, userId, context = {}) {
  const profile = await getPersonalityProfile(userId);
  return adaptMessageSync(rawMessage, profile, context);
}

// ─── Rule-based text transformation ──────────────────────────────────────────

const RULES = {
  analyzer: {
    strip:    ['amazing', 'incredible', 'fantastic', 'awesome'],
    soften:   {},
    prefixes: [],
    suffixes: [],
    directify: false,
  },
  believer: {
    strip:    [],
    soften:   {},
    prefixes: ["You've got this. ", "Keep going. ", "You're doing great. "],
    suffixes: [" You've got this."],
    directify: false,
  },
  skeptic: {
    strip:    [],
    soften:   {},
    prefixes: [],
    suffixes: [" — that's the data. What's your read?"],
    directify: false,
  },
  perfectionist: {
    strip:    ['warning', 'alert'],
    soften:   { warning: 'heads up', alert: 'note', problem: 'thing to address', issue: 'area to look at' },
    prefixes: ["This is normal. ", "You're still on track. "],
    suffixes: [],
    directify: false,
  },
  coaster: {
    strip:    [],
    soften:   {},
    prefixes: [],
    suffixes: [],
    directify: true,
  },
  craftsman: {
    strip:    ['probably', 'it seems like', 'it looks like'],
    soften:   {},
    prefixes: [],
    suffixes: [],
    directify: false,
  },
};

function applyRules(text, type, confidence, context) {
  if (confidence < 35) return text;
  const r = RULES[type];
  if (!r) return text;
  let t = text;
  for (const w of r.strip) t = t.replace(new RegExp(`\\b${w}\\b`, 'gi'), '').replace(/\s{2,}/g, ' ');
  for (const [find, repl] of Object.entries(r.soften)) t = t.replace(new RegExp(`\\b${find}\\b`, 'gi'), repl);
  if (r.directify) {
    t = t.replace(/\bmight want to\b/gi, 'should')
         .replace(/\bcould consider\b/gi, 'should')
         .replace(/\bperhaps\b/gi, '')
         .replace(/\bpossibly\b/gi, '')
         .replace(/\bit may be worth\b/gi, '');
  }
  if (r.prefixes.length && context.addPrefix !== false) {
    const idx = Math.abs(strhash(text)) % r.prefixes.length;
    t = r.prefixes[idx] + t;
  }
  if (r.suffixes.length && context.addSuffix !== false) t = t.trimEnd() + r.suffixes[0];
  return t.replace(/\s{2,}/g, ' ').trim();
}

function strhash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

// ─── Learning from responses ──────────────────────────────────────────────────

export async function learnFromResponse(userId, messageId, variantType, userAction) {
  if (!userId) return;
  try {
    await sb.from('message_outcomes').insert({
      user_id: userId, message_id: messageId, variant_type: variantType, user_action: userAction,
    });
    const { data: recent } = await sb.from('message_outcomes')
      .select('variant_type, user_action').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(20);
    if (!recent?.length) return;
    const byType = {};
    for (const r of recent) {
      if (!byType[r.variant_type]) byType[r.variant_type] = { acted: 0, n: 0 };
      byType[r.variant_type].n++;
      if (r.user_action === 'acted') byType[r.variant_type].acted++;
    }
    const cur      = byType[variantType];
    const curRate  = cur ? cur.acted / cur.n : 1;
    const hasBetter = Object.entries(byType).some(([t, v]) => t !== variantType && v.n >= 3 && v.acted / v.n > 0.6);
    if (curRate < 0.2 && hasBetter) {
      _cache.delete(userId);
      try { localStorage.removeItem(`cm_pers_${userId}`); } catch {}
    }
  } catch {}
}

// ─── Event tracking ───────────────────────────────────────────────────────────

export async function trackUserEvent(userId, eventType, metadata = {}) {
  if (!userId) return;
  try { await sb.from('user_events').insert({ user_id: userId, event_type: eventType, metadata }); } catch {}
}

// ─── Manual override ─────────────────────────────────────────────────────────

export async function setManualOverride(userId, type) {
  if (!userId) return;
  const existing = (await getPersonalityProfile(userId)) || { primaryType: 'balanced', scores: {}, confidence: 0 };
  await savePersonalityProfile(userId, { ...existing, manualOverride: type === 'auto' ? null : type });
}

// Emotional tone (nurture|balanced|drive). User-chosen / onboarding-seeded — exempt from
// the cognitive confidence gates (see adaptMessageSync Layer 1).
export async function setEmotionalTone(userId, tone) {
  if (!userId) return;
  const t = ['nurture', 'balanced', 'drive'].includes(tone) ? tone : 'balanced';
  const existing = (await getPersonalityProfile(userId)) || { primaryType: 'balanced', scores: {}, confidence: 0 };
  await savePersonalityProfile(userId, { ...existing, emotionalTone: t });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getMemberDays(userId) {
  const { data } = await sb.from('profiles').select('created_at').eq('id', userId).single();
  return data?.created_at ? Math.floor((Date.now() - new Date(data.created_at).getTime()) / 864e5) : 0;
}
