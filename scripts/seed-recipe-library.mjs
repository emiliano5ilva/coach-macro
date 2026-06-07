/**
 * seed-recipe-library.mjs
 *
 * Phase 1 of MEAL_FITTER_SPEC.md — ONE-TIME offline authoring pipeline.
 * Run this script once (or in pilot batches) to populate the global recipe
 * library in the Supabase `recipes` table.
 *
 * Pipeline per recipe:
 *   1. AI generates structure (name, ingredients {item,qty,unit}, instructions, slot, diet_tags)
 *   2. USDA FoodData Central computes REAL macros per ingredient
 *   3. allergenFilter.js computes allergen_tags deterministically (NOT from AI)
 *   4. Diet tag validation (remove impossible tags based on ingredients)
 *   5. INSERT as global row (user_id=NULL) via service role
 *
 * Required env vars:
 *   SUPABASE_SERVICE_KEY  — Service role key (in .env already)
 *   ANTHROPIC_API_KEY     — Only required for --generate mode
 *
 * Optional:
 *   USDA_API_KEY          — FoodData Central key (defaults to DEMO_KEY, fine for pilot)
 *
 * After seeding, run scripts/apply-mediterranean-tags.sql in the Supabase SQL editor (or psql) to tag Mediterranean recipes.
 *
 * Usage:
 *   # Pilot (25 pre-generated recipes) — no API key needed:
 *   node scripts/seed-recipe-library.mjs --pilot
 *
 *   # Pilot from a specific JSON file:
 *   node scripts/seed-recipe-library.mjs --from-file=scripts/seed-recipes-pilot.json
 *
 *   # Generate fresh recipes via Anthropic then seed (needs ANTHROPIC_API_KEY):
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/seed-recipe-library.mjs --generate --pilot
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/seed-recipe-library.mjs --generate --full
 */

import { createClient } from '@supabase/supabase-js';
import { findAllergens, ALLERGEN_SAFE_PHRASES } from '../src/utils/allergenFilter.js';
import { readFileSync } from 'fs';

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL    = 'https://oxxihlwqukbakmnnavuy.supabase.co';
const SVC_KEY         = process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_KEY   = process.env.ANTHROPIC_API_KEY;
const USDA_KEY        = process.env.USDA_API_KEY || 'DEMO_KEY';

// Parse flags
const GENERATE_MODE   = process.argv.includes('--generate');
const RETAG_MODE      = process.argv.includes('--retag');   // re-tag existing global rows only
const SKIP_EXISTING   = process.argv.includes('--skip-existing'); // skip names already in DB
const PILOT_MODE      = process.argv.includes('--pilot') || (!process.argv.includes('--full') && !RETAG_MODE);
const FROM_FILE_ARG   = process.argv.find(a => a.startsWith('--from-file='));
const FROM_FILE       = FROM_FILE_ARG ? FROM_FILE_ARG.replace('--from-file=', '') : null;
const PILOT_COUNT     = 25;
const FULL_COUNT      = 300;
const TARGET_COUNT    = PILOT_MODE ? PILOT_COUNT : FULL_COUNT;

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';
const DEFAULT_SEED_FILE = 'scripts/seed-recipes-pilot.json';

// ── Guards ────────────────────────────────────────────────────────────────────
if (!SVC_KEY) { console.error('ERROR: SUPABASE_SERVICE_KEY not set'); process.exit(1); }
if (GENERATE_MODE && !ANTHROPIC_KEY) {
  console.error('ERROR: --generate mode requires ANTHROPIC_API_KEY.\nExport it: export ANTHROPIC_API_KEY=sk-ant-...');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SVC_KEY);

