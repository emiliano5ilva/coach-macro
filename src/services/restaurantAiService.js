import { aiWithTools, aiWithToolsAndVision } from '../client.js';

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

// Forced tool-use schema — model MUST fill this shape; no JSON parsing, no markdown fences.
// Root cause of "Could not get recommendations": 900-token output cap truncated the JSON mid-response.
// Tool-use path on the server uses max(clientMax, serverLimit) so 2000 tokens always gets through.
const RESTAURANT_REC_TOOLS = [{
  name: "restaurant_recommendation",
  description: "Structured restaurant meal recommendation matching user macro targets",
  input_schema: {
    type: "object",
    properties: {
      best_order: {
        type: "object",
        description: "The single best dish to order",
        properties: {
          item: { type: "string" },
          customisation: { type: "string" },
          reason: { type: "string" },
          estimated_macros: {
            type: "object",
            properties: {
              calories:   { type: "number" },
              protein_g:  { type: "number" },
              carbs_g:    { type: "number" },
              fat_g:      { type: "number" },
              sodium_mg:  { type: "number" },
              sugar_g:    { type: "number" },
            },
            required: ["calories","protein_g","carbs_g","fat_g","sodium_mg","sugar_g"],
          },
          protein_coverage_pct: { type: "number" },
          warnings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nutrient: { type: "string" },
                message:  { type: "string" },
                fix:      { type: "string" },
              },
              required: ["nutrient","message","fix"],
            },
          },
        },
        required: ["item","reason","estimated_macros","protein_coverage_pct","warnings"],
      },
      backup_options: {
        type: "array",
        items: {
          type: "object",
          properties: {
            item:          { type: "string" },
            customisation: { type: "string" },
            reason:        { type: "string" },
          },
          required: ["item","reason"],
        },
      },
      avoid: {
        type: "array",
        items: {
          type: "object",
          properties: {
            item:   { type: "string" },
            reason: { type: "string" },
          },
          required: ["item","reason"],
        },
      },
      coach_note: { type: "string" },
    },
    required: ["best_order","backup_options","avoid","coach_note"],
  },
}];

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

RULES: Optimise for protein first. Stay within 110% of all targets. Never recommend alcohol. Be specific with exact item names.`;
}

export async function getRestaurantRecs(restaurantName, _cuisineTypes, userContext) {
  const prompt = buildRestaurantPrompt(restaurantName, userContext);
  return aiWithTools(prompt, RESTAURANT_REC_TOOLS, 'restaurant_recommendation', 2000, 'restaurant_pick');
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

If no menu is visible in the image, fill item fields with "Unknown" and set coach_note to "No menu detected. Try photographing the menu directly with good lighting."`;

  return aiWithToolsAndVision(base64Image, mediaType, textPrompt, RESTAURANT_REC_TOOLS, 'restaurant_recommendation', 2000, 'menu_scan');
}
