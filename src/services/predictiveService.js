import { sb } from '../client.js';
import { getUpcomingEvents } from './calendarService.js';

// ─── Impact classification ────────────────────────────────────────────────────

const IMPACT_KEYWORDS = {
  social_food: /wedding|dinner|party|reception|birthday|celebration|gala|brunch|barbecue|bbq|feast|banquet|thanksgiving|christmas|holiday/i,
  travel: /flight|travel|hotel|trip|airport|fly|conference|vacation|holiday.*trip/i,
  high_stress: /deadline|presentation|exam|launch|demo|sprint|review|pitch|interview/i,
  recovery: /rest|vacation|spa|massage|holiday.*no.*work/i,
};

export function categorizeEventImpact(event) {
  const title = event.title || '';
  const type  = event.type  || '';

  if (type === 'travel' || IMPACT_KEYWORDS.travel.test(title))       return 'travel';
  if (IMPACT_KEYWORDS.social_food.test(title))                        return 'social_food';
  if (type === 'work_deadline' || IMPACT_KEYWORDS.high_stress.test(title)) return 'high_stress';
  if (type === 'early_morning')                                        return 'schedule_disruption';
  if (type === 'late_night')                                           return 'schedule_disruption';
  if (IMPACT_KEYWORDS.recovery.test(title))                           return 'recovery_enhancing';
  return 'general';
}

// ─── Physiological response prediction ───────────────────────────────────────

export function predictPhysiologicalResponse(event, userProfile, history = []) {
  const impactType = categorizeEventImpact(event);
  const eventDate  = new Date(event.startDate || event.date);
  const dayOfWeek  = eventDate.toLocaleDateString('en-US', { weekday: 'long' });

  // Check historical pattern: did this user respond to similar past events?
  const similarPast = history.filter(h => h.event_type === impactType && h.actual_impact);
  const hasPersonalPattern = similarPast.length >= 2;

  const prediction = {
    impactType,
    eventTitle: event.title,
    eventDate: eventDate.toISOString().split('T')[0],
    dayOfWeek,
    waterGainLbs: 0,
    normalizeDays: 0,
    neatReductionPct: 0,
    sleepImpact: 'neutral',
    cravingRisk: 'low',
    trainingImpact: 'neutral',
    confidence: hasPersonalPattern ? 75 : 45,
    personalizedFromHistory: hasPersonalPattern,
  };

  switch (impactType) {
    case 'social_food':
      prediction.waterGainLbs = hasPersonalPattern
        ? avgFromHistory(similarPast, 'water_gain_lbs', 3.5)
        : 3.5;
      prediction.normalizeDays = 3;
      prediction.cravingRisk = 'high';
      prediction.neatReductionPct = 0;
      prediction.sleepImpact = dayOfWeek === 'Saturday' || dayOfWeek === 'Friday' ? 'slightly_impaired' : 'neutral';
      break;

    case 'travel':
      prediction.waterGainLbs = 2.0;
      prediction.normalizeDays = 4;
      prediction.neatReductionPct = hasPersonalPattern
        ? avgFromHistory(similarPast, 'neat_reduction_pct', 8)
        : 8;
      prediction.sleepImpact = 'impaired';
      prediction.cravingRisk = 'medium';
      prediction.trainingImpact = 'reduced';
      break;

    case 'high_stress':
      prediction.waterGainLbs = 1.5;
      prediction.normalizeDays = 2;
      prediction.neatReductionPct = 5;
      prediction.sleepImpact = 'impaired';
      prediction.cravingRisk = 'high';
      prediction.trainingImpact = 'reduced';
      break;

    case 'schedule_disruption':
      prediction.waterGainLbs = 0.5;
      prediction.normalizeDays = 1;
      prediction.neatReductionPct = 10;
      prediction.sleepImpact = 'slightly_impaired';
      break;

    case 'recovery_enhancing':
      prediction.neatReductionPct = -5; // negative = MORE NEAT (leisure walking etc)
      prediction.sleepImpact = 'enhanced';
      prediction.trainingImpact = 'enhanced';
      prediction.confidence = 55;
      break;

    default:
      prediction.confidence = 30;
  }

  return prediction;
}

// ─── Proactive game plan ─────────────────────────────────────────────────────