// ── Local USDA macro seed cache (per 100g, values from USDA FoodData Central) ─
// Used as primary lookup to avoid rate limits on DEMO_KEY.
// Keys are lowercase normalized ingredient names. Values are {cal,pro,carb,fat,fdcId}.
// Source: USDA FoodData Central Foundation/SR Legacy datasets.
const LOCAL_MACRO_CACHE = {
  // Proteins
  'chicken breast, broilers or fryers, raw':          {cal:120,pro:22.5,carb:0,fat:2.6,fdcId:331960},
  'chicken breast, broilers or fryers, cooked, roasted':{cal:165,pro:31.0,carb:0,fat:3.6,fdcId:171534},
  'salmon, atlantic, farmed, raw':                    {cal:208,pro:20.4,carb:0,fat:13.4,fdcId:175167},
  'tuna, canned in water, drained':                   {cal:109,pro:25.5,carb:0,fat:0.5,fdcId:171979},
  'beef, sirloin steak, lean, raw':                   {cal:138,pro:22.4,carb:0,fat:4.8,fdcId:174033},
  'ground beef, 80% lean, raw':                       {cal:254,pro:17.2,carb:0,fat:20.0,fdcId:174036},
  'lamb, rib chop, lean, raw':                        {cal:235,pro:18.0,carb:0,fat:17.5,fdcId:174004},
  'turkey breast, deli, sliced':                      {cal:104,pro:17.5,carb:2.1,fat:2.5,fdcId:174608},
  'bacon, cured, pan-fried':                          {cal:476,pro:33.0,carb:1.3,fat:37.0,fdcId:168309},
  'smoked salmon':                                    {cal:117,pro:18.3,carb:0,fat:4.3,fdcId:175168},
  'egg, whole, raw':                                  {cal:143,pro:12.6,carb:0.7,fat:9.5,fdcId:173424},
  'egg, whole, hard-boiled':                          {cal:155,pro:12.6,carb:1.1,fat:10.6,fdcId:173424},
  // Dairy
  'whole milk':                                       {cal:61,pro:3.2,carb:4.8,fat:3.3,fdcId:172269},
  'greek yogurt, plain, nonfat':                      {cal:59,pro:10.2,carb:3.6,fat:0.4,fdcId:171304},
  'cottage cheese, lowfat':                           {cal:90,pro:12.4,carb:3.4,fat:2.7,fdcId:172179},
  'cheddar cheese':                                   {cal:403,pro:24.9,carb:1.3,fat:33.1,fdcId:171241},
  'parmesan cheese, shredded':                        {cal:431,pro:38.5,carb:3.2,fat:28.6,fdcId:171245},
  'heavy cream':                                      {cal:340,pro:2.1,carb:2.8,fat:36.1,fdcId:170859},
  'cream cheese':                                     {cal:342,pro:6.1,carb:4.1,fat:34.0,fdcId:171232},
  // Grains / carbs
  'rolled oats':                                      {cal:379,pro:13.2,carb:67.7,fat:6.5,fdcId:173904},
  'brown rice, cooked':                               {cal:123,pro:2.7,carb:25.6,fat:0.9,fdcId:168876},
  'quinoa, cooked':                                   {cal:120,pro:4.4,carb:21.3,fat:1.9,fdcId:168917},
  'whole wheat bread':                                {cal:247,pro:13.0,carb:41.4,fat:3.4,fdcId:172686},
  'flour tortilla, large':                            {cal:306,pro:8.0,carb:51.0,fat:7.3,fdcId:171402},
  'pasta, dry':                                       {cal:371,pro:13.0,carb:75.0,fat:1.5,fdcId:169730},
  'sweet potato, raw':                                {cal:86,pro:1.6,carb:20.1,fat:0.1,fdcId:168482},
  'cornstarch':                                       {cal:381,pro:0.3,carb:91.3,fat:0.1,fdcId:167537},
  // Produce
  'broccoli, raw':                                    {cal:34,pro:2.8,carb:6.6,fat:0.4,fdcId:170379},
  'spinach, raw':                                     {cal:23,pro:2.9,carb:3.6,fat:0.4,fdcId:168462},
  'avocado, raw':                                     {cal:160,pro:2.0,carb:8.5,fat:14.7,fdcId:171705},
  'banana, raw':                                      {cal:89,pro:1.1,carb:22.8,fat:0.3,fdcId:173944},
  'blueberries, raw':                                 {cal:57,pro:0.7,carb:14.5,fat:0.3,fdcId:171711},
  'strawberries, raw':                                {cal:32,pro:0.7,carb:7.7,fat:0.3,fdcId:167762},
  'tomatoes, raw':                                    {cal:18,pro:0.9,carb:3.9,fat:0.2,fdcId:170457},
  'tomatoes, cherry':                                 {cal:18,pro:0.9,carb:3.9,fat:0.2,fdcId:170457},
  'tomato products, canned, puree':                   {cal:38,pro:1.7,carb:8.8,fat:0.3,fdcId:170462},
  'tomato products, canned, diced':                   {cal:32,pro:1.1,carb:7.3,fat:0.3,fdcId:170453},
  'green beans, raw':                                 {cal:31,pro:1.8,carb:7.0,fat:0.2,fdcId:169970},
  'bell peppers, raw':                                {cal:31,pro:1.0,carb:6.0,fat:0.3,fdcId:170108},
  'zucchini, raw':                                    {cal:17,pro:1.2,carb:3.1,fat:0.3,fdcId:169291},
  'asparagus, raw':                                   {cal:20,pro:2.2,carb:3.9,fat:0.1,fdcId:168389},
  'romaine lettuce':                                  {cal:17,pro:1.2,carb:3.3,fat:0.3,fdcId:169247},
  'onions, raw':                                      {cal:40,pro:1.1,carb:9.3,fat:0.1,fdcId:170000},
  'garlic, raw':                                      {cal:149,pro:6.4,carb:33.1,fat:0.5,fdcId:169230},
  'ginger root, raw':                                 {cal:80,pro:1.8,carb:17.8,fat:0.8,fdcId:169231},
  'carrots, raw':                                     {cal:41,pro:0.9,carb:9.6,fat:0.2,fdcId:170393},
  'lemon juice, raw':                                 {cal:22,pro:0.4,carb:6.9,fat:0.2,fdcId:167747},
  'rosemary, fresh':                                  {cal:131,pro:3.3,carb:20.7,fat:5.9,fdcId:172030},
  // Legumes
  'lentils, mature seeds, cooked, boiled':            {cal:116,pro:9.0,carb:20.1,fat:0.4,fdcId:172420},
  'chickpeas, mature seeds, canned, drained':         {cal:139,pro:7.2,carb:22.3,fat:2.4,fdcId:173757},
  // Fats / oils / condiments
  'olive oil':                                        {cal:884,pro:0,carb:0,fat:100.0,fdcId:171413},
  'sesame oil':                                       {cal:884,pro:0,carb:0,fat:100.0,fdcId:172934},
  'soy sauce':                                        {cal:60,pro:10.5,carb:5.6,fat:0,fdcId:170712},
  'mustard, prepared':                                {cal:70,pro:4.4,carb:6.0,fat:3.3,fdcId:170418},
  'hummus, commercial':                               {cal:177,pro:4.9,carb:20.1,fat:8.6,fdcId:174289},
  'maple syrup':                                      {cal:260,pro:0.04,carb:67.1,fat:0.1,fdcId:169661},
  'honey':                                            {cal:304,pro:0.3,carb:82.4,fat:0,fdcId:169640},
  'salt':                                             {cal:0,pro:0,carb:0,fat:0,fdcId:0},
  'cumin, ground':                                    {cal:375,pro:17.8,carb:44.2,fat:22.3,fdcId:170917},
  // Seeds / nuts
  'almonds, raw':                                     {cal:579,pro:21.2,carb:21.6,fat:49.9,fdcId:170567},
  'chia seeds':                                       {cal:486,pro:16.5,carb:42.1,fat:30.7,fdcId:170554},
  'almond butter':                                    {cal:634,pro:20.9,carb:21.9,fat:55.5,fdcId:168588},
  'dark chocolate chips':                             {cal:546,pro:5.5,carb:59.9,fat:31.3,fdcId:170271},
  // Supplements / processed
  'whey protein powder':                              {cal:352,pro:75.0,carb:7.5,fat:1.0,fdcId:0},
  'coconut milk':                                     {cal:230,pro:2.3,carb:5.5,fat:23.8,fdcId:170172},
  // Additional proteins for full library
  'tofu, firm, raw':                                  {cal:76,pro:8.1,carb:1.9,fat:4.3,fdcId:172461},
  'tempeh':                                           {cal:193,pro:20.3,carb:7.6,fat:10.8,fdcId:174272},
  'shrimp, raw':                                      {cal:106,pro:20.1,carb:0.9,fat:1.7,fdcId:175177},
  'cod, atlantic, raw':                               {cal:82,pro:17.8,carb:0,fat:0.7,fdcId:171955},
  'tilapia, raw':                                     {cal:96,pro:20.1,carb:0,fat:2.0,fdcId:175176},
  'halibut, atlantic, raw':                           {cal:110,pro:22.5,carb:0,fat:2.3,fdcId:175171},
  'mahi-mahi, raw':                                   {cal:93,pro:19.7,carb:0,fat:1.0,fdcId:175173},
  'pork tenderloin, raw':                             {cal:121,pro:21.0,carb:0,fat:3.5,fdcId:167906},
  'pork chop, lean, raw':                             {cal:136,pro:20.5,carb:0,fat:5.5,fdcId:167905},
  'turkey breast, raw':                               {cal:109,pro:23.7,carb:0,fat:1.3,fdcId:171483},
  'ground turkey, raw':                               {cal:163,pro:19.1,carb:0,fat:9.3,fdcId:171486},
  'beef liver, raw':                                  {cal:135,pro:20.4,carb:3.9,fat:3.7,fdcId:168626},
  'ground beef, 90% lean, raw':                       {cal:168,pro:20.0,carb:0,fat:9.4,fdcId:174036},
  // Additional produce
  'mushrooms, portobello, raw':                       {cal:22,pro:2.1,carb:3.9,fat:0.3,fdcId:169260},
  'cauliflower, raw':                                 {cal:25,pro:1.9,carb:5.0,fat:0.3,fdcId:169986},
  'kale, raw':                                        {cal:35,pro:2.9,carb:4.4,fat:1.5,fdcId:168421},
  'brussels sprouts, raw':                            {cal:43,pro:3.4,carb:8.9,fat:0.3,fdcId:170383},
  'cabbage, raw':                                     {cal:25,pro:1.3,carb:5.8,fat:0.1,fdcId:169975},
  'celery, raw':                                      {cal:14,pro:0.7,carb:3.0,fat:0.2,fdcId:169988},
  'eggplant, raw':                                    {cal:25,pro:1.0,carb:5.9,fat:0.2,fdcId:169967},
  'beets, raw':                                       {cal:43,pro:1.6,carb:9.6,fat:0.2,fdcId:169145},
  'butternut squash, raw':                            {cal:45,pro:1.0,carb:11.7,fat:0.1,fdcId:169971},
  'arugula, raw':                                     {cal:25,pro:2.6,carb:3.7,fat:0.7,fdcId:170381},
  'cucumber, raw':                                    {cal:15,pro:0.7,carb:3.6,fat:0.1,fdcId:168409},
  'edamame, frozen, prepared':                        {cal:121,pro:11.9,carb:8.9,fat:5.2,fdcId:168411},
  'apples, raw':                                      {cal:52,pro:0.3,carb:13.8,fat:0.2,fdcId:171688},
  'oranges, raw':                                     {cal:47,pro:0.9,carb:11.8,fat:0.1,fdcId:169097},
  'mango, raw':                                       {cal:60,pro:0.8,carb:15.0,fat:0.4,fdcId:169910},
  'pineapple, raw':                                   {cal:50,pro:0.5,carb:13.1,fat:0.1,fdcId:169949},
  'mixed greens':                                     {cal:22,pro:2.1,carb:3.6,fat:0.4,fdcId:168462},
  // Additional legumes
  'black beans, canned, drained':                     {cal:132,pro:8.9,carb:23.7,fat:0.5,fdcId:173735},
  'kidney beans, canned, drained':                    {cal:115,pro:7.7,carb:20.7,fat:0.4,fdcId:173744},
  'edamame, shelled':                                 {cal:121,pro:11.9,carb:8.9,fat:5.2,fdcId:168411},
  // Additional dairy / alternatives
  'greek yogurt, plain, whole milk':                  {cal:97,pro:9.0,carb:3.9,fat:4.9,fdcId:170903},
  'ricotta cheese, whole milk':                       {cal:174,pro:11.3,carb:3.1,fat:12.5,fdcId:172182},
  'mozzarella cheese':                                {cal:299,pro:22.2,carb:2.2,fat:22.4,fdcId:173420},
  'feta cheese':                                      {cal:264,pro:14.2,carb:4.1,fat:21.3,fdcId:173420},
  'parmesan cheese':                                  {cal:431,pro:38.5,carb:3.2,fat:28.6,fdcId:171245},
  // Grains and starches
  'barley, pearled, cooked':                          {cal:123,pro:2.3,carb:28.2,fat:0.4,fdcId:170285},
  'oat bran, raw':                                    {cal:246,pro:17.3,carb:66.2,fat:7.0,fdcId:170289},
  'white rice, cooked':                               {cal:130,pro:2.7,carb:28.6,fat:0.3,fdcId:168878},
  'corn tortilla':                                    {cal:218,pro:5.7,carb:45.9,fat:2.9,fdcId:171400},
  // Fats / oils / condiments
  'coconut oil':                                      {cal:892,pro:0,carb:0,fat:99.1,fdcId:172316},
  'tahini':                                           {cal:595,pro:17.0,carb:21.2,fat:53.8,fdcId:169426},
  'peanut butter, smooth':                            {cal:598,pro:22.2,carb:22.3,fat:51.4,fdcId:172470},
  'sunflower seeds, raw':                             {cal:584,pro:20.8,carb:20.0,fat:51.5,fdcId:170563},
  'pumpkin seeds, raw':                               {cal:559,pro:30.2,carb:10.7,fat:49.1,fdcId:170556},
  'walnuts, raw':                                     {cal:654,pro:15.2,carb:13.7,fat:65.2,fdcId:170187},
  'cashews, raw':                                     {cal:553,pro:18.2,carb:30.2,fat:43.9,fdcId:170162},
  'nutritional yeast':                                {cal:325,pro:40.0,carb:28.6,fat:6.3,fdcId:0},
  'almond flour':                                     {cal:600,pro:21.4,carb:21.4,fat:53.6,fdcId:0},
  'coconut flour':                                    {cal:400,pro:18.0,carb:60.0,fat:14.0,fdcId:0},
  'fish sauce':                                       {cal:35,pro:5.1,carb:3.6,fat:0.0,fdcId:169988},
  'worcestershire sauce':                             {cal:78,pro:0,carb:20.5,fat:0,fdcId:170710},
  'balsamic vinegar':                                 {cal:88,pro:0.5,carb:17.0,fat:0,fdcId:170474},
  'dijon mustard':                                    {cal:67,pro:3.9,carb:5.5,fat:3.3,fdcId:170418},
  'salsa, ready-to-serve':                            {cal:36,pro:1.8,carb:7.1,fat:0.2,fdcId:170467},
  'hot sauce':                                        {cal:34,pro:1.1,carb:7.4,fat:0.3,fdcId:170941},
  'beef broth':                                       {cal:8,pro:1.3,carb:0.6,fat:0.1,fdcId:170469},
  'chicken broth':                                    {cal:10,pro:1.5,carb:1.0,fat:0.1,fdcId:173726},
  // Additional misc
  'protein powder, plant-based':                      {cal:360,pro:70.0,carb:10.0,fat:5.0,fdcId:0},
  'collagen peptides':                                {cal:360,pro:90.0,carb:0,fat:0,fdcId:0},
  'flaxseed, ground':                                 {cal:534,pro:18.3,carb:28.9,fat:42.2,fdcId:169414},
  'hemp seeds, hulled':                               {cal:553,pro:31.6,carb:8.7,fat:48.7,fdcId:170148},
  'cocoa powder, unsweetened':                        {cal:228,pro:19.6,carb:57.9,fat:13.7,fdcId:169593},
  'vanilla extract':                                  {cal:288,pro:0.1,carb:12.7,fat:0.1,fdcId:170500},
  'cinnamon, ground':                                 {cal:247,pro:4.0,carb:80.6,fat:1.2,fdcId:171320},
  'black pepper, ground':                             {cal:251,pro:10.4,carb:63.9,fat:3.3,fdcId:170931},
  'sea salt':                                         {cal:0,pro:0,carb:0,fat:0,fdcId:0},
  'italian seasoning':                                {cal:268,pro:7.6,carb:60.0,fat:4.0,fdcId:0},
  'paprika':                                          {cal:282,pro:14.1,carb:54.0,fat:13.0,fdcId:170931},
};

