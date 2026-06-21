import { sb } from "../client";

const isNative = () =>
  typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.() === true;

// Fire-and-forget breadcrumb to analytics_events (readable via MCP — we can't attach a
// USB cable to read the device console). NEVER awaited and NEVER throws: logging must not
// block or hang the native path. Skips silently when userId is absent.
function logStep(userId, event, props = {}) {
  if (!userId) return;
  try {
    sb.from("analytics_events").insert({
      user_id: userId,
      event: "ah_" + event,
      properties: { ...props, timestamp: new Date().toISOString() },
      created_at: new Date().toISOString(),
    }).then(() => {}, () => {});
  } catch { /* never let logging throw into the de-stall path */ }
}

async function hk(userId) {
  // Return a plain CONTAINER ({ kit }), never the bare plugin proxy. Capacitor's
  // registerPlugin proxy answers `.then` with a function (its get-trap has no `then`
  // guard), so an async function that resolves with the proxy gets thenable-unwrapped:
  // the engine calls proxy.then(resolve) → a native bridge call to a nonexistent "then"
  // method that never resolves → `await hk()` hangs forever. Wrapping in a non-thenable
  // object defeats the unwrap. (This was the long-standing native-bridge stall.)
  if (!isNative()) return { kit: null };
  // Bound the dynamic import — a stalled plugin load would otherwise hang unbounded.
  logStep(userId, "import_start", { call: "import" });
  try {
    const mod = await Promise.race([
      import("@perfood/capacitor-healthkit"),
      new Promise((_, rej) => setTimeout(() => rej(new Error("import timeout")), 8000)),
    ]);
    logStep(userId, "import_ok", { call: "import" });
    return { kit: mod.CapacitorHealthkit };
  } catch (e) {
    if (e?.message === "import timeout") logStep(userId, "import_timeout", { call: "import", message: e.message, name: e.name });
    else logStep(userId, "import_error", { call: "import", message: e?.message, name: e?.name });
    return { kit: null };
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

export async function initAppleHealth(userId) {
  const { kit } = await hk(userId);
  if (!kit) return false;
  // Tracks which bounded call we're in, so a non-timeout throw is labeled to the right
  // stage instead of always falling through to requestauth_error.
  let stage = 'isavailable';
  try {
    // 8s timeout on isAvailable — synchronous device check, should never hang
    logStep(userId, "isavailable_start", { call: "isAvailable" });
    await Promise.race([
      kit.isAvailable(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('isAvailable timeout')), 8000)),
    ]);
    logStep(userId, "isavailable_ok", { call: "isAvailable" });
    // 30s timeout on requestAuthorization — user interacts with the native sheet, but an
    // unbounded await can park the whole flow if the sheet never resolves.
    stage = 'requestauth';
    logStep(userId, "requestauth_start", { call: "requestAuthorization" });
    await Promise.race([
      kit.requestAuthorization({ all: [], read: READ_TYPES, write: WRITE_TYPES }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('requestAuthorization timeout')), 30000)),
    ]);
    logStep(userId, "requestauth_ok", { call: "requestAuthorization" });
    return true;
  } catch (e) {
    // Label the breadcrumb by which bounded call rejected, then preserve swallow-to-false.
    const msg = e?.message || "";
    if (msg === 'isAvailable timeout') logStep(userId, "isavailable_timeout", { call: "isAvailable", message: msg, name: e?.name });
    else if (msg === 'requestAuthorization timeout') logStep(userId, "requestauth_timeout", { call: "requestAuthorization", message: msg, name: e?.name });
    else if (stage === 'isavailable') logStep(userId, "isavailable_error", { call: "isAvailable", message: e?.message, name: e?.name });
    else logStep(userId, "requestauth_error", { call: "requestAuthorization", message: e?.message, name: e?.name });
    return false;
  }
}

export async function checkAppleHealthAuthorized(userId) {
  const { kit } = await hk(userId);
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

export async function getLastNightSleep(userId) {
  const { kit } = await hk(userId);
  if (!kit) return null;
  try {
    logStep(userId, "sleep_start", { call: "sleep" });
    const result = await Promise.race([
      kit.queryHKitSampleType({
        sampleName: "sleepAnalysis",
        startDate: yesterdayNight(),
        endDate: isoNow(),
        limit: 100,
        ascending: true,
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error("sleep timeout")), 10000)),
    ]);
    logStep(userId, "sleep_ok", { call: "sleep" });
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
  } catch (e) {
    if (e?.message === "sleep timeout") logStep(userId, "sleep_timeout", { call: "sleep", message: e.message, name: e.name });
    else logStep(userId, "sleep_error", { call: "sleep", message: e?.message, name: e?.name });
    return null;
  }
}

