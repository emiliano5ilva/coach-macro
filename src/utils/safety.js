export const SAFETY_SYSTEM_PROMPT = `You are Coach Macro's AI fitness and nutrition assistant. Always follow these non-negotiable safety rules:

CALORIE LIMITS:
- Never recommend below 1,400 kcal/day for women or 1,600 kcal/day for men
- Absolute minimum: 1,200 kcal/day under any circumstances
- Never recommend rapid fat loss exceeding 2 lbs/week (1,000 kcal daily deficit)

EXERCISE SAFETY:
- Never encourage training through chest pain, shortness of breath, or dizziness — always say "stop and seek medical attention immediately"
- For pregnant users: no supine exercises after 16 weeks, no heavy barbell loading, no contact sports, no exercises with fall risk
- For users with joint replacements: avoid high-impact loading on the replaced joint
- For users with heart conditions: recommend low-to-moderate intensity only and physician clearance before starting

AGE-APPROPRIATE GUIDANCE:
- Under 16: bodyweight and light dumbbell training only, no barbell loading, max 3 sets, 12-15 rep ranges, zero weight recommendations
- Ages 16-17: modified barbell loading at 70% of adult recommendations, max 3 sets, 8-10 rep ranges, never train to failure
- Ages 65-69: joint-protective movements, controlled tempo (3-1-3), avoid high-impact unless cleared, 1.25x standard rest periods, 80% of standard volume
- Ages 70+: conservative approach — 60% of standard volume, 1.5x rest periods, always include balance and mobility work, never train to failure, fall prevention priority

MEDICAL CONDITIONS:
- Heart condition or hypertension: recommend physician clearance before intense training; keep intensity moderate (RPE 5-6 max); no Valsalva maneuver
- Type 1 or 2 Diabetes: remind user to monitor blood sugar around exercise; suggest carbohydrate intake before and after sessions
- Epilepsy: avoid exercises that risk injury during a seizure (solo swimming, heavy overhead unsupported, high-altitude climbing)
- Eating disorder history: NEVER mention food restriction, calorie cutting, or specific very low numbers; always frame nutrition as fueling performance
- Recent surgery or joint replacement: defer all exercise guidance to physician clearance; suggest gentle mobility only

LANGUAGE RULES:
- Never say: "no pain no gain", "push through the pain", "pain is weakness", "ignore the discomfort", "train through it"
- Always say: "listen to your body", "train smart", "respect your recovery"
- Never diagnose medical conditions
- Never recommend stopping or changing prescribed medications
- When safety is uncertain, always recommend consulting a qualified healthcare professional`;

export function safetyCheck(response) {
  if (!response) return response;
  let safe = response;
  const fixes = [
    [/no pain,?\s*no gain/gi, "train smart, recover well"],
    [/push through\s+(?:the\s+)?pain/gi, "listen to your body"],
    [/pain is weakness/gi, "recovery is strength"],
    [/ignore\s+(?:the\s+)?(?:pain|discomfort)/gi, "respect your body's signals"],
    [/train through\s+(?:the\s+)?(?:pain|it)/gi, "train smart"],
  ];
  fixes.forEach(([pattern, replacement]) => { safe = safe.replace(pattern, replacement); });
  return safe;
}

export function getAge(dobYear, dobMonth, dobDay) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const mIdx = months.indexOf(dobMonth);
  if (mIdx < 0 || !dobYear || !dobDay) return null;
  const dob = new Date(parseInt(dobYear), mIdx, parseInt(dobDay));
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function replaceForYouth(exercises) {
  const subs = {
    "Barbell Squat": "Goblet Squat",
    "Back Squat": "Goblet Squat",
    "Front Squat": "Goblet Squat",
    "Barbell Deadlift": "Romanian Deadlift (Dumbbell)",
    "Conventional Deadlift": "Romanian Deadlift (Dumbbell)",
    "Barbell Bench Press": "Dumbbell Bench Press",
    "Flat Barbell Bench Press": "Dumbbell Bench Press",
    "Barbell Row": "Dumbbell Row",
    "Bent-Over Barbell Row": "Dumbbell Row",
    "Barbell Overhead Press": "Dumbbell Shoulder Press",
  };
  return exercises.map(ex => ({
    ...ex,
    name: subs[ex.name] || ex.name,
    sets: Math.min(ex.sets || 3, 3),
    reps: "12-15",
    notes: `${ex.notes || ""} — youth: light weight, master form first`.trim(),
  }));
}

function applyOlderAdultMods(exercises, intensity) {
  const volMult = intensity === "conservative" ? 0.6 : 0.8;
  const note = intensity === "conservative"
    ? "— conservative: stop well before failure, 2-3 min rest"
    : "— controlled tempo (3-1-3), 90s+ rest, no failure";
  const modified = exercises.map(ex => ({
    ...ex,
    sets: Math.max(1, Math.round((ex.sets || 3) * volMult)),
    notes: `${ex.notes || ""} ${note}`.trim(),
  }));
  if (intensity === "conservative") {
    return [...modified,
      { name: "Single-Leg Stand", sets: 2, reps: "30 sec each side", notes: "Fall prevention — balance" },
      { name: "Heel-to-Toe Walk", sets: 2, reps: "20 steps", notes: "Fall prevention — gait stability" },
    ];
  }
  return modified;
}

export function getAgeAppropriateProgram(exercises, age) {
  if (!age || !Array.isArray(exercises) || age >= 65) return exercises;
  if (age < 13) return null;
  if (age < 16) return replaceForYouth(exercises);
  if (age < 18) return exercises.map(ex => ({
    ...ex,
    sets: Math.min(ex.sets || 3, 3),
    reps: ex.reps || "8-10",
    notes: `${ex.notes || ""} — teen: ~70% of adult weight, avoid failure`.trim(),
  }));
  return exercises;
}

export function applyOlderAdultProgram(exercises, age, jointHealthMode = true) {
  if (!age || !Array.isArray(exercises) || age < 65) return exercises;
  if (!jointHealthMode) return exercises;
  if (age >= 70) return applyOlderAdultMods(exercises, "conservative");
  return applyOlderAdultMods(exercises, "moderate");
}

export const HEALTH_CONDITIONS_SAFETY = {
  heart: { label: "Heart condition", note: "Keep intensity low-to-moderate (RPE 5-6). Stop if you feel chest tightness or shortness of breath." },
  hypertension: { label: "High blood pressure", note: "Avoid breath-holding (Valsalva). Keep rest periods generous. Monitor BP before and after." },
  diabetes: { label: "Diabetes", note: "Check blood sugar before exercise. Have fast-acting carbs nearby. Avoid exercising with very high or very low glucose." },
  epilepsy: { label: "Epilepsy", note: "Avoid exercises that pose injury risk during a seizure. Always train with a buddy or within sight of others." },
  surgery: { label: "Recent surgery", note: "Get physician clearance before resuming exercise. Start with gentle mobility and breathing work only." },
  joint_replacement: { label: "Joint replacement", note: "Avoid high-impact loading on the replaced joint. Work with a physical therapist on return-to-exercise." },
  bone_condition: { label: "Bone condition (osteopenia/osteoporosis)", note: "Avoid high-impact and spinal flexion under load. Weight-bearing exercise is beneficial — form is critical." },
};
