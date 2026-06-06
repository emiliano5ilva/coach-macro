#!/usr/bin/env node
/**
 * test-allergen-filter.mjs — Exhaustive test harness for the allergen filter.
 *
 * Imports the REAL findAllergens / isSafe / mealHasAllergen / scanTextAllergens
 * from src/utils/allergenFilter.js — the same code the app ships.
 *
 * Run: node scripts/test-allergen-filter.mjs
 * Exits 0 on all-pass, nonzero on any failure (CI-friendly).
 */

import { findAllergens, isSafe, mealHasAllergen, scanTextAllergens } from '../src/utils/allergenFilter.js';

// ── Test runner ───────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function expect(label, actual, expectedPredicate, hint = '') {
  const ok = expectedPredicate(actual);
  if (ok) {
    passed++;
  } else {
    failed++;
    failures.push({ label, actual, hint });
  }
}

// MUST flag: findAllergens(text, [chip]) must include chip
function mustFlag(label, text, chip) {
  const got = findAllergens(text, [chip]);
  expect(label, got, r => r.includes(chip),
    `Expected "${chip}" to be flagged in "${text}" but got [${got}]`);
}

// MUST NOT flag: findAllergens(text, [chip]) must NOT include chip
function mustSafe(label, text, chip) {
  const got = findAllergens(text, [chip]);
  expect(label, got, r => !r.includes(chip),
    `Expected "${chip}" NOT to be flagged in "${text}" but got [${got}]`);
}

// Multi-chip: findAllergens must include ALL listed chips
function mustFlagAll(label, text, chips) {
  const got = findAllergens(text, chips);
  const missing = chips.filter(c => !got.includes(c));
  expect(label, got, () => missing.length === 0,
    `Expected all [${chips}] flagged in "${text}" but missed [${missing}]`);
}

// Multi-chip: findAllergens must include NONE of listed chips
function mustSafeAll(label, text, chips) {
  const got = findAllergens(text, chips);
  expect(label, got, r => r.length === 0,
    `Expected NONE of [${chips}] flagged in "${text}" but got [${got}]`);
}

// ── NO DAIRY ─────────────────────────────────────────────────────────────────

console.log('\n── No Dairy — MUST FLAG ──');
mustFlag('milk', '1 cup whole milk', 'No Dairy');
mustFlag('milk in latte', 'oat latte with whole milk', 'No Dairy');
mustFlag('cheddar', '2 slices cheddar cheese', 'No Dairy');
mustFlag('cheese generic', 'melted cheese topping', 'No Dairy');
mustFlag('butter melted', '100g butter, melted', 'No Dairy');
mustFlag('heavy cream', 'heavy cream sauce', 'No Dairy');
mustFlag('double cream', 'double cream dessert', 'No Dairy');
mustFlag('Greek yogurt', '2 tbsp Greek yogurt', 'No Dairy');
mustFlag('yoghurt alt', 'vanilla yoghurt parfait', 'No Dairy');
mustFlag('whey protein', 'whey protein powder', 'No Dairy');
mustFlag('cream cheese', 'cream cheese frosting', 'No Dairy');
mustFlag('parmesan', 'parmesan chicken', 'No Dairy');
mustFlag('mozzarella', 'mozzarella sticks', 'No Dairy');
mustFlag('ricotta', 'ricotta toast', 'No Dairy');
mustFlag('feta', 'feta crumbles', 'No Dairy');
mustFlag('custard', 'vanilla custard', 'No Dairy');
mustFlag('condensed milk', '3 tbsp condensed milk', 'No Dairy');
mustFlag('kefir', 'kefir drink', 'No Dairy');
mustFlag('paneer', 'paneer tikka masala', 'No Dairy');
mustFlag('ghee', 'ghee roasted vegetables', 'No Dairy');
mustFlag('sour cream', 'sour cream dip', 'No Dairy');
mustFlag('brie', 'brie and crackers', 'No Dairy');
mustFlag('gouda', 'smoked gouda sandwich', 'No Dairy');
mustFlag('gruyere', 'gruyere fondue', 'No Dairy');
mustFlag('mascarpone', 'mascarpone filling', 'No Dairy');
mustFlag('buttermilk', 'buttermilk fried chicken', 'No Dairy');
mustFlag('lactalbumin', 'protein blend with lactalbumin', 'No Dairy');
mustFlag('ice cream', 'vanilla ice cream scoop', 'No Dairy');
mustFlag('casein', 'casein protein shake', 'No Dairy');
mustFlag('kefir', 'plain kefir bowl', 'No Dairy');

