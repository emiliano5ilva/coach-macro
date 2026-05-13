import React, { useState, useEffect, useRef } from "react";
import { FlagBtn } from "./FlagBtn.jsx";
import { T, GLOBAL_CSS, WDAYS, DAY_CFG, FASTING_PROTOCOLS,
  Ring, MacroRing, MacroBar, PrimaryBtn, SectionCard, Spinner, Logo, FAQItem,
  FoodSearchSkeleton, AIContentSkeleton, EmptyState, hap, calcTDEE } from "./components.jsx";
import { showToast } from "./utils/toast.js";
import { sb, ai, streamAI } from "./client.js";
import { track, EVENTS } from "./services/analytics.js";
import { getCyclePhase } from "./utils/ait.js";
import { getCycleNutrition, PCOS_NOTE, PCOS_FOODS, PERI_NUTRITION, MENO_NUTRITION, isCalorieFreeMode } from "./utils/female.js";
import {
  searchFoods, searchByBarcode, searchCustomFoods,
  saveFoodToHistory, getFrequentFoods, getRecentFoods,
  saveCustomFood, getSmartServings, QUICK_FOODS,
  updateUsualPortion, getMealTemplates, saveMealTemplate, deleteMealTemplate, incrementTemplateUse,
  getUserRecipes, saveUserRecipe, updateUserRecipe, deleteUserRecipe, incrementRecipeUse,
  addWaterLog, deleteWaterLog,
} from "./services/foodDatabase.js";
import { getAIErrorMessage } from "./utils/errors.js";

const MEAL_SLOT_DEFS = {
  "2":  ["Breakfast","Dinner"],
  "4":  ["Breakfast","Lunch","Dinner","Snack"],
  "5":  ["Breakfast","Lunch","Snack","Dinner","Evening Snack"],
  "6+": ["Breakfast","Morning Snack","Lunch","Afternoon Snack","Dinner","Evening"],
};