export async function generateProactiveAdjustments(userId, profile) {
  if (!userId) return [];

  // Get events for the next 10 days
  let events = [];
  try {
    events = await getUpcomingEvents(10);
  } catch {
    return []; // no calendar access
  }

  if (!events?.length) return [];

  // Fetch historical predictions to personalize
  const { data: history } = await sb
    .from('predictive_events')
    .select('event_type, predicted_impact, actual_impact')
    .eq('user_id', userId)
    .not('actual_impact', 'is', null)
    .limit(20);

  const adjustments = [];

  for (const event of events) {
    const impactType = categorizeEventImpact(event);
    if (impactType === 'general') continue;

    const prediction = predictPhysiologicalResponse(event, profile, history || []);
    const eventDate  = new Date(event.startDate);
    const daysUntil  = Math.ceil((eventDate - Date.now()) / 864e5);

    let rec = null;

    switch (impactType) {
      case 'social_food': {
        const daysToBank = Math.min(daysUntil - 1, 2);
        if (daysToBank > 0) {
          rec = {
            type: 'calorie_bank',
            headline: `${event.title} is ${daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}`,
            body: `Eat ~150–200 kcal under target today${daysToBank > 1 ? ` and tomorrow` : ''} to bank flexibility. The scale will show +${prediction.waterGainLbs.toFixed(1)} lbs Monday — ignore it, it's water.`,
            actionable: `Bank ${150 * daysToBank}–${200 * daysToBank} kcal over the next ${daysToBank} day${daysToBank > 1 ? 's' : ''}.`,
            normalizesBy: addDays(eventDate, prediction.normalizeDays).toLocaleDateString('en-US', { weekday: 'long' }),
            priority: 'medium',
          };
        }
        break;
      }

      case 'travel': {
        const trainBeforeDate = addDays(eventDate, -1).toLocaleDateString('en-US', { weekday: 'long' });
        rec = {
          type: 'training_shift',
          headline: `Travel ${daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}`,
          body: `Move your hardest session to ${trainBeforeDate}. NEAT drops ~${prediction.neatReductionPct}% during travel — sleep quality will dip. Algorithm will adjust TDEE automatically.`,
          actionable: `Train hard ${trainBeforeDate}. Pack protein bars. Expect ${prediction.waterGainLbs.toFixed(1)} lb fluctuation.`,
          priority: 'high',
        };
        break;
      }

      case 'high_stress': {
        rec = {
          type: 'recovery_priority',
          headline: `High-pressure event ${daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}`,
          body: `Cortisol from "${event.title}" may cause water retention and disrupt training quality. Keep training sessions moderate. Prioritize 7.5+ hours of sleep.`,
          actionable: `Reduce training intensity 20–30% around this event. Protect sleep.`,
          priority: 'medium',
        };
        break;
      }

      case 'schedule_disruption': {
        const hour = eventDate.getHours();
        if (hour < 7) {
          rec = {
            type: 'schedule_shift',
            headline: `Early start ${daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}`,
            body: `An early wake-up compresses sleep. Pre-plan a protein-rich meal you can eat quickly. Short NEAT window — even a 10-min walk helps maintain baseline.`,
            actionable: `Prep food tonight. Set an alarm 20 min earlier to allow a short walk.`,
            priority: 'low',
          };
        }
        break;
      }
    }

    if (rec) {
      adjustments.push({ ...rec, event, prediction, daysUntil });
      // Log the prediction to DB (fire and forget)
      logPredictedEvent(userId, event, prediction).catch(() => {});
    }
  }

  // Sort by priority then proximity
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return adjustments
    .sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2) || a.daysUntil - b.daysUntil)
    .slice(0, 3);
}

// ─── Persistence ─────────────────────────────────────────────────────────────

export async function logPredictedEvent(userId, event, prediction) {
  if (!userId || !event?.id) return;
  await sb.from('predictive_events').upsert({
    user_id: userId,
    event_id: String(event.id),
    event_date: prediction.eventDate,
    event_title: event.title,
    event_type: prediction.impactType,
    predicted_impact: prediction,
  }, { onConflict: 'user_id,event_id' });
}

export async function recordActualImpact(userId, eventId, actualImpact) {
  if (!userId || !eventId) return;
  await sb.from('predictive_events')
    .update({ actual_impact: actualImpact })
    .eq('user_id', userId)
    .eq('event_id', eventId);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function avgFromHistory(history, field, fallback) {
  const vals = history
    .map(h => h.actual_impact?.[field])
    .filter(v => typeof v === 'number');
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : fallback;
}