console.log('\n── No Dairy — MUST NOT FLAG (false-positive protection) ──');
mustSafe('coconut milk', 'coconut milk', 'No Dairy');
mustSafe('coconut milk in recipe', 'Thai curry with coconut milk', 'No Dairy');
mustSafe('almond milk', 'almond milk latte', 'No Dairy');
mustSafe('oat milk', 'oat milk pancakes', 'No Dairy');
mustSafe('soy milk', 'soy milk cereal', 'No Dairy');
mustSafe('rice milk', 'rice milk drink', 'No Dairy');
mustSafe('cashew milk', 'cashew milk smoothie', 'No Dairy');
mustSafe('hemp milk', 'hemp milk porridge', 'No Dairy');
mustSafe('coconut cream', 'coconut cream soup', 'No Dairy');
mustSafe('coconut yogurt', 'coconut yogurt bowl', 'No Dairy');
mustSafe('butter lettuce', 'butter lettuce salad', 'No Dairy');
mustSafe('peanut butter', 'peanut butter toast', 'No Dairy');
mustSafe('almond butter', 'almond butter banana', 'No Dairy');
mustSafe('cashew butter', 'cashew butter spread', 'No Dairy');
mustSafe('sunflower butter', 'sunflower butter sandwich', 'No Dairy');
mustSafe('tahini', 'tahini dressing', 'No Dairy');
mustSafe('butternut squash', 'butternut squash soup', 'No Dairy');
mustSafe('dairy-free', 'dairy-free chocolate cake', 'No Dairy');
mustSafe('salmon (unrelated to dairy)', 'grilled salmon fillet', 'No Dairy');
mustSafe('eggplant (unrelated to dairy)', 'roasted eggplant', 'No Dairy');

// ── NO GLUTEN ─────────────────────────────────────────────────────────────────

console.log('\n── No Gluten — MUST FLAG ──');
mustFlag('wheat bread', 'whole wheat bread', 'No Gluten');
mustFlag('wheat generic', 'contains wheat', 'No Gluten');
mustFlag('barley', 'barley soup', 'No Gluten');
mustFlag('rye', 'rye crispbread', 'No Gluten');
mustFlag('malt', 'malt vinegar dressing', 'No Gluten');
mustFlag('malted', 'malted milk powder', 'No Gluten');
mustFlag('pasta', 'pasta primavera', 'No Gluten');
mustFlag('couscous', 'couscous salad', 'No Gluten');
mustFlag('bulgur', 'bulgur wheat bowl', 'No Gluten');
mustFlag('semolina', 'semolina flour', 'No Gluten');
mustFlag('seitan', 'seitan skewers', 'No Gluten');
mustFlag('panko', 'panko breadcrumbs', 'No Gluten');
mustFlag('breadcrumb', 'breadcrumb coating', 'No Gluten');
mustFlag('cracker', 'graham cracker crust', 'No Gluten');
mustFlag('farro', 'farro bowl', 'No Gluten');
mustFlag('spelt', 'spelt flour pancakes', 'No Gluten');
mustFlag('soy sauce', 'soy sauce marinade', 'No Gluten');
mustFlag('udon', 'udon noodle soup', 'No Gluten');
mustFlag('naan', 'naan bread', 'No Gluten');
mustFlag('pita', 'pita pocket wrap', 'No Gluten');
mustFlag('ramen', 'spicy ramen broth', 'No Gluten');
mustFlag('durum', 'durum wheat pasta', 'No Gluten');
mustFlag('kamut', 'kamut grain salad', 'No Gluten');
mustFlag('spaghetti', 'spaghetti bolognese', 'No Gluten');
mustFlag('linguine', 'shrimp scampi over linguine', 'No Gluten');
mustFlag('fettuccine', 'fettuccine alfredo', 'No Gluten');
mustFlag('penne', 'penne arrabiata', 'No Gluten');
mustFlag('rigatoni', 'rigatoni bake', 'No Gluten');
mustFlag('lasagna', 'beef lasagna', 'No Gluten');
mustFlag('ravioli', 'cheese ravioli', 'No Gluten');
mustFlag('tortellini', 'tortellini soup', 'No Gluten');
mustFlag('orzo', 'lemon orzo', 'No Gluten');
mustFlag('wonton', 'wonton soup', 'No Gluten');
mustFlag('croissant', 'butter croissant', 'No Gluten');
mustFlag('triticale', 'triticale grain', 'No Gluten');

