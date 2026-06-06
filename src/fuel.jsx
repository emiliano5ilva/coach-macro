import React, { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { MN, MotionArc, StaggerItem, Pressable } from './motion-layer.jsx';
const _hL=()=>{try{Haptics.impact({style:ImpactStyle.Light});}catch{}};
const _hM=()=>{try{Haptics.impact({style:ImpactStyle.Medium});}catch{}};
import FoodIcon from "./FoodIcon.jsx";
import { getFoodIcon } from "./iconMap.js";
import FeatureStrip from "./components/FeatureStrip.jsx";
import BarcodeScanner from "./BarcodeScanner.jsx";
import { FlagBtn } from "./FlagBtn.jsx";
import { MetabolicResetProgressCard } from "./MetabolicAdaptation.jsx";
import { T, GLOBAL_CSS, WDAYS, DAY_CFG, FASTING_PROTOCOLS,
  Ring, MacroRing, MacroBar, PrimaryBtn, SectionCard, Spinner, Logo, FAQItem,
  FoodSearchSkeleton, AIContentSkeleton, EmptyState, hap, calcTDEE,
  GOCLUB_REDESIGN } from "./components.jsx";

const _FUEL_GOCLUB_CSS=`
.goclub.tab-fuel{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23g)' opacity='0.04'/%3E%3C/svg%3E") repeat left top/200px 200px,radial-gradient(ellipse at 50% 15%,#1A0A08 0%,#0A0302 40%,#000000 72%)!important;--condensed:'Archivo',sans-serif}
.goclub.tab-fuel .screen-header{border:none!important;background:transparent!important}
.goclub.tab-fuel .header-title{font-family:'Archivo',sans-serif!important;font-style:normal!important;font-weight:800!important;font-size:26px!important;line-height:1.1!important}
.goclub.tab-fuel .header-eyebrow{font-family:'Archivo',sans-serif!important;font-style:normal!important;font-weight:700!important;font-size:11px!important;letter-spacing:0.16em!important;color:rgba(255,255,255,0.4)!important;text-transform:uppercase!important}
.goclub.tab-fuel [style*="Barlow Condensed"]{font-family:'Archivo',sans-serif!important;font-style:normal!important}
.goclub.tab-fuel [style*="Barlow Condensed"][style*="fontStyle"]{font-style:normal!important}
`;
import { showToast } from "./utils/toast.js";
import { mealHasAllergen, scanTextAllergens } from "./utils/allergenFilter.js";
import { fitWeek, fitDay } from "./services/mealFitter.js";
import { sb, ai, streamAI, aiWithTools } from "./client.js";
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
                      <FoodIcon name={f.food_name} size={28} userId={user?.id} />
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
                      <FoodIcon name={f.food_name} size={28} userId={user?.id} />
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

  // D-fix: if no onDelete, render children with no swipe behaviour
  if(!onDelete) return <div style={style}>{children}</div>;

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

  // Delete panel opacity fades in proportionally to swipe distance
  const deleteFade = Math.min(1, Math.abs(offset) / (THRESHOLD * 0.6));

  return (
    <div style={{position:"relative",overflow:"hidden",...style}}>
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:THRESHOLD,background:"#EF4444",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"0 8px 8px 0",flexShrink:0,opacity:deleteFade,transition:dragging?"none":"opacity 0.2s ease"}}>
        <span style={{color:"#fff",fontSize:11,fontWeight:700,letterSpacing:"0.08em"}}>Delete</span>
      </div>
      <div className="swipe-row"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{transform:`translateX(${offset}px)`,transition:dragging?"none":"transform 0.25s ease",background:"none",position:"relative"}}
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

function buildWaterInfoText(profile, todayType, todayFocus, waterTarget) {
  if (profile?.waterMode === 'custom' && profile?.waterGoalOz) {
    return `Your daily water goal is set to ${waterTarget} oz (custom target). Adjust it any time in settings.`;
  }
  const wLbs = profile?.wUnit === 'kg'
    ? Math.round(parseFloat(profile?.weight || 70) * 2.205)
    : Math.round(parseFloat(profile?.weight || 160));
  const baseOz = Math.round(wLbs * 0.55);
  const focus = (todayFocus || '').toLowerCase();
  const isRest = todayType === 'rest' || !todayType;
  let adj, sessionLabel;
  if (isRest)                    { adj = 0;  sessionLabel = null; }
  else if (focus.includes('run'))    { adj = 24; sessionLabel = 'run'; }
  else if (focus.includes('hyrox'))  { adj = 20; sessionLabel = 'Hyrox'; }
  else if (focus.includes('cardio')) { adj = 20; sessionLabel = 'cardio'; }
  else                               { adj = 12; sessionLabel = 'strength'; }
  const adjPhrase = isRest
    ? 'plus 0 oz — it\'s a rest day'
    : `plus ${adj} oz for today's ${sessionLabel} session`;
  let text = `Your ${waterTarget} oz goal is based on your ${wLbs} lb body weight (${wLbs} × 0.55 = ${baseOz} oz) ${adjPhrase}.`;
  const extras = [];
  if (profile?.hot_weather_mode) extras.push('+16 oz hot weather');
  if (profile?.isPregnant)       extras.push('+10 oz pregnancy');
  if (profile?.isBreastfeeding)  extras.push('+13 oz breastfeeding');
  if (extras.length) text += `\n\n${extras.join(' · ')}`;
  return text;
}

