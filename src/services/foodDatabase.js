import { sb } from "../supabase.js";

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";
const USDA_KEY = "DEMO_KEY"; // Get a free key at api.nal.usda.gov
const OFF_BASE = "https://world.openfoodfacts.org";

// ── Smart serving sizes for common foods ─────────────────────────────────────

export const SMART_SERVINGS = {
  chicken: [
    { label: "4 oz (112g)", grams: 112 },
    { label: "6 oz (170g)", grams: 170 },
    { label: "8 oz (226g)", grams: 226 },
  ],
  "ground beef": [
    { label: "3 oz raw (85g)", grams: 85 },
    { label: "4 oz raw (113g)", grams: 113 },
    { label: "6 oz raw (170g)", grams: 170 },
  ],
  salmon: [
    { label: "3 oz (85g)", grams: 85 },
    { label: "6 oz fillet (170g)", grams: 170 },
  ],
  tuna: [
    { label: "1 can (142g)", grams: 142 },
    { label: "3 oz (85g)", grams: 85 },
  ],
  steak: [
    { label: "4 oz (113g)", grams: 113 },
    { label: "6 oz (170g)", grams: 170 },
    { label: "8 oz (226g)", grams: 226 },
  ],
  egg: [
    { label: "1 egg (50g)", grams: 50 },
    { label: "2 eggs (100g)", grams: 100 },
    { label: "3 eggs (150g)", grams: 150 },
  ],
  rice: [
    { label: "½ cup cooked (92g)", grams: 92 },
    { label: "1 cup cooked (186g)", grams: 186 },
    { label: "1½ cups cooked (279g)", grams: 279 },
  ],
  oat: [
    { label: "½ cup dry (40g)", grams: 40 },
    { label: "1 cup dry (80g)", grams: 80 },
  ],
  pasta: [
    { label: "56g dry (1 serving)", grams: 56 },
    { label: "112g dry (2 servings)", grams: 112 },
  ],
  potato: [
    { label: "1 small (130g)", grams: 130 },
    { label: "1 medium (173g)", grams: 173 },
    { label: "1 large (299g)", grams: 299 },
  ],
  banana: [
    { label: "1 small (81g)", grams: 81 },
    { label: "1 medium (118g)", grams: 118 },
    { label: "1 large (136g)", grams: 136 },
  ],
  apple: [
    { label: "1 small (149g)", grams: 149 },
    { label: "1 medium (182g)", grams: 182 },
  ],
  bread: [
    { label: "1 slice (28g)", grams: 28 },
    { label: "2 slices (56g)", grams: 56 },
  ],
  avocado: [
    { label: "½ avocado (75g)", grams: 75 },
    { label: "1 avocado (150g)", grams: 150 },
  ],
  almond: [
    { label: "1 oz (28g) ≈ 23 almonds", grams: 28 },
    { label: "2 oz (56g)", grams: 56 },
  ],
  "peanut butter": [
    { label: "1 tbsp (16g)", grams: 16 },
    { label: "2 tbsp (32g)", grams: 32 },
  ],
  cheese: [
    { label: "1 oz slice (28g)", grams: 28 },
    { label: "2 oz (56g)", grams: 56 },
  ],
  yogurt: [
    { label: "½ cup (113g)", grams: 113 },
    { label: "1 cup (227g)", grams: 227 },
  ],
  milk: [
    { label: "1 cup (240ml)", grams: 240 },
    { label: "2 cups (480ml)", grams: 480 },
  ],
  protein: [
    { label: "1 scoop (30g)", grams: 30 },
    { label: "2 scoops (60g)", grams: 60 },
  ],
  olive: [
    { label: "1 tsp (5g)", grams: 5 },
    { label: "1 tbsp (14g)", grams: 14 },
  ],
};

export function getSmartServings(foodName) {
  if (!foodName) return [];
  const lower = foodName.toLowerCase();
  for (const [keyword, servings] of Object.entries(SMART_SERVINGS)) {
    if (lower.includes(keyword)) return servings;
  }
  return [];
}

