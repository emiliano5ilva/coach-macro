import { ai, aiWithVision } from '../client.js';

const KNOWN_CHAINS = [
  "mcdonald","burger king","wendy","taco bell","subway","chipotle","chick-fil-a",
  "starbucks","dunkin","panera","panda express","kfc","popeyes","sonic","dairy queen",
  "five guys","in-n-out","shake shack","whataburger","jack in the box","arby","hardee",
  "carl's jr","wingstop","raising cane","zaxby","bojangles","culver","chili","applebee",
  "olive garden","outback","red lobster","texas roadhouse","longhorn","cheesecake factory",
  "buffalo wild wings","ihop","denny","waffle house","jersey mike","jimmy john","firehouse",
  "potbelly","sweetgreen","qdoba","moe's","el pollo loco","del taco","noodles","pei wei",
  "p.f. chang","red robin","first watch","corner bakery","einstein","tropical smoothie",
  "jamba","smoothie king","freshii","just salad","jason's deli","mcalister",
];

function isKnownChain(name) {
  const lower = name.toLowerCase();
  return KNOWN_CHAINS.some(chain => lower.includes(chain));
}

const JSON_FORMAT = `{
  "best_order": {
    "item": "exact item name",
    "customisation": "modifications or null",
    "reason": "one sentence why this fits the meal target",
    "estimated_macros": {
      "calories": 0,
      "protein_g": 0,
      "carbs_g": 0,
      "fat_g": 0,
      "sodium_mg": 0,
      "sugar_g": 0
    },
    "protein_coverage_pct": 0,
    "warnings": [
      {
        "nutrient": "sodium",
        "message": "1,840mg — 80% of daily limit in one meal",
        "fix": "Ask for no sour cream to reduce by ~300mg"
      }
    ]
  },
  "backup_options": [
    { "item": "exact item name", "customisation": null, "reason": "one sentence" },
    { "item": "exact item name", "customisation": null, "reason": "one sentence" }
  ],
  "avoid": [
    { "item": "exact item name", "reason": "specific macro problem" }
  ],
  "coach_note": "one punchy sentence tying training to the recommendation"
}`;

export function buildUserContext(profile, slotTargets, currentSlot, totalMeals, trainedToday, sessionType) {
  const pd = profile?.profile_data || {};
  return {
    goal: profile?.goal || 'maintenance',
    dietary: (profile?.dietary || pd?.dietary || []).filter(d => d !== 'none'),
    currentMealSlot: currentSlot || 1,
    totalMeals: totalMeals || 3,
    currentMealCalorieTarget: slotTargets?.calories || 500,
    mealProteinTarget: slotTargets?.protein || 40,
    mealCarbTarget: slotTargets?.carbs || 50,
    mealFatTarget: slotTargets?.fat || 20,
    trainedToday: trainedToday || false,
    sessionType: sessionType || null,
    healthConditions: pd?.healthConditions || [],
    conditions: pd?.conditions || [],
    goalTimeline: pd?.goalTimeline || null,
    fasting: pd?.fasting || null,
  };
}