console.log('\n── No Gluten — MUST NOT FLAG ──');
mustSafe('buckwheat', 'buckwheat pancakes', 'No Gluten');
mustSafe('buckwheat noodles', 'buckwheat noodles (soba)', 'No Gluten');
mustSafe('buckwheat flour', 'buckwheat flour crepe', 'No Gluten');
mustSafe('rice noodle', 'stir-fried rice noodles', 'No Gluten');
mustSafe('glass noodle', 'glass noodle salad', 'No Gluten');
mustSafe('shirataki', 'shirataki noodle bowl', 'No Gluten');
mustSafe('zucchini noodle', 'zucchini noodle stir fry', 'No Gluten');
mustSafe('gluten-free', 'gluten-free soy sauce', 'No Gluten');
mustSafe('salmon', 'baked salmon with quinoa', 'No Gluten');
mustSafe('quinoa', 'quinoa salad bowl', 'No Gluten');
mustSafe('rice', 'brown rice and chicken', 'No Gluten');
mustSafe('corn', 'corn tortilla tacos', 'No Gluten');
mustSafe('potato', 'mashed potato', 'No Gluten');
mustSafe('oat (plain)', 'rolled oats porridge', 'No Gluten');

// ── NO PORK ───────────────────────────────────────────────────────────────────

console.log('\n── No Pork — MUST FLAG ──');
mustFlag('pork tenderloin', 'pork tenderloin roast', 'No Pork');
mustFlag('pork chop', 'grilled pork chop', 'No Pork');
mustFlag('pork belly', 'crispy pork belly', 'No Pork');
mustFlag('pork loin', 'slow roasted pork loin', 'No Pork');
mustFlag('bacon', 'bacon and eggs', 'No Pork');
mustFlag('ham', 'ham and cheese', 'No Pork');
mustFlag('prosciutto', 'prosciutto di parma', 'No Pork');
mustFlag('pancetta', 'pancetta pasta', 'No Pork');
mustFlag('lard', 'lard shortening', 'No Pork');
mustFlag('chorizo', 'chorizo sausage crumble', 'No Pork');
mustFlag('salami', 'salami pizza', 'No Pork');
mustFlag('pepperoni', 'pepperoni pizza slice', 'No Pork');
mustFlag('mortadella', 'mortadella panini', 'No Pork');
mustFlag('soppressata', 'soppressata antipasto', 'No Pork');
mustFlag('bratwurst', 'bratwurst on the grill', 'No Pork');
mustFlag('andouille', 'andouille sausage jambalaya', 'No Pork');
mustFlag('kielbasa', 'kielbasa and sauerkraut', 'No Pork');
mustFlag('sausage generic', 'sausage and peppers', 'No Pork');
mustFlag('guanciale', 'pasta alla gricia with guanciale', 'No Pork');
mustFlag('gammon', 'gammon steak', 'No Pork');
mustFlag('capicola', 'capicola cold cut', 'No Pork');

console.log('\n── No Pork — MUST NOT FLAG ──');
mustSafe('chicken sausage', 'grilled chicken sausage links', 'No Pork');
mustSafe('turkey sausage', 'turkey sausage patty', 'No Pork');
mustSafe('beef sausage', 'beef sausage bun', 'No Pork');
mustSafe('lamb sausage', 'lamb sausage kebab', 'No Pork');
mustSafe('turkey bacon', 'turkey bacon strips', 'No Pork');
mustSafe('turkey ham', 'turkey ham slices', 'No Pork');
mustSafe('chicken chorizo', 'chicken chorizo hash', 'No Pork');
mustSafe('chicken andouille', 'chicken andouille gumbo', 'No Pork');
mustSafe('pork-free', 'pork-free halal meal', 'No Pork');
mustSafe('chicken breast', 'grilled chicken breast', 'No Pork');
mustSafe('beef burger', 'beef burger patty', 'No Pork');
mustSafe('lamb chop', 'grilled lamb chop', 'No Pork');
mustSafe('salmon', 'teriyaki salmon', 'No Pork');

// ── NO SHELLFISH ─────────────────────────────────────────────────────────────

