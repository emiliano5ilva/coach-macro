-- ============================================================================
-- reclassify-diet-tags.sql — deterministic diet classifier for preset recipes
-- ----------------------------------------------------------------------------
-- WHY: diet_tags were massively over-applied as "healthy-ish" catch-alls
--   (high-protein 273/299, mediterranean 232/299), so filtering by e.g.
--   Mediterranean leaked vegan/carnivore meals. Ground truth (ingredients +
--   per-serving macros) IS accurate, so we re-derive tags from it.
--
-- SCOPE: shared preset recipes only (user_id IS NULL). User recipes untouched.
--
-- SAFETY: this REWRITES recipes.diet_tags and recipes.primary_diet for ~299
--   rows. Run the VALIDATION query (bottom) first and eyeball the distribution
--   before the UPDATE. Idempotent — re-running reproduces the same result.
--
-- Columns it depends on (added by migrations add_recipe_instructions_and_kind
--   + add_recipe_primary_diet):
--     recipes.instructions jsonb   -- authored cooking guide (separate concern)
--     recipes.recipe_kind  text    -- 'assembly' | 'cooked'
--     recipes.primary_diet text    -- single best-fit identity (see priority)
--
-- ── CLASSIFIER RULES (membership = substring match on lowercased item list) ──
--   vegan         no meat/fish/dairy/egg/honey
--   vegetarian    no meat/fish
--   pescatarian   fish present, no land meat
--   carnivore     (meat or fish) AND no grain/legume/vegetable/fruit/nut/plant-oil
--                 (salt, pepper, broth, dairy allowed)
--   paleo         no grain AND no legume AND no dairy
--   keto          carbs<=15g per serving AND fat>=55% of calories
--   low-carb      carbs<=25g per serving
--   high-protein  protein>=30g per serving (absolute)
--   mediterranean olive oil AND (fish OR legume) AND no red meat  -- tightened HARD
--   balanced      protein 20-42% / carbs 28-55% / fat 18-42% of calories
--   (dairy/milk/butter rules exclude plant analogues: almond/oat/coconut milk, nut butters)
--
-- ── primary_diet PRIORITY (most specific identity wins) ──
--   carnivore > MEDITERRANEAN > vegan > pescatarian > vegetarian > paleo >
--   keto > low-carb > high-protein > balanced
--   NOTE: mediterranean sits ABOVE pescatarian/vegetarian/vegan deliberately —
--   55 of 88 Med meals are fish; without this they'd all be pescatarian-primary
--   and the generator's variety-preference would skew the plan fishy. With this,
--   every genuine Med meal claims 'mediterranean' so the preference draws evenly.
--
-- GENERATOR (src/fuel.jsx loadMealPool + src/services/mealFitter.js):
--   filters on diet_tags via overlaps (now accurate); primary_diet is a variety
--   PREFERENCE (-0.05 score nudge in pickForSlot), NOT a hard filter — keto needs
--   all 89 keto-tagged recipes, not the few whose best-fit is keto. Mediterranean
--   snack slot falls back to pescatarian/vegetarian (Med has 0 snack recipes).
--
-- KNOWN REFINEMENT TODO: the legume keyword 'beans' also matches 'black beans'
--   in some dishes that aren't really Mediterranean — tighten the med legume
--   signal (require chickpea/lentil/white-bean, not any 'beans').
-- ============================================================================