function PortionSheet({ food, mealSlots, activeSlotIdx, setActiveSlotIdx, onAdd, onClose }) {
  const smart = getSmartServings(food?.name || "");
  const [portionGrams, setPortionGrams] = useState(() => food?.usual_portion || (smart[0]?.grams ?? 100));
  const [portionMode, setPortionMode] = useState("smart");
  const [customVal, setCustomVal] = useState("");

  const grams = portionMode === "custom" ? (parseFloat(customVal) || portionGrams) : portionGrams;
  const f = grams / 100;
  const m = {
    calories: Math.round((food?.calories || 0) * f),
    protein: Math.round((food?.protein || 0) * f * 10) / 10,
    carbs: Math.round((food?.carbs || 0) * f * 10) / 10,
    fat: Math.round((food?.fat || 0) * f * 10) / 10,
  };

  if (!food) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,13,26,.9)", backdropFilter: "blur(8px)", zIndex: 310, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#0A1222", border: "1px solid rgba(255,255,255,.12)", borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", maxWidth: 480, width: "100%" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 32, height: 3, background: "rgba(255,255,255,.15)", borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>{food.name}</div>
        {food.brand && <div style={{ fontSize: 11, color: T.mu, marginBottom: 14 }}>{food.brand}</div>}
        <div style={{ display: "flex", gap: 14, marginBottom: 20, background: T.s2, borderRadius: 12, padding: "12px 16px" }}>
          {[["Cal", m.calories, "", "#fff"], ["P", m.protein, "g", T.prot], ["C", m.carbs, "g", T.carb], ["F", m.fat, "g", T.fat]].map(([l, v, u, c]) => (
            <div key={l} style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 9, color: T.mu, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: c, lineHeight: 1 }}>{v}{u}</div>
            </div>
          ))}
        </div>
        {smart.length > 0 ? (
          <>
            <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>Serving size</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {smart.map((s, i) => (
                <button key={i} onClick={() => { setPortionMode("smart"); setPortionGrams(s.grams); }} style={{ padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${portionMode === "smart" && portionGrams === s.grams ? T.carb : T.bd}`, background: portionMode === "smart" && portionGrams === s.grams ? `${T.carb}15` : "none", color: portionMode === "smart" && portionGrams === s.grams ? T.carb : T.mu, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{s.label}</button>
              ))}
              <button onClick={() => setPortionMode("custom")} style={{ padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${portionMode === "custom" ? T.carb : T.bd}`, background: portionMode === "custom" ? `${T.carb}15` : "none", color: portionMode === "custom" ? T.carb : T.mu, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Custom (g)</button>
            </div>
            {portionMode === "custom" && <input type="number" value={customVal} onChange={e => setCustomVal(e.target.value)} placeholder="Enter grams" style={{ width: "100%", background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 12 }} />}
          </>
        ) : (
          <>
            <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>Grams</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <button onClick={() => setPortionGrams(g => Math.max(10, g - 10))} style={{ width: 40, height: 40, borderRadius: 10, background: T.s2, border: `1px solid ${T.bd}`, color: "#fff", fontSize: 22, cursor: "pointer", fontFamily: "inherit", lineHeight: 1 }}>−</button>
              <div style={{ flex: 1, textAlign: "center", fontSize: 28, fontWeight: 900 }}>{portionGrams}<span style={{ fontSize: 12, color: T.mu, fontWeight: 400 }}>g</span></div>
              <button onClick={() => setPortionGrams(g => g + 10)} style={{ width: 40, height: 40, borderRadius: 10, background: T.s2, border: `1px solid ${T.bd}`, color: "#fff", fontSize: 22, cursor: "pointer", fontFamily: "inherit", lineHeight: 1 }}>+</button>
            </div>
          </>
        )}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>Log to meal</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {mealSlots.map((slot, i) => (
              <button key={slot} onClick={() => setActiveSlotIdx(i)} style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${activeSlotIdx === i ? T.carb : T.bd}`, background: activeSlotIdx === i ? `${T.carb}15` : "none", color: activeSlotIdx === i ? T.carb : T.mu, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{slot}</button>
            ))}
          </div>
        </div>
        <button onClick={() => onAdd(food, grams, mealSlots[activeSlotIdx] || "Lunch")} style={{ width: "100%", padding: "15px", background: T.prot, color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>Add to Log →</button>
      </div>
    </div>
  );
}

// ── Recipe Log Sheet ─────────────────────────────────────────────────────────
function RecipeLogSheet({ recipe, mealSlots, activeSlotIdx, setActiveSlotIdx, onLog, onClose }) {
  const SERVING_OPTS = [0.5, 1, 1.5, 2, 2.5, 3];
  const [servings, setServings] = useState(1);

  if (!recipe) return null;
  const scale = servings / (recipe.servings_count || 1);
  const cal = Math.round((recipe.calories_per_serving || 0) * scale * (recipe.servings_count || 1) / (recipe.servings_count || 1) * servings / 1);
  // Simpler: total = per_serving * servings
  const totCal  = Math.round(recipe.calories_per_serving * servings);
  const totProt = Math.round(recipe.protein_per_serving * servings * 10) / 10;
  const totCarb = Math.round(recipe.carbs_per_serving * servings * 10) / 10;
  const totFat  = Math.round(recipe.fat_per_serving * servings * 10) / 10;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,13,26,.9)", backdropFilter: "blur(8px)", zIndex: 320, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#0A1222", border: "1px solid rgba(255,255,255,.12)", borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", maxWidth: 480, width: "100%" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 32, height: 3, background: "rgba(255,255,255,.15)", borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 900, marginBottom: 2 }}>{recipe.name}</div>
        {recipe.category && <div style={{ fontSize: 11, color: T.mu, marginBottom: 16 }}>{recipe.category}</div>}

        <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 10 }}>How many servings?</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
          {SERVING_OPTS.map(s => (
            <button key={s} onClick={() => setServings(s)} style={{ padding: "10px 14px", borderRadius: 20, border: `1.5px solid ${servings === s ? T.prot : T.bd}`, background: servings === s ? `${T.prot}18` : "none", color: servings === s ? T.prot : T.mu, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{s}</button>
          ))}
        </div>

        <div style={{ background: T.s2, borderRadius: 12, padding: "14px 16px", marginBottom: 16, display: "flex", gap: 0 }}>
          {[["Cal", totCal, "", "#fff"], ["P", totProt, "g", T.prot], ["C", totCarb, "g", T.carb], ["F", totFat, "g", T.fat]].map(([l, v, u, c]) => (
            <div key={l} style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 9, color: T.mu, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: c, lineHeight: 1 }}>{v}{u}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>Log to meal</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {mealSlots.map((slot, i) => (
            <button key={slot} onClick={() => setActiveSlotIdx(i)} style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${activeSlotIdx === i ? T.carb : T.bd}`, background: activeSlotIdx === i ? `${T.carb}15` : "none", color: activeSlotIdx === i ? T.carb : T.mu, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{slot}</button>
          ))}
        </div>

        <button onClick={() => onLog(recipe, servings, mealSlots[activeSlotIdx] || "Lunch")} style={{ width: "100%", padding: "15px", background: T.prot, color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>Log {servings} Serving{servings !== 1 ? "s" : ""} →</button>
      </div>
    </div>
  );
}

// ── Recipe Builder Screen ─────────────────────────────────────────────────────
const RECIPE_CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snack", "Pre-workout", "Post-workout", "Meal Prep"];

function RecipeBuilderScreen({ user, recipe: initRecipe, onSave, onBack }) {
  const [name, setName] = useState(initRecipe?.name || "");
  const [servingsCount, setServingsCount] = useState(initRecipe?.servings_count || 1);
  const [ingredients, setIngredients] = useState(initRecipe?.ingredients || []);
  const [category, setCategory] = useState(initRecipe?.category || "");
  const [saving, setSaving] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [portionFood, setPortionFood] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const totals = ingredients.reduce((acc, ing) => ({
    calories: acc.calories + (ing.calories || 0),
    protein: acc.protein + (ing.protein || 0),
    carbs: acc.carbs + (ing.carbs || 0),
    fat: acc.fat + (ing.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const perServing = {
    calories: Math.round(totals.calories / Math.max(1, servingsCount)),
    protein: Math.round(totals.protein / Math.max(1, servingsCount) * 10) / 10,
    carbs: Math.round(totals.carbs / Math.max(1, servingsCount) * 10) / 10,
    fat: Math.round(totals.fat / Math.max(1, servingsCount) * 10) / 10,
  };

  async function doSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const r = await searchFoods(searchQuery, user?.id);
      setSearchResults(r || []);
    } catch { setSearchResults([]); }
    setSearching(false);
  }

  function addIngredient(food, grams) {
    const f = grams / 100;
    const ing = {
      food_id: food.id || food.name,
      food_name: food.name,
      amount: grams,
      unit: "g",
      calories: Math.round((food.calories || 0) * f),
      protein: Math.round((food.protein || 0) * f * 10) / 10,
      carbs: Math.round((food.carbs || 0) * f * 10) / 10,
      fat: Math.round((food.fat || 0) * f * 10) / 10,
      _food: food,
    };
    setIngredients(prev => [...prev, ing]);
    setPortionFood(null);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  }

  async function handleSave() {
    if (!name.trim() || ingredients.length === 0) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      category: category || null,
      servings_count: servingsCount,
      ingredients,
      calories_per_serving: perServing.calories,
      protein_per_serving: perServing.protein,
      carbs_per_serving: perServing.carbs,
      fat_per_serving: perServing.fat,
    });
    setSaving(false);
  }

  // Ingredient search sheet
  if (portionFood) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 340, background: "#060d1a" }}>
        <PortionSheet
          food={portionFood}
          mealSlots={["Add to Recipe"]}
          activeSlotIdx={0}
          setActiveSlotIdx={() => {}}
          onAdd={(food, grams) => addIngredient(food, grams)}
          onClose={() => setPortionFood(null)}
        />
      </div>
    );
  }

  if (showSearch) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#060d1a", zIndex: 340, overflowY: "auto", padding: "20px 20px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }} style={{ background: "none", border: "none", color: T.mu, fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1 }}>←</button>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 800 }}>Add Ingredient</div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSearch()}
            placeholder="Search foods…"
            style={{ flex: 1, background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit" }}
          />
          <button onClick={doSearch} disabled={searching} style={{ padding: "12px 18px", background: T.prot, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{searching ? "…" : "Search"}</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {searchResults.map((food, i) => (
            <div key={i} onClick={() => setPortionFood(food)} style={{ padding: "13px 16px", background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 12, cursor: "pointer" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{food.name}</div>
              <div style={{ fontSize: 11, color: T.mu }}>{food.brand && `${food.brand} · `}{food.calories} kcal · <span style={{ color: T.prot }}>P {food.protein}g</span> · <span style={{ color: T.carb }}>C {food.carbs}g</span> · <span style={{ color: T.fat }}>F {food.fat}g</span></div>
            </div>
          ))}
          {!searching && searchResults.length === 0 && searchQuery && (
            <div style={{ textAlign: "center", padding: "32px 0", color: T.mu, fontSize: 13 }}>No results — try a different search</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#060d1a", zIndex: 330, overflowY: "auto", padding: "20px 20px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: T.mu, fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1 }}>←</button>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 900 }}>{initRecipe ? "EDIT RECIPE" : "NEW RECIPE"}</div>
      </div>

      {/* Name */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>Recipe Name *</div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Post-Workout Shake" style={{ width: "100%", background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 10, padding: "13px 14px", color: "#fff", fontSize: 15, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
      </div>

      {/* Servings */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 4 }}>Servings This Makes</div>
        <div style={{ fontSize: 11, color: T.mu, marginBottom: 10 }}>If you make a big batch, enter the number of portions</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setServingsCount(s => Math.max(1, s - 1))} style={{ width: 40, height: 40, borderRadius: 10, background: T.s2, border: `1px solid ${T.bd}`, color: "#fff", fontSize: 22, cursor: "pointer", fontFamily: "inherit", lineHeight: 1 }}>−</button>
          <div style={{ flex: 1, textAlign: "center", fontSize: 28, fontWeight: 900 }}>{servingsCount} <span style={{ fontSize: 12, color: T.mu, fontWeight: 400 }}>serving{servingsCount !== 1 ? "s" : ""}</span></div>
          <button onClick={() => setServingsCount(s => Math.min(20, s + 1))} style={{ width: 40, height: 40, borderRadius: 10, background: T.s2, border: `1px solid ${T.bd}`, color: "#fff", fontSize: 22, cursor: "pointer", fontFamily: "inherit", lineHeight: 1 }}>+</button>
        </div>
      </div>

      {/* Ingredients */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase" }}>Ingredients</div>
          <button onClick={() => setShowSearch(true)} style={{ padding: "8px 14px", background: `${T.prot}15`, border: `1px solid ${T.prot}40`, borderRadius: 20, color: T.prot, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Add Ingredient</button>
        </div>
        {ingredients.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0", border: `1px dashed ${T.bd}`, borderRadius: 12, color: T.mu, fontSize: 13 }}>No ingredients yet — tap + Add Ingredient</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ingredients.map((ing, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ing.food_name}</div>
                  <div style={{ fontSize: 10, color: T.mu }}>{ing.amount}{ing.unit} · {ing.calories} kcal · <span style={{ color: T.prot }}>P {ing.protein}g</span></div>
                </div>
                <button onClick={() => setIngredients(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "rgba(245,245,240,.3)", cursor: "pointer", fontSize: 18, padding: "0 4px", lineHeight: 1 }}>🗑</button>
              </div>
            ))}
          </div>
        )}

        {/* Running totals */}
        {ingredients.length > 0 && (
          <div style={{ marginTop: 14, background: "rgba(41,121,255,.07)", border: "1px solid rgba(41,121,255,.2)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: T.prot, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 10 }}>Per Serving ({servingsCount > 1 ? `1 of ${servingsCount}` : "1 serving"})</div>
            <div style={{ display: "flex", gap: 0, marginBottom: 10 }}>
              {[["Cal", perServing.calories, "", "#fff"], ["P", perServing.protein, "g", T.prot], ["C", perServing.carbs, "g", T.carb], ["F", perServing.fat, "g", T.fat]].map(([l, v, u, c]) => (
                <div key={l} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 9, color: T.mu, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: c, lineHeight: 1 }}>{v}{u}</div>
                </div>
              ))}
            </div>
            {[["P", perServing.protein, 50, T.prot], ["C", perServing.carbs, 100, T.carb], ["F", perServing.fat, 40, T.fat]].map(([l, v, mx, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 9, color: T.mu, width: 10 }}>{l}</div>
                <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,.07)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, v / mx * 100)}%`, background: c, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 9, color: T.mu, width: 24, textAlign: "right" }}>{v}g</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 10 }}>Category (optional)</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {RECIPE_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(category === cat ? "" : cat)} style={{ padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${category === cat ? T.carb : T.bd}`, background: category === cat ? `${T.carb}15` : "none", color: category === cat ? T.carb : T.mu, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{cat}</button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !name.trim() || ingredients.length === 0}
        style={{ width: "100%", padding: "16px", background: !name.trim() || ingredients.length === 0 ? T.s2 : T.prot, color: !name.trim() || ingredients.length === 0 ? T.mu : "#fff", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: !name.trim() || ingredients.length === 0 ? "not-allowed" : "pointer", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}
      >{saving ? "Saving…" : "Save Recipe →"}</button>
    </div>
  );
}

function QuickLogSheet({ open, onClose, user, remaining, recentFoods, frequentFoods, mealTemplates, onDeleteTemplate, mealSlots, activeSlotIdx, setActiveSlotIdx, onLog, onLogTemplate, log, userRecipes, onLogRecipe }) {
  const [tab, setTab] = useState("recent");
  const [portionFood, setPortionFood] = useState(null);
  const [qlRecipeLogging, setQlRecipeLogging] = useState(null);
  const [quickCategory, setQuickCategory] = useState(null);
  const [voiceState, setVoiceState] = useState("idle"); // idle | listening | processing | confirm
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceEntries, setVoiceEntries] = useState([]);
  const [saveTemplateMode, setSaveTemplateMode] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const recRef = React.useRef(null);
  const videoRef = React.useRef(null);

  if (!open) return null;

  const totalToday = (log || []).reduce((s, e) => s + (e.calories || 0), 0);
  const calPct = Math.min(100, Math.round(totalToday / Math.max(1, remaining.calories + totalToday) * 100));
  const proteinPct = Math.min(100, Math.round((remaining.protein < 0 ? 1 : 1 - remaining.protein / Math.max(1, remaining.protein + (log || []).reduce((s, e) => s + (e.protein || 0), 0))) * 100));

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice not supported in this browser"); return; }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = e => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(" ");
      setVoiceTranscript(t);
    };
    rec.onend = async () => {
      setVoiceState("processing");
      try {
        const slot = mealSlots[activeSlotIdx] || "Lunch";
        const resp = await ai(
          `Parse this meal description into JSON entries. Reply ONLY with a JSON array, no markdown. Each entry: {"food":"name","calories":N,"protein":N,"carbs":N,"fat":N}. Meal: "${voiceTranscript || rec._lastTranscript}"`,
          300
        );
        const clean = resp.replace(/```json|```/g, "").trim();
        const entries = JSON.parse(clean);
        setVoiceEntries(entries.map(e => ({ ...e, id: Date.now() + Math.random(), slot })));
        setVoiceState("confirm");
      } catch {
        setVoiceState("idle");
        setVoiceTranscript("");
      }
    };
    rec.onerror = () => setVoiceState("idle");
    recRef.current = rec;
    rec.start();
    setVoiceState("listening");
  }

  function stopVoice() { recRef.current?.stop(); }

  async function lookupBarcode(code) {
    if (!code.trim()) return;
    setScanLoading(true);
    setScanResult(null);
    try {
      const r = await searchByBarcode(code.trim());
      setScanResult(r || null);
    } catch { setScanResult(null); }
    setScanLoading(false);
  }

  async function saveAsTemplate() {
    if (!templateName.trim() || !user) return;
    setSavingTemplate(true);
    await saveMealTemplate(user.id, templateName.trim(), log || []);
    setSavingTemplate(false);
    setSaveTemplateMode(false);
    setTemplateName("");
  }

  if (voiceState === "confirm") {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(6,13,26,.92)", backdropFilter: "blur(8px)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ background: "#0A1222", border: "1px solid rgba(255,255,255,.12)", borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", maxWidth: 480, width: "100%" }}>
          <div style={{ width: 32, height: 3, background: "rgba(255,255,255,.15)", borderRadius: 2, margin: "0 auto 20px" }} />
          <div style={{ fontSize: 11, color: T.mu, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 6 }}>Voice Log Preview</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 900, marginBottom: 16 }}>"{voiceTranscript}"</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {voiceEntries.map((e, i) => (
              <div key={i} style={{ background: T.s2, borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{e.food}</div>
                  <div style={{ fontSize: 11, color: T.mu }}><span style={{ color: T.prot }}>P {e.protein}g</span> · <span style={{ color: T.carb }}>C {e.carbs}g</span> · <span style={{ color: T.fat }}>F {e.fat}g</span></div>
                </div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{e.calories} kcal</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setVoiceState("idle"); setVoiceEntries([]); setVoiceTranscript(""); }} style={{ flex: 1, padding: "13px", background: "none", border: `1px solid ${T.bd}`, borderRadius: 12, color: T.mu, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Redo</button>
            <button onClick={() => { voiceEntries.forEach(e => onLog(e, null, mealSlots[activeSlotIdx] || "Lunch", true)); setVoiceState("idle"); setVoiceEntries([]); onClose(); }} style={{ flex: 2, padding: "13px", background: T.prot, border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1 }}>Log All →</button>
          </div>
        </div>
      </div>
    );
  }

  if (portionFood) {
    return <PortionSheet food={portionFood} mealSlots={mealSlots} activeSlotIdx={activeSlotIdx} setActiveSlotIdx={setActiveSlotIdx} onAdd={(food, grams, slot) => { onLog(food, grams, slot); setPortionFood(null); }} onClose={() => setPortionFood(null)} />;
  }

  if (qlRecipeLogging) {
    return <RecipeLogSheet recipe={qlRecipeLogging} mealSlots={mealSlots} activeSlotIdx={activeSlotIdx} setActiveSlotIdx={setActiveSlotIdx} onLog={(recipe, servings, slot) => { onLogRecipe(recipe, servings, slot); setQlRecipeLogging(null); onClose(); }} onClose={() => setQlRecipeLogging(null)} />;
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,13,26,.88)", backdropFilter: "blur(8px)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#0A1222", border: "1px solid rgba(255,255,255,.12)", borderRadius: "20px 20px 0 0", padding: "0 0 48px", maxWidth: 480, width: "100%", maxHeight: "88vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ width: 32, height: 3, background: "rgba(255,255,255,.15)", borderRadius: 2, margin: "0 auto 16px" }} />

          {/* Macro progress bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>Quick Log</div>
              <div style={{ display: "flex", gap: 10, fontSize: 10, color: T.mu }}>
                <span style={{ color: T.prot }}>P {remaining.protein > 0 ? remaining.protein : 0}g left</span>
                <span style={{ color: T.carb }}>C {remaining.carbs > 0 ? remaining.carbs : 0}g</span>
                <span style={{ color: T.fat }}>F {remaining.fat > 0 ? remaining.fat : 0}g</span>
              </div>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,.06)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${calPct}%`, background: `linear-gradient(90deg,${T.prot},${T.carb})`, borderRadius: 3, transition: "width .4s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: T.mu }}>
              <span>{totalToday} kcal eaten</span>
              <span>{remaining.calories > 0 ? remaining.calories : 0} kcal left</span>
            </div>
          </div>

          {/* Voice + Scan buttons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={voiceState === "listening" ? stopVoice : startVoice} style={{ flex: 1, padding: "11px 8px", background: voiceState === "listening" ? "rgba(232,52,28,.15)" : T.s2, border: `1.5px solid ${voiceState === "listening" ? T.prot : T.bd}`, borderRadius: 10, color: voiceState === "listening" ? T.prot : T.mu, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {voiceState === "listening" ? "🔴 Listening..." : voiceState === "processing" ? "⏳ Processing..." : "🎤 Voice Log"}
            </button>
            <button onClick={() => setScanMode(s => !s)} style={{ flex: 1, padding: "11px 8px", background: scanMode ? "rgba(96,165,250,.1)" : T.s2, border: `1.5px solid ${scanMode ? T.carb : T.bd}`, borderRadius: 10, color: scanMode ? T.carb : T.mu, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📷 Scan Barcode</button>
          </div>

          {/* Barcode scanner */}
          {scanMode && (
            <div style={{ background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 12, padding: "14px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>Barcode number</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={scanInput} onChange={e => setScanInput(e.target.value)} onKeyDown={e => e.key === "Enter" && lookupBarcode(scanInput)} placeholder="Enter or scan barcode number" style={{ flex: 1, background: T.s3, border: `1px solid ${T.bd}`, borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
                <button onClick={() => lookupBarcode(scanInput)} disabled={scanLoading || !scanInput.trim()} style={{ padding: "10px 16px", background: T.carb, color: "#000", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{scanLoading ? "..." : "Look Up"}</button>
              </div>
              {scanResult && (
                <div style={{ marginTop: 10, padding: "12px", background: T.s1, borderRadius: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{scanResult.name}</div>
                  <div style={{ fontSize: 11, color: T.mu, marginBottom: 10 }}>{scanResult.brand} · {scanResult.calories} kcal · P {scanResult.protein}g · C {scanResult.carbs}g · F {scanResult.fat}g</div>
                  <button onClick={() => { setPortionFood(scanResult); setScanMode(false); setScanInput(""); setScanResult(null); }} style={{ width: "100%", padding: "10px", background: T.prot, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Set Portion →</button>
                </div>
              )}
              {scanLoading && <div style={{ marginTop: 8, textAlign: "center", fontSize: 12, color: T.mu }}>Looking up product…</div>}
              {!scanResult && !scanLoading && scanInput && <div style={{ marginTop: 6, fontSize: 10, color: T.mu }}>Tip: use camera app to read barcode, paste number above</div>}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 3, gap: 3, marginBottom: 16, overflowX: "auto" }}>
            {[["recent", "Recent"], ["frequent", "Most Used"], ["quick", "Quick Add"], ["recipes", "My Recipes"], ["templates", "Templates"]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", background: tab === k ? `${T.prot}18` : "none", outline: tab === k ? `1.5px solid ${T.prot}` : "none", color: tab === k ? T.prot : T.mu, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ padding: "0 20px" }}>

          {/* Recent tab */}
          {tab === "recent" && (
            <div>
              {recentFoods.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: T.mu, fontSize: 13 }}>Log some foods to see recents here</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {recentFoods.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.food_name}</div>
                        <div style={{ fontSize: 10, color: T.mu }}>
                          {f.usual_portion ? `${f.usual_portion}g · ` : ""}{f.food_data?.calories} kcal · <span style={{ color: T.prot }}>P {f.food_data?.protein}g</span> · <span style={{ color: T.carb }}>C {f.food_data?.carbs}g</span> · <span style={{ color: T.fat }}>F {f.food_data?.fat}g</span>
                        </div>
                      </div>
                      <button onClick={() => setPortionFood({ ...f.food_data, usual_portion: f.usual_portion, usual_unit: f.usual_unit })} style={{ width: 36, height: 36, borderRadius: 10, background: `${T.prot}15`, border: `1.5px solid ${T.prot}30`, color: T.prot, fontSize: 20, cursor: "pointer", fontFamily: "inherit", lineHeight: 1, flexShrink: 0 }}>+</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Frequent tab */}
          {tab === "frequent" && (
            <div>
              {frequentFoods.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: T.mu, fontSize: 13 }}>Log foods regularly to see your favorites here</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {frequentFoods.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.food_name}</div>
                        <div style={{ fontSize: 10, color: T.mu }}>
                          {f.food_data?.calories} kcal · <span style={{ color: T.prot }}>P {f.food_data?.protein}g</span>
                          {f.use_count > 1 && <span style={{ color: "rgba(245,245,240,.3)", marginLeft: 6 }}>× {f.use_count}</span>}
                        </div>
                      </div>
                      <button onClick={() => setPortionFood({ ...f.food_data, usual_portion: f.usual_portion, usual_unit: f.usual_unit })} style={{ width: 36, height: 36, borderRadius: 10, background: `${T.prot}15`, border: `1.5px solid ${T.prot}30`, color: T.prot, fontSize: 20, cursor: "pointer", fontFamily: "inherit", lineHeight: 1, flexShrink: 0 }}>+</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Add tab */}
          {tab === "quick" && (
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {[["protein", "🥩 Protein", T.prot], ["carbs", "🍚 Carbs", T.carb], ["fat", "🥑 Fat", T.fat]].map(([k, l, c]) => (
                  <button key={k} onClick={() => setQuickCategory(quickCategory === k ? null : k)} style={{ flex: 1, padding: "10px 4px", background: quickCategory === k ? `${c}18` : "none", border: `1.5px solid ${quickCategory === k ? c : T.bd}`, borderRadius: 10, cursor: "pointer", color: quickCategory === k ? c : T.mu, fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>{l}</button>
                ))}
              </div>
              {quickCategory && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {(QUICK_FOODS[quickCategory] || []).map((food, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{food.name}</div>
                        <div style={{ fontSize: 10, color: T.mu }}>{food.calories} kcal · P {food.protein}g · C {food.carbs}g · F {food.fat}g</div>
                      </div>
                      <button onClick={() => { onLog(food, null, mealSlots[activeSlotIdx] || "Lunch", true); }} style={{ width: 36, height: 36, borderRadius: 10, background: `${T.prot}15`, border: `1.5px solid ${T.prot}30`, color: T.prot, fontSize: 20, cursor: "pointer", fontFamily: "inherit", lineHeight: 1, flexShrink: 0 }}>+</button>
                    </div>
                  ))}
                </div>
              )}
              {!quickCategory && <div style={{ textAlign: "center", padding: "24px 0", color: T.mu, fontSize: 13 }}>Select a category above</div>}
            </div>
          )}

          {/* My Recipes tab */}
          {tab === "recipes" && (
            <div>
              {(userRecipes || []).length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px 20px", color: T.mu }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🍳</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: "#fff" }}>No recipes yet</div>
                  <div style={{ fontSize: 12, lineHeight: 1.6 }}>Create your first recipe in the Recipes tab</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(userRecipes || []).map(r => (
                    <div key={r.id} style={{ background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 12, padding: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                          <div style={{ fontSize: 10, color: T.mu }}>{r.calories_per_serving} kcal · <span style={{ color: T.prot }}>P {r.protein_per_serving}g</span> · <span style={{ color: T.carb }}>C {r.carbs_per_serving}g</span> · <span style={{ color: T.fat }}>F {r.fat_per_serving}g</span> per serving</div>
                        </div>
                        {r.category && <span style={{ fontSize: 9, background: `${T.carb}18`, color: T.carb, borderRadius: 5, padding: "2px 7px", flexShrink: 0, marginLeft: 8 }}>{r.category}</span>}
                      </div>
                      <button onClick={() => setQlRecipeLogging(r)} style={{ width: "100%", padding: "10px", background: T.prot, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Log →</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Templates tab */}
          {tab === "templates" && (
            <div>
              {(log || []).length >= 2 && !saveTemplateMode && (
                <button onClick={() => setSaveTemplateMode(true)} style={{ width: "100%", padding: "11px", background: "rgba(155,89,255,.1)", border: `1px dashed rgba(155,89,255,.4)`, borderRadius: 10, color: "#9B59FF", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>💾 Save Today's Meal as Template</button>
              )}
              {saveTemplateMode && (
                <div style={{ background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: T.mu, marginBottom: 8 }}>Template name</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. High Protein Breakfast" style={{ flex: 1, background: T.s3, border: `1px solid ${T.bd}`, borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                    <button onClick={saveAsTemplate} disabled={savingTemplate || !templateName.trim()} style={{ padding: "10px 14px", background: T.prot, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{savingTemplate ? "..." : "Save"}</button>
                    <button onClick={() => setSaveTemplateMode(false)} style={{ padding: "10px 12px", background: "none", border: `1px solid ${T.bd}`, borderRadius: 8, color: T.mu, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                  </div>
                </div>
              )}
              {mealTemplates.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: T.mu, fontSize: 13 }}>No templates yet — log 2+ foods and save as a template</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {mealTemplates.map((t) => (
                    <div key={t.id} style={{ background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 12, padding: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
                          <div style={{ fontSize: 10, color: T.mu }}>{t.total_calories} kcal · P {t.total_protein}g · C {t.total_carbs}g · F {t.total_fat}g</div>
                        </div>
                        <button onClick={() => onDeleteTemplate(t.id)} style={{ background: "none", border: "none", color: "rgba(245,245,240,.2)", cursor: "pointer", fontSize: 16, padding: "0 4px", lineHeight: 1 }}>×</button>
                      </div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                        {(t.entries || []).slice(0, 4).map((e, i) => (
                          <span key={i} style={{ fontSize: 10, background: "rgba(255,255,255,.06)", borderRadius: 5, padding: "2px 7px", color: "rgba(245,245,240,.6)" }}>{e.food}</span>
                        ))}
                        {(t.entries || []).length > 4 && <span style={{ fontSize: 10, color: T.mu }}>+{t.entries.length - 4} more</span>}
                      </div>
                      <button onClick={() => { onLogTemplate(t); }} style={{ width: "100%", padding: "10px", background: T.prot, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Log All →</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function SwipeRow({onDelete, children, style={}}) {
  const [offset, setOffset] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const startX = React.useRef(0);
  const THRESHOLD = 72;

  function onPointerDown(e) {
    startX.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e) {
    if (!dragging) return;
    const delta = Math.min(0, e.clientX - startX.current);
    setOffset(Math.max(-(THRESHOLD + 10), delta));
  }
  function onPointerUp() {
    setDragging(false);
    if (offset < -THRESHOLD) { onDelete(); setOffset(0); }
    else setOffset(0);
  }

  return (
    <div style={{position:"relative",overflow:"hidden",...style}}>
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:THRESHOLD,background:"#EF4444",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"0 8px 8px 0",flexShrink:0}}>
        <span style={{color:"#fff",fontSize:11,fontWeight:700,letterSpacing:"0.08em"}}>Delete</span>
      </div>
      <div className="swipe-row"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{transform:`translateX(${offset}px)`,transition:dragging?"none":"transform 0.25s ease",background:T.bg||"#0a0e1a",position:"relative"}}
      >
        {children}
      </div>
    </div>
  );
}

function FoodContextMenu({item, slot, mealSlots, onDelete, onCopySlot, onClose}) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:8000,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"rgba(0,0,0,0.55)"}} onClick={onClose}>
      <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:"20px 20px 0 0",padding:"8px 0 24px",width:"100%",maxWidth:480,animation:"sheet-in 0.22s ease forwards"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,borderRadius:2,background:T.bd,margin:"8px auto 16px"}}/>
        <div style={{padding:"0 20px",marginBottom:8}}>
          <div style={{fontSize:14,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.food||item.name}</div>
          <div style={{fontSize:11,color:T.mu}}>{item.calories} kcal · <span style={{color:T.prot}}>P {item.protein}g</span> · <span style={{color:T.carb}}>C {item.carbs}g</span> · <span style={{color:T.fat}}>F {item.fat}g</span></div>
        </div>
        {mealSlots.filter(s=>s!==slot).map(s=>(
          <button key={s} onClick={()=>onCopySlot(s)} style={{width:"100%",padding:"14px 20px",background:"none",border:"none",color:"#fff",fontSize:14,fontWeight:500,cursor:"pointer",textAlign:"left",fontFamily:"inherit",borderTop:`1px solid ${T.bd}`}}>
            Copy to {s}
          </button>
        ))}
        <button onClick={()=>{onDelete();onClose();}} style={{width:"100%",padding:"14px 20px",background:"none",border:"none",color:"#EF4444",fontSize:14,fontWeight:700,cursor:"pointer",textAlign:"left",fontFamily:"inherit",borderTop:`1px solid ${T.bd}`}}>
          Delete
        </button>
        <button onClick={onClose} style={{width:"100%",padding:"12px 20px",background:"none",border:"none",color:T.mu,fontSize:13,cursor:"pointer",textAlign:"left",fontFamily:"inherit",borderTop:`1px solid ${T.bd}`}}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function WaterTracker({waterLogs, waterTarget, onAddWater, onDeleteWater, bottleSize=16, isMobile}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customOz, setCustomOz] = useState("");
  const [longPressId, setLongPressId] = useState(null);
  const pressTimer = useRef(null);

  const totalOz = waterLogs.reduce((s, l) => s + Number(l.amount_oz), 0);
  const pct = Math.min(1, totalOz / Math.max(1, waterTarget));
  const drops = 8;
  const filledDrops = Math.round(pct * drops);
  const ozLeft = Math.max(0, waterTarget - totalOz);

  function startPress(id) {
    pressTimer.current = setTimeout(() => setLongPressId(id), 500);
  }
  function endPress() { clearTimeout(pressTimer.current); }

  async function handleQuickAdd(oz) {
    await onAddWater(oz);
    const newTotal = totalOz + oz;
    const left = Math.max(0, waterTarget - newTotal);
    showToast(`+${oz} oz added${left > 0 ? ` · ${Math.round(left)} oz remaining` : " · Goal reached! 🎉"}`, "info");
  }

  async function handleCustom() {
    const oz = parseFloat(customOz);
    if (!oz || oz <= 0) return;
    await onAddWater(oz);
    const newTotal = totalOz + oz;
    const left = Math.max(0, waterTarget - newTotal);
    showToast(`+${oz} oz added${left > 0 ? ` · ${Math.round(left)} oz remaining` : " · Goal reached! 🎉"}`, "info");
    setCustomOz("");
    setShowCustom(false);
  }

  const lastFive = [...waterLogs].slice(-5).reverse();

  return (
    <div style={{background:"linear-gradient(135deg,rgba(41,121,255,0.1),rgba(41,121,255,0.04))",border:"1px solid rgba(41,121,255,0.2)",borderRadius:16,padding:"16px 18px",marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(245,245,240,0.65)"}}>Hydration</div>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"rgba(41,121,255,0.9)",fontWeight:700}}>{Math.round(totalOz)} / {waterTarget} oz</div>
      </div>

      {/* 8-drop visual */}
      <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:12}}>
        {Array.from({length:drops}).map((_,i)=>(
          <div key={i} style={{fontSize:22,filter:i<filledDrops?"none":"grayscale(1) opacity(0.2)",transition:"filter 0.3s"}}>💧</div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{height:4,background:"rgba(41,121,255,0.12)",borderRadius:2,overflow:"hidden",marginBottom:14}}>
        <div style={{height:"100%",width:`${pct*100}%`,background:"#2979FF",borderRadius:2,transition:"width 0.4s ease"}}/>
      </div>

      {/* Quick-add buttons */}
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <button onClick={()=>handleQuickAdd(bottleSize)} style={{flex:1,padding:"9px 0",background:"rgba(41,121,255,0.15)",border:"1px solid rgba(41,121,255,0.3)",borderRadius:10,color:"#2979FF",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>+{bottleSize} oz</button>
        <button onClick={()=>handleQuickAdd(8)} style={{flex:1,padding:"9px 0",background:"rgba(41,121,255,0.08)",border:"1px solid rgba(41,121,255,0.18)",borderRadius:10,color:"rgba(41,121,255,0.8)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>+8 oz</button>
        <button onClick={()=>setShowCustom(v=>!v)} style={{flex:1,padding:"9px 0",background:"none",border:"1px dashed rgba(41,121,255,0.25)",borderRadius:10,color:"rgba(41,121,255,0.6)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Custom</button>
      </div>

      {showCustom&&(
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <input type="number" value={customOz} onChange={e=>setCustomOz(e.target.value)} placeholder="oz" min={1} max={128}
            style={{flex:1,background:"rgba(41,121,255,0.08)",border:"1px solid rgba(41,121,255,0.25)",borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none"}}/>
          <button onClick={handleCustom} style={{padding:"8px 18px",background:"#2979FF",border:"none",borderRadius:10,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Add</button>
        </div>
      )}

      {/* Recent logs with long-press to delete */}
      {lastFive.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {lastFive.map(log=>(
            <div key={log.id} onPointerDown={()=>startPress(log.id)} onPointerUp={()=>endPress()} onPointerLeave={()=>endPress()}
              style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",background:"rgba(41,121,255,0.06)",borderRadius:8,position:"relative"}}>
              <div style={{fontSize:11,color:"rgba(245,245,240,0.5)",fontFamily:"'DM Mono',monospace"}}>
                {new Date(log.logged_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
              </div>
              <div style={{fontSize:11,color:"rgba(41,121,255,0.9)",fontWeight:700,fontFamily:"'DM Mono',monospace"}}>+{log.amount_oz} oz</div>
              {longPressId===log.id&&(
                <div style={{position:"absolute",right:0,top:-2,zIndex:10,display:"flex",gap:6}}>
                  <button onClick={()=>{onDeleteWater(log.id);setLongPressId(null);}}
                    style={{padding:"5px 10px",background:"#EF4444",border:"none",borderRadius:8,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
                  <button onClick={()=>setLongPressId(null)}
                    style={{padding:"5px 10px",background:"rgba(255,255,255,0.08)",border:"none",borderRadius:8,color:"rgba(245,245,240,0.5)",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalOz>=waterTarget&&(
        <div style={{textAlign:"center",marginTop:10,fontSize:12,color:"#22c55e",fontWeight:700}}>✓ Daily water goal met! 💪</div>
      )}
      {totalOz>0&&totalOz<waterTarget&&(
        <div style={{textAlign:"center",marginTop:8,fontSize:11,color:"rgba(245,245,240,0.4)"}}>{Math.round(ozLeft)} oz to go</div>
      )}
    </div>
  );
}

function FoodSearchScreen({user,logEntry,mealSlots,activeSlotIdx,setActiveSlotIdx,addMealSlot,setFuelScreen,isMobile}){
  const [query,setQuery]=useState("");
  const [results,setResults]=useState([]);
  const [searching,setSearching]=useState(false);
  const [selectedFood,setSelectedFood]=useState(null);
  const [portionGrams,setPortionGrams]=useState(100);
  const [portionMode,setPortionMode]=useState("smart");
  const [customPortionInput,setCustomPortionInput]=useState("");
  const [toast,setToast]=useState("");
  const [frequentFoods,setFrequentFoods]=useState([]);
  const [recentFoods,setRecentFoods]=useState([]);
  const [quickCategory,setQuickCategory]=useState(null);
  const [showCustomForm,setShowCustomForm]=useState(false);
  const [customFood,setCustomFood]=useState({name:"",brand:"",calories:"",protein:"",carbs:"",fat:"",serving_size:"100",serving_unit:"g"});

  useEffect(()=>{
    if(!user)return;
    getFrequentFoods(user.id).then(d=>setFrequentFoods(d||[]));
    getRecentFoods(user.id).then(d=>setRecentFoods(d||[]));
  },[user]);

  useEffect(()=>{
    if(!query.trim()){setResults([]);return;}
    const t=setTimeout(async()=>{
      setSearching(true);
      try{
        if(/^\d{8,14}$/.test(query.trim())){
          const r=await searchByBarcode(query.trim());
          setResults(r?[r]:[]);
        }else{
          const r=await searchFoods(query.trim());
          setResults(r||[]);
        }
      }catch{setResults([]);}
      setSearching(false);
    },300);
    return()=>clearTimeout(t);
  },[query]);

  function calcMacros(food,grams){
    const f=grams/100;
    return{
      calories:Math.round((food.calories||0)*f),
      protein:Math.round((food.protein||0)*f*10)/10,
      carbs:Math.round((food.carbs||0)*f*10)/10,
      fat:Math.round((food.fat||0)*f*10)/10,
    };
  }

  function selectFood(food){
    const smart=getSmartServings(food.name||"");
    setSelectedFood({...food,smartServings:smart});
    setPortionGrams(smart.length>0?smart[0].grams:100);
    setPortionMode("smart");
    setCustomPortionInput("");
  }

  async function addFood(){
    if(!selectedFood)return;
    const grams=portionMode==="custom"?(parseFloat(customPortionInput)||portionGrams):portionGrams;
    const m=calcMacros(selectedFood,grams);
    const entry={
      id:Date.now(),
      food:selectedFood.name+(selectedFood.brand?` (${selectedFood.brand})`:""),
      ...m,grams,
      slot:mealSlots[activeSlotIdx]||"Lunch",
      source:selectedFood.source||"usda",
    };
    logEntry(entry);
    if(user)saveFoodToHistory(user.id,selectedFood).catch(()=>{});
    setToast(`${selectedFood.name} added!`);
    setTimeout(()=>setToast(""),2500);
    setSelectedFood(null);setQuery("");setResults([]);
    if(user){
      getFrequentFoods(user.id).then(d=>setFrequentFoods(d||[]));
      getRecentFoods(user.id).then(d=>setRecentFoods(d||[]));
    }
  }

  function addQuickFood(food){
    const entry={id:Date.now(),food:food.name,calories:food.calories,protein:food.protein,carbs:food.carbs,fat:food.fat,slot:mealSlots[activeSlotIdx]||"Lunch",source:"quick"};
    logEntry(entry);
    setToast(`${food.name} added!`);
    setTimeout(()=>setToast(""),2500);
  }

  async function saveCustomFoodEntry(){
    if(!customFood.name||!customFood.calories)return;
    const food={id:`custom_${Date.now()}`,name:customFood.name,brand:customFood.brand,calories:parseFloat(customFood.calories)||0,protein:parseFloat(customFood.protein)||0,carbs:parseFloat(customFood.carbs)||0,fat:parseFloat(customFood.fat)||0,servingSize:parseFloat(customFood.serving_size)||100,servingUnit:customFood.serving_unit||"g",source:"custom"};
    if(user)await saveCustomFood(user.id,food).catch(()=>{});
    selectFood(food);
    setShowCustomForm(false);
  }

  if(selectedFood){
    const smart=selectedFood.smartServings||[];
    const grams=portionMode==="custom"?(parseFloat(customPortionInput)||portionGrams):portionGrams;
    const m=calcMacros(selectedFood,grams);
    return(
      <div style={{maxWidth:isMobile?"100%":560}}>
        <button onClick={()=>setSelectedFood(null)} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:13,padding:"0 0 16px",fontFamily:"inherit"}}>← Back to search</button>
        <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:16,padding:"20px",marginBottom:16}}>
          <div style={{fontSize:18,fontWeight:800,marginBottom:2}}>{selectedFood.name}</div>
          {selectedFood.brand&&<div style={{fontSize:11,color:T.mu,marginBottom:14}}>{selectedFood.brand}</div>}
          <div style={{display:"flex",gap:16,marginBottom:18}}>
            {[["Cal",m.calories,"","#fff"],["P",m.protein,"g",T.prot],["C",m.carbs,"g",T.carb],["F",m.fat,"g",T.fat]].map(([l,v,u,c])=>(
              <div key={l}><div style={{fontSize:9,color:T.mu,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{l}</div><div style={{fontSize:20,fontWeight:900,color:c,lineHeight:1}}>{v}{u}</div></div>
            ))}
          </div>
          {smart.length>0&&<>
            <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>Serving size</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:portionMode==="custom"?10:0}}>
              {smart.map((s,i)=>(
                <button key={i} onClick={()=>{setPortionMode("smart");setPortionGrams(s.grams);}} style={{padding:"7px 12px",borderRadius:20,border:`1.5px solid ${portionMode==="smart"&&portionGrams===s.grams?T.carb:T.bd}`,background:portionMode==="smart"&&portionGrams===s.grams?`${T.carb}15`:"none",color:portionMode==="smart"&&portionGrams===s.grams?T.carb:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{s.label}</button>
              ))}
              <button onClick={()=>setPortionMode("custom")} style={{padding:"7px 12px",borderRadius:20,border:`1.5px solid ${portionMode==="custom"?T.carb:T.bd}`,background:portionMode==="custom"?`${T.carb}15`:"none",color:portionMode==="custom"?T.carb:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Custom (g)</button>
            </div>
            {portionMode==="custom"&&<input type="number" value={customPortionInput} onChange={e=>setCustomPortionInput(e.target.value)} placeholder="Enter grams" style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:8,padding:"10px 12px",color:"#fff",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginTop:6,marginBottom:0}}/>}
          </>}
          {smart.length===0&&<>
            <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>Grams</div>
            <input type="number" value={customPortionInput||portionGrams} onChange={e=>setCustomPortionInput(e.target.value)} placeholder="100" style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:8,padding:"10px 12px",color:"#fff",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
          </>}
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>Log to meal</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {mealSlots.map((slot,i)=>(
              <button key={slot} onClick={()=>setActiveSlotIdx(i)} style={{padding:"7px 14px",borderRadius:20,border:`1.5px solid ${activeSlotIdx===i?T.carb:T.bd}`,background:activeSlotIdx===i?`${T.carb}15`:"none",color:activeSlotIdx===i?T.carb:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{slot}</button>
            ))}
          </div>
        </div>
        <PrimaryBtn onClick={addFood} label="Add to Log →"/>
      </div>
    );
  }

  if(showCustomForm){
    return(
      <div style={{maxWidth:isMobile?"100%":500}}>
        <button onClick={()=>setShowCustomForm(false)} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:13,padding:"0 0 16px",fontFamily:"inherit"}}>← Back to search</button>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,marginBottom:16}}>CUSTOM FOOD</div>
        <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:16,padding:"20px",marginBottom:16}}>
          {[["Food name","text","name","e.g. Homemade oats",true],["Brand (optional)","text","brand","e.g. My Kitchen",false],["Calories (kcal)","number","calories","0",true],["Protein (g)","number","protein","0",false],["Carbs (g)","number","carbs","0",false],["Fat (g)","number","fat","0",false],["Serving size","number","serving_size","100",false],["Serving unit","text","serving_unit","g",false]].map(([label,type,key,ph,req])=>(
            <div key={key} style={{marginBottom:12}}>
              <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>{label}{req&&<span style={{color:T.prot}}> *</span>}</div>
              <input type={type} value={customFood[key]} onChange={e=>setCustomFood(f=>({...f,[key]:e.target.value}))} placeholder={ph} style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:8,padding:"10px 12px",color:"#fff",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
            </div>
          ))}
        </div>
        <PrimaryBtn onClick={saveCustomFoodEntry} label="Save & Add →" disabled={!customFood.name||!customFood.calories}/>
      </div>
    );
  }

  return(
    <div style={{maxWidth:isMobile?"100%":560}}>
      {toast&&<div style={{position:"fixed",top:24,left:"50%",transform:"translateX(-50%)",background:T.prot,color:"#fff",padding:"10px 20px",borderRadius:20,fontSize:13,fontWeight:700,zIndex:999,boxShadow:"0 4px 16px rgba(0,0,0,0.4)"}}>{toast}</div>}
      <div style={{position:"relative",marginBottom:16}}>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search food or enter barcode number…" style={{width:"100%",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px 48px 14px 16px",color:"#fff",fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
        {!searching&&query&&<button onClick={()=>{setQuery("");setResults([]);}} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:T.mu,fontSize:18,cursor:"pointer",lineHeight:1,padding:"0 2px"}}>×</button>}
      </div>
      {searching&&<div style={{marginBottom:16}}><FoodSearchSkeleton/></div>}
      {!searching&&results.length>0&&(
        <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,marginBottom:16,overflow:"hidden"}}>
          {results.slice(0,12).map((food,i)=>(
            <button key={food.id||i} onClick={()=>selectFood(food)} style={{width:"100%",padding:"12px 16px",background:"none",border:"none",borderBottom:i<Math.min(results.length,12)-1?`1px solid ${T.bd}`:"none",cursor:"pointer",textAlign:"left",color:"#fff",fontFamily:"inherit"}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{food.name}</div>
              <div style={{fontSize:11,color:T.mu,display:"flex",gap:10,flexWrap:"wrap"}}>
                {food.brand&&<span>{food.brand} ·</span>}
                <span>{food.calories} kcal</span>
                <span style={{color:T.prot}}>P {food.protein}g</span>
                <span style={{color:T.carb}}>C {food.carbs}g</span>
                <span style={{color:T.fat}}>F {food.fat}g</span>
                <span style={{color:"rgba(245,245,240,0.2)",marginLeft:"auto",fontSize:9,textTransform:"uppercase",letterSpacing:1}}>{food.source==="off"?"Open FF":"USDA"}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {query&&!searching&&results.length===0&&(
        <div style={{textAlign:"center",padding:"24px",background:T.s2,border:`1px dashed ${T.bd}`,borderRadius:12,marginBottom:16}}>
          <div style={{fontSize:13,color:T.mu,marginBottom:10}}>No results for "{query}"</div>
          <button onClick={()=>setShowCustomForm(true)} style={{background:"none",border:`1px solid ${T.prot}`,borderRadius:8,padding:"8px 16px",color:T.prot,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Create Custom Food</button>
        </div>
      )}
      {!query&&recentFoods.length>0&&(
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8,fontFamily:"'DM Mono',monospace"}}>Recent</div>
          <div style={{display:"flex",flexDirection:"column",gap:2}}>
            {recentFoods.slice(0,5).map((f,i)=>(
              <button key={i} onClick={()=>selectFood(f.food_data)} style={{padding:"10px 14px",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:10,cursor:"pointer",textAlign:"left",color:"#fff",fontFamily:"inherit"}}>
                <div style={{fontWeight:700,fontSize:13}}>{f.food_name}</div>
                <div style={{fontSize:11,color:T.mu}}>{f.food_data?.calories} kcal · P {f.food_data?.protein}g · C {f.food_data?.carbs}g · F {f.food_data?.fat}g</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {!query&&frequentFoods.length>0&&(
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8,fontFamily:"'DM Mono',monospace"}}>Most Used</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {frequentFoods.slice(0,8).map((f,i)=>(
              <button key={i} onClick={()=>selectFood(f.food_data)} style={{padding:"7px 13px",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:20,cursor:"pointer",color:"#fff",fontSize:12,fontWeight:600,fontFamily:"inherit"}}>{f.food_name}</button>
            ))}
          </div>
        </div>
      )}
      {!query&&(
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8,fontFamily:"'DM Mono',monospace"}}>Quick Add</div>
          <div style={{display:"flex",gap:6,marginBottom:quickCategory?10:0}}>
            {[["protein","🥩 Protein",T.prot],["carbs","🍚 Carbs",T.carb],["fat","🥑 Fat",T.fat]].map(([k,l,c])=>(
              <button key={k} onClick={()=>setQuickCategory(quickCategory===k?null:k)} style={{flex:1,padding:"10px 4px",background:quickCategory===k?`${c}18`:"none",border:`1.5px solid ${quickCategory===k?c:T.bd}`,borderRadius:10,cursor:"pointer",color:quickCategory===k?c:T.mu,fontSize:12,fontWeight:700,fontFamily:"inherit"}}>{l}</button>
            ))}
          </div>
          {quickCategory&&(
            <div style={{display:"flex",flexDirection:"column",gap:2}}>
              {(QUICK_FOODS[quickCategory]||[]).map((food,i)=>(
                <button key={i} onClick={()=>addQuickFood(food)} style={{padding:"11px 14px",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:10,cursor:"pointer",textAlign:"left",color:"#fff",fontFamily:"inherit",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:13}}>{food.name}</div>
                    <div style={{fontSize:11,color:T.mu}}>{food.calories} kcal · P {food.protein}g · C {food.carbs}g · F {food.fat}g</div>
                  </div>
                  <div style={{color:T.prot,fontWeight:700,fontSize:20,lineHeight:1}}>+</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <button onClick={()=>setShowCustomForm(true)} style={{width:"100%",padding:"11px",background:"none",border:`1px dashed ${T.bd}`,borderRadius:10,color:T.mu,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ Create Custom Food</button>
    </div>
  );
}

export function FuelSection({log,macros,consumed,remaining,cfg,todayType,todayFocus,earnedCals,todayActs,fuelScreen,setFuelScreen,foodInput,setFoodInput,logging,logMsg,aiLog,logMode,setLogMode,barcodeInput,setBarcodeInput,barcodeResult,barcodeLoading,scanBarcode,addBarcode,quickFields,setQF,addQuick,removeLog,recs,recsLoading,fetchRecs,recipes,recipesLoading,fetchRecipes,fastProto,setFastProto,fastActive,setFastActive,fastStart,setFastStart,fastCustomH,setFastCustomH,fastHours,fastElapsed,fastPct,fastRemaining,eatOpen,city,setCity,isMobile,user,wPrefs,setWPrefs,schedule,setSchedule,todayKey,periodizationInfo,logEntry,profile,dayNutrition,weekMacros,waterTarget,waterLogs,onAddWater,onDeleteWater}) {

  const FUEL_TABS=[{id:"home",label:"Home"},{id:"log",label:"Log Food"},{id:"recs",label:"Restaurants"},{id:"recipes",label:"Recipes"},{id:"fast",label:"Fasting"},{id:"prep",label:"Meal Prep"}];
  const pad2=n=>String(Math.max(0,Math.floor(n))).padStart(2,"0");

  // ── Weekend Flex Mode ─────────────────────────────────────────────────────
  const flexOn=wPrefs?.weekendFlexMode||false;
  const flexDays=wPrefs?.flexDays||["Sat","Sun"];
  const flexPct=wPrefs?.flexCalorieIncrease||20;
  const [dayModal,setDayModal]=useState(null);
  const DAY_NAMES={Mon:"Monday",Tue:"Tuesday",Wed:"Wednesday",Thu:"Thursday",Fri:"Friday",Sat:"Saturday",Sun:"Sunday"};

  async function saveFlexPrefs(newWPrefs){
    setWPrefs(newWPrefs);
    if(!user)return;
    try{await sb.from("profiles").upsert({id:user.id,wprefs:newWPrefs},{onConflict:"id"});}
    catch(e){console.error("[saveFlexPrefs]",e);}
  }

  function toggleFlexDay(day){
    const cur=wPrefs?.flexDays||["Sat","Sun"];
    const newFlex=cur.includes(day)?cur.filter(d=>d!==day):[...cur,day];
    saveFlexPrefs({...(wPrefs||{}),flexDays:newFlex,weekendFlexMode:newFlex.length>0});
  }

  function setDayTypeInSchedule(day,type){
    const cur=wPrefs?.flexDays||["Sat","Sun"];
    const newFlex=cur.filter(d=>d!==day);
    const newSch={...(schedule||{}),[day]:type};
    if(setSchedule)setSchedule(newSch);
    const newWPrefs={...(wPrefs||{}),flexDays:newFlex,weekendFlexMode:newFlex.length>0};
    saveFlexPrefs(newWPrefs);
    if(user)sb.from("profiles").upsert({id:user.id,schedule:newSch},{onConflict:"id"}).catch(e=>console.error("[setDayType]",e));
  }

  // ── Body Budget ─────────────────────────────────────────────────────────────
  const [bodySuggest,setBodySuggest]=useState("");
  const [bodySuggestLoading,setBodySuggestLoading]=useState(false);
  async function fetchBodySuggest(){
    if(bodySuggestLoading)return;
    setBodySuggestLoading(true);setBodySuggest("");
    try{const r=await ai(`Suggest one simple meal to close this macro gap. Remaining: ${remaining.calories} kcal, ${remaining.protein}g protein, ${remaining.carbs}g carbs, ${remaining.fat}g fat. Reply in one line: "MealName — ~XXXkcal · Xg protein". Be specific and realistic.`,100);setBodySuggest(r.trim());}
    catch(e){const m=getAIErrorMessage(e);setBodySuggest(m||"Unable to fetch suggestion right now.");}
    setBodySuggestLoading(false);
  }
  const useBudgetView=wPrefs?.fuelView==="budget";

  // ── Meal Slots ─────────────────────────────────────────────────────────────
  const [mealSlots,setMealSlots]=useState(()=>MEAL_SLOT_DEFS[profile?.mealFreq]||["Breakfast","Lunch","Dinner","Snack"]);
  const [slotAssignments,setSlotAssignments]=useState({});
  const [editingSlot,setEditingSlot]=useState(null);
  const [activeSlotIdx,setActiveSlotIdx]=useState(0);

  function getEntrySlot(entry){
    if(slotAssignments[entry.id])return slotAssignments[entry.id];
    const h=new Date(entry.id).getHours();
    const n=mealSlots.length;
    const bounds=n===2?[13]:n===4?[10,13,18]:n===5?[9,12,15,19]:[8,10,13,16,19];
    const idx=bounds.findIndex(b=>h<b);
    return mealSlots[idx===-1?n-1:Math.min(idx,n-1)];
  }

  function renameSlot(idx,name){setMealSlots(s=>s.map((v,i)=>i===idx?name:v));setEditingSlot(null);}
  function addMealSlot(){const newName=`Meal ${mealSlots.length+1}`;setMealSlots(s=>[...s,newName]);setActiveSlotIdx(mealSlots.length);}
  function removeSlot(idx){if(mealSlots.length<=1)return;setMealSlots(s=>s.filter((_,i)=>i!==idx));setActiveSlotIdx(0);}

  // ── Day Type Nutrition ────────────────────────────────────────────────────────
  const [showNutritionReasoning,setShowNutritionReasoning]=useState(false);
  const WDAYS_ORDER=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const todayIdx=WDAYS_ORDER.indexOf(todayKey);
  const yesterdayKey=WDAYS_ORDER[(todayIdx+6)%7];
  const todayWeekEntry=weekMacros?.find(d=>d.day===todayKey);
  const yesterdayEntry=weekMacros?.find(d=>d.day===yesterdayKey);
  const calDelta=todayWeekEntry&&yesterdayEntry?todayWeekEntry.calories-yesterdayEntry.calories:null;

  // ── Macro Memory ─────────────────────────────────────────────────────────────
  const [memorySuggestions,setMemorySuggestions]=useState([]);
  const [skippedMemory,setSkippedMemory]=useState(new Set());
  const [memoryLoggedMsg,setMemoryLoggedMsg]=useState("");
  useEffect(()=>{
    if(!user||wPrefs?.macroMemory===false)return;
    const cutoff=new Date();cutoff.setDate(cutoff.getDate()-56);
    sb.from("food_logs").select("date,entries").eq("user_id",user.id).gte("date",cutoff.toISOString().split("T")[0]).order("date",{ascending:false})
      .then(({data})=>{
        if(!data||data.length<4)return;
        const todayDOW=new Date().toLocaleDateString("en-US",{weekday:"short"});
        const todayAlreadyLogged=new Set((log||[]).map(e=>(e.food||"").toLowerCase().trim()));
        const foodCounts={};
        data.forEach(row=>{
          const dow=new Date(row.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"});
          if(dow!==todayDOW)return;
          (row.entries||[]).forEach(entry=>{
            const key=(entry.food||"").toLowerCase().trim();
            if(!key)return;
            if(!foodCounts[key]){foodCounts[key]={count:0,data:entry};}
            foodCounts[key].count++;
            foodCounts[key].data=entry;
          });
        });
        const suggestions=Object.values(foodCounts)
          .filter(({count,data})=>count>=3&&!todayAlreadyLogged.has((data.food||"").toLowerCase().trim()))
          .sort((a,b)=>b.count-a.count)
          .slice(0,3);
        setMemorySuggestions(suggestions);
      });
  },[user,wPrefs?.macroMemory,log?.length]);

  // ── Meal Prep Planner ───────────────────────────────────────────────────────
  const [prepPlan,setPrepPlan]=useState(()=>profile?.meal_prep_plan||null);
  const [prepLoading,setPrepLoading]=useState(false);
  const [groceryChecked,setGroceryChecked]=useState(new Set());
  const [groceryOpen,setGroceryOpen]=useState(false);

  async function generatePrepPlan(){
    if(prepLoading)return;
    setPrepLoading(true);
    try{
      const trainingDays=Object.entries(schedule||{}).filter(([,v])=>v==="training").map(([d])=>d);
      const restDays=WDAYS.filter(d=>!trainingDays.includes(d));
      const trainingCals=macros?.calories||2000;
      const restCals=Math.round(trainingCals*0.85);
      const goal=profile?.goal||"maintain";
      const dietary=(profile?.dietary||[]).filter(d=>d!=="none");
      const dietaryStr=dietary.length>0?`Dietary restrictions (STRICTLY follow): ${dietary.join(", ")}.`:"No dietary restrictions.";
      const slotsForFreq=MEAL_SLOT_DEFS[profile?.mealFreq||"4"]||["Breakfast","Lunch","Dinner","Snack"];
      let rawText='';
      await streamAI(`You are a nutrition coach. Create a practical weekly meal prep plan for Sunday prep day.
Goal: ${goal}. Training days: ${trainingDays.join(",")||"Mon,Wed,Fri"} (${trainingCals} kcal, ${macros?.protein||150}g protein). Rest days: ${restDays.join(",")} (${restCals} kcal, ${Math.round((macros?.protein||150)*0.85)}g protein).
Meals per day: ${slotsForFreq.join(", ")}.
${dietaryStr}
Reply with ONLY a valid JSON object, no markdown:
{"proteins":[{"name":"...","amount":"...","prep":"..."}],"carbs":[{"name":"...","amount":"...","prep":"..."}],"vegetables":[{"name":"...","amount":"...","prep":"..."}],"snacks":[{"name":"...","amount":"...","prep":"..."}],"mealAssignments":{"training":{"${slotsForFreq[0]}":"meal + macros (≈Xkcal Xg protein)"},"rest":{"${slotsForFreq[0]}":"meal + macros (≈Xkcal Xg protein)"}},"grocery":{"Proteins & Dairy":["item"],"Grains & Carbs":["item"],"Produce":["item"],"Pantry":["item"]}}`,1400,"meal_prep",
        ()=>{},
        (text)=>{rawText=text;}
      );
      let plan=null;
      try{const j=rawText.replace(/```json|```/g,"").trim();plan=JSON.parse(j);}
      catch{const m=rawText.match(/\{[\s\S]*\}/);if(m)try{plan=JSON.parse(m[0]);}catch{}}
      if(plan){
        const now=new Date().toISOString();
        setPrepPlan(plan);
        setGroceryChecked(new Set());
        if(user){
          await sb.from("profiles").upsert({id:user.id,meal_prep_plan:plan,meal_prep_generated_at:now,updated_at:now},{onConflict:"id"}).catch(e=>console.error("[savePrepPlan]",e));
          track(EVENTS.AI_MEAL_PREP,{proteins:plan.proteins?.length,grocery_categories:Object.keys(plan.grocery||{}).length},user.id);
        }
      }
    }catch(e){console.error("[generatePrepPlan]",e);}
    setPrepLoading(false);
  }

  useEffect(()=>{
    if(!profile?.meal_prep_generated_at)return;
    const daysSince=(new Date()-new Date(profile.meal_prep_generated_at))/864e5;
    const isMonday=new Date().getDay()===1;
    if(daysSince>=7||isMonday)generatePrepPlan();
  },[]);

  // ── Quick Log Sheet ─────────────────────────────────────────────────────────
  const [showQuickLog,setShowQuickLog]=useState(false);
  const [undoEntry,setUndoEntry]=useState(null);
  const undoTimer=useRef(null);
  const [contextMenu,setContextMenu]=useState(null); // {item, slot}
  const longPressRef=useRef(null);
  const [mealTemplates,setMealTemplates]=useState([]);

  useEffect(()=>{
    if(!user)return;
    getMealTemplates(user.id).then(d=>setMealTemplates(d||[]));
  },[user]);

  function logEntryWithUndo(entry){
    logEntry(entry);
    setUndoEntry(entry);
    clearTimeout(undoTimer.current);
    undoTimer.current=setTimeout(()=>setUndoEntry(null),5000);
    showToast(`${entry.food||"Food"} logged`, "success", {
      action: ()=>{ removeLog(entry.id); setUndoEntry(null); clearTimeout(undoTimer.current); },
      actionLabel: "Undo",
    });
  }

  function handleUndo(){
    if(!undoEntry)return;
    removeLog(undoEntry.id);
    setUndoEntry(null);
    clearTimeout(undoTimer.current);
  }

  function handleQuickLog(food, grams, slot, isQuick){
    const fg = grams != null ? grams / 100 : 1;
    const entry = grams != null ? {
      id: Date.now(),
      food: food.name + (food.brand ? ` (${food.brand})` : ""),
      calories: Math.round((food.calories||0)*fg),
      protein: Math.round((food.protein||0)*fg*10)/10,
      carbs: Math.round((food.carbs||0)*fg*10)/10,
      fat: Math.round((food.fat||0)*fg*10)/10,
      grams,
      slot: slot || mealSlots[activeSlotIdx] || "Lunch",
      source: food.source || "usda",
    } : {
      id: Date.now(),
      food: food.name,
      calories: food.calories||0,
      protein: food.protein||0,
      carbs: food.carbs||0,
      fat: food.fat||0,
      slot: slot || mealSlots[activeSlotIdx] || "Lunch",
      source: "quick",
    };
    logEntryWithUndo(entry);
    if(user && food.id && grams != null) {
      saveFoodToHistory(user.id, food).catch(()=>{});
      updateUsualPortion(user.id, food.id, grams, "g").catch(()=>{});
    }
    if(!isQuick) setShowQuickLog(false);
  }

  function handleLogTemplate(template){
    (template.entries||[]).forEach((e,i)=>{
      setTimeout(()=>logEntryWithUndo({...e,id:Date.now()+i,slot:mealSlots[activeSlotIdx]||"Lunch"}),i*10);
    });
    incrementTemplateUse(template.id).catch(()=>{});
    setShowQuickLog(false);
  }

  function handleDeleteTemplate(id){
    setMealTemplates(ts=>ts.filter(t=>t.id!==id));
    if(user)deleteMealTemplate(user.id,id).catch(()=>{});
  }

  // ── User Recipes ─────────────────────────────────────────────────────────────
  const [userRecipes,setUserRecipes]=useState([]);
  const [showRecipeBuilder,setShowRecipeBuilder]=useState(false);
  const [recipeEditing,setRecipeEditing]=useState(null);
  const [recipeLogging,setRecipeLogging]=useState(null);

  useEffect(()=>{
    if(!user)return;
    getUserRecipes(user.id).then(d=>setUserRecipes(d||[]));
  },[user]);

  async function handleSaveRecipe(recipeData){
    if(!user)return;
    if(recipeEditing?.id){
      const updated=await updateUserRecipe(user.id,recipeEditing.id,recipeData);
      if(updated)setUserRecipes(rs=>rs.map(r=>r.id===updated.id?updated:r));
    }else{
      const saved=await saveUserRecipe(user.id,recipeData);
      if(saved)setUserRecipes(rs=>[saved,...rs]);
    }
    setShowRecipeBuilder(false);
    setRecipeEditing(null);
  }

  async function handleDeleteRecipe(id){
    if(!user)return;
    setUserRecipes(rs=>rs.filter(r=>r.id!==id));
    await deleteUserRecipe(user.id,id).catch(()=>{});
  }

  function handleLogRecipe(recipe,servings,slot){
    const scale=servings/(recipe.servings_count||1);
    (recipe.ingredients||[]).forEach((ing,i)=>{
      const entry={
        id:Date.now()+i,
        food:`${recipe.name} — ${ing.food_name}`,
        calories:Math.round((ing.calories||0)*scale),
        protein:Math.round((ing.protein||0)*scale*10)/10,
        carbs:Math.round((ing.carbs||0)*scale*10)/10,
        fat:Math.round((ing.fat||0)*scale*10)/10,
        slot,
        source:"recipe",
      };
      logEntryWithUndo(entry);
    });
    incrementRecipeUse(recipe.id).catch(()=>{});
    setRecipeLogging(null);
  }

  // smart suggestion: same slot has 3+ foods logged today → offer to save as recipe
  const [recipeSuggestSlot,setRecipeSuggestSlot]=useState(null);
  useEffect(()=>{
    if(!log||log.length<3)return;
    const slotCounts={};
    log.forEach(e=>{const s=e.slot||"Lunch";slotCounts[s]=(slotCounts[s]||0)+1;});
    const bigSlot=Object.entries(slotCounts).find(([,c])=>c>=3);
    if(bigSlot&&bigSlot[0]!==recipeSuggestSlot){
      const slotItems=log.filter(e=>(e.slot||"Lunch")===bigSlot[0]);
      const alreadySaved=userRecipes.some(r=>r.name.toLowerCase().includes(bigSlot[0].toLowerCase()));
      if(!alreadySaved)setRecipeSuggestSlot(bigSlot[0]);
    }
  },[log]);

  // quick log food state for FuelSection-level frequent/recent refresh
  const [qlRecentFoods,setQlRecentFoods]=useState([]);
  const [qlFrequentFoods,setQlFrequentFoods]=useState([]);
  useEffect(()=>{
    if(!user||!showQuickLog)return;
    getRecentFoods(user.id).then(d=>setQlRecentFoods(d||[]));
    getFrequentFoods(user.id).then(d=>setQlFrequentFoods(d||[]));
  },[user,showQuickLog]);

  return (
    <div style={{paddingBottom:isMobile?20:0}}>
      {/* Undo Toast */}
      {undoEntry&&(
        <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:"#1a2236",border:"1px solid rgba(255,255,255,.15)",borderRadius:14,padding:"12px 16px",zIndex:400,display:"flex",alignItems:"center",gap:14,boxShadow:"0 8px 32px rgba(0,0,0,.5)",minWidth:260}}>
          <div style={{flex:1,fontSize:13,fontWeight:600,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{undoEntry.food} added</div>
          <button onClick={handleUndo} style={{padding:"6px 14px",background:"rgba(232,52,28,.15)",border:"1px solid rgba(232,52,28,.4)",borderRadius:8,color:T.prot,fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Undo</button>
        </div>
      )}
      {/* Food Context Menu */}
      {contextMenu&&(
        <FoodContextMenu
          item={contextMenu.item}
          slot={contextMenu.slot}
          mealSlots={mealSlots}
          onDelete={()=>{removeLog(contextMenu.item.id);showToast(`${contextMenu.item.food||"Item"} removed`,"info");}}
          onCopySlot={(targetSlot)=>{logEntry({...contextMenu.item,id:Date.now(),slot:targetSlot});showToast(`Copied to ${targetSlot}`,"success");}}
          onClose={()=>setContextMenu(null)}
        />
      )}
      {/* Recipe Builder */}
      {showRecipeBuilder&&(
        <RecipeBuilderScreen
          user={user}
          recipe={recipeEditing}
          onSave={handleSaveRecipe}
          onBack={()=>{setShowRecipeBuilder(false);setRecipeEditing(null);}}
        />
      )}
      {/* Recipe Log Sheet */}
      {recipeLogging&&(
        <RecipeLogSheet
          recipe={recipeLogging}
          mealSlots={mealSlots}
          activeSlotIdx={activeSlotIdx}
          setActiveSlotIdx={setActiveSlotIdx}
          onLog={handleLogRecipe}
          onClose={()=>setRecipeLogging(null)}
        />
      )}
      {/* Quick Log Sheet */}
      {showQuickLog&&(
        <QuickLogSheet
          open={showQuickLog}
          onClose={()=>setShowQuickLog(false)}
          user={user}
          remaining={remaining}
          recentFoods={qlRecentFoods}
          frequentFoods={qlFrequentFoods}
          mealTemplates={mealTemplates}
          onDeleteTemplate={handleDeleteTemplate}
          mealSlots={mealSlots}
          activeSlotIdx={activeSlotIdx}
          setActiveSlotIdx={setActiveSlotIdx}
          onLog={handleQuickLog}
          onLogTemplate={handleLogTemplate}
          log={log}
          userRecipes={userRecipes}
          onLogRecipe={handleLogRecipe}
        />
      )}
      {/* Sub-nav */}
      <div style={{display:"flex",gap:4,padding:isMobile?"12px 18px 0":"0 0 20px",overflowX:"auto",flexShrink:0}}>
        {FUEL_TABS.map(tab=>(
          <button key={tab.id} onClick={()=>setFuelScreen(tab.id)}
            style={{padding:"8px 16px",borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",background:fuelScreen===tab.id?T.prot:"none",
              color:fuelScreen===tab.id?"#fff":T.mu,fontSize:13,fontWeight:600,whiteSpace:"nowrap",transition:"all 0.15s",flexShrink:0}}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{padding:isMobile?"12px 18px":"0"}}>

        {/* ── HOME ── */}
        {fuelScreen==="home"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {/* MAIN CARD — ring + macros */}
            {/* BODY BUDGET or MACRO RING */}
            {useBudgetView?(
              <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"18px 16px":"24px 28px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div>
                    <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:2}}>TODAY'S BODY BUDGET</div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:900,lineHeight:1}}>🏦 {macros.calories.toLocaleString()} kcal</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:10,color:T.mu,letterSpacing:2,textTransform:"uppercase",marginBottom:2}}>Starting</div>
                    <div style={{fontSize:11,color:"rgba(245,245,240,.6)"}}>balance</div>
                  </div>
                </div>
                {/* Ledger */}
                <div style={{display:"flex",flexDirection:"column",gap:1,marginBottom:14}}>
                  {todayActs.filter(a=>a.calories>0).map((a,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:"rgba(0,201,167,0.07)",borderRadius:8,border:"1px solid rgba(0,201,167,0.15)"}}>
                      <span style={{fontSize:13,color:"rgba(245,245,240,.8)"}}>{a.icon||"🏃"} {a.title||a.type} earned</span>
                      <span style={{fontSize:14,fontWeight:700,color:"#00C9A7"}}>+{a.calories} kcal</span>
                    </div>
                  ))}
                  {log.length===0&&<div style={{padding:"12px",border:`1px dashed ${T.bd}`,borderRadius:8,textAlign:"center",color:T.mu,fontSize:12}}>No meals logged yet</div>}
                  {log.map((e,i)=>(
                    <div key={e.id||i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:T.s2,borderRadius:8}}>
                      <span style={{fontSize:13,color:"rgba(245,245,240,.8)",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.food}</span>
                      <span style={{fontSize:14,fontWeight:700,color:"#fff",flexShrink:0,marginLeft:8}}>−{e.calories} kcal</span>
                    </div>
                  ))}
                </div>
                {/* Divider + remaining */}
                <div style={{height:1,background:`linear-gradient(90deg,${T.prot},${T.fat})`,borderRadius:1,marginBottom:14,opacity:.4}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:14}}>
                  <div>
                    <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:2}}>Remaining</div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:isMobile?40:48,fontWeight:900,color:remaining.calories<0?"#FF4D6D":T.prot,lineHeight:1}}>{remaining.calories.toLocaleString()}</div>
                    <div style={{fontSize:11,color:T.mu,marginTop:2}}>kcal · {remaining.protein}g protein still needed</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    {[["P",T.prot,remaining.protein,"g"],[" C",T.carb,remaining.carbs,"g"],["F",T.fat,remaining.fat,"g"]].map(([l,c,v,u])=>(
                      <div key={l} style={{fontSize:12,color:c,fontWeight:700}}>{l}: {v}{u}</div>
                    ))}
                  </div>
                </div>
                {/* AI Suggestion */}
                {remaining.calories>200&&(
                  <div style={{background:T.s2,borderRadius:12,padding:"12px 14px"}}>
                    <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Suggested to close the gap</div>
                    {bodySuggest
                      ?<div style={{fontSize:13,color:"#fff",lineHeight:1.6}}>{bodySuggest}</div>
                      :<button onClick={fetchBodySuggest} disabled={bodySuggestLoading} style={{fontSize:12,color:T.prot,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600,padding:0}}>{bodySuggestLoading?"Getting suggestion...":"Get AI meal suggestion →"}</button>
                    }
                  </div>
                )}
              </div>
            ):(
              <div style={{background:T.s1,border:`1px solid ${macros.isFlexDay?"rgba(245,158,11,.35)":T.bd}`,borderRadius:20,padding:isMobile?"18px 16px":"24px 28px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:`radial-gradient(circle,${macros.isFlexDay?"#F59E0B":cfg.color}10,transparent 70%)`,pointerEvents:"none"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                  <div>
                    <div style={{fontSize:10,color:macros.isFlexDay?"#F59E0B":(dayNutrition?.color||T.mu),fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>{macros.isFlexDay?"Flex Day":(dayNutrition?.label||todayType+" day")}</div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,lineHeight:1}}>Fuel {macros.isFlexDay?"🍕":cfg.emoji}</div>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
                    {earnedCals>0&&<div style={{background:`${cfg.color}15`,border:`1px solid ${cfg.color}35`,borderRadius:20,padding:"6px 14px",fontSize:11,color:cfg.color,fontWeight:700}}>+{earnedCals} earned 🔥</div>}
                    {macros.isFlexDay&&<div style={{background:"rgba(245,158,11,.15)",border:"1px solid rgba(245,158,11,.35)",borderRadius:20,padding:"6px 14px",fontSize:11,color:"#F59E0B",fontWeight:700}}>🍕 Flex Day</div>}
                    <div style={{background:`${cfg.color}12`,border:`1px solid ${cfg.color}30`,borderRadius:20,padding:"6px 14px",fontSize:11,color:cfg.color,fontWeight:700}}>{cfg.emoji} {todayFocus}</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:isMobile?16:32}}>
                  <div style={{position:"relative",flexShrink:0}}>
                    <MacroRing protein={consumed.protein} carbs={consumed.carbs} fat={consumed.fat} pTarget={macros.protein} cTarget={macros.carbs} fTarget={macros.fat} size={isMobile?150:180} sw={13}/>
                    <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",pointerEvents:"none"}}>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:isMobile?34:40,lineHeight:1,color:remaining.calories<0?"#FF4D6D":"#fff"}}>{remaining.calories}</div>
                      <div style={{color:T.mu,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginTop:2}}>kcal left</div>
                      <div style={{color:T.mu,fontSize:9,marginTop:3}}>{macros.calories} budget</div>
                    </div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                      {[["Budget",macros.calories,"#fff"],["Eaten",consumed.calories,cfg.color]].map(([l,v,c])=>(
                        <div key={l} style={{background:T.s2,borderRadius:12,padding:"10px 14px"}}>
                          <div style={{fontSize:9,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>{l}</div>
                          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:900,color:c,lineHeight:1}}>{v}</div>
                          <div style={{fontSize:9,color:T.mu,marginTop:2}}>kcal</div>
                        </div>
                      ))}
                    </div>
                    <MacroBar label="Protein" consumed={consumed.protein} target={macros.protein} color={T.prot}/>
                    <MacroBar label="Carbs"   consumed={consumed.carbs}   target={macros.carbs}   color={T.carb}/>
                    <MacroBar label="Fat"     consumed={consumed.fat}     target={macros.fat}     color={T.fat}/>
                    {macros.isFlexDay&&<div style={{marginTop:10,background:"rgba(245,158,11,.07)",border:"1px solid rgba(245,158,11,.2)",borderRadius:8,padding:"8px 10px",fontSize:11,color:"rgba(245,158,11,.9)",lineHeight:1.6}}>🍕 Hit your protein ({macros.protein}g) and enjoy the rest today. Your weekday deficit has you covered.</div>}
                    {!macros.isFlexDay&&(macros.flexDeficit||0)>0&&flexOn&&<div style={{marginTop:10,background:"rgba(255,255,255,.04)",borderRadius:8,padding:"8px 10px",fontSize:11,color:"rgba(245,245,240,.4)",lineHeight:1.6}}>−{macros.flexDeficit} kcal today covers your flex days 🍕</div>}
                  </div>
                </div>
              </div>
            )}

            {/* WHY THESE MACROS TODAY */}
            {dayNutrition&&!macros.isFlexDay&&(
              <div style={{background:T.s1,border:`1px solid ${dayNutrition.color||T.bd}30`,borderRadius:16,overflow:"hidden"}}>
                {/* Collapsed header — always visible */}
                <button onClick={()=>setShowNutritionReasoning(r=>!r)} style={{width:"100%",padding:"14px 18px",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                      <div style={{fontSize:11,fontWeight:700,color:dayNutrition.color||T.prot,letterSpacing:".1em",textTransform:"uppercase"}}>{dayNutrition.label}</div>
                      {calDelta!=null&&Math.abs(calDelta)>30&&(
                        <div style={{fontSize:10,fontWeight:700,color:calDelta>0?"#22c55e":"#F59E0B",background:calDelta>0?"rgba(34,197,94,.1)":"rgba(245,158,11,.1)",borderRadius:5,padding:"2px 7px"}}>
                          {calDelta>0?"↑":"↓"} {Math.abs(calDelta)} vs yesterday
                        </div>
                      )}
                    </div>
                    <div style={{fontSize:13,color:"rgba(245,245,240,.7)",lineHeight:1.4}}>{dayNutrition.keyInsight}</div>
                  </div>
                  <div style={{color:T.mu,flexShrink:0,fontSize:11,fontWeight:700}}>
                    {showNutritionReasoning?"▲":"Why? →"}
                  </div>
                </button>

                {/* Expanded details */}
                {showNutritionReasoning&&(
                  <div style={{padding:"0 18px 18px",borderTop:`1px solid rgba(255,255,255,.05)`}}>
                    {/* Reasoning */}
                    <div style={{padding:"14px 0",borderBottom:`1px solid rgba(255,255,255,.05)`}}>
                      <div style={{fontSize:9,color:T.mu,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",marginBottom:6}}>Why these macros today?</div>
                      <div style={{fontSize:13,color:"rgba(245,245,240,.75)",lineHeight:1.65}}>{dayNutrition.reasoning}</div>
                    </div>

                    {/* Pre/post/during fuel */}
                    {(dayNutrition.preFuel||dayNutrition.postFuel||dayNutrition.duringFuel)&&(
                      <div style={{padding:"14px 0",borderBottom:`1px solid rgba(255,255,255,.05)`,display:"flex",flexDirection:"column",gap:10}}>
                        {dayNutrition.preFuel&&(
                          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                            <span style={{fontSize:14,flexShrink:0,marginTop:1}}>⏰</span>
                            <div><div style={{fontSize:9,color:T.mu,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:3}}>Pre-Workout</div><div style={{fontSize:12,color:"rgba(245,245,240,.7)",lineHeight:1.5}}>{dayNutrition.preFuel}</div></div>
                          </div>
                        )}
                        {dayNutrition.duringFuel&&(
                          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                            <span style={{fontSize:14,flexShrink:0,marginTop:1}}>🏃</span>
                            <div><div style={{fontSize:9,color:T.mu,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:3}}>During</div><div style={{fontSize:12,color:"rgba(245,245,240,.7)",lineHeight:1.5}}>{dayNutrition.duringFuel}</div></div>
                          </div>
                        )}
                        {dayNutrition.postFuel&&(
                          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                            <span style={{fontSize:14,flexShrink:0,marginTop:1}}>✅</span>
                            <div><div style={{fontSize:9,color:T.mu,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:3}}>Post-Workout</div><div style={{fontSize:12,color:"rgba(245,245,240,.7)",lineHeight:1.5}}>{dayNutrition.postFuel}</div></div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Meal timing */}
                    {dayNutrition.timingSlots?.length>0&&(
                      <div style={{paddingTop:14}}>
                        <div style={{fontSize:9,color:T.mu,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",marginBottom:10}}>Meal Timing</div>
                        <div style={{display:"flex",flexDirection:"column",gap:0}}>
                          {dayNutrition.timingSlots.map((slot,i)=>(
                            <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"8px 0",borderBottom:i<dayNutrition.timingSlots.length-1?"1px solid rgba(255,255,255,.04)":"none"}}>
                              <div style={{width:60,flexShrink:0,fontFamily:"'DM Mono',monospace",fontSize:9,color:dayNutrition.color||T.prot,fontWeight:700,paddingTop:2}}>{slot.t}</div>
                              <div style={{fontSize:12,color:"rgba(245,245,240,.7)",lineHeight:1.5}}>{slot.m}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* NUTRITION PERIODIZATION */}
            {periodizationInfo&&(
              <div style={{background:"rgba(41,121,255,0.08)",border:"1px solid rgba(41,121,255,0.25)",borderRadius:16,padding:"14px 18px",display:"flex",alignItems:"flex-start",gap:14}}>
                <div style={{flexShrink:0,fontSize:22,marginTop:2}}>📅</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <div style={{fontSize:10,color:"#2979FF",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>WEEK {periodizationInfo.cycleWeek} — {periodizationInfo.phase.toUpperCase()}</div>
                    <div style={{fontSize:10,color:"rgba(245,245,240,.4)",fontFamily:"'DM Mono',monospace"}}>WEEKS {periodizationInfo.wks}</div>
                  </div>
                  <div style={{fontSize:13,color:"rgba(245,245,240,.8)",lineHeight:1.5}}>{periodizationInfo.note}</div>
                  <div style={{fontSize:11,color:"rgba(245,245,240,.4)",marginTop:4}}>Your nutrition cycles with your training.</div>
                </div>
              </div>
            )}

            {/* CYCLE NUTRITION INSIGHT (Part 6) */}
            {profile?.cycleTracking&&(()=>{
              const cp=getCyclePhase(wPrefs?.lastPeriodDate||profile?.lastPeriodDate);
              const cn=getCycleNutrition(cp);
              if(!cp||!cn)return null;
              return(
                <div style={{background:`${cn.color}10`,border:`1.5px solid ${cn.color}30`,borderRadius:16,padding:"14px 18px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{fontSize:20}}>{cp.label.split(" ")[0]}</div>
                    <div>
                      <div style={{fontSize:10,color:cn.color,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase"}}>{cp.label} · Day {cp.day}</div>
                      <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{cn.focus}</div>
                    </div>
                  </div>
                  <div style={{fontSize:12,color:T.mu,lineHeight:1.65,marginBottom:10}}>{cn.note}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {cn.foods.map(f=><span key={f} style={{fontSize:10,fontWeight:700,background:`${cn.color}15`,color:cn.color,borderRadius:6,padding:"3px 8px"}}>{f}</span>)}
                  </div>
                  {cp.cue&&<div style={{marginTop:10,fontSize:11,color:T.mu,fontStyle:"italic"}}>{cp.cue}</div>}
                </div>
              );
            })()}

            {/* PCOS NUTRITION NOTE (Part 7) */}
            {(profile?.cycleCondition||[]).includes("pcos")&&(
              <div style={{background:"rgba(139,92,246,.08)",border:"1.5px solid rgba(139,92,246,.25)",borderRadius:14,padding:"12px 16px",display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{fontSize:18,flexShrink:0}}>💜</div>
                <div>
                  <div style={{fontSize:10,color:"#8B5CF6",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:4}}>PCOS NUTRITION</div>
                  <div style={{fontSize:12,color:T.mu,lineHeight:1.65,marginBottom:8}}>{PCOS_NOTE}</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {PCOS_FOODS.map(f=><span key={f} style={{fontSize:10,fontWeight:700,background:"rgba(139,92,246,.15)",color:"#8B5CF6",borderRadius:5,padding:"2px 7px"}}>{f}</span>)}
                  </div>
                </div>
              </div>
            )}

            {/* PERIMENOPAUSE / MENOPAUSE NUTRITION (Part 8) */}
            {(profile?.lifeStage==="perimenopause"||profile?.lifeStage==="menopause")&&(()=>{
              const mn=profile.lifeStage==="menopause"?MENO_NUTRITION:PERI_NUTRITION;
              return(
                <div style={{background:"rgba(34,197,94,.07)",border:"1.5px solid rgba(34,197,94,.25)",borderRadius:14,padding:"14px 18px"}}>
                  <div style={{fontSize:10,color:"#22C55E",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:6}}>
                    {profile.lifeStage==="menopause"?"🦋 MENOPAUSE NUTRITION":"🌊 PERIMENOPAUSE NUTRITION"}
                  </div>
                  <div style={{fontSize:12,color:T.mu,lineHeight:1.65,marginBottom:10}}>{mn.note}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <div style={{fontSize:9,color:"#22C55E",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:5}}>Calcium sources</div>
                      {mn.calcium.map(f=><div key={f} style={{fontSize:11,color:T.mu,marginBottom:2}}>• {f}</div>)}
                    </div>
                    <div>
                      <div style={{fontSize:9,color:"#22C55E",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:5}}>Omega-3 sources</div>
                      {mn.omega3.map(f=><div key={f} style={{fontSize:11,color:T.mu,marginBottom:2}}>• {f}</div>)}
                    </div>
                  </div>
                  <div style={{background:"rgba(41,121,255,.07)",border:"1px solid rgba(41,121,255,.2)",borderRadius:9,padding:"10px 12px",marginTop:12,display:"flex",gap:8,alignItems:"flex-start"}}>
                    <span style={{fontSize:12,flexShrink:0}}>💙</span>
                    <div><div style={{fontSize:11,color:"rgba(41,121,255,.9)",lineHeight:1.6}}>A gynecologist or endocrinologist can help optimize your hormone and nutrition strategy during this transition.</div><a href="https://coach-macro.com/support" style={{fontSize:10,color:"#2979FF",textDecoration:"none",letterSpacing:".06em",display:"inline-block",marginTop:3}}>Talk to a professional →</a></div>
                  </div>
                </div>
              );
            })()}

            {/* MACRO MEMORY */}
            {wPrefs?.macroMemory!==false&&memorySuggestions.filter(s=>!skippedMemory.has(s.data.food)).length>0&&(
              <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:900,letterSpacing:.5}}>MACRO MEMORY</div>
                    <div style={{fontSize:11,color:T.mu,marginTop:2}}>Based on your {new Date().toLocaleDateString("en-US",{weekday:"long"})} patterns</div>
                  </div>
                  {memoryLoggedMsg&&<div style={{fontSize:11,color:T.carb,fontWeight:700}}>{memoryLoggedMsg}</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {memorySuggestions.filter(s=>!skippedMemory.has(s.data.food)).map(({count,data})=>(
                    <div key={data.food} style={{background:T.s2,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{data.food}</div>
                        <div style={{fontSize:11,color:T.mu,marginTop:2}}>{data.calories} kcal · {data.protein}g protein</div>
                      </div>
                      <div style={{display:"flex",gap:6,flexShrink:0}}>
                        <button onClick={()=>{if(logEntry)logEntry(data);setMemoryLoggedMsg(`✓ Logged. ${remaining.calories-data.calories} kcal remaining.`);setTimeout(()=>setMemoryLoggedMsg(""),3000);}} style={{padding:"7px 12px",background:T.prot,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Log</button>
                        <button onClick={()=>setSkippedMemory(s=>new Set([...s,data.food]))} style={{padding:"7px 10px",background:"none",border:`1px solid ${T.bd}`,color:T.mu,borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Skip</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WEEKEND FLEX MODE */}
            <div style={{background:T.s1,border:`1px solid ${macros.isFlexDay?"rgba(245,158,11,.3)":T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:flexOn?14:0}}>
                <div>
                  <div style={{fontSize:13,fontWeight:800,letterSpacing:"0.08em",color:flexOn?"#F59E0B":"rgba(245,245,240,0.65)",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:flexOn?3:0}}>Weekend Flex 🍕</div>
                  {flexOn&&<div style={{fontSize:11,color:"rgba(245,245,240,.4)"}}>Weekday deficit covers weekend. Protein stays fixed.</div>}
                </div>
                <div onClick={()=>saveFlexPrefs({...(wPrefs||{}),weekendFlexMode:!flexOn,flexDays:!flexOn?["Sat","Sun"]:flexDays,flexCalorieIncrease:flexPct})}
                  style={{width:44,height:24,borderRadius:12,background:flexOn?"#F59E0B":"rgba(245,245,240,0.15)",cursor:"pointer",display:"flex",alignItems:"center",padding:"0 3px",justifyContent:flexOn?"flex-end":"flex-start",transition:"background 0.2s",boxSizing:"border-box",flexShrink:0,marginLeft:16}}>
                  <div style={{width:18,height:18,borderRadius:9,background:"#fff"}}/>
                </div>
              </div>
              {flexOn&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
                  {WDAYS.map(day=>{
                    const isToday=day===todayKey;
                    const isFlex=flexDays.includes(day);
                    const schedType=schedule?.[day]||"rest";
                    const dayIcon=isFlex?"🍕":schedType==="training"?"🏋️":(schedType==="cardio"||schedType==="run"||schedType==="hyrox")?"🏃":"😴";
                    return(
                      <button key={day} onClick={()=>setDayModal(day)}
                        style={{background:isToday?"rgba(41,121,255,.12)":isFlex?"rgba(245,158,11,.08)":"rgba(255,255,255,.03)",border:`1.5px solid ${isToday?"rgba(41,121,255,.5)":isFlex?"rgba(245,158,11,.4)":"rgba(255,255,255,.08)"}`,borderRadius:10,padding:"8px 4px",textAlign:"center",cursor:"pointer",fontFamily:"inherit"}}>
                        <div style={{fontSize:9,fontWeight:700,color:isToday?"#2979FF":isFlex?"#F59E0B":"rgba(245,245,240,.4)",marginBottom:3,letterSpacing:1}}>{day}</div>
                        <div style={{fontSize:14}}>{dayIcon}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PER-DAY MODAL */}
            {dayModal&&(
              <div style={{position:"fixed",inset:0,background:"rgba(6,13,26,.88)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setDayModal(null)}>
                <div style={{background:"#0A1222",border:"1px solid rgba(255,255,255,.12)",borderRadius:"18px 18px 0 0",padding:"24px 20px 40px",maxWidth:480,width:"100%"}} onClick={e=>e.stopPropagation()}>
                  <div style={{width:32,height:3,background:"rgba(255,255,255,.15)",borderRadius:2,margin:"0 auto 20px"}}/>
                  <div style={{fontSize:10,color:"rgba(245,245,240,.4)",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:6}}>DAY SETTINGS</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900,marginBottom:20}}>{DAY_NAMES[dayModal]||dayModal}</div>
                  <div style={{display:"flex",gap:8,marginBottom:24}}>
                    {[["🏋️","Training","training"],["😴","Rest","rest"],["🍕","Flex","flex"]].map(([emoji,label,type])=>{
                      const isFlex=type==="flex";
                      const isSelected=isFlex?flexDays.includes(dayModal):(!flexDays.includes(dayModal)&&(schedule?.[dayModal]||"rest")===type);
                      return(
                        <button key={type} onClick={()=>{if(type==="flex")toggleFlexDay(dayModal);else setDayTypeInSchedule(dayModal,type);setDayModal(null);}}
                          style={{flex:1,padding:"14px 8px",background:isSelected?(isFlex?"rgba(245,158,11,.15)":"rgba(41,121,255,.12)"):"rgba(255,255,255,.04)",border:`1.5px solid ${isSelected?(isFlex?"rgba(245,158,11,.5)":"rgba(41,121,255,.5)"):"rgba(255,255,255,.08)"}`,borderRadius:10,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
                          <div style={{fontSize:22,marginBottom:4}}>{emoji}</div>
                          <div style={{fontSize:12,fontWeight:700,color:isSelected?(isFlex?"#F59E0B":"#2979FF"):"rgba(245,245,240,.5)"}}>{label}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{fontSize:12,color:"rgba(245,245,240,.35)",lineHeight:1.8,marginBottom:20}}>
                    <span style={{color:"rgba(41,121,255,.8)"}}>Training</span> = higher carbs for workout fuel<br/>
                    <span style={{color:"rgba(245,245,240,.5)"}}>Rest</span> = standard lower calories<br/>
                    <span style={{color:"rgba(245,158,11,.8)"}}>Flex</span> = +{flexPct}% calories, protein stays fixed
                  </div>
                  <button onClick={()=>setDayModal(null)} style={{width:"100%",padding:13,background:"transparent",color:"rgba(245,245,240,.4)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Done</button>
                </div>
              </div>
            )}

            {/* QUICK ACTIONS */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {[["+ Food",()=>setShowQuickLog(true),T.prot,"⚡"],["Restaurants",()=>setFuelScreen("recs"),T.carb,"🍗"],["Recipes",()=>setFuelScreen("recipes"),T.fat,"👨‍🍳"],["Fasting",()=>setFuelScreen("fast"),"#9B59FF","⏱️"]].map(([l,fn,c,e])=>(
                <button key={l} onClick={fn} style={{padding:"14px 6px",background:T.s1,border:`1px solid ${T.bd}`,borderRadius:14,cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all .15s"}}>
                  <div style={{fontSize:20,marginBottom:4}}>{e}</div>
                  <div style={{color:c,fontSize:10,fontWeight:700}}>{l}</div>
                </button>
              ))}
            </div>

            {/* RESTAURANT AI CARD */}
            <button onClick={()=>setFuelScreen("recs")} style={{width:"100%",background:"linear-gradient(135deg,rgba(96,165,250,0.12),rgba(96,165,250,0.04))",border:"1px solid rgba(96,165,250,0.25)",borderRadius:16,padding:"16px 20px",cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:16}}>
              <div style={{fontSize:36,flexShrink:0}}>🍗</div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:4}}>Restaurant AI</div>
                <div style={{fontSize:12,color:T.mu,lineHeight:1.5}}>Find exact orders at nearby restaurants to hit your remaining macros</div>
              </div>
              <div style={{color:T.carb,flexShrink:0}}>
                <svg width={18} height={18} viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              </div>
            </button>

            {/* MEAL PREP CARD */}
            <button onClick={()=>setFuelScreen("prep")} style={{width:"100%",background:"linear-gradient(135deg,rgba(155,89,255,0.12),rgba(155,89,255,0.04))",border:"1px solid rgba(155,89,255,0.25)",borderRadius:16,padding:"16px 20px",cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:16}}>
              <div style={{fontSize:36,flexShrink:0}}>🥡</div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:4}}>Meal Prep Planner</div>
                <div style={{fontSize:12,color:"rgba(245,245,240,0.5)",lineHeight:1.5}}>{prepPlan?"View your weekly prep plan · proteins, carbs, veggies + grocery list":"Generate your weekly meal prep plan based on your training schedule"}</div>
              </div>
              <div style={{color:"#9B59FF",flexShrink:0}}>
                <svg width={18} height={18} viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              </div>
            </button>

            {/* WATER TRACKER */}
            {waterTarget>0&&(
              <WaterTracker
                waterLogs={waterLogs||[]}
                waterTarget={waterTarget}
                onAddWater={onAddWater}
                onDeleteWater={onDeleteWater}
                bottleSize={profile?.water_bottle_size||16}
                isMobile={isMobile}
              />
            )}

            {/* FOOD LOG — grouped by meal slots */}
            <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(245,245,240,0.65)",fontFamily:"'Barlow Condensed',sans-serif"}}>Today&apos;s Log</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={addMealSlot} style={{background:"rgba(41,121,255,0.1)",border:"1px dashed rgba(41,121,255,0.4)",color:T.prot,borderRadius:10,padding:"7px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:"0.1em"}}>+ Meal</button>
                  <button onClick={()=>setShowQuickLog(true)} style={{background:"rgba(232,52,28,0.1)",border:"1px dashed rgba(232,52,28,0.4)",color:"#e8341c",borderRadius:10,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:"0.1em"}}>+ Food</button>
                </div>
              </div>
              {log.length===0
                ?<EmptyState icon="🍽️" title="Nothing logged yet" subtitle="Describe a meal, scan a barcode, or use the restaurant finder" actionLabel="Log First Meal" onAction={()=>setFuelScreen("log")}/>
                :<div>
                  {mealSlots.map((slot,si)=>{
                    const slotItems=log.filter(e=>getEntrySlot(e)===slot);
                    if(slotItems.length===0)return null;
                    const slotCals=slotItems.reduce((s,e)=>s+(e.calories||0),0);
                    return(
                      <div key={slot} style={{marginBottom:12}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                          {editingSlot===si
                            ?<input autoFocus defaultValue={slot} onBlur={e=>renameSlot(si,e.target.value||slot)} onKeyDown={e=>{if(e.key==="Enter")renameSlot(si,e.target.value||slot);if(e.key==="Escape")setEditingSlot(null);}} style={{background:"none",border:`1px solid ${T.prot}`,borderRadius:6,padding:"2px 8px",color:"#fff",fontSize:11,fontWeight:700,fontFamily:"inherit",outline:"none",width:120}}/>
                            :<button onClick={()=>setEditingSlot(si)} style={{background:"none",border:"none",padding:0,cursor:"pointer",fontSize:10,fontWeight:700,color:T.mu,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{slot} ✎</button>
                          }
                          <div style={{flex:1,height:1,background:"rgba(255,255,255,0.05)"}}/>
                          <div style={{fontSize:10,color:T.mu,fontFamily:"'DM Mono',monospace"}}>{slotCals} kcal</div>
                          {mealSlots.length>1&&<button onClick={()=>removeSlot(si)} style={{background:"none",border:"none",color:"rgba(245,245,240,0.2)",cursor:"pointer",fontSize:12,padding:"0 2px",lineHeight:1}}>×</button>}
                        </div>
                        {slotItems.map((item,i)=>(
                          <SwipeRow key={item.id}
                            onDelete={()=>{
                              const snap={...item};
                              removeLog(item.id);
                              showToast(`${snap.food||"Item"} removed`,{action:()=>logEntry(snap),actionLabel:"Undo"});
                            }}
                            style={{borderBottom:i<slotItems.length-1?`1px solid rgba(245,245,240,0.04)`:""}}
                          >
                            <div
                              onPointerDown={()=>{longPressRef.current=setTimeout(()=>{hap();setContextMenu({item,slot});},500);}}
                              onPointerUp={()=>clearTimeout(longPressRef.current)}
                              onPointerLeave={()=>clearTimeout(longPressRef.current)}
                              style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0"}}
                            >
                              <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
                                <div style={{width:30,height:30,borderRadius:8,background:T.s2,border:`1px solid ${T.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{item.method==="barcode"?"📷":item.method==="quick"?"✏️":"🧠"}</div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:13,fontFamily:"'Barlow',sans-serif",fontWeight:600,textTransform:"capitalize",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.food||item.name}</div>
                                  <div style={{fontSize:10,color:T.mu,marginTop:1,fontFamily:"'DM Mono',monospace"}}>
                                    <span style={{color:T.prot}}>P:{item.protein}g</span> · <span style={{color:T.carb}}>C:{item.carbs}g</span> · <span style={{color:T.fat}}>F:{item.fat}g</span>
                                  </div>
                                </div>
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                                <div style={{textAlign:"right"}}>
                                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:500,color:"#fff"}}>{item.calories}</div>
                                  <div style={{fontSize:9,color:T.mu}}>kcal</div>
                                </div>
                                <button onClick={()=>removeLog(item.id)} style={{background:T.s2,border:`1px solid ${T.bd}`,color:T.mu,cursor:"pointer",fontSize:13,padding:"4px 8px",borderRadius:6}}>×</button>
                              </div>
                            </div>
                          </SwipeRow>
                        ))}
                      </div>
                    );
                  })}
                  {/* entries not yet assigned to a slot */}
                  {log.filter(e=>!mealSlots.includes(getEntrySlot(e))).map((item,i,arr)=>(
                    <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<arr.length-1?`1px solid rgba(245,245,240,0.04)`:""}}>
                      <div style={{flex:1,minWidth:0,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.food}</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:13}}>{item.calories} kcal</div>
                        <button onClick={()=>removeLog(item.id)} style={{background:T.s2,border:`1px solid ${T.bd}`,color:T.mu,cursor:"pointer",fontSize:13,padding:"4px 8px",borderRadius:6}}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>

            {/* ── MY RECIPES (compact home section) ── */}
            {userRecipes.length>0&&(
              <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(245,245,240,0.65)",fontFamily:"'Barlow Condensed',sans-serif"}}>My Recipes</div>
                  <button onClick={()=>setFuelScreen("recipes")} style={{background:"none",border:"none",color:T.prot,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:"0.1em",textTransform:"uppercase",padding:0}}>See All →</button>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {userRecipes.slice(0,3).map(r=>(
                    <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                        <div style={{fontSize:10,color:T.mu}}>{r.calories_per_serving} kcal · <span style={{color:T.prot}}>P {r.protein_per_serving}g</span></div>
                      </div>
                      <button onClick={()=>setRecipeLogging(r)} style={{padding:"8px 16px",background:`${T.prot}15`,border:`1.5px solid ${T.prot}40`,borderRadius:20,color:T.prot,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Log →</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── LOG FOOD ── */}
        {fuelScreen==="log"&&(
          <div style={{maxWidth:isMobile?"100%":600}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:4}}>LOG FOOD</div>
            <p style={{fontSize:13,color:T.mu,marginBottom:16}}>Search 1M+ foods or describe your meal with AI</p>
            <div style={{display:"flex",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:10,padding:3,gap:3,marginBottom:18,overflowX:"auto"}}>
              {[["search","🔍 Search"],["ai","🧠 AI"],["barcode","📷 Barcode"],["quick","✏️ Quick"]].map(([k,l])=>(
                <button key={k} onClick={()=>setLogMode(k)} style={{flex:1,padding:"9px 4px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",background:logMode===k?`${T.prot}18`:"none",outline:logMode===k?`1.5px solid ${T.prot}`:"none",color:logMode===k?T.prot:T.mu,fontSize:12,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>{l}</button>
              ))}
            </div>
            {logMode==="search"&&<FoodSearchScreen user={user} logEntry={logEntry} mealSlots={mealSlots} activeSlotIdx={activeSlotIdx} setActiveSlotIdx={setActiveSlotIdx} addMealSlot={addMealSlot} setFuelScreen={setFuelScreen} isMobile={isMobile}/>}
            {logMode!=="search"&&<>
              {/* Meal slot selector */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8,fontFamily:"'DM Mono',monospace"}}>Log to meal</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {mealSlots.map((slot,i)=>(
                    <button key={slot} onClick={()=>setActiveSlotIdx(i)} style={{padding:"7px 14px",borderRadius:20,border:`1.5px solid ${activeSlotIdx===i?T.carb:T.bd}`,background:activeSlotIdx===i?`${T.carb}15`:"none",color:activeSlotIdx===i?T.carb:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{slot}</button>
                  ))}
                  <button onClick={addMealSlot} style={{padding:"7px 14px",borderRadius:20,border:`1.5px dashed ${T.bd}`,background:"none",color:"rgba(245,245,240,0.3)",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Add Meal</button>
                </div>
              </div>
              {logMode==="ai"&&<>
                <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px",marginBottom:10}}>
                  <textarea value={foodInput} onChange={e=>setFoodInput(e.target.value)} placeholder="Describe your meal... e.g. grilled chicken 6oz, brown rice 1 cup, steamed broccoli" style={{width:"100%",background:"none",border:"none",color:"#fff",fontSize:14,resize:"none",outline:"none",minHeight:80,fontFamily:"inherit",boxSizing:"border-box",lineHeight:1.6}}/>
                </div>
                {logMsg&&<div style={{background:`${T.prot}12`,border:`1px solid ${T.prot}30`,borderRadius:9,padding:"8px 12px",fontSize:12,color:T.prot,marginBottom:10}}>{logMsg}</div>}
                <PrimaryBtn onClick={aiLog} label={logging?"Analyzing…":"Add to Log →"} disabled={logging||!foodInput.trim()}/>
              </>}
              {logMode==="barcode"&&<>
                <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px",marginBottom:10}}>
                  <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>Barcode number</div>
                  <input value={barcodeInput} onChange={e=>setBarcodeInput(e.target.value)} placeholder="e.g. 0070038642824" style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:8,padding:"11px 13px",color:"#fff",fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit",letterSpacing:1}}/>
                  <div style={{fontSize:10,color:T.mu,marginTop:7}}>Tip: Use your phone camera app to scan — it shows the barcode number. Paste it here.</div>
                </div>
                {barcodeResult&&<div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px",marginBottom:12}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:3}}>{barcodeResult.name}</div>
                  {barcodeResult.brand&&<div style={{fontSize:11,color:T.mu,marginBottom:8}}>{barcodeResult.brand} · {barcodeResult.serving}</div>}
                  <div style={{display:"flex",gap:14,marginBottom:12}}>
                    {[["Cal",barcodeResult.calories,""],["P",barcodeResult.protein,"g"],["C",barcodeResult.carbs,"g"],["F",barcodeResult.fat,"g"]].map(([l,v,u])=>(<div key={l}><div style={{fontSize:9,color:T.mu,textTransform:"uppercase",letterSpacing:1}}>{l}</div><div style={{fontSize:16,fontWeight:800,color:T.prot}}>{v}{u}</div></div>))}
                  </div>
                  <PrimaryBtn onClick={addBarcode} label="Add to Log →"/>
                </div>}
                {barcodeLoading&&<div style={{textAlign:"center",padding:"16px",color:T.mu,fontSize:13}}>Looking up product…</div>}
                <PrimaryBtn onClick={scanBarcode} label="Look Up Barcode →" disabled={barcodeLoading||!barcodeInput.trim()}/>
              </>}
              {logMode==="quick"&&<>
                <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"16px",marginBottom:14}}>
                  {[["Name (optional)","text","name","e.g. Protein shake"],["Calories","number","calories","0"],["Protein (g)","number","protein","0"],["Carbs (g)","number","carbs","0"],["Fat (g)","number","fat","0"]].map(([l,t,k,ph])=>(
                    <div key={k} style={{marginBottom:12}}>
                      <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>{l}</div>
                      <input type={t} value={quickFields[k]} onChange={e=>setQF(q=>({...q,[k]:e.target.value}))} placeholder={ph} style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:8,padding:"10px 12px",color:"#fff",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                    </div>
                  ))}
                </div>
                <PrimaryBtn onClick={addQuick} label="Add Entry →" disabled={!quickFields.calories}/>
              </>}
            </>}
          </div>
        )}

        {/* ── RESTAURANTS ── */}
        {fuelScreen==="recs"&&(
          <div style={{maxWidth:isMobile?"100%":700}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:900,marginBottom:4}}>NEARBY EATS 🍗</div>
            <p style={{fontSize:13,color:T.mu,marginBottom:16}}>AI finds exact orders at real restaurants to hit your remaining macros</p>

            {/* Remaining macros strip */}
            <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:16,padding:"16px 20px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:4}}>Remaining today</div>
                <div style={{display:"flex",gap:20}}>
                  {[["kcal",remaining.calories,"#fff"],["protein",`${remaining.protein}g`,T.prot],["carbs",`${remaining.carbs}g`,T.carb],["fat",`${remaining.fat}g`,T.fat]].map(([l,v,c])=>(
                    <div key={l}>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900,color:c,lineHeight:1}}>{v}</div>
                      <div style={{fontSize:9,color:T.mu,marginTop:2}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* City input */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:7}}>Your City</div>
              <div style={{display:"flex",gap:8}}>
                <input value={city} onChange={e=>setCity(e.target.value)} placeholder="e.g. Miami FL, Austin TX…" style={{flex:1,background:T.s2,border:`1px solid ${T.bd}`,borderRadius:10,padding:"12px 14px",color:"#fff",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
                <button onClick={fetchRecs} disabled={recsLoading||!city.trim()} style={{padding:"12px 20px",background:recsLoading?T.s3:T.prot,color:recsLoading?T.mu:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:recsLoading?"default":"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                  {recsLoading?"Finding…":"Find →"}
                </button>
              </div>
            </div>

            {/* Loading spinner — only before first text arrives */}
            {recsLoading&&!recs&&<div style={{padding:"16px 0",color:T.mu}}>
              <AIContentSkeleton/>
              <div style={{fontSize:11,color:T.dim,textAlign:"center",marginTop:8}}>Matching menu items to your macros…</div>
            </div>}

            {/* Results — show while streaming and after complete */}
            {recs&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontSize:10,color:T.prot,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>🤖 AI Recommendations</div>
                  {!recsLoading&&<FlagBtn responseText={recs} feature="restaurant_recs" user={user}/>}
                </div>
                <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:16,padding:"16px",lineHeight:1.9,fontSize:14,color:"#ccc",whiteSpace:"pre-wrap"}}>
                  <style>{`@keyframes cm-blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
                  {recs}
                  {recsLoading&&<span style={{display:"inline-block",width:2,height:"1em",background:T.prot,marginLeft:2,verticalAlign:"text-bottom",animation:"cm-blink 1s step-end infinite"}}/>}
                </div>
                {!recsLoading&&<button onClick={fetchRecs} style={{width:"100%",padding:"12px",background:T.s2,color:T.prot,fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase",border:`1px solid ${T.prot}25`,borderRadius:10,cursor:"pointer",marginTop:10,fontFamily:"inherit"}}>↺ Refresh Results</button>}
              </div>
            )}

            {!recs&&!recsLoading&&(
              <div style={{textAlign:"center",padding:"40px 0",border:`1px dashed ${T.bd}`,borderRadius:16,color:T.mu}}>
                <div style={{fontSize:36,marginBottom:12}}>🍽️</div>
                <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>Enter your city above</div>
                <div style={{fontSize:12,color:T.dim}}>We'll find exact menu items at nearby chains that hit your remaining macros</div>
              </div>
            )}
          </div>
        )}

        {/* ── MY RECIPES ── */}
        {fuelScreen==="recipes"&&(
          <div style={{maxWidth:isMobile?"100%":700}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900}}>MY RECIPES 🍳</div>
              <button onClick={()=>{setRecipeEditing(null);setShowRecipeBuilder(true);}} style={{padding:"10px 18px",background:T.prot,color:"#fff",border:"none",borderRadius:20,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase",flexShrink:0}}>+ New Recipe</button>
            </div>
            <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Save multi-ingredient recipes · log as a single tap</p>

            {/* AI recipe ideas button */}
            <button onClick={fetchRecipes} style={{width:"100%",padding:"12px 16px",background:"linear-gradient(135deg,rgba(96,165,250,.1),rgba(96,165,250,.04))",border:"1px solid rgba(96,165,250,.25)",borderRadius:12,cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
              <div style={{fontSize:24,flexShrink:0}}>🧠</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>AI Recipe Ideas</div>
                <div style={{fontSize:11,color:T.mu}}>Generate recipes for your remaining macros today</div>
              </div>
              <div style={{color:T.carb,fontSize:11,fontWeight:700}}>{recipesLoading?"…":"Generate →"}</div>
            </button>

            {/* AI result */}
            {(recipes||recipesLoading)&&(
              <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:13,padding:"16px",marginBottom:20}}>
                {recipesLoading
                  ?<div style={{padding:"8px 0"}}><AIContentSkeleton/></div>
                  :<><div style={{lineHeight:1.85,fontSize:13,color:"#ccc",whiteSpace:"pre-wrap"}}>{recipes}</div><div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}><FlagBtn responseText={recipes} feature="recipes" user={user}/></div></>
                }
              </div>
            )}

            {/* Smart save suggestion */}
            {recipeSuggestSlot&&(
              <div style={{background:"rgba(41,121,255,.08)",border:"1px solid rgba(41,121,255,.25)",borderRadius:14,padding:"14px 16px",marginBottom:20}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>You often eat these together for {recipeSuggestSlot}:</div>
                <div style={{fontSize:11,color:T.mu,marginBottom:12}}>
                  {log.filter(e=>(e.slot||"Lunch")===recipeSuggestSlot).slice(0,3).map(e=>e.food).join(" + ")}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setRecipeEditing(null);setShowRecipeBuilder(true);setRecipeSuggestSlot(null);}} style={{flex:1,padding:"10px",background:T.prot,color:"#fff",border:"none",borderRadius:8,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Save as Recipe</button>
                  <button onClick={()=>setRecipeSuggestSlot(null)} style={{padding:"10px 14px",background:"none",border:`1px solid ${T.bd}`,borderRadius:8,color:T.mu,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>No thanks</button>
                </div>
              </div>
            )}

            {/* Recipe list */}
            {userRecipes.length===0?(
              <div style={{textAlign:"center",padding:"56px 20px",border:`1px dashed ${T.bd}`,borderRadius:16}}>
                <div style={{fontSize:52,marginBottom:14}}>🍳</div>
                <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>No recipes yet</div>
                <div style={{fontSize:12,color:T.mu,lineHeight:1.65,maxWidth:280,margin:"0 auto 24px"}}>Create your first recipe to log multiple foods in one tap</div>
                <button onClick={()=>{setRecipeEditing(null);setShowRecipeBuilder(true);}} style={{padding:"14px 28px",background:T.prot,color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>+ Create Recipe</button>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {userRecipes.map(r=>{
                  const totalGrams=(r.ingredients||[]).reduce((s,i)=>s+(i.amount||0),0);
                  const daysSince=r.last_used?Math.round((Date.now()-new Date(r.last_used))/864e5):null;
                  return(
                    <div key={r.id} style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:16,padding:"16px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                          <div style={{fontSize:11,color:T.mu}}>1 serving{totalGrams>0?` (${totalGrams}g)`:""}</div>
                        </div>
                        {r.category&&<span style={{fontSize:9,background:`${T.carb}15`,color:T.carb,borderRadius:5,padding:"3px 8px",flexShrink:0,marginLeft:8}}>{r.category}</span>}
                      </div>
                      <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{r.calories_per_serving} kcal · <span style={{color:T.prot}}>{r.protein_per_serving}g protein</span> · <span style={{color:T.carb}}>{r.carbs_per_serving}g carbs</span> · <span style={{color:T.fat}}>{r.fat_per_serving}g fat</span></div>
                      {daysSince!==null&&<div style={{fontSize:10,color:T.mu,marginBottom:12}}>Last made: {daysSince===0?"today":daysSince===1?"yesterday":`${daysSince} days ago`}</div>}
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>setRecipeLogging(r)} style={{flex:1,padding:"11px",background:T.prot,color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.05em"}}>Log →</button>
                        <button onClick={()=>{setRecipeEditing(r);setShowRecipeBuilder(true);}} style={{padding:"11px 16px",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:10,color:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Edit</button>
                        <button onClick={()=>handleDeleteRecipe(r.id)} style={{padding:"11px 14px",background:"none",border:`1px solid rgba(232,52,28,.3)`,borderRadius:10,color:"rgba(232,52,28,.6)",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MEAL PREP ── */}
        {fuelScreen==="prep"&&(
          <div style={{maxWidth:isMobile?"100%":700}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:4}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900}}>MEAL PREP 🥡</div>
              {prepPlan&&!prepLoading&&(
                <button onClick={generatePrepPlan} style={{fontSize:11,color:"#9B59FF",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",padding:0}}>↺ Regenerate</button>
              )}
            </div>
            <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Cook once, eat all week · based on your training schedule</p>

            {prepLoading&&(
              <div style={{padding:"16px 0",color:T.mu}}>
                <AIContentSkeleton/>
                <div style={{fontSize:13,color:T.dim,textAlign:"center",marginTop:8}}>Building your meal prep plan…</div>
                <div style={{fontSize:11,color:"rgba(245,245,240,0.35)"}}>Analyzing training schedule and macro targets</div>
              </div>
            )}

            {!prepPlan&&!prepLoading&&(
              <div style={{textAlign:"center",padding:"56px 20px",border:`1px dashed ${T.bd}`,borderRadius:16}}>
                <div style={{fontSize:48,marginBottom:14}}>🥡</div>
                <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>Generate Your Prep Plan</div>
                <div style={{fontSize:12,color:T.mu,marginBottom:28,lineHeight:1.65,maxWidth:300,margin:"0 auto 28px"}}>AI builds a complete Sunday prep guide — proteins, carbs, vegetables, and a ready-to-shop grocery list</div>
                <button onClick={generatePrepPlan} style={{padding:"14px 32px",background:"#9B59FF",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Generate Plan →</button>
              </div>
            )}

            {prepPlan&&!prepLoading&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>

                {/* MEAL ASSIGNMENTS */}
                <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:900,letterSpacing:.5,marginBottom:14}}>MEAL ASSIGNMENTS</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {["training","rest"].map(type=>(
                      <div key={type} style={{background:T.s2,borderRadius:14,padding:"14px"}}>
                        <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10,color:type==="training"?"#2979FF":"rgba(245,245,240,0.4)",fontFamily:"'DM Mono',monospace"}}>{type==="training"?"🏋️ TRAINING DAY":"😴 REST DAY"}</div>
                        {Object.entries(prepPlan.mealAssignments?.[type]||{}).map(([meal,desc])=>(
                          <div key={meal} style={{marginBottom:8,paddingBottom:8,borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                            <div style={{fontSize:9,color:type==="training"?"rgba(41,121,255,0.7)":"rgba(245,245,240,0.35)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>{meal}</div>
                            <div style={{fontSize:11,color:"rgba(245,245,240,0.75)",lineHeight:1.55}}>{desc}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* PROTEINS */}
                {prepPlan.proteins?.length>0&&(
                  <div style={{background:T.s1,border:`1px solid rgba(232,52,28,0.2)`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                      <span style={{fontSize:20}}>🥩</span>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:900,color:T.prot,letterSpacing:.5}}>PROTEINS</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {prepPlan.proteins.map((item,i)=>(
                        <div key={i} style={{background:T.s2,borderRadius:12,padding:"12px 14px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{item.name}</div>
                            <div style={{fontSize:11,color:T.prot,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{item.amount}</div>
                          </div>
                          <div style={{fontSize:11,color:"rgba(245,245,240,0.55)",lineHeight:1.5}}>{item.prep}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CARBS */}
                {prepPlan.carbs?.length>0&&(
                  <div style={{background:T.s1,border:`1px solid rgba(96,165,250,0.2)`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                      <span style={{fontSize:20}}>🍚</span>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:900,color:T.carb,letterSpacing:.5}}>CARBS</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {prepPlan.carbs.map((item,i)=>(
                        <div key={i} style={{background:T.s2,borderRadius:12,padding:"12px 14px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{item.name}</div>
                            <div style={{fontSize:11,color:T.carb,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{item.amount}</div>
                          </div>
                          <div style={{fontSize:11,color:"rgba(245,245,240,0.55)",lineHeight:1.5}}>{item.prep}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VEGETABLES */}
                {prepPlan.vegetables?.length>0&&(
                  <div style={{background:T.s1,border:"1px solid rgba(34,197,94,0.2)",borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                      <span style={{fontSize:20}}>🥦</span>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:900,color:"#22c55e",letterSpacing:.5}}>VEGETABLES</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {prepPlan.vegetables.map((item,i)=>(
                        <div key={i} style={{background:T.s2,borderRadius:12,padding:"12px 14px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{item.name}</div>
                            <div style={{fontSize:11,color:"#22c55e",fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{item.amount}</div>
                          </div>
                          <div style={{fontSize:11,color:"rgba(245,245,240,0.55)",lineHeight:1.5}}>{item.prep}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SNACKS */}
                {prepPlan.snacks?.length>0&&(
                  <div style={{background:T.s1,border:"1px solid rgba(155,89,255,0.2)",borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                      <span style={{fontSize:20}}>🍎</span>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:900,color:"#9B59FF",letterSpacing:.5}}>SNACKS</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {prepPlan.snacks.map((item,i)=>(
                        <div key={i} style={{background:T.s2,borderRadius:12,padding:"12px 14px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{item.name}</div>
                            <div style={{fontSize:11,color:"#9B59FF",fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{item.amount}</div>
                          </div>
                          <div style={{fontSize:11,color:"rgba(245,245,240,0.55)",lineHeight:1.5}}>{item.prep}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GROCERY LIST */}
                {prepPlan.grocery&&(
                  <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:groceryOpen?14:0}}>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:900,letterSpacing:.5}}>🛒 GROCERY LIST</div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>{
                          const text=Object.entries(prepPlan.grocery).map(([cat,items])=>`${cat}:\n${items.map(i=>`  • ${i}`).join("\n")}`).join("\n\n");
                          navigator.clipboard?.writeText(text);
                        }} style={{padding:"6px 12px",background:"rgba(41,121,255,0.1)",border:"1px solid rgba(41,121,255,0.3)",color:T.prot,borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Copy</button>
                        <button onClick={()=>setGroceryOpen(o=>!o)} style={{padding:"6px 12px",background:T.s2,border:`1px solid ${T.bd}`,color:T.mu,borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{groceryOpen?"Hide ▲":"Show ▼"}</button>
                      </div>
                    </div>
                    {groceryOpen&&(
                      <div>
                        {Object.entries(prepPlan.grocery).map(([category,items])=>(
                          <div key={category} style={{marginBottom:16}}>
                            <div style={{fontSize:9,color:T.mu,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8,fontFamily:"'DM Mono',monospace"}}>{category}</div>
                            {(items||[]).map((item,i)=>{
                              const key=`${category}:${item}`;
                              const checked=groceryChecked.has(key);
                              return(
                                <div key={i} onClick={()=>setGroceryChecked(s=>{const n=new Set(s);if(checked)n.delete(key);else n.add(key);return n;})}
                                  style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer"}}>
                                  <div style={{width:18,height:18,borderRadius:4,border:`1.5px solid ${checked?"#22c55e":T.bd}`,background:checked?"rgba(34,197,94,0.15)":"none",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                                    {checked&&<span style={{color:"#22c55e",fontSize:10,fontWeight:900,lineHeight:1}}>✓</span>}
                                  </div>
                                  <span style={{fontSize:13,color:checked?"rgba(245,245,240,0.35)":"rgba(245,245,240,0.85)",textDecoration:checked?"line-through":"none",transition:"all 0.15s"}}>{item}</span>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                        <div style={{marginTop:4,padding:"10px 14px",background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.12)",borderRadius:10,fontSize:12,color:"rgba(245,245,240,0.45)",textAlign:"center"}}>
                          {groceryChecked.size} / {Object.values(prepPlan.grocery).reduce((s,a)=>s+(a?.length||0),0)} items checked
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button onClick={generatePrepPlan} style={{width:"100%",padding:"13px",background:T.s2,color:"#9B59FF",fontSize:13,fontWeight:700,letterSpacing:1,textTransform:"uppercase",border:"1px solid rgba(155,89,255,0.25)",borderRadius:11,cursor:"pointer",fontFamily:"inherit"}}>↺ Regenerate Plan</button>
              </div>
            )}
          </div>
        )}

        {/* ── FASTING ── */}
        {fuelScreen==="fast"&&(
          <div style={{maxWidth:isMobile?"100%":560}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:4}}>FASTING</div>
            <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Track your fasting window and eating schedule</p>
            <SectionCard title="Protocol">
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
                {FASTING_PROTOCOLS.map(p=>(<button key={p.id} onClick={()=>{setFastProto(p.id);if(fastActive)setFastActive(false);}} style={{padding:"9px 14px",borderRadius:9,border:`1.5px solid ${fastProto===p.id?T.prot:T.bd}`,background:fastProto===p.id?`${T.prot}15`:T.s3,color:fastProto===p.id?T.prot:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{p.label}</button>))}
              </div>
              <div style={{fontSize:12,color:T.mu}}>{fastProto==="custom"?`${fastCustomH}h fast · ${24-fastCustomH}h eat`:FASTING_PROTOCOLS.find(p=>p.id===fastProto)?.desc}</div>
              {fastProto==="custom"&&<div style={{marginTop:12}}>
                <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:7}}>Fasting hours: {fastCustomH}h</div>
                <input type="range" min="12" max="23" value={fastCustomH} onChange={e=>{setFastCustomH(parseInt(e.target.value));hap();}} style={{width:"100%"}}/>
              </div>}
            </SectionCard>
            <div style={{textAlign:"center",margin:"20px 0"}}>
              <div style={{position:"relative",display:"inline-block"}}>
                <Ring value={fastElapsed} max={fastHours} color={eatOpen?T.carb:T.prot} size={180} sw={14}/>
                <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                  {fastActive?(eatOpen?<><div style={{fontSize:13,color:T.carb,fontWeight:700,marginBottom:4}}>🎉 EAT NOW</div><div style={{fontWeight:900,fontSize:20,color:T.carb}}>Window Open</div></>:<><div style={{fontSize:11,color:T.mu,marginBottom:4}}>Fasting</div><div style={{fontWeight:900,fontSize:26,color:T.prot,fontVariantNumeric:"tabular-nums"}}>{pad2(fastRemaining/3600000)}:{pad2((fastRemaining%3600000)/60000)}:{pad2((fastRemaining%60000)/1000)}</div><div style={{fontSize:10,color:T.mu,marginTop:3}}>remaining</div></>):<><div style={{fontSize:11,color:T.mu,marginBottom:4}}>Ready to start</div><div style={{fontWeight:900,fontSize:26,color:T.mu}}>{fastHours}:00:00</div></>}
                </div>
              </div>
            </div>
            {!fastActive?<PrimaryBtn onClick={()=>{setFastActive(true);setFastStart(Date.now());hap();}} label="Start Fasting →"/>
              :<div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setFastActive(false);setFastStart(null);}} style={{flex:1,padding:"14px",background:T.s2,color:T.red,fontWeight:700,fontSize:13,border:`1px solid ${T.red}30`,borderRadius:11,cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase"}}>End Fast</button>
                {eatOpen&&<button onClick={()=>{setFastActive(false);setFastStart(null);}} style={{flex:2,padding:"14px",background:T.green||"#22c55e",color:"#000",fontWeight:700,fontSize:15,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Break Fast 🎉</button>}
              </div>}
          </div>
        )}

      </div>
    </div>
  );
}

export const SPLITS_WITH_DAYS = {
  3: [
    {id:"full_body",l:"Full Body 3×",e:"🏋️",desc:"Hit every major muscle pattern every session. Best for beginners. Squat, hinge, push, pull, carry — all 3 days.",rec:true,levels:["beginner","intermediate"],gvt:false},
    {id:"ppl_half",l:"Push/Pull/Legs (1 cycle)",e:"🔄",desc:"One round of PPL per week. Each muscle hit once. Good stepping stone before 6-day PPL.",rec:false,levels:["intermediate"],gvt:false},
    {id:"upper_lower_3",l:"Upper/Lower (3-day)",e:"⬆️",desc:"Alternate upper and lower body. 2 upper + 1 lower or vice versa. Great for strength focus.",rec:false,levels:["beginner","intermediate"],gvt:false},
  ],
  4: [
    {id:"upper_lower",l:"Upper/Lower (4-day)",e:"⬆️",desc:"The gold standard for 4 days. 2 upper body days + 2 lower body days. Each muscle hit twice per week — optimal frequency for hypertrophy.",rec:true,levels:["beginner","intermediate","advanced"],gvt:true},
    {id:"ppl_upper",l:"PPL + Upper",e:"🔄",desc:"Push, Pull, Legs, then a bonus Upper day. Good for those who want more upper body volume.",rec:false,levels:["intermediate","advanced"],gvt:false},
    {id:"bro_4",l:"Bro Split (4-day)",e:"💪",desc:"Chest/Back, Shoulders/Arms, Legs, repeat. One muscle focus per day — maximum pump per session.",rec:false,levels:["intermediate","advanced"],gvt:true},
  ],
  5: [
    {id:"bro_split",l:"Bro Split (5-day)",e:"💪",desc:"One muscle group per day: Chest, Back, Shoulders, Arms, Legs. Maximum volume and focus per session. Classic bodybuilding split.",rec:true,levels:["intermediate","advanced"],gvt:true},
    {id:"upper_lower_5",l:"Upper/Lower/Push/Pull/Legs",e:"⬆️",desc:"A hybrid: start the week with Upper/Lower frequency, finish with PPL isolation volume. Best of both worlds.",rec:false,levels:["advanced"],gvt:false},
    {id:"ppl_upper_lower",l:"PPL + Upper/Lower",e:"🔄",desc:"3 days PPL + 2 days Upper/Lower. Highest frequency option at 5 days — for serious lifters.",rec:false,levels:["advanced"],gvt:false},
  ],
  6: [
    {id:"ppl_6",l:"Push/Pull/Legs (6-day)",e:"🔄",desc:"The most popular split for serious lifters. Each muscle hit twice per week. 2 Push + 2 Pull + 2 Legs. Research shows 2x/week frequency is optimal for hypertrophy.",rec:true,levels:["intermediate","advanced"],gvt:true},
    {id:"arnold",l:"Arnold Split",e:"🏆",desc:"Arnold Schwarzenegger's 6-day double split. Day 1&4: Chest+Back, Day 2&5: Shoulders+Arms, Day 3&6: Legs. Insane volume — for serious bodybuilders.",rec:false,levels:["advanced"],gvt:true},
    {id:"upper_lower_6",l:"Upper/Lower (6-day)",e:"⬆️",desc:"3 upper + 3 lower days. Maximum frequency — each muscle hit 3x/week. Very high volume. Recovery critical.",rec:false,levels:["advanced"],gvt:false},
  ],
  7: [
    {id:"ppl_7",l:"PPL + Active Recovery",e:"🔄",desc:"6 days PPL, Sunday is active recovery (mobility, light cardio, stretching). Maximum volume with one built-in deload day.",rec:true,levels:["advanced"],gvt:true},
    {id:"bro_7",l:"Bro Split + LISS",e:"💪",desc:"5-day Bro Split + 2 cardio/conditioning days. Good for those who want to train every day but avoid overtraining.",rec:false,levels:["advanced"],gvt:true},
  ],
};


export const GVT_INFO = "German Volume Training — 10 sets × 10 reps of one compound lift per session. Brutal, proven hypertrophy method. Added as Week 4 of every month. Automatically swaps your main compound for 10×10 at 60% of your working weight.";
