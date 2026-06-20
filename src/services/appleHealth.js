const isNative = () =>
  typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.() === true;

async function hk() {
  if (!isNative()) return null;
  try {
    const mod = await import("@perfood/capacitor-healthkit");
    return mod.CapacitorHealthkit;
  } catch {
    return null;
  }
}

// Bump whenever the requested type set changes so existing users get a one-time
// re-sync that asks iOS to authorize the new types.
// v1 → initial set (steps, activity, restingHeartRate, calories, weight)
// v2 → added heartRateVariabilitySDNN (patched into plugin getTypes() via patches/)
export const AH_PERMS_VERSION = 2;

// Keys must match getTypes() in the native plugin (v1.3.2 + patch).
// "activity" covers both sleepAnalysis + workoutType.
// "calories" covers activeEnergyBurned + basalEnergyBurned.
const READ_TYPES = [
  "steps",
  "activity",              // sleepAnalysis + workoutType
  "restingHeartRate",
  "heartRateVariabilitySDNN",
  "calories",              // activeEnergyBurned + basalEnergyBurned
  "weight",
];

const WRITE_TYPES = [
  "activity",  // workoutType
  "calories",  // activeEnergyBurned
];

export async function initAppleHealth() {
  const kit = await hk();
  if (!kit) return false;
  try {
    // 8s timeout on isAvailable — synchronous device check, should never hang
    await Promise.race([
      kit.isAvailable(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('isAvailable timeout')), 8000)),
    ]);
    // No timeout on requestAuthorization — user is interacting with the native sheet
    await kit.requestAuthorization({ all: [], read: READ_TYPES, write: WRITE_TYPES });
    return true;
  } catch {
    return false;
  }
}

export async function checkAppleHealthAuthorized() {
  const kit = await hk();
  if (!kit) return false;
  try {
    // isEditionAuthorized checks actual write-sharing authorization (.sharingAuthorized),
    // unlike isAvailable() which only checks device support.
    // workoutType is in our write set, so this returns true only if the user granted access.
    await kit.isEditionAuthorized({ sampleName: "workoutType" });
    return true;
  } catch {
    return false;
  }
}

function isoToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function isoNow() {
  return new Date().toISOString();
}

function yesterdayNight() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(20, 0, 0, 0); // 8pm yesterday
  return d.toISOString();
}

export async function getLastNightSleep() {
  const kit = await hk();
  if (!kit) return null;
  try {
    const result = await kit.querySampleType({
      sampleName: "sleepAnalysis",
      startDate: yesterdayNight(),
      endDate: isoNow(),
      limit: 100,
      ascending: true,
    });
    const samples = result?.output ?? [];
    // Sum durations where value = 1 (CORE/ASLEEP), 2 (DEEP), 3 (REM)
    let sleepMs = 0;
    for (const s of samples) {
      if ([1, 2, 3].includes(s.value)) {
        const start = new Date(s.startDate).getTime();
        const end = new Date(s.endDate).getTime();
        if (end > start) sleepMs += end - start;
      }
    }
    const hours = sleepMs / 3_600_000;
    return hours > 0 ? Math.round(hours * 10) / 10 : null;
  } catch {
    return null;
  }
}

export async function getTodaySteps() {
  const kit = await hk();
  if (!kit) return null;
  try {
    const result = await kit.querySampleType({
      sampleName: "steps",
      startDate: isoToday(),
      endDate: isoNow(),
      limit: 1000,
      ascending: true,
    });
    const samples = result?.output ?? [];
    const total = samples.reduce((sum, s) => sum + (Number(s.value) || 0), 0);
    return total > 0 ? Math.round(total) : null;
  } catch {
    return null;
  }
}

export async function getRestingHeartRate() {
  const kit = await hk();
  if (!kit) return null;
  try {
    const result = await kit.querySampleType({
      sampleName: "restingHeartRate",
      startDate: isoToday(),
      endDate: isoNow(),
      limit: 5,
      ascending: false,
    });
    const samples = result?.output ?? [];
    if (!samples.length) return null;
    return Math.round(Number(samples[0].value));
  } catch {
    return null;
  }
}

export async function getHRV() {
  const kit = await hk();
  if (!kit) return null;
  try {
    const result = await kit.querySampleType({
      sampleName: "heartRateVariabilitySDNN",
      startDate: yesterdayNight(),
      endDate: isoNow(),
      limit: 5,
      ascending: false,
    });
    const samples = result?.output ?? [];
    if (!samples.length) return null;
    // HealthKit returns HRV in seconds; convert to ms
    const raw = Number(samples[0].value);
    const ms = raw < 1 ? Math.round(raw * 1000) : Math.round(raw);
    return ms;
  } catch {
    return null;
  }
}

export async function getActiveCaloriesToday() {
  const kit = await hk();
  if (!kit) return null;
  try {
    const result = await kit.querySampleType({
      sampleName: "activeEnergyBurned",
      startDate: isoToday(),
      endDate: isoNow(),
      limit: 1000,
      ascending: true,
    });
    const samples = result?.output ?? [];
    const total = samples.reduce((sum, s) => sum + (Number(s.value) || 0), 0);
    return total > 0 ? Math.round(total) : null;
  } catch {
    return null;
  }
}

