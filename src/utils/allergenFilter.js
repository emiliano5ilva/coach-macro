/**
 * allergenFilter.js — Single source of truth for deterministic allergen detection.
 *
 * Importers: fuel.jsx, ob_screens2.jsx, scripts/test-allergen-filter.mjs
 *
 * Coconut note: blocked by default for 'No Nuts' (FDA tree-nut designation).
 * Most coconut-tolerant users can uncheck No Nuts. Coconut milk/cream is safe
 * for 'No Dairy' via ALLERGEN_SAFE_PHRASES.
 */

export const ALLERGEN_BLOCKLIST = {
  'No Dairy': [
    'milk','cheese','butter','cream','yogurt','yoghurt','whey','casein',
    'ghee','custard','ice cream','paneer','ricotta','mozzarella','parmesan',
    'cheddar','feta','mascarpone','buttermilk','condensed milk','lactose',
    'brie','gouda','gruyere','sour cream','cream cheese','kefir',
    'half and half','lactalbumin','quark','fromage frais',
  ],
  'No Gluten': [
    'wheat','barley','rye','malt','malted','bread','pasta','couscous','bulgur',
    'semolina','seitan','breadcrumb','breadcrumbs','cracker','farro','spelt',
    'triticale','durum','kamut','soy sauce','panko','naan','pita','ramen',
    'udon','wheat flour','all purpose flour','flour tortilla',
    'spaghetti','linguine','fettuccine','penne','rigatoni','lasagna','lasagne',
    'ravioli','tortellini','farfalle','fusilli','orzo','wonton','croissant',
    'worcestershire',
  ],
  'No Pork': [
    'pork','bacon','ham','prosciutto','pancetta','lard','gammon','guanciale',
    'chorizo','salami','pepperoni','mortadella','soppressata','sopressata',
    'capicola','pork belly','pork chop','pork loin','bratwurst','andouille',
    'kielbasa','sausage',
  ],
  'No Shellfish': [
    'shrimp','prawn','crab','lobster','oyster','mussel','clam','scallop',
    'crayfish','crawfish','langoustine','abalone','surimi','imitation crab',
    'squid','calamari','octopus','seafood','frutti di mare','cockle','krill',
    'cuttlefish',
  ],
  'No Eggs': [
    'egg','eggs','egg white','egg yolk','egg whites','egg yolks','eggnog',
    'mayonnaise','mayo','albumin','meringue','aioli','frittata','omelet',
    'omelette','hollandaise','custard','quiche',
  ],
  'No Nuts': [
    'almond','walnut','pecan','cashew','pistachio','hazelnut','macadamia',
    'pine nut','brazil nut','peanut','nut butter','marzipan','praline',
    'mixed nuts','trail mix','chestnut','coconut',
  ],
};

/**
 * Safe phrases: if a food string CONTAINS one of these as a substring,
 * it is safe for that allergen chip despite an apparent keyword match.
 * Checked BEFORE the blocklist — any match short-circuits to "safe".
 */
export const ALLERGEN_SAFE_PHRASES = {
  'No Dairy': [
    'butter lettuce','almond butter','peanut butter','cashew butter',
    'sunflower butter','seed butter','coconut butter','tahini',
    'almond milk','oat milk','soy milk','rice milk','coconut milk',
    'cashew milk','hemp milk','coconut cream','oat cream',
    'coconut yogurt','soy yogurt','dairy-free','vegan cream','butternut',
  ],
  'No Gluten': [
    'buckwheat','rice noodle','glass noodle','shirataki',
    'zucchini noodle','gluten-free',
  ],
  'No Eggs': ['eggplant','egg-free'],
  'No Nuts': [
    'nutmeg','water chestnut','doughnut','donut','butternut squash','butternut',
    'nut-free','peanut-free',
  ],
  'No Pork': [
    'turkey bacon','turkey ham','chicken sausage','turkey sausage','beef sausage',
    'lamb sausage','fish sausage','chicken chorizo','turkey chorizo',
    'beef chorizo','chicken andouille','turkey pepperoni','chicken pepperoni',
    'pork-free',
  ],
  'No Shellfish': ['shellfish-free'],
};