// Normalize a key for cache lookup
function normKey(s) {
  return s.toLowerCase().replace(/\s+/g,' ').trim();
}

// ── USDA ingredient cache (item name → {cal,pro,carb,fat} per 100g) ──────────
const usdaCache = new Map();

// Preferred USDA data types (Foundation > SR Legacy > Survey)
const PREFERRED_DATA_TYPES = ['Foundation', 'SR Legacy', 'Survey (FNDDS)', 'Branded'];

async function usdaSearch(query) {
  const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}&api_key=${USDA_KEY}&pageSize=5&dataType=${encodeURIComponent('Foundation,SR Legacy,Survey (FNDDS)')}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`USDA search failed (${r.status}): ${query}`);
  return r.json();
}

async function usdaFood(fdcId) {
  const url = `${USDA_BASE}/food/${fdcId}?api_key=${USDA_KEY}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`USDA food fetch failed (${r.status}): ${fdcId}`);
  return r.json();
}

/**
 * Get macros per 100g for an ingredient name.
 * Returns {cal, pro, carb, fat, matched_name, fdcId} or null if unmatched.
 * Check order: (1) runtime cache, (2) local USDA seed cache, (3) live USDA API.
 */
async function getMacrosPer100g(ingredientItem) {
  const key = normKey(ingredientItem);
  if (usdaCache.has(key)) return usdaCache.get(key);

  // 1. Local seed cache — covers all common foods, zero network calls
  if (LOCAL_MACRO_CACHE[key]) {
    const cached = { ...LOCAL_MACRO_CACHE[key], matched_name: ingredientItem };
    usdaCache.set(key, cached);
    return cached;
  }
  // Try partial match (ingredient might have slightly different wording)
  const partialMatch = Object.entries(LOCAL_MACRO_CACHE).find(([k]) =>
    k.includes(key.split(',')[0].trim()) || key.includes(k.split(',')[0].trim())
  );
  if (partialMatch) {
    const cached = { ...partialMatch[1], matched_name: `${partialMatch[0]} (partial match)` };
    usdaCache.set(key, cached);
    return cached;
  }

  // 2. Live USDA API — for ingredients not in local cache
  // Respectful delay for DEMO_KEY (max 30 req/hour = 1 per 2s)
  await new Promise(r => setTimeout(r, 2100));

  let result = null;
  try {
    const data = await usdaSearch(ingredientItem);
    const foods = data.foods || [];
    if (foods.length === 0) { usdaCache.set(key, null); return null; }

    // Pick the best match: prefer Foundation > SR Legacy, exact or close name
    const scored = foods.map(f => {
      const descLower = (f.description || '').toLowerCase();
      const queryLower = ingredientItem.toLowerCase();
      // Score: 2 pts for Foundation, 1 for SR Legacy, partial name match bonus
      let score = 0;
      if (f.dataType === 'Foundation') score += 4;
      else if (f.dataType === 'SR Legacy') score += 2;
      else if (f.dataType === 'Survey (FNDDS)') score += 1;
      if (descLower.includes(queryLower) || queryLower.includes(descLower.split(',')[0])) score += 3;
      // Penalise branded/prepared/breaded items
      if (descLower.includes('breaded') || descLower.includes('fried') || descLower.includes('sauce')) score -= 2;
      return { ...f, _score: score };
    });
    scored.sort((a, b) => b._score - a._score);
    const best = scored[0];

    // Fetch full nutrient detail
    const food = await usdaFood(best.fdcId);
    const nutrients = food.foodNutrients || [];
    const get = (names) => {
      for (const name of names) {
        const n = nutrients.find(n => (n.nutrient?.name || n.name || '').toLowerCase().includes(name));
        if (n) return n.amount ?? n.value ?? 0;
      }
      return 0;
    };
    result = {
      cal:          Math.round(get(['energy (kcal)', 'energy'])),
      pro:          parseFloat(get(['protein']).toFixed(2)),
      carb:         parseFloat(get(['carbohydrate, by difference', 'carbohydrate']).toFixed(2)),
      fat:          parseFloat(get(['total lipid', 'fat']).toFixed(2)),
      matched_name: food.description || best.description,
      fdcId:        best.fdcId,
    };
  } catch (e) {
    console.warn(`  [USDA WARN] ${ingredientItem}: ${e.message}`);
    result = null;
  }
  usdaCache.set(key, result);
  return result;
}

/**
 * Compute total recipe macros from ingredient list.
 * Each ingredient: { item: string, qty: number, unit: string }
 * Returns { cal, pro, carb, fat, unmatched: [{item, qty, unit}] }
 */
async function computeRecipeMacros(ingredients) {
  let cal = 0, pro = 0, carb = 0, fat = 0;
  const unmatched = [];

  for (const ing of ingredients) {
    const macros = await getMacrosPer100g(ing.item);
    if (!macros) { unmatched.push(ing); continue; }

    // Convert qty to grams
    const g = toGrams(ing.qty, ing.unit, ing.item);
    if (g === null) { unmatched.push({ ...ing, reason: 'unit_unknown' }); continue; }

    const factor = g / 100;
    cal  += macros.cal  * factor;
    pro  += macros.pro  * factor;
    carb += macros.carb * factor;
    fat  += macros.fat  * factor;
  }

  return {
    cal:       Math.round(cal),
    pro:       Math.round(pro * 10) / 10,
    carb:      Math.round(carb * 10) / 10,
    fat:       Math.round(fat * 10) / 10,
    unmatched,
  };
}

/** Convert various units to grams. Returns null if unknown unit. */
function toGrams(qty, unit, itemHint = '') {
  const u = (unit || '').toLowerCase().trim();
  qty = parseFloat(qty) || 0;
  const densities = { // rough density g/ml for liquids
    oil: 0.92, milk: 1.03, cream: 1.01, water: 1.0,
    juice: 1.05, sauce: 1.05, vinegar: 1.01,
  };
  switch (u) {
    case 'g': case 'grams': case 'gram': return qty;
    case 'kg': return qty * 1000;
    case 'ml': case 'milliliter': case 'milliliters': return qty * 1.0;
    case 'l': case 'liter': case 'liters': return qty * 1000;
    case 'oz': case 'ounce': case 'ounces': return qty * 28.35;
    case 'lb': case 'lbs': case 'pound': case 'pounds': return qty * 453.6;
    case 'tbsp': case 'tablespoon': case 'tablespoons': {
      const hint = itemHint.toLowerCase();
      const dense = Object.entries(densities).find(([k]) => hint.includes(k));
      return qty * 15 * (dense ? dense[1] : 1.0);
    }
    case 'tsp': case 'teaspoon': case 'teaspoons': {
      const hint = itemHint.toLowerCase();
      const dense = Object.entries(densities).find(([k]) => hint.includes(k));
      return qty * 5 * (dense ? dense[1] : 1.0);
    }
    case 'cup': case 'cups': {
      const hint = itemHint.toLowerCase();
      if (hint.includes('oat'))   return qty * 90;
      if (hint.includes('rice'))  return qty * 185;
      if (hint.includes('spinach') || hint.includes('lettuce') || hint.includes('arugula')) return qty * 30;
      if (hint.includes('milk'))  return qty * 240;
      if (hint.includes('yogurt')) return qty * 245;
      if (hint.includes('flour')) return qty * 125;
      return qty * 240;
    }
    case 'slice': case 'slices': return qty * 30;
    case 'piece': case 'pieces': case 'whole': {
      const hint = itemHint.toLowerCase();
      if (hint.includes('egg')) return qty * 50;
      if (hint.includes('banana')) return qty * 118;
      if (hint.includes('apple')) return qty * 182;
      if (hint.includes('orange')) return qty * 131;
      if (hint.includes('avocado')) return qty * 136;
      if (hint.includes('tomato')) return qty * 123;
      if (hint.includes('onion')) return qty * 150;
      if (hint.includes('garlic')) return qty * 4;
      return qty * 100; // generic fallback
    }
    case 'scoop': case 'scoops': return qty * 30; // protein powder
    case 'can': case 'cans': return qty * 400;
    case 'handful': return qty * 30;
    case 'bunch': return qty * 150;
    case 'fillet': case 'fillets': {
      const hint = itemHint.toLowerCase();
      if (hint.includes('salmon') || hint.includes('cod') || hint.includes('tilapia')) return qty * 180;
      return qty * 150;
    }
    case 'breast': case 'thigh': return qty * 170;
    default: return null; // unknown unit — flag as unmatched
  }
}

// ── Diet tag validator — shares allergenFilter.js safe-phrase + word-boundary arch ─
//
// Shared infrastructure: ALLERGEN_SAFE_PHRASES (imported above) is spread directly
// into the diet-tag safe-phrase lists below, so both systems stay in sync from one
// source of truth.  Specifically:
//   • ALLERGEN_SAFE_PHRASES['No Dairy'] covers the confirmed false positives for
//     vegan + paleo: "coconut milk" (not dairy), "almond butter" (not dairy-butter),
//     "peanut butter", "cashew butter", "almond milk", "oat milk", "butter lettuce",
//     "butternut", etc.
//   • ALLERGEN_SAFE_PHRASES['No Eggs'] covers "eggplant" / "egg-free" for vegan +
//     vegetarian (so eggplant never triggers the egg disqualifier).
//
// Confirmed false-positive fixes:
//   "coconut milk"  → no longer strips vegan/paleo (matched "milk")  — FIXED ✓
//   "almond butter" → no longer strips vegan/paleo (matched "butter") — FIXED ✓
//   "green beans"   → no longer strips paleo (matched "bean")         — FIXED ✓
//   "honey"         → still correctly strips vegan (no safe phrase)   — CORRECT ✓
//
// Matching algorithm mirrors allergenFilter.js findAllergens() exactly:
//   1. Normalize text (lowercase, non-alphanumeric → space)
//   2. Per-ingredient: safe-phrase override runs FIRST (substring of normalized text)
//   3. Disqualifier word-boundary regex (with optional plural 's') runs SECOND
//   4. Any disqualifier hit without a safe-phrase override → tag is dropped

// _dietNorm / _dietEsc mirror allergenFilter.js _norm / _esc (not exported there).
function _dietNorm(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}
function _dietEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Safe phrases: spread ALLERGEN_SAFE_PHRASES['No Dairy'] / ['No Eggs'] as the base,
// then append diet-specific extras.  Single source of truth = allergenFilter.js.
const DIET_SAFE_PHRASES = {
  'vegan': [
    ...ALLERGEN_SAFE_PHRASES['No Dairy'], // coconut milk, almond butter, peanut butter,
                                          // cashew butter, almond milk, oat milk, soy milk,
                                          // rice milk, cashew milk, hemp milk, coconut cream,
                                          // coconut yogurt, butter lettuce, butternut, dairy-free…
    ...ALLERGEN_SAFE_PHRASES['No Eggs'],  // eggplant, egg-free
    'coconut water','vegan','plant-based',
  ],
  'vegetarian': [
    ...ALLERGEN_SAFE_PHRASES['No Eggs'],  // eggplant, egg-free
  ],
  'paleo': [
    ...ALLERGEN_SAFE_PHRASES['No Dairy'], // coconut milk, almond butter, peanut butter,
                                          // coconut cream, almond milk, butter lettuce, butternut…
    'green beans','green bean',           // green beans are NOT paleo-disqualifying legumes
    'coconut aminos','coconut oil','coconut flour','almond flour','coconut water',
  ],
  'keto': [
    // keto validated primarily by macros (<20g net carbs); minimal keyword exceptions
    'almond flour','coconut flour',
  ],
  'low-carb': [
    'almond flour','coconut flour','oat bran',
  ],
  'carnivore': [
    'sea salt','black pepper',
  ],
  'pescatarian': [],
  'mediterranean': [],
  'high-protein': [],
  'balanced': [],
};

// Disqualifier keywords per diet tag (word-boundary matched with optional plural 's')
const DIET_DISQUALIFIERS = {
  'vegan': [
    'chicken','beef','pork','lamb','salmon','tuna','shrimp','prawn',
    'egg','eggs','milk','cheese','butter','cream','yogurt','whey',
    'honey','gelatin','turkey','duck','fish','meat','anchovy',
    'bacon','ham','sausage','steak','bison','venison','lard',
  ],
  'vegetarian': [
    'chicken','beef','pork','lamb','salmon','tuna','shrimp','prawn',
    'turkey','duck','fish','anchovy','gelatin','meat','bacon','ham',
    'sausage','steak','bison','venison',
  ],
  'keto': [
    // keyword pre-filter only — macro validation (carbs>20g) runs afterward
    'bread','pasta','oatmeal','flour tortilla',
    'sugar','honey','maple syrup',
    'banana','grape','apple','mango','pineapple',
    'potato','sweet potato',
  ],
  'paleo': [
    'oats','oatmeal','bread','pasta','rice','corn','cornstarch','flour tortilla',
    'whole wheat','milk','cheese','butter','cream','yogurt','whey',
    'soy sauce','tofu','tempeh','edamame',
    'lentil','chickpea','black bean','kidney bean','navy bean',
    'peanut',  // peanut butter excluded via safe phrase above
    'sugar','honey','maple syrup','candy',
  ],
  'mediterranean': ['soda','candy','hot dog','fast food'],
  'high-protein':  [],
  'balanced':      [],
  'low-carb':      ['rice','pasta','bread','potato','corn','banana','maple syrup'],
  'carnivore':     [
    'oats','rice','bread','pasta','potato','bean','lentil','chickpea',
    'vegetable','fruit','nut','seed','tofu','quinoa','spinach',
    'broccoli','kale','onion','tomato','pepper','garlic',
  ],
  'pescatarian': ['chicken','beef','pork','lamb','turkey','duck','meat','bacon','ham','sausage'],
};

/**
 * Validate diet tags against ingredients using word-boundary regex + safe phrases.
 * Reuses the same architecture as allergenFilter.js findAllergens():
 *   - normalize both sides, safe-phrase override first, then word-boundary disqualifier
 * Also applies macro-based validation for keto (carbs > 20g/serving → drop keto).
 */
function validateDietTags(dietTags, ingredients, macrosPerServing = null) {
  const corrections = [];
  const valid = [];

  for (const tag of dietTags) {
    const safePhrases  = DIET_SAFE_PHRASES[tag]  || [];
    const disqualifiers = DIET_DISQUALIFIERS[tag] || [];
    let offendingKw = null;

    // Macro-based keto validation (belt-and-suspenders after keyword check)
    if (tag === 'keto' && macrosPerServing && macrosPerServing.carb > 20) {
      corrections.push({ tag, reason: `carbs ${macrosPerServing.carb}g/serving > 20g keto limit` });
      continue;
    }
    if (tag === 'low-carb' && macrosPerServing && macrosPerServing.carb > 30) {
      corrections.push({ tag, reason: `carbs ${macrosPerServing.carb}g/serving > 30g low-carb limit` });
      continue;
    }

    // Per-ingredient check (same as allergenFilter — check each ingredient individually)
    for (const ing of ingredients) {
      const normIngItem = _dietNorm(ing.item);

      // Safe-phrase override: if item contains a safe phrase, skip disqualifier check for this ingredient
      const isSafe = safePhrases.some(ph => normIngItem.includes(_dietNorm(ph)));
      if (isSafe) continue;

      // Disqualifier word-boundary match with optional plural 's'
      const hit = disqualifiers.find(kw => {
        const re = new RegExp('(^|[^a-z0-9])' + _dietEsc(_dietNorm(kw)) + 's?($|[^a-z0-9])', 'i');
        return re.test(normIngItem);
      });
      if (hit) { offendingKw = hit; break; }
    }

    if (offendingKw) {
      corrections.push({ tag, reason: `contains: ${offendingKw}` });
    } else {
      valid.push(tag);
    }
  }
  return { valid, corrections };
}

// ── Allergen tags ─────────────────────────────────────────────────────────────
const ALL_ALLERGEN_CHIPS = ['No Dairy','No Gluten','No Pork','No Shellfish','No Eggs','No Nuts'];
const CHIP_TO_TAG = {
  'No Dairy':    'dairy',
  'No Gluten':   'gluten',
  'No Pork':     'pork',
  'No Shellfish':'shellfish',
  'No Eggs':     'eggs',
  'No Nuts':     'nuts',
};

function computeAllergenTags(ingredients) {
  const allText = ingredients.map(i => i.item).join('\n');
  const violated = findAllergens(allText, ALL_ALLERGEN_CHIPS);
  return violated.map(chip => CHIP_TO_TAG[chip]).filter(Boolean);
}

// ── AI recipe generation ──────────────────────────────────────────────────────
async function generateRecipeStructures(count) {
  console.log(`\nGenerating ${count} recipe structures via Anthropic...`);

  // Define the tool schema for structured recipe output
  const recipeTool = {
    name: 'save_recipes',
    description: 'Return the generated recipe structures',
    input_schema: {
      type: 'object',
      properties: {
        recipes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name:         { type: 'string' },
              meal_slot:    { type: 'string', enum: ['breakfast','lunch','dinner','snack'] },
              diet_tags:    { type: 'array', items: { type: 'string' } },
              servings:     { type: 'integer', description: 'Number of servings (1-2 for single meal, up to 4 for batch)' },
              ingredients:  {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    item: { type: 'string', description: 'USDA-mappable food name (e.g. "chicken breast, raw")' },
                    qty:  { type: 'number' },
                    unit: { type: 'string', description: 'g, ml, oz, cup, tbsp, tsp, whole, scoop, can, fillet' },
                  },
                  required: ['item','qty','unit'],
                },
              },
              instructions: { type: 'string', description: '2-4 sentence prep instructions' },
            },
            required: ['name','meal_slot','diet_tags','servings','ingredients','instructions'],
          },
        },
      },
      required: ['recipes'],
    },
  };

  const prompt = `You are a sports nutrition chef building a high-quality recipe library for an athlete meal planning app.

Generate EXACTLY ${count} complete, varied recipes for the following distribution:
- Breakfast: ${Math.round(count * 0.25)} recipes (oatmeal, eggs, smoothies, protein pancakes, etc.)
- Lunch: ${Math.round(count * 0.30)} recipes (salads, bowls, wraps, sandwiches, etc.)
- Dinner: ${Math.round(count * 0.30)} recipes (proteins + sides, stir fries, pasta, etc.)
- Snack: ${Math.round(count * 0.15)} recipes (protein balls, fruit + protein, nut mixes, etc.)

Diet coverage (tag each recipe with ALL applicable diets from this list):
Available diet tags: balanced, high-protein, mediterranean, keto, paleo, vegetarian, vegan, low-carb, carnivore, pescatarian

Include:
- At least 4 clearly keto recipes (high fat, very low carb)
- At least 4 vegan recipes (no animal products at all)
- At least 4 vegetarian recipes
- At least 4 high-protein recipes
- At least 3 pescatarian recipes
- Rest: balanced/mediterranean/paleo mix

CRITICAL for USDA macro accuracy — use STANDARD ingredient names that map to real foods:
- Prefer: "chicken breast, raw" over "chicken"
- Prefer: "salmon, atlantic, raw" over "fish"
- Prefer: "rolled oats" over "oatmeal"
- Prefer: "brown rice, cooked" over "rice"
- Prefer: "whole milk" over "milk"
- Prefer: "cheddar cheese" over "cheese"
- Prefer: "olive oil" over "oil"
- Use standard units: g, ml, cup, tbsp, tsp, whole, oz, scoop

Keep ingredient counts to 4-8 per recipe for precision.
Each recipe should be athlete-appropriate: high protein (20-50g per serving), practical to prep.
Use the save_recipes tool to return all ${count} recipes.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:       'claude-sonnet-4-6',
      max_tokens:  8000,
      tools:       [recipeTool],
      tool_choice: { type: 'tool', name: 'save_recipes' },
      messages:    [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err.slice(0, 300)}`);
  }

  const data = await response.json();
  if (data.stop_reason === 'max_tokens') {
    throw new Error('Anthropic hit max_tokens — increase budget or reduce recipe count');
  }

  const toolUse = data.content?.find(b => b.type === 'tool_use' && b.name === 'save_recipes');
  if (!toolUse?.input?.recipes?.length) {
    throw new Error(`No recipes in tool response. Stop reason: ${data.stop_reason}. Keys: ${Object.keys(toolUse?.input || {})}`);
  }

  console.log(`  ✓ AI generated ${toolUse.input.recipes.length} recipe structures`);
  return toolUse.input.recipes;
}

// ── Re-tag: re-validate diet_tags for ALL global rows from their SOURCE seed file.
// Uses source JSON (not current DB tags) so we can both drop wrong tags AND restore
// ones wrongly removed by the old validator. Pass --from-file= to specify source.
async function retagExisting(seedFile) {
  console.log('\n══ RE-TAG MODE ══');
  // Load source recipes (original diet_tags intended by authoring step)
  const sourceRecipes = JSON.parse(readFileSync(seedFile, 'utf-8'));
  const sourceByName = new Map(sourceRecipes.map(r => [r.name.toLowerCase(), r]));

  const { data: rows, error } = await sb
    .from('recipes').select('id, name, carbs_per_serving').is('user_id', null);
  if (error) { console.error('Fetch error:', error.message); return; }
  console.log(`  DB: ${rows.length} global rows | Source: ${sourceRecipes.length} recipes\n`);

  let updated = 0, unchanged = 0, noSource = 0;
  const allCorrections = [];

  for (const row of rows) {
    const src = sourceByName.get(row.name.toLowerCase());
    if (!src) { noSource++; continue; }

    const macrosPerServing = { carb: row.carbs_per_serving ?? 0 };
    const { valid, corrections } = validateDietTags(src.diet_tags || [], src.ingredients, macrosPerServing);

    if (corrections.length > 0) allCorrections.push({ name: row.name, corrections });

    const newTags = [...new Set(valid)];
    const { error: upErr } = await sb.from('recipes').update({ diet_tags: newTags }).eq('id', row.id);
    if (upErr) { console.error(`  ✗ ${row.name}: ${upErr.message}`); }
    else {
      console.log(`  ${row.name}`);
      console.log(`    diet_tags: [${newTags.join(', ')}]`);
      updated++;
    }
  }

  console.log(`\nRe-tag: ${updated} updated, ${unchanged} unchanged, ${noSource} no source match`);
  if (allCorrections.length) {
    console.log('\nTags corrected (removed from source intent):');
    for (const {name, corrections} of allCorrections) {
      for (const c of corrections) console.log(`  ${name}: removed "${c.tag}" — ${c.reason}`);
    }
  }
  console.log('\nValidate via Supabase: SELECT name,diet_tags FROM recipes WHERE user_id IS NULL;');
}

// ── Main pipeline ─────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Coach Macro — Recipe Library Seeding Pipeline`);
  const modeLabel = GENERATE_MODE ? 'GENERATE+SEED' : FROM_FILE ? `FROM-FILE: ${FROM_FILE}` : `FROM-FILE: ${DEFAULT_SEED_FILE}`;
  console.log(`Mode: ${PILOT_MODE ? 'PILOT' : RETAG_MODE ? 'RETAG' : 'FULL'} — ${modeLabel}`);
  console.log(`USDA key: ${USDA_KEY === 'DEMO_KEY' ? 'DEMO_KEY (low-volume ok)' : 'custom key'}`);
  console.log(`${'═'.repeat(60)}\n`);

  if (RETAG_MODE) {
    const seedFile = FROM_FILE || DEFAULT_SEED_FILE;
    await retagExisting(seedFile);
    return;
  }

  // ── Step 1: Recipe structures (generated or from file) ──────────────────────
  let rawRecipes;
  if (GENERATE_MODE) {
    rawRecipes = await generateRecipeStructures(TARGET_COUNT);
  } else {
    const seedFile = FROM_FILE || DEFAULT_SEED_FILE;
    console.log(`Loading recipe structures from ${seedFile}...`);
    rawRecipes = JSON.parse(readFileSync(seedFile, 'utf-8'));
    console.log(`  ✓ Loaded ${rawRecipes.length} recipe structures`);
  }

  // ── Step 2–4: Process each recipe ──────────────────────────────────────────
  const processed = [];
  const allUnmatched = [];
  const allDietCorrections = [];
  let macroFailures = 0;

  console.log('\nProcessing recipes (USDA macros + allergens + diet validation)...');

  for (let i = 0; i < rawRecipes.length; i++) {
    const r = rawRecipes[i];
    process.stdout.write(`  [${i + 1}/${rawRecipes.length}] ${r.name.padEnd(42, '.')} `);

    // Step 2: USDA macros
    const macros = await computeRecipeMacros(r.ingredients);
    const servings = r.servings || 1;

    if (macros.unmatched.length > 0) {
      allUnmatched.push({ recipe: r.name, unmatched: macros.unmatched });
    }

    // Reject recipe if macros are clearly wrong (too low = missing data)
    if (macros.cal < 50) {
      console.log(`SKIP (insufficient macros — cal=${macros.cal}, likely all unmatched)`);
      macroFailures++;
      continue;
    }

    // Step 3: Allergen tags (deterministic)
    const allergenTags = computeAllergenTags(r.ingredients);

    // Step 4: Diet tag validation — pass macros/serving for keto/low-carb macro check
    const macrosPerServing = { carb: Math.round(macros.carb / servings * 10) / 10 };
    const { valid: validTags, corrections } = validateDietTags(r.diet_tags || [], r.ingredients, macrosPerServing);
    if (corrections.length > 0) {
      allDietCorrections.push({ recipe: r.name, corrections });
    }

    // Build the row for Supabase
    const row = {
      user_id:              null, // global row
      name:                 r.name,
      category:             r.meal_slot,
      meal_slot:            r.meal_slot,
      diet_tags:            validTags,
      allergen_tags:        allergenTags,
      is_hero:              false,
      servings_count:       servings,
      calories_per_serving: Math.round(macros.cal / servings),
      protein_per_serving:  Math.round(macros.pro / servings * 10) / 10,
      carbs_per_serving:    Math.round(macros.carb / servings * 10) / 10,
      fat_per_serving:      Math.round(macros.fat / servings * 10) / 10,
      fiber_per_serving:    0, // USDA fiber not fetched in pilot — future enhancement
      ingredients:          r.ingredients,
      // instructions stored as part of ingredients jsonb or separate — store in ingredients for now
    };

    console.log(`cal=${row.calories_per_serving} pro=${row.protein_per_serving} ✓`);
    processed.push({ row, source: r });
  }

  console.log(`\n  Processed: ${processed.length}/${rawRecipes.length} (${macroFailures} skipped — insufficient macros)`);

  // ── Step 5: Insert into Supabase ────────────────────────────────────────────
  console.log('\nInserting into Supabase (user_id=NULL global rows)...');

  // Build set of existing names to skip when --skip-existing is passed
  let existingNames = new Set();
  if (SKIP_EXISTING) {
    const { data: existing } = await sb.from('recipes').select('name').is('user_id', null);
    existingNames = new Set((existing || []).map(r => r.name.toLowerCase()));
    console.log(`  Skipping ${existingNames.size} already-inserted recipes.`);
  }

  let inserted = 0, skipped = 0, insertErrors = 0;
  for (const { row } of processed) {
    if (SKIP_EXISTING && existingNames.has(row.name.toLowerCase())) {
      skipped++;
      continue;
    }
    const { error } = await sb.from('recipes').insert(row);
    if (error) {
      console.error(`  ✗ ${row.name}: ${error.message}`);
      insertErrors++;
    } else {
      inserted++;
    }
  }

  console.log(`  Inserted: ${inserted}, Skipped (existing): ${skipped}, Errors: ${insertErrors}`);

  // ── Report ──────────────────────────────────────────────────────────────────
  printReport(processed, allUnmatched, allDietCorrections, inserted);
}