console.log('\n── No Shellfish — MUST FLAG ──');
mustFlag('shrimp', 'grilled shrimp skewers', 'No Shellfish');
mustFlag('shrimp scampi', 'shrimp scampi with garlic', 'No Shellfish');
mustFlag('prawn', 'prawn cocktail', 'No Shellfish');
mustFlag('crab', 'crab cakes with remoulade', 'No Shellfish');
mustFlag('lobster', 'lobster roll with mayo', 'No Shellfish');
mustFlag('scallop', 'seared scallops', 'No Shellfish');
mustFlag('calamari', 'calamari rings', 'No Shellfish');
mustFlag('mussel', 'steamed mussels in wine', 'No Shellfish');
mustFlag('oyster', 'oyster stew', 'No Shellfish');
mustFlag('clam', 'clam chowder soup', 'No Shellfish');
mustFlag('crayfish', 'crayfish étouffée', 'No Shellfish');
mustFlag('crawfish', 'crawfish boil', 'No Shellfish');
mustFlag('surimi', 'surimi salad', 'No Shellfish');
mustFlag('octopus', 'grilled octopus carpaccio', 'No Shellfish');
mustFlag('squid', 'squid ink risotto', 'No Shellfish');
mustFlag('langoustine', 'langoustine bisque', 'No Shellfish');
mustFlag('abalone', 'abalone sashimi', 'No Shellfish');
mustFlag('krill', 'krill oil capsule', 'No Shellfish');
mustFlag('seafood', 'seafood paella', 'No Shellfish');
mustFlag('seafood mix', 'mixed seafood stir fry', 'No Shellfish');
mustFlag('cockle', 'cockle and winkle platter', 'No Shellfish');
mustFlag('imitation crab', 'imitation crab california roll', 'No Shellfish');
mustFlag('cuttlefish', 'cuttlefish in black sauce', 'No Shellfish');

console.log('\n── No Shellfish — MUST NOT FLAG (fish ≠ shellfish) ──');
mustSafe('salmon', 'pan-seared salmon fillet', 'No Shellfish');
mustSafe('tuna', 'grilled tuna steak', 'No Shellfish');
mustSafe('cod', 'baked cod with herbs', 'No Shellfish');
mustSafe('tilapia', 'tilapia tacos', 'No Shellfish');
mustSafe('halibut', 'grilled halibut', 'No Shellfish');
mustSafe('trout', 'smoked rainbow trout', 'No Shellfish');
mustSafe('mahi mahi', 'mahi mahi wrap', 'No Shellfish');
mustSafe('sea bass', 'pan-seared sea bass', 'No Shellfish');
mustSafe('mackerel', 'smoked mackerel', 'No Shellfish');
mustSafe('sardines', 'sardines on toast', 'No Shellfish');
mustSafe('herring', 'pickled herring', 'No Shellfish');
mustSafe('snapper', 'red snapper fillet', 'No Shellfish');
mustSafe('anchovies', 'anchovy paste', 'No Shellfish');
mustSafe('shellfish-free', 'shellfish-free bouillabaisse', 'No Shellfish');
mustSafe('chicken', 'grilled chicken thigh', 'No Shellfish');

// ── NO EGGS ───────────────────────────────────────────────────────────────────

console.log('\n── No Eggs — MUST FLAG ──');
mustFlag('scrambled eggs', 'scrambled eggs on toast', 'No Eggs');
mustFlag('2 eggs', '2 large eggs, beaten', 'No Eggs');
mustFlag('egg whites', 'egg white omelet', 'No Eggs');
mustFlag('egg yolk', 'rich egg yolk sauce', 'No Eggs');
mustFlag('mayo', 'mayo spread sandwich', 'No Eggs');
mustFlag('mayonnaise', 'mayonnaise dressing', 'No Eggs');
mustFlag('aioli', 'garlic aioli dip', 'No Eggs');
mustFlag('meringue', 'lemon meringue pie', 'No Eggs');
mustFlag('frittata', 'spinach frittata', 'No Eggs');
mustFlag('omelet', 'cheese omelet', 'No Eggs');
mustFlag('omelette', 'mushroom omelette', 'No Eggs');
mustFlag('hollandaise', 'eggs benedict with hollandaise', 'No Eggs');
mustFlag('custard', 'vanilla custard tart', 'No Eggs');
mustFlag('quiche', 'spinach quiche', 'No Eggs');
mustFlag('eggnog', 'holiday eggnog drink', 'No Eggs');
mustFlag('albumin', 'egg albumin powder', 'No Eggs');
mustFlag('deviled eggs', '2 deviled eggs', 'No Eggs');
mustFlag('egg salad', 'classic egg salad', 'No Eggs');