// ── Quick-add presets ─────────────────────────────────────────────────────────

export const QUICK_FOODS = {
  protein: [
    { id: "qp_chicken", name: "Chicken Breast", source: "quick", calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: 113, servingUnit: "g" },
    { id: "qp_eggs", name: "Whole Eggs", source: "quick", calories: 143, protein: 13, carbs: 1, fat: 10, servingSize: 50, servingUnit: "g" },
    { id: "qp_salmon", name: "Salmon (cooked)", source: "quick", calories: 208, protein: 22, carbs: 0, fat: 13, servingSize: 113, servingUnit: "g" },
    { id: "qp_tuna", name: "Tuna (canned)", source: "quick", calories: 109, protein: 24, carbs: 0, fat: 1, servingSize: 85, servingUnit: "g" },
    { id: "qp_beef", name: "Ground Beef (93%)", source: "quick", calories: 152, protein: 23, carbs: 0, fat: 6, servingSize: 113, servingUnit: "g" },
    { id: "qp_yogurt", name: "Greek Yogurt (0%)", source: "quick", calories: 59, protein: 10, carbs: 4, fat: 0, servingSize: 170, servingUnit: "g" },
    { id: "qp_cottage", name: "Cottage Cheese (2%)", source: "quick", calories: 90, protein: 12, carbs: 4, fat: 2.5, servingSize: 113, servingUnit: "g" },
    { id: "qp_whey", name: "Whey Protein Powder", source: "quick", calories: 120, protein: 25, carbs: 3, fat: 1, servingSize: 30, servingUnit: "g" },
  ],
  carbs: [
    { id: "qc_rice", name: "White Rice (cooked)", source: "quick", calories: 130, protein: 2.4, carbs: 28, fat: 0.3, servingSize: 186, servingUnit: "g" },
    { id: "qc_oats", name: "Oatmeal (dry)", source: "quick", calories: 379, protein: 13, carbs: 68, fat: 6.5, servingSize: 40, servingUnit: "g" },
    { id: "qc_sweetpotato", name: "Sweet Potato (baked)", source: "quick", calories: 90, protein: 2, carbs: 21, fat: 0.1, servingSize: 130, servingUnit: "g" },
    { id: "qc_banana", name: "Banana", source: "quick", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingSize: 118, servingUnit: "g" },
    { id: "qc_bread", name: "Whole Wheat Bread", source: "quick", calories: 247, protein: 13, carbs: 41, fat: 3, servingSize: 28, servingUnit: "g" },
    { id: "qc_pasta", name: "Pasta (cooked)", source: "quick", calories: 158, protein: 5.8, carbs: 31, fat: 0.9, servingSize: 140, servingUnit: "g" },
    { id: "qc_apple", name: "Apple", source: "quick", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, servingSize: 182, servingUnit: "g" },
    { id: "qc_quinoa", name: "Quinoa (cooked)", source: "quick", calories: 120, protein: 4.4, carbs: 21, fat: 1.9, servingSize: 185, servingUnit: "g" },
  ],
  fat: [
    { id: "qf_avocado", name: "Avocado", source: "quick", calories: 160, protein: 2, carbs: 9, fat: 15, servingSize: 150, servingUnit: "g" },
    { id: "qf_almonds", name: "Almonds", source: "quick", calories: 579, protein: 21, carbs: 22, fat: 50, servingSize: 28, servingUnit: "g" },
    { id: "qf_pb", name: "Peanut Butter", source: "quick", calories: 589, protein: 25, carbs: 20, fat: 50, servingSize: 32, servingUnit: "g" },
    { id: "qf_oliveoil", name: "Olive Oil", source: "quick", calories: 884, protein: 0, carbs: 0, fat: 100, servingSize: 14, servingUnit: "ml" },
    { id: "qf_cheese", name: "Cheddar Cheese", source: "quick", calories: 402, protein: 25, carbs: 1.3, fat: 33, servingSize: 28, servingUnit: "g" },
    { id: "qf_walnuts", name: "Walnuts", source: "quick", calories: 654, protein: 15, carbs: 14, fat: 65, servingSize: 28, servingUnit: "g" },
  ],
};

