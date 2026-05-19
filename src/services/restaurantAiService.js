import { streamAI } from '../client.js';

export function buildUserContext(profile, remaining) {
  return {
    goal: profile?.goal || 'maintenance',
    dietary: (profile?.dietary || []).filter(d => d !== 'none'),
    remaining,
  };
}

export async function getRestaurantRecs(restaurantName, cuisineTypes, userContext, onChunk) {
  const { goal, dietary, remaining } = userContext;
  const dietStr = dietary.length > 0 ? `\nDIETARY RESTRICTIONS (strictly avoid): ${dietary.join(', ')}.` : '';
  const cuisineStr = cuisineTypes.filter(t => !['point_of_interest','establishment','food'].includes(t)).slice(0,3).join(', ');
  const prompt = `You are a precision nutrition coach. The user is ordering at ${restaurantName}${cuisineStr ? ` (${cuisineStr})` : ''}.

Remaining macros for this meal: ${remaining.calories} kcal · ${remaining.protein}g protein · ${remaining.carbs}g carbs · ${remaining.fat}g fat
Goal: ${goal}${dietStr}

Reply in exactly this format — no other text:

// ORDER THIS — best option
[Specific menu item with exact customizations. Macros: X kcal / Xg protein / Xg carbs / Xg fat]

// ALSO GOOD — 2 backups
[Option 2 with customizations. Macros: X kcal / Xg protein / Xg carbs / Xg fat]
[Option 3 with customizations. Macros: X kcal / Xg protein / Xg carbs / Xg fat]

// SKIP THESE — what to avoid
[1-2 specific items to avoid and the macro reason why]

// COACH NOTE
[One sharp sentence of advice for this meal]`;

  await streamAI(prompt, 600, 'restaurant_pick', () => {}, onChunk);
}