console.log('\n── No Eggs — MUST NOT FLAG ──');
mustSafe('eggplant', 'roasted eggplant', 'No Eggs');
mustSafe('eggplant parmesan', 'eggplant parmesan bake', 'No Eggs');
mustSafe('eggplant stir fry', 'eggplant and tofu stir fry', 'No Eggs');
mustSafe('egg-free', 'egg-free vegan mayo', 'No Eggs');
mustSafe('salmon', 'baked salmon with herbs', 'No Eggs');
mustSafe('chicken breast', 'grilled chicken breast', 'No Eggs');
mustSafe('almond flour', 'almond flour muffin', 'No Eggs');

// ── NO NUTS ───────────────────────────────────────────────────────────────────

console.log('\n── No Nuts — MUST FLAG ──');
mustFlag('almond', 'sliced almonds on salad', 'No Nuts');
mustFlag('walnut', 'walnut crusted chicken', 'No Nuts');
mustFlag('pecan', 'pecan pie', 'No Nuts');
mustFlag('cashew', 'cashew cream sauce', 'No Nuts');
mustFlag('pistachio', 'pistachio gelato', 'No Nuts');
mustFlag('hazelnut', 'hazelnut praline', 'No Nuts');
mustFlag('macadamia', 'macadamia nut cookie', 'No Nuts');
mustFlag('pine nut', 'pine nut pesto', 'No Nuts');
mustFlag('brazil nut', 'brazil nut bark', 'No Nuts');
mustFlag('peanut', 'peanut sauce noodles', 'No Nuts');
mustFlag('peanut butter', 'peanut butter cookie', 'No Nuts');
mustFlag('almond butter', 'almond butter toast', 'No Nuts');
mustFlag('cashew butter', 'cashew butter cup', 'No Nuts');
mustFlag('nut butter', 'nut butter blend', 'No Nuts');
mustFlag('marzipan', 'marzipan filling stollen', 'No Nuts');
mustFlag('praline', 'praline topping', 'No Nuts');
mustFlag('mixed nuts', 'handful of mixed nuts', 'No Nuts');
mustFlag('trail mix', 'trail mix with raisins', 'No Nuts');
mustFlag('chestnut', 'roasted chestnut stuffing', 'No Nuts');
mustFlag('coconut', 'shredded coconut topping', 'No Nuts');
mustFlag('coconut flakes', 'toasted coconut flakes', 'No Nuts');

console.log('\n── No Nuts — MUST NOT FLAG ──');
mustSafe('butternut squash', 'butternut squash soup', 'No Nuts');
mustSafe('butternut squash purée', 'butternut squash purée', 'No Nuts');
mustSafe('nutmeg', 'pinch of nutmeg spice', 'No Nuts');
mustSafe('nutmeg in sauce', 'béchamel with nutmeg', 'No Nuts');
mustSafe('water chestnut', 'water chestnut stir fry', 'No Nuts');
mustSafe('doughnut', 'glazed doughnut', 'No Nuts');
mustSafe('donut', 'chocolate donut hole', 'No Nuts');
mustSafe('nut-free', 'nut-free granola bar', 'No Nuts');
mustSafe('pumpkin seed', 'pumpkin seed salad topping', 'No Nuts');
mustSafe('sunflower seed', 'sunflower seed spread', 'No Nuts');
mustSafe('hemp seed', 'hemp seed smoothie', 'No Nuts');
mustSafe('flax seed', 'flax seed bowl', 'No Nuts');
mustSafe('sesame seed', 'sesame seed crusted tuna', 'No Nuts');
mustSafe('salmon', 'sesame seed crusted salmon', 'No Nuts');

// ── CROSS-ALLERGEN ASSERTIONS ─────────────────────────────────────────────────

console.log('\n── Cross-allergen safety ──');

// Shellfish restriction must NOT flag fish
mustSafeAll('salmon clean under shellfish', 'grilled salmon fillet with lemon', ['No Shellfish']);
mustSafeAll('tuna clean under shellfish', 'ahi tuna poke bowl', ['No Shellfish']);
mustSafeAll('tilapia clean under shellfish', 'pan-fried tilapia', ['No Shellfish']);
mustSafeAll('cod clean under shellfish', 'cod with herbs', ['No Shellfish']);

// Nut restriction must NOT flag common safe-word false positives
mustSafeAll('butternut safe under nuts', 'roasted butternut squash cubes', ['No Nuts']);
mustSafeAll('nutmeg safe under nuts', 'a pinch of nutmeg', ['No Nuts']);
mustSafeAll('water chestnut safe under nuts', 'sliced water chestnuts', ['No Nuts']);
mustSafeAll('doughnut safe under nuts', 'plain doughnut', ['No Nuts']);