function WaterTracker({waterLogs, waterTarget, onAddWater, onDeleteWater, bottleSize=16, isMobile, profile, dayType, todayFocus}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customOz, setCustomOz] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [longPressId, setLongPressId] = useState(null);
  const pressTimer = useRef(null);

  const totalOz = waterLogs.reduce((s, l) => s + Number(l.amount_oz), 0);
  const pct = Math.min(1, totalOz / Math.max(1, waterTarget));
  const ozLeft = Math.max(0, waterTarget - totalOz);
  const isOver = totalOz >= waterTarget;

  const waterInfoText = buildWaterInfoText(profile, dayType, todayFocus, waterTarget);

  // Ring geometry — r=78, cx=cy=90, viewBox 180×180
  const R = 78, CX = 90, CY = 90;
  const circ = parseFloat((2 * Math.PI * R).toFixed(1));
  const fillLen = parseFloat((pct * circ).toFixed(1));
  const tipAngle = pct * 2 * Math.PI - Math.PI / 2;
  const tipX = (CX + R * Math.cos(tipAngle)).toFixed(2);
  const tipY = (CY + R * Math.sin(tipAngle)).toFixed(2);

  const mno = {fontFamily:"'DM Mono',monospace"};

  function startPress(id) {
    pressTimer.current = setTimeout(() => setLongPressId(id), 500);
  }
  function endPress() { clearTimeout(pressTimer.current); }

  async function handleQuickAdd(oz) {
    await onAddWater(oz);
    const newTotal = totalOz + oz;
    const left = Math.max(0, waterTarget - newTotal);
    showToast(`+${oz} oz added${left > 0 ? ` · ${Math.round(left)} oz remaining` : " · Goal reached! 💧"}`, "info");
  }

  async function handleCustom() {
    const oz = parseFloat(customOz);
    if (!oz || oz <= 0) return;
    await onAddWater(oz);
    const newTotal = totalOz + oz;
    const left = Math.max(0, waterTarget - newTotal);
    showToast(`+${oz} oz added${left > 0 ? ` · ${Math.round(left)} oz remaining` : " · Goal reached! 💧"}`, "info");
    setCustomOz("");
    setShowCustom(false);
  }

  const lastFive = [...waterLogs].slice(-5).reverse();

  return (
    <div style={{
      position:"relative",
      background:GOCLUB_REDESIGN?"rgba(255,255,255,0.05)":"rgba(59,130,246,0.03)",
      backgroundImage:GOCLUB_REDESIGN?"none":"radial-gradient(circle at top, rgba(59,130,246,0.06) 0%, transparent 60%)",
      boxShadow:GOCLUB_REDESIGN?"none":"0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(59,130,246,0.12), inset 0 1px 0 0 rgba(59,130,246,0.15)",
      border:GOCLUB_REDESIGN?"1px solid rgba(255,255,255,0.08)":undefined,
      borderRadius:16,padding:"16px 18px",marginBottom:12,
    }}>
      <style>{`@keyframes hydRingSweep{from{stroke-dashoffset:${circ}}to{stroke-dashoffset:${(circ-fillLen).toFixed(1)}}}`}</style>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"var(--condensed)",fontSize:13,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(245,245,240,0.65)"}}>Hydration</div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{...mno,fontSize:11,color:"#93C5FD",fontWeight:700}}>{Math.round(totalOz)} / {waterTarget} oz</div>
          <button
            onClick={()=>setShowInfo(v=>!v)}
            style={{width:18,height:18,borderRadius:"50%",background:"rgba(59,130,246,0.10)",border:"1px solid rgba(59,130,246,0.4)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0,flexShrink:0}}
          >
            <span style={{fontFamily:"'SF Mono','DM Mono',monospace",fontSize:10,color:"#93C5FD",lineHeight:1,fontStyle:"normal",fontWeight:500}}>i</span>
          </button>
        </div>
      </div>

      {/* Info popover */}
      {showInfo&&(
        <>
          <div onClick={()=>setShowInfo(false)} style={{position:"fixed",inset:0,zIndex:199}}/>
          <div style={{position:"absolute",top:44,right:0,zIndex:200,background:"#0d0d0d",border:"1px solid rgba(59,130,246,0.3)",borderRadius:12,padding:"12px 14px",maxWidth:280,boxShadow:"0 8px 24px rgba(0,0,0,0.6)"}}>
            {waterInfoText.split('\n\n').map((para,i)=>(
              <div key={i} style={{fontFamily:"var(--mono)",fontSize:11,color:i===0?"rgba(245,245,240,0.75)":"rgba(147,197,253,0.6)",lineHeight:1.55,marginTop:i>0?8:0}}>{para}</div>
            ))}
          </div>
        </>
      )}


      {/* Ring row: consumed | ring+center | target */}
      <div style={{position:"relative",height:180,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>
        {/* Left — consumed */}
        <div style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",textAlign:"center",width:54}}>
          <div style={{...mno,fontSize:22,fontWeight:700,color:"#f5f5f0",lineHeight:1}}>{Math.round(totalOz)}</div>
          <div style={{...mno,fontSize:8,color:"rgba(245,245,240,0.4)",letterSpacing:"0.12em",textTransform:"uppercase",marginTop:4}}>OZ</div>
        </div>

        {/* SVG ring */}
        <svg width="180" height="180" viewBox="0 0 180 180"
          style={{transform:"rotate(-90deg)",filter:"drop-shadow(0 0 16px rgba(59,130,246,0.10))"}}>
          <defs>
            <linearGradient id="hydRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6"/>
              <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.9"/>
            </linearGradient>
            <linearGradient id="hydRingGradientOver" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6"/>
              <stop offset="100%" stopColor="#60A5FA"/>
            </linearGradient>
          </defs>
          {/* Track */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="12"/>
          {/* Active arc */}
          <circle cx={CX} cy={CY} r={R} fill="none"
            stroke={`url(#${isOver?"hydRingGradientOver":"hydRingGradient"})`}
            strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={(circ-fillLen).toFixed(1)}
            style={{animation:"hydRingSweep 0.8s cubic-bezier(.2,.7,.3,1) both"}}/>
          {/* Tip dot — only when fill > 2% */}
          {pct>0.02&&(
            <circle cx={tipX} cy={tipY} r="5" fill="#3B82F6"
              style={{filter:isOver
                ?"drop-shadow(0 0 10px rgba(59,130,246,1.0))"
                :"drop-shadow(0 0 6px rgba(59,130,246,0.8)) drop-shadow(0 0 12px rgba(59,130,246,0.4))"}}/>
          )}
        </svg>

        {/* Center labels */}
        <div style={{position:"absolute",textAlign:"center",pointerEvents:"none"}}>
          <div style={{...mno,fontSize:9,color:"rgba(245,245,240,0.4)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:2}}>OZ LEFT</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:42,color:"#93C5FD",lineHeight:1,letterSpacing:"-0.02em",textShadow:"0 0 30px rgba(147,197,253,0.15), 0 2px 24px rgba(0,0,0,0.8)"}}>
            {isOver?"0":Math.round(ozLeft)}
          </div>
          <div style={{...mno,fontSize:9,color:"rgba(245,245,240,0.4)",letterSpacing:"0.08em",marginTop:4}}>of {waterTarget} oz</div>
        </div>

        {/* Right — target */}
        <div style={{position:"absolute",right:0,top:"50%",transform:"translateY(-50%)",textAlign:"center",width:54}}>
          <div style={{...mno,fontSize:22,fontWeight:700,color:"rgba(245,245,240,0.5)",lineHeight:1}}>{waterTarget}</div>
          <div style={{...mno,fontSize:8,color:"rgba(245,245,240,0.4)",letterSpacing:"0.12em",textTransform:"uppercase",marginTop:4}}>OZ</div>
        </div>
      </div>

      {/* Quick-add buttons — all three inline, consistent blue style */}
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <button onClick={()=>handleQuickAdd(bottleSize)} style={{flex:1,padding:"9px 0",background:"rgba(59,130,246,0.12)",border:"1px solid rgba(59,130,246,0.35)",borderRadius:10,color:"#93C5FD",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>+{bottleSize} oz</button>
        <button onClick={()=>handleQuickAdd(8)} style={{flex:1,padding:"9px 0",background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.25)",borderRadius:10,color:"rgba(147,197,253,0.85)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>+8 oz</button>
        <button onClick={()=>setShowCustom(v=>!v)} style={{flex:1,padding:"9px 0",background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:10,color:"rgba(147,197,253,0.7)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Custom</button>
      </div>

      {showCustom&&(
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <input type="number" value={customOz} onChange={e=>setCustomOz(e.target.value)} placeholder="oz" min={1} max={128}
            style={{flex:1,background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:13,fontFamily:"var(--mono)",outline:"none"}}/>
          <button onClick={handleCustom} style={{padding:"8px 18px",background:"rgba(59,130,246,0.25)",border:"1px solid rgba(59,130,246,0.5)",borderRadius:10,color:"#93C5FD",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Add</button>
        </div>
      )}

      {/* Recent logs with long-press to delete */}
      {lastFive.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {lastFive.map(log=>(
            <div key={log.id} onPointerDown={()=>startPress(log.id)} onPointerUp={()=>endPress()} onPointerLeave={()=>endPress()}
              style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",background:"rgba(59,130,246,0.05)",borderRadius:8,position:"relative"}}>
              <div style={{...mno,fontSize:11,color:"rgba(245,245,240,0.5)"}}>
                {new Date(log.logged_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
              </div>
              <div style={{...mno,fontSize:11,color:"#93C5FD",fontWeight:700}}>+{log.amount_oz} oz</div>
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

      {isOver&&(
        <div style={{textAlign:"center",marginTop:10,fontSize:12,color:"#60A5FA",fontWeight:700}}>✓ Daily water goal met! 💧</div>
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
    const foodLabel=selectedFood.name+(selectedFood.brand?` (${selectedFood.brand})`:"");
    const entry={
      id:Date.now(),
      food:foodLabel,
      ...m,grams,
      slot:mealSlots[activeSlotIdx]||1,
      source:selectedFood.source||"usda",
      icon:getFoodIcon(foodLabel),
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

  const [showBarcodeInSearch,setShowBarcodeInSearch]=useState(false);
  if(showBarcodeInSearch){
    return(
      <div style={{maxWidth:isMobile?"100%":560}}>
        <button onClick={()=>setShowBarcodeInSearch(false)} style={{background:"none",border:"none",...{fontFamily:"'DM Mono',monospace"},fontSize:9,color:"rgba(245,245,240,0.4)",cursor:"pointer",padding:"0 0 16px",letterSpacing:"0.12em",display:"block"}}>← BACK TO SEARCH</button>
        <BarcodeScanner
          onDetected={async(code)=>{
            setShowBarcodeInSearch(false);
            setQuery(code);
          }}
          onCancel={()=>setShowBarcodeInSearch(false)}
        />
      </div>
    );
  }
  return(
    <div style={{maxWidth:isMobile?"100%":560}}>
      {toast&&<div style={{position:"fixed",top:24,left:"50%",transform:"translateX(-50%)",background:T.prot,color:"#fff",padding:"10px 20px",borderRadius:20,fontSize:13,fontWeight:700,zIndex:999,boxShadow:"0 4px 16px rgba(0,0,0,0.4)"}}>{toast}</div>}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
        <div style={{flex:1,position:"relative"}}>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search 1M+ foods..." style={{width:"100%",background:"#0d0d0d",border:"1px solid rgba(232,52,28,0.12)",borderRadius:12,padding:"12px 16px",color:"#f5f5f0",fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"'Barlow Condensed',sans-serif"}}/>
          {!searching&&query&&<button onClick={()=>{setQuery("");setResults([]);}} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"rgba(245,245,240,0.3)",fontSize:18,cursor:"pointer",lineHeight:1,padding:"0 2px"}}>×</button>}
        </div>
        <button onClick={()=>setShowBarcodeInSearch(true)} style={{width:44,height:44,borderRadius:10,background:"#0d0d0d",border:"1px solid rgba(232,52,28,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer"}}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display:'block'}}>
            <rect x="1" y="1" width="6" height="6" rx="1" stroke="#e8341c" strokeWidth="1.5" fill="none"/>
            <rect x="15" y="1" width="6" height="6" rx="1" stroke="#e8341c" strokeWidth="1.5" fill="none"/>
            <rect x="1" y="15" width="6" height="6" rx="1" stroke="#e8341c" strokeWidth="1.5" fill="none"/>
            <line x1="9" y1="2" x2="9" y2="7" stroke="#e8341c" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="2" x2="12" y2="7" stroke="#e8341c" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="9" y1="15" x2="9" y2="20" stroke="#e8341c" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="15" x2="12" y2="20" stroke="#e8341c" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="15" y1="9" x2="20" y2="9" stroke="#e8341c" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="15" y1="12" x2="20" y2="12" stroke="#e8341c" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      {searching&&<div style={{marginBottom:16}}><FoodSearchSkeleton/></div>}
      {!searching&&results.length>0&&(
        <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,marginBottom:16,overflow:"hidden"}}>
          {results.slice(0,12).map((food,i)=>(
            <button key={food.id||i} onClick={()=>selectFood(food)} style={{width:"100%",padding:"12px 16px",background:"none",border:"none",borderBottom:i<Math.min(results.length,12)-1?`1px solid ${T.bd}`:"none",cursor:"pointer",textAlign:"left",color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10}}>
              <FoodIcon name={food.name} size={28} userId={user?.id} />
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{food.name}</div>
                <div style={{fontSize:11,color:T.mu,display:"flex",gap:10,flexWrap:"wrap"}}>
                  {food.brand&&<span>{food.brand} ·</span>}
                  <span>{food.calories} kcal</span>
                  <span style={{color:T.prot}}>P {food.protein}g</span>
                  <span style={{color:T.carb}}>C {food.carbs}g</span>
                  <span style={{color:T.fat}}>F {food.fat}g</span>
                  <span style={{color:"rgba(245,245,240,0.2)",marginLeft:"auto",fontSize:9,textTransform:"uppercase",letterSpacing:1}}>{food.source==="off"?"Open FF":"USDA"}</span>
                </div>
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
                    <FoodIcon name={food.name} size={28} userId={user?.id} />
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

const DIET_PRESETS=[
  {id:'balanced',    label:'Balanced',     badge:'POPULAR',  color:'#e8341c'},
  {id:'high-protein',label:'High Protein', badge:'POPULAR',  color:'#e8341c'},
  {id:'mediterranean',label:'Mediterranean',badge:'TRENDING',color:'#FEA020'},
  {id:'keto',        label:'Keto',         badge:'TRENDING', color:'#FEA020'},
  {id:'paleo',       label:'Paleo',        badge:null,       color:null},
  {id:'vegetarian',  label:'Vegetarian',   badge:null,       color:null},
  {id:'vegan',       label:'Vegan',        badge:null,       color:null},
  {id:'carnivore',   label:'Carnivore',    badge:'NEW',      color:'#22c55e'},
  {id:'low-carb',    label:'Low Carb',     badge:null,       color:null},
  {id:'pescatarian', label:'Pescatarian',  badge:null,       color:null},
];

// safeParseJSON — used by non-meal-prep AI paths (restaurant, quick suggestions).
// Meal prep uses aiWithTools (forced tool use) and never calls this.
function safeParseJSON(str){
  if(!str)return null;
  let s=str.replace(/```json\n?|```\n?/g,'').trim();
  try{return JSON.parse(s);}catch{}
  const start=s.search(/[{\[]/);
  if(start===-1)return null;
  const opener=s[start];const closer=opener==='{'?'}':']';
  let depth=0,end=-1;
  for(let i=start;i<s.length;i++){
    if(s[i]===opener)depth++;
    else if(s[i]===closer){depth--;if(depth===0){end=i;break;}}
  }
  const extracted=end!==-1?s.slice(start,end+1):s.slice(start);
  try{return JSON.parse(extracted);}catch{}
  const fixed=extracted.replace(/,(\s*[}\]])/g,'$1').replace(/,\s*$/,'');
  const opens=[...fixed].reduce((st,ch)=>{if(ch==='{'||ch==='[')st.push(ch==='{'?'}':']');else if((ch==='}'||ch===']')&&st.length&&st[st.length-1]===ch)st.pop();return st;},[]);
  try{return JSON.parse(fixed+opens.reverse().join(''));}catch{return null;}
}

// ── Meal prep: AI tool schemas RETIRED (Phase 3) ──────────────────────────────
// Generation now uses the pure deterministic fitter (src/services/mealFitter.js)
// against the 299-recipe Supabase library — instant, allergen-safe, zero tokens.
// MEAL_PLAN_TOOL / REGEN_MEAL_TOOL / REGEN_DAY_TOOL removed.

// Chip label → DB allergen tag (mirrors retag-allergens.mjs CHIP_TO_TAG)
const ALLERGEN_CHIP_TO_TAG = {
  'No Dairy':'dairy','No Gluten':'gluten','No Pork':'pork',
  'No Shellfish':'shellfish','No Eggs':'eggs','No Nuts':'nuts',
};

// Format a scaled ingredient quantity for display: "200g", "1.5 cups", etc.
function fmtIngAmt(qty, unit) {
  if (!qty || !unit) return '';
  if (unit === 'g' || unit === 'ml') return `${Math.round(qty)}${unit}`;
  if (unit === 'whole') { const q=Math.round(qty*10)/10; return q===1?'1':String(q); }
  return `${Math.round(qty*10)/10} ${unit}`;
}

// Load eligible recipe pool from Supabase (pre-filtered; fitter re-checks allergens).
async function loadMealPool(diet, allergenTags) {
  let q = sb
    .from('recipes')
    .select('id,name,meal_slot,diet_tags,allergen_tags,calories_per_serving,protein_per_serving,carbs_per_serving,fat_per_serving,servings_count,ingredients,use_count,last_used')
    .is('user_id', null);
  if (diet && diet !== 'balanced') q = q.contains('diet_tags', [diet]);
  // ALLERGEN GATE (DB layer): NOT (allergen_tags && ARRAY[allergens])
  if (allergenTags.length > 0) q = q.not('allergen_tags', 'ov', `{${allergenTags.join(',')}}`);
  const { data, error } = await q;
  if (error) throw new Error(`Recipe pool load failed: ${error.message}`);
  return data || [];
}

// Convert a single fitDay result + metadata → the shape one plan day expects.
function fitterDayToShape(fDay, dayName, sessionType) {
  const meals = fDay.meals.map(slot => {
    if (slot.unfillable) {
      return { name:null, unfillable:true, reason:slot.reason, slot:slot.slot,
               calories:0, protein:0, carbs:0, fat:0, ingredients:[] };
    }
    const { recipe, servings, scaledMacros } = slot;
    return {
      name: recipe.name,
      calories: Math.round(scaledMacros.cal),
      protein: Math.round(scaledMacros.pro * 10) / 10,
      carbs:   Math.round(scaledMacros.carb * 10) / 10,
      fat:     Math.round(scaledMacros.fat  * 10) / 10,
      ingredients: (recipe.ingredients || []).map(ing => ({
        item:   ing.item,
        amount: fmtIngAmt((ing.qty || 0) * servings, ing.unit),
      })),
      instructions: recipe.instructions || null,
      slot: slot.slot,
      servings,
      _recipeId: recipe.id,
      unfillable: false,
    };
  });
  return {
    day: dayName,
    sessionType,
    totalCalories: Math.round(fDay.dayTotals.cal),
    totalProtein:  Math.round(fDay.dayTotals.pro  * 10) / 10,
    totalCarbs:    Math.round(fDay.dayTotals.carb * 10) / 10,
    totalFat:      Math.round(fDay.dayTotals.fat  * 10) / 10,
    meals,
  };
}

export function FuelSection({log,macros,consumed,remaining,cfg,todayType,todayFocus,earnedCals,todayActs,fuelScreen,setFuelScreen,foodInput,setFoodInput,logging,logMsg,aiLog,barcodeInput,setBarcodeInput,barcodeResult,barcodeLoading,scanBarcode,addBarcode,quickFields,setQF,addQuick,removeLog,recs,recsLoading,fetchRecs,recipes,recipesLoading,fetchRecipes,fastProto,setFastProto,fastActive,setFastActive,fastStart,setFastStart,fastCustomH,setFastCustomH,fastHours,city,setCity,isMobile,user,wPrefs,setWPrefs,schedule,setSchedule,todayKey,periodizationInfo,logEntry,profile,dayNutrition,weekMacros,waterTarget,waterLogs,onAddWater,onDeleteWater,metabolicProtocol,onOpenPhotoLogger,skippedSlots,onSkipSlots,slotOverages={},onSlotOverage,lockedSlots=[],onLockSlots,resetSignal=0,todayProtocol=null}) {

  const FUEL_TABS=[{id:"home",label:"Home"},{id:"kitchen",label:"Kitchen"}];
  const pad2=n=>String(Math.max(0,Math.floor(n))).padStart(2,"0");
  const mno={fontFamily:"'DM Mono',monospace"};
  const [logMode,setLogMode]=useState(null);
  const [aiEstimate,setAiEstimate]=useState(null);
  const [aiEstimating,setAiEstimating]=useState(false);
  const [showQAExtras,setShowQAExtras]=useState(false);
  useEffect(()=>{if(logMode===null)setShowQAExtras(false);},[logMode]);

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
  const [whyExpanded,setWhyExpanded]=useState(false);
  const [kitchenCard,setKitchenCard]=useState(0);

  // ── Meal Slots ─────────────────────────────────────────────────────────────
  // Returns the array index of the most likely current meal based on hour of day.
  function getTimeBasedSlotIdx(count){
    const h=new Date().getHours();
    if(count<=1)return 0;
    if(count===2)return h<15?0:1;
    if(count===3)return h<11?0:h<17?1:2;
    if(count===4)return h<10?0:h<14?1:h<19?2:3;
    if(count===5)return h<9?0:h<12?1:h<15?2:h<19?3:4;
    return h<8?0:h<11?1:h<14?2:h<17?3:h<20?4:5;
  }
  const [mealSlots,setMealSlots]=useState(()=>getSlotsForFreq(profile?.mealFreq));
  const [activeSlotIdx,setActiveSlotIdx]=useState(()=>getTimeBasedSlotIdx(Math.min(parseInt(String(profile?.mealFreq))||3,6)));
  const [logSlotConfirmed,setLogSlotConfirmed]=useState(true);
  const prevFuelScreenRef=useRef(fuelScreen);
  const pendingLogSlotRef=useRef(null);
  useEffect(()=>{
    if(fuelScreen==="log"&&prevFuelScreenRef.current!=="log"){
      if(pendingLogSlotRef.current!==null){
        setActiveSlotIdx(pendingLogSlotRef.current);
        pendingLogSlotRef.current=null;
      }else{
        setActiveSlotIdx(getTimeBasedSlotIdx(mealSlots.length));
      }
      setLogSlotConfirmed(true);
      setLogMode(null);
      setAiEstimate(null);
      setAiEstimating(false);
    }
    prevFuelScreenRef.current=fuelScreen;
  },[fuelScreen]);
  const [showSkipPrompt,setShowSkipPrompt]=useState(false);
  const [skipPromptTarget,setSkipPromptTarget]=useState(null);
  const [tooltipSlot,setTooltipSlot]=useState(null);
  const [justSkipped,setJustSkipped]=useState([]);
  // Lock-gate: {slotToLock, pendingIdx} — fired before navigating into a new slot
  const [lockGate,setLockGate]=useState(null);
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
    // Subtract what's already logged in this slot so Restaurant AI targets the REMAINING gap
    const alreadyInSlot=log.filter(e=>getEntrySlot(e)===slot).reduce((s,e)=>s+(e.calories||0),0);
    const remainingCal=Math.max(100,slotCal-alreadyInSlot);
    const ratio=macros.calories>0?remainingCal/macros.calories:1/mealSlots.length;
    setRestaurantAI({
      slot,
      calTarget:remainingCal,
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

  async function handleAiDescribeSubmit(){
    if(!foodInput.trim())return;
    setAiEstimating(true);
    setAiEstimate(null);
    try{
      const raw=await ai(`Estimate macros for: "${foodInput}". Reply ONLY valid JSON no markdown: {"food":"short name","calories":0,"protein":0,"carbs":0,"fat":0}`);
      const p=JSON.parse(raw.trim());
      setAiEstimate({
        description:foodInput,
        food:p.food||foodInput,
        calories:p.calories||0,
        protein:p.protein||0,
        carbs:p.carbs||0,
        fat:p.fat||0,
      });
    }catch(e){
      const m=getAIErrorMessage(e);
      if(m)showToast(m,"error");
    }
    setAiEstimating(false);
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
  const [weeklyProteinByDay,setWeeklyProteinByDay]=useState({}); // ISO-date → protein grams logged
  const [weeklyCalsByDay,setWeeklyCalsByDay]=useState({}); // ISO-date → calories logged
  // ── GOCLUB eyebrow — swipeable pages ─────────────────────────────────────────
  const [_fuelEyePg,_setFuelEyePg]=useState(0);
  const _fuelEyeX=useRef(0);
  const _fuelEyeY=useRef(0);
  const _fuelEyeRedMo=useReducedMotion();
  useEffect(()=>{
    if(!user||wPrefs?.macroMemory===false)return;
    const cutoff=new Date();cutoff.setDate(cutoff.getDate()-56);
    sb.from("food_logs").select("date,entries").eq("user_id",user.id).gte("date",cutoff.toISOString().split("T")[0]).order("date",{ascending:false})
      .then(({data})=>{
        if(!data||data.length<4)return;
        const todayDOW=new Date().toLocaleDateString("en-US",{weekday:"short"});
        const todayAlreadyLogged=new Set((log||[]).map(e=>(e.food||"").toLowerCase().trim()));
        const foodCounts={};
        const protByDate={};
        const calsByDate={};
        const since7=new Date(Date.now()-7*864e5).toISOString().split("T")[0];
        data.forEach(row=>{
          // Macro Memory: day-of-week food frequency
          const dow=new Date(row.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"});
          if(dow===todayDOW){
            (row.entries||[]).forEach(entry=>{
              const key=(entry.food||"").toLowerCase().trim();
              if(!key)return;
              if(!foodCounts[key]){foodCounts[key]={count:0,data:entry};}
              foodCounts[key].count++;
              foodCounts[key].data=entry;
            });
          }
          // Weekly protein + calories: last 7 days per ISO date
          if(row.date>=since7){
            const p=(row.entries||[]).reduce((s,e)=>s+(Number(e.protein)||0),0);
            protByDate[row.date]=(protByDate[row.date]||0)+p;
            const c=(row.entries||[]).reduce((s,e)=>s+(Number(e.calories)||0),0);
            calsByDate[row.date]=(calsByDate[row.date]||0)+c;
          }
        });
        const suggestions=Object.values(foodCounts)
          .filter(({count,data})=>count>=3&&!todayAlreadyLogged.has((data.food||"").toLowerCase().trim()))
          .sort((a,b)=>b.count-a.count)
          .slice(0,3);
        setMemorySuggestions(suggestions);
        setWeeklyProteinByDay(protByDate);
        setWeeklyCalsByDay(calsByDate);
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
  const [prepWarning,setPrepWarning]=useState(null);
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
        // === ALLERGEN FILTER — legacy path ===
        // Schema: proteins/carbs/vegetables/snacks = [{name,amount,prep}]
        //         mealAssignments.{training,rest}[slot] = "description string"
        const legacyChips=(profile?.dietary||[]).filter(d=>d&&d!=='none').map(d=>({'dairy':'No Dairy','gluten':'No Gluten','nuts':'No Nuts','halal':'No Pork'}[d])).filter(Boolean);
        const legacyRemovals=[];
        if(legacyChips.length>0){
          // Filter each ingredient-list category
          for(const cat of['proteins','carbs','vegetables','snacks']){
            if(!Array.isArray(plan[cat]))continue;
            const safe=plan[cat].filter(item=>{
              const texts=[item.name||'',item.amount||'',item.prep||''];
              for(const t of texts){if(legacyChips.some(c=>mealHasAllergen({name:t},legacyChips)))return false;}
              // Use mealHasAllergen on the combined strings
              return!mealHasAllergen({name:item.name||'',ingredients:[item.amount||'',item.prep||'']},legacyChips);
            });
            if(safe.length<plan[cat].length){
              const removed=plan[cat].filter(item=>!safe.includes(item));
              removed.forEach(r=>legacyRemovals.push(`${r.name||'item'} (${cat})`));
              plan[cat]=safe;
            }
          }
          // Filter mealAssignments description strings
          for(const dayType of['training','rest']){
            const slot=plan.mealAssignments?.[dayType];
            if(!slot)continue;
            for(const [meal,desc] of Object.entries(slot)){
              if(mealHasAllergen({name:desc||''},legacyChips)){
                legacyRemovals.push(`${meal} (${dayType} day assignment)`);
                delete slot[meal];
              }
            }
          }
        }
        const now=new Date().toISOString();
        setPrepPlan(plan);
        if(legacyRemovals.length>0)setPrepWarning(`Some items were removed for your restrictions: ${legacyRemovals.join(', ')}. Always verify before consuming.`);
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

  // Auto-trigger removed: legacy generatePrepPlan no longer auto-runs.
  // Users reach meal prep via Kitchen → Meal Prep card → new flow.

  // ── Quick Log Sheet ─────────────────────────────────────────────────────────
  const [showQuickLog,setShowQuickLog]=useState(false);
  const [undoEntry,setUndoEntry]=useState(null);
  const undoTimer=useRef(null);
  const mealPrepRef=useRef(null);
  const [mealPrepScreen,setMealPrepScreen]=useState('setup');
  // Persist new plan across sessions via localStorage
  const [mealPrepPlan,setMealPrepPlan]=useState(()=>{
    try{const s=localStorage.getItem('cm_mp_plan_v2');return s?JSON.parse(s):null;}catch{return null;}
  });
  const [mealPrepPrefs,setMealPrepPrefs]=useState(()=>{
    // Pre-fill from onboarding profile
    const freq=Math.min(4,Math.max(2,parseInt(String(wPrefs?.mealFreq||profile?.mealFreq))||3));
    const CHIP_MAP={'dairy':'No Dairy','gluten':'No Gluten','nuts':'No Nuts','halal':'No Pork'};
    const DIET_MAP={'vegan':'vegan','vegetarian':'vegetarian'};
    const stored=(profile?.dietary||[]).filter(d=>d&&d!=='none');
    const profileDietPreset=stored.reduce((a,v)=>a||(DIET_MAP[v]||null),null);
    const dietPreset=wPrefs?.mealPrepDiet||(profileDietPreset||'balanced');
    const dietaryPrefs=stored.filter(v=>!DIET_MAP[v]).map(v=>CHIP_MAP[v]).filter(Boolean);
    return{mealsPerDay:freq,prepTime:'1hr',dietaryPrefs,dietPreset,selectedDays:['Mon','Tue','Wed','Thu','Fri','Sat','Sun']};
  });
  const [mealPrepWarning,setMealPrepWarning]=useState(null);
  const [activeMealDetail,setActiveMealDetail]=useState(null); // {day, meal, dayIndex, mealIndex}
  const [showGroceryList,setShowGroceryList]=useState(false);
  const [checkedGroceryItems,setCheckedGroceryItems]=useState(()=>{try{const s=localStorage.getItem('mp_checked');return s?new Set(JSON.parse(s)):new Set();}catch{return new Set();}});
  const [regeneratingMeal,setRegeneratingMeal]=useState(null);
  const [regeneratingDay,setRegeneratingDay]=useState(null);
  const [mealPrepError,setMealPrepError]=useState(null);
  const [mpSaveConfirm,setMpSaveConfirm]=useState(false);
  const [mpStatusIdx,setMpStatusIdx]=useState(0);
  const MP_STATUSES=['Loading your recipe library...','Matching macros to your targets...','Selecting meals for each day...','Almost done...'];
  useEffect(()=>{try{localStorage.setItem('mp_checked',JSON.stringify([...checkedGroceryItems]));}catch{}},[checkedGroceryItems]);
  // Persist new-flow plan across app sessions
  useEffect(()=>{try{if(mealPrepPlan)localStorage.setItem('cm_mp_plan_v2',JSON.stringify(mealPrepPlan));else localStorage.removeItem('cm_mp_plan_v2');}catch{}},[mealPrepPlan]);
  useEffect(()=>{if(fuelScreen!=='mealprep'){setMealPrepScreen('setup');setShowGroceryList(false);setMpSaveConfirm(false);setMealPrepError(null);setMealPrepWarning(null);}},[fuelScreen]);
  useEffect(()=>{if(mealPrepScreen!=='generating')return;setMpStatusIdx(0);const id=setInterval(()=>setMpStatusIdx(i=>(i+1)%MP_STATUSES.length),2000);return()=>clearInterval(id);},[mealPrepScreen]);
  const [showRegenerateBanner,setShowRegenerateBanner]=useState(()=>localStorage.getItem('__mp_regen_needed')==='1');
  useEffect(()=>{if(mealPrepPlan?.days?.length>0){localStorage.setItem('__mp_exists','1');}else{localStorage.removeItem('__mp_exists');}},[mealPrepPlan]);
  useEffect(()=>{function onClear(){setMealPrepPlan(null);setShowRegenerateBanner(true);localStorage.setItem('__mp_regen_needed','1');localStorage.removeItem('__mp_exists');}window.addEventListener('cm_clear_meal_prep',onClear);return()=>window.removeEventListener('cm_clear_meal_prep',onClear);},[]);

  // normalizeDay/normalizeMeal: compact schema keys → verbose keys the renderer expects.
  function normalizeDay(day){
    if(!day)return;
    if(day.cal!=null&&day.totalCalories==null)day.totalCalories=day.cal;
    if(day.pro!=null&&day.totalProtein==null)day.totalProtein=day.pro;
    if(day.carb!=null&&day.totalCarbs==null)day.totalCarbs=day.carb;
    if(day.fat!=null&&day.totalFat==null)day.totalFat=day.fat;
    if(day.type!=null&&day.sessionType==null)day.sessionType=day.type;
    for(const meal of(day.meals||[]))normalizeMeal(meal);
  }
  function normalizeMeal(meal){
    if(!meal)return;
    if(meal.cal!=null&&meal.calories==null)meal.calories=meal.cal;
    if(meal.pro!=null&&meal.protein==null)meal.protein=meal.pro;
    if(meal.carb!=null&&meal.carbs==null)meal.carbs=meal.carb;
    if(meal.pt!=null&&meal.prepTime==null)meal.prepTime=meal.pt;
    // ingredients is [{item,amount}] from tool use; legacy: copy ing→ingredients
    if(Array.isArray(meal.ing)&&!Array.isArray(meal.ingredients))meal.ingredients=meal.ing;
  }

  // ── Phase 3: deterministic fitter replaces AI meal-prep generation ─────────────
  // generateMealPrepPlan: loads pool from Supabase → runs fitWeek (pure, instant) →
  // converts to renderer shape.  No AI call, no token cost, no JSON parsing.
  // PHASE 4 SEAM: swap dayTargets for per-day Fuel Flow targets here.

  async function generateMealPrepPlan(){
    setMealPrepError(null);setMealPrepWarning(null);
    setMealPrepScreen('generating');
    try{
      const sel=mealPrepPrefs.selectedDays;
      const nMeals=mealPrepPrefs.mealsPerDay||3;
      const diet=mealPrepPrefs.dietPreset||'balanced';
      const allergenTags=(mealPrepPrefs.dietaryPrefs||[]).map(c=>ALLERGEN_CHIP_TO_TAG[c]).filter(Boolean);

      // PHASE 4: per-day training-aware targets from getWeekNutrition (via weekMacros prop).
      // weekMacros = [{day:'Mon',calories,protein,carbs,fat,...}, ...] — same system that
      // drives the displayed daily target ring. No earnedCals, no todayProtocol override:
      // these are PLANNED day-type targets, not today-only adjustments.
      const _flatFallback={cal:macros?.calories||2000,pro:macros?.protein||150,carb:macros?.carbs||200,fat:macros?.fat||70};
      const dayTargets=sel.map(dayName=>{
        const e=weekMacros?.find(d=>d.day===dayName);
        return e?{cal:e.calories,pro:e.protein,carb:e.carbs,fat:e.fat}:_flatFallback;
      });

      // Load pool (DB-level pre-filter; fitter re-checks allergen gate internally)
      const pool=await loadMealPool(diet,allergenTags);

      // Run fitter — synchronous, deterministic, allergen-safe
      const weekResult=fitWeek({dayTargets,mealCount:nMeals,diet,allergens:allergenTags,pool,seed:Date.now()%100000});

      // Convert to plan shape the renderer expects
      const days=sel.map((dayName,i)=>fitterDayToShape(weekResult[i],dayName,schedule?.[dayName]||'rest'));
      const plan={days,groceryList:null};

      setMealPrepPlan(plan);
      setMealPrepScreen('plan');

      // Surface any thin-pool slots with an honest warning
      const thin=days.flatMap(d=>d.meals.filter(m=>m.unfillable).map(m=>`${d.day} ${m.slot}`));
      if(thin.length>0){
        setMealPrepWarning(`Some slots couldn't be filled from your recipe library for this combination: ${thin.join(', ')}. Try a less restrictive diet or fewer allergen filters.`);
      }
    }catch(e){
      console.error('[generateMealPrepPlan (fitter)]',e);
      setMealPrepError(e.message||`Couldn't build your plan — tap Generate to try again.`);
      setMealPrepScreen('setup');
    }
  }

  async function regenerateMeal(dayIndex,mealIndex){
    setRegeneratingMeal(`${dayIndex}_${mealIndex}`);
    try{
      const diet=mealPrepPrefs.dietPreset||'balanced';
      const allergenTags=(mealPrepPrefs.dietaryPrefs||[]).map(c=>ALLERGEN_CHIP_TO_TAG[c]).filter(Boolean);
      const _swapDayName=mealPrepPlan.days[dayIndex].day;
      const _swapEntry=weekMacros?.find(d=>d.day===_swapDayName);
      const dayTarget=_swapEntry?{cal:_swapEntry.calories,pro:_swapEntry.protein,carb:_swapEntry.carbs,fat:_swapEntry.fat}:{cal:macros?.calories||2000,pro:macros?.protein||150,carb:macros?.carbs||200,fat:macros?.fat||70};
      const currentSlot=mealPrepPlan.days[dayIndex].meals[mealIndex]?.slot||'lunch';
      const currentId=mealPrepPlan.days[dayIndex].meals[mealIndex]?._recipeId;
      const pool=await loadMealPool(diet,allergenTags);
      // Exclude the current recipe so the swap is always a different dish
      const swapPool=currentId?pool.filter(r=>r.id!==currentId):pool;
      const result=fitDay({dayTarget,mealCount:mealPrepPrefs.mealsPerDay||3,diet,allergens:allergenTags,pool:swapPool,seed:Date.now()%100000});
      const replacement=result.meals.find(m=>m.slot===currentSlot&&!m.unfillable);
      if(replacement){
        const{recipe,servings,scaledMacros}=replacement;
        const newMeal={
          name:recipe.name,
          calories:Math.round(scaledMacros.cal),protein:Math.round(scaledMacros.pro*10)/10,
          carbs:Math.round(scaledMacros.carb*10)/10,fat:Math.round(scaledMacros.fat*10)/10,
          ingredients:(recipe.ingredients||[]).map(ing=>({item:ing.item,amount:fmtIngAmt((ing.qty||0)*servings,ing.unit)})),
          instructions:recipe.instructions||null,slot:currentSlot,servings,_recipeId:recipe.id,unfillable:false,
        };
        setMealPrepPlan(prev=>{const u=JSON.parse(JSON.stringify(prev));u.days[dayIndex].meals[mealIndex]=newMeal;return u;});
      }
    }catch(e){console.error('[regenerateMeal (fitter)]',e);}
    setRegeneratingMeal(null);
  }

  async function regenerateDay(dayIndex){
    setRegeneratingDay(dayIndex);
    try{
      const diet=mealPrepPrefs.dietPreset||'balanced';
      const allergenTags=(mealPrepPrefs.dietaryPrefs||[]).map(c=>ALLERGEN_CHIP_TO_TAG[c]).filter(Boolean);
      const dayName=mealPrepPlan.days[dayIndex].day;
      const _rdEntry=weekMacros?.find(d=>d.day===dayName);
      const dayTarget=_rdEntry?{cal:_rdEntry.calories,pro:_rdEntry.protein,carb:_rdEntry.carbs,fat:_rdEntry.fat}:{cal:macros?.calories||2000,pro:macros?.protein||150,carb:macros?.carbs||200,fat:macros?.fat||70};
      const pool=await loadMealPool(diet,allergenTags);
      const result=fitDay({dayTarget,mealCount:mealPrepPrefs.mealsPerDay||3,diet,allergens:allergenTags,pool,seed:Date.now()%100000});
      const updated=fitterDayToShape(result,dayName,schedule?.[dayName]||'rest');
      setMealPrepPlan(prev=>{const u=JSON.parse(JSON.stringify(prev));u.days[dayIndex]=updated;return u;});
    }catch(e){console.error('[regenerateDay (fitter)]',e);}
    setRegeneratingDay(null);
  }

  async function saveMealPrepPlan(){
    if(!user||!mealPrepPlan)return;
    try{
      const today=new Date();
      const dayNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      for(const planDay of mealPrepPlan.days){
        const shortDay=planDay.day.slice(0,3);
        const todayDow=today.getDay();
        const targetDow=dayNames.indexOf(shortDay);
        if(targetDow===-1)continue;
        let diff=targetDow-todayDow;
        if(diff<0)diff+=7;
        const d=new Date(today);d.setDate(d.getDate()+diff);
        const dateStr=d.toISOString().split('T')[0];
        const entries=planDay.meals.filter(meal=>!meal.unfillable&&meal.name).map((meal,i)=>({id:`mp_${dateStr}_${i}_${Date.now()+i}`,food:meal.name,calories:meal.calories,protein:meal.protein,carbs:meal.carbs,fat:meal.fat,slot:i+1,method:'mealprep'}));
        const {data:existing}=await sb.from('food_logs').select('entries').eq('user_id',user.id).eq('date',dateStr).single();
        const kept=(existing?.entries||[]).filter(e=>e.method!=='mealprep');
        await sb.from('food_logs').upsert({user_id:user.id,date:dateStr,entries:[...kept,...entries],updated_at:new Date().toISOString()},{onConflict:'user_id,date'});
      }
      showToast('Meal plan saved for the week','success');
      setMpSaveConfirm(false);
      setFuelScreen('home');
    }catch(e){
      console.error('[saveMealPrepPlan]',e);
      showToast('Could not save plan','error');
    }
  }
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
    const foodLabel = food.name + (food.brand ? ` (${food.brand})` : "");
    const entry = grams != null ? {
      id: Date.now(),
      food: foodLabel,
      calories: Math.round((food.calories||0)*fg),
      protein: Math.round((food.protein||0)*fg*10)/10,
      carbs: Math.round((food.carbs||0)*fg*10)/10,
      fat: Math.round((food.fat||0)*fg*10)/10,
      grams,
      slot: slot || mealSlots[activeSlotIdx] || 1,
      source: food.source || "usda",
      icon: getFoodIcon(foodLabel),
    } : {
      id: Date.now(),
      food: food.name,
      calories: food.calories||0,
      protein: food.protein||0,
      carbs: food.carbs||0,
      fat: food.fat||0,
      slot: slot || mealSlots[activeSlotIdx] || 1,
      source: "quick",
      icon: getFoodIcon(food.name),
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

  // MY FOODS mode — persistent recent food history from the database
  const [myFoodsHistory,setMyFoodsHistory]=useState([]);
  useEffect(()=>{
    if(logMode==="myfoods"&&user){
      getRecentFoods(user.id).then(d=>setMyFoodsHistory(d||[]));
    }
  },[logMode,user]);
  useEffect(()=>{
    if(!user||!showQuickLog)return;
    getRecentFoods(user.id).then(d=>setQlRecentFoods(d||[]));
    getFrequentFoods(user.id).then(d=>setQlFrequentFoods(d||[]));
    const slot=mealSlots[activeSlotIdx]||1;
    getRecentMealsForSlot(user.id,slot,6).then(d=>setQlRecentMeals(d||[]));
  },[user,showQuickLog,activeSlotIdx]);

  const today=new Date().toISOString().split("T")[0];

  return (
    <div className={GOCLUB_REDESIGN?"goclub tab-fuel":"page-enter"} style={{paddingBottom:isMobile?20:0}}>
      {GOCLUB_REDESIGN&&<style>{_FUEL_GOCLUB_CSS}</style>}
      {/* ── PAGE HEADER ── */}
      <div className="screen-header" style={{paddingTop:12}}>
        <div style={{flex:1,minWidth:0}}>
          {GOCLUB_REDESIGN?(()=>{
            const _ec=n=>n>=80?'#22C55E':n>=50?'#F59E0B':'#FF3B30';
            const _yISO=new Date(Date.now()-864e5).toISOString().split('T')[0];
            const _yMac=weekMacros?.find(d=>d.day===yesterdayKey);
            // Protein page
            const _protPct=macros.protein>0?Math.round(consumed.protein/macros.protein*100):0;
            const _yProtTgt=_yMac?.protein||macros.protein;
            const _yProtPct=_yProtTgt>0&&weeklyProteinByDay[_yISO]!=null?Math.round(weeklyProteinByDay[_yISO]/_yProtTgt*100):null;
            const _protDelta=_yProtPct!=null?_protPct-_yProtPct:null;
            // Calories page
            const _calRemPct=macros.calories>0?Math.round(Math.max(0,remaining.calories)/macros.calories*100):0;
            const _calConsPct=macros.calories>0?Math.round(consumed.calories/macros.calories*100):0;
            const _yCalTgt=_yMac?.calories||macros.calories;
            const _yCalConsPct=_yCalTgt>0&&weeklyCalsByDay[_yISO]!=null?Math.round(weeklyCalsByDay[_yISO]/_yCalTgt*100):null;
            const _calDelta2=_yCalConsPct!=null?_calConsPct-_yCalConsPct:null;
            const _pages=[
              <><span style={{color:'rgba(255,255,255,0.4)'}}>PROTEIN</span><span style={{color:'rgba(255,255,255,0.18)',margin:'0 5px'}}>|</span><span style={{color:_ec(_protPct)}}>{_protPct}% hit</span>{_protDelta!=null&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:_protDelta>=0?'#22C55E':'#FF3B30',marginLeft:6,letterSpacing:'0.06em'}}>{_protDelta>=0?'+':''}{_protDelta}% vs yest.</span>}</>,
              <><span style={{color:'rgba(255,255,255,0.4)'}}>CALORIES</span><span style={{color:'rgba(255,255,255,0.18)',margin:'0 5px'}}>|</span><span style={{color:_ec(_calRemPct)}}>{_calRemPct}% remaining</span>{_calDelta2!=null&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:_calDelta2>=0?'#22C55E':'#FF3B30',marginLeft:6,letterSpacing:'0.06em'}}>{_calDelta2>=0?'+':''}{_calDelta2}% vs yest.</span>}</>,
            ];
            return(
              <div className="header-eyebrow"
                style={{overflow:'hidden',userSelect:'none'}}
                onPointerDown={e=>{_fuelEyeX.current=e.clientX;_fuelEyeY.current=e.clientY;}}
                onPointerUp={e=>{
                  const dx=e.clientX-_fuelEyeX.current,dy=e.clientY-_fuelEyeY.current;
                  if(Math.abs(dx)>30&&Math.abs(dx)>Math.abs(dy)*1.5)_setFuelEyePg(p=>dx<0?Math.min(1,p+1):Math.max(0,p-1));
                }}
              >
                <motion.div
                  animate={{x:_fuelEyePg===0?'0%':'-50%'}}
                  transition={_fuelEyeRedMo?{duration:0}:{type:'spring',stiffness:500,damping:40}}
                  style={{display:'flex',width:'200%'}}
                >
                  <div style={{width:'50%'}}>{_pages[0]}</div>
                  <div style={{width:'50%'}}>{_pages[1]}</div>
                </motion.div>
              </div>
            );
          })():(
            <div className="header-eyebrow">// {new Date().toLocaleDateString("en-US",{weekday:"long"})} · {macros.isFlexDay?"Flex Day":(cfg.label+" Day")}</div>
          )}
          {!GOCLUB_REDESIGN&&(
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:44,height:44,borderRadius:13,background:"rgba(232,52,28,0.12)",border:"1px solid rgba(232,52,28,0.28)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8 2 4 6 4 10c0 6 8 12 8 12s8-6 8-12c0-4-4-8-8-8z" fill="var(--red)" opacity="0.8"/>
                  <path d="M12 6c0 0-2 2-2 4s2 4 2 4" stroke="rgba(245,245,240,0.5)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
              <div className="header-title">Fuel</div>
            </div>
          )}
        </div>
        {!GOCLUB_REDESIGN&&(
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--red)",fontWeight:700,letterSpacing:"0.1em"}}>{macros.calories.toLocaleString()} kcal</div>
          </div>
        )}
      </div>
      {/* GOCLUB: contextual hero + segmented sub-nav + date navigator */}
      {GOCLUB_REDESIGN&&(()=>{
        return(
          <>
            {/* Hero zone — ring on Home only; nothing on sub-screens (no gap) */}
            <AnimatePresence>
              {fuelScreen==="home"&&(()=>{
                const _circ=parseFloat((2*Math.PI*100).toFixed(1));
                const _calRem=Math.max(0,remaining.calories);
                const _calOver=remaining.calories<0;
                const _calPct=macros.calories>0?Math.min(1,consumed.calories/macros.calories):0;
                const _tipA=_calPct*2*Math.PI-Math.PI/2;
                const _tipX=(110+100*Math.cos(_tipA)).toFixed(2);
                const _tipY=(110+100*Math.sin(_tipA)).toFixed(2);
                const _cnd={fontFamily:"'Archivo',sans-serif",fontStyle:'normal',fontWeight:800};
                return(
                  <motion.div key="hero-ring"
                    initial={{opacity:0,scale:0.96}}
                    animate={{opacity:1,scale:1,transition:_fuelEyeRedMo?{duration:0}:{duration:0.22,ease:'easeOut'}}}
                    exit={{opacity:0,scale:0.96,transition:_fuelEyeRedMo?{duration:0}:{duration:0.25,ease:'easeIn'}}}
                    style={{padding:"0 18px 8px"}}
                  >
                    <div style={{position:'relative',height:220,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',overflow:'hidden'}}>
                      {/* Ring SVG — centered absolutely, behind text overlay */}
                      <svg width="220" height="220" viewBox="0 0 220 220"
                        style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%) rotate(-90deg)',filter:'drop-shadow(0 0 16px rgba(232,52,28,0.10))'}}>
                        <defs>
                          <linearGradient id="calRingHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FF3B30"/>
                            <stop offset="100%" stopColor="#FAFAF0" stopOpacity="0.9"/>
                          </linearGradient>
                          <linearGradient id="calRingHeroGradOver" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FF3B30"/>
                            <stop offset="100%" stopColor="#FF6B5C"/>
                          </linearGradient>
                        </defs>
                        <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(245,245,240,0.12)" strokeWidth="14"/>
                        {_calOver&&<circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255,59,48,0.3)" strokeWidth="14" strokeLinecap="round" strokeDasharray={_circ} strokeDashoffset="0"/>}
                        <MotionArc cx={110} cy={110} r={100} pct={_calPct}
                          stroke={`url(#${_calOver?'calRingHeroGradOver':'calRingHeroGrad'})`}
                          strokeWidth={14}/>
                        {_calPct>0.02&&(
                          <motion.circle cx={_tipX} cy={_tipY} r="7" fill="#FF3B30"
                            initial={{opacity:0}} animate={{opacity:1}}
                            transition={{delay:0.72,duration:0.18}}
                            style={{filter:_calOver?'drop-shadow(0 0 10px rgba(255,59,48,1.0))':'drop-shadow(0 0 6px rgba(255,59,48,0.8)) drop-shadow(0 0 12px rgba(255,59,48,0.4))'}}/>
                        )}
                      </svg>
                      {/* Flex overlay: consumed | ring-spacer (remaining inside) | target
                          88px columns + 12px padding each side — spacer center = card center.
                          Side labels use plain text (not NumberFlow) so width = exact font width,
                          no shadow-DOM overflow. overflow:hidden on columns is the hard stop. */}
                      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',padding:'0 12px',boxSizing:'border-box'}}>
                        <div style={{width:88,flexShrink:0,textAlign:'center',overflow:'hidden'}}>
                          <div style={{..._cnd,fontSize:22,color:'#f5f5f0',lineHeight:1}}>{Math.round(consumed.calories).toLocaleString()}</div>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(245,245,240,0.4)',letterSpacing:'0.12em',textTransform:'uppercase',marginTop:4}}>CONSUMED</div>
                        </div>
                        <div style={{flex:1,alignSelf:'stretch',position:'relative'}}>
                          <div style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none',width:'100%'}}>
                            <div style={{..._cnd,fontSize:48,color:_calOver?'#e8341c':'#f5f5f0',lineHeight:1,letterSpacing:'-0.02em',textShadow:'0 0 30px rgba(245,245,240,0.15), 0 2px 24px rgba(0,0,0,0.8)'}}>
                              {_calOver?<MN value={Math.abs(remaining.calories)} format={{useGrouping:true}} prefix="+"/>:<MN value={_calRem} format={{useGrouping:true}}/>}
                            </div>
                            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(245,245,240,0.4)',letterSpacing:'0.14em',textTransform:'uppercase',marginTop:4}}>{_calOver?'OVER':'REMAINING'}</div>
                            {calDelta!==null&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:calDelta>0?'#22C55E':calDelta<0?'rgba(255,255,255,0.4)':'rgba(255,255,255,0.3)',letterSpacing:'0.1em',marginTop:2}}><MN value={calDelta} format={{signDisplay:'exceptZero'}}/> vs yest.</div>}
                          </div>
                        </div>
                        <div style={{width:88,flexShrink:0,textAlign:'center',overflow:'hidden'}}>
                          <div style={{..._cnd,fontSize:22,color:'rgba(245,245,240,0.5)',lineHeight:1}}>{Math.round(macros.calories).toLocaleString()}</div>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(245,245,240,0.4)',letterSpacing:'0.12em',textTransform:'uppercase',marginTop:4}}>TARGET</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
            {/* Segmented sub-nav — centered, 2 tabs (Home / Kitchen) */}
            <div style={{padding:"0 18px 4px",flexShrink:0,display:"flex",justifyContent:"center"}}>
              <div style={{display:"inline-flex",background:"rgba(255,255,255,0.06)",borderRadius:10,padding:3,gap:2}}>
                {FUEL_TABS.map(tab=>(
                  <button key={tab.id} onClick={()=>setFuelScreen(tab.id)}
                    style={{padding:"7px 22px",borderRadius:8,border:"none",cursor:"pointer",
                      fontFamily:"'Archivo',sans-serif",fontWeight:600,fontSize:12,
                      color:fuelScreen===tab.id?"#fff":"rgba(255,255,255,0.4)",
                      background:fuelScreen===tab.id?"#e8341c":"transparent",
                      whiteSpace:"nowrap",transition:"all 0.15s",flexShrink:0,letterSpacing:"0.02em"}}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        );
      })()}
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
      {/* Sub-nav (non-GOCLUB) */}
      {!GOCLUB_REDESIGN&&(
      <div style={{display:"flex",gap:4,padding:isMobile?"12px 18px 0":"0 0 20px",overflowX:"auto",flexShrink:0}}>
        {FUEL_TABS.map(tab=>(
          <button key={tab.id} onClick={()=>setFuelScreen(tab.id)}
            style={{padding:"8px 16px",borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",background:fuelScreen===tab.id?T.prot:"none",
              color:fuelScreen===tab.id?"#fff":T.mu,fontSize:13,fontWeight:600,whiteSpace:"nowrap",transition:"all 0.15s",flexShrink:0}}>
            {tab.label}
          </button>
        ))}
      </div>
      )}

      <div style={{padding:isMobile?"12px 18px":"0"}}>

        {/* ── HOME ── */}
        {fuelScreen==="home"&&(()=>{
          try{return(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {/* MACRO MEMORY — shown first so the fastest re-log path is always above the fold */}
            {wPrefs?.macroMemory!==false&&memorySuggestions.filter(s=>!skippedMemory.has(s.data.food)).length>0&&(
              <StaggerItem i={0}>
              <div style={{background:GOCLUB_REDESIGN?'rgba(255,255,255,0.05)':T.s1,border:`1px solid ${GOCLUB_REDESIGN?'rgba(255,255,255,0.08)':T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div>
                    <div style={{fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"var(--condensed)",fontSize:18,fontWeight:900,letterSpacing:.5}}>MACRO MEMORY</div>
                    <div style={{fontSize:11,color:T.mu,marginTop:2}}>Based on your {new Date().toLocaleDateString("en-US",{weekday:"long"})} patterns</div>
                  </div>
                  {memoryLoggedMsg&&<div style={{fontSize:11,color:T.green,fontWeight:700}}>{memoryLoggedMsg}</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {memorySuggestions.filter(s=>!skippedMemory.has(s.data.food)).map(({count,data})=>(
                    <div key={data.food} style={{background:GOCLUB_REDESIGN?'rgba(255,255,255,0.05)':T.s2,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{data.food}</div>
                        <div style={{fontSize:11,color:T.mu,marginTop:2}}>{data.calories} kcal · {data.protein}g protein</div>
                      </div>
                      <div style={{display:"flex",gap:6,flexShrink:0}}>
                        <motion.button
                          onClick={()=>{if(logEntry)logEntry(data);setMemoryLoggedMsg(`✓ Logged. ${remaining.calories-data.calories} kcal remaining.`);setTimeout(()=>setMemoryLoggedMsg(""),3000);}}
                          onPointerDown={GOCLUB_REDESIGN?()=>_hL():undefined}
                          whileTap={GOCLUB_REDESIGN?{scale:0.91}:undefined}
                          transition={GOCLUB_REDESIGN?{type:'spring',stiffness:600,damping:20}:undefined}
                          style={{padding:"7px 12px",background:T.prot,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",touchAction:GOCLUB_REDESIGN?"manipulation":undefined}}>Log</motion.button>
                        <button onClick={()=>setSkippedMemory(s=>new Set([...s,data.food]))} style={{padding:"7px 10px",background:"none",border:`1px solid ${T.bd}`,color:T.mu,borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Skip</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </StaggerItem>
            )}
            {/* ── MACRO RING ── */}
            {(()=>{
              const circ=parseFloat((2*Math.PI*100).toFixed(1));
              const calRemaining=Math.max(0,remaining.calories);
              const calOver=remaining.calories<0;
              const calPct=macros.calories>0?Math.min(1,consumed.calories/macros.calories):0;
              const fillLen=parseFloat((calPct*circ).toFixed(1));
              const cnd=GOCLUB_REDESIGN
                ?{fontFamily:"'Archivo',sans-serif",fontStyle:'normal',fontWeight:800}
                :{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900};
              const mno={fontFamily:"'DM Mono',monospace"};
              const tipAngle=calPct*2*Math.PI-Math.PI/2;
              const tipX=(110+100*Math.cos(tipAngle)).toFixed(2);
              const tipY=(110+100*Math.sin(tipAngle)).toFixed(2);
              return(
                <StaggerItem i={1}>
                <>
                  <style>{`
                    @keyframes fuelBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
                  `}</style>

                  {/* Ring row: in GOCLUB this is rendered in the hero above; legacy only */}
                  {!GOCLUB_REDESIGN&&<div style={{
                    position:'relative',height:220,
                    background:'rgba(245,245,240,0.03)',
                    backgroundImage:'radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)',
                    boxShadow:'0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(245,245,240,0.08), inset 0 1px 0 0 rgba(245,245,240,0.12)',
                    borderRadius:'16px',
                  }}>
                    <svg width="220" height="220" viewBox="0 0 220 220"
                      style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%) rotate(-90deg)',filter:'drop-shadow(0 0 16px rgba(232,52,28,0.10))'}}>
                      <defs>
                        <linearGradient id="calRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FF3B30"/>
                          <stop offset="100%" stopColor="#FAFAF0" stopOpacity="0.9"/>
                        </linearGradient>
                        <linearGradient id="calRingGradientOver" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FF3B30"/>
                          <stop offset="100%" stopColor="#FF6B5C"/>
                        </linearGradient>
                      </defs>
                      <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(245,245,240,0.12)" strokeWidth="14"/>
                      {calOver&&<circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255,59,48,0.3)" strokeWidth="14" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset="0"/>}
                      <MotionArc cx={110} cy={110} r={100} pct={calPct}
                        stroke={`url(#${calOver?'calRingGradientOver':'calRingGradient'})`}
                        strokeWidth={14} />
                      {calPct>0.02&&(
                        GOCLUB_REDESIGN
                          ? <motion.circle cx={tipX} cy={tipY} r="7" fill="#FF3B30"
                              initial={{opacity:0}} animate={{opacity:1}}
                              transition={{delay:0.72,duration:0.18}}
                              style={{filter:calOver?'drop-shadow(0 0 10px rgba(255,59,48,1.0))':'drop-shadow(0 0 6px rgba(255,59,48,0.8)) drop-shadow(0 0 12px rgba(255,59,48,0.4))'}}/>
                          : <circle cx={tipX} cy={tipY} r="7" fill="#FF3B30"
                              style={{filter:calOver?'drop-shadow(0 0 10px rgba(255,59,48,1.0))':'drop-shadow(0 0 6px rgba(255,59,48,0.8)) drop-shadow(0 0 12px rgba(255,59,48,0.4))'}}/>
                      )}
                    </svg>
                    {/* Left — consumed */}
                    <div style={{position:'absolute',left:0,top:'50%',transform:'translateY(-50%)',textAlign:'center',width:62}}>
                      <div style={{...cnd,fontSize:26,color:'#f5f5f0',lineHeight:1}}><MN value={consumed.calories} format={{useGrouping:true}} /></div>
                      <div style={{...mno,fontSize:8,color:'rgba(245,245,240,0.4)',letterSpacing:'0.12em',textTransform:'uppercase',marginTop:4}}>CONSUMED</div>
                    </div>
                    {/* Center — remaining */}
                    <div style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none'}}>
                      <div style={{...cnd,fontSize:48,color:calOver?'#e8341c':'#f5f5f0',lineHeight:1,letterSpacing:'-0.02em',textShadow:'0 0 30px rgba(245,245,240,0.15), 0 2px 24px rgba(0,0,0,0.8)'}}>
                        {calOver
                          ? <MN value={Math.abs(remaining.calories)} format={{useGrouping:true}} prefix="+" />
                          : <MN value={calRemaining} format={{useGrouping:true}} />}
                      </div>
                      <div style={{...mno,fontSize:9,color:'rgba(245,245,240,0.4)',letterSpacing:'0.14em',textTransform:'uppercase',marginTop:4}}>
                        {calOver?'OVER':'REMAINING'}
                      </div>
                      {GOCLUB_REDESIGN&&calDelta!==null&&(
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:calDelta>0?'#22C55E':calDelta<0?'rgba(255,255,255,0.4)':'rgba(255,255,255,0.3)',letterSpacing:'0.1em',marginTop:2}}>
                          <MN value={calDelta} format={{signDisplay:'exceptZero'}} /> vs yest.
                        </div>
                      )}
                    </div>
                    {/* Right — target */}
                    <div style={{position:'absolute',right:0,top:'50%',transform:'translateY(-50%)',textAlign:'center',width:62}}>
                      <div style={{...cnd,fontSize:26,color:'rgba(245,245,240,0.5)',lineHeight:1}}><MN value={macros.calories} format={{useGrouping:true}} /></div>
                      <div style={{...mno,fontSize:8,color:'rgba(245,245,240,0.4)',letterSpacing:'0.12em',textTransform:'uppercase',marginTop:4}}>TARGET</div>
                    </div>
                  </div>}

                  {/* Macro bars */}
                  <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:20}}>
                    {[
                      {label:'PROTEIN',c:Math.round(consumed.protein),t:Math.round(macros.protein),color:'#FF3B30'},
                      {label:'CARBS',  c:Math.round(consumed.carbs),  t:Math.round(macros.carbs),  color:'#60a5fa'},
                      {label:'FAT',    c:Math.round(consumed.fat),    t:Math.round(macros.fat),    color:'#FEA020'},
                    ].map(({label,c,t,color})=>(
                      <div key={label} style={{display:'flex',alignItems:'center',gap:12}}>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,textTransform:'uppercase',letterSpacing:'0.12em',width:56,color:GOCLUB_REDESIGN?'rgba(255,255,255,0.40)':'rgba(245,245,240,0.5)',flexShrink:0}}>{label}</div>
                        <div style={{flex:1,height:6,background:GOCLUB_REDESIGN?'rgba(255,255,255,0.08)':'rgba(245,245,240,0.06)',borderRadius:3,overflow:'hidden'}}>
                          <div style={{height:'100%',borderRadius:3,background:color,width:`${Math.min(100,t>0?Math.round(c/t*100):0)}%`,transition:'width 0.5s ease'}}/>
                        </div>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'#f5f5f0',letterSpacing:'0.08em',whiteSpace:'nowrap'}}><MN value={c} /> / <MN value={t} />g</div>
                      </div>
                    ))}
                  </div>
                  {/* Day-type label + keyInsight — from getDayTypeNutrition via weekMacros.
                      label: "Long Run Day" / "Rest Day" / "Heavy Leg Day" etc.
                      keyInsight: coaching rationale for today's target. */}
                  {GOCLUB_REDESIGN&&todayWeekEntry&&(todayWeekEntry.label||todayWeekEntry.keyInsight)&&(
                    <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                      {todayWeekEntry.label&&(
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:todayWeekEntry.color||'#FF3B30',fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',marginBottom:4}}>
                          // {todayWeekEntry.label.toUpperCase()}
                        </div>
                      )}
                      {todayWeekEntry.keyInsight&&(
                        <div style={{fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:500,color:'rgba(255,255,255,0.55)',lineHeight:1.5}}>
                          {todayWeekEntry.keyInsight}
                        </div>
                      )}
                    </div>
                  )}

                  {/* WEEKLY PROTEIN ADHERENCE + TRAINING-DAY MATCH */}
                  {GOCLUB_REDESIGN&&weekMacros&&(()=>{
                    const today7=new Date();
                    const days7=Array.from({length:7},(_,i)=>{
                      const d=new Date(today7);
                      d.setDate(d.getDate()-(6-i));
                      const iso=d.toISOString().split('T')[0];
                      const wdayIdx=(d.getDay()+6)%7;
                      const abbr=WDAYS_ORDER[wdayIdx];
                      const entry=weekMacros.find(x=>x.day===abbr);
                      const target=entry?.protein||macros.protein||150;
                      const isToday=i===6;
                      const logged=isToday?consumed.protein:(weeklyProteinByDay[iso]||0);
                      const hit=logged>=target*0.9;
                      return{abbr,iso,logged,target,isToday,hit,schedType:entry?.schedType||'rest'};
                    });
                    const trainingDays=days7.filter(d=>d.schedType!=='rest');
                    const restDays=days7.filter(d=>d.schedType==='rest');
                    const trainHits=trainingDays.filter(d=>d.hit).length;
                    const restHits=restDays.filter(d=>d.hit).length;
                    return(
                      <div style={{marginTop:14,paddingTop:12,borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                        {/* Training-day match line */}
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(255,255,255,0.40)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10,display:'flex',gap:6,alignItems:'center'}}>
                          <span>Protein:</span>
                          <span style={{color:'#22C55E'}}>{trainHits}/{trainingDays.length} training</span>
                          <span style={{color:'rgba(255,255,255,0.25)'}}>·</span>
                          <span style={{color:'rgba(255,255,255,0.55)'}}>{restHits}/{restDays.length} rest</span>
                        </div>
                        {/* 7-bar weekly view */}
                        <div style={{display:'flex',gap:4,alignItems:'flex-end'}}>
                          {days7.map(({abbr,iso,logged,target,isToday,hit,schedType})=>{
                            const pct=Math.min(1,target>0?logged/target:0);
                            const isTrainDay=schedType!=='rest';
                            return(
                              <div key={iso} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                                <div style={{width:'100%',height:36,background:'rgba(255,255,255,0.06)',borderRadius:4,position:'relative',overflow:'hidden',outline:isToday?'1px solid rgba(255,59,48,0.5)':'none',outlineOffset:-1}}>
                                  <div style={{position:'absolute',bottom:0,left:0,right:0,height:`${Math.round(pct*100)}%`,background:hit?'#22C55E':'rgba(255,255,255,0.40)',borderRadius:4,transition:'height 0.4s ease',boxShadow:isToday&&hit?'0 0 8px rgba(34,197,94,0.4)':undefined}}/>
                                </div>
                                <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:isToday?'#FF3B30':isTrainDay?'rgba(255,255,255,0.45)':'rgba(255,255,255,0.25)',letterSpacing:'0.08em',textTransform:'uppercase'}}>{abbr}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* WHY ARE MY MACROS LIKE THIS? */}
                  {(()=>{
                    const isTraining=todayType==='training';
                    const carbDiff=Math.round((todayProtocol?.adjusted_carbs_g||0)-(todayProtocol?.base_carbs_g||0));
                    const protAdj=isTraining?Math.max(10,Math.round(macros.protein*0.06)):8;
                    const macroRows=[
                      {
                        key:'PROTEIN',color:'#e8341c',chipBg:'rgba(232,52,28,0.12)',chipBorder:'rgba(232,52,28,0.3)',
                        arrows:[{dir:'↑',bg:'rgba(34,197,94,0.15)',c:'#22c55e'}],
                        amount:`+${protAdj}g`,amountColor:'#22c55e',
                        text:isTraining?'Training day — extra protein supports muscle recovery and growth post-workout.':'Muscle protein synthesis continues 24–48h post-workout. Protein stays elevated on rest days.',
                      },
                      {
                        key:'CARBS',color:'#60a5fa',chipBg:'rgba(96,165,250,0.12)',chipBorder:'rgba(96,165,250,0.3)',
                        arrows:Math.abs(carbDiff)>5
                          ?(carbDiff>0?(carbDiff>50?[{dir:'↑',bg:'rgba(34,197,94,0.15)',c:'#22c55e'},{dir:'↑',bg:'rgba(34,197,94,0.15)',c:'#22c55e'}]:[{dir:'↑',bg:'rgba(34,197,94,0.15)',c:'#22c55e'}]):[{dir:'↓',bg:'rgba(232,52,28,0.15)',c:'#e8341c'}])
                          :[{dir:'→',bg:'rgba(245,245,240,0.06)',c:'rgba(245,245,240,0.35)'}],
                        amount:Math.abs(carbDiff)>5?`${carbDiff>0?'+':''}${carbDiff}g`:'—',
                        amountColor:carbDiff>5?'#22c55e':carbDiff<-5?'#e8341c':'rgba(245,245,240,0.35)',
                        text:carbDiff>5?`${todayFocus||'Training'} day — carbohydrates are your primary fuel for compound movements.`:carbDiff<-5?'No training today — reduced carbs match your lower energy demand.':'Carb targets are consistent today.',
                      },
                      {
                        key:'FAT',color:'#FEA020',chipBg:'rgba(254,160,32,0.12)',chipBorder:'rgba(254,160,32,0.3)',
                        arrows:[{dir:'→',bg:'rgba(245,245,240,0.06)',c:'rgba(245,245,240,0.35)'}],
                        amount:'same',amountColor:'rgba(245,245,240,0.35)',
                        text:'Fat targets stay consistent across training and rest days.',
                      },
                    ];
                    return(
                      <div style={{marginTop:12,borderTop:'1px solid rgba(232,52,28,0.08)'}}>
                        <div onClick={()=>setWhyExpanded(w=>!w)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0',cursor:'pointer'}}>
                          <div style={{...mno,fontSize:10,color:'rgba(245,245,240,0.4)',letterSpacing:'0.12em'}}>WHY ARE MY MACROS LIKE THIS?</div>
                          <div style={{color:'#e8341c',fontSize:14}}>{whyExpanded?'↑':'↓'}</div>
                        </div>
                        {whyExpanded&&(
                          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
                            {macroRows.map(r=>(
                              <div key={r.key} style={{background:'#0d0d0d',border:'1px solid rgba(232,52,28,0.08)',borderRadius:10,padding:'12px 14px',display:'flex',flexDirection:'column',gap:6}}>
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                  <span style={{background:r.chipBg,border:`1px solid ${r.chipBorder}`,borderRadius:20,padding:'3px 10px',...mno,fontSize:9,color:r.color,letterSpacing:'0.12em',textTransform:'uppercase'}}>{r.key}</span>
                                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                                    {r.arrows.map((a,i)=>(
                                      <div key={i} style={{width:20,height:20,borderRadius:'50%',background:a.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:a.c}}>{a.dir}</div>
                                    ))}
                                    <span style={{...mno,fontSize:10,color:r.amountColor,letterSpacing:'0.08em'}}>{r.amount}</span>
                                  </div>
                                </div>
                                <div style={{fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"'Barlow Condensed',sans-serif",fontSize:GOCLUB_REDESIGN?13:15,color:'#f5f5f0',lineHeight:1.4,fontWeight:GOCLUB_REDESIGN?500:400}}>{r.text}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                </>
                </StaggerItem>
              );
            })()}

            {/* FOOD LOG — grouped by meal slots */}
            {(()=>{
              const lSlots=getLoggedSlots(log);
              const slotTargets=getSlotTargets(macros.calories,mealSlots,skippedSlots||[],lSlots,slotOverages||{});
              const basePerSlot=Math.round(macros.calories/mealSlots.length);
              return(
                <StaggerItem i={2}>
                <div style={{background:GOCLUB_REDESIGN?'rgba(255,255,255,0.05)':T.s1,border:`1px solid ${GOCLUB_REDESIGN?'rgba(255,255,255,0.08)':T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                  {(()=>{
                    const f=profile?.fasting||profile?.profile_data?.fasting;
                    if(!f||f==="no")return null;
                    const windowLabel=f==="16:8"?"8h eating window":f==="omad"?"OMAD — 1 meal":f==="custom"?`${Math.max(1,24-fastHours)}h eating window`:"Fasting active";
                    return<div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(96,165,250,0.6)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>{windowLabel}</div>;
                  })()}
                  <div style={{marginBottom:14}}>
                    <div className="header-eyebrow" style={{marginBottom:2,color:GOCLUB_REDESIGN?'rgba(255,255,255,0.40)':undefined}}>// Today's Meals</div>
                    <div style={{fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"var(--condensed)",fontStyle:GOCLUB_REDESIGN?"normal":"italic",fontWeight:900,fontSize:18,textTransform:"uppercase",lineHeight:1}}>Food Log</div>
                  </div>
                  <div>
                    {mealSlots.map((slot,si)=>{
                      const isSkipped=(skippedSlots||[]).includes(slot);
                      const isLocked=(lockedSlots||[]).includes(slot);
                      const slotItems=log.filter(e=>getEntrySlot(e)===slot);
                      const slotCals=slotItems.reduce((s,e)=>s+(e.calories||0),0);
                      const target=slotTargets[slot]||0;
                      const hasRedistributed=!isSkipped&&(skippedSlots||[]).length>0&&!lSlots.includes(slot)&&target>basePerSlot;
                      const hasOverageReduction=!isSkipped&&!lSlots.includes(slot)&&Object.keys(slotOverages||{}).some(k=>parseInt(k)!==slot);
                      return(
                        <div key={slot} style={{marginBottom:12,opacity:isSkipped?0.4:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:slotItems.length>0?6:4}}>
                            {/* Lock icon on locked slots */}
                            {isLocked&&<svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={11} width={18} height={11} rx={2} ry={2}/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                            <span style={{fontFamily:"var(--mono)",fontSize:9,fontWeight:700,color:isSkipped?"rgba(245,245,240,0.4)":isLocked?"#22c55e":"#f5f5f0",letterSpacing:"0.12em",textTransform:"uppercase"}}>{getSlotLabel(slot)}</span>
                            <div style={{flex:1,height:1,background:"rgba(255,255,255,0.05)"}}/>
                            {isSkipped?(
                              <span style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.3)",letterSpacing:"0.08em"}}>SKIPPED</span>
                            ):isLocked?(
                              <span style={{fontFamily:"var(--mono)",fontSize:9,color:"#22c55e",letterSpacing:"0.08em"}}>LOCKED</span>
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
                            {/* "+" hidden on locked + skipped slots; shows lock gate for earlier unlocked slots */}
                            {!isSkipped&&!isLocked&&(
                              <motion.button
                                onPointerDown={GOCLUB_REDESIGN?()=>_hL():undefined}
                                whileTap={GOCLUB_REDESIGN?{scale:0.88}:undefined}
                                transition={GOCLUB_REDESIGN?{type:'spring',stiffness:600,damping:20}:undefined}
                                onClick={()=>{
                                  const pendingIdx=mealSlots.indexOf(slot)>=0?mealSlots.indexOf(slot):0;
                                  // Check if any earlier slot has items and is not yet locked
                                  const slotToLock=mealSlots.find(s=>s<slot&&log.some(e=>getEntrySlot(e)===s)&&!(lockedSlots||[]).includes(s));
                                  if(slotToLock){
                                    setLockGate({slotToLock,pendingIdx});
                                  }else{
                                    pendingLogSlotRef.current=pendingIdx;
                                    setFuelScreen('log');
                                  }
                                }}
                                style={{width:44,height:44,background:"rgba(232,52,28,0.15)",border:"1.5px solid #e8341c",color:"#e8341c",borderRadius:10,fontSize:20,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,touchAction:GOCLUB_REDESIGN?"manipulation":undefined}}>+</motion.button>
                            )}
                            {mealSlots.length>1&&!isSkipped&&!isLocked&&(
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
                              onDelete={isLocked?null:()=>{
                                const snap={...item};
                                removeLog(item.id);
                                showToast(`${snap.food||"Item"} removed`,{action:()=>logEntry(snap),actionLabel:"Undo"});
                              }}
                              style={{borderBottom:i<slotItems.length-1?`1px solid rgba(245,245,240,0.04)`:""}}
                            >
                              <div
                                className="card-press"
                                onPointerDown={isLocked?undefined:()=>{longPressRef.current=setTimeout(()=>{hap();setContextMenu({item,slot});},500);}}
                                onPointerUp={isLocked?undefined:()=>clearTimeout(longPressRef.current)}
                                onPointerLeave={isLocked?undefined:()=>clearTimeout(longPressRef.current)}
                                style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0"}}
                              >
                                <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
                                  {item.photo_url
                                    ? <div style={{width:32,height:32,borderRadius:8,overflow:"hidden",flexShrink:0}}><img src={item.photo_url} style={{width:32,height:32,objectFit:"cover"}} alt=""/></div>
                                    : <FoodIcon name={item} method={item.method} size={32} userId={user?.id} />
                                  }
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
                                  {!isLocked&&<button onClick={()=>removeLog(item.id)} style={{background:T.s2,border:`1px solid ${T.bd}`,color:T.mu,cursor:"pointer",fontSize:13,padding:"4px 8px",borderRadius:6}}>×</button>}
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
                    {log.length===0&&(()=>{
                      const h=new Date().getHours();
                      const calR=Math.round(remaining?.calories||0);
                      const protR=Math.round(remaining?.protein||0);
                      const msg=h<10
                        ?{head:"BREAKFAST SETS THE TONE.",sub:"Athletes who log breakfast hit their protein targets 73% more often. Start strong.",btn:"LOG BREAKFAST →"}
                        :h<14
                          ?{head:"WHAT ARE YOU EATING TODAY?",sub:`You have ${calR} calories and ${protR}g protein to hit. Every meal is a step toward your goal.`,btn:"LOG A MEAL →"}
                          :{head:"THE DAY ISN'T OVER.",sub:`You have ${calR} calories remaining. Make the rest of today count.`,btn:"LOG NOW →"};
                      return(
                        <div style={{textAlign:"center",padding:"24px 16px"}}>
                          <div style={{fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"'Barlow Condensed',sans-serif",fontStyle:GOCLUB_REDESIGN?"normal":"italic",fontWeight:900,fontSize:20,color:"rgba(245,245,240,0.75)",textTransform:"uppercase",marginBottom:6,lineHeight:1}}>{msg.head}</div>
                          <div style={{fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:GOCLUB_REDESIGN?500:400,color:"rgba(245,245,240,0.4)",lineHeight:1.55,marginBottom:14,maxWidth:260,margin:"0 auto 14px"}}>{msg.sub}</div>
                          <button onClick={()=>setLogMode("search")} style={{background:"rgba(232,52,28,0.08)",border:"1px solid rgba(232,52,28,0.15)",borderRadius:8,padding:"8px 16px",fontFamily:"'DM Mono',monospace",fontSize:9,fontWeight:700,color:"#e8341c",letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>{msg.btn}</button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                </StaggerItem>
              );
            })()}

            {/* METABOLIC RESET PROGRESS */}
            {metabolicProtocol?.progress&&(
              <MetabolicResetProgressCard
                progress={metabolicProtocol.progress}
                onComplete={metabolicProtocol.onComplete}
              />
            )}

            {/* NUTRITION PERIODIZATION */}
            {periodizationInfo&&(
              <div style={{background:GOCLUB_REDESIGN?"rgba(255,59,48,0.08)":"linear-gradient(135deg, rgba(232,52,28,0.08), var(--navy-mid))",border:"1px solid rgba(232,52,28,0.25)",borderRadius:16,padding:"14px 18px"}}>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:T.prot,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:6}}>// Nutrition Periodization</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"var(--condensed)",fontStyle:GOCLUB_REDESIGN?"normal":"italic",fontSize:18,fontWeight:900,color:"var(--red)",letterSpacing:"0.04em",textTransform:"uppercase"}}>Week {periodizationInfo.cycleWeek} — {periodizationInfo.phase}</div>
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
                    <div style={{fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"var(--condensed)",fontStyle:GOCLUB_REDESIGN?"normal":"italic",fontSize:18,fontWeight:900,color:meta.color,letterSpacing:"0.04em",textTransform:"uppercase"}}>{meta.label}</div>
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

            {/* PERFORMANCE NUTRITION PATTERNS */}
            {perfCorrelations&&perfCorrelations.length>=2&&(
              <div style={{background:GOCLUB_REDESIGN?'rgba(255,255,255,0.05)':T.s1,border:`1px solid ${GOCLUB_REDESIGN?'rgba(255,255,255,0.08)':T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                <div style={{fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"var(--condensed)",fontSize:18,fontWeight:900,letterSpacing:.5,marginBottom:2}}>NUTRITION × PERFORMANCE</div>
                <div style={{fontSize:11,color:T.mu,marginBottom:14}}>Your average intake before each session type · last 28 days</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {perfCorrelations.sort((a,b)=>b.count-a.count).slice(0,3).map(c=>(
                    <div key={c.session_type} style={{background:GOCLUB_REDESIGN?'rgba(255,255,255,0.05)':T.s2,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,textTransform:"capitalize",color:"#fff",marginBottom:2}}>{c.session_type}</div>
                        <div style={{fontSize:10,color:T.mu}}>{c.count} sessions tracked</div>
                      </div>
                      <div style={{display:"flex",gap:12,textAlign:"right"}}>
                        <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:700,color:"#fff"}}>{c.avg_calories}</div><div style={{fontSize:9,color:T.mu,letterSpacing:".06em"}}>KCAL</div></div>
                        <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:700,color:T.prot}}>{c.avg_protein}g</div><div style={{fontSize:9,color:T.mu,letterSpacing:".06em"}}>PROT</div></div>
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
                  {bodySuggest&&<button onClick={()=>setFuelScreen("home")} style={{flex:2,padding:"11px",background:"var(--red)",color:"#fff",border:"none",borderRadius:10,fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:700,fontSize:13,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>Log It</button>}
                </div>
              </div>
            )}

            {/* WEEKEND FLEX MODE */}
            <div style={{background:T.s1,border:`1px solid ${macros.isFlexDay?"rgba(245,158,11,.3)":T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:flexOn?14:0}}>
                <div>
                  <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontSize:14,fontWeight:900,letterSpacing:"0.08em",color:flexOn?"var(--amber)":"rgba(245,245,240,0.65)",textTransform:"uppercase",marginBottom:flexOn?3:0}}>Weekend Flex</div>
                  {flexOn&&<div style={{fontSize:11,color:"rgba(245,245,240,.4)"}}>Adds {flexPct}% on Sat/Sun and trims weekdays to match — weekly total stays the same.</div>}
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
                ["Food", ()=>setFuelScreen("home"),
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2s-2 2-2 5a2 2 0 004 0c0-3-2-5-2-5z"/><path d="M17 3v4a5 5 0 01-10 0V3"/><path d="M7 14v8m10-8v8"/></svg>],
                ["Recipes", ()=>setFuelScreen("kitchen"),
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 2h12a1 1 0 011 1v18a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="12" y2="15"/></svg>],
              ].map(([label, action, icon])=>(
                <motion.button key={label} onClick={action}
                  onPointerDown={GOCLUB_REDESIGN?()=>_hL():undefined}
                  whileTap={GOCLUB_REDESIGN?{scale:0.90}:undefined}
                  transition={GOCLUB_REDESIGN?{type:'spring',stiffness:600,damping:20}:undefined}
                  style={{padding:"14px 6px 12px",background:GOCLUB_REDESIGN?'rgba(255,255,255,0.05)':"var(--navy-card)",border:`1px solid ${GOCLUB_REDESIGN?'rgba(255,255,255,0.08)':"var(--white-border)"}`,borderRadius:14,cursor:"pointer",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:8,touchAction:GOCLUB_REDESIGN?"manipulation":undefined}}>
                  <div style={{width:40,height:40,borderRadius:12,background:"rgba(232,52,28,0.1)",border:"1px solid rgba(232,52,28,0.18)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--red)"}}>
                    {icon}
                  </div>
                  <div style={{fontFamily:"var(--mono)",fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(245,245,240,0.65)",lineHeight:1}}>{label}</div>
                </motion.button>
              ))}
            </div>

            {/* Weekly Prep card removed from home — accessible via Kitchen tab */}

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
                profile={profile}
                dayType={todayType}
                todayFocus={todayFocus}
              />
              </>
            )}

            {/* ── MY RECIPES (compact home section) ── */}
            {userRecipes.length>0&&(
              <div style={{background:GOCLUB_REDESIGN?'rgba(255,255,255,0.05)':T.s1,border:`1px solid ${GOCLUB_REDESIGN?'rgba(255,255,255,0.08)':T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(245,245,240,0.65)",fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"var(--condensed)"}}>My Recipes</div>
                  <button onClick={()=>setFuelScreen("kitchen")} style={{background:"none",border:"none",color:T.prot,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:"0.1em",textTransform:"uppercase",padding:0}}>See All →</button>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {userRecipes.slice(0,3).map(r=>(
                    <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:GOCLUB_REDESIGN?'rgba(255,255,255,0.05)':T.s2,border:`1px solid ${GOCLUB_REDESIGN?'rgba(255,255,255,0.08)':T.bd}`,borderRadius:12}}>
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
          );}catch(err){console.error('FUEL HOME CRASH:',err);return(<div style={{padding:24,color:'#e8341c',fontFamily:'DM Mono,monospace',fontSize:12}}>Error: {err.message}</div>);}
        })()}

        {/* ── LOG FOOD — full-screen fixed sheet (F) ── */}
        {fuelScreen==="log"&&(
          <div style={{position:"fixed",inset:0,zIndex:500,background:"radial-gradient(ellipse at 50% 0%,rgba(232,52,28,0.12) 0%,#060d1a 65%)",overflowY:"auto",paddingBottom:80,WebkitOverflowScrolling:"touch"}}>
            {/* Sticky header: ← Close + MEAL X chip */}
            <div style={{position:"sticky",top:0,background:"rgba(6,13,26,0.94)",backdropFilter:"blur(12px)",padding:"calc(env(safe-area-inset-top,0px) + 12px) 16px 12px",zIndex:10,display:"flex",alignItems:"center",gap:14,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
              <button onClick={()=>setFuelScreen("home")} style={{background:"none",border:"none",fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.5)",letterSpacing:"0.14em",cursor:"pointer",padding:0,textTransform:"uppercase",flexShrink:0}}>← CLOSE</button>
              <div style={{flex:1}}/>
              <div style={{fontFamily:"var(--mono)",fontSize:10,color:"#e8341c",letterSpacing:"0.12em",textTransform:"uppercase",background:"rgba(232,52,28,0.1)",border:"1px solid rgba(232,52,28,0.25)",borderRadius:20,padding:"4px 12px",flexShrink:0}}>MEAL {mealSlots[activeSlotIdx]||1}</div>
            </div>
            <div style={{maxWidth:isMobile?"100%":600,padding:"16px 16px 0"}}>

            {/* Step 1: Meal selection */}
            {(()=>{
              const slotCals={};
              mealSlots.forEach(slot=>{
                slotCals[slot]=log.filter(e=>getEntrySlot(e)===slot).reduce((s,e)=>s+(e.calories||0),0);
              });
              return(
                <>
                  <div style={{...mno,fontSize:9,color:"#e8341c",letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:10}}>// WHICH MEAL?</div>
                  <div style={{display:"flex",gap:8,marginBottom:logSlotConfirmed?8:20}}>
                    {mealSlots.map((slot,i)=>{
                      const kcal=slotCals[slot]||0;
                      const sel=logSlotConfirmed&&activeSlotIdx===i;
                      return(
                        <button key={slot} onClick={()=>{setActiveSlotIdx(i);setLogSlotConfirmed(true);}} style={{flex:1,background:sel?"rgba(232,52,28,0.1)":"#0d0d0d",border:sel?"1.5px solid #e8341c":"1px solid rgba(232,52,28,0.12)",borderRadius:12,padding:"12px 8px",textAlign:"center",cursor:"pointer",transition:"all 0.15s",fontFamily:"inherit"}}>
                          <div style={{...mno,fontSize:10,color:"#f5f5f0",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>{getSlotLabel(slot)}</div>
                          <div style={{...mno,fontSize:9,color:kcal>0?"#e8341c":"rgba(245,245,240,0.3)"}}>{kcal>0?`${kcal} kcal`:"Empty"}</div>
                        </button>
                      );
                    })}
                  </div>
                  {logSlotConfirmed&&(
                    <>
                      <div style={{marginBottom:16}}>
                        <span style={{background:"rgba(232,52,28,0.08)",border:"1px solid rgba(232,52,28,0.2)",borderRadius:20,padding:"5px 14px",...mno,fontSize:10,color:"#e8341c",letterSpacing:"0.12em",textTransform:"uppercase",display:"inline-block"}}>
                          ADDING TO {(getSlotLabel(mealSlots[activeSlotIdx])||"MEAL 1").toUpperCase()}
                        </span>
                      </div>
                      <div style={{height:1,background:"rgba(232,52,28,0.08)",marginBottom:20}}/>
                    </>
                  )}
                </>
              );
            })()}

            {/* Step 2: Log methods */}
            {!logSlotConfirmed?(
              <div style={{...mno,fontSize:9,color:"rgba(245,245,240,0.25)",textAlign:"center",padding:"24px 0",letterSpacing:"0.1em"}}>Select a meal above to continue</div>
            ):(
              <>
                {!logMode&&(
                  <>
                    <div style={{...mno,fontSize:9,color:"#e8341c",letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:12}}>// HOW DO YOU WANT TO LOG?</div>
                    {/* Row 1 */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                      {[
                        {
                          label:"SNAP & LOG",sub:"Photo → instant macros",
                          icon:<svg width="18" height="15" viewBox="0 0 18 15" fill="none" stroke="#e8341c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4A1 1 0 012 3h1a1 1 0 00.9-.55l.2-.4A1 1 0 015 1.5h8a1 1 0 01.9.55l.2.4A1 1 0 0015 3h1a1 1 0 011 1v9a1 1 0 01-1 1H2a1 1 0 01-1-1V4z"/><circle cx="9" cy="8" r="2.5"/></svg>,
                          action:()=>onOpenPhotoLogger&&onOpenPhotoLogger(),
                        },
                        {
                          label:"SEARCH & AI",sub:"Search foods or describe your meal",
                          icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#e8341c" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="5"/><path d="M13 13l3 3"/></svg>,
                          action:()=>setLogMode("search"),
                        },
                      ].map(({label,sub,icon,action})=>(
                        <button key={label} onClick={action} style={{background:"#0d0d0d",border:"1px solid rgba(232,52,28,0.1)",borderRadius:14,padding:"18px 14px",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:8,cursor:"pointer",fontFamily:"inherit",textAlign:"left",WebkitTapHighlightColor:"transparent"}}>
                          <div style={{width:36,height:36,borderRadius:8,background:"rgba(232,52,28,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icon}</div>
                          <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:16,color:"#f5f5f0",textTransform:"uppercase",lineHeight:1}}>{label}</div>
                          <div style={{...mno,fontSize:9,color:"rgba(245,245,240,0.35)",letterSpacing:"0.08em",marginTop:2}}>{sub}</div>
                        </button>
                      ))}
                    </div>
                    {/* Row 2 */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
                      {[
                        {
                          label:"MY FOODS",sub:"Saved foods & recent logs",
                          icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#e8341c" strokeWidth="1.5" strokeLinecap="round"><path d="M9 1l2.5 5 5.5.8-4 3.9.9 5.5L9 13.5l-4.9 2.6.9-5.5-4-3.9 5.5-.8L9 1z"/></svg>,
                          action:()=>setLogMode("myfoods"),
                        },
                        {
                          label:"QUICK ADD",sub:"Just calories or full macros",
                          icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#e8341c" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="9" r="7.5"/><path d="M9 5.5v7M5.5 9h7"/></svg>,
                          action:()=>setLogMode("quick"),
                        },
                        {
                          label:"BARCODE",sub:"Scan any packaged food",
                          icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#e8341c" strokeWidth="1.5" strokeLinecap="round"><line x1="1" y1="3" x2="1" y2="15"/><line x1="3.5" y1="3" x2="3.5" y2="15"/><line x1="6" y1="3" x2="6" y2="15"/><line x1="7.5" y1="3" x2="7.5" y2="15"/><line x1="10" y1="3" x2="10" y2="15"/><line x1="13" y1="3" x2="13" y2="15"/><line x1="15.5" y1="3" x2="15.5" y2="15"/><line x1="17" y1="3" x2="17" y2="15"/></svg>,
                          action:()=>setLogMode("barcode"),
                        },
                      ].map(({label,sub,icon,action})=>(
                        <button key={label} onClick={action} style={{background:"#0d0d0d",border:"1px solid rgba(232,52,28,0.1)",borderRadius:14,padding:"14px 10px",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:8,cursor:"pointer",fontFamily:"inherit",textAlign:"left",WebkitTapHighlightColor:"transparent"}}>
                          <div style={{width:32,height:32,borderRadius:8,background:"rgba(232,52,28,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icon}</div>
                          <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:14,color:"#f5f5f0",textTransform:"uppercase",lineHeight:1}}>{label}</div>
                          <div style={{...mno,fontSize:8,color:"rgba(245,245,240,0.35)",letterSpacing:"0.06em",marginTop:1}}>{sub}</div>
                        </button>
                      ))}
                    </div>
                    {/* Row 3: Restaurant AI full width */}
                    <button onClick={()=>{setLogMode("restaurant");openRestaurantAI();}} style={{width:"100%",background:"rgba(232,52,28,0.06)",border:"1px solid rgba(232,52,28,0.2)",borderRadius:14,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",fontFamily:"inherit",marginBottom:20,WebkitTapHighlightColor:"transparent"}}>
                      <div style={{display:"flex",alignItems:"center",gap:14}}>
                        <div style={{width:36,height:36,borderRadius:8,background:"rgba(232,52,28,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <svg width="16" height="18" viewBox="0 0 16 18" fill="none" stroke="#e8341c" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1C5 1 2 3.5 2 7c0 4.5 6 10 6 10s6-5.5 6-10c0-3.5-3-6-6-6z"/><circle cx="8" cy="7" r="2"/></svg>
                        </div>
                        <div>
                          <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:18,color:"#f5f5f0",textTransform:"uppercase",lineHeight:1}}>RESTAURANT AI<span style={{color:"#e8341c"}}>.</span></div>
                          <div style={{...mno,fontSize:9,color:"rgba(245,245,240,0.35)",marginTop:4}}>Scan any menu for instant macro recommendations</div>
                        </div>
                      </div>
                      <div style={{color:"#e8341c",fontSize:18,flexShrink:0}}>→</div>
                    </button>
                  </>
                )}
                {logMode&&logMode!=="restaurant"&&(
                  <button onClick={()=>{setLogMode(null);setAiEstimate(null);setAiEstimating(false);}} style={{background:"none",border:"none",...mno,fontSize:9,color:"rgba(245,245,240,0.4)",cursor:"pointer",padding:"0 0 16px",letterSpacing:"0.12em",display:"block"}}>← METHODS</button>
                )}
                {(logMode==="search"||logMode==="ai")&&(
                  <div style={{display:"flex",background:"rgba(245,245,240,0.04)",border:"1px solid rgba(245,245,240,0.08)",borderRadius:20,padding:3,gap:2,marginBottom:16}}>
                    <button onClick={()=>{setLogMode("search");setAiEstimate(null);setAiEstimating(false);}} style={{flex:1,padding:"7px 0",borderRadius:16,border:"none",background:logMode==="search"?"rgba(232,52,28,0.15)":"transparent",color:logMode==="search"?"#e8341c":"rgba(245,245,240,0.35)",...mno,fontSize:9,fontWeight:700,cursor:"pointer",letterSpacing:"0.12em"}}>SEARCH</button>
                    <button onClick={()=>setLogMode("ai")} style={{flex:1,padding:"7px 0",borderRadius:16,border:"none",background:logMode==="ai"?"rgba(232,52,28,0.15)":"transparent",color:logMode==="ai"?"#e8341c":"rgba(245,245,240,0.35)",...mno,fontSize:9,fontWeight:700,cursor:"pointer",letterSpacing:"0.12em"}}>AI DESCRIBE</button>
                  </div>
                )}
                {logMode==="search"&&<FoodSearchScreen user={user} logEntry={logEntry} mealSlots={mealSlots} activeSlotIdx={activeSlotIdx} setActiveSlotIdx={setActiveSlotIdx} addMealSlot={addMealSlot} setFuelScreen={setFuelScreen} isMobile={isMobile}/>}
                {logMode==="ai"&&(
                  <>
                    {!aiEstimate&&!aiEstimating&&(
                      <>
                        <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px",marginBottom:10}}>
                          <textarea value={foodInput} onChange={e=>setFoodInput(e.target.value)} placeholder="Describe your meal... e.g. grilled chicken 6oz, brown rice 1 cup, steamed broccoli" style={{width:"100%",background:"none",border:"none",color:"#fff",fontSize:14,resize:"none",outline:"none",minHeight:80,fontFamily:"inherit",boxSizing:"border-box",lineHeight:1.6}}/>
                        </div>
                        <PrimaryBtn onClick={handleAiDescribeSubmit} label="ESTIMATE MACROS →" disabled={!foodInput.trim()}/>
                      </>
                    )}
                    {aiEstimating&&(
                      <div style={{background:"#0d0d0d",borderRadius:12,padding:20,textAlign:"center"}}>
                        <div style={{...mno,fontSize:10,color:"rgba(245,245,240,0.4)",letterSpacing:"0.16em"}}>ESTIMATING...</div>
                      </div>
                    )}
                    {aiEstimate&&!aiEstimating&&(
                      <div style={{background:"#0d0d0d",border:"1px solid rgba(232,52,28,0.15)",borderRadius:14,padding:"18px 16px",marginTop:16}}>
                        <div style={{...mno,fontSize:10,color:"#e8341c",letterSpacing:"0.16em",marginBottom:12}}>DOES THIS SOUND RIGHT?</div>
                        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:18,color:"#f5f5f0",marginBottom:14,lineHeight:1.2}}>{aiEstimate.description}</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                          {[
                            {label:"KCAL",val:aiEstimate.calories,color:"#f5f5f0",bg:"rgba(232,52,28,0.06)"},
                            {label:"PROTEIN",val:`${aiEstimate.protein}g`,color:"#e8341c",bg:"rgba(232,52,28,0.06)"},
                            {label:"CARBS",val:`${aiEstimate.carbs}g`,color:"#60a5fa",bg:"rgba(96,165,250,0.06)"},
                            {label:"FAT",val:`${aiEstimate.fat}g`,color:"#FEA020",bg:"rgba(254,160,32,0.06)"},
                          ].map(({label,val,color,bg})=>(
                            <div key={label} style={{background:bg,borderRadius:10,padding:12,textAlign:"center"}}>
                              <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:28,color,lineHeight:1}}>{val}</div>
                              <div style={{...mno,fontSize:9,color:"#e8341c",letterSpacing:"0.12em",marginTop:4}}>{label}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{...mno,fontSize:9,color:"rgba(245,245,240,0.3)",letterSpacing:"0.1em",marginBottom:16}}>AI estimate — values may vary</div>
                        <button onClick={()=>{logEntryWithUndo({food:aiEstimate.food,calories:aiEstimate.calories,protein:aiEstimate.protein,carbs:aiEstimate.carbs,fat:aiEstimate.fat,id:Date.now(),method:"ai",slot:mealSlots[activeSlotIdx]||1});setFoodInput("");setAiEstimate(null);setFuelScreen("home");}} style={{width:"100%",padding:"14px",background:"#e8341c",border:"none",borderRadius:12,color:"#fff",...mno,fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.12em",marginBottom:8}}>LOOKS RIGHT — LOG IT →</button>
                        <button onClick={()=>setAiEstimate(null)} style={{width:"100%",padding:"14px",background:"transparent",border:"1px solid rgba(245,245,240,0.12)",borderRadius:12,...mno,fontSize:11,fontWeight:700,cursor:"pointer",color:"rgba(245,245,240,0.5)",letterSpacing:"0.12em"}}>TRY AGAIN</button>
                      </div>
                    )}
                  </>
                )}
                {logMode==="myfoods"&&(
                  <>
                    {myFoodsHistory.length>0&&(
                      <>
                        <div style={{...mno,fontSize:9,color:"#e8341c",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>// RECENT FOODS</div>
                        {myFoodsHistory.slice(0,5).map((f,i)=>(
                          <button key={i} onClick={()=>{logEntryWithUndo({food:f.food_name,calories:f.food_data?.calories||0,protein:f.food_data?.protein||0,carbs:f.food_data?.carbs||0,fat:f.food_data?.fat||0,id:Date.now(),slot:mealSlots[activeSlotIdx]||1,source:f.food_data?.source||"usda"});setLogMode(null);}} style={{width:"100%",background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.07)",borderRadius:10,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
                            <div>
                              <div style={{fontSize:14,fontWeight:700,color:"#f5f5f0"}}>{f.food_name}</div>
                              <div style={{...mno,fontSize:9,color:"rgba(245,245,240,0.4)",marginTop:2}}>{f.food_data?.calories} kcal · P {f.food_data?.protein}g</div>
                            </div>
                            <div style={{color:"#e8341c",...mno,fontSize:12,flexShrink:0}}>+</div>
                          </button>
                        ))}
                      </>
                    )}
                    <button onClick={()=>setFuelScreen("kitchen")} style={{width:"100%",background:"rgba(232,52,28,0.06)",border:"1px solid rgba(232,52,28,0.15)",borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",fontFamily:"inherit",marginBottom:20,marginTop:8}}>
                      <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:700,fontSize:14,color:"#f5f5f0",textTransform:"uppercase"}}>See all saved foods</div>
                      <div style={{color:"#e8341c",...mno,fontSize:10}}>→</div>
                    </button>
                    <div style={{height:1,background:"rgba(232,52,28,0.08)",marginBottom:16}}/>
                    <div style={{...mno,fontSize:9,color:"#e8341c",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>// QUICK ADD</div>
                    <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"16px",marginBottom:14}}>
                      {[["Name (optional)","text","name","e.g. Protein shake"],["Calories","number","calories","0"],["Protein (g)","number","protein","0"],["Carbs (g)","number","carbs","0"],["Fat (g)","number","fat","0"]].map(([l,t,k,ph])=>(
                        <div key={k} style={{marginBottom:12}}>
                          <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>{l}</div>
                          <input type={t} value={quickFields[k]} onChange={e=>setQF(q=>({...q,[k]:e.target.value}))} placeholder={ph} style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:8,padding:"10px 12px",color:"#fff",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                        </div>
                      ))}
                    </div>
                    <PrimaryBtn onClick={addQuick} label="Add Entry →" disabled={!quickFields.calories}/>
                  </>
                )}
                {logMode==="quick"&&(
                  <>
                    {/* Calories — the only required field, shown prominently */}
                    <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"20px 16px",marginBottom:10}}>
                      <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Calories</div>
                      <input
                        autoFocus
                        type="number"
                        inputMode="numeric"
                        value={quickFields.calories}
                        onChange={e=>setQF(q=>({...q,calories:e.target.value}))}
                        placeholder="0"
                        style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:8,padding:"14px 12px",color:"#fff",fontSize:32,fontWeight:900,outline:"none",boxSizing:"border-box",fontFamily:"var(--condensed)",textAlign:"center"}}
                      />
                    </div>
                    {/* Expand toggle for name + macros */}
                    <button onClick={()=>setShowQAExtras(v=>!v)} style={{background:"none",border:"none",...mno,fontSize:9,color:showQAExtras?"#e8341c":"rgba(245,245,240,0.4)",cursor:"pointer",padding:"4px 0 14px",letterSpacing:"0.12em",display:"block",textAlign:"left",WebkitTapHighlightColor:"transparent"}}>
                      {showQAExtras?"▼ HIDE DETAILS":"▶ ADD NAME & MACROS (optional)"}
                    </button>
                    {showQAExtras&&(
                      <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"16px",marginBottom:14}}>
                        {[["Name (optional)","text","name","e.g. Protein shake"],["Protein (g)","number","protein","0"],["Carbs (g)","number","carbs","0"],["Fat (g)","number","fat","0"]].map(([l,t,k,ph])=>(
                          <div key={k} style={{marginBottom:12}}>
                            <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>{l}</div>
                            <input type={t} value={quickFields[k]} onChange={e=>setQF(q=>({...q,[k]:e.target.value}))} placeholder={ph} style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:8,padding:"10px 12px",color:"#fff",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                          </div>
                        ))}
                      </div>
                    )}
                    <PrimaryBtn onClick={addQuick} label="Add Entry →" disabled={!quickFields.calories}/>
                  </>
                )}
                {logMode==="barcode"&&(
                  <>
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
                  </>
                )}
              </>
            )}
            {logMode==="restaurant"&&restaurantAI&&(
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
            </div>
          </div>
        )}

        {/* ── KITCHEN (Recipes + Meal Prep) ── */}
        {fuelScreen==="kitchen"&&(
          <div style={{maxWidth:isMobile?"100%":700}}>

            {/* Meal prep regenerate banner */}
            {showRegenerateBanner&&(
              <div style={{background:"rgba(254,160,32,0.08)",border:"1px solid rgba(254,160,32,0.25)",borderRadius:12,padding:"14px 16px",marginBottom:16,display:"flex",alignItems:"flex-start",gap:12}}>
                <span style={{color:"#FEA020",fontSize:16,flexShrink:0,lineHeight:1.3}}>!</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#FEA020",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:4}}>// MEAL PLAN OUTDATED</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,color:"rgba(245,245,240,0.8)",lineHeight:1.5,marginBottom:10}}>Your training changed. Regenerate your meal plan.</div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{localStorage.removeItem('__mp_regen_needed');setShowRegenerateBanner(false);setMealPrepScreen('setup');setFuelScreen('mealprep');}} style={{background:"#FEA020",border:"none",borderRadius:8,padding:"8px 14px",fontFamily:"'DM Mono',monospace",fontSize:9,fontWeight:700,color:"#000",letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>REGENERATE →</button>
                    <button onClick={()=>{localStorage.removeItem('__mp_regen_needed');setShowRegenerateBanner(false);}} style={{background:"transparent",border:"1px solid rgba(254,160,32,0.2)",borderRadius:8,padding:"8px 14px",fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(254,160,32,0.5)",letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>DISMISS</button>
                  </div>
                </div>
              </div>
            )}

            {/* Kitchen carousel */}
            {(()=>{
              const kitchenCards=[
                {eyebrow:'// WEEKLY PREP',title:'MEAL PREP.',sub:'Cook once, eat all week',onPress:()=>{setMealPrepScreen('setup');setFuelScreen('mealprep');}},
                {eyebrow:'// AI NUTRITION',title:'RESTAURANT AI.',sub:'Scan any menu for instant macro recommendations',onPress:()=>{setFuelScreen('log');setLogMode('restaurant');openRestaurantAI();}},
              ];
              return(
                <div style={{marginBottom:20}}>
                  <div style={{overflowX:'auto',display:'flex',flexDirection:'row',gap:0,scrollSnapType:'x mandatory',WebkitOverflowScrolling:'touch',scrollbarWidth:'none',msOverflowStyle:'none',marginBottom:8}}
                    onScroll={e=>{const el=e.currentTarget;const w=el.offsetWidth||320;setKitchenCard(Math.min(1,Math.max(0,Math.round(el.scrollLeft/w))));}}
                  >
                    {kitchenCards.map((card,i)=>(
                      <div key={i} onClick={card.onPress} style={{minWidth:'100%',maxWidth:'100%',scrollSnapAlign:'start',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(232,52,28,0.22)',borderRadius:16,padding:'20px 18px',boxSizing:'border-box',cursor:'pointer',position:'relative',boxShadow:'0 4px 24px rgba(0,0,0,0.45)'}}>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'#e8341c',letterSpacing:'0.16em',textTransform:'uppercase',marginBottom:6}}>{card.eyebrow}</div>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:26,color:'#f5f5f0',textTransform:'uppercase',lineHeight:1,marginBottom:6}}>{card.title}</div>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'rgba(245,245,240,0.45)',lineHeight:1.5}}>{card.sub}</div>
                        <div style={{position:'absolute',bottom:18,right:18,color:'#e8341c',fontSize:18,lineHeight:1,fontWeight:700}}>→</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex',justifyContent:'center',gap:6}}>
                    {kitchenCards.map((_,i)=>(
                      <div key={i} style={{width:i===kitchenCard?16:6,height:6,borderRadius:3,background:i===kitchenCard?'#e8341c':'rgba(245,245,240,0.15)',transition:'all 0.2s'}}/>
                    ))}
                  </div>
                </div>
              );
            })()}

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
                        <div key={r.id} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.10)',borderRadius:16,padding:"16px",boxShadow:'0 3px 16px rgba(0,0,0,0.35)'}}>
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

            {/* ── MEAL PREP section inside Kitchen — routes to new flow ── */}
            <div ref={mealPrepRef} style={{borderTop:`1px solid ${T.bd}`,marginTop:32,paddingTop:28}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:4}}>
              <div style={{fontFamily:"var(--condensed)",fontSize:32,fontWeight:900}}>MEAL PREP</div>
              {mealPrepPlan&&(
                <button onClick={()=>{setMealPrepScreen('setup');setFuelScreen('mealprep');}} style={{fontSize:11,color:"#e8341c",background:"none",border:"none",cursor:"pointer",fontFamily:"var(--mono)",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",padding:0}}>↺ Regenerate</button>
              )}
            </div>
            <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Cook once, eat all week · based on your training schedule</p>

            {!mealPrepPlan&&(
              <div style={{textAlign:"center",padding:"48px 20px",border:`1px dashed ${T.bd}`,borderRadius:16}}>
                <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>Generate Your Week</div>
                <div style={{fontSize:12,color:T.mu,marginBottom:24,lineHeight:1.65,maxWidth:300,margin:"0 auto 24px"}}>Choose your diet style, meals per day, and restrictions — AI builds a fully personalised weekly plan with grocery list</div>
                <button onClick={()=>{setMealPrepScreen('setup');setFuelScreen('mealprep');}} style={{padding:"14px 32px",background:"#e8341c",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"var(--mono)",letterSpacing:"1.8px",textTransform:"uppercase"}}>SET UP MY WEEK →</button>
              </div>
            )}

            {mealPrepPlan&&(
              <div style={{background:T.s1,border:'1px solid rgba(232,52,28,0.15)',borderRadius:16,padding:'16px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                <div>
                  <div style={{fontFamily:'var(--mono)',fontSize:9,color:'rgba(245,245,240,0.4)',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:4}}>ACTIVE PLAN</div>
                  <div style={{fontSize:14,fontWeight:700,color:'#f5f5f0',marginBottom:2}}>{(mealPrepPlan.days||[]).length} days · {(mealPrepPlan.days||[]).reduce((s,d)=>s+(d.meals||[]).length,0)} meals</div>
                  <div style={{fontFamily:'var(--mono)',fontSize:10,color:'rgba(245,245,240,0.4)'}}>{mealPrepPrefs.dietPreset||'balanced'} · {mealPrepPrefs.mealsPerDay} meals/day</div>
                </div>
                <button onClick={()=>{setMealPrepScreen('plan');setFuelScreen('mealprep');}} style={{background:'#e8341c',border:'none',borderRadius:10,padding:'10px 16px',fontFamily:'var(--mono)',fontSize:9,fontWeight:700,color:'#fff',letterSpacing:'0.12em',textTransform:'uppercase',cursor:'pointer',flexShrink:0}}>VIEW PLAN →</button>
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

        {/* ── MEAL PREP FLOW ── */}
        {fuelScreen==='mealprep'&&(
          <div style={{paddingBottom:120}}>
            {/* ── SETUP SCREEN ── */}
            {mealPrepScreen==='setup'&&(
              <div>
                {/* Header */}
                <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} transition={{duration:0.3}}>
                  <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:6}}>
                    <button onPointerDown={()=>_hL()} onClick={()=>setFuelScreen('kitchen')} style={{background:'none',border:'none',color:'#f5f5f0',fontSize:20,cursor:'pointer',padding:'0 4px 0 0',lineHeight:1,flexShrink:0}}>←</button>
                    <div>
                      <div style={{...mno,fontSize:9,color:'#FF3B30',letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:4}}>// MEAL PREP</div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:54,color:'#f5f5f0',lineHeight:0.86,textTransform:'uppercase'}}>SET UP<br/>MY WEEK.</div>
                    </div>
                  </div>
                  <div style={{...mno,fontSize:10,color:'rgba(245,245,240,0.38)',marginBottom:26,lineHeight:1.6,marginTop:8}}>Cook once. Fuel all week. Built around your training schedule.</div>
                </motion.div>

                {/* Error */}
                {mealPrepError&&<motion.div initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}} style={{...mno,fontSize:11,color:'#FF3B30',marginBottom:14,padding:'12px 16px',background:'rgba(255,59,48,0.08)',border:'1px solid rgba(255,59,48,0.22)',borderRadius:12}}>{mealPrepError}</motion.div>}

                {/* Section card surface — reusable */}
                {/* SELECT DAYS */}
                <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.07}}
                  style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,59,48,0.1)',borderRadius:16,padding:'16px 16px 14px',marginBottom:16,boxShadow:'0 4px 18px rgba(0,0,0,0.35)'}}>
                  <div style={{...mno,fontSize:8,color:'#FF3B30',letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:12}}>// SELECT DAYS</div>
                  <div style={{display:'flex',overflowX:'auto',scrollbarWidth:'none',msOverflowStyle:'none',WebkitOverflowScrolling:'touch',gap:8,paddingBottom:2}}>
                    {WDAYS_ORDER.map(day=>{
                      const sessionType=schedule?.[day]||'rest';
                      const isTraining=sessionType==='training'||sessionType==='cardio'||sessionType==='run'||sessionType==='hyrox';
                      const focus=(wPrefs?.dayFocus?.[day])||sessionType;
                      const focusLabel=focus==='training'?'TRAIN':focus.toUpperCase().slice(0,5);
                      const selected=mealPrepPrefs.selectedDays.includes(day);
                      return(
                        <motion.button key={day} whileTap={{scale:0.88}} onPointerDown={()=>_hL()}
                          onClick={()=>{_hM();setMealPrepPrefs(p=>({...p,selectedDays:selected?p.selectedDays.filter(d=>d!==day):[...p.selectedDays,day]}));}}
                          style={{width:64,minWidth:64,background:selected?'rgba(255,59,48,0.12)':'rgba(255,255,255,0.03)',borderRadius:12,padding:'10px 4px',textAlign:'center',border:selected?'1.5px solid #FF3B30':'1px solid rgba(255,255,255,0.07)',cursor:'pointer',flexShrink:0,outline:'none',boxShadow:selected?'0 0 12px rgba(255,59,48,0.18)':'none',transition:'box-shadow 0.15s'}}>
                          <div style={{...mno,fontSize:9,color:selected?'#FF3B30':'rgba(245,245,240,0.5)',letterSpacing:'0.1em',marginBottom:5,fontWeight:700}}>{day.toUpperCase()}</div>
                          <div style={{display:'inline-block',background:isTraining?'rgba(255,59,48,0.18)':'rgba(255,255,255,0.05)',borderRadius:20,padding:'2px 6px',...mno,fontSize:7,color:isTraining?'#FF3B30':'rgba(245,245,240,0.28)',letterSpacing:'0.08em'}}>{isTraining?focusLabel:'REST'}</div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* MEALS PER DAY */}
                <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.13}}
                  style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,59,48,0.1)',borderRadius:16,padding:'16px 16px 14px',marginBottom:16,boxShadow:'0 4px 18px rgba(0,0,0,0.35)'}}>
                  <div style={{...mno,fontSize:8,color:'#FF3B30',letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:12}}>// MEALS PER DAY</div>
                  <div style={{display:'flex',gap:8}}>
                    {[2,3,4].map(n=>{
                      const sel=mealPrepPrefs.mealsPerDay===n;
                      return(
                        <motion.button key={n} whileTap={{scale:0.9}} onPointerDown={()=>_hL()}
                          onClick={()=>{
                            _hM();
                            setMealPrepPrefs(p=>({...p,mealsPerDay:n}));
                            try{saveFlexPrefs({...(wPrefs||{}),mealFreq:String(n)});}catch{}
                          }}
                          style={{flex:1,background:sel?'rgba(255,59,48,0.14)':'rgba(255,255,255,0.04)',border:sel?'1.5px solid #FF3B30':'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'16px 0',...mno,fontSize:sel?13:10,fontWeight:700,color:sel?'#FF3B30':'rgba(245,245,240,0.5)',textAlign:'center',cursor:'pointer',outline:'none',boxShadow:sel?'0 0 12px rgba(255,59,48,0.2)':'none',transition:'all 0.15s'}}>
                          {n} MEALS
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* DIET STYLE */}
                <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.19}}
                  style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,59,48,0.1)',borderRadius:16,padding:'16px 16px 14px',marginBottom:16,boxShadow:'0 4px 18px rgba(0,0,0,0.35)'}}>
                  <div style={{...mno,fontSize:8,color:'#FF3B30',letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:12}}>// DIET STYLE</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    {DIET_PRESETS.map((d,di)=>{
                      const sel=mealPrepPrefs.dietPreset===d.id;
                      return(
                        <motion.button key={d.id} whileTap={{scale:0.94}} onPointerDown={()=>_hL()}
                          initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.21+di*0.035}}
                          onClick={()=>{
                            _hM();
                            setMealPrepPrefs(p=>({...p,dietPreset:d.id}));
                            try{if(typeof saveFlexPrefs==='function')saveFlexPrefs({...(wPrefs||{}),mealPrepDiet:d.id});}catch{}
                          }}
                          style={{background:sel?'rgba(255,59,48,0.14)':'rgba(255,255,255,0.04)',border:sel?'1.5px solid #FF3B30':'1px solid rgba(255,255,255,0.08)',borderRadius:14,cursor:'pointer',outline:'none',textAlign:'left',overflow:'hidden',padding:0,boxShadow:sel?'0 0 0 1px rgba(255,59,48,0.2),0 6px 20px rgba(0,0,0,0.5)':'0 3px 10px rgba(0,0,0,0.4)',transition:'box-shadow 0.15s'}}>
                          {/* 16:9 image slot */}
                          <div style={{width:'100%',aspectRatio:'16/9',background:`linear-gradient(135deg,rgba(${sel?'255,59,48':'30,10,10'},${sel?'0.22':'0.12'}),rgba(0,0,0,0.8))`,position:'relative',overflow:'hidden'}}>
                            <img src={`/diet-images/${d.id}.jpg`} alt={d.label} style={{width:'100%',height:'100%',objectFit:'cover',position:'absolute',inset:0}} onError={e=>{e.target.style.display='none';}}/>
                            {d.badge&&<span style={{position:'absolute',top:6,right:6,...mno,fontSize:7,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',padding:'2px 7px',borderRadius:20,background:d.badge==='NEW'?'rgba(34,197,94,0.92)':d.badge==='TRENDING'?'rgba(254,160,32,0.92)':'rgba(255,59,48,0.92)',color:'#fff'}}>{d.badge}</span>}
                            {sel&&<div style={{position:'absolute',inset:0,border:'2px solid rgba(255,59,48,0.4)',borderRadius:'inherit',pointerEvents:'none'}}/>}
                          </div>
                          {/* Label row */}
                          <div style={{padding:'9px 12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:15,color:sel?'#FF3B30':'#f5f5f0',textTransform:'uppercase'}}>{d.label}</span>
                            {sel&&<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="rgba(255,59,48,0.15)" stroke="#FF3B30" strokeWidth="1.5"/><path d="M5 8l2.5 2.5 4-4" stroke="#FF3B30" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* PREP TIME */}
                <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.25}}
                  style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,59,48,0.1)',borderRadius:16,padding:'16px 16px 14px',marginBottom:16,boxShadow:'0 4px 18px rgba(0,0,0,0.35)'}}>
                  <div style={{...mno,fontSize:8,color:'#FF3B30',letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:12}}>// PREP TIME AVAILABLE</div>
                  <div style={{display:'flex',gap:8}}>
                    {[['30min','30 MIN'],['1hr','1 HOUR'],['2hr+','2+ HRS']].map(([val,label])=>{
                      const sel=mealPrepPrefs.prepTime===val;
                      return(
                        <motion.button key={val} whileTap={{scale:0.92}} onPointerDown={()=>_hL()}
                          onClick={()=>{_hM();setMealPrepPrefs(p=>({...p,prepTime:val}));}}
                          style={{flex:1,background:sel?'rgba(255,59,48,0.12)':'rgba(255,255,255,0.04)',border:sel?'1.5px solid #FF3B30':'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'14px 0',...mno,fontSize:10,fontWeight:700,color:sel?'#FF3B30':'rgba(245,245,240,0.5)',textAlign:'center',cursor:'pointer',outline:'none',boxShadow:sel?'0 0 10px rgba(255,59,48,0.18)':'none',transition:'all 0.15s'}}>
                          {label}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* RESTRICTIONS & ALLERGIES */}
                <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.30}}
                  style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,59,48,0.1)',borderRadius:16,padding:'16px 16px 14px',marginBottom:16,boxShadow:'0 4px 18px rgba(0,0,0,0.35)'}}>
                  <div style={{...mno,fontSize:8,color:'#FF3B30',letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:12}}>// RESTRICTIONS & ALLERGIES</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
                    {['No Dairy','No Gluten','No Pork','No Shellfish','No Eggs','No Nuts'].map(chip=>{
                      const active=mealPrepPrefs.dietaryPrefs.includes(chip);
                      return(
                        <motion.button key={chip} whileTap={{scale:0.9}} onPointerDown={()=>_hL()}
                          onClick={()=>{_hM();setMealPrepPrefs(p=>({...p,dietaryPrefs:active?p.dietaryPrefs.filter(c=>c!==chip):[...p.dietaryPrefs,chip]}));}}
                          style={{background:active?'rgba(255,59,48,0.14)':'rgba(255,255,255,0.04)',border:active?'1.5px solid #FF3B30':'1px solid rgba(255,255,255,0.08)',borderRadius:20,padding:'8px 18px',...mno,fontSize:9,fontWeight:700,color:active?'#FF3B30':'rgba(245,245,240,0.45)',cursor:'pointer',outline:'none',boxShadow:active?'0 0 8px rgba(255,59,48,0.2)':'none',transition:'all 0.15s'}}>
                          {chip}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Combo warnings */}
                  {(()=>{
                    const chips=mealPrepPrefs.dietaryPrefs;
                    const noDairy=chips.includes('No Dairy'),noEgg=chips.includes('No Eggs'),noNut=chips.includes('No Nuts');
                    const tightCount=[noDairy,noEgg,noNut].filter(Boolean).length;
                    if(noDairy&&noEgg&&!noNut)return(<div style={{background:'rgba(232,52,28,0.06)',border:'1px solid rgba(232,52,28,0.16)',borderRadius:10,padding:'8px 14px',marginBottom:0}}>
                      <div style={{...mno,fontSize:7,color:'#e8341c',letterSpacing:'0.14em',marginBottom:3,textTransform:'uppercase'}}>// HEADS UP</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(245,245,240,0.6)',lineHeight:1.6}}>No Dairy + No Eggs is effectively a vegan protein profile. Options will be narrow — consider tofu, tempeh, legumes.</div>
                    </div>);
                    if(tightCount>=3)return(<div style={{background:'rgba(232,52,28,0.06)',border:'1px solid rgba(232,52,28,0.16)',borderRadius:10,padding:'8px 14px',marginBottom:0}}>
                      <div style={{...mno,fontSize:7,color:'#e8341c',letterSpacing:'0.14em',marginBottom:3,textTransform:'uppercase'}}>// VERY RESTRICTIVE COMBO</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(245,245,240,0.6)',lineHeight:1.6}}>No Dairy + No Eggs + No Nuts removes most protein staples. Some meal slots may not fill safely — the filter will flag them.</div>
                    </div>);
                    return null;
                  })()}
                </motion.div>

                {/* Safety disclaimer */}
                {mealPrepPrefs.dietaryPrefs.length>0&&(
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{background:'rgba(232,52,28,0.04)',border:'1px solid rgba(232,52,28,0.1)',borderRadius:12,padding:'10px 16px',marginBottom:20}}>
                    <div style={{...mno,fontSize:7,color:'#e8341c',letterSpacing:'0.14em',marginBottom:3,textTransform:'uppercase'}}>// ALLERGY NOTICE</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(245,245,240,0.5)',lineHeight:1.65}}>
                      Recipes are tagged by ingredient. Always <span style={{color:'rgba(245,245,240,0.8)',fontWeight:700}}>verify all ingredients yourself</span> before consuming. Not medical advice.
                    </div>
                  </motion.div>
                )}

                {/* Generate button */}
                <motion.button
                  whileTap={{scale:0.97}}
                  onPointerDown={()=>_hM()}
                  onClick={generateMealPrepPlan}
                  disabled={mealPrepPrefs.selectedDays.length===0}
                  initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.34}}
                  style={{width:'100%',background:mealPrepPrefs.selectedDays.length===0?'rgba(232,52,28,0.3)':'linear-gradient(135deg,#e8341c,#c0271b)',border:'none',borderRadius:16,padding:18,...mno,fontWeight:700,fontSize:12,color:'#fff',letterSpacing:'0.20em',textTransform:'uppercase',cursor:mealPrepPrefs.selectedDays.length===0?'not-allowed':'pointer',boxShadow:mealPrepPrefs.selectedDays.length===0?'none':'0 8px 28px rgba(232,52,28,0.45)',marginBottom:8}}>
                  GENERATE MY WEEK →
                </motion.button>
              </div>
            )}

            {/* ── GENERATING SCREEN ── */}
            {mealPrepScreen==='generating'&&(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'85vh',paddingTop:60}}>
                <style>{`@keyframes mpPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.25;transform:scale(0.88)}}@keyframes mpOrbit{from{transform:rotate(0deg) translateX(44px) rotate(0deg)}to{transform:rotate(360deg) translateX(44px) rotate(-360deg)}}@keyframes mpBar{0%,100%{transform:scaleY(0.3)}50%{transform:scaleY(1)}}`}</style>
                {/* Pulsing logo ring */}
                <div style={{position:'relative',width:120,height:120,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <div style={{width:88,height:88,borderRadius:'50%',border:'2px solid rgba(232,52,28,0.25)',position:'absolute'}}/>
                  <div style={{width:64,height:64,borderRadius:'50%',background:'radial-gradient(circle,rgba(232,52,28,0.25),rgba(232,52,28,0.05))',border:'1.5px solid rgba(232,52,28,0.4)',animation:'mpPulse 1.6s ease-in-out infinite',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="rgba(232,52,28,0.3)"/><path d="M8 12.5l2.5 2.5 5-5" stroke="#e8341c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  {/* Orbiting dot */}
                  <div style={{position:'absolute',inset:0,animation:'mpOrbit 2s linear infinite'}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:'#e8341c',boxShadow:'0 0 10px rgba(232,52,28,0.8)'}}/>
                  </div>
                </div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:38,color:'#f5f5f0',textAlign:'center',marginTop:28,textTransform:'uppercase',lineHeight:0.95}}>BUILDING<br/>YOUR WEEK.</div>
                <div style={{...mno,fontSize:10,color:'rgba(245,245,240,0.45)',textAlign:'center',letterSpacing:'0.14em',marginTop:18,minHeight:18,textTransform:'uppercase'}}>{MP_STATUSES[mpStatusIdx]}</div>
                {/* Animated equaliser bars */}
                <div style={{display:'flex',gap:4,marginTop:28,alignItems:'center',height:28}}>
                  {[0,1,2,3,4].map(i=>(
                    <div key={i} style={{width:4,height:22,background:'rgba(232,52,28,0.6)',borderRadius:2,transformOrigin:'bottom',animation:`mpBar 1.1s ease-in-out infinite`,animationDelay:`${i*0.13}s`}}/>
                  ))}
                </div>
              </div>
            )}

            {/* ── PLAN SCREEN ── */}
            {mealPrepScreen==='plan'&&mealPrepPlan&&(()=>{
              const totalMeals=(mealPrepPlan.days||[]).reduce((s,d)=>s+(d.meals||[]).filter(m=>!m.unfillable).length,0);
              const totalPrepMins=(mealPrepPlan.days||[]).reduce((s,d)=>(d.meals||[]).reduce((ms,m)=>ms+(m.prepTime||0),s),0);
              const prepH=Math.floor(totalPrepMins/60);
              const prepM=totalPrepMins%60;
              const groceryCount=Object.values(mealPrepPlan.groceryList||{}).reduce((s,arr)=>s+(arr?.length||0),0);
              return(
                <div>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes mpBarAnim{0%,100%{transform:scaleY(0.3)}50%{transform:scaleY(1)}}`}</style>

                  {/* Allergen warning/notice */}
                  {mealPrepWarning&&<motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} style={{background:'rgba(232,52,28,0.08)',border:'1px solid rgba(232,52,28,0.3)',borderRadius:12,padding:'10px 14px',marginBottom:16}}>
                    <div style={{...mno,fontSize:8,color:'#e8341c',letterSpacing:'0.14em',marginBottom:4}}>// ALLERGEN NOTICE</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'rgba(245,245,240,0.75)',lineHeight:1.6}}>{mealPrepWarning}</div>
                  </motion.div>}
                  {mealPrepPrefs.dietaryPrefs.length>0&&!mealPrepWarning&&<div style={{background:'rgba(232,52,28,0.04)',border:'1px solid rgba(232,52,28,0.1)',borderRadius:10,padding:'6px 14px',marginBottom:14}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(245,245,240,0.45)',lineHeight:1.5}}>Allergy filters applied. Always verify ingredients — not medical advice.</div>
                  </div>}

                  {/* Header */}
                  <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} style={{display:'flex',alignItems:'center',gap:14,marginBottom:8}}>
                    <button onPointerDown={()=>_hL()} onClick={()=>setMealPrepScreen('setup')} style={{background:'none',border:'none',color:'#f5f5f0',fontSize:20,cursor:'pointer',padding:'0 4px 0 0',lineHeight:1,flexShrink:0}}>←</button>
                    <div style={{flex:1}}>
                      <div style={{...mno,fontSize:9,color:'#FF3B30',letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:4}}>// MEAL PREP PLAN</div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:42,color:'#f5f5f0',lineHeight:0.9,textTransform:'uppercase'}}>YOUR WEEK.</div>
                    </div>
                    <button onPointerDown={()=>_hL()} onClick={()=>setMpSaveConfirm(true)} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'8px 14px',...mno,fontSize:8,fontWeight:700,color:'rgba(245,245,240,0.6)',letterSpacing:'0.12em',cursor:'pointer',textTransform:'uppercase',flexShrink:0}}>SAVE</button>
                  </motion.div>

                  {/* Summary strip */}
                  <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.06}} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,59,48,0.1)',borderRadius:14,padding:'14px 16px',marginBottom:22,display:'flex',justifyContent:'space-around',boxShadow:'0 4px 20px rgba(0,0,0,0.3)'}}>
                    {[[String(totalMeals)+' MEALS','GENERATED'],[prepH>0?`${prepH}H ${prepM}M`:`${prepM}M`,'EST PREP'],[String(groceryCount)+' ITEMS','GROCERY']].map(([val,lbl])=>(
                      <div key={lbl} style={{textAlign:'center'}}>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:24,color:'#f5f5f0',lineHeight:1}}>{val}</div>
                        <div style={{...mno,fontSize:7,color:'rgba(245,245,240,0.35)',letterSpacing:'0.14em',marginTop:3,textTransform:'uppercase'}}>{lbl}</div>
                      </div>
                    ))}
                  </motion.div>

                  {/* Day sections */}
                  {(mealPrepPlan.days||[]).map((day,dayIndex)=>{
                    const isRegDay=regeneratingDay===dayIndex;
                    const isTrainingDay=day.macroProtocol==='training_high'||day.sessionType!=='rest';
                    const sessionLabel=(day.sessionType||'rest').toUpperCase();
                    return(
                      <motion.div key={dayIndex} initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:0.08+dayIndex*0.06}} style={{marginBottom:20}}>
                        {/* Day header row */}
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,paddingLeft:2}}>
                          <div>
                            <div style={{...mno,fontSize:8,color:'#FF3B30',letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:3}}>// {day.day?.toUpperCase()} · {sessionLabel} DAY</div>
                            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:28,color:'#f5f5f0',textTransform:'uppercase',lineHeight:1}}>{day.day}</div>
                            <div style={{display:'flex',gap:10,marginTop:4,flexWrap:'wrap'}}>
                              <span style={{...mno,fontSize:8,color:'rgba(245,245,240,0.55)',letterSpacing:'0.08em'}}>{(day.totalCalories||0).toLocaleString()} kcal</span>
                              <span style={{...mno,fontSize:8,color:'#22c55e'}}>{day.totalProtein||0}P</span>
                              <span style={{...mno,fontSize:8,color:'#60a5fa'}}>{day.totalCarbs||0}C</span>
                              <span style={{...mno,fontSize:8,color:'#FEA020'}}>{day.totalFat||0}F</span>
                            </div>
                          </div>
                          <button onPointerDown={()=>_hL()} onClick={()=>!isRegDay&&regenerateDay(dayIndex)}
                            style={{background:'rgba(232,52,28,0.07)',border:'1px solid rgba(232,52,28,0.18)',borderRadius:10,padding:'8px 11px',display:'flex',alignItems:'center',gap:5,cursor:'pointer',flexShrink:0,opacity:isRegDay?0.45:1,outline:'none'}}>
                            {isRegDay
                              ?<div style={{width:13,height:13,border:'1.5px solid #e8341c',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
                              :<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#e8341c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 8A6 6 0 002.5 4"/><path d="M2 8A6 6 0 0013.5 12"/><polyline points="2,1 2,4 5,4"/><polyline points="14,12 14,15 11,15"/></svg>
                            }
                            <span style={{...mno,fontSize:7,color:'#e8341c',letterSpacing:'0.1em',textTransform:'uppercase'}}>Redo</span>
                          </button>
                        </div>

                        {/* Meal cards */}
                        {(day.meals||[]).map((meal,mealIndex)=>{
                          const mKey=`${dayIndex}_${mealIndex}`;
                          const isRegMeal=regeneratingMeal===mKey;

                          // ── THIN-POOL SLOT: honest message, not tappable ──────────────────
                          if(meal.unfillable){
                            return(
                              <div key={mealIndex} style={{
                                background:'rgba(255,255,255,0.015)',
                                border:'1px dashed rgba(254,160,32,0.2)',
                                borderRadius:14,marginBottom:8,padding:'14px 14px',
                                display:'flex',alignItems:'center',gap:12,opacity:0.65,
                              }}>
                                <div style={{fontSize:26,flexShrink:0,lineHeight:1}}>🍽️</div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{...mno,fontSize:7,color:'#FEA020',letterSpacing:'0.14em',marginBottom:3,textTransform:'uppercase'}}>
                                    MEAL {mealIndex+1} · {(meal.slot||'').toUpperCase()} · THIN POOL
                                  </div>
                                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,color:'rgba(245,245,240,0.42)',lineHeight:1.3}}>
                                    Not enough {mealPrepPrefs.dietPreset||'matching'} {meal.slot} recipes for your current restrictions
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // ── REGULAR MEAL CARD ────────────────────────────────────────────
                          return(
                            <motion.div key={mealIndex}
                              initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}}
                              transition={{delay:0.1+dayIndex*0.06+mealIndex*0.04}}
                              whileTap={{scale:0.97}}
                              onPointerDown={()=>_hL()}
                              onClick={()=>{if(!isRegMeal){_hM();setActiveMealDetail({day,meal,dayIndex,mealIndex});}}}
                              style={{
                                background:'rgba(255,255,255,0.04)',
                                border:'1px solid rgba(255,59,48,0.14)',
                                borderRadius:14,
                                marginBottom:8,
                                padding:'14px 14px',
                                display:'flex',
                                alignItems:'center',
                                gap:12,
                                boxShadow:'0 4px 18px rgba(0,0,0,0.45)',
                                cursor:'pointer',
                                opacity:isRegMeal?0.45:1,
                              }}
                            >
                              <FoodIcon name={meal.name} size={44} userId={user?.id} />
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{...mno,fontSize:7,color:'#FF3B30',letterSpacing:'0.14em',marginBottom:3,textTransform:'uppercase'}}>MEAL {mealIndex+1}</div>
                                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:18,color:'#f5f5f0',textTransform:'uppercase',lineHeight:1.05,marginBottom:7,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{meal.name}</div>
                                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                                  <span style={{background:'rgba(232,52,28,0.1)',border:'1px solid rgba(232,52,28,0.2)',borderRadius:20,padding:'2px 8px',...mno,fontSize:7,color:'rgba(245,245,240,0.8)',letterSpacing:'0.08em'}}>{meal.calories} kcal</span>
                                  <span style={{background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:20,padding:'2px 8px',...mno,fontSize:7,color:'#22c55e',letterSpacing:'0.08em'}}>{meal.protein}P</span>
                                  <span style={{background:'rgba(96,165,250,0.1)',border:'1px solid rgba(96,165,250,0.2)',borderRadius:20,padding:'2px 8px',...mno,fontSize:7,color:'#60a5fa',letterSpacing:'0.08em'}}>{meal.carbs}C</span>
                                  <span style={{background:'rgba(254,160,32,0.1)',border:'1px solid rgba(254,160,32,0.2)',borderRadius:20,padding:'2px 8px',...mno,fontSize:7,color:'#FEA020',letterSpacing:'0.08em'}}>{meal.fat}F</span>
                                </div>
                              </div>
                              {isRegMeal
                                ?<div style={{width:14,height:14,border:'1.5px solid #e8341c',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',flexShrink:0}}/>
                                :<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="rgba(255,59,48,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M6 4l4 4-4 4"/></svg>
                              }
                            </motion.div>
                          );
                        })}
                        {isTrainingDay&&(
                          <div style={{...mno,fontSize:7,color:'rgba(245,245,240,0.2)',letterSpacing:'0.1em',paddingLeft:4,paddingBottom:4,textTransform:'uppercase'}}>↑ Carbs elevated for {sessionLabel} performance</div>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* Spacer for fixed bottom bar */}
                  <div style={{height:100}}/>
                </div>
              );
            })()}

            {/* ── BOTTOM ACTION BAR (plan screen only) ── */}
            {mealPrepScreen==='plan'&&mealPrepPlan&&(
              <div style={{position:'fixed',bottom:0,left:0,right:0,background:'rgba(0,0,0,0.97)',backdropFilter:'blur(16px)',borderTop:'1px solid rgba(232,52,28,0.12)',padding:'14px 20px',paddingBottom:'max(14px, env(safe-area-inset-bottom))',display:'flex',gap:10,zIndex:200}}>
                <motion.button whileTap={{scale:0.96}} onPointerDown={()=>_hL()} onClick={()=>{_hM();setShowGroceryList(true);}}
                  style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(232,52,28,0.22)',borderRadius:13,padding:14,...mno,fontWeight:700,fontSize:10,color:'#f5f5f0',letterSpacing:'0.13em',textTransform:'uppercase',cursor:'pointer',boxShadow:'0 2px 12px rgba(0,0,0,0.3)'}}>
                  🛒 GROCERY
                </motion.button>
                <motion.button whileTap={{scale:0.96}} onPointerDown={()=>_hM()} onClick={()=>generateMealPrepPlan()}
                  style={{flex:1.3,background:'linear-gradient(135deg,#e8341c,#c0271b)',border:'none',borderRadius:13,padding:14,...mno,fontWeight:700,fontSize:10,color:'#fff',letterSpacing:'0.13em',textTransform:'uppercase',cursor:'pointer',boxShadow:'0 4px 20px rgba(232,52,28,0.4)'}}>
                  ↺ REGENERATE
                </motion.button>
              </div>
            )}

            {/* ── MEAL DETAIL SHEET ── */}
            <AnimatePresence>
            {activeMealDetail&&(()=>{
              const {day,meal}=activeMealDetail;
              const mno2={fontFamily:"'DM Mono',monospace"};
              const cal=meal?.calories||0;
              const pro=meal?.protein||0;
              const carb=meal?.carbs||0;
              const fat=meal?.fat||0;
              const ings=meal?.ingredients||meal?.ing||[];
              const totalMacroCal=pro*4+carb*4+fat*9||1;
              const maxMacro=Math.max(pro,carb,fat)||1;
              // SVG donut
              const R=52,SW=11,CX=68,CY=68;
              const C=2*Math.PI*R;
              const pLen=Math.max(2,(pro*4/totalMacroCal)*C-4);
              const cLen=Math.max(2,(carb*4/totalMacroCal)*C-4);
              const fLen=Math.max(2,(fat*9/totalMacroCal)*C-4);
              const pOff=-(C*0.25);
              const cOff=-(C*0.25+(pro*4/totalMacroCal)*C);
              const fOff=-(C*0.25+(pro*4/totalMacroCal)*C+(carb*4/totalMacroCal)*C);
              return(
                <motion.div key="meal-detail-overlay"
                  initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                  transition={{duration:0.18}}
                  style={{position:'fixed',inset:0,zIndex:500,background:'radial-gradient(ellipse at 50% -10%,rgba(90,0,0,0.85) 0%,rgba(0,0,0,0.98) 55%)'}}
                  onClick={()=>{_hL();setActiveMealDetail(null);}}
                >
                  <motion.div
                    initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}
                    transition={{type:'spring',damping:28,stiffness:290}}
                    style={{position:'absolute',top:0,bottom:0,left:0,right:0,overflowY:'auto',WebkitOverflowScrolling:'touch'}}
                    onClick={e=>e.stopPropagation()}
                  >
                    <div style={{padding:'max(52px,env(safe-area-inset-top,48px)) 22px max(32px,env(safe-area-inset-bottom,28px))'}}>
                      {/* Close button */}
                      <button onPointerDown={()=>_hL()} onClick={()=>{_hM();setActiveMealDetail(null);}}
                        style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'8px 16px',display:'flex',alignItems:'center',gap:6,cursor:'pointer',marginBottom:24,outline:'none'}}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#f5f5f0" strokeWidth="2" strokeLinecap="round"><path d="M10 4l-4 4 4 4"/></svg>
                        <span style={{...mno2,fontSize:9,color:'rgba(245,245,240,0.65)',letterSpacing:'0.12em',textTransform:'uppercase'}}>CLOSE</span>
                      </button>
                      {/* Context eyebrow */}
                      <div style={{...mno2,fontSize:8,color:'#FF3B30',letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:6}}>
                        {day?.day?.toUpperCase()} · {(day?.sessionType||'rest').toUpperCase()} DAY
                      </div>
                      {/* Meal name */}
                      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
                        style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:44,color:'#f5f5f0',textTransform:'uppercase',lineHeight:0.92,marginBottom:28}}>
                        {meal?.name}
                      </motion.div>

                      {/* Macro breakdown — SVG donut + bars */}
                      <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:0.15}}
                        style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,59,48,0.14)',borderRadius:16,padding:'20px 18px',marginBottom:24,boxShadow:'0 6px 24px rgba(0,0,0,0.5)'}}>
                        <div style={{...mno2,fontSize:8,color:'#FF3B30',letterSpacing:'0.16em',textTransform:'uppercase',marginBottom:16}}>// MACRO BREAKDOWN</div>
                        <div style={{display:'flex',alignItems:'center',gap:20}}>
                          {/* Donut ring */}
                          <div style={{flexShrink:0}}>
                            <svg width="136" height="136" viewBox="0 0 136 136">
                              {/* Background track */}
                              <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={SW}/>
                              {/* Protein arc */}
                              <motion.circle cx={CX} cy={CY} r={R} fill="none" stroke="#22c55e" strokeWidth={SW} strokeLinecap="butt"
                                style={{strokeDashoffset:pOff}}
                                strokeDasharray={`${pLen} ${C}`}
                                initial={{strokeDasharray:`0 ${C}`}}
                                animate={{strokeDasharray:`${pLen} ${C}`}}
                                transition={{duration:0.8,ease:'easeOut',delay:0.2}}
                              />
                              {/* Carbs arc */}
                              <motion.circle cx={CX} cy={CY} r={R} fill="none" stroke="#60a5fa" strokeWidth={SW} strokeLinecap="butt"
                                style={{strokeDashoffset:cOff}}
                                strokeDasharray={`${cLen} ${C}`}
                                initial={{strokeDasharray:`0 ${C}`}}
                                animate={{strokeDasharray:`${cLen} ${C}`}}
                                transition={{duration:0.8,ease:'easeOut',delay:0.32}}
                              />
                              {/* Fat arc */}
                              <motion.circle cx={CX} cy={CY} r={R} fill="none" stroke="#FEA020" strokeWidth={SW} strokeLinecap="butt"
                                style={{strokeDashoffset:fOff}}
                                strokeDasharray={`${fLen} ${C}`}
                                initial={{strokeDasharray:`0 ${C}`}}
                                animate={{strokeDasharray:`${fLen} ${C}`}}
                                transition={{duration:0.8,ease:'easeOut',delay:0.44}}
                              />
                              {/* Center calorie number */}
                              <text x={CX} y={CY-9} textAnchor="middle" fill="#f5f5f0" fontFamily="Barlow Condensed,sans-serif" fontStyle="italic" fontWeight="900" fontSize="26">{cal}</text>
                              <text x={CX} y={CY+8} textAnchor="middle" fill="rgba(245,245,240,0.35)" fontFamily="DM Mono,monospace" fontSize="7" letterSpacing="2">KCAL</text>
                            </svg>
                          </div>
                          {/* Macro bars */}
                          <div style={{flex:1}}>
                            {[
                              {label:'PROTEIN',value:pro,unit:'g',color:'#22c55e'},
                              {label:'CARBS',value:carb,unit:'g',color:'#60a5fa'},
                              {label:'FAT',value:fat,unit:'g',color:'#FEA020'},
                            ].map(({label,value,unit,color},bi)=>(
                              <div key={label} style={{marginBottom:12}}>
                                <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                                  <span style={{...mno2,fontSize:7,color:'rgba(245,245,240,0.4)',letterSpacing:'0.12em',textTransform:'uppercase'}}>{label}</span>
                                  <span style={{...mno2,fontSize:10,color,fontWeight:700}}>{value}{unit}</span>
                                </div>
                                <div style={{height:5,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden'}}>
                                  <motion.div
                                    style={{height:'100%',background:color,borderRadius:3}}
                                    initial={{width:0}}
                                    animate={{width:`${(value/maxMacro)*100}%`}}
                                    transition={{duration:0.75,ease:'easeOut',delay:0.18+bi*0.08}}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>

                      {/* Ingredients — structured {item, amount} from tool use; legacy strings also handled */}
                      {ings.length>0&&(
                        <div style={{marginBottom:24}}>
                          <div style={{...mno2,fontSize:8,color:'#FF3B30',letterSpacing:'0.16em',textTransform:'uppercase',marginBottom:12}}>// WHAT'S IN THE BOWL</div>
                          {ings.map((ing,i)=>{
                            const ingName=typeof ing==='object'?(ing?.item||''):(()=>{const s=String(ing||'');const m=s.match(/^[\d\/\.\s]*[a-z]*\s+(.+)$/i);return m?m[1].trim():s;})();
                            const ingAmt=typeof ing==='object'?(ing?.amount||''):(()=>{const s=String(ing||'');const m=s.match(/^([\d\/\.\s]*[a-z]+)\s/i);return m?m[1].trim():'';})();
                            return(
                              <motion.div key={i}
                                initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}}
                                transition={{delay:0.2+i*0.05}}
                                style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,marginBottom:6,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)'}}>
                                <FoodIcon name={ingName||String(ing)} size={32} userId={user?.id} />
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:16,color:'#f5f5f0',textTransform:'capitalize',lineHeight:1.1}}>{ingName||String(ing)}</div>
                                </div>
                                {ingAmt&&<div style={{...mno2,fontSize:11,color:'rgba(245,245,240,0.55)',fontWeight:700,flexShrink:0}}>{ingAmt}</div>}
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {/* Instructions — HOW TO MAKE IT */}
                      {meal?.instructions&&(
                        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.3}} style={{marginBottom:24}}>
                          <div style={{...mno2,fontSize:8,color:'#FF3B30',letterSpacing:'0.16em',textTransform:'uppercase',marginBottom:12}}>// HOW TO MAKE IT</div>
                          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:'14px 16px'}}>
                            {meal.instructions.split(/\n|(?<=\.)\s+(?=\d+\.)/).filter(Boolean).map((step,si)=>{
                              const trimmed=step.trim();
                              if(!trimmed)return null;
                              const isNumbered=/^\d+[.)]\s/.test(trimmed);
                              return(
                                <div key={si} style={{display:'flex',gap:10,marginBottom:si<meal.instructions.split(/\n|(?<=\.)\s+(?=\d+\.)/).filter(Boolean).length-1?10:0}}>
                                  {isNumbered&&<div style={{...mno2,fontSize:9,color:'#FF3B30',fontWeight:700,flexShrink:0,marginTop:1}}>{trimmed.match(/^(\d+)/)?.[1]}.</div>}
                                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:'rgba(245,245,240,0.72)',lineHeight:1.65,flex:1}}>{isNumbered?trimmed.replace(/^\d+[.)]\s*/,''):trimmed}</div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}

                      {/* Prep time */}
                      {(meal?.prepTime||meal?.pt)&&(
                        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'12px 16px',marginBottom:20,display:'flex',alignItems:'center',gap:10}}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(245,245,240,0.4)" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                          <span style={{...mno2,fontSize:10,color:'rgba(245,245,240,0.55)',letterSpacing:'0.1em',textTransform:'uppercase'}}>Prep time: {meal.prepTime||meal.pt} min</span>
                        </div>
                      )}

                      {/* Swap this meal button */}
                      <motion.button whileTap={{scale:0.97}} onPointerDown={()=>_hL()}
                        onClick={()=>{
                          _hM();
                          setActiveMealDetail(null);
                          regenerateMeal(activeMealDetail.dayIndex,activeMealDetail.mealIndex);
                        }}
                        style={{width:'100%',background:'rgba(232,52,28,0.08)',border:'1px solid rgba(232,52,28,0.2)',borderRadius:14,padding:15,...mno2,fontWeight:700,fontSize:10,color:'#e8341c',letterSpacing:'0.14em',textTransform:'uppercase',cursor:'pointer',marginBottom:8}}>
                        ↺ SWAP THIS MEAL
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })()}
            </AnimatePresence>

            {/* ── GROCERY LIST BOTTOM SHEET ── */}
            {showGroceryList&&mealPrepPlan&&(()=>{
              // Build grocery list: prefer AI-generated list, else aggregate from meal ingredients
              let groceryCats=mealPrepPlan.groceryList||{};
              const hasData=Object.values(groceryCats).some(a=>a?.length>0);
              if(!hasData){
                // Aggregate all ingredients from meals
                const allIngs=[];
                for(const d of(mealPrepPlan.days||[])){
                  for(const m of(d.meals||[])){
                    for(const ing of(m.ingredients||m.ing||[])){
                      if(!ing)continue;
                      // Structured {item,amount} from tool use, or legacy string
                      if(typeof ing==='object'&&ing.item){
                        allIngs.push(ing.amount?`${ing.item} — ${ing.amount}`:ing.item);
                      }else{
                        allIngs.push(String(ing));
                      }
                    }
                  }
                }
                // Dedupe by ingredient name (strip amounts for key comparison)
                const seen=new Set();
                const deduped=allIngs.filter(i=>{const k=i.toLowerCase().replace(/\s*—.*$/,'').replace(/^\d+[a-z]*\s*/,'').trim();if(seen.has(k))return false;seen.add(k);return true;});
                groceryCats={ingredients:deduped};
              }
              return(
                <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.72)',zIndex:490}} onClick={()=>{_hL();setShowGroceryList(false);}}>
                  <motion.div
                    initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}
                    transition={{type:'spring',damping:28,stiffness:300}}
                    style={{position:'fixed',bottom:0,left:0,right:0,background:'#0d0d0d',border:'1px solid rgba(232,52,28,0.1)',borderRadius:'20px 20px 0 0',maxHeight:'82vh',overflowY:'auto',zIndex:500,paddingBottom:'max(32px,env(safe-area-inset-bottom,20px))',WebkitOverflowScrolling:'touch'}}
                    onClick={e=>e.stopPropagation()}
                  >
                    <div style={{width:36,height:4,background:'rgba(245,245,240,0.12)',borderRadius:2,margin:'16px auto 18px'}}/>
                    <div style={{padding:'0 20px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                      <div>
                        <div style={{...mno,fontSize:8,color:'#FF3B30',letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:3}}>// SHOPPING LIST</div>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:26,color:'#f5f5f0',textTransform:'uppercase',lineHeight:1}}>GROCERY LIST</div>
                      </div>
                      <button onPointerDown={()=>_hL()} onClick={()=>setShowGroceryList(false)} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,width:32,height:32,color:'rgba(245,245,240,0.5)',fontSize:16,cursor:'pointer',lineHeight:1,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                    </div>
                    {Object.entries(groceryCats).map(([category,items])=>{
                      if(!items||items.length===0)return null;
                      return(
                        <div key={category}>
                          <div style={{padding:'0 20px',...mno,fontSize:8,color:'rgba(245,245,240,0.28)',letterSpacing:'0.18em',textTransform:'uppercase',marginTop:18,marginBottom:8}}>{category.toUpperCase()}</div>
                          {items.map((item,idx)=>{
                            const itemId=`${category}_${idx}`;
                            const checked=checkedGroceryItems.has(itemId);
                            return(
                              <div key={itemId}
                                onPointerDown={()=>_hL()}
                                onClick={()=>setCheckedGroceryItems(prev=>{const next=new Set(prev);if(next.has(itemId))next.delete(itemId);else next.add(itemId);return next;})}
                                style={{padding:'13px 20px',display:'flex',alignItems:'center',gap:14,borderBottom:'1px solid rgba(232,52,28,0.04)',cursor:'pointer'}}>
                                <div style={{width:22,height:22,borderRadius:6,border:checked?'none':'1.5px solid rgba(232,52,28,0.28)',background:checked?'#e8341c':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s'}}>
                                  {checked&&<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 7l3.5 3.5 5.5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </div>
                                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,color:checked?'rgba(245,245,240,0.25)':'#f5f5f0',textDecoration:checked?'line-through':'none',lineHeight:1.2,textTransform:'capitalize'}}>{item}</div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </motion.div>
                </div>
              );
            })()}

            {/* ── SAVE CONFIRM ── */}
            {mpSaveConfirm&&(
              <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setMpSaveConfirm(false)}>
                <div style={{background:'#0d0d0d',borderRadius:16,padding:24,textAlign:'center',maxWidth:360,width:'100%'}} onClick={e=>e.stopPropagation()}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:24,color:'#f5f5f0',marginBottom:8}}>LOG THIS PLAN?</div>
                  <div style={{...mno,fontSize:10,color:'rgba(245,245,240,0.4)',lineHeight:1.7,marginBottom:20}}>This will pre-log all meals to your food diary for the selected days.</div>
                  <button onClick={saveMealPrepPlan} style={{width:'100%',background:'#e8341c',border:'none',borderRadius:12,padding:14,...mno,fontWeight:700,fontSize:11,color:'#fff',letterSpacing:'0.14em',cursor:'pointer',marginBottom:10}}>CONFIRM & SAVE →</button>
                  <button onClick={()=>setMpSaveConfirm(false)} style={{width:'100%',background:'transparent',border:'1px solid rgba(245,245,240,0.1)',borderRadius:12,padding:12,...mno,fontSize:10,color:'rgba(245,245,240,0.4)',letterSpacing:'0.12em',cursor:'pointer'}}>CANCEL</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* hidden file input for menu scan — used by both inline tab and modal */}
        <input ref={menuScanRef} type="file" accept="image/*" capture="environment" onChange={handleMenuScan} style={{display:"none"}}/>

        {/* ── MEAL LOCK GATE MODAL ── */}
        {lockGate&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
            <div style={{background:"#111",border:"1.5px solid rgba(232,52,28,0.3)",borderRadius:20,padding:28,maxWidth:340,width:"100%",textAlign:"center"}}>
              <div style={{fontFamily:"var(--mono)",fontSize:8,color:"#e8341c",letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:12}}>// LOCK IN MEAL {lockGate.slotToLock}?</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:24,color:"#f5f5f0",lineHeight:1.1,marginBottom:10,textTransform:"uppercase"}}>Finished with {getSlotLabel(lockGate.slotToLock)}?</div>
              <div style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.5)",lineHeight:1.6,marginBottom:24}}>Locking seals this meal. Items become read-only and macros are recorded for the day.</div>
              <div style={{display:"flex",gap:10}}>
                <button
                  onClick={()=>{
                    const newLocked=[...(lockedSlots||[]),lockGate.slotToLock];
                    if(onLockSlots)onLockSlots(newLocked);
                    pendingLogSlotRef.current=lockGate.pendingIdx;
                    setLockGate(null);
                    setFuelScreen('log');
                  }}
                  style={{flex:2,padding:"14px",background:"#e8341c",border:"none",borderRadius:12,fontFamily:"var(--mono)",fontWeight:700,fontSize:10,color:"#fff",letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>
                  YES — LOCK IT
                </button>
                <button
                  onClick={()=>setLockGate(null)}
                  style={{flex:1,padding:"14px",background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.1)",borderRadius:12,fontFamily:"var(--mono)",fontWeight:700,fontSize:10,color:"rgba(245,245,240,0.5)",letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>
                  NOT YET
                </button>
              </div>
            </div>
          </div>
        )}

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
