import { sb } from '../client.js';

// ─── Context snapshot ─────────────────────────────────────────────────────────

export function buildContextSnapshot({ weightLogs, foodLogs, workoutLogs, macros, profile, healthSnap }) {
  const now = new Date();
  const sevenDaysAgo = new Date(now - 7 * 864e5).toISOString().split('T')[0];

  // Weight trend (7d)
  const recentWeights = (weightLogs || [])
    .filter(l => (l.created_at || '').slice(0, 10) >= sevenDaysAgo)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const wUnit = profile?.wUnit || 'lbs';
  const toLbs = w => parseFloat(w) * (wUnit === 'kg' ? 2.205 : 1);
  const weightTrend7d = recentWeights.length >= 2
    ? toLbs(recentWeights[recentWeights.length - 1].weight) - toLbs(recentWeights[0].weight)
    : null;

  // Food (7d)
  const recentFood = (foodLogs || []).filter(l => l.date >= sevenDaysAgo);
  const dailyCals = recentFood.map(l => (l.entries || []).reduce((s, e) => s + (e.calories || 0), 0)).filter(c => c > 0);
  const avgCals7d = dailyCals.length ? dailyCals.reduce((s, v) => s + v, 0) / dailyCals.length : null;
  const calTarget = macros?.calories || profile?.goalCals || 2000;
  const calDeficitPct = avgCals7d ? (avgCals7d - calTarget) / calTarget : null;
  const dailyProt = recentFood.map(l => (l.entries || []).reduce((s, e) => s + (e.protein || 0), 0));
  const protTarget = macros?.protein || 150;
  const protHitRate = dailyProt.length
    ? dailyProt.filter(p => p >= protTarget * 0.9).length / dailyProt.length
    : null;

  // Training (7d)
  const recentWorkouts = (workoutLogs || []).filter(l => l.date >= sevenDaysAgo);
  const sessions7d = recentWorkouts.length;
  const volume7d = recentWorkouts.reduce((s, l) => s + (l.volume_lbs || 0), 0);

  // Recovery
  const sleepAvg = healthSnap?.sleep ?? null;
  const hrvAvg   = healthSnap?.hrv ?? null;
  const rhrAvg   = healthSnap?.rhr ?? null;

  // Season
  const month = now.getMonth(); // 0-11
  const season = month < 3 ? 'winter' : month < 6 ? 'spring' : month < 9 ? 'summer' : 'fall';

  return {
    weight_trend_7d: weightTrend7d !== null ? parseFloat(weightTrend7d.toFixed(2)) : null,
    avg_calories_7d: avgCals7d ? Math.round(avgCals7d) : null,
    cal_deficit_pct: calDeficitPct !== null ? parseFloat(calDeficitPct.toFixed(3)) : null,
    protein_hit_rate: protHitRate !== null ? parseFloat(protHitRate.toFixed(2)) : null,
    sessions_7d: sessions7d,
    volume_7d_lbs: Math.round(volume7d),
    sleep_avg: sleepAvg,
    hrv_avg: hrvAvg,
    rhr_avg: rhrAvg,
    goal: profile?.goal || null,
    cal_target: calTarget,
    season,
    date: now.toISOString().split('T')[0],
  };
}

// ─── Context similarity ───────────────────────────────────────────────────────