function printReport(processed, allUnmatched, allDietCorrections, inserted) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log('PILOT REPORT — paste into Claude for review');
  console.log('═'.repeat(80));

  // Per-recipe table
  const slotOrder = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
  const sorted = [...processed].sort((a, b) =>
    (slotOrder[a.row.meal_slot] ?? 9) - (slotOrder[b.row.meal_slot] ?? 9)
  );

  console.log('\n┌ RECIPES INSERTED (' + inserted + ') ─');
  console.log('│ #  Name                                    Slot       Cal  Pro  Carb  Fat  Diets                     Allergens');
  console.log('│ ' + '─'.repeat(120));

  sorted.forEach(({ row }, i) => {
    const name  = row.name.slice(0, 38).padEnd(38);
    const slot  = row.meal_slot.padEnd(9);
    const cal   = String(row.calories_per_serving).padStart(4);
    const pro   = String(row.protein_per_serving).padStart(4);
    const carb  = String(row.carbs_per_serving).padStart(5);
    const fat   = String(row.fat_per_serving).padStart(4);
    const diets = (row.diet_tags || []).join(',').slice(0, 24).padEnd(24);
    const allgs = (row.allergen_tags || []).join(',').slice(0, 15);
    console.log(`│ ${String(i+1).padStart(2)}  ${name}  ${slot}  ${cal}  ${pro}  ${carb}  ${fat}  ${diets}  ${allgs}`);
  });

  // Unmatched ingredients
  if (allUnmatched.length > 0) {
    console.log('\n┌ UNMATCHED INGREDIENTS (USDA lookup failed) ─');
    for (const { recipe, unmatched } of allUnmatched) {
      console.log(`│ ${recipe}`);
      for (const u of unmatched) {
        console.log(`│   → "${u.item}" ${u.qty}${u.unit}${u.reason ? ' ('+u.reason+')' : ''}`);
      }
    }
    console.log(`│ Total recipes with unmatched: ${allUnmatched.length} (macros still computed from matched ingredients)`);
  } else {
    console.log('\n✓ USDA: All ingredients matched');
  }

  // Diet corrections
  if (allDietCorrections.length > 0) {
    console.log('\n┌ DIET TAG CORRECTIONS (AI labels removed) ─');
    for (const { recipe, corrections } of allDietCorrections) {
      console.log(`│ ${recipe}`);
      for (const c of corrections) {
        console.log(`│   → removed "${c.tag}" (${c.reason})`);
      }
    }
  } else {
    console.log('\n✓ DIET TAGS: No corrections needed');
  }

  // Slot breakdown
  const slotCounts = {};
  for (const { row } of processed) slotCounts[row.meal_slot] = (slotCounts[row.meal_slot] || 0) + 1;
  console.log('\n┌ SLOT BREAKDOWN ─');
  for (const [slot, count] of Object.entries(slotCounts)) {
    console.log(`│ ${slot.padEnd(12)}: ${count}`);
  }

  // USDA key note
  console.log('\n┌ USDA KEY ─');
  console.log(`│ Using: ${process.env.USDA_API_KEY ? 'custom key (set via USDA_API_KEY)' : 'DEMO_KEY'}`);
  console.log('│ DEMO_KEY works for up to ~1000 requests/hour. For full 300-recipe run,');
  console.log('│ register free at https://fdc.nal.usda.gov/api-key-signup.html and set USDA_API_KEY=.');

  console.log('\n' + '═'.repeat(80));
  console.log('Next: query SELECT name,meal_slot,diet_tags,allergen_tags,calories_per_serving,protein_per_serving FROM recipes WHERE user_id IS NULL to verify.');
  console.log('Then re-run with --full for the complete 300-recipe library.');
  console.log('✅ Recipes seeded. Now apply Mediterranean tags: run scripts/apply-mediterranean-tags.sql in the Supabase SQL editor (or psql)');
  console.log('═'.repeat(80) + '\n');
}

run().catch(e => { console.error('\nFATAL:', e.message); process.exit(1); });