function buildRestaurantPrompt(restaurantName, userContext) {
  const { goal, dietary, currentMealSlot, totalMeals, currentMealCalorieTarget, mealProteinTarget, mealCarbTarget, mealFatTarget, trainedToday, sessionType, healthConditions, conditions, goalTimeline, fasting } = userContext;
  const dietStr = dietary.length > 0 ? `\nDIETARY RESTRICTIONS (strictly avoid): ${dietary.join(', ')}.` : '';
  const isChain = isKnownChain(restaurantName);

  const diabetesCtx = (healthConditions||[]).includes('diabetes')
    ? '\nDIABETES: Avoid high GI foods. Flag dishes with heavy sugar, white rice, white bread, or sugary sauces. Recommend protein + vegetables + complex carbs.'
    : '';
  const hypertensionCtx = (healthConditions||[]).includes('hypertension')
    ? '\nHYPERTENSION: Flag high sodium dishes. Note any item over 800mg sodium. Recommend sauces on the side.'
    : '';
  const thyroidCtx = (conditions||[]).includes('thyroid')
    ? '\nTHYROID CONDITION: Avoid recommending raw cruciferous vegetables in large quantities. Cooked is fine.'
    : '';
  const urgentCtx = goalTimeline === '1_month'
    ? '\nURGENT TIMELINE: 1 month to goal. Be strict — flag anything that significantly exceeds macro targets.'
    : '';
  const goalCtx = goal === 'lose_fat'
    ? '\nWEIGHT LOSS GOAL: Prioritise high protein, high volume/low calorie foods. Flag hidden calories in sauces, dressings, oils.'
    : goal === 'build_muscle'
      ? '\nMUSCLE BUILDING GOAL: Prioritise protein-dense dishes and adequate carbs. Slight calorie overage acceptable.'
      : '';
  const fastingCtx = fasting && fasting !== 'no' && fasting !== 'none'
    ? `\nFASTING PROTOCOL: ${fasting}. This may be their first or last meal in their eating window. Recommend higher protein and calorie-dense options if first meal.`
    : '';

  return `You are the Coach Macro nutrition AI. Recommend exactly what to order at ${restaurantName}.

MEAL CONTEXT:
- This is Meal ${currentMealSlot} of ${totalMeals} today
- Calorie target for THIS meal: ${currentMealCalorieTarget} kcal
- Protein target: ${mealProteinTarget}g
- Carb target: ${mealCarbTarget}g
- Fat target: ${mealFatTarget}g
- Training goal: ${goal}
- Trained today: ${trainedToday}
- Session type: ${sessionType || 'none'}${dietStr}${diabetesCtx}${hypertensionCtx}${thyroidCtx}${urgentCtx}${goalCtx}${fastingCtx}

RESTAURANT: ${restaurantName}
${isChain ? 'Known chain — use exact menu knowledge and suggest specific modifications (e.g. "ask for half rice", "no cheese", "sauce on the side", "grilled not fried").' : 'Independent restaurant — suggest general preparation modifications only, not specific portion requests.'}

FLAG WARNINGS IF:
- Calories > ${Math.round(currentMealCalorieTarget * 1.1)} (110% of meal target)
- Protein < ${Math.round(mealProteinTarget * 0.8)}g (below 80% of target)
- Carbs > ${Math.round(mealCarbTarget * 1.1)}g (110% of target)
- Fat > ${Math.round(mealFatTarget * 1.1)}g (110% of target)
- Sodium > 1000mg${(healthConditions||[]).includes('hypertension') ? ' (flag above 800mg for hypertension)' : ''}
- Sugar > 20g${(healthConditions||[]).includes('diabetes') ? ' (flag above 10g for diabetes)' : ''}

RULES: Optimise for protein first. Stay within 110% of all targets. Never recommend alcohol. Be specific with exact item names.

RESPOND IN THIS EXACT JSON FORMAT. Nothing before or after the JSON:
${JSON_FORMAT}`;
}

export async function getRestaurantRecs(restaurantName, _cuisineTypes, userContext) {
  const prompt = buildRestaurantPrompt(restaurantName, userContext);
  const text = await ai(prompt, 900, 'restaurant_pick');
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

export async function getMenuScanRecs(base64Image, mediaType, userContext) {
  const { goal, dietary, currentMealSlot, totalMeals, currentMealCalorieTarget, mealProteinTarget, mealCarbTarget, mealFatTarget, trainedToday, healthConditions, conditions, fasting } = userContext;
  const dietStr = dietary.length > 0 ? `\nDIETARY RESTRICTIONS (strictly avoid): ${dietary.join(', ')}.` : '';
  const scanHealthCtx = [
    (healthConditions||[]).includes('diabetes') ? 'Avoid high GI, sugary sauces, white rice/bread.' : '',
    (healthConditions||[]).includes('hypertension') ? 'Flag sodium > 800mg.' : '',
    (conditions||[]).includes('thyroid') ? 'Avoid raw cruciferous vegetables.' : '',
    fasting && fasting !== 'no' && fasting !== 'none' ? `Fasting protocol: ${fasting} — recommend protein-dense options.` : '',
  ].filter(Boolean).join(' ');
  const textPrompt = `This is a restaurant menu. The user needs to order Meal ${currentMealSlot} of ${totalMeals} today.

Meal targets: ${currentMealCalorieTarget} kcal · ${mealProteinTarget}g protein · ${mealCarbTarget}g carbs · ${mealFatTarget}g fat
Goal: ${goal} · Trained today: ${trainedToday}${dietStr}${scanHealthCtx ? `\n${scanHealthCtx}` : ''}

Read the menu and recommend what to order. Apply the same warning thresholds: calories >110%, protein <80%, carbs/fat >110%, sodium >1000mg, sugar >20g.

If no menu is visible in the image, return this exact JSON with coach_note set to "No menu detected. Try photographing the menu directly with good lighting." and leave item fields as "Unknown".

RESPOND IN THIS EXACT JSON FORMAT. Nothing before or after the JSON:
${JSON_FORMAT}`;

  const text = await aiWithVision(base64Image, mediaType, textPrompt, 900, 'menu_scan');
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