export function contextSimilarityScore(a, b) {
  if (!a || !b) return 0;
  let score = 0;

  // Goal match (15pts)
  if (a.goal && b.goal && a.goal === b.goal) score += 15;

  // Weight trend direction match (20pts)
  if (a.weight_trend_7d !== null && b.weight_trend_7d !== null) {
    const dirA = a.weight_trend_7d > 0.3 ? 'gaining' : a.weight_trend_7d < -0.3 ? 'losing' : 'stalled';
    const dirB = b.weight_trend_7d > 0.3 ? 'gaining' : b.weight_trend_7d < -0.3 ? 'losing' : 'stalled';
    if (dirA === dirB) score += 20;
    else if ((dirA === 'stalled' || dirB === 'stalled')) score += 5;
  }

  // Calorie deficit/surplus level match (15pts)
  if (a.cal_deficit_pct !== null && b.cal_deficit_pct !== null) {
    const diff = Math.abs(a.cal_deficit_pct - b.cal_deficit_pct);
    if (diff < 0.05) score += 15;
    else if (diff < 0.12) score += 8;
    else if (diff < 0.20) score += 3;
    // Same side of maintenance?
    if (Math.sign(a.cal_deficit_pct) === Math.sign(b.cal_deficit_pct)) score += 5;
  }

  // Sleep quality match (15pts)
  if (a.sleep_avg !== null && b.sleep_avg !== null) {
    const qualA = a.sleep_avg >= 75 ? 'good' : a.sleep_avg >= 55 ? 'ok' : 'poor';
    const qualB = b.sleep_avg >= 75 ? 'good' : b.sleep_avg >= 55 ? 'ok' : 'poor';
    if (qualA === qualB) score += 15;
    else if (Math.abs(a.sleep_avg - b.sleep_avg) < 15) score += 7;
  }

  // Training frequency match (10pts)
  if (Math.abs(a.sessions_7d - b.sessions_7d) <= 1) score += 10;
  else if (Math.abs(a.sessions_7d - b.sessions_7d) <= 2) score += 5;

  // HRV match (10pts)
  if (a.hrv_avg !== null && b.hrv_avg !== null) {
    const qualA = a.hrv_avg >= 60 ? 'high' : a.hrv_avg >= 40 ? 'ok' : 'low';
    const qualB = b.hrv_avg >= 60 ? 'high' : b.hrv_avg >= 40 ? 'ok' : 'low';
    if (qualA === qualB) score += 10;
  }

  // Season match (5pts)
  if (a.season === b.season) score += 5;

  return Math.min(100, score);
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function recordMemory(userId, memoryType, context, description, intervention = null, insightType = null) {
  if (!userId || !description) return null;
  const today = new Date().toISOString().split('T')[0];

  // Dedup: if we already have a memory for this type+insightType today, update it
  if (insightType) {
    const { data: existing } = await sb
      .from('coach_memories')
      .select('id')
      .eq('user_id', userId)
      .eq('memory_type', memoryType)
      .eq('date_observed', today)
      .eq('linked_insight_type', insightType)
      .maybeSingle();

    if (existing) {
      await sb.from('coach_memories')
        .update({ context, description, intervention_applied: intervention })
        .eq('id', existing.id);
      return existing.id;
    }
  }

  // Determine tags from context and type
  const tags = deriveTagsFromContext(context, memoryType, insightType);

  const { data, error } = await sb.from('coach_memories').insert({
    user_id: userId,
    memory_type: memoryType,
    date_observed: today,
    context,
    description,
    intervention_applied: intervention,
    tags,
    linked_insight_type: insightType || null,
  }).select('id').single();

  if (error) return null;
  return data?.id;
}

export async function updateMemoryOutcomes(userId) {
  if (!userId) return;

  const today = new Date().toISOString().split('T')[0];
  const lastRunKey = 'cm_outcome_update_' + today;
  if (localStorage.getItem(lastRunKey) === '1') return;
  localStorage.setItem(lastRunKey, '1');

  const windowStart = new Date(Date.now() - 21 * 864e5).toISOString().split('T')[0];
  const windowEnd   = new Date(Date.now() - 7  * 864e5).toISOString().split('T')[0];

  const { data: memories } = await sb
    .from('coach_memories')
    .select('*')
    .eq('user_id', userId)
    .in('memory_type', ['plateau', 'setback', 'intervention'])
    .gte('date_observed', windowStart)
    .lte('date_observed', windowEnd)
    .is('outcome_recorded_at', null);

  if (!memories?.length) return;

  // Fetch current signals for comparison
  const since = windowStart;
  const [{ data: bwLogs }, { data: foodLogs }, { data: bioData }] = await Promise.all([
    sb.from('bodyweight_logs').select('weight,date,created_at').eq('user_id', userId).gte('created_at', since).order('created_at'),
    sb.from('food_logs').select('date,entries').eq('user_id', userId).gte('date', since),
    sb.from('bio_data_points').select('metric,output_value,recorded_at').eq('user_id', userId).gte('recorded_at', since).order('recorded_at'),
  ]);

  for (const mem of memories) {
    const ctx = mem.context || {};
    let outcome = null;
    let effectiveness = 50;

    if (mem.memory_type === 'plateau' || mem.linked_insight_type === 'weight_trend') {
      // Did weight start moving?
      const toLbs = (w) => parseFloat(w);  // weight stored in user's unit; delta direction still valid
      const recent = (bwLogs || []).filter(l => (l.date || l.created_at?.slice(0,10)) > mem.date_observed).slice(-5);
      if (recent.length >= 2) {
        const change = toLbs(recent[recent.length - 1].weight) - toLbs(recent[0].weight);
        if (Math.abs(change) > 0.8) {
          outcome = `Weight began moving (${change > 0 ? '+' : ''}${change.toFixed(1)} lbs over ${recent.length} readings)`;
          effectiveness = Math.min(95, 60 + Math.round(Math.abs(change) * 10));
        } else {
          outcome = 'Weight remains relatively stable';
          effectiveness = 30;
        }
      }
    } else if (mem.linked_insight_type === 'calorie_intake') {
      const recentFood = (foodLogs || []).filter(l => l.date > mem.date_observed);
      if (recentFood.length >= 3) {
        const avgCals = recentFood.reduce((s, l) => s + (l.entries || []).reduce((ss, e) => ss + (e.calories || 0), 0), 0) / recentFood.length;
        const prevAvg = ctx.avg_calories_7d || 0;
        const improvement = avgCals - prevAvg;
        if (Math.abs(improvement) > 150) {
          outcome = `Calorie intake shifted ${improvement > 0 ? 'up' : 'down'} ~${Math.abs(Math.round(improvement))} kcal/day`;
          effectiveness = Math.min(90, 55 + Math.round(Math.abs(improvement) / 20));
        } else {
          outcome = 'Calorie pattern unchanged';
          effectiveness = 25;
        }
      }
    } else if (mem.linked_insight_type === 'recovery') {
      const recentSleep = (bioData || [])
        .filter(b => b.metric === 'sleep_performance' && b.created_at?.slice(0, 10) > mem.date_observed)
        .slice(-7);
      if (recentSleep.length >= 3) {
        const avg = recentSleep.reduce((s, b) => s + parseFloat(b.output_value || 70), 0) / recentSleep.length;
        const prev = ctx.sleep_avg || 65;
        if (avg - prev > 8) {
          outcome = `Sleep performance improved from ${Math.round(prev)}% to ${Math.round(avg)}%`;
          effectiveness = Math.min(95, 65 + Math.round((avg - prev)));
        } else {
          outcome = 'Recovery signals unchanged';
          effectiveness = 30;
        }
      }
    }

    if (outcome) {
      await sb.from('coach_memories').update({
        outcome,
        effectiveness_score: effectiveness,
        outcome_recorded_at: new Date().toISOString(),
      }).eq('id', mem.id);
    }
  }
}

export async function deleteMemory(userId, memoryId) {
  if (!userId || !memoryId) return;
  await sb.from('coach_memories').delete().eq('id', memoryId).eq('user_id', userId);
}

export async function getAllMemories(userId, limit = 20) {
  if (!userId) return [];
  const { data } = await sb
    .from('coach_memories')
    .select('*')
    .eq('user_id', userId)
    .order('date_observed', { ascending: false })
    .limit(limit);
  return data || [];
}

export async function getUserPatterns(userId) {
  if (!userId) return [];
  const { data } = await sb
    .from('coach_memories')
    .select('*')
    .eq('user_id', userId)
    .eq('memory_type', 'pattern')
    .order('date_observed', { ascending: false })
    .limit(10);
  return data || [];
}

export async function exportMemories(userId) {
  const memories = await getAllMemories(userId, 500);
  return JSON.stringify(memories, null, 2);
}

// ─── Recall ───────────────────────────────────────────────────────────────────

export async function findSimilarPastMemories(userId, currentContext, memoryTypes = ['plateau','setback'], limit = 5) {
  if (!userId) return [];

  const sixMonthsAgo = new Date(Date.now() - 180 * 864e5).toISOString().split('T')[0];
  const { data: memories } = await sb
    .from('coach_memories')
    .select('*')
    .eq('user_id', userId)
    .in('memory_type', memoryTypes)
    .gte('date_observed', sixMonthsAgo)
    .order('date_observed', { ascending: false })
    .limit(50);

  if (!memories?.length) return [];

  // Score each memory against current context
  const scored = memories
    .map(m => ({ ...m, similarity: contextSimilarityScore(currentContext, m.context || {}) }))
    .filter(m => m.similarity >= 30)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return scored;
}

export async function recallApplicableLearnings(userId, insightType, currentContext) {
  if (!userId) return null;

  const memTypeMap = {
    weight_trend: ['plateau', 'setback'],
    calorie_intake: ['setback'],
    training_progress: ['plateau', 'setback'],
    recovery: ['setback'],
  };
  const types = memTypeMap[insightType] || ['plateau', 'setback'];

  const similar = await findSimilarPastMemories(userId, currentContext, types, 5);
  if (!similar.length) return null;

  // For each similar memory, assess if its intervention is still applicable
  const enriched = similar.map(mem => {
    const pastCtx = mem.context || {};
    const tags = mem.tags || [];

    // Determine causal signal from past memory
    const causalSignal = deriveCausalSignal(tags, pastCtx, insightType);
    const causalNowActive = checkCausalSignalActive(causalSignal, currentContext);

    // Context differences
    const diffs = buildContextDifferences(pastCtx, currentContext);

    const daysSince = Math.round(
      (Date.now() - new Date(mem.date_observed).getTime()) / 864e5
    );

    return {
      id: mem.id,
      date: formatRelativeDate(mem.date_observed),
      memory_type: mem.memory_type,
      description: mem.description,
      intervention: mem.intervention_applied,
      outcome: mem.outcome,
      effectiveness: mem.effectiveness_score,
      similarity: mem.similarity,
      days_since: daysSince,
      causal_signal: causalSignal,
      still_applicable: causalNowActive,
      applicability_reason: causalNowActive
        ? `${causalSignal.label} is still elevated — the same root cause appears present`
        : `${causalSignal.label} was the issue then, but it looks normal now`,
      context_differences: diffs,
    };
  });

  // The most applicable memories (causal signal still active)
  const applicable = enriched.filter(m => m.still_applicable && m.intervention && m.effectiveness > 40);
  const notApplicable = enriched.filter(m => !m.still_applicable);

  // What's different this time vs the most similar memory
  const topMemory = enriched[0];
  const differences = topMemory ? topMemory.context_differences : [];

  // Generate intelligent suggestion
  const suggestion = buildIntelligentSuggestion(insightType, applicable, notApplicable, currentContext, differences);

  return {
    current_situation: describeSituation(insightType, currentContext),
    similar_past: enriched.slice(0, 3),
    what_is_different: differences.slice(0, 4),
    intelligent_suggestion: suggestion,
    confidence: similar.length >= 3 ? 75 : similar.length === 2 ? 55 : 40,
    has_applicable_history: applicable.length > 0,
  };
}

// ─── Pattern detection ────────────────────────────────────────────────────────

export async function detectRecurringPatterns(userId) {
  if (!userId) return;

  const lastRunKey = 'cm_pattern_detect_' + new Date().toISOString().split('T')[0];
  if (localStorage.getItem(lastRunKey) === '1') return;

  const sixMonthsAgo = new Date(Date.now() - 180 * 864e5).toISOString().split('T')[0];
  const { data: memories } = await sb
    .from('coach_memories')
    .select('*')
    .eq('user_id', userId)
    .in('memory_type', ['plateau', 'setback', 'breakthrough'])
    .gte('date_observed', sixMonthsAgo)
    .order('date_observed');

  if (!memories || memories.length < 3) return;
  localStorage.setItem(lastRunKey, '1');

  const patterns = [];

  // Pattern 1: Recurring signal correlation
  const tagCounts = {};
  memories.forEach(m => {
    (m.tags || []).forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
  });
  for (const [tag, count] of Object.entries(tagCounts)) {
    if (count >= 2) {
      const tagMemories = memories.filter(m => (m.tags || []).includes(tag));
      const avgEffectiveness = tagMemories
        .filter(m => m.effectiveness_score != null)
        .reduce((s, m) => s + m.effectiveness_score, 0) /
        Math.max(1, tagMemories.filter(m => m.effectiveness_score != null).length);

      patterns.push({
        tag,
        count,
        label: TAG_LABELS[tag] || tag,
        avg_effectiveness: avgEffectiveness,
        description: `${tag.replace(/_/g, ' ')} has appeared in ${count} separate events`,
      });
    }
  }

  // Pattern 2: Seasonal pattern (same month recurring)
  const byMonth = {};
  memories.forEach(m => {
    const month = new Date(m.date_observed).getMonth();
    (byMonth[month] = byMonth[month] || []).push(m);
  });
  for (const [month, mems] of Object.entries(byMonth)) {
    if (mems.length >= 2) {
      const monthName = new Date(2024, parseInt(month), 1).toLocaleDateString('en-US', { month: 'long' });
      patterns.push({
        tag: `seasonal_${month}`,
        count: mems.length,
        label: `${monthName} pattern`,
        description: `You've had ${mems.length} notable events in ${monthName} across different years`,
      });
    }
  }

  // Store top patterns (avoid duplicates by checking existing)
  const existing = await getUserPatterns(userId);
  const existingLabels = new Set(existing.map(p => p.context?.tag || ''));

  for (const pattern of patterns.sort((a, b) => b.count - a.count).slice(0, 5)) {
    if (existingLabels.has(pattern.tag)) continue;
    const today = new Date().toISOString().split('T')[0];
    await sb.from('coach_memories').upsert({
      user_id: userId,
      memory_type: 'pattern',
      date_observed: today,
      context: pattern,
      description: pattern.description,
      tags: [pattern.tag],
    }, { onConflict: 'user_id,memory_type,date_observed,linked_insight_type' }).then(() => {}, () => {});
  }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

const TAG_LABELS = {
  sleep_related: 'Sleep quality',
  hrv_low: 'Low HRV',
  overtraining: 'Overtraining',
  undereating: 'Under-eating',
  protein_low: 'Low protein',
  stress_elevated: 'Elevated stress',
  calorie_deficit_aggressive: 'Aggressive deficit',
  volume_high: 'High training volume',
  stalled_weight: 'Weight stall',
};

function deriveTagsFromContext(context, memoryType, insightType) {
  const tags = [];
  if (insightType) tags.push(insightType + '_event');
  if (context.sleep_avg !== null && context.sleep_avg < 60) tags.push('sleep_related');
  if (context.hrv_avg !== null && context.hrv_avg < 40) tags.push('hrv_low');
  if (context.sessions_7d >= 6) tags.push('overtraining');
  if (context.cal_deficit_pct !== null && context.cal_deficit_pct < -0.20) tags.push('calorie_deficit_aggressive');
  if (context.avg_calories_7d !== null && context.avg_calories_7d < (context.cal_target || 2000) * 0.75) tags.push('undereating');
  if (context.protein_hit_rate !== null && context.protein_hit_rate < 0.4) tags.push('protein_low');
  if (context.weight_trend_7d !== null && Math.abs(context.weight_trend_7d) < 0.3) tags.push('stalled_weight');
  if (context.volume_7d_lbs > 50000) tags.push('volume_high');
  return tags;
}

function deriveCausalSignal(tags, pastCtx, insightType) {
  if (insightType === 'recovery' || tags.includes('sleep_related')) {
    return { key: 'sleep_avg', label: 'Sleep quality', threshold: 65, direction: 'below' };
  }
  if (tags.includes('hrv_low')) {
    return { key: 'hrv_avg', label: 'HRV', threshold: 40, direction: 'below' };
  }
  if (insightType === 'calorie_intake' || tags.includes('undereating')) {
    return { key: 'cal_deficit_pct', label: 'Calorie intake', threshold: -0.15, direction: 'below' };
  }
  if (tags.includes('overtraining') || tags.includes('volume_high')) {
    return { key: 'sessions_7d', label: 'Training volume', threshold: 5, direction: 'above' };
  }
  if (insightType === 'weight_trend' || tags.includes('stalled_weight')) {
    return { key: 'weight_trend_7d', label: 'Weight trend', threshold: 0.3, direction: 'stalled' };
  }
  return { key: 'unknown', label: 'Training signal', threshold: null, direction: 'unknown' };
}

function checkCausalSignalActive(causalSignal, currentCtx) {
  const val = currentCtx[causalSignal.key];
  if (val === null || val === undefined) return false;
  if (causalSignal.direction === 'below') return val < causalSignal.threshold;
  if (causalSignal.direction === 'above') return val > causalSignal.threshold;
  if (causalSignal.direction === 'stalled') return Math.abs(val) < 0.3;
  return false;
}

function buildContextDifferences(pastCtx, currentCtx) {
  const diffs = [];
  const compare = (key, label, fmt, direction = 'neutral') => {
    const a = pastCtx[key], b = currentCtx[key];
    if (a == null || b == null) return;
    const formatted = (v) => fmt ? fmt(v) : String(v);
    const change = typeof a === 'number' && typeof b === 'number' ? b - a : null;
    if (change !== null && Math.abs(change) > 0.001) {
      const mag = Math.abs(change);
      const pct = a !== 0 ? Math.round(Math.abs(change / a) * 100) : null;
      if (pct !== null && pct < 5) return; // ignore tiny differences
      const dir = change > 0 ? 'higher' : 'lower';
      diffs.push(`${label} is ${formatted(b)} now vs ${formatted(a)} then (${dir}${pct ? ` by ${pct}%` : ''})`);
    }
  };

  compare('sessions_7d', 'Training frequency', v => `${v} sessions/week`);
  compare('volume_7d_lbs', 'Training volume', v => `${Math.round(v / 1000)}k lbs`);
  compare('avg_calories_7d', 'Daily calories', v => `${v} kcal`);
  compare('sleep_avg', 'Sleep performance', v => `${Math.round(v)}%`);
  compare('hrv_avg', 'HRV', v => `${Math.round(v)} ms`);
  compare('weight_trend_7d', 'Weight trend', v => `${v > 0 ? '+' : ''}${v} lbs/wk`);

  if (pastCtx.season !== currentCtx.season) {
    diffs.push(`Season has changed (${pastCtx.season} then vs ${currentCtx.season} now)`);
  }

  return diffs;
}

function buildIntelligentSuggestion(insightType, applicable, notApplicable, currentCtx, differences) {
  if (applicable.length > 0) {
    const top = applicable[0];
    return `The same root cause is present now as in ${top.date}: ${top.causal_signal?.label} is elevated. Last time, "${top.intervention}" resolved it in roughly ${top.days_since > 14 ? '2 weeks' : 'under 2 weeks'}. Apply the same fix.`;
  }

  if (notApplicable.length > 0) {
    const top = notApplicable[0];
    const diff = differences[0] || 'training load';
    return `The ${top.date} fix was "${top.causal_signal?.label?.toLowerCase()}" — but that looks normal now. What's different this time: ${diff}. Focus there first.`;
  }

  return `No exact historical match found yet, but patterns are building. The current signals point toward ${insightType.replace(/_/g, ' ')} — trust the data and apply the recommended adjustment.`;
}

function describeSituation(insightType, ctx) {
  switch (insightType) {
    case 'weight_trend': {
      const trend = ctx.weight_trend_7d;
      if (trend === null) return 'Weight trend being analyzed';
      if (Math.abs(trend) < 0.3) return `Weight stalled (${trend > 0 ? '+' : ''}${trend} lbs/week)`;
      return `Weight ${trend > 0 ? 'gaining' : 'losing'} ${Math.abs(trend).toFixed(1)} lbs/week`;
    }
    case 'calorie_intake': return `Calorie intake averaging ${ctx.avg_calories_7d || '?'} kcal/day`;
    case 'training_progress': return `${ctx.sessions_7d} sessions logged this week`;
    case 'recovery': return `Sleep at ${ctx.sleep_avg != null ? Math.round(ctx.sleep_avg) + '%' : '?'}, HRV ${ctx.hrv_avg != null ? Math.round(ctx.hrv_avg) + 'ms' : 'unknown'}`;
    default: return 'Current performance period';
  }
}

function formatRelativeDate(dateStr) {
  const d = new Date(dateStr);
  const daysDiff = Math.round((Date.now() - d.getTime()) / 864e5);
  if (daysDiff < 14) return 'Last week';
  if (daysDiff < 45) return `${Math.round(daysDiff / 7)} weeks ago`;
  if (daysDiff < 90) return 'Last month';
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const year = d.getFullYear();
  const nowYear = new Date().getFullYear();
  return year === nowYear ? month : `${month} ${year}`;
}