// Egg restriction must NOT flag eggplant
mustSafeAll('eggplant safe under eggs', 'grilled eggplant slices', ['No Eggs']);
mustSafeAll('eggplant parmesan under eggs', 'eggplant parmesan', ['No Eggs']);

// Pork restriction must NOT flag non-pork sausages
mustSafeAll('chicken sausage safe under pork', 'chicken sausage and peppers', ['No Pork']);
mustSafeAll('turkey bacon safe under pork', 'turkey bacon breakfast', ['No Pork']);

// Dairy restriction must NOT flag plant milks or nut butters
mustSafeAll('coconut milk safe under dairy', 'Thai green curry with coconut milk', ['No Dairy']);
mustSafeAll('oat milk safe under dairy', 'oat milk flat white', ['No Dairy']);
mustSafeAll('peanut butter safe under dairy', 'peanut butter on rice cakes', ['No Dairy']);
mustSafeAll('butter lettuce safe under dairy', 'butter lettuce BLT wrap', ['No Dairy']);

// Gluten restriction must NOT flag buckwheat
mustSafeAll('buckwheat safe under gluten', 'buckwheat groats with berries', ['No Gluten']);
mustSafeAll('rice noodle safe under gluten', 'rice noodle pad thai', ['No Gluten']);

// ── COMBINED MEAL NAMES (multi-restriction) ───────────────────────────────────

console.log('\n── Combined meal names ──');

// SHOULD BE CLEAN
mustSafeAll(
  'Salmon + butternut squash under [shellfish, nuts]',
  'Pan-seared salmon with butternut squash purée and herb oil',
  ['No Shellfish', 'No Nuts'],
);
mustSafeAll(
  'Chicken bowl under [dairy, eggs, pork]',
  'Grilled chicken rice bowl with steamed broccoli and sesame sauce',
  ['No Dairy', 'No Eggs', 'No Pork'],
);
mustSafeAll(
  'Buckwheat salad under [gluten, pork]',
  'Buckwheat noodle salad with cucumber and sesame',
  ['No Gluten', 'No Pork'],
);
mustSafeAll(
  'Vegan avocado toast under all 6',
  'Avocado toast on gluten-free bread with tomato and olive oil',
  ['No Dairy', 'No Gluten', 'No Pork', 'No Shellfish', 'No Eggs', 'No Nuts'],
);

// SHOULD FLAG (multiple violations)
mustFlagAll(
  'Shrimp scampi over linguine — flags [shellfish + gluten]',
  'Shrimp scampi over linguine with butter sauce',
  ['No Shellfish', 'No Gluten'],
);
mustFlagAll(
  'Bacon egg cheese croissant — flags [pork + eggs + gluten]',
  'Bacon, egg and cheese croissant sandwich',
  ['No Pork', 'No Eggs', 'No Gluten'],
);
mustFlagAll(
  'Caesar salad — flags [dairy + eggs]',
  'Caesar salad with parmesan, croutons, and egg-based dressing',
  ['No Dairy', 'No Eggs'],
);
mustFlagAll(
  'Peanut butter cookie — flags [nuts + gluten]',
  'Peanut butter cookie with wheat flour',
  ['No Nuts', 'No Gluten'],
);

// ── mealHasAllergen (structured meal objects) ─────────────────────────────────

console.log('\n── mealHasAllergen (structured meals) ──');

const cleanMeal = { name: 'Grilled Chicken Bowl', ing: ['200g chicken breast', '100g brown rice', '50g broccoli'] };
expect('clean meal is null', mealHasAllergen(cleanMeal, ['No Dairy', 'No Pork', 'No Shellfish']), v => v === null);

const dairyMeal = { name: 'Parmesan Pasta', ing: ['spaghetti', 'parmesan cheese', 'butter'] };
expect('dairy meal flagged', mealHasAllergen(dairyMeal, ['No Dairy', 'No Gluten']), v => v !== null);

const legacyMeal = { name: 'Shrimp Tacos', ingredients: ['corn tortilla', 'grilled shrimp', 'salsa'], instructions: 'Grill shrimp.' };
expect('legacy schema (ingredients) flagged shellfish', mealHasAllergen(legacyMeal, ['No Shellfish']), v => v === 'No Shellfish');

const eggplantMeal = { name: 'Eggplant Stir Fry', ing: ['eggplant', 'bell pepper', 'garlic', 'soy sauce'] };
expect('eggplant not flagged as egg', mealHasAllergen(eggplantMeal, ['No Eggs']), v => v === null);
expect('eggplant soy sauce flagged as gluten', mealHasAllergen(eggplantMeal, ['No Gluten']), v => v === 'No Gluten');