export async function getWeightFromHealth() {
  const kit = await hk();
  if (!kit) return null;
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const result = await kit.querySampleType({
      sampleName: "weight",
      startDate: thirtyDaysAgo.toISOString(),
      endDate: isoNow(),
      limit: 5,
      ascending: false,
    });
    const samples = result?.output ?? [];
    if (!samples.length) return null;
    // HealthKit returns weight in kg
    return Math.round(Number(samples[0].value) * 10) / 10;
  } catch {
    return null;
  }
}

export async function saveWorkoutToHealth({ durationMinutes, activeCalories, workoutType = "traditionalStrengthTraining" }) {
  // Timeout-guard the ENTIRE native sequence (hk() + saveWorkout). A hung native
  // HealthKit promise in WKWebView never settles, so a bare try/catch can't rescue
  // it — Promise.race forces a rejection so callers never park forever. Same defense
  // as initAppleHealth(). This is a best-effort write; failing/timing out is fine.
  try {
    return await Promise.race([
      (async () => {
        const kit = await hk();
        if (!kit) return false;
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - durationMinutes * 60_000);
        await kit.saveWorkout({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          durationFactor: 1,
          energyBurned: activeCalories,
          energyBurnedUnit: "kilocalorie",
          distance: 0,
          distanceUnit: "meter",
        });
        return true;
      })(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('saveWorkout timeout')), 4000)),
    ]);
  } catch {
    return false;
  }
}

export async function getHRVBaseline(days = 30) {
  const kit = await hk();
  if (!kit) return null;
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const result = await kit.querySampleType({
      sampleName: "heartRateVariabilitySDNN",
      startDate: since.toISOString(),
      endDate: isoNow(),
      limit: 200,
      ascending: true,
    });
    const samples = result?.output ?? [];
    if (samples.length < 5) return null; // not enough data for a baseline
    const values = samples.map(s => {
      const raw = Number(s.value);
      return raw < 1 ? raw * 1000 : raw; // convert s→ms if needed
    }).filter(v => v > 5 && v < 300); // sanity bounds
    if (!values.length) return null;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10;
  } catch {
    return null;
  }
}

export async function getDailyHealthSnapshot() {
  const [sleep, steps, rhr, hrv, calories] = await Promise.all([
    getLastNightSleep(),
    getTodaySteps(),
    getRestingHeartRate(),
    getHRV(),
    getActiveCaloriesToday(),
  ]);
  return { sleep, steps, rhr, hrv, calories };
}

// Steps → extra calorie adjustment
export function stepsToCalorieBonus(steps) {
  if (!steps) return 0;
  if (steps > 15000) return 200;
  if (steps > 12000) return 150;
  if (steps > 10000) return 100;
  if (steps > 7500)  return 50;
  if (steps > 5000)  return 0;
  if (steps > 2500)  return -50;
  return -100;
}

// Coach Macro Score: recovery 40%, nutrition 30%, training 20%, consistency 10%
export function calcCoachMacroScore({ sleep, hrv, rhr, nutritionScore = 0, trainingScore = 0, consistencyScore = 0 }) {
  let recoveryScore = 50; // baseline

  if (sleep !== null) {
    if (sleep >= 8)     recoveryScore += 20;
    else if (sleep >= 7) recoveryScore += 10;
    else if (sleep >= 6) recoveryScore += 0;
    else if (sleep >= 5) recoveryScore -= 10;
    else                 recoveryScore -= 25;
  }

  if (hrv !== null) {
    if (hrv > 60)       recoveryScore += 20;
    else if (hrv > 40)  recoveryScore += 10;
    else if (hrv > 25)  recoveryScore += 0;
    else if (hrv > 15)  recoveryScore -= 10;
    else                recoveryScore -= 20;
  }

  if (rhr !== null) {
    if (rhr < 50)       recoveryScore += 10;
    else if (rhr < 60)  recoveryScore += 5;
    else if (rhr < 70)  recoveryScore += 0;
    else if (rhr < 80)  recoveryScore -= 5;
    else                recoveryScore -= 10;
  }

  recoveryScore = Math.max(0, Math.min(100, recoveryScore));

  const score =
    recoveryScore   * 0.40 +
    nutritionScore  * 0.30 +
    trainingScore   * 0.20 +
    consistencyScore * 0.10;

  return Math.round(Math.max(0, Math.min(100, score)));
}

// Morning session adjustment recommendation
export function getMorningAdjustment({ sleep, hrv }) {
  if (sleep !== null && sleep < 5) {
    return { type: "reduce", reason: `Only ${sleep}h sleep — reducing session intensity` };
  }
  if (hrv !== null && hrv < 20) {
    return { type: "reduce", reason: `HRV ${hrv}ms — low recovery, reducing session intensity` };
  }
  if (sleep !== null && sleep >= 8 && hrv !== null && hrv > 60) {
    return { type: "optimal", reason: `${sleep}h sleep + HRV ${hrv}ms — peak recovery, push hard today` };
  }
  return { type: "normal", reason: null };
}
