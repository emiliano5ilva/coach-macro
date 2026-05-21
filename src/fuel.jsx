import React, { useState, useEffect, useRef } from "react";
import FeatureStrip from "./components/FeatureStrip.jsx";
import BarcodeScanner from "./BarcodeScanner.jsx";
import { FlagBtn } from "./FlagBtn.jsx";
import { MetabolicResetProgressCard } from "./MetabolicAdaptation.jsx";
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
  saveCustomFood, getCustomFoods, getSmartServings, QUICK_FOODS,
  updateUsualPortion, getMealTemplates, saveMealTemplate, deleteMealTemplate, incrementTemplateUse,
  getUserRecipes, saveUserRecipe, updateUserRecipe, deleteUserRecipe, incrementRecipeUse,
  addWaterLog, deleteWaterLog,
} from "./services/foodDatabase.js";
import { getAIErrorMessage } from "./utils/errors.js";
import { getSlotsForFreq, getSlotLabel, normaliseSlotToNumber, getSlotTargets, getMissingSlots, getLoggedSlots, calculateOverage } from './utils/mealSlots.js';
import { buildUserContext, getRestaurantRecs, getMenuScanRecs } from './services/restaurantAiService.js';
import { geocodeCity, getNearbyRestaurants } from './services/locationService.js';
import { getRecentMealsForSlot, getPerformanceCorrelations } from './services/macroMemoryService.js';

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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)", zIndex: 310, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#0d0d0d", border: "1px solid rgba(232,52,28,0.12)", borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", maxWidth: 480, width: "100%" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 32, height: 3, background: "rgba(232,52,28,0.2)", borderRadius: 2, margin: "0 auto 20px" }} />
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
                <button key={i} onClick={() => { setPortionMode("smart"); setPortionGrams(s.grams); }} style={{ padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${portionMode === "smart" && portionGrams === s.grams ? T.prot : T.bd}`, background: portionMode === "smart" && portionGrams === s.grams ? `${T.prot}15` : "none", color: portionMode === "smart" && portionGrams === s.grams ? T.prot : T.mu, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{s.label}</button>
              ))}
              <button onClick={() => setPortionMode("custom")} style={{ padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${portionMode === "custom" ? T.prot : T.bd}`, background: portionMode === "custom" ? `${T.prot}15` : "none", color: portionMode === "custom" ? T.prot : T.mu, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Custom (g)</button>
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
              <button key={slot} onClick={() => setActiveSlotIdx(i)} style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${activeSlotIdx === i ? T.prot : T.bd}`, background: activeSlotIdx === i ? `${T.prot}15` : "none", color: activeSlotIdx === i ? T.prot : T.mu, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{getSlotLabel(slot)}</button>
            ))}
          </div>
        </div>
        <button onClick={() => onAdd(food, grams, mealSlots[activeSlotIdx] || 1)} style={{ width: "100%", padding: "15px", background: T.prot, color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "var(--condensed)", letterSpacing: 1, textTransform: "uppercase" }}>Add to Log →</button>
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)", zIndex: 320, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#0d0d0d", border: "1px solid rgba(232,52,28,0.12)", borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", maxWidth: 480, width: "100%" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 32, height: 3, background: "rgba(232,52,28,0.2)", borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ fontFamily: "var(--condensed)", fontSize: 22, fontWeight: 900, marginBottom: 2 }}>{recipe.name}</div>
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
            <button key={slot} onClick={() => setActiveSlotIdx(i)} style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${activeSlotIdx === i ? T.prot : T.bd}`, background: activeSlotIdx === i ? `${T.prot}15` : "none", color: activeSlotIdx === i ? T.prot : T.mu, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{getSlotLabel(slot)}</button>
          ))}
        </div>

        <button onClick={() => onLog(recipe, servings, mealSlots[activeSlotIdx] || 1)} style={{ width: "100%", padding: "15px", background: T.prot, color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "var(--condensed)", letterSpacing: 1, textTransform: "uppercase" }}>Log {servings} Serving{servings !== 1 ? "s" : ""} →</button>
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
          <button onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }} style={{ background: "none", border: "none", color: T.mu, cursor: "pointer", padding: 4, lineHeight: 1, display:"flex", alignItems:"center" }}>
            <svg width={22} height={22} viewBox="0 0 22 22" fill="none"><path d="M14 17L8 11L14 5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ fontFamily: "var(--condensed)", fontSize: 18, fontWeight: 800 }}>Add Ingredient</div>
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
        <button onClick={onBack} style={{ background: "none", border: "none", color: T.mu, cursor: "pointer", padding: 4, lineHeight: 1, display:"flex", alignItems:"center" }}>
          <svg width={22} height={22} viewBox="0 0 22 22" fill="none"><path d="M14 17L8 11L14 5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ fontFamily: "var(--condensed)", fontSize: 24, fontWeight: 900 }}>{initRecipe ? "EDIT RECIPE" : "NEW RECIPE"}</div>
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
                <button onClick={() => setIngredients(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "rgba(245,245,240,.3)", cursor: "pointer", padding: "4px", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Running totals */}
        {ingredients.length > 0 && (
          <div style={{ marginTop: 14, background: "rgba(232,52,28,0.06)", border: "1px solid rgba(232,52,28,0.18)", borderRadius: 12, padding: "14px 16px" }}>
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
                <div style={{ flex: 1, height: 4, background: "rgba(232,52,28,0.07)", borderRadius: 2, overflow: "hidden" }}>
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
            <button key={cat} onClick={() => setCategory(category === cat ? "" : cat)} style={{ padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${category === cat ? T.prot : T.bd}`, background: category === cat ? `${T.prot}15` : "none", color: category === cat ? T.prot : T.mu, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{cat}</button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !name.trim() || ingredients.length === 0}
        style={{ width: "100%", padding: "16px", background: !name.trim() || ingredients.length === 0 ? T.s2 : T.prot, color: !name.trim() || ingredients.length === 0 ? T.mu : "#fff", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: !name.trim() || ingredients.length === 0 ? "not-allowed" : "pointer", fontFamily: "var(--condensed)", letterSpacing: 1, textTransform: "uppercase" }}
      >{saving ? "Saving…" : "Save Recipe →"}</button>
    </div>
  );
}

function QuickLogSheet({ open, onClose, user, remaining, recentFoods, frequentFoods, mealTemplates, onDeleteTemplate, mealSlots, activeSlotIdx, setActiveSlotIdx, onLog, onLogTemplate, log, userRecipes, onLogRecipe, recentMeals=[], slotTargets={} }) {
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
  const [logAgainMeal, setLogAgainMeal] = useState(null);
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
        const slot = mealSlots[activeSlotIdx] || 1;
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
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ background: "#0d0d0d", border: "1px solid rgba(232,52,28,0.12)", borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", maxWidth: 480, width: "100%" }}>
          <div style={{ width: 32, height: 3, background: "rgba(232,52,28,0.2)", borderRadius: 2, margin: "0 auto 20px" }} />
          <div style={{ fontSize: 11, color: T.mu, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 6 }}>Voice Log Preview</div>
          <div style={{ fontFamily: "var(--condensed)", fontSize: 20, fontWeight: 900, marginBottom: 16 }}>"{voiceTranscript}"</div>
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
            <button onClick={() => { voiceEntries.forEach(e => onLog(e, null, mealSlots[activeSlotIdx] || 1, true)); setVoiceState("idle"); setVoiceEntries([]); onClose(); }} style={{ flex: 2, padding: "13px", background: T.prot, border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "var(--condensed)", letterSpacing: 1 }}>Log All →</button>
          </div>
        </div>
      </div>
    );
  }

  if (logAgainMeal) {
    const slot = mealSlots[activeSlotIdx] || 1;
    const target = slotTargets[slot] || remaining.calories;
    const diff = target - logAgainMeal.total_calories;
    const pctFit = Math.round(logAgainMeal.total_calories / Math.max(1, target) * 100);
    const fitColor = pctFit <= 110 ? T.green : "#F59E0B";
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)", zIndex: 310, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ background: "#0d0d0d", border: "1px solid rgba(232,52,28,0.12)", borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", maxWidth: 480, width: "100%" }}>
          <div style={{ width: 32, height: 3, background: "rgba(232,52,28,0.2)", borderRadius: 2, margin: "0 auto 20px" }} />
          <div style={{ fontSize: 11, color: T.mu, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 4 }}>Log Again</div>
          <div style={{ fontFamily: "var(--condensed)", fontSize: 20, fontWeight: 900, marginBottom: 4 }}>
            {new Date(logAgainMeal.logged_at + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {[["CAL", logAgainMeal.total_calories, "#fff"], ["PRO", `${logAgainMeal.total_protein}g`, T.prot], ["CARB", `${logAgainMeal.total_carbs}g`, T.carb], ["FAT", `${logAgainMeal.total_fat}g`, T.fat]].map(([lbl, val, c]) => (
              <div key={lbl} style={{ background: T.s2, borderRadius: 8, padding: "6px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: T.mu, fontWeight: 700, letterSpacing: ".1em" }}>{lbl}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: c }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.s2, borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, fontSize: 12, color: T.mu }}>Fits Meal {slot} target ({target} kcal)</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: fitColor }}>{pctFit}%{diff >= 0 ? ` · ${diff} to spare` : ` · ${Math.abs(diff)} over`}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16, maxHeight: 160, overflowY: "auto" }}>
            {(logAgainMeal.entries || []).map((e, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: T.s2, borderRadius: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{e.food}</span>
                <span style={{ fontSize: 11, color: T.mu }}>{e.calories} kcal · P {e.protein}g</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setLogAgainMeal(null)} style={{ flex: 1, padding: "13px", background: "none", border: `1px solid ${T.bd}`, borderRadius: 12, color: T.mu, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Back</button>
            <button onClick={() => {
              (logAgainMeal.entries || []).forEach((e, i) => {
                setTimeout(() => onLog({ name: e.food, calories: e.calories, protein: e.protein, carbs: e.carbs, fat: e.fat }, null, slot, true), i * 10);
              });
              setLogAgainMeal(null);
              onClose();
            }} style={{ flex: 2, padding: "13px", background: T.prot, border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "var(--condensed)", letterSpacing: 1 }}>LOG TO MEAL {slot} →</button>
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#0d0d0d", border: "1px solid rgba(232,52,28,0.12)", borderRadius: "20px 20px 0 0", padding: "0 0 48px", maxWidth: 480, width: "100%", maxHeight: "88vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ width: 32, height: 3, background: "rgba(232,52,28,0.2)", borderRadius: 2, margin: "0 auto 16px" }} />

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
            <div style={{ height: 6, background: "rgba(232,52,28,0.06)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${calPct}%`, background: `linear-gradient(90deg,var(--red),rgba(232,52,28,0.5))`, borderRadius: 3, transition: "width .4s" }} />
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
            <button onClick={() => setScanMode(s => !s)} style={{ flex: 1, padding: "11px 8px", background: scanMode ? "rgba(232,52,28,.08)" : T.s2, border: `1.5px solid ${scanMode ? T.prot : T.bd}`, borderRadius: 10, color: scanMode ? T.prot : T.mu, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Scan Barcode</button>
          </div>

          {/* Recent Meals from Memory */}
          {recentMeals.length > 0 && !scanMode && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>Previous {mealSlots[activeSlotIdx] ? `Meal ${mealSlots[activeSlotIdx]}` : "Meals"}</div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                {recentMeals.map((m, i) => (
                  <button key={m.id || i} onClick={() => setLogAgainMeal(m)} style={{ flexShrink: 0, minWidth: 130, background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 12, padding: "10px 12px", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
                    <div style={{ fontSize: 10, color: T.mu, marginBottom: 3 }}>{new Date(m.logged_at + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{m.total_calories} kcal</div>
                    <div style={{ fontSize: 10, color: T.prot, marginBottom: 5 }}>P {m.total_protein}g</div>
                    <div style={{ fontSize: 10, color: "rgba(245,245,240,.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(m.entries || []).slice(0, 2).map(e => e.food).join(", ")}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Barcode scanner */}
          {scanMode && (
            <div style={{ background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 12, padding: "14px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>Barcode number</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={scanInput} onChange={e => setScanInput(e.target.value)} onKeyDown={e => e.key === "Enter" && lookupBarcode(scanInput)} placeholder="Enter or scan barcode number" style={{ flex: 1, background: T.s3, border: `1px solid ${T.bd}`, borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
                <button onClick={() => lookupBarcode(scanInput)} disabled={scanLoading || !scanInput.trim()} style={{ padding: "10px 16px", background: T.prot, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{scanLoading ? "..." : "Look Up"}</button>
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
                {[["protein", "Protein", T.prot], ["carbs", "Carbs", T.carb], ["fat", "Fat", T.fat]].map(([k, l, c]) => (
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
                      <button onClick={() => { onLog(food, null, mealSlots[activeSlotIdx] || 1, true); }} style={{ width: 36, height: 36, borderRadius: 10, background: `${T.prot}15`, border: `1.5px solid ${T.prot}30`, color: T.prot, fontSize: 20, cursor: "pointer", fontFamily: "inherit", lineHeight: 1, flexShrink: 0 }}>+</button>
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
                        {r.category && <span style={{ fontSize: 9, fontFamily: "var(--mono)", background: "rgba(245,245,240,.06)", color: "rgba(245,245,240,.4)", borderRadius: 5, padding: "2px 7px", flexShrink: 0, marginLeft: 8, letterSpacing: ".06em", textTransform: "uppercase" }}>{r.category}</span>}
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
                <button onClick={() => setSaveTemplateMode(true)} style={{ width: "100%", padding: "11px", background: "rgba(126,87,194,.1)", border: `1px dashed rgba(126,87,194,.4)`, borderRadius: 10, color: "#7E57C2", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>💾 Save Today's Meal as Template</button>
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
                          <span key={i} style={{ fontSize: 10, background: "rgba(232,52,28,0.06)", borderRadius: 5, padding: "2px 7px", color: "rgba(245,245,240,.6)" }}>{e.food}</span>
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
            Copy to {getSlotLabel(s)}
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
    <div style={{background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:16,padding:"16px 18px",marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontFamily:"var(--condensed)",fontSize:13,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(245,245,240,0.65)"}}>Hydration</div>
        <div style={{fontFamily:"var(--mono)",fontSize:11,color:T.carb,fontWeight:700}}>{Math.round(totalOz)} / {waterTarget} oz</div>
      </div>

      {/* 8-drop visual */}
      <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:12}}>
        {Array.from({length:drops}).map((_,i)=>(
          <div key={i} style={{width:16,height:20,transition:"opacity 0.3s",opacity:i<filledDrops?1:0.15}}>
            <svg width="16" height="20" viewBox="0 0 16 20" fill={T.carb}><path d="M8 2C6 5 2 9 2 13a6 6 0 0012 0C14 9 10 5 8 2z"/></svg>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{height:4,background:"rgba(245,245,240,0.07)",borderRadius:2,overflow:"hidden",marginBottom:14}}>
        <div style={{height:"100%",width:`${pct*100}%`,background:`linear-gradient(90deg,${T.carb},rgba(96,165,250,.6))`,borderRadius:2,transition:"width 0.32s cubic-bezier(.2,.7,.3,1)"}}/>
      </div>

      {/* Quick-add buttons */}
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <button onClick={()=>handleQuickAdd(bottleSize)} style={{flex:1,padding:"9px 0",background:"rgba(232,52,28,0.12)",border:"1px solid rgba(232,52,28,0.3)",borderRadius:10,color:"var(--red)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>+{bottleSize} oz</button>
        <button onClick={()=>handleQuickAdd(8)} style={{flex:1,padding:"9px 0",background:"rgba(232,52,28,0.06)",border:"1px solid rgba(232,52,28,0.18)",borderRadius:10,color:"rgba(232,52,28,0.8)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>+8 oz</button>
        <button onClick={()=>setShowCustom(v=>!v)} style={{flex:1,padding:"9px 0",background:"none",border:"1px dashed rgba(245,245,240,0.2)",borderRadius:10,color:"var(--white-dim)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Custom</button>
      </div>

      {showCustom&&(
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <input type="number" value={customOz} onChange={e=>setCustomOz(e.target.value)} placeholder="oz" min={1} max={128}
            style={{flex:1,background:"rgba(245,245,240,0.05)",border:"1px solid rgba(245,245,240,0.12)",borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:13,fontFamily:"var(--mono)",outline:"none"}}/>
          <button onClick={handleCustom} style={{padding:"8px 18px",background:T.prot,border:"none",borderRadius:10,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Add</button>
        </div>
      )}

      {/* Recent logs with long-press to delete */}
      {lastFive.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {lastFive.map(log=>(
            <div key={log.id} onPointerDown={()=>startPress(log.id)} onPointerUp={()=>endPress()} onPointerLeave={()=>endPress()}
              style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",background:"rgba(245,245,240,0.04)",borderRadius:8,position:"relative"}}>
              <div style={{fontSize:11,color:"rgba(245,245,240,0.5)",fontFamily:"var(--mono)"}}>
                {new Date(log.logged_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
              </div>
              <div style={{fontSize:11,color:T.carb,fontWeight:700,fontFamily:"var(--mono)"}}>+{log.amount_oz} oz</div>
              {longPressId===log.id&&(
                <div style={{position:"absolute",right:0,top:-2,zIndex:10,display:"flex",gap:6}}>
                  <button onClick={()=>{onDeleteWater(log.id);setLongPressId(null);}}
                    style={{padding:"5px 10px",background:T.prot,border:"none",borderRadius:8,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
                  <button onClick={()=>setLongPressId(null)}
                    style={{padding:"5px 10px",background:"rgba(255,255,255,0.08)",border:"none",borderRadius:8,color:"rgba(245,245,240,0.5)",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalOz>=waterTarget&&(
        <div style={{textAlign:"center",marginTop:10,fontSize:12,color:T.green,fontWeight:700}}>✓ Daily water goal met! 💪</div>
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
  const [myFoods,setMyFoods]=useState([]);
  const [myFoodsLoading,setMyFoodsLoading]=useState(true);
  const [myFoodsExpanded,setMyFoodsExpanded]=useState(false);

  useEffect(()=>{
    if(!user)return;
    getFrequentFoods(user.id).then(d=>setFrequentFoods(d||[]));
    getRecentFoods(user.id).then(d=>setRecentFoods(d||[]));
    setMyFoodsLoading(true);
    getCustomFoods(user.id).then(d=>{setMyFoods(d||[]);setMyFoodsLoading(false);});
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
      slot:mealSlots[activeSlotIdx]||1,
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
    const entry={id:Date.now(),food:food.name,calories:food.calories,protein:food.protein,carbs:food.carbs,fat:food.fat,slot:mealSlots[activeSlotIdx]||1,source:"quick"};
    logEntry(entry);
    setToast(`${food.name} added!`);
    setTimeout(()=>setToast(""),2500);
  }

  async function saveCustomFoodEntry(){
    if(!customFood.name||!customFood.calories)return;
    const food={id:`custom_${Date.now()}`,name:customFood.name,brand:customFood.brand,calories:parseFloat(customFood.calories)||0,protein:parseFloat(customFood.protein)||0,carbs:parseFloat(customFood.carbs)||0,fat:parseFloat(customFood.fat)||0,servingSize:parseFloat(customFood.serving_size)||100,servingUnit:customFood.serving_unit||"g",source:"custom"};
    if(user)await saveCustomFood(user.id,food).catch(()=>{});
    if(user)getCustomFoods(user.id).then(d=>setMyFoods(d||[]));
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
                <button key={i} onClick={()=>{setPortionMode("smart");setPortionGrams(s.grams);}} style={{padding:"7px 12px",borderRadius:20,border:`1.5px solid ${portionMode==="smart"&&portionGrams===s.grams?T.prot:T.bd}`,background:portionMode==="smart"&&portionGrams===s.grams?`${T.prot}15`:"none",color:portionMode==="smart"&&portionGrams===s.grams?T.prot:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{s.label}</button>
              ))}
              <button onClick={()=>setPortionMode("custom")} style={{padding:"7px 12px",borderRadius:20,border:`1.5px solid ${portionMode==="custom"?T.prot:T.bd}`,background:portionMode==="custom"?`${T.prot}15`:"none",color:portionMode==="custom"?T.prot:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Custom (g)</button>
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
              <button key={slot} onClick={()=>setActiveSlotIdx(i)} style={{padding:"7px 14px",borderRadius:20,border:`1.5px solid ${activeSlotIdx===i?T.prot:T.bd}`,background:activeSlotIdx===i?`${T.prot}15`:"none",color:activeSlotIdx===i?T.prot:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{getSlotLabel(slot)}</button>
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
        <button onClick={()=>setShowCustomForm(false)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:13,padding:"0 0 16px",fontFamily:"inherit"}}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>Back to search
        </button>
        <div style={{fontFamily:"var(--condensed)",fontSize:28,fontWeight:900,marginBottom:16}}>CUSTOM FOOD</div>
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
          <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8,fontFamily:"var(--mono)"}}>Recent</div>
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
          <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8,fontFamily:"var(--mono)"}}>Most Used</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {frequentFoods.slice(0,8).map((f,i)=>(
              <button key={i} onClick={()=>selectFood(f.food_data)} style={{padding:"7px 13px",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:20,cursor:"pointer",color:"#fff",fontSize:12,fontWeight:600,fontFamily:"inherit"}}>{f.food_name}</button>
            ))}
          </div>
        </div>
      )}
      {!query&&(
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8,fontFamily:"var(--mono)"}}>Quick Add</div>
          <div style={{display:"flex",gap:6,marginBottom:quickCategory?10:0}}>
            {[["protein","Protein",T.prot],["carbs","Carbs",T.carb],["fat","Fat",T.fat]].map(([k,l,c])=>(
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
      {/* My Foods */}
      {!query&&(
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"var(--mono)"}}>My Foods</div>
            <button onClick={()=>setShowCustomForm(true)} style={{display:"flex",alignItems:"center",gap:4,background:"none",border:`1px solid rgba(232,52,28,0.4)`,borderRadius:6,padding:"3px 10px",color:T.prot,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={T.prot} strokeWidth={2.2} strokeLinecap="round"/></svg>New
            </button>
          </div>
          {myFoodsLoading?(
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {[1,2].map(i=>(
                <div key={i} style={{height:52,background:T.s2,border:`1px solid ${T.bd}`,borderRadius:10,animation:"pulse 1.4s ease-in-out infinite"}}/>
              ))}
            </div>
          ):myFoods.length===0?(
            <div style={{textAlign:"center",padding:"32px 20px",background:"rgba(232,52,28,0.04)",border:"1px dashed rgba(232,52,28,0.2)",borderRadius:14}}>
              <svg width={36} height={36} viewBox="0 0 24 24" fill="none" style={{margin:"0 auto 10px",display:"block",opacity:.45}}>
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="#fff" strokeWidth={1.5} strokeLinecap="round"/>
                <rect x="9" y="3" width="6" height="4" rx="1" stroke="#fff" strokeWidth={1.5}/>
                <path d="M9 12h6M9 16h4" stroke={T.prot} strokeWidth={1.5} strokeLinecap="round"/>
              </svg>
              <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:4}}>No custom foods yet</div>
              <div style={{fontSize:11,color:T.mu,marginBottom:16,lineHeight:1.65,maxWidth:240,margin:"0 auto 16px"}}>Save foods you eat often with exact macros for instant re-use</div>
              <button onClick={()=>setShowCustomForm(true)} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"10px 20px",background:T.prot,color:"#fff",border:"none",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"/></svg>
                Create First Food
              </button>
            </div>
          ):(
            <>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {(myFoodsExpanded?myFoods:myFoods.slice(0,6)).map((food,i)=>(
                  <button key={food.id||i} onClick={()=>selectFood(food)} style={{padding:"10px 14px",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:10,cursor:"pointer",textAlign:"left",color:"#fff",fontFamily:"inherit",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:13,marginBottom:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{food.name}</div>
                      <div style={{fontSize:10,color:T.mu}}>{food.calories} kcal · <span style={{color:T.prot}}>P {food.protein}g</span> · <span style={{color:T.carb}}>C {food.carbs}g</span> · <span style={{color:T.fat}}>F {food.fat}g</span></div>
                    </div>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{flexShrink:0,color:T.prot}}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"/></svg>
                  </button>
                ))}
              </div>
              {myFoods.length>6&&(
                <button onClick={()=>setMyFoodsExpanded(e=>!e)} style={{width:"100%",marginTop:6,padding:"8px",background:"none",border:"none",color:T.mu,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"var(--mono)",letterSpacing:"0.1em",textTransform:"uppercase"}}>
                  {myFoodsExpanded?`Show fewer`:`View all ${myFoods.length} foods`}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function FuelSection({log,macros,consumed,remaining,cfg,todayType,todayFocus,earnedCals,todayActs,fuelScreen,setFuelScreen,foodInput,setFoodInput,logging,logMsg,aiLog,logMode,setLogMode,barcodeInput,setBarcodeInput,barcodeResult,barcodeLoading,scanBarcode,addBarcode,quickFields,setQF,addQuick,removeLog,recs,recsLoading,fetchRecs,recipes,recipesLoading,fetchRecipes,fastProto,setFastProto,fastActive,setFastActive,fastStart,setFastStart,fastCustomH,setFastCustomH,fastHours,city,setCity,isMobile,user,wPrefs,setWPrefs,schedule,setSchedule,todayKey,periodizationInfo,logEntry,profile,dayNutrition,weekMacros,waterTarget,waterLogs,onAddWater,onDeleteWater,logDate,setLogDate,metabolicProtocol,onOpenPhotoLogger,skippedSlots,onSkipSlots,slotOverages={},onSlotOverage,resetSignal=0,todayProtocol=null}) {

  const FUEL_TABS=[{id:"home",label:"Home"},{id:"log",label:"Log Food"},{id:"kitchen",label:"Kitchen"}];
  const pad2=n=>String(Math.max(0,Math.floor(n))).padStart(2,"0");

  const [now,setNow]=useState(Date.now());
  useEffect(()=>{
    if(!fastActive)return;
    const id=setInterval(()=>setNow(Date.now()),1000);
    return()=>clearInterval(id);
  },[fastActive]);
  const fastElapsed=fastActive&&fastStart?(now-fastStart)/3600000:0;
  const fastPct=Math.min(fastElapsed/fastHours,1);
  const fastRemaining=fastActive?Math.max(0,(fastHours*3600000)-(now-fastStart)):fastHours*3600000;
  const eatOpen=fastActive&&fastElapsed>=fastHours;

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
    if(user)(async()=>{ const {error}=await sb.from("profiles").upsert({id:user.id,schedule:newSch},{onConflict:"id"}); if(error)console.error("[setDayType]",error); })();
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
  const [ringExpanded,setRingExpanded]=useState(false);

  // ── Meal Slots ─────────────────────────────────────────────────────────────
  const [mealSlots,setMealSlots]=useState(()=>getSlotsForFreq(profile?.mealFreq));
  const [activeSlotIdx,setActiveSlotIdx]=useState(0);
  const [logSlotConfirmed,setLogSlotConfirmed]=useState(false);
  const prevFuelScreenRef=useRef(fuelScreen);
  useEffect(()=>{
    if(fuelScreen==="log"&&prevFuelScreenRef.current!=="log")setLogSlotConfirmed(false);
    prevFuelScreenRef.current=fuelScreen;
  },[fuelScreen]);
  const [showSkipPrompt,setShowSkipPrompt]=useState(false);
  const [skipPromptTarget,setSkipPromptTarget]=useState(null);
  const [tooltipSlot,setTooltipSlot]=useState(null);
  const [justSkipped,setJustSkipped]=useState([]);
  const [showUndoToast,setShowUndoToast]=useState(false);
  const [undoProgress,setUndoProgress]=useState(100);
  const undoTimerRef=useRef(null);

  useEffect(()=>{
    console.log('mealFreq:',profile?.mealFreq,profile?.profile_data?.mealFreq,profile?.wprefs?.mealFreq);
    const freq=profile?.mealFreq||profile?.wprefs?.mealFreq;
    if(freq)setMealSlots(getSlotsForFreq(freq));
  },[profile?.mealFreq]);

  useEffect(()=>()=>{if(undoTimerRef.current)clearTimeout(undoTimerRef.current);},[]);

  function getEntrySlot(entry){
    if(typeof entry.slot==='number') return entry.slot;
    if(entry.slot) return normaliseSlotToNumber(entry.slot,mealSlots);
    const h=new Date(entry.id).getHours();
    const n=mealSlots.length;
    const bounds=n===2?[13]:n===4?[10,13,18]:n===5?[9,12,15,19]:[8,10,13,16,19];
    const idx=bounds.findIndex(b=>h<b);
    return mealSlots[idx===-1?n-1:Math.min(idx,n-1)];
  }

  function addMealSlot(){const next=mealSlots.length>0?Math.max(...mealSlots)+1:1;setMealSlots(s=>[...s,next]);setActiveSlotIdx(mealSlots.length);}
  function removeSlot(idx){if(mealSlots.length<=1)return;setMealSlots(s=>s.filter((_,i)=>i!==idx));setActiveSlotIdx(0);}

  function handleSetActiveSlot(targetSlot,openQuickLog=false){
    const lSlots=getLoggedSlots(log);
    const missing=getMissingSlots(targetSlot,mealSlots,lSlots,skippedSlots||[]);
    if(missing.length>0){
      setSkipPromptTarget({targetSlot,missingSlots:missing,openQuickLog});
      setShowSkipPrompt(true);
      return;
    }
    const idx=mealSlots.indexOf(targetSlot);
    setActiveSlotIdx(idx>=0?idx:0);
    if(openQuickLog)setShowQuickLog(true);
  }

  // ── Overage modal ─────────────────────────────────────────────────────────
  const [overageModal,setOverageModal]=useState(null);
  const prevLogLenRef=useRef(log.length);

  useEffect(()=>{
    const prevLen=prevLogLenRef.current;
    prevLogLenRef.current=log.length;
    if(!profile?.goal||log.length<=prevLen)return;
    const newest=log[0];
    if(!newest)return;
    const slotNum=getEntrySlot(newest);
    if(!slotNum)return;
    if(String(slotNum) in (slotOverages||{}))return;
    const lSlots=getLoggedSlots(log);
    const targets=getSlotTargets(macros.calories,mealSlots,skippedSlots||[],lSlots,slotOverages||{});
    const target=targets[slotNum];
    if(!target||target===0)return;
    const slotCals=log.filter(e=>getEntrySlot(e)===slotNum).reduce((sum,e)=>sum+(e.calories||0),0);
    const overage=calculateOverage(target,slotCals,profile.goal);
    if(overage<=0)return;
    const newOverages={...(slotOverages||{}),[String(slotNum)]:overage};
    const newTargets=getSlotTargets(macros.calories,mealSlots,skippedSlots||[],lSlots,newOverages);
    const oldTargets=getSlotTargets(macros.calories,mealSlots,skippedSlots||[],lSlots,slotOverages||{});
    const remaining=mealSlots.filter(s=>!lSlots.includes(s)&&!(skippedSlots||[]).includes(s)&&s!==slotNum);
    setOverageModal({slot:slotNum,overage,newOverages,remaining,oldTargets,newTargets});
    onSlotOverage?.(newOverages);
  },[log]);

  function getOverageCopy(goal,slot,overage,remainingCount){
    const perMeal=remainingCount>0?Math.round(overage/remainingCount):overage;
    switch(goal){
      case'lose_fat':return`You went ${overage} kcal over Meal ${slot}. On a deficit every calorie counts — remaining meals adjusted to keep your fat loss on track.`;
      case'recomp':return`Meal ${slot} was ${overage} kcal over target. Remaining meals adjusted to keep your recomp on track.`;
      case'build_muscle':case'get_stronger':return`Meal ${slot} was slightly over. Remaining meals adjusted by ${perMeal} kcal each — still well within your surplus range.`;
      case'train_for_race':case'get_faster':return`Meal ${slot} was ${overage} kcal over. Remaining meals adjusted — you still have plenty of fuel for performance.`;
      default:return`Meal ${slot} was ${overage} kcal over. Remaining meals adjusted to keep your daily total on target.`;
    }
  }

  function getOverageHeadline(goal){
    if(goal==='lose_fat'||goal==='recomp')return'SLIGHTLY OVER.';
    if(['build_muscle','get_stronger','train_for_race','get_faster'].includes(goal))return'A LITTLE OVER.';
    return'SLIGHTLY OVER.';
  }

  // ── Restaurant AI modal ───────────────────────────────────────────────────
  const [restaurantAI,setRestaurantAI]=useState(null);
  const [raStep,setRaStep]=useState('picker');
  const [raPrevStep,setRaPrevStep]=useState('picker');
  const [raNearbyLoading,setRaNearbyLoading]=useState(false);
  const [raNearby,setRaNearby]=useState([]);
  const [raNearbyCity,setRaNearbyCity]=useState('');
  const [raNearbyError,setRaNearbyError]=useState('');
  const [raRestaurant,setRaRestaurant]=useState(null);
  const [raLoading,setRaLoading]=useState(false);
  const [raResult,setRaResult]=useState(null);
  const [raError,setRaError]=useState('');
  const menuScanRef=useRef(null);

  function openRestaurantAI(){
    const slot=mealSlots[activeSlotIdx]||1;
    const lSlots=getLoggedSlots(log);
    const calTargets=getSlotTargets(macros.calories,mealSlots,skippedSlots||[],lSlots,slotOverages||{});
    const slotCal=calTargets[slot]||Math.round(macros.calories/mealSlots.length);
    const ratio=macros.calories>0?slotCal/macros.calories:1/mealSlots.length;
    setRestaurantAI({
      slot,
      calTarget:slotCal,
      proteinTarget:Math.round(macros.protein*ratio),
      carbTarget:Math.round(macros.carbs*ratio),
      fatTarget:Math.round(macros.fat*ratio),
    });
    setRaStep('picker');
    setRaPrevStep('picker');
    setRaResult(null);
    setRaRestaurant(null);
    setRaNearby([]);
    setRaNearbyError('');
    setRaError('');
    setRaNearbyCity(city||'');
  }

  function raBack(){
    if(raStep==='picker'){setRestaurantAI(null);}
    else if(raStep==='nearme'){setRaStep('picker');}
    else if(raStep==='result'){setRaStep(raPrevStep);}
  }

  async function fetchRaNearby(){
    if(!raNearbyCity.trim()||raNearbyLoading)return;
    setRaNearbyLoading(true);
    setRaNearbyError('');
    try{
      const coords=await geocodeCity(raNearbyCity.trim());
      if(!coords){setRaNearbyError('City not found. Try a different search.');setRaNearbyLoading(false);return;}
      const places=await getNearbyRestaurants(coords.lat,coords.lng);
      setRaNearby(places);
      if(places.length===0)setRaNearbyError('No restaurants found nearby. Try a different city.');
    }catch(e){
      setRaNearbyError('Error finding restaurants. Check your connection.');
    }
    setRaNearbyLoading(false);
  }

  async function handleRaRestaurantTap(r){
    setRaRestaurant(r);
    setRaResult(null);
    setRaError('');
    setRaLoading(true);
    setRaPrevStep('nearme');
    setRaStep('result');
    try{
      const ctx=buildUserContext(
        profile,
        {calories:restaurantAI.calTarget,protein:restaurantAI.proteinTarget,carbs:restaurantAI.carbTarget,fat:restaurantAI.fatTarget},
        restaurantAI.slot,
        mealSlots.length,
        (todayActs||[]).length>0,
        todayType||null
      );
      const result=await getRestaurantRecs(r.name,r.types||[],ctx);
      setRaResult(result);
    }catch(e){
      setRaError('Could not get recommendations. Try again.');
      console.error('getRestaurantRecs failed:',e);
    }
    setRaLoading(false);
  }

  async function handleMenuScan(e){
    const file=e.target.files?.[0];
    if(!file)return;
    if(menuScanRef.current)menuScanRef.current.value='';
    setRaRestaurant({name:'Scanned Menu'});
    setRaResult(null);
    setRaError('');
    setRaLoading(true);
    setRaPrevStep('picker');
    setRaStep('result');
    try{
      const base64=await resizeImageForScan(file);
      const ctx=buildUserContext(
        profile,
        {calories:restaurantAI.calTarget,protein:restaurantAI.proteinTarget,carbs:restaurantAI.carbTarget,fat:restaurantAI.fatTarget},
        restaurantAI.slot,
        mealSlots.length,
        (todayActs||[]).length>0,
        todayType||null
      );
      const result=await getMenuScanRecs(base64,'image/jpeg',ctx);
      setRaResult(result);
    }catch(e){
      setRaError('Could not read menu. Try photographing with better lighting.');
      console.error('getMenuScanRecs failed:',e);
    }
    setRaLoading(false);
  }

  function resizeImageForScan(file){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=(ev)=>{
        const img=new Image();
        img.onload=()=>{
          const MAX=1024;
          const scale=Math.min(MAX/img.width,MAX/img.height,1);
          const w=Math.round(img.width*scale);
          const h=Math.round(img.height*scale);
          const canvas=document.createElement('canvas');
          canvas.width=w;canvas.height=h;
          canvas.getContext('2d').drawImage(img,0,0,w,h);
          resolve(canvas.toDataURL('image/jpeg',0.8).split(',')[1]);
        };
        img.onerror=reject;
        img.src=ev.target.result;
      };
      reader.onerror=reject;
      reader.readAsDataURL(file);
    });
  }

  function raMacroChipStyle(value,target,isProtein=false){
    if(!target)return{bg:'rgba(245,245,240,0.06)',color:'rgba(245,245,240,0.5)'};
    const pct=value/target;
    if(isProtein){
      if(pct>=0.8)return{bg:'rgba(34,197,94,0.1)',color:'#22c55e'};
      if(pct>=0.6)return{bg:'rgba(254,160,32,0.1)',color:'#FEA020'};
      return{bg:'rgba(232,52,28,0.1)',color:'#e8341c'};
    }
    if(pct<=1.0)return{bg:'rgba(34,197,94,0.1)',color:'#22c55e'};
    if(pct<=1.1)return{bg:'rgba(254,160,32,0.1)',color:'#FEA020'};
    return{bg:'rgba(232,52,28,0.1)',color:'#e8341c'};
  }

  // ── Tab re-activation reset ──────────────────────────────────────────────────
  useEffect(()=>{
    if(!resetSignal)return;
    setRestaurantAI(null);
    setShowRecipeBuilder(false);
    setShowQuickLog(false);
  },[resetSignal]);

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

  // ── Performance correlations from macro_memory ─────────────────────────────
  const [perfCorrelations,setPerfCorrelations]=useState(null);
  useEffect(()=>{
    if(!user)return;
    getPerformanceCorrelations(user.id).then(d=>setPerfCorrelations(d||null));
  },[user]);

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
      const slotsForFreq=getSlotsForFreq(profile?.mealFreq||"4").map(n=>getSlotLabel(n));
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
          const {error:prepErr}=await sb.from("profiles").upsert({id:user.id,meal_prep_plan:plan,meal_prep_generated_at:now,updated_at:now},{onConflict:"id"});
          if(prepErr)console.error("[savePrepPlan]",prepErr);
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
      slot: slot || mealSlots[activeSlotIdx] || 1,
      source: food.source || "usda",
    } : {
      id: Date.now(),
      food: food.name,
      calories: food.calories||0,
      protein: food.protein||0,
      carbs: food.carbs||0,
      fat: food.fat||0,
      slot: slot || mealSlots[activeSlotIdx] || 1,
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
      setTimeout(()=>logEntryWithUndo({...e,id:Date.now()+i,slot:mealSlots[activeSlotIdx]||1}),i*10);
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
  const [recipeSearch,setRecipeSearch]=useState("");
  const [recipeCatFilter,setRecipeCatFilter]=useState("All");
  const [recipeDeleteConfirm,setRecipeDeleteConfirm]=useState(null);

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
    log.forEach(e=>{const s=getEntrySlot(e);slotCounts[s]=(slotCounts[s]||0)+1;});
    const bigSlot=Object.entries(slotCounts).find(([,c])=>c>=3);
    if(bigSlot&&parseInt(bigSlot[0])!==recipeSuggestSlot){
      const bigSlotNum=parseInt(bigSlot[0]);
      const slotItems=log.filter(e=>getEntrySlot(e)===bigSlotNum);
      const alreadySaved=userRecipes.some(r=>r.name.toLowerCase().includes(getSlotLabel(bigSlotNum).toLowerCase()));
      if(!alreadySaved)setRecipeSuggestSlot(bigSlotNum);
    }
  },[log]);

  // quick log food state for FuelSection-level frequent/recent refresh
  const [qlRecentFoods,setQlRecentFoods]=useState([]);
  const [qlFrequentFoods,setQlFrequentFoods]=useState([]);
  const [qlRecentMeals,setQlRecentMeals]=useState([]);
  useEffect(()=>{
    if(!user||!showQuickLog)return;
    getRecentFoods(user.id).then(d=>setQlRecentFoods(d||[]));
    getFrequentFoods(user.id).then(d=>setQlFrequentFoods(d||[]));
    const slot=mealSlots[activeSlotIdx]||1;
    getRecentMealsForSlot(user.id,slot,6).then(d=>setQlRecentMeals(d||[]));
  },[user,showQuickLog,activeSlotIdx]);

  const today=new Date().toISOString().split("T")[0];
  const isToday2=!logDate||logDate===today;
  function shiftDate(days){
    if(!setLogDate)return;
    const d=new Date((logDate||today)+"T12:00:00");
    d.setDate(d.getDate()+days);
    const next=d.toISOString().split("T")[0];
    if(next>today)return;
    setLogDate(next);
  }
  const dateLabelFuel=(()=>{
    if(!logDate||isToday2)return"Today";
    const d=new Date(logDate+"T12:00:00");
    const yesterday=new Date(Date.now()-864e5).toISOString().split("T")[0];
    if(logDate===yesterday)return"Yesterday";
    return d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
  })();

  return (
    <div className="page-enter" style={{paddingBottom:isMobile?20:0}}>
      {/* ── PAGE HEADER ── */}
      <div className="screen-header" style={{paddingTop:12}}>
        <div style={{flex:1,minWidth:0}}>
          <div className="header-eyebrow">// {new Date().toLocaleDateString("en-US",{weekday:"long"})} · {macros.isFlexDay?"Flex Day":(cfg.label+" Day")}</div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:13,background:"rgba(232,52,28,0.12)",border:"1px solid rgba(232,52,28,0.28)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8 2 4 6 4 10c0 6 8 12 8 12s8-6 8-12c0-4-4-8-8-8z" fill="var(--red)" opacity="0.8"/>
                <path d="M12 6c0 0-2 2-2 4s2 4 2 4" stroke="rgba(245,245,240,0.5)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <div className="header-title">Fuel</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--red)",fontWeight:700,letterSpacing:"0.1em"}}>{macros.calories.toLocaleString()} kcal</div>
        </div>
      </div>
      {/* Date navigator */}
      {setLogDate&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0,padding:"10px 20px 4px"}}>
          <button onClick={()=>shiftDate(-1)} style={{background:"none",border:"none",color:"rgba(245,245,240,0.5)",cursor:"pointer",fontSize:20,padding:"4px 12px",lineHeight:1,fontFamily:"inherit"}}>‹</button>
          <div style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:13,fontWeight:700,color:isToday2?"var(--red)":"#fff"}}>{dateLabelFuel}</div>
            {!isToday2&&<div style={{fontSize:10,color:"rgba(245,245,240,0.35)",fontFamily:"var(--mono)",letterSpacing:"0.1em"}}>VIEW ONLY</div>}
          </div>
          <button onClick={()=>shiftDate(1)} disabled={isToday2} style={{background:"none",border:"none",color:isToday2?"rgba(245,245,240,0.15)":"rgba(245,245,240,0.5)",cursor:isToday2?"default":"pointer",fontSize:20,padding:"4px 12px",lineHeight:1,fontFamily:"inherit"}}>›</button>
        </div>
      )}
      {/* Undo Toast */}
      {undoEntry&&(
        <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:"#0d0d0d",border:"1px solid rgba(232,52,28,0.15)",borderRadius:14,padding:"12px 16px",zIndex:400,display:"flex",alignItems:"center",gap:14,boxShadow:"0 8px 32px rgba(0,0,0,.5)",minWidth:260}}>
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
      {/* Skip Prompt Modal */}
      {showSkipPrompt&&skipPromptTarget&&(()=>{
        const {targetSlot,missingSlots,openQuickLog:oql}=skipPromptTarget;
        const lSlots=getLoggedSlots(log);
        const basePerSlot=macros.calories/mealSlots.length;
        const freedCals=missingSlots.length*basePerSlot;
        const remainingAfterSkip=mealSlots.filter(s=>!lSlots.includes(s)&&!(skippedSlots||[]).includes(s)&&!missingSlots.includes(s));
        const extraPerMeal=remainingAfterSkip.length>0?Math.round(freedCals/remainingAfterSkip.length):0;
        const headline=missingSlots.length===1
          ?`DID YOU SKIP MEAL ${missingSlots[0]}?`
          :missingSlots.length===2
            ?`DID YOU SKIP MEAL ${missingSlots[0]} AND MEAL ${missingSlots[1]}?`
            :`DID YOU SKIP ${missingSlots.length} MEALS?`;
        const bodyText=missingSlots.length===1
          ?`Skipping Meal ${missingSlots[0]} will add those calories to your remaining meals.`
          :`Skipping those meals will split those calories evenly across your remaining meals.`;
        const impactText=remainingAfterSkip.length===1
          ?`+${Math.round(freedCals)} kcal added to Meal ${remainingAfterSkip[0]}`
          :`+${extraPerMeal} kcal added to each of your remaining ${remainingAfterSkip.length} meals`;
        const btnLabel=missingSlots.length===1?`SKIP MEAL ${missingSlots[0]} →`:`SKIP ${missingSlots.length} MEALS →`;
        async function confirmSkip(){
          const newSkipped=[...(skippedSlots||[]),...missingSlots];
          setJustSkipped([...missingSlots]);
          if(onSkipSlots)await onSkipSlots(newSkipped);
          const idx=mealSlots.indexOf(targetSlot);
          setActiveSlotIdx(idx>=0?idx:0);
          setShowSkipPrompt(false);
          setSkipPromptTarget(null);
          if(oql)setShowQuickLog(true);
          setShowUndoToast(true);
          setUndoProgress(100);
          setTimeout(()=>setUndoProgress(0),50);
          if(undoTimerRef.current)clearTimeout(undoTimerRef.current);
          undoTimerRef.current=setTimeout(()=>{setShowUndoToast(false);setJustSkipped([]);},5000);
        }
        return(
          <div style={{position:"fixed",inset:0,background:"rgba(6,13,26,0.92)",backdropFilter:"blur(8px)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>{setShowSkipPrompt(false);setSkipPromptTarget(null);}}>
            <div style={{background:"#060d1a",border:"1px solid rgba(245,245,240,0.1)",borderRadius:"20px 20px 0 0",padding:"28px 24px 48px",maxWidth:480,width:"100%"}} onClick={e=>e.stopPropagation()}>
              <div style={{width:36,height:4,borderRadius:2,background:"rgba(245,245,240,0.12)",margin:"0 auto 24px"}}/>
              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#e8341c",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>// HEADS UP</div>
              <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:22,color:"#f5f5f0",lineHeight:0.95,marginBottom:12}}>
                {headline}<span style={{color:"#e8341c"}}>.</span>
              </div>
              <div style={{fontSize:14,color:"rgba(245,245,240,0.6)",lineHeight:1.5,marginBottom:8}}>{bodyText}</div>
              {remainingAfterSkip.length>0&&(
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.5)",marginBottom:20,letterSpacing:"0.08em"}}>{impactText}</div>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <button onClick={confirmSkip} style={{width:"100%",background:"#e8341c",border:"none",borderRadius:10,padding:14,fontFamily:"var(--mono)",fontWeight:700,fontSize:10,color:"#fff",letterSpacing:"0.16em",textTransform:"uppercase",cursor:"pointer"}}>{btnLabel}</button>
                <button onClick={()=>{setShowSkipPrompt(false);setSkipPromptTarget(null);}} style={{width:"100%",background:"transparent",border:"1px solid rgba(245,245,240,0.1)",borderRadius:10,padding:12,fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>GO BACK</button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Undo skip toast */}
      {showUndoToast&&justSkipped.length>0&&(
        <div style={{position:"fixed",bottom:100,left:16,right:16,background:"#0d0d0d",border:"1px solid rgba(232,52,28,0.3)",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:9999,overflow:"hidden"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#f5f5f0"}}>
            {justSkipped.length===1?`Meal ${justSkipped[0]} skipped.`:`${justSkipped.length} meals skipped.`}
          </div>
          <button onClick={async()=>{
            clearTimeout(undoTimerRef.current);
            setShowUndoToast(false);
            const restored=(skippedSlots||[]).filter(s=>!justSkipped.includes(s));
            if(onSkipSlots)await onSkipSlots(restored);
            setJustSkipped([]);
          }} style={{background:"rgba(232,52,28,0.15)",border:"1px solid rgba(232,52,28,0.4)",borderRadius:6,padding:"5px 12px",fontFamily:"var(--mono)",fontSize:9,color:"#e8341c",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",flexShrink:0,marginLeft:12}}>UNDO</button>
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:2,background:"rgba(232,52,28,0.2)"}}>
            <div style={{background:"#e8341c",height:"100%",width:`${undoProgress}%`,transition:"width 5s linear"}}/>
          </div>
        </div>
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
          recentMeals={qlRecentMeals}
          slotTargets={getSlotTargets(macros.calories,mealSlots,skippedSlots||[],getLoggedSlots(log),slotOverages||{})}
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
            {/* VIEW TOGGLE — Macro Ring / Body Budget */}
            <div style={{display:"flex",gap:2,background:"rgba(255,255,255,.04)",borderRadius:10,padding:2,alignSelf:"flex-start"}}>
              {[["ring","Macro Ring"],["budget","Body Budget"]].map(([id,label])=>(
                <button key={id} onClick={()=>{const wp={...wPrefs,fuelView:id};setWPrefs(wp);saveSettings(wp,null);}}
                  style={{padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"var(--mono)",fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",transition:"all 0.15s",
                  background:(id==="ring"?!useBudgetView:useBudgetView)?"var(--navy-light)":"transparent",
                  color:(id==="ring"?!useBudgetView:useBudgetView)?"#fff":"rgba(245,245,240,.4)"}}>
                  {label}
                </button>
              ))}
            </div>
            {/* MAIN CARD — ring + macros */}
            {/* BODY BUDGET or MACRO RING */}
            {useBudgetView?(
              <div className="hero-card" style={{padding:isMobile?"18px 16px":"24px 28px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div>
                    <div style={{fontFamily:"var(--mono)",fontSize:9,color:T.prot,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:4}}>// TODAY'S BODY BUDGET</div>
                    <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontSize:24,fontWeight:900,lineHeight:1}}>{macros.calories.toLocaleString()} kcal</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:10,color:T.mu,letterSpacing:2,textTransform:"uppercase",marginBottom:2}}>Starting</div>
                    <div style={{fontSize:11,color:"rgba(245,245,240,.6)"}}>balance</div>
                  </div>
                </div>
                {/* Ledger */}
                <div style={{display:"flex",flexDirection:"column",gap:1,marginBottom:14}}>
                  {todayActs.filter(a=>a.calories>0).map((a,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:"rgba(52,211,153,0.07)",borderRadius:8,border:"1px solid rgba(52,211,153,0.15)"}}>
                      <span style={{fontSize:13,color:"rgba(245,245,240,.8)"}}>{a.title||a.type} earned</span>
                      <span style={{fontSize:14,fontWeight:700,color:T.green}}>+{a.calories} kcal</span>
                    </div>
                  ))}
                  {log.length===0&&(
                    <div style={{padding:"16px 12px",border:`1px dashed rgba(245,245,240,0.1)`,borderRadius:10,textAlign:"center"}}>
                      <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:18,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",marginBottom:6}}>TAP + TO LOG YOUR FIRST MEAL<span style={{color:"#e8341c"}}>.</span></div>
                      <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.25)",letterSpacing:"0.1em",animation:"fuelBounce 1.2s ease-in-out infinite",display:"inline-block"}}>↓</div>
                    </div>
                  )}
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
                    <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontSize:isMobile?40:48,fontWeight:900,color:remaining.calories<0?T.prot:"#fff",lineHeight:1}}>{remaining.calories.toLocaleString()}</div>
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
              (()=>{
                /* ── SIMPLIFIED HERO RING ── */
                const circ = parseFloat((2 * Math.PI * 68).toFixed(1));
                const calRemaining = Math.max(0, remaining.calories);
                const calOver = remaining.calories < 0;
                const calPct = macros.calories > 0 ? Math.min(1, consumed.calories / macros.calories) : 0;
                const fillLen = parseFloat((calPct * circ).toFixed(1));
                const ringColor = calOver ? '#e8341c' : remaining.calories < macros.calories * 0.15 ? '#FEA020' : '#22c55e';
                const proteinHit = consumed.protein >= macros.protein * 0.95;
                const pctP = macros.protein > 0 ? Math.min(100, Math.round(consumed.protein / macros.protein * 100)) : 0;
                const pctC = macros.carbs > 0 ? Math.min(100, Math.round(consumed.carbs / macros.carbs * 100)) : 0;
                const pctF = macros.fat > 0 ? Math.min(100, Math.round(consumed.fat / macros.fat * 100)) : 0;
                const isBeginner = (wPrefs?.liftExp || profile?.liftExp || 'beginner').toLowerCase() === 'beginner';

                if (ringExpanded) {
                  // Full expanded view (original ring + macro bars)
                  const circFull = parseFloat((2 * Math.PI * 84).toFixed(1));
                  const calPctFull = macros.calories > 0 ? Math.min(1, consumed.calories / macros.calories) : 0;
                  const fillLenFull = parseFloat((calPctFull * circFull).toFixed(1));
                  const pctPx = macros.protein > 0 ? Math.min(100, Math.round(consumed.protein / macros.protein * 100)) : 0;
                  const pctCx = macros.carbs > 0 ? Math.min(100, Math.round(consumed.carbs / macros.carbs * 100)) : 0;
                  const pctFx = macros.fat > 0 ? Math.min(100, Math.round(consumed.fat / macros.fat * 100)) : 0;
                  const remPx = Math.max(0, Math.round(macros.protein - consumed.protein));
                  const remCx = Math.max(0, Math.round(macros.carbs - consumed.carbs));
                  const remFx = Math.max(0, Math.round(macros.fat - consumed.fat));
                  return (
                    <div onClick={() => setRingExpanded(false)} style={{ cursor: 'pointer' }}>
                      <style>{`
                        @keyframes fuelRingSweep{from{stroke-dashoffset:${circFull}}to{stroke-dashoffset:${(circFull - fillLenFull).toFixed(1)}}}
                        @keyframes fuelBarP{from{width:0}to{width:${pctPx}%}}
                        @keyframes fuelBarC{from{width:0}to{width:${pctCx}%}}
                        @keyframes fuelBarF{from{width:0}to{width:${pctFx}%}}
                        @keyframes fuelBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
                      `}</style>
                      <div style={{display:"flex",justifyContent:"center",padding:"8px 0 4px"}}>
                        <div style={{position:"relative",width:200,height:200}}>
                          <svg width="200" height="200" viewBox="0 0 200 200" style={{transform:"rotate(-90deg)",filter:"drop-shadow(0 0 24px rgba(232,52,28,0.18))"}}>
                            <defs><linearGradient id="fuelRingGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#e8341c"/><stop offset="100%" stopColor="#c42d18"/></linearGradient></defs>
                            <circle cx="100" cy="100" r="84" fill="none" stroke="rgba(245,245,240,0.08)" strokeWidth="16"/>
                            <circle cx="100" cy="100" r="84" fill="none" stroke="url(#fuelRingGrad)" strokeWidth="16" strokeLinecap="round" strokeDasharray={circFull} strokeDashoffset={circFull - fillLenFull} style={{animation:"fuelRingSweep 0.8s cubic-bezier(.2,.7,.3,1) both"}}/>
                          </svg>
                          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",pointerEvents:"none"}}>
                            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:50,lineHeight:1,letterSpacing:"-0.02em",color:remaining.calories<0?T.prot:"#fff"}}>{consumed.calories.toLocaleString()}</div>
                            <div style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:"0.14em",color:"var(--white-dim)",marginTop:6,textTransform:"uppercase"}}>of {macros.calories.toLocaleString()} kcal</div>
                            <div style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.4)",marginTop:4,letterSpacing:"0.1em"}}>{Math.max(0,remaining.calories).toLocaleString()} remaining</div>
                          </div>
                        </div>
                      </div>
                      <div style={{textAlign:"center",fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.3)",marginBottom:12,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>↑ COLLAPSE</div>
                      <div>
                        {[{label:"Protein",c:consumed.protein,t:macros.protein,pct:pctPx,rem:remPx,anim:"fuelBarP",delay:"0.1s",fill:"linear-gradient(90deg,rgba(96,165,250,0.7),#60a5fa)",glow:"0 0 8px rgba(96,165,250,0.5)"},{label:"Carbs",c:consumed.carbs,t:macros.carbs,pct:pctCx,rem:remCx,anim:"fuelBarC",delay:"0.2s",fill:"linear-gradient(90deg,rgba(34,197,94,0.7),#22c55e)",glow:"0 0 8px rgba(34,197,94,0.5)"},{label:"Fat",c:consumed.fat,t:macros.fat,pct:pctFx,rem:remFx,anim:"fuelBarF",delay:"0.3s",fill:"linear-gradient(90deg,rgba(245,158,11,0.7),#f59e0b)",glow:"0 0 8px rgba(245,158,11,0.5)"}].map(({label,c,t,pct,rem,anim,delay,fill,glow})=>(
                          <div key={label} style={{marginBottom:14}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:7}}><span style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:"0.14em",color:"var(--white)",textTransform:"uppercase",fontWeight:500}}>// {label}</span><span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--white)"}}>{Math.round(c)}<span style={{color:"rgba(245,245,240,0.4)"}}>/{Math.round(t)}g</span></span></div>
                            <div style={{height:8,background:"rgba(245,245,240,0.08)",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,borderRadius:4,background:fill,boxShadow:glow,animation:`${anim} 0.8s cubic-bezier(.2,.7,.3,1) ${delay} both`}}/></div>
                            <div style={{fontFamily:"var(--mono)",fontSize:"9.5px",color:"rgba(245,245,240,0.65)",letterSpacing:"0.08em",marginTop:6}}>{pct}% · {rem}g remaining</div>
                          </div>
                        ))}
                        {macros.isFlexDay&&<div style={{marginTop:6,background:"rgba(245,158,11,.07)",border:"1px solid rgba(245,158,11,.2)",borderRadius:8,padding:"8px 10px",fontSize:11,color:"rgba(245,158,11,.9)",lineHeight:1.6}}>Hit your protein ({macros.protein}g) and enjoy the rest today. Your weekday deficit has you covered.</div>}
                        {!macros.isFlexDay&&(macros.flexDeficit||0)>0&&flexOn&&<div style={{marginTop:6,background:"rgba(255,255,255,.04)",borderRadius:8,padding:"8px 10px",fontSize:11,color:"rgba(245,245,240,.4)",lineHeight:1.6}}>−{macros.flexDeficit} kcal today covers your flex days</div>}
                      </div>
                    </div>
                  );
                }

                // COLLAPSED HERO
                return (
                  <>
                    <style>{`
                      @keyframes fuelRingSweepS{from{stroke-dashoffset:${circ}}to{stroke-dashoffset:${(circ - fillLen).toFixed(1)}}}
                      @keyframes fuelBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
                    `}</style>

                    {/* Hero Ring */}
                    <div onClick={() => setRingExpanded(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, paddingBottom: 4, cursor: 'pointer' }}>
                      <div style={{ position: 'relative', width: 160, height: 160 }}>
                        <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(245,245,240,0.07)" strokeWidth="12"/>
                          <circle cx="80" cy="80" r="68" fill="none" stroke={ringColor} strokeWidth="12" strokeLinecap="round"
                            strokeDasharray={circ} strokeDashoffset={circ - fillLen}
                            style={{ animation: 'fuelRingSweepS 0.8s cubic-bezier(.2,.7,.3,1) both', transition: 'stroke 0.4s' }}
                          />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', pointerEvents: 'none' }}>
                          <div style={{ fontFamily: 'var(--condensed)', fontStyle: 'italic', fontWeight: 900, fontSize: 36, lineHeight: 1, color: calOver ? '#e8341c' : '#f5f5f0', letterSpacing: '-0.02em' }}>
                            {calOver ? `+${Math.abs(remaining.calories)}` : calRemaining.toLocaleString()}
                          </div>
                          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, color: 'rgba(245,245,240,0.4)', marginTop: 5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                            {calOver ? 'OVER TARGET' : (isBeginner ? 'CALORIES LEFT' : 'KCAL REMAINING')}
                          </div>
                        </div>
                      </div>

                      {/* Thin P/C/F bar */}
                      <div style={{ width: 160, marginTop: 10 }}>
                        <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', gap: 1 }}>
                          <div style={{ flex: pctP, background: proteinHit ? '#22c55e' : '#e8341c', borderRadius: '2px 0 0 2px', transition: 'flex 0.5s' }} />
                          <div style={{ flex: pctC, background: '#FEA020', transition: 'flex 0.5s' }} />
                          <div style={{ flex: pctF, background: '#60a5fa', borderRadius: '0 2px 2px 0', transition: 'flex 0.5s' }} />
                          <div style={{ flex: Math.max(0, 300 - pctP - pctC - pctF), background: 'rgba(245,245,240,0.06)' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 7, color: proteinHit ? '#22c55e' : 'rgba(245,245,240,0.4)', letterSpacing: '0.08em' }}>
                            Protein {Math.round(consumed.protein)}g{proteinHit ? ' ✓' : ''}
                          </div>
                          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 7, color: 'rgba(245,245,240,0.4)', letterSpacing: '0.08em' }}>
                            Carbs {Math.round(consumed.carbs)}g
                          </div>
                          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 7, color: 'rgba(245,245,240,0.4)', letterSpacing: '0.08em' }}>
                            Fat {Math.round(consumed.fat)}g
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 6, fontFamily: 'DM Mono, monospace', fontSize: 7, color: 'rgba(245,245,240,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          TAP FOR BREAKDOWN ↓
                        </div>
                      </div>
                    </div>

                    {/* Meal rows */}
                    <div style={{ marginTop: 16, borderTop: '1px solid rgba(245,245,240,0.05)' }}>
                      {log.length === 0 ? (
                        <div style={{ padding: '20px 0', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'var(--condensed)', fontStyle: 'italic', fontWeight: 900, fontSize: 18, color: 'rgba(245,245,240,0.3)', textTransform: 'uppercase', marginBottom: 6 }}>
                            TAP + TO LOG YOUR FIRST MEAL<span style={{ color: '#e8341c' }}>.</span>
                          </div>
                          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'rgba(245,245,240,0.2)', animation: 'fuelBounce 1.2s ease-in-out infinite', display: 'inline-block' }}>↓</div>
                        </div>
                      ) : (
                        log.slice(0, 8).map((entry, i) => (
                          <div key={entry.id || i} style={{
                            display: 'flex', alignItems: 'center',
                            padding: '12px 0',
                            borderBottom: '1px solid rgba(245,245,240,0.05)',
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: 'var(--condensed)', fontSize: 15, color: '#f5f5f0', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.food}</div>
                              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, color: 'rgba(245,245,240,0.35)', marginTop: 2, letterSpacing: '0.08em' }}>
                                {entry.calories} kcal · {entry.protein}g P · {entry.carbs}g C · {entry.fat}g F
                              </div>
                            </div>
                            <button onClick={() => removeLog(entry.id)} style={{ marginLeft: 12, width: 24, height: 24, borderRadius: '50%', background: 'rgba(245,245,240,0.06)', border: '1px solid rgba(245,245,240,0.1)', color: 'rgba(245,245,240,0.35)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
                          </div>
                        ))
                      )}
                      {log.length > 8 && (
                        <div style={{ padding: '10px 0', fontFamily: 'DM Mono, monospace', fontSize: 8, color: 'rgba(245,245,240,0.3)', textAlign: 'center', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          + {log.length - 8} more entries
                        </div>
                      )}

                      {/* Water row */}
                      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(245,245,240,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                          <span style={{ fontSize: 14 }}>💧</span>
                          <div>
                            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'rgba(245,245,240,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>WATER</div>
                            <div style={{ fontFamily: 'var(--condensed)', fontSize: 15, color: '#f5f5f0', fontWeight: 700, marginTop: 1 }}>
                              {waterLogs?.length || 0} / {waterTarget || 8} glasses
                            </div>
                          </div>
                        </div>
                        <button onClick={() => onAddWater?.({ amount_oz: 8 })} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(232,52,28,0.15)', border: '1px solid rgba(232,52,28,0.3)', color: '#e8341c', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, lineHeight: 1 }}>+</button>
                      </div>

                      {/* Log food button */}
                      <div style={{ paddingTop: 12 }}>
                        <button onClick={() => setFuelScreen("log")} style={{ width: '100%', padding: '13px 0', background: 'transparent', border: '1px solid rgba(232,52,28,0.3)', borderRadius: 12, fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#e8341c', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer' }}>
                          + LOG FOOD
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()
            )}

            {/* METABOLIC RESET PROGRESS */}
            {metabolicProtocol?.progress&&(
              <MetabolicResetProgressCard
                progress={metabolicProtocol.progress}
                onComplete={metabolicProtocol.onComplete}
              />
            )}

            {/* NUTRITION PERIODIZATION */}
            {periodizationInfo&&(
              <div style={{background:"linear-gradient(135deg, rgba(232,52,28,0.08), var(--navy-mid))",border:"1px solid rgba(232,52,28,0.25)",borderRadius:16,padding:"14px 18px"}}>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:T.prot,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:6}}>// Nutrition Periodization</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontSize:18,fontWeight:900,color:"var(--red)",letterSpacing:"0.04em",textTransform:"uppercase"}}>Week {periodizationInfo.cycleWeek} — {periodizationInfo.phase}</div>
                  <div style={{display:"flex",gap:3}}>
                    {Array.from({length:8}).map((_,i)=>(
                      <div key={i} style={{width:6,height:6,borderRadius:"50%",background:i<(periodizationInfo.cycleWeek||1)?"var(--red)":"rgba(245,245,240,0.12)",flexShrink:0}}/>
                    ))}
                  </div>
                </div>
                <div style={{fontSize:13,color:"rgba(245,245,240,.8)",lineHeight:1.55}}>{periodizationInfo.note}</div>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,.35)",marginTop:6,letterSpacing:"0.1em"}}>WEEKS {periodizationInfo.wks}</div>
              </div>
            )}

            {/* NUTRITION PERIODISATION PROTOCOL */}
            {todayProtocol&&todayProtocol.protocol_type!=="standard"&&(()=>{
              const typeMap={
                refeed:{label:"REFEED DAY",icon:"🔄",color:"#f59e0b",comment:"// Leptin reset · metabolism boost"},
                carb_load:{label:"CARB LOADING",icon:"⚡",color:"#3b82f6",comment:"// Race tomorrow · top up glycogen"},
                race_day:{label:"RACE DAY",icon:"🏁",color:"#e8341c",comment:"// High carbs · low fat · race ready"},
                training_day:{label:"TRAINING DAY",icon:"💪",color:"#22c55e",comment:"// Extra fuel · performance calories"},
                rest_day:{label:"REST DAY",icon:"🛋️",color:"rgba(245,245,240,0.4)",comment:"// Recovery focus · base calories"},
              };
              const meta=typeMap[todayProtocol.protocol_type]||typeMap.training_day;
              const calDiff=todayProtocol.adjusted_calories-todayProtocol.base_calories;
              const carbDiff=todayProtocol.adjusted_carbs_g-todayProtocol.base_carbs_g;
              return(
                <div style={{background:`${meta.color}10`,border:`1.5px solid ${meta.color}30`,borderRadius:16,padding:"14px 18px"}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:9,color:meta.color,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:6}}>{meta.comment}</div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{fontSize:22}}>{meta.icon}</div>
                    <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontSize:18,fontWeight:900,color:meta.color,letterSpacing:"0.04em",textTransform:"uppercase"}}>{meta.label}</div>
                  </div>
                  <div style={{fontSize:13,color:"rgba(245,245,240,0.8)",lineHeight:1.55,marginBottom:10}}>{todayProtocol.reason}</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <div style={{fontSize:11,fontWeight:700,background:`${meta.color}18`,color:meta.color,borderRadius:8,padding:"4px 10px"}}>{todayProtocol.adjusted_calories} kcal{calDiff>0?` (+${calDiff})`:calDiff<0?` (${calDiff})`:""}</div>
                    <div style={{fontSize:11,fontWeight:700,background:`${meta.color}18`,color:meta.color,borderRadius:8,padding:"4px 10px"}}>{todayProtocol.adjusted_protein_g}g protein</div>
                    <div style={{fontSize:11,fontWeight:700,background:`${meta.color}18`,color:meta.color,borderRadius:8,padding:"4px 10px"}}>{todayProtocol.adjusted_carbs_g}g carbs{carbDiff>0?` (+${carbDiff})`:carbDiff<0?` (${carbDiff})`:""}</div>
                    <div style={{fontSize:11,fontWeight:700,background:`${meta.color}18`,color:meta.color,borderRadius:8,padding:"4px 10px"}}>{todayProtocol.adjusted_fat_g}g fat</div>
                  </div>
                </div>
              );
            })()}

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
              <div style={{background:"rgba(245,158,11,.06)",border:"1.5px solid rgba(245,158,11,.25)",borderRadius:14,padding:"12px 16px"}}>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--amber)",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:4}}>// PCOS NUTRITION</div>
                <div style={{fontSize:12,color:T.mu,lineHeight:1.65,marginBottom:8}}>{PCOS_NOTE}</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {PCOS_FOODS.map(f=><span key={f} style={{fontSize:10,fontWeight:700,background:"rgba(245,158,11,.12)",color:"var(--amber)",borderRadius:5,padding:"2px 7px"}}>{f}</span>)}
                </div>
              </div>
            )}

            {/* PERIMENOPAUSE / MENOPAUSE NUTRITION (Part 8) */}
            {(profile?.lifeStage==="perimenopause"||profile?.lifeStage==="menopause")&&(()=>{
              const mn=profile.lifeStage==="menopause"?MENO_NUTRITION:PERI_NUTRITION;
              return(
                <div style={{background:"rgba(52,211,153,.06)",border:"1.5px solid rgba(52,211,153,.2)",borderRadius:14,padding:"14px 18px"}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:9,color:T.green,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:6}}>
                    {profile.lifeStage==="menopause"?"// MENOPAUSE NUTRITION":"// PERIMENOPAUSE NUTRITION"}
                  </div>
                  <div style={{fontSize:12,color:T.mu,lineHeight:1.65,marginBottom:10}}>{mn.note}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <div style={{fontFamily:"var(--mono)",fontSize:9,color:T.green,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:5}}>Calcium sources</div>
                      {mn.calcium.map(f=><div key={f} style={{fontSize:11,color:T.mu,marginBottom:2}}>• {f}</div>)}
                    </div>
                    <div>
                      <div style={{fontFamily:"var(--mono)",fontSize:9,color:T.green,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:5}}>Omega-3 sources</div>
                      {mn.omega3.map(f=><div key={f} style={{fontSize:11,color:T.mu,marginBottom:2}}>• {f}</div>)}
                    </div>
                  </div>
                  <div style={{background:"rgba(245,245,240,0.04)",border:"1px solid rgba(245,245,240,0.08)",borderRadius:9,padding:"10px 12px",marginTop:12,display:"flex",gap:8,alignItems:"flex-start"}}>
                    <div><div style={{fontSize:11,color:"var(--white-dim)",lineHeight:1.6}}>A gynecologist or endocrinologist can help optimize your hormone and nutrition strategy during this transition.</div><a href="https://coach-macro.com/support" style={{fontSize:10,color:"var(--red)",textDecoration:"none",letterSpacing:".06em",display:"inline-block",marginTop:3}}>Talk to a professional →</a></div>
                  </div>
                </div>
              );
            })()}

            {/* MACRO MEMORY */}
            {wPrefs?.macroMemory!==false&&memorySuggestions.filter(s=>!skippedMemory.has(s.data.food)).length>0&&(
              <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div>
                    <div style={{fontFamily:"var(--condensed)",fontSize:18,fontWeight:900,letterSpacing:.5}}>MACRO MEMORY</div>
                    <div style={{fontSize:11,color:T.mu,marginTop:2}}>Based on your {new Date().toLocaleDateString("en-US",{weekday:"long"})} patterns</div>
                  </div>
                  {memoryLoggedMsg&&<div style={{fontSize:11,color:T.green,fontWeight:700}}>{memoryLoggedMsg}</div>}
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

            {/* PERFORMANCE NUTRITION PATTERNS */}
            {perfCorrelations&&perfCorrelations.length>=2&&(
              <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                <div style={{fontFamily:"var(--condensed)",fontSize:18,fontWeight:900,letterSpacing:.5,marginBottom:2}}>NUTRITION × PERFORMANCE</div>
                <div style={{fontSize:11,color:T.mu,marginBottom:14}}>Your average intake before each session type · last 28 days</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {perfCorrelations.sort((a,b)=>b.count-a.count).slice(0,3).map(c=>(
                    <div key={c.session_type} style={{background:T.s2,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,textTransform:"capitalize",color:"#fff",marginBottom:2}}>{c.session_type}</div>
                        <div style={{fontSize:10,color:T.mu}}>{c.count} sessions tracked</div>
                      </div>
                      <div style={{display:"flex",gap:12,textAlign:"right"}}>
                        <div><div style={{fontSize:15,fontWeight:900,color:"#fff"}}>{c.avg_calories}</div><div style={{fontSize:9,color:T.mu,letterSpacing:".06em"}}>KCAL</div></div>
                        <div><div style={{fontSize:15,fontWeight:900,color:T.prot}}>{c.avg_protein}g</div><div style={{fontSize:9,color:T.mu,letterSpacing:".06em"}}>PROT</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COACH SUGGESTS */}
            {remaining.calories>200&&(
              <div style={{background:"linear-gradient(135deg,rgba(232,52,28,0.12),var(--navy-mid))",border:"1px solid rgba(232,52,28,0.3)",borderRadius:16,padding:"16px 18px"}}>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:T.prot,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>// Coach Suggests</div>
                {bodySuggest
                  ?(<div style={{fontStyle:"italic",fontSize:13,color:"rgba(245,245,240,.85)",lineHeight:1.65,marginBottom:12}}>"{bodySuggest}"</div>)
                  :(<div style={{marginBottom:12}}>
                      <div style={{fontSize:13,color:"rgba(245,245,240,.6)",lineHeight:1.55,marginBottom:8}}>You have {remaining.calories} kcal · {remaining.protein}g protein left. Get a smart suggestion for your next meal.</div>
                      <button onClick={fetchBodySuggest} disabled={bodySuggestLoading} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"var(--mono)",fontSize:10,color:T.prot,fontWeight:700,letterSpacing:"0.1em",padding:0}}>{bodySuggestLoading?"Getting suggestion...":"Get AI suggestion →"}</button>
                    </div>)
                }
                <div style={{display:"flex",gap:8}}>
                  {bodySuggest&&<button onClick={()=>setFuelScreen("log")} style={{flex:2,padding:"11px",background:"var(--red)",color:"#fff",border:"none",borderRadius:10,fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:700,fontSize:13,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>Log It</button>}
                </div>
              </div>
            )}

            {/* WEEKEND FLEX MODE */}
            <div style={{background:T.s1,border:`1px solid ${macros.isFlexDay?"rgba(245,158,11,.3)":T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:flexOn?14:0}}>
                <div>
                  <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontSize:14,fontWeight:900,letterSpacing:"0.08em",color:flexOn?"var(--amber)":"rgba(245,245,240,0.65)",textTransform:"uppercase",marginBottom:flexOn?3:0}}>Weekend Flex</div>
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
                    const dayColor=isToday?"var(--red)":isFlex?"var(--amber)":"rgba(245,245,240,.4)";
                    const dayLabel=isFlex?"F":schedType==="training"?"T":(schedType==="cardio"||schedType==="run"||schedType==="hyrox")?"R":"—";
                    return(
                      <button key={day} onClick={()=>setDayModal(day)}
                        style={{background:isToday?"rgba(232,52,28,.12)":isFlex?"rgba(245,158,11,.08)":"rgba(255,255,255,.03)",border:`1.5px solid ${isToday?"rgba(232,52,28,.5)":isFlex?"rgba(245,158,11,.4)":"rgba(255,255,255,.08)"}`,borderRadius:10,padding:"8px 4px",textAlign:"center",cursor:"pointer",fontFamily:"inherit"}}>
                        <div style={{fontSize:9,fontWeight:700,color:dayColor,marginBottom:3,letterSpacing:1}}>{day}</div>
                        <div style={{fontFamily:"var(--mono)",fontSize:10,fontWeight:700,color:dayColor}}>{dayLabel}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PER-DAY MODAL */}
            {dayModal&&(
              <div style={{position:"fixed",inset:0,background:"rgba(6,13,26,.88)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setDayModal(null)}>
                <div style={{background:"#0d0d0d",border:"1px solid rgba(255,255,255,.12)",borderRadius:"18px 18px 0 0",padding:"24px 20px 40px",maxWidth:480,width:"100%"}} onClick={e=>e.stopPropagation()}>
                  <div style={{width:32,height:3,background:"rgba(255,255,255,.15)",borderRadius:2,margin:"0 auto 20px"}}/>
                  <div style={{fontSize:10,color:"rgba(245,245,240,.4)",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:6}}>DAY SETTINGS</div>
                  <div style={{fontFamily:"var(--condensed)",fontSize:22,fontWeight:900,marginBottom:20}}>{DAY_NAMES[dayModal]||dayModal}</div>
                  <div style={{display:"flex",gap:8,marginBottom:24}}>
                    {[["T","Training","training"],["—","Rest","rest"],["F","Flex","flex"]].map(([abbr,label,type])=>{
                      const isFlex=type==="flex";
                      const isSelected=isFlex?flexDays.includes(dayModal):(!flexDays.includes(dayModal)&&(schedule?.[dayModal]||"rest")===type);
                      return(
                        <button key={type} onClick={()=>{if(type==="flex")toggleFlexDay(dayModal);else setDayTypeInSchedule(dayModal,type);setDayModal(null);}}
                          style={{flex:1,padding:"14px 8px",background:isSelected?(isFlex?"rgba(245,158,11,.15)":"rgba(232,52,28,.12)"):"rgba(255,255,255,.04)",border:`1.5px solid ${isSelected?(isFlex?"rgba(245,158,11,.5)":"rgba(232,52,28,.5)"):"rgba(255,255,255,.08)"}`,borderRadius:10,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
                          <div style={{fontFamily:"var(--mono)",fontSize:16,fontWeight:700,color:isSelected?(isFlex?"var(--amber)":"var(--red)"):"rgba(245,245,240,.25)",marginBottom:4}}>{abbr}</div>
                          <div style={{fontSize:12,fontWeight:700,color:isSelected?(isFlex?"var(--amber)":"var(--red)"):"rgba(245,245,240,.5)"}}>{label}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{fontSize:12,color:"rgba(245,245,240,.35)",lineHeight:1.8,marginBottom:20}}>
                    <span style={{color:"var(--red)"}}>Training</span> = higher carbs for workout fuel<br/>
                    <span style={{color:"rgba(245,245,240,.5)"}}>Rest</span> = standard lower calories<br/>
                    <span style={{color:"rgba(245,158,11,.8)"}}>Flex</span> = +{flexPct}% calories, protein stays fixed
                  </div>
                  <button onClick={()=>setDayModal(null)} style={{width:"100%",padding:13,background:"transparent",color:"rgba(245,245,240,.4)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Done</button>
                </div>
              </div>
            )}

            {/* QUICK ACTIONS */}
            <div style={{marginBottom:2}}>
              <div className="header-eyebrow">// Quick Log</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {[
                ["Food", ()=>setShowQuickLog(true),
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2s-2 2-2 5a2 2 0 004 0c0-3-2-5-2-5z"/><path d="M17 3v4a5 5 0 01-10 0V3"/><path d="M7 14v8m10-8v8"/></svg>],
                ["Recipes", ()=>setFuelScreen("kitchen"),
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 2h12a1 1 0 011 1v18a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="12" y2="15"/></svg>],
              ].map(([label, action, icon])=>(
                <button key={label} onClick={action} style={{padding:"14px 6px 12px",background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:14,cursor:"pointer",textAlign:"center",transition:"all .15s",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                  <div style={{width:40,height:40,borderRadius:12,background:"rgba(232,52,28,0.1)",border:"1px solid rgba(232,52,28,0.18)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--red)"}}>
                    {icon}
                  </div>
                  <div style={{fontFamily:"var(--mono)",fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(245,245,240,0.65)",lineHeight:1}}>{label}</div>
                </button>
              ))}
            </div>

            {/* MEAL PREP CARD */}
            <button onClick={()=>setFuelScreen("kitchen")} style={{width:"100%",background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:16,padding:"16px 20px",cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:16}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--amber)",fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:4}}>// Meal Prep</div>
                <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontSize:18,fontWeight:900,color:"#fff",textTransform:"uppercase",marginBottom:4}}>Weekly Prep</div>
                <div style={{fontSize:12,color:"rgba(245,245,240,0.5)",lineHeight:1.5}}>{prepPlan?"View your weekly prep plan · proteins, carbs, veggies + grocery list":"Generate your weekly meal prep plan based on your training schedule"}</div>
              </div>
              <div style={{color:"var(--amber)",flexShrink:0}}>
                <svg width={18} height={18} viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              </div>
            </button>

            {/* ── POWERED BY COACH MACRO STRIP ── */}
            <FeatureStrip
              tab="fuel"
              onNavigate={(screen) => setFuelScreen(screen)}
              onPhoto={() => onOpenPhotoLogger?.()}
              onBarcode={() => { setFuelScreen("log"); setLogMode("barcode"); }}
            />

            {/* WATER TRACKER */}
            {waterTarget>0&&(
              <>
              <div className="header-eyebrow">// Hydration</div>
              <WaterTracker
                waterLogs={waterLogs||[]}
                waterTarget={waterTarget}
                onAddWater={onAddWater}
                onDeleteWater={onDeleteWater}
                bottleSize={profile?.water_bottle_size||16}
                isMobile={isMobile}
              />
              </>
            )}

            {/* FOOD LOG — grouped by meal slots */}
            {(()=>{
              const lSlots=getLoggedSlots(log);
              const slotTargets=getSlotTargets(macros.calories,mealSlots,skippedSlots||[],lSlots,slotOverages||{});
              const basePerSlot=Math.round(macros.calories/mealSlots.length);
              return(
                <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                  {(()=>{
                    const f=profile?.fasting||profile?.profile_data?.fasting;
                    if(!f||f==="no")return null;
                    const windowLabel=f==="16:8"?"8h eating window":f==="omad"?"OMAD — 1 meal":f==="custom"?`${Math.max(1,24-fastHours)}h eating window`:"Fasting active";
                    return<div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(96,165,250,0.6)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>{windowLabel}</div>;
                  })()}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div>
                      <div className="header-eyebrow" style={{marginBottom:2}}>// Today's Meals</div>
                      <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:18,textTransform:"uppercase",lineHeight:1}}>Food Log</div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={addMealSlot} style={{background:"rgba(232,52,28,0.1)",border:"1px dashed rgba(232,52,28,0.4)",color:T.prot,borderRadius:10,padding:"7px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"var(--condensed)",textTransform:"uppercase",letterSpacing:"0.1em"}}>+ Meal</button>
                      <button onClick={()=>setShowQuickLog(true)} style={{background:"rgba(232,52,28,0.1)",border:"1px dashed rgba(232,52,28,0.4)",color:"#e8341c",borderRadius:10,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"var(--condensed)",textTransform:"uppercase",letterSpacing:"0.1em"}}>+ Food</button>
                    </div>
                  </div>
                  <div>
                    {mealSlots.map((slot,si)=>{
                      const isSkipped=(skippedSlots||[]).includes(slot);
                      const slotItems=log.filter(e=>getEntrySlot(e)===slot);
                      const slotCals=slotItems.reduce((s,e)=>s+(e.calories||0),0);
                      const target=slotTargets[slot]||0;
                      const hasRedistributed=!isSkipped&&(skippedSlots||[]).length>0&&!lSlots.includes(slot)&&target>basePerSlot;
                      const hasOverageReduction=!isSkipped&&!lSlots.includes(slot)&&Object.keys(slotOverages||{}).some(k=>parseInt(k)!==slot);
                      return(
                        <div key={slot} style={{marginBottom:12,opacity:isSkipped?0.4:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:slotItems.length>0?6:4}}>
                            <span style={{fontFamily:"var(--mono)",fontSize:9,fontWeight:700,color:isSkipped?"rgba(245,245,240,0.4)":"#f5f5f0",letterSpacing:"0.12em",textTransform:"uppercase"}}>{getSlotLabel(slot)}</span>
                            <div style={{flex:1,height:1,background:"rgba(255,255,255,0.05)"}}/>
                            {isSkipped?(
                              <span style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.3)",letterSpacing:"0.08em"}}>SKIPPED</span>
                            ):(
                              <span style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.5)",letterSpacing:"0.06em"}}>
                                {slotCals} / {target} kcal
                                {hasRedistributed&&(
                                  <span onClick={()=>setTooltipSlot(tooltipSlot===slot?null:slot)} style={{color:"#FEA020",cursor:"pointer",marginLeft:4}}>↑</span>
                                )}
                                {hasOverageReduction&&!hasRedistributed&&(
                                  <span onClick={()=>setTooltipSlot(tooltipSlot===slot?null:slot)} style={{color:"#e8341c",cursor:"pointer",marginLeft:4}}>↓</span>
                                )}
                              </span>
                            )}
                            {!isSkipped&&(
                              <button onClick={()=>handleSetActiveSlot(slot,true)} style={{background:"rgba(232,52,28,0.1)",border:"1px solid rgba(232,52,28,0.3)",color:"#e8341c",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",lineHeight:1.4}}>+</button>
                            )}
                            {mealSlots.length>1&&!isSkipped&&(
                              <button onClick={()=>removeSlot(si)} style={{background:"none",border:"none",color:"rgba(245,245,240,0.2)",cursor:"pointer",fontSize:12,padding:"0 2px",lineHeight:1}}>×</button>
                            )}
                          </div>
                          {tooltipSlot===slot&&hasRedistributed&&(
                            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.5)",marginBottom:6,padding:"4px 8px",background:"rgba(254,160,32,0.1)",border:"1px solid rgba(254,160,32,0.25)",borderRadius:6}}>Includes calories from skipped meals</div>
                          )}
                          {tooltipSlot===slot&&hasOverageReduction&&!hasRedistributed&&(
                            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.5)",marginBottom:6,padding:"4px 8px",background:"rgba(232,52,28,0.08)",border:"1px solid rgba(232,52,28,0.2)",borderRadius:6}}>Reduced due to overage in an earlier meal</div>
                          )}
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
                                className="card-press"
                                onPointerDown={()=>{longPressRef.current=setTimeout(()=>{hap();setContextMenu({item,slot});},500);}}
                                onPointerUp={()=>clearTimeout(longPressRef.current)}
                                onPointerLeave={()=>clearTimeout(longPressRef.current)}
                                style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0"}}
                              >
                                <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
                                  <div style={{width:30,height:30,borderRadius:8,background:T.s2,border:`1px solid ${T.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0,overflow:"hidden"}}>
                                    {item.photo_url
                                      ?<img src={item.photo_url} style={{width:30,height:30,borderRadius:8,objectFit:"cover"}} alt=""/>
                                      :item.method==="photo"?"📸":item.method==="barcode"?"🔲":item.method==="quick"?"✏️":"🧠"}
                                  </div>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontSize:13,fontFamily:"'Barlow',sans-serif",fontWeight:600,textTransform:"capitalize",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.food||item.name}</div>
                                    <div style={{fontSize:10,color:T.mu,marginTop:1,fontFamily:"var(--mono)"}}>
                                      <span style={{color:T.prot}}>P:{item.protein}g</span> · <span style={{color:T.carb}}>C:{item.carbs}g</span> · <span style={{color:T.fat}}>F:{item.fat}g</span>
                                    </div>
                                  </div>
                                </div>
                                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                                  <div style={{textAlign:"right"}}>
                                    <div style={{fontFamily:"var(--mono)",fontSize:14,fontWeight:500,color:"#fff"}}>{item.calories}</div>
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
                    {log.filter(e=>!mealSlots.includes(getEntrySlot(e))).map((item,i,arr)=>(
                      <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<arr.length-1?`1px solid rgba(245,245,240,0.04)`:""}}>
                        <div style={{flex:1,minWidth:0,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.food}</div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                          <div style={{fontFamily:"var(--mono)",fontSize:13}}>{item.calories} kcal</div>
                          <button onClick={()=>removeLog(item.id)} style={{background:T.s2,border:`1px solid ${T.bd}`,color:T.mu,cursor:"pointer",fontSize:13,padding:"4px 8px",borderRadius:6}}>×</button>
                        </div>
                      </div>
                    ))}
                    {log.length===0&&(
                      <EmptyState icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="rgba(245,245,240,.2)" strokeWidth="1.5"/><path d="M8 12h8M12 8v8" stroke="rgba(245,245,240,.3)" strokeWidth="1.5" strokeLinecap="round"/></svg>} title="Nothing logged yet" subtitle="Tap + on any meal slot or use Log Food" actionLabel="Log First Meal" onAction={()=>setFuelScreen("log")}/>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ── MY RECIPES (compact home section) ── */}
            {userRecipes.length>0&&(
              <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(245,245,240,0.65)",fontFamily:"var(--condensed)"}}>My Recipes</div>
                  <button onClick={()=>setFuelScreen("kitchen")} style={{background:"none",border:"none",color:T.prot,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:"0.1em",textTransform:"uppercase",padding:0}}>See All →</button>
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
          <div style={{maxWidth:isMobile?"100%":600,padding:"0 16px"}}>
            <div style={{fontFamily:"var(--condensed)",fontSize:32,fontWeight:900,marginBottom:4}}>LOG FOOD</div>
            {onOpenPhotoLogger&&(
              <button onClick={onOpenPhotoLogger} style={{width:"100%",background:"rgba(232,52,28,0.08)",border:"1.5px solid rgba(232,52,28,0.3)",borderRadius:14,padding:16,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                <div style={{width:44,height:44,borderRadius:10,background:"rgba(232,52,28,0.12)",border:"1px solid rgba(232,52,28,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📷</div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:18,color:"#f5f5f0",textTransform:"uppercase",letterSpacing:"0.02em",lineHeight:1}}>SNAP &amp; LOG<span style={{color:"#e8341c"}}>.</span></div>
                  <div style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.4)",letterSpacing:"0.1em",marginTop:3}}>Point your camera at your plate</div>
                </div>
              </button>
            )}
            {/* ── MEAL SLOT SELECTOR ── */}
            {(()=>{
              const slotCals={};
              mealSlots.forEach(slot=>{
                slotCals[slot]=log.filter(e=>getEntrySlot(e)===slot).reduce((s,e)=>s+(e.calories||0),0);
              });
              return !logSlotConfirmed?(
                <div style={{marginBottom:16}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#e8341c",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>// WHICH MEAL?</div>
                  <div style={{display:"flex",gap:6}}>
                    {mealSlots.map((slot,i)=>{
                      const kcal=slotCals[slot]||0;
                      return(
                        <button key={slot} onClick={()=>{setActiveSlotIdx(i);setLogSlotConfirmed(true);}} style={{flex:1,background:activeSlotIdx===i?"rgba(232,52,28,0.08)":"#0d0d0d",border:`1px solid ${activeSlotIdx===i?"#e8341c":"rgba(232,52,28,0.1)"}`,borderRadius:10,padding:"12px 8px",textAlign:"center",cursor:"pointer",fontFamily:"inherit"}}>
                          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#f5f5f0",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:4}}>{getSlotLabel(slot)}</div>
                          <div style={{fontFamily:"var(--mono)",fontSize:8,color:kcal>0?"rgba(245,245,240,0.4)":"rgba(245,245,240,0.3)"}}>{kcal>0?`${kcal} kcal`:"Empty"}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ):(
                <button onClick={()=>setLogSlotConfirmed(false)} style={{background:"rgba(232,52,28,0.08)",border:"1px solid rgba(232,52,28,0.2)",borderRadius:8,padding:"6px 14px",display:"inline-flex",gap:8,alignItems:"center",marginBottom:14,cursor:"pointer",fontFamily:"inherit"}}>
                  <span style={{fontFamily:"var(--mono)",fontSize:9,color:"#e8341c",letterSpacing:"0.14em",textTransform:"uppercase"}}>ADDING TO {(getSlotLabel(mealSlots[activeSlotIdx])||"MEAL 1").toUpperCase()}</span>
                  <span style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.35)"}}>tap to change</span>
                </button>
              );
            })()}
            {/* ── METHOD TABS ── */}
            {logSlotConfirmed&&(
            <div style={{display:"flex",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:10,padding:3,gap:3,marginBottom:14,overflowX:"auto"}}>
              {[["search","🔍 Search"],["ai","🧠 AI"],["barcode","🔲 Barcode"],["quick","✏️ Quick"],["restaurant","📍 Near Me"]].map(([k,l])=>(
                <button key={k} onClick={()=>{setLogMode(k);if(k==="restaurant")openRestaurantAI();}} style={{flex:1,padding:"10px 4px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",background:logMode===k?`${T.prot}18`:"none",outline:logMode===k?`1.5px solid ${T.prot}`:"none",color:logMode===k?T.prot:T.mu,fontSize:12,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>{l}</button>
              ))}
            </div>
            )}
            {logSlotConfirmed&&logMode==="search"&&<FoodSearchScreen user={user} logEntry={logEntry} mealSlots={mealSlots} activeSlotIdx={activeSlotIdx} setActiveSlotIdx={setActiveSlotIdx} addMealSlot={addMealSlot} setFuelScreen={setFuelScreen} isMobile={isMobile}/>}
            {logSlotConfirmed&&logMode==="restaurant"&&restaurantAI&&(
              <div>
                <div style={{background:"rgba(232,52,28,0.06)",border:"1px solid rgba(232,52,28,0.15)",borderRadius:10,padding:"10px 14px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                  {[
                    {label:"MEAL",value:String(restaurantAI.slot)},
                    {label:"KCAL",value:String(restaurantAI.calTarget)},
                    {label:"PROTEIN",value:`${restaurantAI.proteinTarget}G`,color:"#22c55e"},
                    {label:"CARBS",value:`${restaurantAI.carbTarget}G`},
                    {label:"FAT",value:`${restaurantAI.fatTarget}G`},
                  ].map(({label,value,color})=>(
                    <div key={label} style={{textAlign:"center"}}>
                      <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>{label}</div>
                      <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:16,color:color||"#f5f5f0",lineHeight:1}}>{value}</div>
                    </div>
                  ))}
                </div>
                {raStep==='picker'&&(
                  <div>
                    <div onClick={()=>setRaStep('nearme')} style={{background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.07)",borderRadius:14,padding:18,marginBottom:10,display:"flex",alignItems:"center",gap:14,cursor:"pointer"}}>
                      <div style={{width:48,height:48,borderRadius:10,background:"rgba(232,52,28,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e8341c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:20,color:"#f5f5f0",textTransform:"uppercase",letterSpacing:"0.02em"}}>NEAR ME<span style={{color:"#e8341c"}}>.</span></div>
                        <div style={{fontSize:13,color:"rgba(245,245,240,0.5)",marginTop:4,lineHeight:1.4}}>Find restaurants nearby and get AI recommendations.</div>
                      </div>
                      <div style={{color:"#e8341c",fontFamily:"var(--mono)",fontSize:12,flexShrink:0}}>→</div>
                    </div>
                    <div onClick={()=>menuScanRef.current?.click()} style={{background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.07)",borderRadius:14,padding:18,marginBottom:10,display:"flex",alignItems:"center",gap:14,cursor:"pointer"}}>
                      <div style={{width:48,height:48,borderRadius:10,background:"rgba(96,165,250,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 014 0v2"/><circle cx="12" cy="13" r="3"/></svg>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:20,color:"#f5f5f0",textTransform:"uppercase",letterSpacing:"0.02em"}}>SCAN MENU<span style={{color:"#60a5fa"}}>.</span></div>
                        <div style={{fontSize:13,color:"rgba(245,245,240,0.5)",marginTop:4,lineHeight:1.4}}>Photograph any menu — AI picks what to order.</div>
                      </div>
                      <div style={{color:"#60a5fa",fontFamily:"var(--mono)",fontSize:12,flexShrink:0}}>→</div>
                    </div>
                  </div>
                )}
                {raStep==='nearme'&&(
                  <div>
                    <button onClick={()=>setRaStep('picker')} style={{background:"none",border:"none",fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",cursor:"pointer",padding:0,letterSpacing:"0.12em",marginBottom:16,display:"block"}}>← BACK</button>
                    <div style={{display:"flex",gap:8,marginBottom:14}}>
                      <input value={raNearbyCity} onChange={e=>setRaNearbyCity(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchRaNearby()} placeholder="City or area…" style={{flex:1,background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.1)",borderRadius:10,padding:"12px 14px",color:"#fff",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
                      <button onClick={fetchRaNearby} disabled={raNearbyLoading||!raNearbyCity.trim()} style={{padding:"12px 18px",background:raNearbyLoading?"#111":"#e8341c",color:raNearbyLoading?"rgba(245,245,240,0.3)":"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:raNearbyLoading?"default":"pointer",fontFamily:"var(--condensed)",letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{raNearbyLoading?"Searching…":"Find →"}</button>
                    </div>
                    {raNearbyError&&<div style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(232,52,28,0.8)",marginBottom:12,padding:"8px 12px",background:"rgba(232,52,28,0.08)",borderRadius:8}}>{raNearbyError}</div>}
                    {raNearbyLoading&&[1,2,3].map(i=>(
                      <div key={i} style={{height:70,borderRadius:12,background:"rgba(255,255,255,0.04)",marginBottom:8,animation:"cm-pulse 1.4s ease-in-out infinite",animationDelay:`${i*0.15}s`}}/>
                    ))}
                    {raNearby.length>0&&(
                      <div>
                        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#e8341c",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>// {raNearby.length} RESTAURANTS NEARBY</div>
                        {raNearby.slice(0,10).map((r,i)=>(
                          <div key={i} onClick={()=>handleRaRestaurantTap(r)} style={{background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.07)",borderRadius:12,padding:"14px 16px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:18,color:"#f5f5f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                              <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)",marginTop:2,letterSpacing:"0.06em"}}>{r.vicinity||""}{r.rating?` · ${r.rating}★`:""}</div>
                            </div>
                            <div style={{color:"#e8341c",fontFamily:"var(--mono)",fontSize:12,flexShrink:0,marginLeft:12}}>→</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {raStep==='result'&&(
                  <div>
                    <button onClick={()=>setRaStep(raPrevStep)} style={{background:"none",border:"none",fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",cursor:"pointer",padding:0,letterSpacing:"0.12em",marginBottom:16,display:"block"}}>← BACK</button>
                    {raRestaurant&&<div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:16}}>{raRestaurant.name}</div>}
                    {raLoading&&(
                      <div>
                        {[1,2,3,4].map(i=>(
                          <div key={i} style={{height:i===1?120:70,borderRadius:12,background:"rgba(255,255,255,0.04)",marginBottom:10,animation:"cm-pulse 1.4s ease-in-out infinite",animationDelay:`${i*0.15}s`}}/>
                        ))}
                        <div style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.4)",textAlign:"center",marginTop:8}}>Checking your macros…</div>
                      </div>
                    )}
                    {raError&&!raLoading&&(
                      <div style={{background:"rgba(232,52,28,0.08)",border:"1px solid rgba(232,52,28,0.2)",borderRadius:12,padding:"14px 16px",fontFamily:"var(--mono)",fontSize:11,color:"rgba(232,52,28,0.8)"}}>{raError}</div>
                    )}
                    {raResult&&!raLoading&&(()=>{
                      const b=raResult.best_order;
                      const m=b?.estimated_macros||{};
                      const calStyle=raMacroChipStyle(m.calories,restaurantAI.calTarget);
                      const protStyle=raMacroChipStyle(m.protein_g,restaurantAI.proteinTarget,true);
                      const carbStyle=raMacroChipStyle(m.carbs_g,restaurantAI.carbTarget);
                      const fatStyle=raMacroChipStyle(m.fat_g,restaurantAI.fatTarget);
                      const coveragePct=Math.min(100,Math.round(b?.protein_coverage_pct||0));
                      return(
                        <div>
                          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#e8341c",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>// ORDER THIS</div>
                          <div style={{background:"linear-gradient(135deg,#0d0d0d 0%,#110808 100%)",border:"1px solid rgba(232,52,28,0.2)",borderRadius:14,padding:16,marginBottom:16,position:"relative",overflow:"hidden"}}>
                            <div style={{position:"absolute",top:-30,right:-20,width:100,height:100,background:"radial-gradient(ellipse,rgba(232,52,28,0.12),transparent 70%)",pointerEvents:"none"}}/>
                            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:22,color:"#f5f5f0",lineHeight:0.95,marginBottom:4}}>{b?.item||"—"}<span style={{color:"#e8341c"}}>.</span></div>
                            {b?.customisation&&<div style={{fontFamily:"var(--mono)",fontSize:9,color:"#FEA020",letterSpacing:"0.08em",marginBottom:8}}>{b.customisation}</div>}
                            <div style={{fontSize:13,color:"rgba(245,245,240,0.6)",lineHeight:1.5,marginBottom:14}}>{b?.reason}</div>
                            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                              {[
                                {label:"CAL",val:m.calories,style:calStyle},
                                {label:"PROTEIN",val:`${m.protein_g}G`,style:protStyle},
                                {label:"CARBS",val:`${m.carbs_g}G`,style:carbStyle},
                                {label:"FAT",val:`${m.fat_g}G`,style:fatStyle},
                              ].map(({label,val,style})=>(
                                <div key={label} style={{background:style.bg,borderRadius:8,padding:"6px 10px",textAlign:"center"}}>
                                  <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:16,color:style.color,lineHeight:1}}>{val}</div>
                                  <div style={{fontFamily:"var(--mono)",fontSize:7,color:"rgba(245,245,240,0.4)",letterSpacing:"0.08em",marginTop:2}}>{label}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:coveragePct>0?10:0}}>
                              <div style={{flex:1,height:3,background:"rgba(245,245,240,0.06)",borderRadius:2,overflow:"hidden"}}>
                                <div style={{height:"100%",width:`${coveragePct}%`,background:"#22c55e",borderRadius:2,transition:"width 0.6s ease"}}/>
                              </div>
                              <div style={{fontFamily:"var(--mono)",fontSize:8,color:"#22c55e",flexShrink:0}}>Covers {coveragePct}% of Meal {restaurantAI.slot} protein target</div>
                            </div>
                            {(b?.warnings||[]).length>0&&(
                              <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(232,52,28,0.1)"}}>
                                {b.warnings.map((w,i)=>(
                                  <div key={i} style={{display:"flex",gap:8,marginBottom:6}}>
                                    <span style={{fontFamily:"var(--mono)",fontSize:10,color:"#FEA020",flexShrink:0}}>⚠</span>
                                    <div>
                                      <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#FEA020",lineHeight:1.4}}>{w.message}</div>
                                      {w.fix&&<div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)",fontStyle:"italic",marginTop:2}}>{w.fix}</div>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {(raResult.backup_options||[]).length>0&&(
                            <div style={{marginBottom:16}}>
                              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.5)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>// ALSO GOOD</div>
                              {raResult.backup_options.map((opt,i)=>(
                                <div key={i} style={{background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.07)",borderRadius:10,padding:"12px 14px",marginBottom:6}}>
                                  <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:16,color:"#f5f5f0",marginBottom:opt.customisation?3:4}}>{opt.item}<span style={{color:"#e8341c"}}>.</span></div>
                                  {opt.customisation&&<div style={{fontFamily:"var(--mono)",fontSize:8,color:"#FEA020",letterSpacing:"0.06em",marginBottom:4}}>{opt.customisation}</div>}
                                  <div style={{fontSize:13,color:"rgba(245,245,240,0.5)",lineHeight:1.4}}>{opt.reason}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {(raResult.avoid||[]).length>0&&(
                            <div style={{marginBottom:16}}>
                              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.5)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>// SKIP THESE</div>
                              {raResult.avoid.map((item,i)=>(
                                <div key={i} style={{background:"rgba(245,245,240,0.02)",border:"1px solid rgba(245,245,240,0.06)",borderRadius:10,padding:"12px 14px",marginBottom:6,display:"flex",gap:10,alignItems:"flex-start"}}>
                                  <div style={{flex:1}}>
                                    <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:16,color:"rgba(245,245,240,0.35)",textDecoration:"line-through",marginBottom:3}}>{item.item}</div>
                                    <div style={{fontSize:13,color:"rgba(245,245,240,0.35)",lineHeight:1.4}}>{item.reason}</div>
                                  </div>
                                  <div style={{color:"rgba(232,52,28,0.5)",fontSize:16,flexShrink:0}}>✕</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {raResult.coach_note&&(
                            <div>
                              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#e8341c",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>// COACH SAYS</div>
                              <div style={{background:"rgba(232,52,28,0.05)",borderLeft:"3px solid #e8341c",borderRadius:"0 10px 10px 0",padding:"12px 14px"}}>
                                <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:16,color:"#f5f5f0",lineHeight:1.45}}>"{raResult.coach_note}"</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
            {logSlotConfirmed&&logMode!=="search"&&logMode!=="restaurant"&&<>
              {logMode==="ai"&&<>
                <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px",marginBottom:10}}>
                  <textarea value={foodInput} onChange={e=>setFoodInput(e.target.value)} placeholder="Describe your meal... e.g. grilled chicken 6oz, brown rice 1 cup, steamed broccoli" style={{width:"100%",background:"none",border:"none",color:"#fff",fontSize:14,resize:"none",outline:"none",minHeight:80,fontFamily:"inherit",boxSizing:"border-box",lineHeight:1.6}}/>
                </div>
                {logMsg&&<div style={{background:`${T.prot}12`,border:`1px solid ${T.prot}30`,borderRadius:9,padding:"8px 12px",fontSize:12,color:T.prot,marginBottom:10}}>{logMsg}</div>}
                <PrimaryBtn onClick={aiLog} label={logging?"Analyzing…":"Add to Log →"} disabled={logging||!foodInput.trim()}/>
              </>}
              {logMode==="barcode"&&<>
                <BarcodeScanner
                  onDetected={async(code)=>{
                    setBarcodeInput(code);setBarcodeLoading(true);setBarcodeResult(null);
                    const result=await scanBarcode(code);
                    setBarcodeResult(result);setBarcodeLoading(false);
                  }}
                  onCancel={()=>setLogMode("search")}
                />
                {barcodeLoading&&<div style={{textAlign:"center",padding:"16px",color:T.mu,fontSize:13}}>Looking up product…</div>}
                {barcodeResult&&<div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px",marginBottom:12,marginTop:8}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:3}}>{barcodeResult.name}</div>
                  {barcodeResult.brand&&<div style={{fontSize:11,color:T.mu,marginBottom:8}}>{barcodeResult.brand} · {barcodeResult.serving}</div>}
                  <div style={{display:"flex",gap:14,marginBottom:12}}>
                    {[["Cal",barcodeResult.calories,""],["P",barcodeResult.protein,"g"],["C",barcodeResult.carbs,"g"],["F",barcodeResult.fat,"g"]].map(([l,v,u])=>(<div key={l}><div style={{fontSize:9,color:T.mu,textTransform:"uppercase",letterSpacing:1}}>{l}</div><div style={{fontSize:16,fontWeight:800,color:T.prot}}>{v}{u}</div></div>))}
                  </div>
                  <PrimaryBtn onClick={addBarcode} label="Add to Log →"/>
                </div>}
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

        {/* ── KITCHEN (Recipes + Meal Prep) ── */}
        {fuelScreen==="kitchen"&&(
          <div style={{maxWidth:isMobile?"100%":700}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{fontFamily:"var(--condensed)",fontSize:32,fontWeight:900}}>MY RECIPES</div>
              <button onClick={()=>{setRecipeEditing(null);setShowRecipeBuilder(true);}} style={{padding:"10px 18px",background:T.prot,color:"#fff",border:"none",borderRadius:20,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"var(--condensed)",letterSpacing:"0.1em",textTransform:"uppercase",flexShrink:0}}>+ New</button>
            </div>
            <p style={{fontSize:13,color:T.mu,marginBottom:16}}>Save multi-ingredient recipes · log as a single tap</p>

            {/* AI recipe ideas button */}
            <button onClick={fetchRecipes} style={{width:"100%",padding:"12px 16px",background:"linear-gradient(135deg,rgba(232,52,28,0.18),var(--navy-mid))",border:"1px solid rgba(232,52,28,0.25)",borderRadius:12,cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke={T.prot} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>AI Recipe Ideas</div>
                <div style={{fontSize:11,color:T.mu}}>Generate recipes for your remaining macros today</div>
              </div>
              <div style={{color:T.prot,fontSize:11,fontWeight:700}}>{recipesLoading?"…":"Generate →"}</div>
            </button>

            {/* AI result */}
            {(recipes||recipesLoading)&&(
              <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:13,padding:"16px",marginBottom:16}}>
                {recipesLoading
                  ?<div style={{padding:"8px 0"}}><AIContentSkeleton/></div>
                  :<><div style={{lineHeight:1.85,fontSize:13,color:"#ccc",whiteSpace:"pre-wrap"}}>{recipes}</div><div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}><FlagBtn responseText={recipes} feature="recipes" user={user}/></div></>
                }
              </div>
            )}

            {/* Smart save suggestion */}
            {recipeSuggestSlot&&(
              <div style={{background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:14,padding:"14px 16px",marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>You often eat these together for {getSlotLabel(recipeSuggestSlot)}:</div>
                <div style={{fontSize:11,color:T.mu,marginBottom:12}}>
                  {log.filter(e=>getEntrySlot(e)===recipeSuggestSlot).slice(0,3).map(e=>e.food).join(" + ")}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setRecipeEditing(null);setShowRecipeBuilder(true);setRecipeSuggestSlot(null);}} style={{flex:1,padding:"10px",background:T.prot,color:"#fff",border:"none",borderRadius:8,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Save as Recipe</button>
                  <button onClick={()=>setRecipeSuggestSlot(null)} style={{padding:"10px 14px",background:"none",border:`1px solid ${T.bd}`,borderRadius:8,color:T.mu,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>No thanks</button>
                </div>
              </div>
            )}

            {/* Delete confirm */}
            {recipeDeleteConfirm&&(
              <div style={{position:"fixed",inset:0,background:"rgba(6,13,26,.8)",backdropFilter:"blur(6px)",zIndex:360,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
                <div style={{background:"#0d0d0d",border:"1px solid rgba(232,52,28,.35)",borderRadius:20,padding:"28px 24px",maxWidth:340,width:"100%",textAlign:"center"}}>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>Delete "{recipeDeleteConfirm.name}"?</div>
                  <div style={{fontSize:12,color:T.mu,marginBottom:24,lineHeight:1.6}}>This recipe will be permanently removed.</div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>setRecipeDeleteConfirm(null)} style={{flex:1,padding:"13px",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:10,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                    <button onClick={()=>{handleDeleteRecipe(recipeDeleteConfirm.id);setRecipeDeleteConfirm(null);}} style={{flex:1,padding:"13px",background:"rgba(232,52,28,.15)",border:"1px solid rgba(232,52,28,.5)",borderRadius:10,color:T.prot,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
                  </div>
                </div>
              </div>
            )}

            {/* Recipe list */}
            {userRecipes.length===0?(
              <div style={{textAlign:"center",padding:"56px 20px",border:`1px dashed ${T.bd}`,borderRadius:16}}>
                <svg width={48} height={48} viewBox="0 0 24 24" fill="none" style={{margin:"0 auto 14px",display:"block",opacity:.4}}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>No recipes yet</div>
                <div style={{fontSize:12,color:T.mu,lineHeight:1.65,maxWidth:280,margin:"0 auto 24px"}}>Create your first recipe to log multiple foods in one tap</div>
                <button onClick={()=>{setRecipeEditing(null);setShowRecipeBuilder(true);}} style={{padding:"14px 28px",background:T.prot,color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>+ Create Recipe</button>
              </div>
            ):(
              <>
                {/* Search + category filter */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"10px 14px"}}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{flexShrink:0,opacity:.4}}><circle cx={11} cy={11} r={8} stroke="#fff" strokeWidth={2}/><path d="m21 21-4.35-4.35" stroke="#fff" strokeWidth={2} strokeLinecap="round"/></svg>
                  <input value={recipeSearch} onChange={e=>setRecipeSearch(e.target.value)} placeholder="Search recipes…" style={{flex:1,background:"none",border:"none",outline:"none",color:"#fff",fontSize:13,fontFamily:"inherit"}}/>
                  {recipeSearch&&<button onClick={()=>setRecipeSearch("")} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:16,padding:0,lineHeight:1}}>×</button>}
                </div>
                {(()=>{
                  const cats=["All",...Array.from(new Set(userRecipes.map(r=>r.category).filter(Boolean)))];
                  return cats.length>1&&(
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                      {cats.map(c=>(
                        <button key={c} onClick={()=>setRecipeCatFilter(c)} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${recipeCatFilter===c?T.prot:T.bd}`,background:recipeCatFilter===c?`${T.prot}18`:"none",color:recipeCatFilter===c?T.prot:T.mu,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{c}</button>
                      ))}
                    </div>
                  );
                })()}
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {(()=>{
                    const filtered=userRecipes.filter(r=>{
                      const matchSearch=!recipeSearch||r.name.toLowerCase().includes(recipeSearch.toLowerCase());
                      const matchCat=recipeCatFilter==="All"||r.category===recipeCatFilter;
                      return matchSearch&&matchCat;
                    });
                    if(filtered.length===0)return(
                      <div style={{textAlign:"center",padding:"32px 20px",color:T.mu,fontSize:13}}>No recipes match your search</div>
                    );
                    return filtered.map(r=>{
                      const ingCount=(r.ingredients||[]).length;
                      const totalGrams=(r.ingredients||[]).reduce((s,i)=>s+(i.amount||0),0);
                      const daysSince=r.last_used?Math.round((Date.now()-new Date(r.last_used))/864e5):null;
                      const macroTotal=(r.protein_per_serving||0)*4+(r.carbs_per_serving||0)*4+(r.fat_per_serving||0)*9||1;
                      const pPct=Math.round((r.protein_per_serving||0)*4/macroTotal*100);
                      const cPct=Math.round((r.carbs_per_serving||0)*4/macroTotal*100);
                      const fPct=Math.max(0,100-pPct-cPct);
                      return(
                        <div key={r.id} style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:16,padding:"16px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontFamily:"var(--condensed)",fontSize:18,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                              <div style={{fontSize:11,color:T.mu}}>
                                {ingCount} ingredient{ingCount!==1?"s":""}{totalGrams>0?` · ${totalGrams}g total`:""}
                              </div>
                            </div>
                            {r.category&&<span style={{fontSize:9,background:"rgba(245,245,240,0.08)",color:"rgba(245,245,240,0.5)",borderRadius:5,padding:"3px 8px",flexShrink:0,marginLeft:8,fontWeight:700}}>{r.category}</span>}
                          </div>
                          {/* Macro bar */}
                          <div style={{height:5,borderRadius:3,overflow:"hidden",display:"flex",marginBottom:8,background:T.s3}}>
                            <div style={{width:`${pPct}%`,background:T.prot,transition:"width 0.32s cubic-bezier(.2,.7,.3,1)"}}/>
                            <div style={{width:`${cPct}%`,background:T.carb,transition:"width 0.32s cubic-bezier(.2,.7,.3,1)"}}/>
                            <div style={{width:`${fPct}%`,background:T.fat,transition:"width 0.32s cubic-bezier(.2,.7,.3,1)"}}/>
                          </div>
                          <div style={{display:"flex",gap:14,marginBottom:8}}>
                            <div style={{fontSize:15,fontWeight:900}}>{r.calories_per_serving}<span style={{fontSize:10,color:T.mu,fontWeight:400}}> kcal</span></div>
                            <div style={{fontSize:12,color:T.prot,fontWeight:700}}>{r.protein_per_serving}g P</div>
                            <div style={{fontSize:12,color:T.carb,fontWeight:700}}>{r.carbs_per_serving}g C</div>
                            <div style={{fontSize:12,color:T.fat,fontWeight:700}}>{r.fat_per_serving}g F</div>
                          </div>
                          {daysSince!==null&&<div style={{fontSize:10,color:T.mu,marginBottom:12}}>Last made: {daysSince===0?"today":daysSince===1?"yesterday":`${daysSince}d ago`}</div>}
                          <div style={{display:"flex",gap:8}}>
                            <button onClick={()=>setRecipeLogging(r)} style={{flex:1,padding:"11px",background:T.prot,color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"var(--condensed)",letterSpacing:"0.05em"}}>Log →</button>
                            <button onClick={()=>{setRecipeEditing(r);setShowRecipeBuilder(true);}} style={{padding:"11px 16px",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:10,color:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Edit</button>
                            <button onClick={()=>setRecipeDeleteConfirm(r)} style={{padding:"11px",background:"none",border:`1px solid rgba(232,52,28,.3)`,borderRadius:10,color:"rgba(232,52,28,.6)",cursor:"pointer",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </>
            )}

            {/* ── MEAL PREP section inside Kitchen ── */}
            <div style={{borderTop:`1px solid ${T.bd}`,marginTop:32,paddingTop:28}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:4}}>
              <div style={{fontFamily:"var(--condensed)",fontSize:32,fontWeight:900}}>MEAL PREP 🥡</div>
              {prepPlan&&!prepLoading&&(
                <button onClick={generatePrepPlan} style={{fontSize:11,color:"#e8341c",background:"none",border:"none",cursor:"pointer",fontFamily:"var(--mono)",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",padding:0}}>↺ Regenerate</button>
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
                <button onClick={generatePrepPlan} style={{padding:"14px 32px",background:"#e8341c",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"var(--mono)",letterSpacing:"1.8px",textTransform:"uppercase"}}>GENERATE PLAN →</button>
              </div>
            )}

            {prepPlan&&!prepLoading&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>

                {/* MEAL ASSIGNMENTS */}
                <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                  <div style={{fontFamily:"var(--condensed)",fontSize:18,fontWeight:900,letterSpacing:.5,marginBottom:14}}>MEAL ASSIGNMENTS</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {["training","rest"].map(type=>(
                      <div key={type} style={{background:T.s2,borderRadius:14,padding:"14px"}}>
                        <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10,color:type==="training"?T.prot:"rgba(245,245,240,0.4)",fontFamily:"var(--mono)"}}>{type==="training"?"// TRAINING DAY":"// REST DAY"}</div>
                        {Object.entries(prepPlan.mealAssignments?.[type]||{}).map(([meal,desc])=>(
                          <div key={meal} style={{marginBottom:8,paddingBottom:8,borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                            <div style={{fontSize:9,color:type==="training"?"rgba(232,52,28,0.7)":"rgba(245,245,240,0.35)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>{meal}</div>
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
                      <div style={{fontFamily:"var(--condensed)",fontSize:18,fontWeight:900,color:T.prot,letterSpacing:.5}}>PROTEINS</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {prepPlan.proteins.map((item,i)=>(
                        <div key={i} style={{background:T.s2,borderRadius:12,padding:"12px 14px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{item.name}</div>
                            <div style={{fontSize:11,color:T.prot,fontWeight:700,fontFamily:"var(--mono)"}}>{item.amount}</div>
                          </div>
                          <div style={{fontSize:11,color:"rgba(245,245,240,0.55)",lineHeight:1.5}}>{item.prep}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CARBS */}
                {prepPlan.carbs?.length>0&&(
                  <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                      <span style={{fontSize:20}}>🍚</span>
                      <div style={{fontFamily:"var(--condensed)",fontSize:18,fontWeight:900,color:T.carb,letterSpacing:.5}}>CARBS</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {prepPlan.carbs.map((item,i)=>(
                        <div key={i} style={{background:T.s2,borderRadius:12,padding:"12px 14px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{item.name}</div>
                            <div style={{fontSize:11,color:T.carb,fontWeight:700,fontFamily:"var(--mono)"}}>{item.amount}</div>
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
                      <div style={{fontFamily:"var(--condensed)",fontSize:18,fontWeight:900,color:T.green,letterSpacing:.5}}>VEGETABLES</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {prepPlan.vegetables.map((item,i)=>(
                        <div key={i} style={{background:T.s2,borderRadius:12,padding:"12px 14px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{item.name}</div>
                            <div style={{fontSize:11,color:T.green,fontWeight:700,fontFamily:"var(--mono)"}}>{item.amount}</div>
                          </div>
                          <div style={{fontSize:11,color:"rgba(245,245,240,0.55)",lineHeight:1.5}}>{item.prep}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SNACKS */}
                {prepPlan.snacks?.length>0&&(
                  <div style={{background:T.s1,border:"1px solid rgba(126,87,194,0.2)",borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                      <span style={{fontSize:20}}>🍎</span>
                      <div style={{fontFamily:"var(--condensed)",fontSize:18,fontWeight:900,color:"#7E57C2",letterSpacing:.5}}>SNACKS</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {prepPlan.snacks.map((item,i)=>(
                        <div key={i} style={{background:T.s2,borderRadius:12,padding:"12px 14px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{item.name}</div>
                            <div style={{fontSize:11,color:"#7E57C2",fontWeight:700,fontFamily:"var(--mono)"}}>{item.amount}</div>
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
                      <div style={{fontFamily:"var(--condensed)",fontSize:18,fontWeight:900,letterSpacing:.5}}>🛒 GROCERY LIST</div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>{
                          const text=Object.entries(prepPlan.grocery).map(([cat,items])=>`${cat}:\n${items.map(i=>`  • ${i}`).join("\n")}`).join("\n\n");
                          navigator.clipboard?.writeText(text);
                        }} style={{padding:"6px 12px",background:"rgba(232,52,28,0.1)",border:"1px solid rgba(232,52,28,0.3)",color:T.prot,borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Copy</button>
                        <button onClick={()=>setGroceryOpen(o=>!o)} style={{padding:"6px 12px",background:T.s2,border:`1px solid ${T.bd}`,color:T.mu,borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{groceryOpen?"Hide ▲":"Show ▼"}</button>
                      </div>
                    </div>
                    {groceryOpen&&(
                      <div>
                        {Object.entries(prepPlan.grocery).map(([category,items])=>(
                          <div key={category} style={{marginBottom:16}}>
                            <div style={{fontSize:9,color:T.mu,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8,fontFamily:"var(--mono)"}}>{category}</div>
                            {(items||[]).map((item,i)=>{
                              const key=`${category}:${item}`;
                              const checked=groceryChecked.has(key);
                              return(
                                <div key={i} onClick={()=>setGroceryChecked(s=>{const n=new Set(s);if(checked)n.delete(key);else n.add(key);return n;})}
                                  style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer"}}>
                                  <div style={{width:18,height:18,borderRadius:4,border:`1.5px solid ${checked?T.green:T.bd}`,background:checked?"rgba(34,197,94,0.15)":"none",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                                    {checked&&<span style={{color:T.green,fontSize:10,fontWeight:900,lineHeight:1}}>✓</span>}
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

                <button onClick={generatePrepPlan} style={{width:"100%",padding:"13px",background:T.s2,color:"#7E57C2",fontSize:13,fontWeight:700,letterSpacing:1,textTransform:"uppercase",border:"1px solid rgba(126,87,194,0.25)",borderRadius:11,cursor:"pointer",fontFamily:"inherit"}}>↺ Regenerate Plan</button>
              </div>
            )}
            </div>{/* end meal prep section */}
          </div>
        )}

        {/* ── OVERAGE NOTIFICATION ── */}
        {overageModal&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setOverageModal(null)}>
            <div style={{background:"#0a0a0a",border:"1px solid rgba(232,52,28,0.25)",borderRadius:"18px 18px 0 0",padding:"24px 20px 44px",maxWidth:480,width:"100%",boxShadow:"0 -8px 40px rgba(232,52,28,0.12)"}} onClick={e=>e.stopPropagation()}>
              <div style={{width:32,height:3,background:"rgba(255,255,255,0.12)",borderRadius:2,margin:"0 auto 20px"}}/>
              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#e8341c",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:6}}>// MEAL {overageModal.slot} LOGGED</div>
              <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:22,color:"#f5f5f0",lineHeight:0.95,marginBottom:14}}>
                {getOverageHeadline(profile?.goal).replace('.','')}<span style={{color:"#e8341c"}}>.</span>
              </div>
              <div style={{fontSize:14,color:"rgba(245,245,240,0.6)",lineHeight:1.55,marginBottom:16}}>
                {getOverageCopy(profile?.goal,overageModal.slot,overageModal.overage,overageModal.remaining.length)}
              </div>
              {overageModal.remaining.length>0&&(
                <div style={{background:"rgba(232,52,28,0.05)",border:"1px solid rgba(232,52,28,0.12)",borderRadius:10,padding:"10px 14px",marginBottom:18}}>
                  {overageModal.remaining.map(s=>{
                    const newT=overageModal.newTargets[s]||0;
                    const oldT=overageModal.oldTargets[s]||0;
                    const diff=newT-oldT;
                    return(
                      <div key={s} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.5)",letterSpacing:"0.08em",textTransform:"uppercase"}}>{getSlotLabel(s)}</div>
                        <div style={{fontFamily:"var(--mono)",fontSize:9}}>
                          <span style={{color:"#f5f5f0"}}>{newT} kcal</span>
                          {diff!==0&&<span style={{color:"#e8341c",marginLeft:4}}>({diff>0?"+":""}{diff})</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button onClick={()=>setOverageModal(null)} style={{width:"100%",padding:"14px",background:"#e8341c",color:"#fff",border:"none",borderRadius:12,fontFamily:"var(--mono)",fontWeight:700,fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>GOT IT</button>
            </div>
          </div>
        )}

        {/* hidden file input for menu scan — used by both inline tab and modal */}
        <input ref={menuScanRef} type="file" accept="image/*" capture="environment" onChange={handleMenuScan} style={{display:"none"}}/>

        {/* ── RESTAURANT AI MODAL ── */}
        {restaurantAI&&logMode!=="restaurant"&&(
          <div style={{position:"fixed",inset:0,background:"#000",zIndex:400,overflowY:"auto",paddingBottom:60,WebkitOverflowScrolling:"touch"}}>
            <div style={{position:"fixed",top:"-10%",left:"50%",transform:"translateX(-50%)",width:"70%",height:"50%",background:"radial-gradient(ellipse,rgba(232,52,28,0.12),transparent 70%)",pointerEvents:"none",zIndex:401}}/>
            <div style={{position:"relative",zIndex:402,padding:"56px 18px 20px"}}>
              <button onClick={raBack} style={{background:"none",border:"none",fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",cursor:"pointer",padding:0,letterSpacing:"0.12em",marginBottom:20,display:"block"}}>← BACK</button>
              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#e8341c",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>// RESTAURANT AI</div>
              <div style={{background:"rgba(232,52,28,0.06)",border:"1px solid rgba(232,52,28,0.15)",borderRadius:10,padding:"10px 14px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                {[
                  {label:"MEAL",value:String(restaurantAI.slot)},
                  {label:"KCAL",value:String(restaurantAI.calTarget)},
                  {label:"PROTEIN",value:`${restaurantAI.proteinTarget}G`,color:"#22c55e"},
                  {label:"CARBS",value:`${restaurantAI.carbTarget}G`},
                  {label:"FAT",value:`${restaurantAI.fatTarget}G`},
                ].map(({label,value,color})=>(
                  <div key={label} style={{textAlign:"center"}}>
                    <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>{label}</div>
                    <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:16,color:color||"#f5f5f0",lineHeight:1}}>{value}</div>
                  </div>
                ))}
              </div>

              {/* PICKER */}
              {raStep==='picker'&&(
                <div>
                  <div onClick={()=>setRaStep('nearme')} style={{background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.07)",borderRadius:14,padding:18,marginBottom:10,display:"flex",alignItems:"center",gap:14,cursor:"pointer",position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:10,background:"rgba(232,52,28,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e8341c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:20,color:"#f5f5f0",textTransform:"uppercase",letterSpacing:"0.02em"}}>NEAR ME<span style={{color:"#e8341c"}}>.</span></div>
                      <div style={{fontSize:13,color:"rgba(245,245,240,0.5)",marginTop:4,lineHeight:1.4}}>Find restaurants nearby and get AI recommendations based on their menu.</div>
                    </div>
                    <div style={{color:"#e8341c",fontFamily:"var(--mono)",fontSize:12,flexShrink:0}}>→</div>
                  </div>
                  <div onClick={()=>menuScanRef.current?.click()} style={{background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.07)",borderRadius:14,padding:18,marginBottom:10,display:"flex",alignItems:"center",gap:14,cursor:"pointer",position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:10,background:"rgba(96,165,250,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 014 0v2"/><circle cx="12" cy="13" r="3"/></svg>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:20,color:"#f5f5f0",textTransform:"uppercase",letterSpacing:"0.02em"}}>SCAN MENU<span style={{color:"#60a5fa"}}>.</span></div>
                      <div style={{fontSize:13,color:"rgba(245,245,240,0.5)",marginTop:4,lineHeight:1.4}}>Photograph any menu and AI recommends what to order based on your targets.</div>
                    </div>
                    <div style={{color:"#60a5fa",fontFamily:"var(--mono)",fontSize:12,flexShrink:0}}>→</div>
                  </div>
                </div>
              )}

              {/* NEAR ME */}
              {raStep==='nearme'&&(
                <div>
                  <div style={{display:"flex",gap:8,marginBottom:14}}>
                    <input value={raNearbyCity} onChange={e=>setRaNearbyCity(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchRaNearby()} placeholder="City or area…" style={{flex:1,background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.1)",borderRadius:10,padding:"12px 14px",color:"#fff",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
                    <button onClick={fetchRaNearby} disabled={raNearbyLoading||!raNearbyCity.trim()} style={{padding:"12px 18px",background:raNearbyLoading?"#111":"#e8341c",color:raNearbyLoading?"rgba(245,245,240,0.3)":"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:raNearbyLoading?"default":"pointer",fontFamily:"var(--condensed)",letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{raNearbyLoading?"Searching…":"Find →"}</button>
                  </div>
                  {raNearbyError&&<div style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(232,52,28,0.8)",marginBottom:12,padding:"8px 12px",background:"rgba(232,52,28,0.08)",borderRadius:8}}>{raNearbyError}</div>}
                  {raNearbyLoading&&[1,2,3].map(i=>(
                    <div key={i} style={{height:70,borderRadius:12,background:"rgba(255,255,255,0.04)",marginBottom:8,animation:"cm-pulse 1.4s ease-in-out infinite",animationDelay:`${i*0.15}s`}}/>
                  ))}
                  {raNearby.length>0&&(
                    <div>
                      <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#e8341c",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>// {raNearby.length} RESTAURANTS NEARBY</div>
                      {raNearby.slice(0,10).map((r,i)=>(
                        <div key={i} onClick={()=>handleRaRestaurantTap(r)} style={{background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.07)",borderRadius:12,padding:"14px 16px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:18,color:"#f5f5f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)",marginTop:2,letterSpacing:"0.06em"}}>{r.vicinity||""}{r.rating?` · ${r.rating}★`:""}</div>
                          </div>
                          <div style={{color:"#e8341c",fontFamily:"var(--mono)",fontSize:12,flexShrink:0,marginLeft:12}}>→</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* RESULT */}
              {raStep==='result'&&(
                <div>
                  {raRestaurant&&<div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:16}}>{raRestaurant.name}</div>}
                  {raLoading&&(
                    <div>
                      {[1,2,3,4].map(i=>(
                        <div key={i} style={{height:i===1?120:70,borderRadius:12,background:"rgba(255,255,255,0.04)",marginBottom:10,animation:"cm-pulse 1.4s ease-in-out infinite",animationDelay:`${i*0.15}s`}}/>
                      ))}
                      <div style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.4)",textAlign:"center",marginTop:8}}>Checking your macros…</div>
                    </div>
                  )}
                  {raError&&!raLoading&&(
                    <div style={{background:"rgba(232,52,28,0.08)",border:"1px solid rgba(232,52,28,0.2)",borderRadius:12,padding:"14px 16px",fontFamily:"var(--mono)",fontSize:11,color:"rgba(232,52,28,0.8)"}}>{raError}</div>
                  )}
                  {raResult&&!raLoading&&(()=>{
                    const b=raResult.best_order;
                    const m=b?.estimated_macros||{};
                    const calStyle=raMacroChipStyle(m.calories,restaurantAI.calTarget);
                    const protStyle=raMacroChipStyle(m.protein_g,restaurantAI.proteinTarget,true);
                    const carbStyle=raMacroChipStyle(m.carbs_g,restaurantAI.carbTarget);
                    const fatStyle=raMacroChipStyle(m.fat_g,restaurantAI.fatTarget);
                    const coveragePct=Math.min(100,Math.round(b?.protein_coverage_pct||0));
                    return(
                      <div>
                        {/* ORDER THIS */}
                        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#e8341c",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>// ORDER THIS</div>
                        <div style={{background:"linear-gradient(135deg,#0d0d0d 0%,#110808 100%)",border:"1px solid rgba(232,52,28,0.2)",borderRadius:14,padding:16,marginBottom:16,position:"relative",overflow:"hidden"}}>
                          <div style={{position:"absolute",top:-30,right:-20,width:100,height:100,background:"radial-gradient(ellipse,rgba(232,52,28,0.12),transparent 70%)",pointerEvents:"none"}}/>
                          <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:22,color:"#f5f5f0",lineHeight:0.95,marginBottom:4}}>{b?.item||"—"}<span style={{color:"#e8341c"}}>.</span></div>
                          {b?.customisation&&<div style={{fontFamily:"var(--mono)",fontSize:9,color:"#FEA020",letterSpacing:"0.08em",marginBottom:8}}>{b.customisation}</div>}
                          <div style={{fontSize:13,color:"rgba(245,245,240,0.6)",lineHeight:1.5,marginBottom:14}}>{b?.reason}</div>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                            {[
                              {label:"CAL",val:m.calories,style:calStyle},
                              {label:"PROTEIN",val:`${m.protein_g}G`,style:protStyle},
                              {label:"CARBS",val:`${m.carbs_g}G`,style:carbStyle},
                              {label:"FAT",val:`${m.fat_g}G`,style:fatStyle},
                            ].map(({label,val,style})=>(
                              <div key={label} style={{background:style.bg,borderRadius:8,padding:"6px 10px",textAlign:"center"}}>
                                <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:16,color:style.color,lineHeight:1}}>{val}</div>
                                <div style={{fontFamily:"var(--mono)",fontSize:7,color:"rgba(245,245,240,0.4)",letterSpacing:"0.08em",marginTop:2}}>{label}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:coveragePct>0?10:0}}>
                            <div style={{flex:1,height:3,background:"rgba(245,245,240,0.06)",borderRadius:2,overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${coveragePct}%`,background:"#22c55e",borderRadius:2,transition:"width 0.6s ease"}}/>
                            </div>
                            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"#22c55e",flexShrink:0}}>Covers {coveragePct}% of Meal {restaurantAI.slot} protein target</div>
                          </div>
                          {(b?.warnings||[]).length>0&&(
                            <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(232,52,28,0.1)"}}>
                              {b.warnings.map((w,i)=>(
                                <div key={i} style={{display:"flex",gap:8,marginBottom:6}}>
                                  <span style={{fontFamily:"var(--mono)",fontSize:10,color:"#FEA020",flexShrink:0}}>⚠</span>
                                  <div>
                                    <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#FEA020",lineHeight:1.4}}>{w.message}</div>
                                    {w.fix&&<div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)",fontStyle:"italic",marginTop:2}}>{w.fix}</div>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* ALSO GOOD */}
                        {(raResult.backup_options||[]).length>0&&(
                          <div style={{marginBottom:16}}>
                            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.5)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>// ALSO GOOD</div>
                            {raResult.backup_options.map((opt,i)=>(
                              <div key={i} style={{background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.07)",borderRadius:10,padding:"12px 14px",marginBottom:6}}>
                                <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:16,color:"#f5f5f0",marginBottom:opt.customisation?3:4}}>{opt.item}<span style={{color:"#e8341c"}}>.</span></div>
                                {opt.customisation&&<div style={{fontFamily:"var(--mono)",fontSize:8,color:"#FEA020",letterSpacing:"0.06em",marginBottom:4}}>{opt.customisation}</div>}
                                <div style={{fontSize:13,color:"rgba(245,245,240,0.5)",lineHeight:1.4}}>{opt.reason}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* SKIP THESE */}
                        {(raResult.avoid||[]).length>0&&(
                          <div style={{marginBottom:16}}>
                            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.5)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>// SKIP THESE</div>
                            {raResult.avoid.map((item,i)=>(
                              <div key={i} style={{background:"rgba(245,245,240,0.02)",border:"1px solid rgba(245,245,240,0.06)",borderRadius:10,padding:"12px 14px",marginBottom:6,display:"flex",gap:10,alignItems:"flex-start"}}>
                                <div style={{flex:1}}>
                                  <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:16,color:"rgba(245,245,240,0.35)",textDecoration:"line-through",marginBottom:3}}>{item.item}</div>
                                  <div style={{fontSize:13,color:"rgba(245,245,240,0.35)",lineHeight:1.4}}>{item.reason}</div>
                                </div>
                                <div style={{color:"rgba(232,52,28,0.5)",fontSize:16,flexShrink:0}}>✕</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* COACH SAYS */}
                        {raResult.coach_note&&(
                          <div>
                            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#e8341c",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>// COACH SAYS</div>
                            <div style={{background:"rgba(232,52,28,0.05)",borderLeft:"3px solid #e8341c",borderRadius:"0 10px 10px 0",padding:"12px 14px"}}>
                              <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:16,color:"#f5f5f0",lineHeight:1.45}}>"{raResult.coach_note}"</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating log button */}
        {fuelScreen==="home"&&(
          <button onClick={()=>setFuelScreen("log")} style={{position:"fixed",bottom:90,right:20,width:52,height:52,borderRadius:"50%",background:"#e8341c",boxShadow:"0 4px 20px rgba(232,52,28,0.4)",border:"none",color:"#fff",fontSize:24,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,fontWeight:300,lineHeight:1}}>+</button>
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