// ── USDA FoodData Central ─────────────────────────────────────────────────────

const getNutrient = (nutrients, nutrientId) => {
  const n = nutrients?.find(n => n.nutrientId === nutrientId || n.nutrient?.id === nutrientId);
  return Math.round((n?.value || 0) * 10) / 10;
};

const searchUSDA = async (query) => {
  try {
    const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}&dataType=Foundation,SR%20Legacy&pageSize=10&api_key=${USDA_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.foods) return [];
    return data.foods
      .filter(f => f.foodNutrients?.length > 0)
      .map(food => ({
        id: `usda_${food.fdcId}`,
        source: "usda",
        name: food.description,
        brand: food.brandOwner || null,
        servingSize: 100,
        servingUnit: "g",
        calories: getNutrient(food.foodNutrients, 1008),
        protein: getNutrient(food.foodNutrients, 1003),
        carbs: getNutrient(food.foodNutrients, 1005),
        fat: getNutrient(food.foodNutrients, 1004),
        fiber: getNutrient(food.foodNutrients, 1079),
        sugar: getNutrient(food.foodNutrients, 2000),
        sodium: getNutrient(food.foodNutrients, 1093),
      }))
      .filter(f => f.calories > 0 || f.protein > 0);
  } catch {
    return [];
  }
};

// ── Open Food Facts ───────────────────────────────────────────────────────────

const searchOpenFoodFacts = async (query) => {
  try {
    const url = `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=10&fields=product_name,brands,serving_size,nutriments,id`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.products) return [];
    return data.products
      .filter(p => p.product_name && p.nutriments?.["energy-kcal_100g"])
      .map(product => ({
        id: `off_${product.id || product._id}`,
        source: "openfoodfacts",
        name: product.product_name,
        brand: product.brands || null,
        servingSize: parseFloat(product.serving_size) || 100,
        servingUnit: "g",
        calories: Math.round(product.nutriments["energy-kcal_100g"] || 0),
        protein: Math.round((product.nutriments["proteins_100g"] || 0) * 10) / 10,
        carbs: Math.round((product.nutriments["carbohydrates_100g"] || 0) * 10) / 10,
        fat: Math.round((product.nutriments["fat_100g"] || 0) * 10) / 10,
        fiber: Math.round((product.nutriments["fiber_100g"] || 0) * 10) / 10,
        sugar: Math.round((product.nutriments["sugars_100g"] || 0) * 10) / 10,
        sodium: Math.round((product.nutriments["sodium_100g"] || 0) * 1000) / 1000,
      }))
      .filter(f => f.calories > 0 || f.protein > 0);
  } catch {
    return [];
  }
};