with base as (
  select r.id,
    r.calories_per_serving cal, coalesce(r.protein_per_serving,0) pro,
    coalesce(r.carbs_per_serving,0) carb, coalesce(r.fat_per_serving,0) fat,
    coalesce((select string_agg(lower(i->>'item'),'|') from jsonb_array_elements(r.ingredients) i),'') items
  from recipes r where r.user_id is null
),
f as (select *,
    (items ~ '(beef|steak|sirloin|\ypork|bacon|\yham\y|lamb|veal|venison|bison|chicken|turkey|\yduck|sausage|prosciutto|jerky)') hm,
    (items ~ '(salmon|tuna|\ycod\y|halibut|tilapia|trout|mackerel|sardine|anchovy|shrimp|prawn|\ycrab|lobster|scallop|oyster|mussel|\yfish|seafood)') hf,
    (items ~ '\yegg') he, (items ~ 'honey') hh,
    (items ~ '(cheese|yogurt|yoghurt|\yghee|kefir|whey|casein)'
      or items ~ '(heavy cream|sour cream|cream cheese|whipping cream|half and half)'
      or (items ~ '\ybutter' and items !~ '(almond|peanut|cashew|sunflower|seed|\ynut|coconut) butter')
      or (items ~ '\ymilk' and items !~ '(almond|soy|oat|coconut|rice|cashew|hemp) milk')) hd,
    (items ~ '(\yrice|\yoat|bread|pasta|spaghetti|noodle|tortilla|flour|couscous|barley|farro|wheat|cereal|bagel|cracker|granola|\ywrap|polenta|pita|quinoa)') hg,
    (items ~ '(beans|chickpea|lentil|peanut|edamame|\ysoy|tofu|tempeh|hummus|pea protein|pinto)') hl,
    (items ~ 'olive oil') ho, (items ~ '(sesame oil|coconut oil|avocado oil|vegetable oil|canola|sunflower oil)') hpo,
    ((items~'spinach')::int+(items~'kale')::int+(items~'broccoli')::int+(items~'cauliflower')::int+(items~'lettuce|romaine|arugula|mixed greens')::int+(items~'\ytomato')::int+(items~'onion')::int+(items~'garlic')::int+(items~'bell pepper|peppers,')::int+(items~'cucumber')::int+(items~'zucchini')::int+(items~'mushroom')::int+(items~'carrot')::int+(items~'celery')::int+(items~'asparagus')::int+(items~'cabbage')::int+(items~'eggplant')::int+(items~'squash')::int+(items~'\ybeet')::int+(items~'leek')::int) vc,
    (items ~ '(berr|banana|\yapple|orange|mango|pineapple|grape|melon|peach|\ypear|kiwi|avocado|lemon|lime)') hfr,
    (items ~ '(almond|walnut|cashew|pecan|peanut|pistachio|macadamia|hazelnut|chia|flax|\yseeds|\ynuts)') hn
  from base),
c as (select id,
    (not hm and not hf and not hd and not he and not hh) is_vegan,
    (not hm and not hf) is_veg,
    (hf and not hm) is_pesc,
    ((hm or hf) and not hg and not hl and vc=0 and not hfr and not hn and not ho and not hpo) is_carn,
    (not hg and not hl and not hd) is_paleo,
    (cal>0 and carb<=15 and (fat*9.0/cal)>=0.55) is_keto,
    (carb<=25) is_lowcarb,
    (pro>=30) is_hp,
    (ho and (hf or hl) and items !~ '(beef|\ypork|bacon|lamb|sausage)') is_med,
    (cal>0 and (pro*4.0/cal) between 0.20 and 0.42 and (carb*4.0/cal) between 0.28 and 0.55 and (fat*9.0/cal) between 0.18 and 0.42) is_bal
  from f),
n as (select id,
    array_remove(array[
      case when is_vegan then 'vegan' end, case when is_veg then 'vegetarian' end, case when is_pesc then 'pescatarian' end,
      case when is_carn then 'carnivore' end, case when is_paleo then 'paleo' end, case when is_keto then 'keto' end,
      case when is_lowcarb then 'low-carb' end, case when is_hp then 'high-protein' end, case when is_med then 'mediterranean' end,
      case when is_bal then 'balanced' end
    ], null) raw_tags,
    case
      when is_carn then 'carnivore'
      when is_med  then 'mediterranean'   -- ABOVE the plant axis on purpose (see header)
      when is_vegan then 'vegan'
      when is_pesc then 'pescatarian'
      when is_veg then 'vegetarian'
      when is_paleo then 'paleo'
      when is_keto then 'keto'
      when is_lowcarb then 'low-carb'
      when is_hp then 'high-protein'
      else 'balanced' end prim
  from c)
update recipes r
set diet_tags = case when cardinality(n.raw_tags)=0 then array['balanced'] else n.raw_tags end,
    primary_diet = n.prim
from n where r.id = n.id;

-- ── VALIDATION (run as a SELECT before the UPDATE to preview the distribution) ──
-- Replace the UPDATE above with the `c`/`n` CTEs and:
--   select unnest(raw_tags) tag, count(*) from n group by 1 order by 2 desc;
--   select prim primary_diet, count(*) from n group by 1 order by 2 desc;
-- Flag any diet under ~15 total, or any meal_slot under ~3 (can't fill a varied week).
