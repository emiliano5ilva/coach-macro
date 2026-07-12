import { getAge } from "./safety.js";

// MET by HealthKit activity type. Estimate is ACTIVE-ONLY (above basal), so callers
// credit (MET − 1), matching Apple's Move ring (avoids ~20-30% overcount).
const METS = {
  running: 9.5,
  cycling: 7,
  walking: 3.5,
  highIntensityIntervalTraining: 8,
  functionalStrengthTraining: 8,
  traditionalStrengthTraining: 4.5,
};

// Shared active-energy estimate for ALL workout finish paths (lifting / run / hyrox), so the
// in-app ring, the DB calories_burned, and the Apple Health write all agree.
//   kcal = (MET − 1) × per-minute rate × minutes
// Tier 1 (age + sex + height present) — per-minute rate = Mifflin-St Jeor BMR / 1440.
// Tier 2 (any missing/implausible) — weight-only fallback: bodyweightKg / 60.
// Never returns NaN/0 (Math.max(1, …)); weight derivation mirrors finishWorkout's
// _bodyweightKg exactly (wUnit lbs→kg, defaults 160 lb / 70 kg, then 75 kg guard).
export function estimateActiveKcal({ hkType, durationMin, profile }) {
  const met = METS[hkType] ?? 5;
  const _bw = profile?.wUnit === "lbs"
    ? parseFloat(profile?.weight || 160) * 0.4536
    : parseFloat(profile?.weight || 70);
  const wKg = (Number.isFinite(_bw) && _bw > 0) ? _bw : 75;
  const age = getAge(profile?.dobYear, profile?.dobMonth, profile?.dobDay);
  const sex = (profile?.sex || profile?.gender || "").toLowerCase();
  const sexValid = sex === "male" || sex === "female";
  const hCm = parseFloat(
    profile?.height_cm ?? profile?.hCm ??
    ((parseFloat(profile?.hFt || 0) * 30.48) + (parseFloat(profile?.hIn || 0) * 2.54))
  );
  const dur = Math.max(0, Number(durationMin) || 0);

  if (Number.isFinite(age) && age > 0 && sexValid && Number.isFinite(hCm) && hCm > 0) {
    // TIER 1 — biometric (Mifflin-St Jeor)
    const bmr = 10 * wKg + 6.25 * hCm - 5 * age + (sex === "female" ? -161 : 5);
    return { kcal: Math.max(1, Math.round((met - 1) * (bmr / 1440) * dur)), tier: 1, bmr: Math.round(bmr) };
  }
  // TIER 2 — weight-only fallback (still active-only)
  return { kcal: Math.max(1, Math.round((met - 1) * wKg * (dur / 60))), tier: 2, bmr: null };
}