const deduplicateFoods = (foods) => {
  const seen = new Set();
  return foods.filter(food => {
    const key = food.name.toLowerCase().trim().slice(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ── Public API ────────────────────────────────────────────────────────────────

export const searchFoods = async (query) => {
  if (!query || query.length < 2) return [];
  try {
    const [usdaResults, offResults] = await Promise.allSettled([
      searchUSDA(query),
      searchOpenFoodFacts(query),
    ]);
    const combined = [
      ...(usdaResults.value || []),
      ...(offResults.value || []),
    ];
    return deduplicateFoods(combined).slice(0, 20);
  } catch {
    return [];
  }
};

export const searchByBarcode = async (barcode) => {
  try {
    const url = `${OFF_BASE}/api/v0/product/${barcode}.json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    const n = p.nutriments || {};
    return {
      id: `off_${barcode}`,
      source: "openfoodfacts",
      name: p.product_name || "Unknown Product",
      brand: p.brands || null,
      servingSize: parseFloat(p.serving_size) || 100,
      servingUnit: "g",
      calories: Math.round(n["energy-kcal_100g"] || 0),
      protein: Math.round((n["proteins_100g"] || 0) * 10) / 10,
      carbs: Math.round((n["carbohydrates_100g"] || 0) * 10) / 10,
      fat: Math.round((n["fat_100g"] || 0) * 10) / 10,
      fiber: Math.round((n["fiber_100g"] || 0) * 10) / 10,
      sugar: Math.round((n["sugars_100g"] || 0) * 10) / 10,
      sodium: Math.round((n["sodium_100g"] || 0) * 1000) / 1000,
    };
  } catch {
    return null;
  }
};

export const saveFoodToHistory = async (userId, food) => {
  if (!userId || !food) return;
  try {
    const { data: existing } = await sb
      .from("food_history")
      .select("use_count")
      .eq("user_id", userId)
      .eq("food_id", food.id)
      .maybeSingle();
    await sb.from("food_history").upsert(
      {
        user_id: userId,
        food_id: food.id,
        food_name: food.name,
        food_data: food,
        last_used: new Date().toISOString(),
        use_count: (existing?.use_count || 0) + 1,
      },
      { onConflict: "user_id,food_id" }
    );
  } catch {}
};

export const getFrequentFoods = async (userId) => {
  if (!userId) return [];
  try {
    const { data } = await sb
      .from("food_history")
      .select("food_name, food_data, use_count, usual_portion, usual_unit")
      .eq("user_id", userId)
      .order("use_count", { ascending: false })
      .limit(8);
    return data || [];
  } catch {
    return [];
  }
};

export const getRecentFoods = async (userId) => {
  if (!userId) return [];
  try {
    const { data } = await sb
      .from("food_history")
      .select("food_name, food_data, usual_portion, usual_unit")
      .eq("user_id", userId)
      .order("last_used", { ascending: false })
      .limit(5);
    return data || [];
  } catch {
    return [];
  }
};

export const updateUsualPortion = async (userId, foodId, portion, unit) => {
  if (!userId || !foodId) return;
  try {
    await sb.from("food_history")
      .update({ usual_portion: portion, usual_unit: unit })
      .eq("user_id", userId)
      .eq("food_id", foodId);
  } catch {}
};

export const getMealTemplates = async (userId) => {
  if (!userId) return [];
  try {
    const { data } = await sb
      .from("meal_templates")
      .select("*")
      .eq("user_id", userId)
      .order("use_count", { ascending: false })
      .limit(10);
    return data || [];
  } catch {
    return [];
  }
};

export const saveMealTemplate = async (userId, name, entries) => {
  if (!userId || !entries?.length) return null;
  try {
    const totals = entries.reduce((acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fat: acc.fat + (e.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    const { data } = await sb.from("meal_templates").insert({
      user_id: userId,
      name,
      entries,
      total_calories: Math.round(totals.calories),
      total_protein: Math.round(totals.protein * 10) / 10,
      total_carbs: Math.round(totals.carbs * 10) / 10,
      total_fat: Math.round(totals.fat * 10) / 10,
    }).select().single();
    return data;
  } catch {
    return null;
  }
};

export const deleteMealTemplate = async (userId, templateId) => {
  if (!userId || !templateId) return;
  try {
    await sb.from("meal_templates").delete().eq("id", templateId).eq("user_id", userId);
  } catch {}
};

export const incrementTemplateUse = async (templateId) => {
  if (!templateId) return;
  try {
    await sb.rpc("increment_template_use", { tid: templateId }).catch(() => {
      sb.from("meal_templates").select("use_count").eq("id", templateId).single()
        .then(({ data }) => {
          if (data) sb.from("meal_templates").update({ use_count: (data.use_count || 1) + 1 }).eq("id", templateId).catch(() => {});
        });
    });
  } catch {}
};

// ── User Recipes ──────────────────────────────────────────────────────────────

export const getUserRecipes = async (userId) => {
  if (!userId) return [];
  try {
    const { data } = await sb
      .from("recipes")
      .select("*")
      .eq("user_id", userId)
      .order("use_count", { ascending: false });
    return data || [];
  } catch {
    return [];
  }
};

export const saveUserRecipe = async (userId, recipe) => {
  if (!userId) return null;
  try {
    const { data } = await sb.from("recipes").insert({
      user_id: userId,
      name: recipe.name,
      category: recipe.category || null,
      servings_count: recipe.servings_count || 1,
      ingredients: recipe.ingredients || [],
      calories_per_serving: Math.round(recipe.calories_per_serving || 0),
      protein_per_serving: Math.round((recipe.protein_per_serving || 0) * 10) / 10,
      carbs_per_serving: Math.round((recipe.carbs_per_serving || 0) * 10) / 10,
      fat_per_serving: Math.round((recipe.fat_per_serving || 0) * 10) / 10,
      fiber_per_serving: Math.round((recipe.fiber_per_serving || 0) * 10) / 10,
    }).select().single();
    return data;
  } catch {
    return null;
  }
};

export const updateUserRecipe = async (userId, recipeId, recipe) => {
  if (!userId || !recipeId) return null;
  try {
    const { data } = await sb.from("recipes").update({
      name: recipe.name,
      category: recipe.category || null,
      servings_count: recipe.servings_count || 1,
      ingredients: recipe.ingredients || [],
      calories_per_serving: Math.round(recipe.calories_per_serving || 0),
      protein_per_serving: Math.round((recipe.protein_per_serving || 0) * 10) / 10,
      carbs_per_serving: Math.round((recipe.carbs_per_serving || 0) * 10) / 10,
      fat_per_serving: Math.round((recipe.fat_per_serving || 0) * 10) / 10,
      fiber_per_serving: Math.round((recipe.fiber_per_serving || 0) * 10) / 10,
    }).eq("id", recipeId).eq("user_id", userId).select().single();
    return data;
  } catch {
    return null;
  }
};

export const deleteUserRecipe = async (userId, recipeId) => {
  if (!userId || !recipeId) return;
  try {
    await sb.from("recipes").delete().eq("id", recipeId).eq("user_id", userId);
  } catch {}
};

export const incrementRecipeUse = async (recipeId) => {
  if (!recipeId) return;
  try {
    const { data } = await sb.from("recipes").select("use_count").eq("id", recipeId).single();
    if (data) {
      await sb.from("recipes").update({
        use_count: (data.use_count || 0) + 1,
        last_used: new Date().toISOString(),
      }).eq("id", recipeId);
    }
  } catch {}
};

export const saveCustomFood = async (userId, food) => {
  if (!userId) return null;
  try {
    const { data } = await sb
      .from("custom_foods")
      .insert({
        user_id: userId,
        name: food.name,
        brand: food.brand || null,
        serving_size: food.servingSize || 100,
        serving_unit: food.servingUnit || "g",
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber || 0,
        sugar: food.sugar || 0,
        sodium: food.sodium || 0,
      })
      .select()
      .single();
    return data ? { ...food, id: `custom_${data.id}`, source: "custom" } : null;
  } catch {
    return null;
  }
};

export const searchCustomFoods = async (userId, query) => {
  if (!userId) return [];
  try {
    const { data } = await sb
      .from("custom_foods")
      .select("*")
      .eq("user_id", userId)
      .ilike("name", `%${query}%`)
      .limit(5);
    return (data || []).map(f => ({
      id: `custom_${f.id}`,
      source: "custom",
      name: f.name,
      brand: f.brand,
      servingSize: f.serving_size,
      servingUnit: f.serving_unit,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      fiber: f.fiber,
      sugar: f.sugar,
      sodium: f.sodium,
    }));
  } catch {
    return [];
  }
};