function _esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Normalize a string: lowercase, collapse non-alphanumeric to single space.
function _norm(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * findAllergens(text, activeChips) → string[]
 *
 * Returns every allergen chip from activeChips that the text violates.
 *
 * Matching rules:
 *  - Text is split on commas and newlines into per-ingredient fragments.
 *    Each fragment is checked independently so that a safe phrase in one
 *    fragment (e.g. "almond butter" for No Dairy) cannot suppress allergen
 *    detection from a different fragment (e.g. "whole milk" or "whey").
 *  - Within each fragment: safe phrases are normalized and checked as a
 *    substring BEFORE the blocklist. Any safe-phrase match short-circuits
 *    that chip for THAT FRAGMENT ONLY.
 *  - Blocklist keywords use a word-boundary regex with optional trailing 's'
 *    to catch common plurals without false positives.
 *
 * @param {string}   text        - ingredient name(s), meal name, recipe line, etc.
 * @param {string[]} activeChips - e.g. ['No Dairy', 'No Gluten']
 * @returns {string[]}           - violated chip names (empty = clean)
 */
export function findAllergens(text, activeChips) {
  if (!activeChips || !activeChips.length || text == null) return [];

  // Split on commas and newlines so each ingredient/token is checked on its
  // own. A safe phrase in one fragment (e.g. "almond butter") cannot mask a
  // real allergen in a different fragment (e.g. "whole milk", "whey").
  const fragments = String(text).split(/[,\n]+/).map(s => s.trim()).filter(Boolean);

  const violated = new Set();

  for (const fragment of fragments) {
    const norm = _norm(fragment);
    for (const chip of activeChips) {
      if (violated.has(chip)) continue; // already found for this chip
      // Safe-phrase override: if this fragment contains a safe phrase for this
      // chip, skip the blocklist check for THIS FRAGMENT only.
      const safePhrases = ALLERGEN_SAFE_PHRASES[chip] || [];
      if (safePhrases.some(ph => norm.includes(_norm(ph)))) continue;
      // Blocklist: word-boundary match with optional trailing 's' for plurals
      const kws = ALLERGEN_BLOCKLIST[chip] || [];
      const hit = kws.some(kw => {
        const re = new RegExp('(^|[^a-z0-9])' + _esc(_norm(kw)) + 's?($|[^a-z0-9])', 'i');
        return re.test(norm);
      });
      if (hit) violated.add(chip);
    }
  }

  return [...violated];
}

/**
 * isSafe(text, activeChips) → bool
 * Returns true when text contains NO allergen violations.
 */
export function isSafe(text, activeChips) {
  return findAllergens(text, activeChips).length === 0;
}

/**
 * mealHasAllergen(meal, activeChips) → string | null
 *
 * Checks a structured meal object. Returns the first violated chip, or null.
 * Handles both new schema (ing/steps) and legacy/alt schema (ingredients/instructions/description).
 */
export function mealHasAllergen(meal, activeChips) {
  if (!activeChips || !activeChips.length || !meal) return null;
  // Ingredients may be legacy strings ("200g chicken") or structured {item, amount}.
  // Scan only the ingredient name — amounts like "200g" never contain allergen keywords.
  const ingStr = i => typeof i === 'string' ? i : (i?.item || '');
  const texts = [
    meal.name || '',
    meal.description || '',
    meal.steps || '',
    meal.instructions || '',
    ...(Array.isArray(meal.ing) ? meal.ing.map(ingStr) : []),
    ...(Array.isArray(meal.ingredients) ? meal.ingredients.map(ingStr) : []),
  ].filter(Boolean);

  for (const chip of activeChips) {
    for (const t of texts) {
      if (findAllergens(t, [chip]).length > 0) return chip;
    }
  }
  return null;
}

/**
 * scanTextAllergens(text, activeChips) → string[]
 *
 * Scans multi-line free-form AI text. Returns all violated chips found
 * across any line. Used for restaurant AI and recipe suggestion responses.
 */
export function scanTextAllergens(text, activeChips) {
  if (!activeChips || !activeChips.length || !text) return [];
  const found = new Set();
  for (const line of String(text).split(/\n/)) {
    for (const chip of findAllergens(line, activeChips)) found.add(chip);
  }
  return [...found];
}
