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

// Tool schema for extracting raw per-item menu data.
// No user context embedded — the same extracted data is shared across all users.
// Personalized matching happens client-side via matchMenuItems().
const RESTAURANT_MENU_EXTRACT_TOOLS = [{
  name: "restaurant_menu_data",
  description: "Per-item menu nutrition data for a restaurant",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: "Menu items with estimated per-serving nutrition",
        items: {
          type: "object",
          properties: {
            name:      { type: "string" },
            calories:  { type: "number" },
            protein_g: { type: "number" },
            carbs_g:   { type: "number" },
            fat_g:     { type: "number" },
          },
          required: ["name","calories","protein_g","carbs_g","fat_g"],
        },
      },
    },
    required: ["items"],
  },
}];

// Kept for menu-scan path (stays AI-driven per-user, no shared cache).
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

// Pure function: given raw menu items + user's meal macro targets,
// returns a personalized {best_order, backup_options, avoid, coach_note}.
// No AI call — runs instantly against already-cached per-item data.
export function matchMenuItems(items, userMacros) {
  const { calories: calTarget, protein: protTarget, carbs: carbTarget, fat: fatTarget } = userMacros;
  if (!items || !items.length) return null;

  function scoreItem(item) {
    const calRatio  = item.calories  / (calTarget  || 1);
    const protRatio = item.protein_g / (protTarget || 1);
    const carbRatio = item.carbs_g   / (carbTarget || 1);
    const fatRatio  = item.fat_g     / (fatTarget  || 1);
    // Over-calorie penalized heavily; under-protein penalized heavily
    const calP  = calRatio  > 1 ? (calRatio  - 1) * 3   : (1 - calRatio)  * 0.5;
    const protP = protRatio < 1 ? (1 - protRatio) * 4   : (protRatio - 1) * 0.5;
    const carbP = carbRatio > 1 ? (carbRatio - 1) * 1   : 0;
    const fatP  = fatRatio  > 1 ? (fatRatio  - 1) * 1   : 0;
    return calP + protP + carbP + fatP;
  }

  const sorted = [...items].sort((a, b) => scoreItem(a) - scoreItem(b));

  function itemToEntry(item) {
    const calories  = Math.round(item.calories);
    const protein_g = Math.round(item.protein_g);
    const carbs_g   = Math.round(item.carbs_g);
    const fat_g     = Math.round(item.fat_g);
    const protein_coverage_pct = Math.min(100, Math.round((protein_g / (protTarget || 1)) * 100));
    const calPct  = Math.round((calories  / (calTarget  || 1)) * 100);
    const protPct = Math.round((protein_g / (protTarget || 1)) * 100);

    let reason;
    if (protein_g >= protTarget * 0.9) {
      reason = `Hits ${protPct}% of your protein target at ${calories} kcal`;
    } else if (calories <= calTarget * 0.95) {
      reason = `Fits your calorie window at ${calPct}% · ${protein_g}g protein`;
    } else {
      reason = `${protein_g}g protein · ${calories} kcal`;
    }

    const warnings = [];
    if (calories > calTarget * 1.1) {
      warnings.push({
        nutrient: 'calories',
        message:  `${calories} kcal — ${Math.round(((calories / calTarget) - 1) * 100)}% above your meal target`,
        fix:      'Ask for a smaller portion or share it',
      });
    }
    if (protein_g < protTarget * 0.8) {
      warnings.push({
        nutrient: 'protein',
        message:  `Only ${protein_g}g protein (target: ${protTarget}g)`,
        fix:      'Add a side of grilled chicken or cottage cheese to boost protein',
      });
    }
    if (carbs_g > carbTarget * 1.1) {
      warnings.push({
        nutrient: 'carbs',
        message:  `${carbs_g}g carbs — above your ${carbTarget}g target`,
        fix:      'Ask for less rice or bread, or swap for a salad',
      });
    }
    if (fat_g > fatTarget * 1.1) {
      warnings.push({
        nutrient: 'fat',
        message:  `${fat_g}g fat — above your ${fatTarget}g target`,
        fix:      'Ask for sauce on the side or skip added cheese',
      });
    }

    return {
      item: item.name,
      customisation: null,
      reason,
      estimated_macros: { calories, protein_g, carbs_g, fat_g, sodium_mg: null, sugar_g: null },
      protein_coverage_pct,
      warnings,
    };
  }

  return {
    best_order:     itemToEntry(sorted[0]),
    backup_options: sorted.slice(1, 4).map(itemToEntry),
    avoid:          [],
    coach_note:     null,
  };
}

function buildMenuExtractPrompt(restaurantName) {
  const isChain = isKnownChain(restaurantName);
  return `List menu items for ${restaurantName} with estimated nutrition per standard serving.
${isChain ? 'Use published nutritional values.' : 'Estimate from typical ingredients and portion sizes.'}
Include 15–30 items across all main categories. For each item provide: exact menu name, calories, protein (g), carbs (g), fat (g).`;
}

export async function getRestaurantRecs(restaurantName, _cuisineTypes, userContext) {
  const prompt  = buildMenuExtractPrompt(restaurantName);
  const rawData = await aiWithTools(prompt, RESTAURANT_MENU_EXTRACT_TOOLS, 'restaurant_menu_data', 1200, 'restaurant_pick');
  const items   = rawData?.items || [];
  const userMacros = {
    calories: userContext.currentMealCalorieTarget,
    protein:  userContext.mealProteinTarget,
    carbs:    userContext.mealCarbTarget,
    fat:      userContext.mealFatTarget,
  };
  return matchMenuItems(items, userMacros) || {
    best_order: null, backup_options: [], avoid: [],
    coach_note: 'Could not match items — try scanning the menu instead.',
  };
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