// ── scanTextAllergens (free-form text) ────────────────────────────────────────

console.log('\n── scanTextAllergens (free-form text) ──');

const cleanText = 'Option 1: Grilled salmon with steamed broccoli and quinoa.\nCalories: 520 kcal, 42g protein.';
expect('clean restaurant text', scanTextAllergens(cleanText, ['No Shellfish', 'No Dairy']), r => r.length === 0);

const shellText = 'Option 1: Shrimp tacos with mango salsa.\nOption 2: Grilled salmon with greens.';
expect('shellfish detected in text', scanTextAllergens(shellText, ['No Shellfish']), r => r.includes('No Shellfish'));

const multiText = 'Breakfast: scrambled eggs with cheddar cheese and turkey sausage.\nLunch: chicken salad.';
expect('eggs + dairy detected in text', scanTextAllergens(multiText, ['No Eggs', 'No Dairy', 'No Pork']),
  r => r.includes('No Eggs') && r.includes('No Dairy') && !r.includes('No Pork'));

// ── COMPOSITIONAL TESTS (safe phrase must not mask OTHER allergens) ───────────
//
// These test the multi-ingredient scenario where a safe phrase for allergen A
// must NOT suppress detection of allergen B (or A itself) elsewhere in the text.
// They exercise the per-fragment fix: each comma/newline-delimited token is
// checked independently so safe phrases are scoped to their own token only.

console.log('\n── Compositional: safe phrase must not mask OTHER real allergens ──');

// "almond butter" is a dairy safe-phrase, but "whole milk" and "whey" must still
// flag dairy. "almond butter" must still flag nuts.
mustFlagAll(
  'almond butter + whole milk + whey → dairy AND nuts',
  'almond butter, whole milk, whey, banana',
  ['No Dairy', 'No Nuts'],
);

// "butternut squash" is a nuts safe-phrase. "coconut milk" on a different line
// must still flag nuts. (This was the Paleo Beef Butternut Squash Curry bug.)
mustFlagAll(
  'butternut squash + coconut milk + beef → nuts',
  'butternut squash, coconut milk, beef',
  ['No Nuts'],
);

// Coconut milk must flag nuts (coconut is a tree nut per FDA).
// Without any dairy blocklist word, dairy must NOT be flagged.
mustFlag(
  'coconut milk flags nuts',
  'coconut milk, chicken',
  'No Nuts',
);
mustSafe(
  'coconut milk alone does NOT flag dairy',
  'coconut milk, chicken',
  'No Dairy',
);

// "butter lettuce" is a dairy safe-phrase on its own token.
// "shrimp" on a different token must still flag shellfish.
// Dairy must NOT be flagged (butter lettuce is safe).
mustFlag(
  'butter lettuce + shrimp → shellfish',
  'butter lettuce, shrimp, olive oil',
  'No Shellfish',
);
mustSafe(
  'butter lettuce + shrimp → NOT dairy',
  'butter lettuce, shrimp, olive oil',
  'No Dairy',
);

// "almond milk" is a dairy safe-phrase, but "cheddar cheese" must still flag dairy.
// "almond" (in almond milk) must still flag nuts.
mustFlagAll(
  'almond milk + cheddar cheese → dairy AND nuts',
  'almond milk, cheddar cheese',
  ['No Dairy', 'No Nuts'],
);

// "peanut butter" is a dairy safe-phrase, but "greek yogurt" must still flag dairy.
// "peanut" (in peanut butter) must still flag nuts.
mustFlagAll(
  'peanut butter + greek yogurt → dairy AND nuts',
  'peanut butter, greek yogurt',
  ['No Dairy', 'No Nuts'],
);

// "corn tortilla" is NOT in the gluten blocklist. "tilapia" has no allergens.
// This confirms no false gluten flag for corn-based products.
mustSafeAll(
  'corn tortilla + tilapia → no allergens (no false gluten)',
  'corn tortilla, tilapia',
  ['No Gluten', 'No Dairy', 'No Eggs', 'No Pork', 'No Shellfish', 'No Nuts'],
);

// Per-allergen compositional cases ──────────────────────────────────────────

