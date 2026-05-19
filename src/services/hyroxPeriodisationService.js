const PHASES = [
  { key: 'taper',     label: 'TAPER',            weeks: 3,  color: '#FF6B35', description: 'Race week prep — reduce volume, sharpen speed.' },
  { key: 'peak',      label: 'PEAK',              weeks: 8,  color: '#FF3B30', description: 'Race-pace work, full station runs, race simulations.' },
  { key: 'race_prep', label: 'RACE PREP',         weeks: 12, color: '#FF9500', description: 'Combine strength + cardio, station complexes, threshold runs.' },
  { key: 'strength',  label: 'STATION STRENGTH',  weeks: 16, color: '#AF52DE', description: 'Build station-specific strength and aerobic base.' },
  { key: 'base',      label: 'BASE FITNESS',      weeks: Infinity, color: '#34C759', description: 'General fitness foundation — running economy and work capacity.' },
];

export function getHyroxPhase(raceDate) {
  if (!raceDate) return null;
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksUntilRace = Math.ceil((new Date(raceDate) - new Date()) / msPerWeek);

  let phase;
  if (weeksUntilRace <= 3)  phase = PHASES[0];
  else if (weeksUntilRace <= 8)  phase = PHASES[1];
  else if (weeksUntilRace <= 12) phase = PHASES[2];
  else if (weeksUntilRace <= 16) phase = PHASES[3];
  else phase = PHASES[4];

  return { ...phase, weeksUntilRace };
}

function timeToSeconds(t) {
  if (!t) return null;
  const parts = String(t).split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(parts[0]);
}

function secondsToTime(s) {
  if (!s || s <= 0) return '--:--';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

const STATION_NAMES = [
  'SkiErg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump',
  'Rowing', 'Farmers Carry', 'Sandbag Lunges', 'Wall Balls',
];

function getBaseEstimate(profile) {
  const category = profile?.hyrox_category || 'open';
  const exp = profile?.hyrox_experience;
  const bases = {
    pro_men: 3900, pro_women: 4500,
    elite_men: 4200, elite_women: 4800,
    open: 5400,
  };
  let base = bases[category] || 5400;
  if (exp === 'first_race') base += 600;
  if (exp === 'training_only') base += 900;
  return base;
}

function calculateStationGaps(profile) {
  const weakStations = profile?.hyrox_weak_stations || [];
  const perStation = 30; // seconds penalty per weak station
  return STATION_NAMES.map(name => ({
    name,
    isWeak: weakStations.includes(name),
    gap: weakStations.includes(name) ? perStation : 0,
  }));
}

export function getRaceTimePredictor(profile, recentSessions = []) {
  const baseEstimate = getBaseEstimate(profile);

  const weakPenalty = (profile?.hyrox_weak_stations?.length || 0) * 30;
  const liftSessions = recentSessions.filter(s => s.type === 'lift' || s.type === 'hyrox').length;
  const runSessions = recentSessions.filter(s => s.type === 'run').length;
  const trainingBonus = Math.min((liftSessions + runSessions) * 20, 300);

  const currentPrediction = baseEstimate + weakPenalty - trainingBonus;
  const targetSeconds = timeToSeconds(profile?.hyrox_target_time);
  const previousSeconds = timeToSeconds(profile?.hyrox_previous_time);

  const gap = targetSeconds ? currentPrediction - targetSeconds : null;
  const onTrack = gap !== null ? gap <= 0 : null;
  const stationGaps = calculateStationGaps(profile);
  const topPriorities = stationGaps.filter(s => s.isWeak).slice(0, 3).map(s => s.name);

  return {
    currentPrediction: secondsToTime(currentPrediction),
    currentPredictionSec: currentPrediction,
    targetTime: targetSeconds ? secondsToTime(targetSeconds) : null,
    targetTimeSec: targetSeconds,
    previousTime: previousSeconds ? secondsToTime(previousSeconds) : null,
    gap: gap !== null ? secondsToTime(Math.abs(gap)) : null,
    gapSec: gap,
    onTrack,
    stationGaps,
    topPriorities,
    improvementFromTraining: secondsToTime(trainingBonus),
  };
}