export async function getTodaySteps(userId) {
  const { kit } = await hk(userId);
  if (!kit) return null;
  try {
    logStep(userId, "steps_start", { call: "steps" });
    const result = await Promise.race([
      kit.queryHKitSampleType({
        sampleName: "stepCount",
        startDate: isoToday(),
        endDate: isoNow(),
        limit: 1000,
        ascending: true,
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error("steps timeout")), 10000)),
    ]);
    logStep(userId, "steps_ok", { call: "steps" });
    const samples = result?.output ?? [];
    const total = samples.reduce((sum, s) => sum + (Number(s.value) || 0), 0);
    return total > 0 ? Math.round(total) : null;
  } catch (e) {
    if (e?.message === "steps timeout") logStep(userId, "steps_timeout", { call: "steps", message: e.message, name: e.name });
    else logStep(userId, "steps_error", { call: "steps", message: e?.message, name: e?.name });
    return null;
  }
}

export async function getRestingHeartRate(userId) {
  const { kit } = await hk(userId);
  if (!kit) return null;
  try {
    logStep(userId, "rhr_start", { call: "rhr" });
    const result = await Promise.race([
      kit.queryHKitSampleType({
        sampleName: "restingHeartRate",
        startDate: isoToday(),
        endDate: isoNow(),
        limit: 5,
        ascending: false,
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error("rhr timeout")), 10000)),
    ]);
    logStep(userId, "rhr_ok", { call: "rhr" });
    const samples = result?.output ?? [];
    if (!samples.length) return null;
    return Math.round(Number(samples[0].value));
  } catch (e) {
    if (e?.message === "rhr timeout") logStep(userId, "rhr_timeout", { call: "rhr", message: e.message, name: e.name });
    else logStep(userId, "rhr_error", { call: "rhr", message: e?.message, name: e?.name });
    return null;
  }
}

export async function getHRV(userId) {
  const { kit } = await hk(userId);
  if (!kit) return null;
  try {
    logStep(userId, "hrv_start", { call: "hrv" });
    const result = await Promise.race([
      kit.queryHKitSampleType({
        sampleName: "heartRateVariabilitySDNN",
        startDate: yesterdayNight(),
        endDate: isoNow(),
        limit: 5,
        ascending: false,
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error("hrv timeout")), 10000)),
    ]);
    logStep(userId, "hrv_ok", { call: "hrv" });
    const samples = result?.output ?? [];
    if (!samples.length) return null;
    // Patched plugin returns heartRateVariabilitySDNN already in ms (unitName "ms").
    return Math.round(Number(samples[0].value));
  } catch (e) {
    if (e?.message === "hrv timeout") logStep(userId, "hrv_timeout", { call: "hrv", message: e.message, name: e.name });
    else logStep(userId, "hrv_error", { call: "hrv", message: e?.message, name: e?.name });
    return null;
  }
}

export async function getActiveCaloriesToday(userId) {
  const { kit } = await hk(userId);
  if (!kit) return null;
  try {
    logStep(userId, "calories_start", { call: "calories" });
    const result = await Promise.race([
      kit.queryHKitSampleType({
        sampleName: "activeEnergyBurned",
        startDate: isoToday(),
        endDate: isoNow(),
        limit: 1000,
        ascending: true,
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error("calories timeout")), 10000)),
    ]);
    logStep(userId, "calories_ok", { call: "calories" });
    const samples = result?.output ?? [];
    const total = samples.reduce((sum, s) => sum + (Number(s.value) || 0), 0);
    return total > 0 ? Math.round(total) : null;
  } catch (e) {
    if (e?.message === "calories timeout") logStep(userId, "calories_timeout", { call: "calories", message: e.message, name: e.name });
    else logStep(userId, "calories_error", { call: "calories", message: e?.message, name: e?.name });
    return null;
  }
}

export async function getWeightFromHealth() {
  const { kit } = await hk();
  if (!kit) return null;
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const result = await kit.queryHKitSampleType({
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
        const { kit } = await hk();
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
  const { kit } = await hk();
  if (!kit) return null;
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const result = await kit.queryHKitSampleType({
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

export async function getDailyHealthSnapshot(userId) {
  const [sleep, steps, rhr, hrv, calories] = await Promise.all([
    getLastNightSleep(userId),
    getTodaySteps(userId),
    getRestingHeartRate(userId),
    getHRV(userId),
    getActiveCaloriesToday(userId),
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