// DAIRY: dairy safe-phrase does not mask dairy on another ingredient
mustFlagAll(
  'coconut milk (safe) + cheddar → dairy',
  'coconut milk, cheddar cheese',
  ['No Dairy'],
);
mustFlagAll(
  'oat milk (safe) + cream cheese → dairy',
  'oat milk, cream cheese',
  ['No Dairy'],
);
mustFlagAll(
  'cashew butter (safe for dairy) + whole milk → dairy',
  'cashew butter, whole milk',
  ['No Dairy'],
);
// Dairy safe-phrase still correctly suppresses its own token
mustSafeAll(
  'butternut squash alone → NOT dairy',
  'butternut squash',
  ['No Dairy'],
);
mustSafeAll(
  'almond butter alone → NOT dairy',
  'almond butter',
  ['No Dairy'],
);

// NUTS: nuts safe-phrase does not mask nuts on another ingredient
mustFlagAll(
  'butternut squash (safe) + walnuts → nuts',
  'butternut squash, walnuts',
  ['No Nuts'],
);
mustFlagAll(
  'nutmeg (safe) + cashews → nuts',
  'nutmeg, cashews',
  ['No Nuts'],
);
mustFlagAll(
  'butternut (safe) + almond butter → nuts (almond)',
  'butternut, almond butter',
  ['No Nuts'],
);
// coconut milk (on its own) still flags nuts (coconut = tree nut)
mustFlag(
  'coconut milk alone flags nuts',
  'coconut milk',
  'No Nuts',
);

// EGGS: eggs safe-phrase does not mask eggs on another ingredient
mustFlagAll(
  'eggplant (safe) + egg white → eggs',
  'eggplant, egg white',
  ['No Eggs'],
);
mustFlagAll(
  'eggplant (safe) + scrambled eggs → eggs',
  'eggplant, scrambled eggs',
  ['No Eggs'],
);
// eggplant alone still safe
mustSafeAll(
  'eggplant alone → NOT eggs',
  'eggplant',
  ['No Eggs'],
);

// PORK: pork safe-phrase does not mask pork on another ingredient
mustFlagAll(
  'turkey bacon (safe) + pork chop → pork',
  'turkey bacon, pork chop, lean, raw',
  ['No Pork'],
);
mustFlagAll(
  'chicken sausage (safe) + bacon → pork',
  'chicken sausage, bacon',
  ['No Pork'],
);
// turkey bacon alone still safe
mustSafeAll(
  'turkey bacon alone → NOT pork',
  'turkey bacon',
  ['No Pork'],
);

// NEWLINE-SEPARATED (mirrors seeder join: ingredients.map(i=>i.item).join("\n"))
mustFlagAll(
  'newline join: almond butter\\nwhole milk\\nwhey → dairy AND nuts',
  'almond butter\nwhole milk\nwhey protein powder',
  ['No Dairy', 'No Nuts'],
);
mustFlagAll(
  'newline join: butternut squash\\ncoconut milk → nuts',
  'butternut squash\ncoconut milk',
  ['No Nuts'],
);
mustFlagAll(
  'newline join: butter lettuce\\nshrimp → shellfish NOT dairy',
  'butter lettuce\nshrimp, raw',
  ['No Shellfish'],
);
mustSafeAll(
  'newline join: butter lettuce\\nshrimp → NOT dairy',
  'butter lettuce\nshrimp, raw',
  ['No Dairy'],
);

// almond butter (nuts safe-phrase NOT present) must STILL flag nuts
mustFlag(
  'almond butter standalone flags nuts',
  'almond butter',
  'No Nuts',
);
mustFlag(
  'peanut butter standalone flags nuts',
  'peanut butter, smooth',
  'No Nuts',
);
mustFlag(
  'cashew butter standalone flags nuts',
  'cashew butter',
  'No Nuts',
);

// ── isSafe convenience wrapper ────────────────────────────────────────────────

console.log('\n── isSafe wrapper ──');
expect('isSafe true for clean', isSafe('grilled chicken breast', ['No Dairy', 'No Pork']), v => v === true);
expect('isSafe false for violation', isSafe('bacon strips', ['No Pork']), v => v === false);
expect('isSafe with empty chips', isSafe('whatever ingredient', []), v => v === true);

// ── RESULTS ───────────────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(60));
console.log(`TOTAL: ${passed + failed} tests  |  PASS: ${passed}  |  FAIL: ${failed}`);
console.log('═'.repeat(60));

if (failures.length > 0) {
  console.log('\nFAILURES:');
  for (const f of failures) {
    console.log(`  ✗ ${f.label}`);
    console.log(`    actual: ${JSON.stringify(f.actual)}`);
    if (f.hint) console.log(`    hint:   ${f.hint}`);
  }
  console.log('');
  process.exit(1);
} else {
  console.log('\nAll tests passed ✓\n');
  process.exit(0);
}
