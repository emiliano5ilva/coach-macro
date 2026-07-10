import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { MN, MotionArc, StaggerItem } from './motion-layer.jsx';
import { getRunWeek, HEAVY_LOWER_CYCLES, HYBRID_TEMPLATE_CYCLES } from './running_programs.js';
const _hL=()=>{try{Haptics.impact({style:ImpactStyle.Light});}catch{}};
const _hM=()=>{try{Haptics.impact({style:ImpactStyle.Medium});}catch{}};
import FoodIcon from "./FoodIcon.jsx";
import { getFoodIcon } from "./iconMap.js";
import { Icon } from "@iconify/react";
import { adaptMessageSync, getProfileSync } from "./services/personalityService.js";
import FeatureStrip from "./components/FeatureStrip.jsx";
import BarcodeScanner from "./BarcodeScanner.jsx";
import { FlagBtn } from "./FlagBtn.jsx";
import { MetabolicResetProgressCard } from "./MetabolicAdaptation.jsx";
import { T, GLOBAL_CSS, WDAYS, DAY_CFG, FASTING_PROTOCOLS,
  Ring, MacroRing, MacroBar, PrimaryBtn, SectionCard, Spinner, Logo, WhistleMark, FAQItem,
  FoodSearchSkeleton, AIContentSkeleton, EmptyState, hap, calcTDEE,
  GOCLUB_REDESIGN } from "./components.jsx";

const _FUEL_GOCLUB_CSS=`
.goclub.tab-fuel{background:var(--cm-red)!important;--condensed:'Archivo',sans-serif}
.goclub.tab-fuel .screen-header{border:none!important;background:transparent!important}
.goclub.tab-fuel .header-title{font-family:'Archivo',sans-serif!important;font-style:normal!important;font-weight:800!important;font-size:26px!important;line-height:1.1!important}
.goclub.tab-fuel .header-eyebrow{font-family:'Archivo',sans-serif!important;font-style:normal!important;font-weight:700!important;font-size:11px!important;letter-spacing:0.16em!important;color:rgba(255,255,255,0.85)!important;text-transform:uppercase!important}
.goclub.tab-fuel [style*="Barlow Condensed"]{font-family:'Archivo',sans-serif!important;font-style:normal!important}
.goclub.tab-fuel [style*="Barlow Condensed"][style*="fontStyle"]{font-style:normal!important}
`;
import { showToast } from "./utils/toast.js";
import { mealHasAllergen, scanTextAllergens } from "./utils/allergenFilter.js";
import { fitWeek, fitDay, orderPlanMeals } from "./services/mealFitter.js";
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

// Lever 4: Restaurant AI session caches (module scope → survive modal open/close for the app session).
// Re-tapping a restaurant you already viewed (same meal targets) = instant, no LLM call.
// Re-searching a city you already searched = instant, no geocode/places round-trips.
const _raRecCache = new Map();     // key: `${name}|${cal}|${prot}|${carb}|${fat}` → rec result
const _raPlacesCache = new Map();  // key: city (lowercased, trimmed)               → places array

// #4: funky food-themed loader copy — shuffled random order each generation, ~1.7s per line.
const RA_LOAD_MSGS = [
  "Marinating the options…","Consulting the flavor gods…","Simmering your picks…",
  "Negotiating with the chef…","Interrogating the menu…","Weighing the guac…",
  "Whisking up your macros…","Sniffing out the protein…","Judging the breadsticks…",
  "Doing the math on fries…","Bribing the kitchen…","Seasoning the results…",
  "Counting the sprinkles…","Debating the dessert…","Measuring the portions…",
  "Side-eyeing the fried stuff…","Calculating chew velocity…","Plating your best order…",
];

// Persistent allergy/dietary safety note. Best-effort filtering is NOT a guarantee — this must stay
// visible near the allergy filter and on the generated plan (not a dismissible toast). Reusable so it
// reads identically everywhere. Design-system tokens (--cm-*), Archivo. [[coach-macro-project-state-doc]]
function AllergyDisclaimer({ style }) {
  return (
    <div style={{ background:'rgba(var(--cm-ink-rgb,10,10,10),0.03)', border:'1px solid rgba(var(--cm-ink-rgb,10,10,10),0.10)', borderRadius:12, padding:'10px 14px', ...style }}>
      <div style={{ fontFamily:"'Archivo',sans-serif", fontSize:9, fontWeight:700, color:'var(--cm-red,#FF3B30)', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:4 }}>Allergy notice</div>
      <div style={{ fontFamily:"'Archivo',sans-serif", fontSize:11, fontWeight:500, color:'rgba(var(--cm-ink-rgb,10,10,10),0.6)', lineHeight:1.6 }}>Allergy filtering is best-effort. Always check ingredient labels yourself. The app can't catch mislabeled items, trace amounts, or cross-contamination.</div>
    </div>
  );
}

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
      <div style={{ background: "#0d0d0d", border: "1px solid rgba(var(--cm-red-rgb,255,59,48),0.12)", borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", maxWidth: 480, width: "100%" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 32, height: 3, background: "rgba(var(--cm-red-rgb,255,59,48),0.2)", borderRadius: 2, margin: "0 auto 20px" }} />
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
      <div style={{ background: "#0d0d0d", border: "1px solid rgba(var(--cm-red-rgb,255,59,48),0.12)", borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", maxWidth: 480, width: "100%" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 32, height: 3, background: "rgba(var(--cm-red-rgb,255,59,48),0.2)", borderRadius: 2, margin: "0 auto 20px" }} />
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
          <div style={{ marginTop: 14, background: "rgba(var(--cm-red-rgb,255,59,48),0.06)", border: "1px solid rgba(var(--cm-red-rgb,255,59,48),0.18)", borderRadius: 12, padding: "14px 16px" }}>
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
                <div style={{ flex: 1, height: 4, background: "rgba(var(--cm-red-rgb,255,59,48),0.07)", borderRadius: 2, overflow: "hidden" }}>
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
      background:GOCLUB_REDESIGN?"var(--cm-paper,#FFFFFF)":"rgba(59,130,246,0.03)",
      backgroundImage:GOCLUB_REDESIGN?"none":"radial-gradient(circle at top, rgba(59,130,246,0.06) 0%, transparent 60%)",
      boxShadow:GOCLUB_REDESIGN?"0 2px 12px rgba(0,0,0,.08)":"0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(59,130,246,0.12), inset 0 1px 0 0 rgba(59,130,246,0.15)",
      border:GOCLUB_REDESIGN?"1px solid rgba(var(--cm-ink-rgb,10,10,10),0.06)":undefined,
      borderRadius:16,padding:"16px 18px",marginBottom:12,
    }}>
      <style>{`@keyframes hydRingSweep{from{stroke-dashoffset:${circ}}to{stroke-dashoffset:${(circ-fillLen).toFixed(1)}}}`}</style>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"var(--condensed)",fontSize:13,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(var(--cm-ink-rgb,10,10,10),0.65)"}}>Hydration</div>
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
              <div key={i} style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:i===0?"rgba(245,245,240,0.75)":"rgba(147,197,253,0.6)",lineHeight:1.55,marginTop:i>0?8:0}}>{para}</div>
            ))}
          </div>
        </>
      )}


      {/* Ring row: consumed | ring+center | target */}
      <div style={{position:"relative",height:180,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>
        {/* Left — consumed */}
        <div style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",textAlign:"center",width:54}}>
          <div style={{...mno,fontSize:22,fontWeight:700,color:"var(--cm-ink,#0A0A0A)",lineHeight:1}}>{Math.round(totalOz)}</div>
          <div style={{...mno,fontSize:8,color:"rgba(var(--cm-ink-rgb,10,10,10),0.4)",letterSpacing:"0.12em",textTransform:"uppercase",marginTop:4}}>OZ</div>
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
          <div style={{...mno,fontSize:9,color:"rgba(var(--cm-ink-rgb,10,10,10),0.4)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:2}}>OZ LEFT</div>
          <div style={{fontFamily:"'Archivo',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:42,color:"#93C5FD",lineHeight:1,letterSpacing:"-0.02em",textShadow:"none"}}>
            {isOver?"0":Math.round(ozLeft)}
          </div>
          <div style={{...mno,fontSize:9,color:"rgba(var(--cm-ink-rgb,10,10,10),0.4)",letterSpacing:"0.08em",marginTop:4}}>of {waterTarget} oz</div>
        </div>

        {/* Right — target */}
        <div style={{position:"absolute",right:0,top:"50%",transform:"translateY(-50%)",textAlign:"center",width:54}}>
          <div style={{...mno,fontSize:22,fontWeight:700,color:"rgba(var(--cm-ink-rgb,10,10,10),0.5)",lineHeight:1}}>{waterTarget}</div>
          <div style={{...mno,fontSize:8,color:"rgba(var(--cm-ink-rgb,10,10,10),0.4)",letterSpacing:"0.12em",textTransform:"uppercase",marginTop:4}}>OZ</div>
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
            style={{flex:1,background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:10,padding:"8px 12px",color:"var(--cm-ink,#0A0A0A)",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none"}}/>
          <button onClick={handleCustom} style={{padding:"8px 18px",background:"rgba(59,130,246,0.25)",border:"1px solid rgba(59,130,246,0.5)",borderRadius:10,color:"#93C5FD",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Add</button>
        </div>
      )}

      {/* Recent logs with long-press to delete */}
      {lastFive.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {lastFive.map(log=>(
            <div key={log.id} onPointerDown={()=>startPress(log.id)} onPointerUp={()=>endPress()} onPointerLeave={()=>endPress()}
              style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",background:"rgba(59,130,246,0.05)",borderRadius:8,position:"relative"}}>
              <div style={{...mno,fontSize:11,color:"rgba(var(--cm-ink-rgb,10,10,10),0.5)"}}>
                {new Date(log.logged_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
              </div>
              <div style={{...mno,fontSize:11,color:"#93C5FD",fontWeight:700}}>+{log.amount_oz} oz</div>
              {longPressId===log.id&&(
                <div style={{position:"absolute",right:0,top:-2,zIndex:10,display:"flex",gap:6}}>
                  <button onClick={()=>{onDeleteWater(log.id);setLongPressId(null);}}
                    style={{padding:"5px 10px",background:T.prot,border:"none",borderRadius:8,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
                  <button onClick={()=>setLongPressId(null)}
                    style={{padding:"5px 10px",background:"rgba(var(--cm-ink-rgb,10,10,10),0.06)",border:"none",borderRadius:8,color:"rgba(var(--cm-ink-rgb,10,10,10),0.5)",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
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
            {portionMode==="custom"&&<input type="number" value={customPortionInput} onChange={e=>setCustomPortionInput(e.target.value)} placeholder="Enter grams" style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:8,padding:"10px 12px",color:"var(--cm-red,#FF3B30)",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginTop:6,marginBottom:0}}/>}
          </>}
          {smart.length===0&&<>
            <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>Grams</div>
            <input type="number" value={customPortionInput||portionGrams} onChange={e=>setCustomPortionInput(e.target.value)} placeholder="100" style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:8,padding:"10px 12px",color:"var(--cm-red,#FF3B30)",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
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
        <div style={{fontFamily:"'Archivo',sans-serif",fontSize:28,fontWeight:900,marginBottom:16,color:'var(--cm-red,#FF3B30)'}}>CUSTOM FOOD</div>
        <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:16,padding:"20px",marginBottom:16}}>
          {[["Food name","text","name","e.g. Homemade oats",true],["Brand (optional)","text","brand","e.g. My Kitchen",false],["Calories (kcal)","number","calories","0",true],["Protein (g)","number","protein","0",false],["Carbs (g)","number","carbs","0",false],["Fat (g)","number","fat","0",false],["Serving size","number","serving_size","100",false],["Serving unit","text","serving_unit","g",false]].map(([label,type,key,ph,req])=>(
            <div key={key} style={{marginBottom:12}}>
              <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>{label}{req&&<span style={{color:T.prot}}> *</span>}</div>
              <input type={type} value={customFood[key]} onChange={e=>setCustomFood(f=>({...f,[key]:e.target.value}))} placeholder={ph} style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:8,padding:"10px 12px",color:"var(--cm-red,#FF3B30)",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
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
        <button onClick={()=>setShowBarcodeInSearch(false)} style={{background:"none",border:"none",...{fontFamily:"'DM Mono',monospace"},fontSize:9,color:"rgba(var(--cm-red-rgb,255,59,48),0.4)",cursor:"pointer",padding:"0 0 16px",letterSpacing:"0.12em",display:"block"}}>← BACK TO SEARCH</button>
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
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search 1M+ foods..." style={{width:"100%",background:"var(--cm-paper,#FFFFFF)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.12)",borderRadius:12,padding:"12px 16px",color:"var(--cm-red,#FF3B30)",fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"'Archivo',sans-serif"}}/>
          {!searching&&query&&<button onClick={()=>{setQuery("");setResults([]);}} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"rgba(var(--cm-red-rgb,255,59,48),0.3)",fontSize:18,cursor:"pointer",lineHeight:1,padding:"0 2px"}}>×</button>}
        </div>
        <button onClick={()=>setShowBarcodeInSearch(true)} style={{width:44,height:44,borderRadius:10,background:"var(--cm-paper,#FFFFFF)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer"}}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display:'block'}}>
            <rect x="1" y="1" width="6" height="6" rx="1" stroke="var(--cm-red,#FF3B30)" strokeWidth="1.5" fill="none"/>
            <rect x="15" y="1" width="6" height="6" rx="1" stroke="var(--cm-red,#FF3B30)" strokeWidth="1.5" fill="none"/>
            <rect x="1" y="15" width="6" height="6" rx="1" stroke="var(--cm-red,#FF3B30)" strokeWidth="1.5" fill="none"/>
            <line x1="9" y1="2" x2="9" y2="7" stroke="var(--cm-red,#FF3B30)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="2" x2="12" y2="7" stroke="var(--cm-red,#FF3B30)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="9" y1="15" x2="9" y2="20" stroke="var(--cm-red,#FF3B30)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="15" x2="12" y2="20" stroke="var(--cm-red,#FF3B30)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="15" y1="9" x2="20" y2="9" stroke="var(--cm-red,#FF3B30)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="15" y1="12" x2="20" y2="12" stroke="var(--cm-red,#FF3B30)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      {searching&&<div style={{marginBottom:16}}><FoodSearchSkeleton/></div>}
      {!searching&&results.length>0&&(
        <div style={{background:"var(--cm-paper,#FFFFFF)",border:`1px solid ${T.bd}`,borderRadius:12,marginBottom:16,overflow:"hidden"}}>
          {results.slice(0,12).map((food,i)=>(
            <button key={food.id||i} onClick={()=>selectFood(food)} style={{width:"100%",padding:"12px 16px",background:"var(--cm-paper,#FFFFFF)",borderRadius:12,boxShadow:'0 1px 6px rgba(0,0,0,.08)',border:"none",borderBottom:i<Math.min(results.length,12)-1?`1px solid ${T.bd}`:"none",cursor:"pointer",textAlign:"left",color:"var(--cm-red,#FF3B30)",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10}}>
              <FoodIcon name={food.name} size={28} userId={user?.id} />
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{food.name}</div>
                <div style={{fontSize:11,color:T.mu,display:"flex",gap:10,flexWrap:"wrap"}}>
                  {food.brand&&<span>{food.brand} ·</span>}
                  <span>{food.calories} kcal</span>
                  <span style={{color:T.prot}}>P {food.protein}g</span>
                  <span style={{color:T.carb}}>C {food.carbs}g</span>
                  <span style={{color:T.fat}}>F {food.fat}g</span>
                  <span style={{color:"rgba(var(--cm-red-rgb,255,59,48),0.2)",marginLeft:"auto",fontSize:9,textTransform:"uppercase",letterSpacing:1}}>{food.source==="off"?"Open FF":"USDA"}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {query&&!searching&&results.length===0&&(
        <div style={{textAlign:"center",padding:"24px",background:"var(--cm-paper,#FFFFFF)",border:`1px dashed ${T.bd}`,borderRadius:12,marginBottom:16}}>
          <div style={{fontSize:13,color:T.mu,marginBottom:10}}>No results for "{query}"</div>
          <button onClick={()=>setShowCustomForm(true)} style={{background:"none",border:`1px solid ${T.prot}`,borderRadius:8,padding:"8px 16px",color:T.prot,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Create Custom Food</button>
        </div>
      )}
      {!query&&recentFoods.length>0&&(
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8,fontFamily:"'DM Mono',monospace"}}>Recent</div>
          <div style={{display:"flex",flexDirection:"column",gap:2}}>
            {recentFoods.slice(0,5).map((f,i)=>(
              <button key={i} onClick={()=>selectFood(f.food_data)} style={{padding:"10px 14px",background:"var(--cm-paper,#FFFFFF)",borderRadius:12,boxShadow:'0 1px 6px rgba(0,0,0,.08)',border:`1px solid ${T.bd}`,cursor:"pointer",textAlign:"left",color:"var(--cm-red,#FF3B30)",fontFamily:"inherit"}}>
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
              <button key={i} onClick={()=>selectFood(f.food_data)} style={{padding:"7px 13px",background:"var(--cm-paper,#FFFFFF)",borderRadius:12,boxShadow:'0 1px 6px rgba(0,0,0,.08)',border:`1px solid ${T.bd}`,cursor:"pointer",color:"var(--cm-red,#FF3B30)",fontSize:12,fontWeight:600,fontFamily:"inherit"}}>{f.food_name}</button>
            ))}
          </div>
        </div>
      )}
      {!query&&(
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8,fontFamily:"'DM Mono',monospace"}}>Quick Add</div>
          <div style={{display:"flex",gap:6,marginBottom:quickCategory?10:0}}>
            {[["protein","Protein",T.prot],["carbs","Carbs",T.carb],["fat","Fat",T.fat]].map(([k,l,c])=>(
              <button key={k} onClick={()=>setQuickCategory(quickCategory===k?null:k)} style={{flex:1,padding:"10px 4px",background:quickCategory===k?`${c}18`:"none",border:`1.5px solid ${quickCategory===k?c:T.bd}`,borderRadius:10,cursor:"pointer",color:quickCategory===k?c:T.mu,fontSize:12,fontWeight:700,fontFamily:"inherit"}}>{l}</button>
            ))}
          </div>
          {quickCategory&&(
            <div style={{display:"flex",flexDirection:"column",gap:2}}>
              {(QUICK_FOODS[quickCategory]||[]).map((food,i)=>(
                <button key={i} onClick={()=>addQuickFood(food)} style={{padding:"11px 14px",background:"var(--cm-paper,#FFFFFF)",borderRadius:12,boxShadow:'0 1px 6px rgba(0,0,0,.08)',border:`1px solid ${T.bd}`,cursor:"pointer",textAlign:"left",color:"var(--cm-red,#FF3B30)",fontFamily:"inherit",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
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
            <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>My Foods</div>
            <button onClick={()=>setShowCustomForm(true)} style={{display:"flex",alignItems:"center",gap:4,background:"none",border:`1px solid rgba(var(--cm-red-rgb,255,59,48),0.4)`,borderRadius:6,padding:"3px 10px",color:T.prot,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
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
            <div style={{textAlign:"center",padding:"32px 20px",background:"rgba(var(--cm-red-rgb,255,59,48),0.04)",border:"1px dashed rgba(var(--cm-red-rgb,255,59,48),0.2)",borderRadius:14}}>
              <svg width={36} height={36} viewBox="0 0 24 24" fill="none" style={{margin:"0 auto 10px",display:"block",opacity:.45}}>
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="rgba(var(--cm-ink-rgb,10,10,10),0.4)" strokeWidth={1.5} strokeLinecap="round"/>
                <rect x="9" y="3" width="6" height="4" rx="1" stroke="rgba(var(--cm-ink-rgb,10,10,10),0.4)" strokeWidth={1.5}/>
                <path d="M9 12h6M9 16h4" stroke={T.prot} strokeWidth={1.5} strokeLinecap="round"/>
              </svg>
              <div style={{fontSize:14,fontWeight:700,color:"var(--cm-red,#FF3B30)",marginBottom:4}}>No custom foods yet</div>
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
                  <button key={food.id||i} onClick={()=>selectFood(food)} style={{padding:"10px 14px",background:"var(--cm-paper,#FFFFFF)",borderRadius:12,boxShadow:'0 1px 6px rgba(0,0,0,.08)',border:`1px solid ${T.bd}`,cursor:"pointer",textAlign:"left",color:"var(--cm-red,#FF3B30)",fontFamily:"inherit",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
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
                <button onClick={()=>setMyFoodsExpanded(e=>!e)} style={{width:"100%",marginTop:6,padding:"8px",background:"none",border:"none",color:T.mu,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Mono',monospace",letterSpacing:"0.1em",textTransform:"uppercase"}}>
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
  {id:'balanced',    label:'Balanced',     badge:'POPULAR',  color:'var(--cm-red,#FF3B30)'},
  {id:'high-protein',label:'High Protein', badge:'POPULAR',  color:'var(--cm-red,#FF3B30)'},
  {id:'mediterranean',label:'Mediterranean',badge:'TRENDING',color:'#FEA020'},
  {id:'keto',        label:'Keto',         badge:'TRENDING', color:'#FEA020'},
  {id:'paleo',       label:'Paleo',        badge:null,       color:null},
  {id:'vegetarian',  label:'Vegetarian',   badge:null,       color:null},
  {id:'vegan',       label:'Vegan',        badge:null,       color:null},
  {id:'carnivore',   label:'Carnivore',    badge:'NEW',      color:'#22c55e'},
  {id:'low-carb',    label:'Low Carb',     badge:null,       color:null},
  {id:'pescatarian', label:'Pescatarian',  badge:null,       color:null},
];
const DIET_DESC={
  'balanced':'A bit of everything','high-protein':'Protein-forward meals','mediterranean':'Fish, olive oil & veg',
  'keto':'Very low carb, high fat','paleo':'Whole foods, no grains','vegetarian':'No meat or fish',
  'vegan':'Fully plant-based','carnivore':'Animal foods only','low-carb':'Reduced carbs','pescatarian':'Veggie + seafood',
};

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

// Diet expansion: a chosen diet pulls its compatible sub-diets so the pool
// includes all dishes the user can eat, not just the exact-tagged subset.
// 'balanced' is omitted — stays unfiltered (whole library).
const DIET_INCLUDES = {
  vegan:         ['vegan'],
  vegetarian:    ['vegetarian','vegan'],
  pescatarian:   ['pescatarian','vegetarian','vegan'],
  mediterranean: ['mediterranean'],
  keto:          ['keto'],
  paleo:         ['paleo'],
  'low-carb':    ['low-carb'],
  carnivore:     ['carnivore'],
};

// Format a scaled ingredient quantity for display: "200g", "1.5 cups", etc.
function fmtIngAmt(qty, unit) {
  if (!qty || !unit) return '';
  if (unit === 'g' || unit === 'ml') return `${Math.round(qty)}${unit}`;
  if (unit === 'whole') { const q=Math.round(qty*10)/10; return q===1?'1':String(q); }
  return `${Math.round(qty*10)/10} ${unit}`;
}

// ── Grocery aisle classification + quantity merging (no category data in recipes) ──────
const GROCERY_AISLE_ORDER = ['Produce','Meat & Seafood','Dairy & Eggs','Pantry','Frozen'];
// First match wins; Frozen is checked before everything so "frozen broccoli" → Frozen.
const _AISLE_RULES = [
  ['Frozen', /\bfrozen\b/],
  ['Meat & Seafood', /chicken|beef|steak|pork|turkey|lamb|bacon|sausage|\bham\b|mince|ground (beef|turkey|pork|chicken)|veal|bison|venison|shrimp|prawn|salmon|tuna|\bcod\b|halibut|tilapia|\bfish\b|sardine|mackerel|trout|crab|lobster|scallop|anchovy|\bduck\b|\bsole\b/],
  ['Dairy & Eggs', /\begg|milk|cheese|yogurt|yoghurt|cream|butter|cottage|kefir|ricotta|mozzarella|cheddar|parmesan|feta|\bghee\b/],
  ['Produce', /lettuce|spinach|kale|arugula|broccoli|cauliflower|tomato|onion|garlic|carrot|cucumber|bell pepper|pepper, ?bell|avocado|banana|apple|berr|strawber|blueber|raspber|orange|lemon|lime|grape|melon|mango|pineapple|zucchini|squash|mushroom|potato|asparagus|celery|cabbage|green bean|\bpea(s)?\b|\bcorn\b|beet|radish|cilantro|parsley|basil|\bmint\b|ginger|scallion|leek|eggplant|sprout|chard|romaine|spring onion|bok choy|\bherb/],
];
function aisleForIngredient(name){
  const n=(name||'').toLowerCase();
  for(const [aisle,re] of _AISLE_RULES){ if(re.test(n)) return aisle; }
  return 'Pantry';
}
// Parse a fmtIngAmt string ("200g" / "30ml" / "3" / "1.5 cups") back to {n,unit} — fallback
// for plans generated before fitterDayToShape carried numeric qty/unit.
function parseGroceryAmt(amount){
  if(amount==null) return {n:null,unit:null};
  const m=String(amount).trim().match(/^([\d.]+)\s*([a-zA-Z]*)/);
  if(!m) return {n:null,unit:null};
  return {n:parseFloat(m[1]), unit:(m[2]||'').toLowerCase()||null};
}
// Format a merged total for the shopping line: g→kg, ml→L at scale; whole/blank → bare count.
function fmtGroceryQty(qty, unit){
  if(qty==null||!isFinite(qty)||qty<=0) return '';
  const u=(unit||'').toLowerCase();
  if(u==='g')  return qty>=1000 ? `${(qty/1000).toFixed(qty%1000?1:0)} kg` : `${Math.round(qty)} g`;
  if(u==='ml') return qty>=1000 ? `${(qty/1000).toFixed(qty%1000?1:0)} L`  : `${Math.round(qty)} ml`;
  if(u==='whole'||!u){ const q=Math.round(qty*10)/10; return `${q}`; }
  return `${Math.round(qty*10)/10} ${unit}`;
}
// Clean weight/volume fallback for the shopping list (not raw "403 g").
function shopWeight(g, metric){
  if(g==null||!isFinite(g)||g<=0) return '';
  if(metric) return g>=1000 ? `${(g/1000).toFixed(g%1000?1:0)} kg` : `${Math.max(50,Math.round(g/50)*50)} g`;
  const lb=g/453.592;
  if(lb>=1){ const r=Math.round(lb*2)/2; return `${Number.isInteger(r)?r:r.toFixed(1)} lb`; }
  return `${Math.max(1,Math.round(g/28.35))} oz`;
}
// Translate a summed ingredient quantity → how you'd actually BUY it at a store.
// Countable→count/dozen/bunch, package items→bags/cans/cartons, weight→shopping weight (lb/kg).
// Returns null for pantry staples (salt/spices) so the line shows with no quantity.
function toShoppingQty(name, qty, unit, metric){
  const n=(name||'').toLowerCase();
  const g = unit==='g' ? qty : null;
  const ml = unit==='ml' ? qty : null;
  const whole = (unit==='whole'||unit==='slice'||!unit) ? qty : null;
  const pl=(c,s,p)=>{const k=Math.max(1,Math.round(c));return `${k} ${k>1?p:s}`;};
  if(/\bsalt\b|pepper, ground|black pepper|cumin|paprika|cinnamon|seasoning|oregano|\bbasil\b|thyme|chili powder|garlic powder|onion powder|turmeric|curry powder|nutmeg|cayenne|\bspice/.test(n)) return null; // staple
  if(/olive oil|sesame oil|coconut oil|avocado oil|vegetable oil|canola|\boil\b|soy sauce|fish sauce|vinegar|sriracha|hot sauce|worcestershire|lemon juice|lime juice|honey|maple|syrup|mustard|ketchup/.test(n)) return '1 bottle';
  if(/canned|coconut milk|tomato products|tomato paste|tomato sauce|\bbroth\b|\bstock\b|chickpea|kidney beans|black beans|\bbeans\b/.test(n)){ const b=g??ml; return pl(b!=null?b/400:1,'can','cans'); }
  if(/\begg/.test(n)){ const c=whole??(g!=null?g/50:3); return c>=12?pl(c/12,'dozen','dozen'):pl(c,'egg','eggs'); }
  if(/chicken breast|breast.*chicken/.test(n)&&g!=null) return pl(g/220,'breast','breasts');
  if(/salmon|\bcod\b|halibut|tilapia|trout|mahi|fillet/.test(n)&&g!=null) return pl(g/180,'fillet','fillets');
  if(/bacon/.test(n)) return '1 pack';
  if(/ground (beef|turkey|pork|chicken)|\bbeef\b|steak|sirloin|\bpork\b|\blamb\b|chicken|turkey|shrimp|prawn/.test(n)&&g!=null) return shopWeight(g,metric);
  if(/spinach|mixed greens|spring mix|arugula|\bkale\b|lettuce|salad greens|baby greens/.test(n)&&g!=null) return pl(g/140,'bag','bags');
  if(/\brice\b|quinoa|pasta|spaghetti|noodle|\boats?\b|oatmeal|flour|couscous|barley|lentil|farro/.test(n)) return '1 bag';
  if(/almond butter|peanut butter|nut butter|tahini/.test(n)) return '1 jar';
  if(/chia|flax|\bseeds\b|almond|walnut|cashew|pecan|peanut|\bnuts\b/.test(n)) return '1 bag';
  if(/cheese/.test(n)) return /feta|shredded|cottage|cream cheese|ricotta/.test(n)?'1 tub':'1 block';
  if(/\bmilk\b|heavy cream|half and half|buttermilk/.test(n)) return '1 carton';
  if(/yogurt|yoghurt|kefir/.test(n)) return '1 tub';
  if(/butter/.test(n)&&g!=null) return pl(g/113,'stick','sticks');
  if(/\bbread\b|toast|bagel|tortilla|\bbun/.test(n)) return '1 pack';
  if(/berr/.test(n)) return '1 pack';
  if(/garlic/.test(n)) return '1 head';
  if(/ginger/.test(n)) return '1 knob';
  if(/banana/.test(n)){ const c=whole??(g!=null?g/120:1); return c>=4?'1 bunch':pl(c,'banana','bananas'); }
  const COUNT_PRODUCE=[
    [/sweet potato/,130,'sweet potato','sweet potatoes'],[/\bpotato/,170,'potato','potatoes'],
    [/avocado/,150,'avocado','avocados'],[/onion/,110,'onion','onions'],[/\btomato/,120,'tomato','tomatoes'],
    [/cucumber/,200,'cucumber','cucumbers'],[/bell pepper|peppers, raw|bell peppers/,120,'bell pepper','bell peppers'],
    [/zucchini/,200,'zucchini','zucchini'],[/carrot/,60,'carrot','carrots'],[/\blemon/,60,'lemon','lemons'],
    [/\blime/,50,'lime','limes'],[/\bapple/,180,'apple','apples'],[/orange|tangerine/,130,'orange','oranges'],
  ];
  for(const [re,w,s,p] of COUNT_PRODUCE){ if(re.test(n)){ const c=whole??(g!=null?g/w:null); if(c!=null) return pl(c,s,p); } }
  if(g!=null) return shopWeight(g,metric);
  if(ml!=null) return metric?(ml>=1000?`${(ml/1000).toFixed(1)} L`:`${Math.max(10,Math.round(ml/10)*10)} ml`):(ml>=950?pl(ml/950,'qt','qt'):`${Math.max(10,Math.round(ml/10)*10)} ml`);
  if(whole!=null) return `${Math.max(1,Math.round(whole))}`;
  return '';
}

// Load eligible recipe pool from Supabase (pre-filtered; fitter re-checks allergens).
async function loadMealPool(diet, allergenTags) {
  const COLS = 'id,name,meal_slot,diet_tags,allergen_tags,primary_diet,calories_per_serving,protein_per_serving,carbs_per_serving,fat_per_serving,servings_count,ingredients,instructions,recipe_kind,use_count,last_used';
  const allergenGate = (q) => allergenTags.length > 0 ? q.not('allergen_tags', 'ov', `{${allergenTags.join(',')}}`) : q;
  let q = sb.from('recipes').select(COLS).is('user_id', null);
  if (diet && diet !== 'balanced') {
    const allowed = DIET_INCLUDES[diet] || [diet];
    q = q.overlaps('diet_tags', allowed);
  }
  q = allergenGate(q);
  const { data, error } = await q;
  if (error) throw new Error(`Recipe pool load failed: ${error.message}`);
  let pool = data || [];
  // Mediterranean has no genuine snack recipes (diet-tag quality pass) → add pescatarian/vegetarian
  // SNACK recipes so snack slots can fill; meetsDiet gates these to the snack slot only.
  if (diet === 'mediterranean') {
    const { data: snacks } = await allergenGate(
      sb.from('recipes').select(COLS).is('user_id', null).eq('meal_slot', 'snack').overlaps('diet_tags', ['pescatarian', 'vegetarian'])
    );
    const seen = new Set(pool.map(r => r.id));
    pool = [...pool, ...(snacks || []).filter(r => !seen.has(r.id))];
  }
  return pool;
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
        qty:    Math.round((ing.qty || 0) * servings * 10) / 10, // numeric scaled qty for grocery merging
        unit:   ing.unit || null,
      })),
      instructions: recipe.instructions || null,   // authored cooking guide (jsonb) or null
      recipe_kind: recipe.recipe_kind || null,
      dietTags: recipe.diet_tags || [],
      allergenTags: recipe.allergen_tags || [],
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
  // Reusable Home/Kitchen toggle — TRUE stadium pill on the red canvas: fully-rounded (999)
  // translucent track, active segment = solid white pill (999), inactive = muted-white text.
  const _fuelToggle=(
    <div style={{display:"flex",justifyContent:"center",padding:"4px 0 8px"}}>
      <div style={{display:"inline-flex",gap:4,background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.22)",borderRadius:999,padding:4}}>
        {FUEL_TABS.map(tab=>{const sel=fuelScreen===tab.id;return(
          <button key={tab.id} onClick={()=>setFuelScreen(tab.id)}
            style={{borderRadius:999,border:"none",cursor:"pointer",fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:13,letterSpacing:"0.04em",textTransform:"uppercase",padding:"9px 26px",whiteSpace:"nowrap",transition:"all .15s",WebkitTapHighlightColor:"transparent",
              background:sel?"#FFFFFF":"transparent",color:sel?"var(--cm-red,#FF3B30)":"rgba(255,255,255,0.7)"}}>
            {tab.label}
          </button>
        );})}
      </div>
    </div>
  );
  const pad2=n=>String(Math.max(0,Math.floor(n))).padStart(2,"0");
  const mno={fontFamily:"'DM Mono',monospace"};
  const [macrosOn,setMacrosOn]=useState(false); // food-log meal bars: calorie ⇄ P/C/F-segmented (session-only)
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
    if(openQuickLog)setFuelScreen("log");
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
    const logTotal=log.reduce((s,e)=>s+(e.calories||0),0);
    const targets=getSlotTargets(macros.calories,mealSlots,skippedSlots||[],lSlots,logTotal);
    const target=targets[slotNum];
    if(!target||target===0)return;
    const slotCals=log.filter(e=>getEntrySlot(e)===slotNum).reduce((sum,e)=>sum+(e.calories||0),0);
    const overage=calculateOverage(target,slotCals,profile.goal);
    if(overage<=0)return;
    const newOverages={...(slotOverages||{}),[String(slotNum)]:overage};
    // Modal diff: show targets before slot N was logged vs now (for "your remaining meals adjusted" copy)
    const prevLogTotal=logTotal-slotCals;
    const prevLSlots=log.filter(e=>getEntrySlot(e)!==slotNum).length===0?lSlots.filter(s=>s!==slotNum):lSlots.filter(s=>s!==slotNum);
    const newTargets=targets;
    const oldTargets=getSlotTargets(macros.calories,mealSlots,skippedSlots||[],prevLSlots,prevLogTotal);
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
  const [restaurantStandalone,setRestaurantStandalone]=useState(false);
  const [raBestExpanded,setRaBestExpanded]=useState(false);   // best-order "how to order + sodium" toggle
  const [raBackupOpen,setRaBackupOpen]=useState(null);        // index of expanded ALSO GOOD card
  const [raLoadMsg,setRaLoadMsg]=useState(0);                 // #4: index into the shuffled loader order
  const raLoadOrder=useRef(RA_LOAD_MSGS.map((_,i)=>i));       // shuffled display order (per generation)
  const menuScanRef=useRef(null);

  // #4: cycle funky food-themed loader copy in a fresh random order each generation (feel, not speed).
  useEffect(()=>{
    if(!raLoading){setRaLoadMsg(0);return;}
    const order=RA_LOAD_MSGS.map((_,i)=>i);                   // Fisher-Yates shuffle → different every time
    for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    raLoadOrder.current=order;
    setRaLoadMsg(0);
    const id=setInterval(()=>setRaLoadMsg(m=>m+1),1700);
    return ()=>clearInterval(id);
  },[raLoading]);

  function openRestaurantAI(){
    const slot=mealSlots[activeSlotIdx]||1;
    const lSlots=getLoggedSlots(log);
    const calTargets=getSlotTargets(macros.calories,mealSlots,skippedSlots||[],lSlots,log.reduce((s,e)=>s+(e.calories||0),0));
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
    if(raStep==='picker'){setRestaurantAI(null);setLogMode(null);setRestaurantStandalone(false);}
    else if(raStep==='nearme'){setRaStep('picker');}
    else if(raStep==='result'){setRaStep(raPrevStep);}
  }

  async function fetchRaNearby(){
    if(!raNearbyCity.trim()||raNearbyLoading)return;
    setRaNearbyError('');
    // Lever 4: serve from the city cache instantly (no geocode/places round-trips).
    const cityKey=raNearbyCity.trim().toLowerCase();
    if(_raPlacesCache.has(cityKey)){
      const places=_raPlacesCache.get(cityKey);
      setRaNearby(places);
      if(places.length===0)setRaNearbyError('No restaurants found nearby. Try a different city.');
      return;
    }
    setRaNearbyLoading(true);
    try{
      const coords=await geocodeCity(raNearbyCity.trim());
      if(!coords){setRaNearbyError('City not found. Try a different search.');setRaNearbyLoading(false);return;}
      const places=await getNearbyRestaurants(coords.lat,coords.lng);
      _raPlacesCache.set(cityKey,places);
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
    setRaError('');
    setRaBestExpanded(false);setRaBackupOpen(null);
    setRaPrevStep('nearme');
    setRaStep('result');
    // Lever 4: instant re-tap — cache recs by restaurant + the exact meal targets.
    const recKey=`${r.name}|${restaurantAI.calTarget}|${restaurantAI.proteinTarget}|${restaurantAI.carbTarget}|${restaurantAI.fatTarget}`;
    if(_raRecCache.has(recKey)){
      setRaResult(_raRecCache.get(recKey));
      setRaLoading(false);
      return;
    }
    setRaResult(null);
    setRaLoading(true);
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
      _raRecCache.set(recKey,result);
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
    setRaBestExpanded(false);setRaBackupOpen(null);
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
    // #2: on-target = green (green tint + green number); off-target = NEUTRAL dark ink on light grey.
    // No red, no amber. Same green/neutral language as the top bar.
    const NEUTRAL={bg:'rgba(var(--cm-ink-rgb,10,10,10),0.05)',color:'var(--cm-ink)'};
    if(!target)return NEUTRAL;
    const pct=value/target;
    const onTarget=isProtein?pct>=0.8:pct<=1.0;   // protein: hit ≥80%; others: not over target
    return onTarget?{bg:'rgba(34,197,94,0.12)',color:'#16a34a'}:NEUTRAL;
  }

  // ── Tab re-activation reset ──────────────────────────────────────────────────
  useEffect(()=>{
    if(!resetSignal)return;
    setRestaurantAI(null);
    setRestaurantStandalone(false);
    setShowRecipeBuilder(false);
  },[resetSignal]);

  // ── Day Type Nutrition ────────────────────────────────────────────────────────
  const [showNutritionReasoning,setShowNutritionReasoning]=useState(false);
  const WDAYS_ORDER=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const todayIdx=WDAYS_ORDER.indexOf(todayKey);
  const yesterdayKey=WDAYS_ORDER[(todayIdx+6)%7];
  const todayWeekEntry=weekMacros?.find(d=>d.day===todayKey);
  // Per-day run mileage for the WHOLE week (run engine), keyed by day abbrev — for session labels.
  const _runMiByDay=useMemo(()=>{
    try{const w=getRunWeek(profile,wPrefs,schedule,1);const m={};(w?.sessions||[]).forEach(s=>{m[s.day]=s.distanceMi;});return m;}
    catch{return {};}
  },[profile,wPrefs,schedule]);
  const _runMi=day=>{const mi=_runMiByDay[day];return(mi!=null&&mi>0)?Math.round(mi*10)/10:null;}; // matches run-card rounding (1 decimal, drops .0)
  // Hybrid lift-day split name. dayPlan[day].cycleLabel wins; else derive by lift-day ordinal
  // from HEAVY_LOWER_CYCLES[HYBRID_TEMPLATE_CYCLES[template]] — mirrors TrainSection (NativeApp.jsx).
  const _hybridLiftLabel=(day)=>{
    const dp=wPrefs?.dayPlan; if(!dp) return null;
    const cl=dp[day]?.cycleLabel; if(cl) return cl;
    const cyc=HEAVY_LOWER_CYCLES[HYBRID_TEMPLATE_CYCLES[wPrefs?.hybridTemplate]];
    if(!cyc) return null;
    const liftDays=WDAYS_ORDER.filter(d=>dp[d]?.lift); const k=liftDays.indexOf(day);
    return k>=0?cyc[k%cyc.length]:null;
  };
  // Real per-day session label. For HYBRID the schedule stores 'training' for BOTH run and lift days
  // (and dayFocus is often null) — the real modality + split live in wPrefs.dayPlan[day], so consult
  // it first; otherwise fall back to schedule sessionType + dayFocus (split programs).
  const _sessFull=(day,st)=>{
    const dp=wPrefs?.dayPlan?.[day];
    if(dp?.run){const r=_runMi(day);return r!=null?`${r} Mile Run`:'Run';}
    if(dp?.lift){const cl=_hybridLiftLabel(day);return cl?(/day$/i.test(cl)?cl:`${cl} Day`):'Strength';}
    if(!st||st==='rest')return 'Rest';
    if(st==='run'||st==='cardio'){const r=_runMi(day);return r!=null?`${r} Mile Run`:'Run';}
    const f=wPrefs?.dayFocus?.[day];
    if(f&&f!=='training')return /day$/i.test(f)?f:`${f} Day`;
    return 'Training';
  };
  // Compact variant for the tight setup-form day chips.
  const _sessShort=(day,st)=>{
    const dp=wPrefs?.dayPlan?.[day];
    if(dp?.run){const r=_runMi(day);return r!=null?`${r} MI`:'RUN';}
    if(dp?.lift){const cl=_hybridLiftLabel(day);return cl?cl.toUpperCase():'LIFT';}
    if(!st||st==='rest')return 'REST';
    if(st==='run'||st==='cardio'){const r=_runMi(day);return r!=null?`${r} MI`:'RUN';}
    const f=wPrefs?.dayFocus?.[day];
    if(f&&f!=='training')return f.toUpperCase();
    return 'TRAIN';
  };
  // Signature of the TRAINING inputs a meal-prep plan was built from. If the live
  // signature differs from the one stamped on the plan, the plan is stale (catches
  // program switch, schedule/day-focus edits, mesocycle/phase change, meals-per-day).
  const _trainingSig=()=>{
    try{
      const sched=JSON.stringify(schedule||{});
      const focus=JSON.stringify(wPrefs?.dayFocus||{});
      const meals=mealPrepPrefs?.mealsPerDay||0;
      const prog=[wPrefs?.splitType,wPrefs?.runPlan,wPrefs?.hyroxProgram,wPrefs?.hybridTemplate,profile?._libraryId,wPrefs?._libraryId].filter(Boolean).join("|");
      // weekMacros per-day targets fold in mesocycle/phase shifts (calories+carbs change with the block).
      const targets=(weekMacros||[]).map(d=>`${d.day}:${Math.round(d.calories||0)}/${Math.round(d.carbs||0)}`).join(",");
      return `${sched}#${focus}#${meals}#${prog}#${targets}`;
    }catch{return "";}
  };
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
  // ── Hero hold-to-reveal macro fill ───────────────────────────────────────────
  // _calActive (state) = show CONSUMED + glyph-fill (held OR locked); the only
  // per-interaction re-render. Per-frame values live in refs written straight to
  // the node's background (no React churn). _calLockedRef = double-tap lock.
  const [_calActive,_setCalActive]=useState(false);
  const _calNumRef=useRef(null);   // plain-text number node (glyph-clip target)
  const _calFillRef=useRef(0);     // current revealed fraction (0.._calPct)
  const _calRafRef=useRef(0);      // fill/drain rAF id
  const _calShimRef=useRef(0);     // shimmer rAF id
  const _calShimPh=useRef(0);      // shimmer phase
  const _calLastUp=useRef(0);      // last pointer-up ts (double-tap detect)
  const _calLockedRef=useRef(false);
  const _calTick=useRef(-1);       // last macro boundary crossed (haptic de-dupe)
  useEffect(()=>()=>{cancelAnimationFrame(_calRafRef.current);cancelAnimationFrame(_calShimRef.current);},[]);
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
    const freq=Math.min(6,Math.max(2,parseInt(String(profile?.mealFreq||wPrefs?.mealFreq))||3));
    const CHIP_MAP={'dairy':'No Dairy','gluten':'No Gluten','nuts':'No Nuts','halal':'No Pork'};
    const DIET_MAP={'vegan':'vegan','vegetarian':'vegetarian'};
    const stored=(profile?.dietary||[]).filter(d=>d&&d!=='none');
    const profileDietPreset=stored.reduce((a,v)=>a||(DIET_MAP[v]||null),null);
    const dietPreset=wPrefs?.mealPrepDiet||(profileDietPreset||'balanced');
    const dietaryPrefs=stored.filter(v=>!DIET_MAP[v]).map(v=>CHIP_MAP[v]).filter(Boolean);
    return{mealsPerDay:freq,prepTime:'1hr',dietaryPrefs,dietPreset,selectedDays:['Mon','Tue','Wed','Thu','Fri','Sat','Sun']};
  });
  const [mealPrepWarning,setMealPrepWarning]=useState(null);
  const [dietExpanded,setDietExpanded]=useState(false); // setup: show all 10 diet styles vs the 2 popular
  const [activeMealDetail,setActiveMealDetail]=useState(null); // {day, meal, dayIndex, mealIndex}
  const [detailFrom,setDetailFrom]=useState('plan'); // where the meal detail was opened from → where Close returns
  const [mealIngChecked,setMealIngChecked]=useState(new Set()); // per-open ingredient check-off (reset on open)
  const closeMealDetail=()=>{setActiveMealDetail(null);if(detailFrom==='kitchen')setFuelScreen('kitchen');};
  const [showGroceryList,setShowGroceryList]=useState(false);
  const [groceryFrom,setGroceryFrom]=useState('plan'); // where grocery was opened from → where the X returns
  const closeGrocery=()=>{setShowGroceryList(false);if(groceryFrom==='kitchen')setFuelScreen('kitchen');};
  const [checkedGroceryItems,setCheckedGroceryItems]=useState(()=>{try{const s=localStorage.getItem('mp_checked');return s?new Set(JSON.parse(s)):new Set();}catch{return new Set();}});
  // Grocery check-off, keyed by plan (resets on regenerate via plan generatedAt key): {planKey:[itemKeys]}
  const [groceryGathered,setGroceryGathered]=useState(()=>{try{const s=localStorage.getItem('cm_grocery_gathered_v1');return s?JSON.parse(s):{};}catch{return {};}});
  const [groceryCollapsed,setGroceryCollapsed]=useState({}); // aisle → collapsed bool (session-only)
  const [regeneratingMeal,setRegeneratingMeal]=useState(null);
  const [regeneratingDay,setRegeneratingDay]=useState(null);
  const [swappingSlot,setSwappingSlot]=useState(null); // slot number being re-fitted for planned card
  const [dismissedPlanned,setDismissedPlanned]=useState(()=>{
    try{const t=new Date().toISOString().split('T')[0];const s=localStorage.getItem(`cm_dismissed_planned_${t}`);return s?JSON.parse(s):[];}catch{return [];}
  });
  const [mealPrepError,setMealPrepError]=useState(null);
  const [mpSaveConfirm,setMpSaveConfirm]=useState(false);
  const [mpStatusIdx,setMpStatusIdx]=useState(0);
  const MP_STATUSES=['Loading your recipe library...','Matching macros to your targets...','Selecting meals for each day...','Almost done...'];
  useEffect(()=>{try{localStorage.setItem('mp_checked',JSON.stringify([...checkedGroceryItems]));}catch{}},[checkedGroceryItems]);
  useEffect(()=>{try{localStorage.setItem('cm_grocery_gathered_v1',JSON.stringify(groceryGathered));}catch{}},[groceryGathered]);
  // Persist new-flow plan across app sessions
  useEffect(()=>{try{if(mealPrepPlan)localStorage.setItem('cm_mp_plan_v2',JSON.stringify(mealPrepPlan));else localStorage.removeItem('cm_mp_plan_v2');}catch{}},[mealPrepPlan]);
  useEffect(()=>{if(fuelScreen!=='mealprep'){setMealPrepScreen('setup');setShowGroceryList(false);setMpSaveConfirm(false);setMealPrepError(null);setMealPrepWarning(null);}},[fuelScreen]);
  useEffect(()=>{if(mealPrepScreen!=='generating')return;setMpStatusIdx(0);const id=setInterval(()=>setMpStatusIdx(i=>(i+1)%MP_STATUSES.length),2000);return()=>clearInterval(id);},[mealPrepScreen]);
  const [showRegenerateBanner,setShowRegenerateBanner]=useState(()=>localStorage.getItem('__mp_regen_needed')==='1');
  useEffect(()=>{if(mealPrepPlan?.days?.length>0){localStorage.setItem('__mp_exists','1');}else{localStorage.removeItem('__mp_exists');}},[mealPrepPlan]);
  useEffect(()=>{function onClear(){setMealPrepPlan(null);setShowRegenerateBanner(true);localStorage.setItem('__mp_regen_needed','1');localStorage.removeItem('__mp_exists');}window.addEventListener('cm_clear_meal_prep',onClear);return()=>window.removeEventListener('cm_clear_meal_prep',onClear);},[]);
  // P0 — training-signature staleness. If the live training inputs no longer match the
  // signature stamped on the plan, flag it stale. One mechanism for ALL cases: schedule/
  // day-focus edits, mesocycle/phase shifts (folded into weekMacros), AND meals-per-day
  // changes — not just the program switch the cm_clear_meal_prep event covers. Unlike that
  // event we DON'T null the plan: keep it viewable and let the user regenerate or dismiss.
  useEffect(()=>{
    if(mealPrepPlan&&mealPrepPlan.trainingSig&&mealPrepPlan.trainingSig!==_trainingSig())setShowRegenerateBanner(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[mealPrepPlan,schedule,wPrefs,mealPrepPrefs?.mealsPerDay,weekMacros]);

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
      // P0 — BUILD FORWARD FROM TODAY. Was a fixed Mon–Sun template regardless of
      // generate day (the "Wednesday problem": past weekdays shown as "to prep").
      // Now: a rolling 7-day window starting today, intersected with the user's
      // chosen prep days, preserving forward (today-first) order. Each day still
      // resolves its real weekday session/target via schedule[day]/weekMacros[day]
      // (the schedule repeats weekly). NOTE: days that wrap past Sunday are next
      // week's same weekday; per-DATE mesocycle/phase lookahead is not yet applied
      // (weekMacros is the current block) — tracked for the periodization pass.
      const _fwd=Array.from({length:7},(_,i)=>WDAYS_ORDER[((todayIdx<0?0:todayIdx)+i)%7]);
      const _chosen=mealPrepPrefs.selectedDays||[];
      const selFwd=_fwd.filter(d=>_chosen.includes(d));
      const sel=selFwd.length?selFwd:_fwd;
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
      // P0/P1 — stamp the training signature (staleness) + generatedAt (freshness).
      const plan={days,groceryList:null,trainingSig:_trainingSig(),generatedAt:new Date().toISOString()};

      setMealPrepPlan(plan);
      setMealPrepScreen('plan');
      // Fresh plan — clear today's dismissed suggestions so nothing stays hidden
      setDismissedPlanned([]);
      try{localStorage.removeItem(`cm_dismissed_planned_${today}`);}catch{}

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

  // ── Planned-card part-B actions ──────────────────────────────────────────────

  // Restaurant AI → log: same lock-gate check as handleConfirmPlanned, same logEntry path.
  function handleAddRestaurantDish(b){
    const slot=restaurantAI.slot;
    const entry={
      food:b.item,
      calories:b.estimated_macros?.calories||0,
      protein:b.estimated_macros?.protein_g||0,
      carbs:b.estimated_macros?.carbs_g||0,
      fat:b.estimated_macros?.fat_g||0,
      slot,
      method:'restaurant',
    };
    const slotToLock=mealSlots.find(s=>s<slot&&log.some(e=>getEntrySlot(e)===s)&&!(lockedSlots||[]).includes(s));
    setRestaurantAI(null);
    setRestaurantStandalone(false);
    if(slotToLock){
      setLockGate({slotToLock,pendingIdx:mealSlots.indexOf(slot)>=0?mealSlots.indexOf(slot):0,pendingEntry:entry});
    }else{
      logEntry(entry);
    }
  }

  // CONFIRM: build entry from planned meal, run same lock-gate check as + button,
  // then call the existing logEntry — does NOT fork the write path.
  function handleConfirmPlanned(meal,slot){
    const entry={food:meal.name,calories:meal.calories,protein:meal.protein,carbs:meal.carbs,fat:meal.fat,slot,method:'mealprep'};
    const pendingIdx=mealSlots.indexOf(slot)>=0?mealSlots.indexOf(slot):0;
    const slotToLock=mealSlots.find(s=>s<slot&&log.some(e=>getEntrySlot(e)===s)&&!(lockedSlots||[]).includes(s));
    if(slotToLock){
      // Attach pendingEntry to lockGate so the modal's YES/NOT YET handlers log it
      setLockGate({slotToLock,pendingIdx,pendingEntry:entry});
    }else{
      logEntry(entry);
    }
  }

  // SWAP: re-fit just this slot with a new seed, same diet/allergens/pool,
  // excluding the current recipe. Updates mealPrepPlan state (→ localStorage).
  // Never logs anything.
  async function handleSwapPlanned(slot,currentRecipeId){
    if(!mealPrepPlan)return;
    const dayIdx=mealPrepPlan.days.findIndex(d=>d.day.slice(0,3)===todayKey);
    if(dayIdx<0)return;
    // Positional lookup: numeric slot 1/2/3 → ordered meal at index slot-1
    const ordered=orderPlanMeals(mealPrepPlan.days[dayIdx].meals);
    const targetMeal=ordered[slot-1];
    if(!targetMeal)return;
    const mealIdx=mealPrepPlan.days[dayIdx].meals.indexOf(targetMeal);
    if(mealIdx<0)return;
    setSwappingSlot(slot);
    try{
      const diet=mealPrepPrefs.dietPreset||'balanced';
      const allergenTags=(mealPrepPrefs.dietaryPrefs||[]).map(c=>ALLERGEN_CHIP_TO_TAG[c]).filter(Boolean);
      const dayEntry=weekMacros?.find(d=>d.day===mealPrepPlan.days[dayIdx].day.slice(0,3));
      const dayTarget=dayEntry
        ?{cal:dayEntry.calories,pro:dayEntry.protein,carb:dayEntry.carbs,fat:dayEntry.fat}
        :{cal:macros?.calories||2000,pro:macros?.protein||150,carb:macros?.carbs||200,fat:macros?.fat||70};
      const pool=await loadMealPool(diet,allergenTags);
      const swapPool=currentRecipeId?pool.filter(r=>r.id!==currentRecipeId):pool;
      const mealCount=mealPrepPlan.days[dayIdx].meals.length;
      const result=fitDay({dayTarget,mealCount,diet,allergens:allergenTags,pool:swapPool,seed:Date.now()%100000});
      // Positional pick from result: same index as the slot being replaced
      const replacement=orderPlanMeals(result.meals)[slot-1];
      if(replacement&&!replacement.unfillable){
        const{recipe,servings,scaledMacros}=replacement;
        const newMeal={
          name:recipe.name,
          calories:Math.round(scaledMacros.cal),protein:Math.round(scaledMacros.pro*10)/10,
          carbs:Math.round(scaledMacros.carb*10)/10,fat:Math.round(scaledMacros.fat*10)/10,
          ingredients:(recipe.ingredients||[]).map(ing=>({item:ing.item,amount:fmtIngAmt((ing.qty||0)*servings,ing.unit)})),
          instructions:recipe.instructions||null,slot:targetMeal.slot,servings,_recipeId:recipe.id,unfillable:false,
        };
        setMealPrepPlan(prev=>{const u=JSON.parse(JSON.stringify(prev));u.days[dayIdx].meals[mealIdx]=newMeal;return u;});
      }
    }catch(e){console.error('[handleSwapPlanned]',e);}
    setSwappingSlot(null);
  }

  // DISMISS: hides this suggestion for today without touching skippedSlots or budget.
  // Keyed by recipe id (falling back to name) and persisted per-day in localStorage.
  function handleDismissPlanned(key){
    if(key==null)return;
    setDismissedPlanned(prev=>{
      const next=prev.includes(key)?prev:[...prev,key];
      try{localStorage.setItem(`cm_dismissed_planned_${today}`,JSON.stringify(next));}catch{}
      return next;
    });
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
  const lpFiredRef=useRef(false); // true once a long-press opened the context menu → suppress the tap
  const [foodDetail,setFoodDetail]=useState(null); // {item, slot} tapped logged entry → nutrition detail
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

  function handleLogTemplate(template){
    (template.entries||[]).forEach((e,i)=>{
      setTimeout(()=>logEntryWithUndo({...e,id:Date.now()+i,slot:mealSlots[activeSlotIdx]||1}),i*10);
    });
    incrementTemplateUse(template.id).catch(()=>{});
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

  // MY FOODS mode — persistent recent food history from the database
  const [myFoodsHistory,setMyFoodsHistory]=useState([]);
  useEffect(()=>{
    if(logMode==="myfoods"&&user){
      getRecentFoods(user.id).then(d=>setMyFoodsHistory(d||[]));
    }
  },[logMode,user]);

  const today=new Date().toISOString().split("T")[0];

  return (
    <div className={GOCLUB_REDESIGN?"goclub tab-fuel":"page-enter"} style={{paddingBottom:isMobile?20:0}}>
      {GOCLUB_REDESIGN&&<style>{_FUEL_GOCLUB_CSS}</style>}
      {/* ── PAGE HEADER ── */}
      <div className="screen-header" style={{paddingTop:12}}>
        <div style={{flex:1,minWidth:0}}>
          {GOCLUB_REDESIGN?(()=>{
            const _ec=n=>n>=80?'#22C55E':n>=50?'#F59E0B':'var(--cm-red,#FF3B30)';
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
              <><span style={{color:'rgba(255,255,255,0.4)'}}>PROTEIN</span><span style={{color:'rgba(255,255,255,0.18)',margin:'0 5px'}}>|</span><span style={{color:_ec(_protPct)}}>{_protPct}% hit</span>{_protDelta!=null&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:_protDelta>=0?'#22C55E':'var(--cm-red,#FF3B30)',marginLeft:6,letterSpacing:'0.06em'}}>{_protDelta>=0?'+':''}{_protDelta}% vs yest.</span>}</>,
              <><span style={{color:'rgba(255,255,255,0.4)'}}>CALORIES</span><span style={{color:'rgba(255,255,255,0.18)',margin:'0 5px'}}>|</span><span style={{color:_ec(_calRemPct)}}>{_calRemPct}% remaining</span>{_calDelta2!=null&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:_calDelta2>=0?'#22C55E':'var(--cm-red,#FF3B30)',marginLeft:6,letterSpacing:'0.06em'}}>{_calDelta2>=0?'+':''}{_calDelta2}% vs yest.</span>}</>,
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
              <div style={{width:44,height:44,borderRadius:13,background:"rgba(var(--cm-red-rgb,255,59,48),0.12)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.28)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
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
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--red)",fontWeight:700,letterSpacing:"0.1em"}}>{macros.calories.toLocaleString()} kcal</div>
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
                const _calRem=Math.max(0,remaining.calories);
                const _calOver=remaining.calories<0;
                const _calPct=macros.calories>0?Math.min(1,consumed.calories/macros.calories):0;
                const _cnd={fontFamily:"'Archivo',sans-serif",fontStyle:'normal',fontWeight:800};
                // ── hold-to-reveal macro fill — calorie-equiv shares → fixed stacked bands ──
                const _pK=consumed.protein*4,_cK=consumed.carbs*4,_fK=consumed.fat*9,_sumK=_pK+_cK+_fK;
                const _pS=_sumK>0?_pK/_sumK:0,_cS=_sumK>0?_cK/_sumK:0;
                const _b1=_pS*_calPct,_b2=(_pS+_cS)*_calPct; // protein top, carbs top (fat → _calPct)
                const _FILL_RED='var(--cm-red,#FF3B30)',_FILL_BLUE='#60a5fa',_FILL_ORANGE='#FEA020',_FILL_EMPTY='rgba(255,255,255,0.30)'; // empty glyph tint → white-on-red (bands unchanged)
                const _calGrad=(cur)=>{
                  const pc=v=>(Math.max(0,Math.min(1,v))*100).toFixed(2)+'%',st=[];
                  const band=(lo,hi,col)=>{if(cur>lo){st.push(col+' '+pc(lo),col+' '+pc(Math.min(hi,cur)));}};
                  band(0,_b1,_FILL_RED);band(_b1,_b2,_FILL_BLUE);band(_b2,_calPct,_FILL_ORANGE);
                  st.push(_FILL_EMPTY+' '+pc(cur),_FILL_EMPTY+' 100%');
                  return 'linear-gradient(to top,'+st.join(',')+')';
                };
                const _calApply=(cur,shim)=>{
                  const n=_calNumRef.current;if(!n)return;
                  if(shim){const x=_calShimPh.current,a=(x*150-50),b=(x*150-32),c=(x*150-14);
                    n.style.background='linear-gradient(100deg,transparent '+a.toFixed(1)+'%,rgba(255,255,255,0.7) '+b.toFixed(1)+'%,transparent '+c.toFixed(1)+'%),'+_calGrad(cur);
                  }else{n.style.background=_calGrad(cur);}
                };
                const _calTickFor=cur=>cur>=_b2?2:cur>=_b1?1:0;
                const _calShimStop=()=>{cancelAnimationFrame(_calShimRef.current);_calShimRef.current=0;};
                const _calShimStart=()=>{_calShimStop();if(_fuelEyeRedMo)return;
                  const loop=()=>{_calShimPh.current=(_calShimPh.current+0.012)%1;_calApply(_calFillRef.current,true);_calShimRef.current=requestAnimationFrame(loop);};
                  _calShimRef.current=requestAnimationFrame(loop);};
                const _calStartFill=()=>{
                  cancelAnimationFrame(_calRafRef.current);_calShimStop();
                  const from=_calFillRef.current,to=_calPct;
                  if(_fuelEyeRedMo){_calFillRef.current=to;_calApply(to,false);_calShimStart();return;}
                  const dur=Math.max(180,Math.abs(to-from)*900),t0=performance.now();_calTick.current=_calTickFor(from);
                  const step=(now)=>{const p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,3),cur=from+(to-from)*e;
                    _calFillRef.current=cur;const idx=_calTickFor(cur);if(idx>_calTick.current){_hL();_calTick.current=idx;}
                    _calApply(cur,false);
                    if(p<1)_calRafRef.current=requestAnimationFrame(step);else{_calFillRef.current=to;_calApply(to,false);_calShimStart();}};
                  _calRafRef.current=requestAnimationFrame(step);};
                const _calDrain=()=>{
                  cancelAnimationFrame(_calRafRef.current);_calShimStop();
                  const from=_calFillRef.current;
                  if(_fuelEyeRedMo||from<=0){_calFillRef.current=0;_setCalActive(false);return;}
                  const dur=Math.max(150,from*550),t0=performance.now();
                  const step=(now)=>{const p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,3),cur=from*(1-e);
                    _calFillRef.current=cur;_calApply(cur,false);
                    if(p<1)_calRafRef.current=requestAnimationFrame(step);else{_calFillRef.current=0;_setCalActive(false);}};
                  _calRafRef.current=requestAnimationFrame(step);};
                const _calDown=()=>{if(_calLockedRef.current)return;_setCalActive(true);_calStartFill();};
                const _calUp=()=>{const now=Date.now(),dbl=(now-_calLastUp.current)<300;_calLastUp.current=now;
                  if(dbl){if(_calLockedRef.current){_calLockedRef.current=false;_calDrain();}else{_calLockedRef.current=true;_hM();_setCalActive(true);_calStartFill();}return;}
                  if(_calLockedRef.current)return;_calDrain();};
                const _calLeave=()=>{if(_calLockedRef.current)return;_calDrain();};
                return(
                  <motion.div key="hero-ring"
                    initial={{opacity:0,scale:0.96}}
                    animate={{opacity:1,scale:1,transition:_fuelEyeRedMo?{duration:0}:{duration:0.22,ease:'easeOut'}}}
                    exit={{opacity:0,scale:0.96,transition:_fuelEyeRedMo?{duration:0}:{duration:0.25,ease:'easeIn'}}}
                    style={{padding:"0 18px 8px"}}
                  >
                    {/* SOLO hero number on the red canvas (no white card, no ring) */}
                    <div style={{touchAction:'none',userSelect:'none',WebkitUserSelect:'none',cursor:'pointer',minHeight:96,display:'flex',flexDirection:'column',justifyContent:'center'}}
                      onPointerDown={_calDown} onPointerUp={_calUp} onPointerLeave={_calLeave} onPointerCancel={_calLeave}>
                      {/* STATE LABEL — ABOVE the number; flips with the hold */}
                      <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(255,255,255,0.85)',marginBottom:6,display:'flex',alignItems:'center',gap:6,pointerEvents:'none'}}>
                        <span>{_calActive?'CONSUMED':(_calOver?'OVER':'REMAINING')}</span>
                        {_calActive&&_calLockedRef.current&&<span style={{width:5,height:5,borderRadius:'50%',background:'#FFFFFF',display:'inline-block',boxShadow:'0 0 5px rgba(255,255,255,0.9)'}}/>}
                      </div>
                      <div style={{position:'relative',pointerEvents:'none'}}>
                        {/* plain-text twin (glyph-clip fill) — held/locked shows CONSUMED filling bottom→up */}
                        <div ref={_calNumRef} style={{..._cnd,fontSize:70,lineHeight:1,letterSpacing:'-0.02em',display:_calActive?'block':'none',background:_calGrad(0),WebkitBackgroundClip:'text',backgroundClip:'text',WebkitTextFillColor:'transparent',color:'transparent'}}>{Math.round(consumed.calories).toLocaleString()}</div>
                        {/* NumberFlow REMAINING — shown at rest */}
                        <div style={{..._cnd,fontSize:70,color:'#FFFFFF',lineHeight:1,letterSpacing:'-0.02em',textShadow:'none',display:_calActive?'none':'block'}}>
                          {_calOver?<MN value={Math.abs(remaining.calories)} format={{useGrouping:true}} prefix="+"/>:<MN value={_calRem} format={{useGrouping:true}}/>}
                        </div>
                      </div>
                      {/* sub-line BELOW the number */}
                      <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,letterSpacing:'0.06em',textTransform:'uppercase',color:'rgba(255,255,255,0.45)',marginTop:6,display:'flex',alignItems:'center',gap:6,pointerEvents:'none'}}>
                        {_calActive?(
                          <span style={{fontWeight:600}}>of {Math.round(macros.calories).toLocaleString()} cal</span>
                        ):(<>
                          <span style={{fontWeight:500,textTransform:'none',letterSpacing:'0.02em'}}>hold to break down</span>
                          {calDelta!==null&&<span style={{marginLeft:'auto',fontWeight:600,color:calDelta>0?'#9BF6B0':'rgba(255,255,255,0.55)'}}><MN value={calDelta} format={{signDisplay:'exceptZero'}}/> vs yest.</span>}
                        </>)}
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
            {/* Home/Kitchen toggle relocated → see _fuelToggle (below the home summary + top of Kitchen) */}
          </>
        );
      })()}
      {/* Undo Toast */}
      {undoEntry&&(
        <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:"#0d0d0d",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.15)",borderRadius:14,padding:"12px 16px",zIndex:400,display:"flex",alignItems:"center",gap:14,boxShadow:"0 8px 32px rgba(0,0,0,.5)",minWidth:260}}>
          <div style={{flex:1,fontSize:13,fontWeight:600,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{undoEntry.food} added</div>
          <button onClick={handleUndo} style={{padding:"6px 14px",background:"rgba(var(--cm-red-rgb,255,59,48),.15)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),.4)",borderRadius:8,color:T.prot,fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Undo</button>
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
      {/* ── NUTRITION DETAIL (tapped food-log entry) ── */}
      {foodDetail&&(()=>{
        const it=foodDetail.item||{};
        const cal=Math.round(it.calories||0), p=Math.round(it.protein||0), c=Math.round(it.carbs||0), fat=Math.round(it.fat||0);
        const pc=p*4, cc=c*4, fc=fat*9, tot=(pc+cc+fc)||1;
        // macro ring geometry (split by calorie contribution)
        const R=46, SW=13, CX=62, CY=62, CIRC=2*Math.PI*R;
        const segs=[['var(--cm-red,#FF3B30)',pc],['#60a5fa',cc],['#FEA020',fc]];
        let _cum=0; // segments laid clockwise from 12 o'clock (the group is rotated -90)
        const arcs=segs.map(([col,val])=>{const len=(val/tot)*CIRC; const a={col,dash:`${Math.max(0,len-2)} ${CIRC}`,offset:-_cum}; _cum+=len; return a;});
        const tgt={cal:macros.calories||0,p:macros.protein||0,c:macros.carbs||0,f:macros.fat||0};
        const rows=[['Protein','var(--cm-red,#FF3B30)',p,tgt.p],['Carbs','#60a5fa',c,tgt.c],['Fat','#FEA020',fat,tgt.f]];
        const card={background:'var(--cm-paper,#FFFFFF)',borderRadius:16,padding:'18px',marginBottom:14,boxShadow:'0 2px 12px rgba(0,0,0,.10)'};
        const eb={fontFamily:"'Archivo',sans-serif",fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase'};
        return(
          <motion.div key="food-detail" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.18}}
            style={{position:'fixed',inset:0,zIndex:500,background:'var(--cm-red,#FF3B30)'}} onClick={()=>{_hL?.();setFoodDetail(null);}}>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',damping:28,stiffness:290}}
              style={{position:'absolute',inset:0,overflowY:'auto',WebkitOverflowScrolling:'touch'}} onClick={e=>e.stopPropagation()}>
              <div style={{padding:'max(52px,env(safe-area-inset-top,48px)) 18px max(40px,env(safe-area-inset-bottom,28px))'}}>
                <button onClick={()=>{hap?.();setFoodDetail(null);}} style={{background:'rgba(255,255,255,0.16)',border:'none',borderRadius:999,padding:'8px 16px',display:'flex',alignItems:'center',gap:7,cursor:'pointer',marginBottom:20}}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M10 4l-4 4 4 4"/></svg>
                  <span style={{...eb,fontSize:10,color:'#fff'}}>Close</span>
                </button>
                <div style={{...eb,fontSize:10,color:'rgba(255,255,255,0.7)',marginBottom:6}}>{getSlotLabel?getSlotLabel(foodDetail.slot):'Logged'}</div>
                <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:800,fontSize:28,letterSpacing:'-0.01em',color:'#fff',lineHeight:1.05,textTransform:'capitalize',marginBottom:18}}>{it.food||it.name||'Food'}</div>

                {/* Ring + nutrition label */}
                <div style={{...card,display:'flex',alignItems:'center',gap:18}}>
                  <div style={{flexShrink:0,position:'relative',width:124,height:124}}>
                    <svg width="124" height="124" viewBox="0 0 124 124">
                      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(var(--cm-ink-rgb,10,10,10),0.07)" strokeWidth={SW}/>
                      {arcs.map((a,i)=><circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={a.col} strokeWidth={SW} strokeLinecap="butt" strokeDasharray={a.dash} strokeDashoffset={a.offset} transform={`rotate(-90 ${CX} ${CY})`}/>)}
                    </svg>
                    <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                      <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:800,fontSize:24,letterSpacing:'-0.01em',color:'var(--cm-ink,#0A0A0A)',lineHeight:1}}>{cal}</div>
                      <div style={{...eb,fontSize:9,color:'rgba(var(--cm-ink-rgb,10,10,10),0.4)',marginTop:2}}>kcal</div>
                    </div>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{...eb,fontSize:10,color:'rgba(var(--cm-ink-rgb,10,10,10),0.42)',paddingBottom:7,marginBottom:9,borderBottom:'2px solid rgba(var(--cm-ink-rgb,10,10,10),0.12)'}}>Nutrition</div>
                    {rows.map(([label,col,val])=>(
                      <div key={label} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                        <span style={{width:9,height:9,borderRadius:3,background:col,flexShrink:0}}/>
                        <span style={{flex:1,fontFamily:"'Archivo',sans-serif",fontSize:13,fontWeight:600,color:'var(--cm-ink,#0A0A0A)'}}>{label}</span>
                        <span style={{fontFamily:"'Archivo',sans-serif",fontSize:14,fontWeight:700,color:'var(--cm-ink,#0A0A0A)'}}>{val}g</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Share of today's target */}
                <div style={card}>
                  <div style={{...eb,fontSize:10,color:'rgba(var(--cm-ink-rgb,10,10,10),0.42)',marginBottom:14}}>Share of today's target</div>
                  {[['Calories','var(--cm-ink,#0A0A0A)',cal,tgt.cal,'kcal'],...rows.map(r=>[r[0],r[1],r[2],r[3],'g'])].map(([label,col,val,target,unit])=>{
                    const pctRaw=target>0?(val/target)*100:0; const pct=Math.round(pctRaw);
                    return(
                      <div key={label} style={{marginBottom:12}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:5}}>
                          <span style={{fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:700,color:'rgba(var(--cm-ink-rgb,10,10,10),0.6)',letterSpacing:'0.02em'}}>{label}</span>
                          <span style={{fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:600,color:'rgba(var(--cm-ink-rgb,10,10,10),0.5)'}}>{val}{unit==='g'?'g':''} / {target}{unit==='g'?'g':''} {unit==='kcal'?'kcal':''} · {pct}%</span>
                        </div>
                        <div style={{height:7,borderRadius:4,background:'rgba(var(--cm-ink-rgb,10,10,10),0.08)',overflow:'hidden'}}>
                          <motion.div initial={{width:0}} animate={{width:`${Math.min(100,Math.max(0,pctRaw))}%`}} transition={{duration:0.6,ease:'easeOut'}} style={{height:'100%',borderRadius:4,background:col==='var(--cm-ink,#0A0A0A)'?'var(--cm-red,#FF3B30)':col}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button onClick={()=>{hap?.();setFoodDetail(null);}} style={{width:'100%',background:'#fff',border:'none',borderRadius:14,padding:'15px',fontFamily:"'Archivo',sans-serif",fontSize:13,fontWeight:700,letterSpacing:'0.02em',color:'var(--cm-red,#FF3B30)',cursor:'pointer'}}>Done</button>
              </div>
            </motion.div>
          </motion.div>
        );
      })()}
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
          if(oql)setFuelScreen("log");
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
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"var(--cm-red,#FF3B30)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>// HEADS UP</div>
              <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:22,color:"#f5f5f0",lineHeight:0.95,marginBottom:12}}>
                {headline}<span style={{color:"var(--cm-red,#FF3B30)"}}>.</span>
              </div>
              <div style={{fontSize:14,color:"rgba(245,245,240,0.6)",lineHeight:1.5,marginBottom:8}}>{bodyText}</div>
              {remainingAfterSkip.length>0&&(
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(245,245,240,0.5)",marginBottom:20,letterSpacing:"0.08em"}}>{impactText}</div>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <button onClick={confirmSkip} style={{width:"100%",background:"var(--cm-red,#FF3B30)",border:"none",borderRadius:10,padding:14,fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:10,color:"#fff",letterSpacing:"0.16em",textTransform:"uppercase",cursor:"pointer"}}>{btnLabel}</button>
                <button onClick={()=>{setShowSkipPrompt(false);setSkipPromptTarget(null);}} style={{width:"100%",background:"transparent",border:"1px solid rgba(245,245,240,0.1)",borderRadius:10,padding:12,fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(245,245,240,0.4)",letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>GO BACK</button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Undo skip toast */}
      {showUndoToast&&justSkipped.length>0&&(
        <div style={{position:"fixed",bottom:100,left:16,right:16,background:"#0d0d0d",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.3)",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:9999,overflow:"hidden"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#f5f5f0"}}>
            {justSkipped.length===1?`Meal ${justSkipped[0]} skipped.`:`${justSkipped.length} meals skipped.`}
          </div>
          <button onClick={async()=>{
            clearTimeout(undoTimerRef.current);
            setShowUndoToast(false);
            const restored=(skippedSlots||[]).filter(s=>!justSkipped.includes(s));
            if(onSkipSlots)await onSkipSlots(restored);
            setJustSkipped([]);
          }} style={{background:"rgba(var(--cm-red-rgb,255,59,48),0.15)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.4)",borderRadius:6,padding:"5px 12px",fontFamily:"'DM Mono',monospace",fontSize:9,color:"var(--cm-red,#FF3B30)",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",flexShrink:0,marginLeft:12}}>UNDO</button>
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:2,background:"rgba(var(--cm-red-rgb,255,59,48),0.2)"}}>
            <div style={{background:"var(--cm-red,#FF3B30)",height:"100%",width:`${undoProgress}%`,transition:"width 5s linear"}}/>
          </div>
        </div>
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
              <div style={{background:GOCLUB_REDESIGN?'var(--cm-paper,#FFFFFF)':T.s1,border:`1px solid ${GOCLUB_REDESIGN?'rgba(var(--cm-ink-rgb,10,10,10),0.06)':T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px",boxShadow:GOCLUB_REDESIGN?'0 2px 12px rgba(0,0,0,.08)':undefined}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div>
                    <div style={{fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"var(--condensed)",fontSize:18,fontWeight:900,letterSpacing:.5,color:'var(--cm-red,#FF3B30)'}}>MACRO MEMORY</div>
                    <div style={{fontSize:11,color:T.mu,marginTop:2}}>Based on your {new Date().toLocaleDateString("en-US",{weekday:"long"})} patterns</div>
                  </div>
                  {memoryLoggedMsg&&<div style={{fontSize:11,color:T.green,fontWeight:700}}>{memoryLoggedMsg}</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {memorySuggestions.filter(s=>!skippedMemory.has(s.data.food)).map(({count,data})=>(
                    <div key={data.food} style={{background:GOCLUB_REDESIGN?'rgba(var(--cm-ink-rgb,10,10,10),0.04)':T.s2,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:"var(--cm-red,#FF3B30)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{data.food}</div>
                        <div style={{fontSize:11,color:T.mu,marginTop:2}}>{data.calories} kcal · {data.protein}g protein</div>
                      </div>
                      <div style={{display:"flex",gap:6,flexShrink:0}}>
                        <motion.button
                          onClick={()=>{if(logEntry)logEntry(data);setMemoryLoggedMsg(`✓ Logged. ${remaining.calories-data.calories} kcal remaining.`);setTimeout(()=>setMemoryLoggedMsg(""),3000);}}
                          onPointerDown={GOCLUB_REDESIGN?()=>_hL():undefined}
                          whileTap={GOCLUB_REDESIGN?{scale:0.91}:undefined}
                          transition={GOCLUB_REDESIGN?{type:'spring',stiffness:600,damping:20}:undefined}
                          style={{padding:"7px 12px",background:T.prot,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",touchAction:GOCLUB_REDESIGN?"manipulation":undefined}}>Log</motion.button>
                        <button onClick={()=>setSkippedMemory(s=>new Set([...s,data.food]))} style={{padding:"7px 10px",background:"none",border:'1px solid rgba(var(--cm-red-rgb,255,59,48),0.4)',color:'var(--cm-red,#FF3B30)',borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Skip</button>
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
                :{fontFamily:"'Archivo',sans-serif",fontStyle:'italic',fontWeight:900};
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
                      style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%) rotate(-90deg)',filter:'drop-shadow(0 0 16px rgba(var(--cm-red-rgb,255,59,48),0.10))'}}>
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
                      {calOver&&<circle cx="110" cy="110" r="100" fill="none" stroke="rgba(var(--cm-red-rgb,255,59,48),0.3)" strokeWidth="14" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset="0"/>}
                      <MotionArc cx={110} cy={110} r={100} pct={calPct}
                        stroke={`url(#${calOver?'calRingGradientOver':'calRingGradient'})`}
                        strokeWidth={14} />
                      {calPct>0.02&&(
                        GOCLUB_REDESIGN
                          ? <motion.circle cx={tipX} cy={tipY} r="7" fill="#FF3B30"
                              initial={{opacity:0}} animate={{opacity:1}}
                              transition={{delay:0.72,duration:0.18}}
                              style={{filter:calOver?'drop-shadow(0 0 10px rgba(var(--cm-red-rgb,255,59,48),1.0))':'drop-shadow(0 0 6px rgba(var(--cm-red-rgb,255,59,48),0.8)) drop-shadow(0 0 12px rgba(var(--cm-red-rgb,255,59,48),0.4))'}}/>
                          : <circle cx={tipX} cy={tipY} r="7" fill="#FF3B30"
                              style={{filter:calOver?'drop-shadow(0 0 10px rgba(var(--cm-red-rgb,255,59,48),1.0))':'drop-shadow(0 0 6px rgba(var(--cm-red-rgb,255,59,48),0.8)) drop-shadow(0 0 12px rgba(var(--cm-red-rgb,255,59,48),0.4))'}}/>
                      )}
                    </svg>
                    {/* Left — consumed */}
                    <div style={{position:'absolute',left:0,top:'50%',transform:'translateY(-50%)',textAlign:'center',width:62}}>
                      <div style={{...cnd,fontSize:26,color:'#f5f5f0',lineHeight:1}}><MN value={consumed.calories} format={{useGrouping:true}} /></div>
                      <div style={{...mno,fontSize:8,color:'rgba(245,245,240,0.4)',letterSpacing:'0.12em',textTransform:'uppercase',marginTop:4}}>CONSUMED</div>
                    </div>
                    {/* Center — remaining */}
                    <div style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none'}}>
                      <div style={{...cnd,fontSize:48,color:calOver?'var(--cm-red,#FF3B30)':'#f5f5f0',lineHeight:1,letterSpacing:'-0.02em',textShadow:'0 0 30px rgba(245,245,240,0.15), 0 2px 24px rgba(0,0,0,0.8)'}}>
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
                  <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:20}}>
                    {[
                      {label:'PROTEIN',c:Math.round(consumed.protein),t:Math.round(macros.protein),color:'var(--cm-red,#FF3B30)'},
                      {label:'CARBS',  c:Math.round(consumed.carbs),  t:Math.round(macros.carbs),  color:'#60a5fa'},
                      {label:'FAT',    c:Math.round(consumed.fat),    t:Math.round(macros.fat),    color:'#FEA020'},
                    ].map(({label,c,t,color})=>(
                      <div key={label} style={{display:'flex',alignItems:'center',gap:12}}>
                        <div style={{fontFamily:"'Archivo',sans-serif",fontSize:13,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.04em',width:62,color:GOCLUB_REDESIGN?'rgba(255,255,255,0.9)':'rgba(245,245,240,0.5)',flexShrink:0}}>{label}</div>
                        <div style={{flex:1,height:14,background:GOCLUB_REDESIGN?'rgba(255,255,255,0.22)':'rgba(245,245,240,0.06)',borderRadius:7,overflow:'hidden'}}>
                          <div style={{height:'100%',borderRadius:7,background:GOCLUB_REDESIGN?(_calActive?color:'rgba(255,255,255,0.92)'):color,width:`${Math.min(100,t>0?Math.round(c/t*100):0)}%`,transition:'width 0.5s ease, background-color 0.3s ease'}}/>
                        </div>
                        <div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:600,color:GOCLUB_REDESIGN?'rgba(255,255,255,0.7)':'#f5f5f0',letterSpacing:'0.04em',whiteSpace:'nowrap'}}><MN value={c} /> / <MN value={t} />g</div>
                      </div>
                    ))}
                  </div>
                  {/* TRAIN → FUEL — session-aware, personality-voiced (replaces the old "// DAY TYPE" label).
                      Real delta vs rest day from weekMacros; honest fallbacks (weekly avg / no chips). */}
                  {GOCLUB_REDESIGN&&(()=>{
                    const _session=todayWeekEntry?.label||todayFocus||'Rest';
                    const restBase=weekMacros?.find(d=>d.dayType==='rest');
                    let carbDelta=null,kcalDelta=null,proteinHeld=true,deltaLabel='vs rest';
                    if(dayNutrition&&restBase){
                      carbDelta=Math.round(dayNutrition.carbs-restBase.carbs);
                      kcalDelta=Math.round(dayNutrition.calories-restBase.calories);
                      proteinHeld=Math.abs(dayNutrition.protein-restBase.protein)<=5;
                    }else if(dayNutrition&&weekMacros&&weekMacros.length){
                      const avg=k=>weekMacros.reduce((a,d)=>a+(d[k]||0),0)/weekMacros.length;
                      carbDelta=Math.round(dayNutrition.carbs-avg('carbs'));
                      kcalDelta=Math.round(dayNutrition.calories-avg('calories'));
                      proteinHeld=Math.abs(dayNutrition.protein-avg('protein'))<=5;
                      deltaLabel='vs your weekly average';
                    }
                    const underTarget=consumed.carbs<macros.carbs;
                    const isRest=carbDelta!=null&&carbDelta<=0;
                    const proteinG=Math.round((dayNutrition&&dayNutrition.protein)||macros.protein||0);
                    const _more=deltaLabel==='vs rest'?'a rest day':'your weekly average';
                    // Excellent neutral baseLine — balanced / confidence<20 users see THIS unchanged.
                    let baseLine;
                    if(carbDelta==null){
                      baseLine=underTarget
                        ?`${_session} takes more out of you than a rest day — keep eating to hit your targets.`
                        :`Today's food is set up for your ${_session.toLowerCase()}. You're fueled for the work.`;
                    }else if(isRest){
                      baseLine=`Rest day, so your carbs ease back a little${kcalDelta?` (about ${Math.abs(kcalDelta)} fewer calories than a training day)`:''} while protein stays the same to help you recover.`;
                    }else{
                      baseLine=underTarget
                        ?`${_session} raised your carbs ${carbDelta}g and calories ${kcalDelta} above ${_more}, to fuel the work${proteinHeld?' (protein stays the same)':''}. You've still got carbs left today — keep eating.`
                        :`${_session} raised your carbs ${carbDelta}g and calories ${kcalDelta} above ${_more} to fuel the work and help you recover${proteinHeld?', with protein held steady':''}. You've hit it — nice work.`;
                    }
                    const line=adaptMessageSync(baseLine,getProfileSync(user?.id),{scenario:'train_to_fuel',data:{session:_session,carbDelta,kcalDelta,proteinHeld,proteinG,underTarget}});
                    const isRun=todayType==='run'||todayType==='cardio'||/run/i.test(_session);
                    const eyebrow=(()=>{
                      if(isRest||todayType==='rest')return'FUEL FOR RECOVERY';
                      const raw=(_session||'').toLowerCase();
                      if(isRun){
                        const kind=/long run/.test(raw)?'LONG RUN':/tempo/.test(raw)?'TEMPO RUN':/interval/.test(raw)?'INTERVALS':/easy/.test(raw)?'EASY RUN':'RUN';
                        return`BECAUSE OF YOUR ${kind}`;
                      }
                      const map=[[/leg|lower|squat|quad/,'LEGS'],[/push|chest|bench/,'PUSH'],[/pull|back|row/,'PULL'],[/upper/,'UPPER BODY'],[/shoulder|delt/,'SHOULDERS'],[/arm|bicep|tricep/,'ARMS'],[/glute/,'GLUTES'],[/core|abs?\b/,'CORE'],[/full body|total/,'FULL BODY']];
                      for(const [re,word] of map){if(re.test(raw))return`BECAUSE YOU TRAINED ${word}`;}
                      return"TODAY'S FUEL, SHAPED BY YOUR TRAINING";
                    })();
                    const chip={fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:600,letterSpacing:'0.04em',background:'rgba(255,255,255,0.14)',border:'1px solid rgba(255,255,255,0.22)',color:'rgba(255,255,255,0.9)',borderRadius:20,padding:'4px 10px',whiteSpace:'nowrap'};
                    return(
                      <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid rgba(255,255,255,0.12)'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                          {/* coach whistle mark — glyph, inherits the eyebrow's light color */}
                          <WhistleMark size={16} variant="glyph" style={{color:"#fff"}}/>
                          <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'0.14em',color:'rgba(255,255,255,0.85)',textTransform:'uppercase'}}>{eyebrow}</div>
                        </div>
                        <div style={{fontFamily:"'Archivo',sans-serif",fontSize:16,fontWeight:500,color:'#FFFFFF',lineHeight:1.45}}>{line}</div>
                        {carbDelta!=null&&!isRest&&(
                          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:10}}>
                            {carbDelta>0&&<span style={chip}>+{carbDelta}g carbs {deltaLabel}</span>}
                            {kcalDelta>0&&<span style={chip}>+{kcalDelta} kcal {deltaLabel}</span>}
                            {proteinHeld&&<span style={chip}>protein held</span>}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* (Removed: "Why are my macros like this?" expander + weekly protein-adherence
                      bar graph — both superseded by the Train→Fuel section above.) */}

                </>
                </StaggerItem>
              );
            })()}

            {/* Home/Kitchen toggle — relocated here, below the hero+macro summary, above the food log */}
            {GOCLUB_REDESIGN&&_fuelToggle}

            {/* FOOD LOG — grouped by meal slots */}
            {(()=>{
              const lSlots=getLoggedSlots(log);
              const slotTargets=getSlotTargets(macros.calories,mealSlots,skippedSlots||[],lSlots,log.reduce((s,e)=>s+(e.calories||0),0));
              const basePerSlot=Math.round(macros.calories/mealSlots.length);
              // Read-only: today's plan day → slot→meal map (part A; does NOT touch log or consumed totals)
              const todayPlanDay=mealPrepPlan?.days?.find(d=>d.day.slice(0,3)===todayKey);
              const plannedBySlot={};
              if(todayPlanDay){orderPlanMeals(todayPlanDay.meals).forEach((m,i)=>{plannedBySlot[i+1]=m;});}
              return(
                <StaggerItem i={2}>
                <div style={{background:GOCLUB_REDESIGN?'var(--cm-paper,#FFFFFF)':T.s1,border:`1px solid ${GOCLUB_REDESIGN?'rgba(var(--cm-ink-rgb,10,10,10),0.06)':T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px",boxShadow:GOCLUB_REDESIGN?'0 2px 12px rgba(0,0,0,.08)':undefined}}>
                  {(()=>{
                    const f=profile?.fasting||profile?.profile_data?.fasting;
                    if(!f||f==="no")return null;
                    const windowLabel=f==="16:8"?"8h eating window":f==="omad"?"OMAD — 1 meal":f==="custom"?`${Math.max(1,24-fastHours)}h eating window`:"Fasting active";
                    return<div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:"rgba(37,99,235,0.85)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>{windowLabel}</div>;
                  })()}
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14,gap:12}}>
                    <div>
                      <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:2,color:GOCLUB_REDESIGN?'rgba(var(--cm-ink-rgb,10,10,10),0.42)':'rgba(245,245,240,0.5)'}}>Today's Meals</div>
                      <div style={{fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"var(--condensed)",fontStyle:GOCLUB_REDESIGN?"normal":"italic",fontWeight:800,fontSize:18,letterSpacing:'-0.01em',textTransform:"uppercase",lineHeight:1,color:'var(--cm-red,#FF3B30)'}}>Food Log</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6,flexShrink:0}}>
                      {/* MACROS toggle — calorie bars ⇄ P/C/F-segmented bars */}
                      <button onClick={()=>setMacrosOn(v=>!v)} style={{display:'inline-flex',alignItems:'center',gap:7,borderRadius:999,padding:'5px 8px 5px 12px',border:`1.5px solid ${macrosOn?'var(--cm-red,#FF3B30)':'rgba(var(--cm-ink-rgb,10,10,10),0.15)'}`,background:macrosOn?'rgba(var(--cm-red-rgb,255,59,48),0.10)':'transparent',cursor:'pointer',fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:macrosOn?'var(--cm-red,#FF3B30)':'rgba(var(--cm-ink-rgb,10,10,10),0.5)',transition:'all .2s'}}>
                        Macros
                        <span style={{width:26,height:15,borderRadius:999,background:macrosOn?'var(--cm-red,#FF3B30)':'rgba(var(--cm-ink-rgb,10,10,10),0.2)',position:'relative',transition:'background .2s',flexShrink:0}}>
                          <span style={{position:'absolute',top:2,left:macrosOn?13:2,width:11,height:11,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                        </span>
                      </button>
                      {/* P/C/F legend — fades in with macro mode */}
                      <div style={{display:'flex',gap:9,opacity:macrosOn?1:0,maxHeight:macrosOn?16:0,overflow:'hidden',transition:'opacity .3s, max-height .3s'}}>
                        {[['P','var(--cm-red,#FF3B30)'],['C','#60a5fa'],['F','#FEA020']].map(([l,c])=>(
                          <span key={l} style={{display:'inline-flex',alignItems:'center',gap:3,fontFamily:"'Archivo',sans-serif",fontSize:9,fontWeight:700,color:'rgba(var(--cm-ink-rgb,10,10,10),0.5)'}}><span style={{width:8,height:8,borderRadius:2,background:c}}/>{l}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* P1 — today-not-covered: quiet hint only when a plan exists but doesn't include today */}
                  {mealPrepPlan?.days?.length>0&&!todayPlanDay&&(
                    <div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:500,color:'rgba(var(--cm-ink-rgb,10,10,10),0.4)',marginTop:-6,marginBottom:12}}>No prepped meals planned for today</div>
                  )}
                  <div>
                    {mealSlots.map((slot,si)=>{
                      const isSkipped=(skippedSlots||[]).includes(slot);
                      const isLocked=(lockedSlots||[]).includes(slot);
                      const slotItems=log.filter(e=>getEntrySlot(e)===slot);
                      const slotCals=slotItems.reduce((s,e)=>s+(e.calories||0),0);
                      const target=slotTargets[slot]||0;
                      // Per-meal macros (grams) for the calorie⇄macro bar; calorie-equiv for segment widths.
                      const slotP=slotItems.reduce((s,e)=>s+(e.protein||0),0);
                      const slotC=slotItems.reduce((s,e)=>s+(e.carbs||0),0);
                      const slotF=slotItems.reduce((s,e)=>s+(e.fat||0),0);
                      const slotPct=target>0?slotCals/target:0;
                      const slotOver=target>0&&slotCals>target;
                      const slotMacroK=slotP*4+slotC*4+slotF*9;
                      const hasRedistributed=!isSkipped&&(skippedSlots||[]).length>0&&!lSlots.includes(slot)&&target>basePerSlot;
                      const hasOverageReduction=!isSkipped&&!lSlots.includes(slot)&&Object.keys(slotOverages||{}).some(k=>parseInt(k)!==slot);
                      // Precedence: logged > locked > skipped > planned > empty
                      // Only show planned when slot is empty, not skipped, not locked, and plan has a meal for this slot.
                      // If mealFreq differs from plan meal count, slot integers may not align — plannedBySlot[slot]
                      // returns undefined for non-matching slots and the card is simply absent (graceful skip).
                      const candidate=slotItems.length===0&&!isSkipped&&!isLocked?(plannedBySlot[slot]||null):null;
                      const plannedMeal=candidate&&!dismissedPlanned.includes(candidate._recipeId||candidate.name)?candidate:null;
                      return(
                        <div key={slot} style={{padding:"12px 0",borderBottom:si<mealSlots.length-1?"1px solid rgba(var(--cm-ink-rgb,10,10,10),0.06)":"none",opacity:isSkipped?0.4:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:!isSkipped?7:0}}>
                            {/* Lock icon on locked slots */}
                            {isLocked&&<svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={11} width={18} height={11} rx={2} ry={2}/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                            <span style={{fontFamily:"'Archivo',sans-serif",fontSize:14,fontWeight:700,color:isSkipped?"rgba(var(--cm-ink-rgb,10,10,10),0.4)":isLocked?"#22c55e":"var(--cm-ink,#0A0A0A)",letterSpacing:"0.02em",textTransform:"uppercase"}}>{getSlotLabel(slot)}</span>
                            <div style={{flex:1}}/>
                            {isSkipped?(
                              <span style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:600,color:"rgba(var(--cm-red-rgb,255,59,48),0.3)",letterSpacing:"0.04em"}}>SKIPPED</span>
                            ):isLocked?(
                              <span style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:600,color:"#22c55e",letterSpacing:"0.04em"}}>LOCKED</span>
                            ):(
                              <span style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:600,color:slotOver?"#C81E1E":"rgba(var(--cm-red-rgb,255,59,48),0.5)",letterSpacing:"0.04em",whiteSpace:"nowrap"}}>
                                {slotCals} / {target} kcal
                                {slotOver&&<span style={{color:"#C81E1E"}}> · +{slotCals-target} over</span>}
                                {hasRedistributed&&(
                                  <span onClick={()=>setTooltipSlot(tooltipSlot===slot?null:slot)} style={{color:"#FEA020",cursor:"pointer",marginLeft:4}}>↑</span>
                                )}
                                {hasOverageReduction&&!hasRedistributed&&(
                                  <span onClick={()=>setTooltipSlot(tooltipSlot===slot?null:slot)} style={{color:"var(--cm-red,#FF3B30)",cursor:"pointer",marginLeft:4}}>↓</span>
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
                                style={{width:34,height:34,background:"rgba(var(--cm-red-rgb,255,59,48),0.12)",border:"1.5px solid var(--cm-red,#FF3B30)",color:"var(--cm-red,#FF3B30)",borderRadius:999,fontSize:18,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,lineHeight:1,touchAction:GOCLUB_REDESIGN?"manipulation":undefined}}>+</motion.button>
                            )}
                            {mealSlots.length>1&&!isSkipped&&!isLocked&&(
                              <button onClick={()=>removeSlot(si)} style={{background:"none",border:"none",color:"rgba(var(--cm-red-rgb,255,59,48),0.2)",cursor:"pointer",fontSize:12,padding:"0 2px",lineHeight:1}}>×</button>
                            )}
                          </div>
                          {/* MEAL BAR — calorie mode (single accent + deep-red overage) ⇄ macro mode (P/C/F segments) */}
                          {!isSkipped&&(
                            <div style={{position:"relative",height:8,borderRadius:4,background:"rgba(var(--cm-ink-rgb,10,10,10),0.08)",overflow:"hidden",margin:"0 0 2px",boxShadow:(macrosOn&&slotOver)?"inset 0 0 0 1.5px #C81E1E":"inset 0 0 0 0 rgba(200,30,30,0)",transition:"box-shadow .4s"}}>
                              {/* calorie layer */}
                              <div style={{position:"absolute",inset:0,opacity:macrosOn?0:1,transition:"opacity .4s"}}>
                                <div style={{height:"100%",width:slotOver?"100%":`${Math.min(100,slotPct*100)}%`,display:"flex",transition:"width .4s"}}>
                                  {slotOver?(<>
                                    <div style={{height:"100%",width:`${(target/slotCals)*100}%`,background:"var(--cm-red,#FF3B30)"}}/>
                                    <div style={{height:"100%",flex:1,background:"#C81E1E"}}/>
                                  </>):(
                                    <div style={{height:"100%",width:"100%",background:"var(--cm-red,#FF3B30)"}}/>
                                  )}
                                </div>
                              </div>
                              {/* macro layer (P/C/F) */}
                              <div style={{position:"absolute",inset:0,opacity:macrosOn?1:0,transition:"opacity .4s"}}>
                                {slotMacroK>0&&(
                                  <div style={{height:"100%",width:`${Math.min(100,slotPct*100)}%`,display:"flex",transition:"width .4s"}}>
                                    <div style={{height:"100%",width:`${(slotP*4/slotMacroK)*100}%`,background:"var(--cm-red,#FF3B30)"}}/>
                                    <div style={{height:"100%",width:`${(slotC*4/slotMacroK)*100}%`,background:"#60a5fa"}}/>
                                    <div style={{height:"100%",width:`${(slotF*9/slotMacroK)*100}%`,background:"#FEA020"}}/>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {tooltipSlot===slot&&hasRedistributed&&(
                            <div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:500,color:"rgba(var(--cm-red-rgb,255,59,48),0.5)",marginBottom:6,padding:"4px 8px",background:"rgba(254,160,32,0.1)",border:"1px solid rgba(254,160,32,0.25)",borderRadius:6}}>Includes calories from skipped meals</div>
                          )}
                          {tooltipSlot===slot&&hasOverageReduction&&!hasRedistributed&&(
                            <div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:500,color:"rgba(var(--cm-red-rgb,255,59,48),0.5)",marginBottom:6,padding:"4px 8px",background:"rgba(var(--cm-red-rgb,255,59,48),0.08)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.2)",borderRadius:6}}>Reduced due to overage in an earlier meal</div>
                          )}
                          {slotItems.map((item,i)=>(
                            <SwipeRow key={item.id}
                              onDelete={isLocked?null:()=>{
                                const snap={...item};
                                removeLog(item.id);
                                showToast(`${snap.food||"Item"} removed`,{action:()=>logEntry(snap),actionLabel:"Undo"});
                              }}
                              style={{borderBottom:i<slotItems.length-1?`1px solid rgba(var(--cm-ink-rgb,10,10,10),0.04)`:""}}
                            >
                              <div
                                className="card-press"
                                onPointerDown={isLocked?undefined:()=>{lpFiredRef.current=false;longPressRef.current=setTimeout(()=>{hap();lpFiredRef.current=true;setContextMenu({item,slot});},500);}}
                                onPointerUp={isLocked?undefined:()=>clearTimeout(longPressRef.current)}
                                onPointerLeave={isLocked?undefined:()=>clearTimeout(longPressRef.current)}
                                onClick={isLocked?undefined:()=>{if(lpFiredRef.current){lpFiredRef.current=false;return;}hap();setFoodDetail({item,slot});}}
                                style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0"}}
                              >
                                <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
                                  {item.photo_url
                                    ? <div style={{width:32,height:32,borderRadius:8,overflow:"hidden",flexShrink:0}}><img src={item.photo_url} style={{width:32,height:32,objectFit:"cover"}} alt=""/></div>
                                    : <FoodIcon name={item} method={item.method} size={32} userId={user?.id} />
                                  }
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontSize:13,fontFamily:"'Archivo',sans-serif",fontWeight:600,textTransform:"capitalize",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:'var(--cm-red,#FF3B30)'}}>{item.food||item.name}</div>
                                    <div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:600,letterSpacing:'0.02em',color:"rgba(var(--cm-red-rgb,255,59,48),0.5)",marginTop:1}}>
                                      <span style={{color:T.prot}}>P:{item.protein}g</span> · <span style={{color:T.carb}}>C:{item.carbs}g</span> · <span style={{color:T.fat}}>F:{item.fat}g</span>
                                    </div>
                                  </div>
                                </div>
                                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                                  <div style={{textAlign:"right"}}>
                                    <div style={{fontFamily:"'Archivo',sans-serif",fontSize:15,fontWeight:700,color:"var(--cm-red,#FF3B30)"}}>{item.calories}</div>
                                    <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:600,letterSpacing:'0.04em',color:"rgba(var(--cm-red-rgb,255,59,48),0.42)"}}>kcal</div>
                                  </div>
                                  {!isLocked&&<button onClick={()=>removeLog(item.id)} style={{background:"rgba(var(--cm-ink-rgb,10,10,10),0.05)",border:"1px solid rgba(var(--cm-ink-rgb,10,10,10),0.1)",color:"rgba(var(--cm-red-rgb,255,59,48),0.45)",cursor:"pointer",fontSize:13,padding:"4px 8px",borderRadius:6}}>×</button>}
                                </div>
                              </div>
                            </SwipeRow>
                          ))}
                          {/* ── PLANNED card — part B: confirm / swap / skip ── */}
                          {plannedMeal&&(
                            <div style={{marginTop:4,padding:"10px 12px",border:"1.5px dashed rgba(var(--cm-ink-rgb,10,10,10),0.12)",borderRadius:10,background:"rgba(var(--cm-red-rgb,255,59,48),0.04)"}}>
                              <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:"rgba(var(--cm-red-rgb,255,59,48),0.55)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:4}}>Planned</div>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:13,fontFamily:"'Archivo',sans-serif",fontWeight:600,color:"rgba(var(--cm-red-rgb,255,59,48),0.55)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{plannedMeal.name}</div>
                                  <div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.02em",color:"rgba(var(--cm-red-rgb,255,59,48),0.4)",marginTop:2}}>
                                    <span style={{color:"rgba(34,197,94,0.45)"}}>P {Math.round(plannedMeal.protein)}g</span>{' · '}{Math.round(plannedMeal.calories)} kcal
                                  </div>
                                </div>
                              </div>
                              {/* Action row: primary confirm, secondary swap, tertiary skip */}
                              <div style={{display:"flex",alignItems:"center",gap:6}}>
                                <button
                                  onClick={()=>handleConfirmPlanned(plannedMeal,slot)}
                                  style={{flex:2,padding:"8px 10px",background:"var(--cm-red,#FF3B30)",border:"none",borderRadius:9,fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:11,color:"#fff",letterSpacing:"0.04em",textTransform:"uppercase",cursor:"pointer"}}>
                                  ✓ Ate this
                                </button>
                                <button
                                  onClick={()=>swappingSlot!==slot&&handleSwapPlanned(slot,plannedMeal._recipeId)}
                                  disabled={swappingSlot===slot}
                                  style={{flex:1,padding:"8px 10px",background:"rgba(var(--cm-ink-rgb,10,10,10),0.06)",border:"1px solid rgba(var(--cm-ink-rgb,10,10,10),0.12)",borderRadius:9,fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:11,color:"rgba(var(--cm-red-rgb,255,59,48),0.5)",letterSpacing:"0.04em",textTransform:"uppercase",cursor:swappingSlot===slot?"default":"pointer",opacity:swappingSlot===slot?0.5:1}}>
                                  {swappingSlot===slot?"…":"Swap"}
                                </button>
                                <button
                                  onClick={()=>handleDismissPlanned(plannedMeal._recipeId||plannedMeal.name)}
                                  style={{padding:"8px 10px",background:"none",border:"none",fontFamily:"'Archivo',sans-serif",fontWeight:600,fontSize:11,color:"rgba(var(--cm-red-rgb,255,59,48),0.35)",letterSpacing:"0.04em",textTransform:"uppercase",cursor:"pointer"}}>
                                  Dismiss
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {log.filter(e=>!mealSlots.includes(getEntrySlot(e))).map((item,i,arr)=>(
                      <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<arr.length-1?`1px solid rgba(var(--cm-ink-rgb,10,10,10),0.04)`:""}}>
                        <div style={{flex:1,minWidth:0,fontFamily:"'Archivo',sans-serif",fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:'var(--cm-red,#FF3B30)'}}>{item.food}</div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                          <div style={{fontFamily:"'Archivo',sans-serif",fontSize:13,fontWeight:600,color:'var(--cm-red,#FF3B30)'}}>{item.calories} kcal</div>
                          <button onClick={()=>removeLog(item.id)} style={{background:"rgba(var(--cm-ink-rgb,10,10,10),0.05)",border:"1px solid rgba(var(--cm-ink-rgb,10,10,10),0.1)",color:"rgba(var(--cm-red-rgb,255,59,48),0.45)",cursor:"pointer",fontSize:13,padding:"4px 8px",borderRadius:6}}>×</button>
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
                          <div style={{fontFamily:"'Archivo',sans-serif",fontStyle:GOCLUB_REDESIGN?"normal":"italic",fontWeight:800,fontSize:20,letterSpacing:"-0.01em",color:"rgba(var(--cm-red-rgb,255,59,48),0.85)",textTransform:"uppercase",marginBottom:6,lineHeight:1.05}}>{msg.head}</div>
                          <div style={{fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"'Archivo',sans-serif",fontSize:13,fontWeight:GOCLUB_REDESIGN?500:400,color:"rgba(var(--cm-red-rgb,255,59,48),0.4)",lineHeight:1.55,marginBottom:14,maxWidth:260,margin:"0 auto 14px"}}>{msg.sub}</div>
                          <button onClick={()=>setLogMode("search")} style={{background:"var(--cm-red,#FF3B30)",border:"none",borderRadius:999,padding:"11px 24px",fontFamily:"'Archivo',sans-serif",fontSize:13,fontWeight:700,color:"#fff",letterSpacing:"0.04em",textTransform:"uppercase",cursor:"pointer"}}>{msg.btn}</button>
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
              <div style={{background:GOCLUB_REDESIGN?"rgba(var(--cm-red-rgb,255,59,48),0.08)":"linear-gradient(135deg, rgba(var(--cm-red-rgb,255,59,48),0.08), var(--cm-paper,#FFFFFF))",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.25)",borderRadius:16,padding:"14px 18px"}}>
                <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,color:T.prot,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:6}}>Nutrition Periodization</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"var(--condensed)",fontStyle:GOCLUB_REDESIGN?"normal":"italic",fontSize:18,fontWeight:900,color:"var(--cm-red,#FF3B30)",letterSpacing:"0.04em",textTransform:"uppercase"}}>Week {periodizationInfo.cycleWeek} — {periodizationInfo.phase}</div>
                  <div style={{display:"flex",gap:3}}>
                    {Array.from({length:8}).map((_,i)=>(
                      <div key={i} style={{width:6,height:6,borderRadius:"50%",background:i<(periodizationInfo.cycleWeek||1)?"var(--cm-red,#FF3B30)":"rgba(var(--cm-ink-rgb,10,10,10),0.12)",flexShrink:0}}/>
                    ))}
                  </div>
                </div>
                <div style={{fontSize:13,color:"rgba(var(--cm-red-rgb,255,59,48),0.8)",lineHeight:1.55}}>{periodizationInfo.note}</div>
                <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:600,color:"rgba(var(--cm-red-rgb,255,59,48),0.4)",marginTop:6,letterSpacing:"0.06em",textTransform:"uppercase"}}>Weeks {periodizationInfo.wks}</div>
              </div>
            )}

            {/* NUTRITION PERIODISATION PROTOCOL */}
            {todayProtocol&&todayProtocol.protocol_type!=="standard"&&(()=>{
              const typeMap={
                refeed:{label:"REFEED DAY",icon:"🔄",color:"#f59e0b",comment:"Leptin reset · metabolism boost"},
                carb_load:{label:"CARB LOADING",icon:"⚡",color:"#3b82f6",comment:"Race tomorrow · top up glycogen"},
                race_day:{label:"RACE DAY",icon:"🏁",color:"#FF3B30",comment:"High carbs · low fat · race ready"},
                training_day:{label:"TRAINING DAY",icon:"💪",color:"#22c55e",comment:"Extra fuel · performance calories"},
                rest_day:{label:"REST DAY",icon:"🛋️",color:"#FFFFFF",comment:"Recovery focus · base calories"},
              };
              const meta=typeMap[todayProtocol.protocol_type]||typeMap.training_day;
              const calDiff=todayProtocol.adjusted_calories-todayProtocol.base_calories;
              const carbDiff=todayProtocol.adjusted_carbs_g-todayProtocol.base_carbs_g;
              return(
                <div style={{background:`${meta.color}10`,border:`1.5px solid ${meta.color}30`,borderRadius:16,padding:"14px 18px"}}>
                  <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,color:meta.color,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:6}}>{meta.comment}</div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{fontSize:22}}>{meta.icon}</div>
                    <div style={{fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"var(--condensed)",fontStyle:GOCLUB_REDESIGN?"normal":"italic",fontSize:18,fontWeight:900,color:meta.color,letterSpacing:"0.04em",textTransform:"uppercase"}}>{meta.label}</div>
                  </div>
                  <div style={{fontSize:13,color:"rgba(var(--cm-red-rgb,255,59,48),0.8)",lineHeight:1.55,marginBottom:10}}>{todayProtocol.reason}</div>
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
                      <div style={{fontSize:13,fontWeight:700,color:"var(--cm-red,#FF3B30)"}}>{cn.focus}</div>
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
                <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,color:"var(--amber)",fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:4}}>PCOS Nutrition</div>
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
                  <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,color:T.green,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:6}}>
                    {profile.lifeStage==="menopause"?"Menopause Nutrition":"Perimenopause Nutrition"}
                  </div>
                  <div style={{fontSize:12,color:T.mu,lineHeight:1.65,marginBottom:10}}>{mn.note}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.green,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:5}}>Calcium sources</div>
                      {mn.calcium.map(f=><div key={f} style={{fontSize:11,color:T.mu,marginBottom:2}}>• {f}</div>)}
                    </div>
                    <div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.green,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:5}}>Omega-3 sources</div>
                      {mn.omega3.map(f=><div key={f} style={{fontSize:11,color:T.mu,marginBottom:2}}>• {f}</div>)}
                    </div>
                  </div>
                  <div style={{background:"rgba(var(--cm-ink-rgb,10,10,10),0.04)",border:"1px solid rgba(var(--cm-ink-rgb,10,10,10),0.08)",borderRadius:9,padding:"10px 12px",marginTop:12,display:"flex",gap:8,alignItems:"flex-start"}}>
                    <div><div style={{fontSize:11,color:"var(--cm-red,#FF3B30)",lineHeight:1.6}}>A gynecologist or endocrinologist can help optimize your hormone and nutrition strategy during this transition.</div><a href="https://coach-macro.com/support" style={{fontSize:10,color:"var(--cm-red,#FF3B30)",textDecoration:"none",letterSpacing:".06em",display:"inline-block",marginTop:3}}>Talk to a professional →</a></div>
                  </div>
                </div>
              );
            })()}

            {/* PERFORMANCE NUTRITION PATTERNS */}
            {perfCorrelations&&perfCorrelations.length>=2&&(
              <div style={{background:GOCLUB_REDESIGN?'var(--cm-paper,#FFFFFF)':T.s1,border:`1px solid ${GOCLUB_REDESIGN?'rgba(var(--cm-ink-rgb,10,10,10),0.06)':T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px",boxShadow:GOCLUB_REDESIGN?'0 2px 12px rgba(0,0,0,.08)':undefined}}>
                <div style={{fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"var(--condensed)",fontSize:18,fontWeight:900,letterSpacing:.5,marginBottom:2,color:'var(--cm-red,#FF3B30)'}}>NUTRITION × PERFORMANCE</div>
                <div style={{fontSize:11,color:T.mu,marginBottom:14}}>Your average intake before each session type · last 28 days</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {perfCorrelations.sort((a,b)=>b.count-a.count).slice(0,3).map(c=>(
                    <div key={c.session_type} style={{background:GOCLUB_REDESIGN?'rgba(var(--cm-ink-rgb,10,10,10),0.04)':T.s2,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,textTransform:"capitalize",color:"var(--cm-red,#FF3B30)",marginBottom:2}}>{c.session_type}</div>
                        <div style={{fontSize:10,color:T.mu}}>{c.count} sessions tracked</div>
                      </div>
                      <div style={{display:"flex",gap:12,textAlign:"right"}}>
                        <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:700,color:"var(--cm-red,#FF3B30)"}}>{c.avg_calories}</div><div style={{fontSize:9,color:T.mu,letterSpacing:".06em"}}>KCAL</div></div>
                        <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:700,color:T.prot}}>{c.avg_protein}g</div><div style={{fontSize:9,color:T.mu,letterSpacing:".06em"}}>PROT</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COACH SUGGESTS */}
            {remaining.calories>200&&(
              <div style={{background:"var(--cm-paper,#FFFFFF)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.3)",borderRadius:16,padding:"16px 18px"}}>
                <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,color:T.prot,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>Coach Suggests</div>
                {bodySuggest
                  ?(<div style={{fontStyle:"italic",fontSize:13,color:"rgba(var(--cm-red-rgb,255,59,48),0.85)",lineHeight:1.65,marginBottom:12}}>"{bodySuggest}"</div>)
                  :(<div style={{marginBottom:12}}>
                      <div style={{fontSize:13,color:"rgba(var(--cm-red-rgb,255,59,48),0.6)",lineHeight:1.55,marginBottom:8}}>You have {remaining.calories} kcal · {remaining.protein}g protein left. Get a smart suggestion for your next meal.</div>
                      <button onClick={fetchBodySuggest} disabled={bodySuggestLoading} style={{background:"var(--cm-red,#FF3B30)",border:"none",borderRadius:999,padding:"10px 20px",cursor:"pointer",fontFamily:"'Archivo',sans-serif",fontSize:12,color:"#fff",fontWeight:700,letterSpacing:"0.04em",textTransform:"uppercase",opacity:bodySuggestLoading?0.6:1}}>{bodySuggestLoading?"Getting suggestion…":"Get AI suggestion →"}</button>
                    </div>)
                }
                <div style={{display:"flex",gap:8}}>
                  {bodySuggest&&<button onClick={()=>setFuelScreen("home")} style={{flex:2,padding:"11px",background:"var(--cm-red,#FF3B30)",color:"#fff",border:"none",borderRadius:999,fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:13,letterSpacing:"0.04em",textTransform:"uppercase",cursor:"pointer"}}>Log It</button>}
                </div>
              </div>
            )}

            {/* WEEKEND FLEX MODE */}
            <div style={{background:'var(--cm-paper,#FFFFFF)',border:`1px solid ${macros.isFlexDay?"rgba(245,158,11,.3)":"rgba(var(--cm-ink-rgb,10,10,10),0.06)"}`,borderRadius:20,padding:isMobile?"16px":"20px 24px",boxShadow:'0 2px 12px rgba(0,0,0,.08)'}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:flexOn?14:0}}>
                <div>
                  <div style={{fontFamily:"'Archivo',sans-serif",fontSize:14,fontWeight:800,letterSpacing:"0.02em",color:flexOn?"var(--amber)":"rgba(var(--cm-ink-rgb,10,10,10),0.65)",textTransform:"uppercase",marginBottom:flexOn?3:0}}>Weekend Flex</div>
                  {flexOn&&<div style={{fontSize:11,color:"rgba(var(--cm-red-rgb,255,59,48),0.4)"}}>Adds {flexPct}% on Sat/Sun and trims weekdays to match — weekly total stays the same.</div>}
                </div>
                <div onClick={()=>saveFlexPrefs({...(wPrefs||{}),weekendFlexMode:!flexOn,flexDays:!flexOn?["Sat","Sun"]:flexDays,flexCalorieIncrease:flexPct})}
                  style={{width:44,height:24,borderRadius:12,background:flexOn?"#F59E0B":"rgba(var(--cm-ink-rgb,10,10,10),0.12)",cursor:"pointer",display:"flex",alignItems:"center",padding:"0 3px",justifyContent:flexOn?"flex-end":"flex-start",transition:"background 0.2s",boxSizing:"border-box",flexShrink:0,marginLeft:16}}>
                  <div style={{width:18,height:18,borderRadius:9,background:"#fff"}}/>
                </div>
              </div>
              {flexOn&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
                  {WDAYS.map(day=>{
                    const isToday=day===todayKey;
                    const isFlex=flexDays.includes(day);
                    const schedType=schedule?.[day]||"rest";
                    const dayColor=isToday?"var(--cm-red,#FF3B30)":isFlex?"var(--amber)":"rgba(var(--cm-ink-rgb,10,10,10),0.4)";
                    const dayLabel=isFlex?"F":schedType==="training"?"T":(schedType==="cardio"||schedType==="run"||schedType==="hyrox")?"R":"—";
                    return(
                      <button key={day} onClick={()=>setDayModal(day)}
                        style={{background:isToday?"rgba(var(--cm-red-rgb,255,59,48),.12)":isFlex?"rgba(245,158,11,.08)":"rgba(var(--cm-ink-rgb,10,10,10),0.02)",border:`1.5px solid ${isToday?"rgba(var(--cm-red-rgb,255,59,48),.5)":isFlex?"rgba(245,158,11,.4)":"rgba(var(--cm-ink-rgb,10,10,10),0.08)"}`,borderRadius:10,padding:"8px 4px",textAlign:"center",cursor:"pointer",fontFamily:"inherit"}}>
                        <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:dayColor,marginBottom:3,letterSpacing:"0.04em"}}>{day}</div>
                        <div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:700,color:dayColor}}>{dayLabel}</div>
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
                  <div style={{fontFamily:"'Archivo',sans-serif",fontSize:22,fontWeight:900,marginBottom:20,color:'#fff'}}>{DAY_NAMES[dayModal]||dayModal}</div>
                  <div style={{display:"flex",gap:8,marginBottom:24}}>
                    {[["T","Training","training"],["—","Rest","rest"],["F","Flex","flex"]].map(([abbr,label,type])=>{
                      const isFlex=type==="flex";
                      const isSelected=isFlex?flexDays.includes(dayModal):(!flexDays.includes(dayModal)&&(schedule?.[dayModal]||"rest")===type);
                      return(
                        <button key={type} onClick={()=>{if(type==="flex")toggleFlexDay(dayModal);else setDayTypeInSchedule(dayModal,type);setDayModal(null);}}
                          style={{flex:1,padding:"14px 8px",background:isSelected?(isFlex?"rgba(245,158,11,.15)":"rgba(var(--cm-red-rgb,255,59,48),.12)"):"rgba(255,255,255,.04)",border:`1.5px solid ${isSelected?(isFlex?"rgba(245,158,11,.5)":"rgba(var(--cm-red-rgb,255,59,48),.5)"):"rgba(255,255,255,.08)"}`,borderRadius:10,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:16,fontWeight:700,color:isSelected?(isFlex?"var(--amber)":"var(--cm-red,#FF3B30)"):"rgba(245,245,240,.25)",marginBottom:4}}>{abbr}</div>
                          <div style={{fontSize:12,fontWeight:700,color:isSelected?(isFlex?"var(--amber)":"var(--cm-red,#FF3B30)"):"rgba(245,245,240,.5)"}}>{label}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{fontSize:12,color:"rgba(245,245,240,.35)",lineHeight:1.8,marginBottom:20}}>
                    <span style={{color:"var(--cm-red,#FF3B30)"}}>Training</span> = higher carbs for workout fuel<br/>
                    <span style={{color:"rgba(245,245,240,.5)"}}>Rest</span> = standard lower calories<br/>
                    <span style={{color:"rgba(245,158,11,.8)"}}>Flex</span> = +{flexPct}% calories, protein stays fixed
                  </div>
                  <button onClick={()=>setDayModal(null)} style={{width:"100%",padding:13,background:"transparent",color:"rgba(245,245,240,.4)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Done</button>
                </div>
              </div>
            )}


            {/* Weekly Prep card removed from home — accessible via Kitchen tab */}

            {/* WATER TRACKER */}
            {waterTarget>0&&(
              <>
              <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(255,255,255,0.55)",marginBottom:8}}>Hydration</div>
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
              <div style={{background:GOCLUB_REDESIGN?'var(--cm-paper,#FFFFFF)':T.s1,border:`1px solid ${GOCLUB_REDESIGN?'rgba(var(--cm-ink-rgb,10,10,10),0.06)':T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px",boxShadow:GOCLUB_REDESIGN?'0 2px 12px rgba(0,0,0,.08)':undefined}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(var(--cm-red-rgb,255,59,48),0.65)",fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"var(--condensed)"}}>My Recipes</div>
                  <button onClick={()=>setFuelScreen("kitchen")} style={{background:"none",border:"none",color:T.prot,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:"0.1em",textTransform:"uppercase",padding:0}}>See All →</button>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {userRecipes.slice(0,3).map(r=>(
                    <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:GOCLUB_REDESIGN?'rgba(var(--cm-ink-rgb,10,10,10),0.03)':T.s2,border:`1px solid ${GOCLUB_REDESIGN?'rgba(var(--cm-ink-rgb,10,10,10),0.06)':T.bd}`,borderRadius:12}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:'var(--cm-red,#FF3B30)'}}>{r.name}</div>
                        <div style={{fontSize:10,color:T.mu}}>{r.calories_per_serving} kcal · <span style={{color:T.prot}}>P {r.protein_per_serving}g</span></div>
                      </div>
                      <button onClick={()=>setRecipeLogging(r)} style={{padding:"8px 16px",background:`${T.prot}15`,border:`1.5px solid ${T.prot}40`,borderRadius:20,color:T.prot,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Log →</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          );}catch(err){console.error('FUEL HOME CRASH:',err);return(<div style={{padding:24,color:'var(--cm-red,#FF3B30)',fontFamily:'DM Mono,monospace',fontSize:12}}>Error: {err.message}</div>);}
        })()}

        {/* ── LOG FOOD — full-screen fixed sheet (F) ── */}
        {fuelScreen==="log"&&(
          <div style={{position:"fixed",inset:0,zIndex:500,background:"var(--cm-red,#FF3B30)",overflowY:"auto",paddingBottom:80,WebkitOverflowScrolling:"touch"}}>
            {/* Sticky header: ← Close + MEAL X chip */}
            <div style={{position:"sticky",top:0,background:"transparent",padding:"calc(env(safe-area-inset-top,0px) + 12px) 16px 12px",zIndex:10,display:"flex",alignItems:"center",gap:14}}>
              <button onClick={()=>setFuelScreen("home")} style={{background:"none",border:"none",fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.85)",letterSpacing:"0.06em",cursor:"pointer",padding:0,textTransform:"uppercase",flexShrink:0}}>← Close</button>
              <div style={{flex:1}}/>
              <div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:700,color:"#FFFFFF",letterSpacing:"0.06em",textTransform:"uppercase",background:"rgba(255,255,255,0.16)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:999,padding:"5px 14px",flexShrink:0}}>Meal {mealSlots[activeSlotIdx]||1}</div>
            </div>
            <div style={{maxWidth:isMobile?"100%":600,padding:"14px 14px 0"}}>

            {/* Step 1: Meal selection */}
            {(()=>{
              const slotCals={};
              mealSlots.forEach(slot=>{
                slotCals[slot]=log.filter(e=>getEntrySlot(e)===slot).reduce((s,e)=>s+(e.calories||0),0);
              });
              return(
                <>
                  <div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:700,color:"#fff",letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:10}}>Which meal?</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:logSlotConfirmed?8:20}}>
                    {mealSlots.map((slot,i)=>{
                      const kcal=slotCals[slot]||0;
                      const sel=logSlotConfirmed&&activeSlotIdx===i;
                      // Reuse the existing lock guard: an earlier meal has items but isn't locked yet.
                      const lockTarget=mealSlots.find(s=>s<slot&&log.some(e=>getEntrySlot(e)===s)&&!(lockedSlots||[]).includes(s));
                      const shouldLock=!!lockTarget;
                      return(
                        <button key={slot} onClick={()=>{
                          if(shouldLock){setLockGate({slotToLock:lockTarget,pendingIdx:i});return;}
                          setActiveSlotIdx(i);setLogSlotConfirmed(true);
                        }} style={{flex:"1 1 0",minWidth:100,background:sel?"rgba(var(--cm-red-rgb,255,59,48),0.1)":"var(--cm-paper,#FFFFFF)",border:sel?"1.5px solid var(--cm-red,#FF3B30)":"1px solid rgba(var(--cm-red-rgb,255,59,48),0.12)",borderRadius:16,padding:"15px 10px",textAlign:"center",cursor:"pointer",transition:"all 0.15s",fontFamily:"inherit",opacity:shouldLock?0.45:1,boxShadow:"0 2px 10px rgba(0,0,0,.05)"}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5,marginBottom:4}}>
                            {shouldLock&&<svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="var(--cm-red,#FF3B30)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={11} width={18} height={11} rx={2} ry={2}/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                            <div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,color:"var(--cm-ink)",fontWeight:700,letterSpacing:"0.04em",textTransform:"uppercase"}}>{getSlotLabel(slot)}</div>
                          </div>
                          <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:600,color:kcal>0?"rgba(var(--cm-ink-rgb,10,10,10),0.6)":"rgba(var(--cm-ink-rgb,10,10,10),0.3)"}}>{kcal>0?`${kcal} kcal`:shouldLock?"Locked":"Empty"}</div>
                        </button>
                      );
                    })}
                  </div>
                  {logSlotConfirmed&&(
                    <>
                      <div style={{marginBottom:16}}>
                        <span style={{background:"rgba(var(--cm-red-rgb,255,59,48),0.08)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.2)",borderRadius:999,padding:"5px 14px",fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:10,color:"var(--cm-red,#FF3B30)",letterSpacing:"0.06em",textTransform:"uppercase",display:"inline-block"}}>
                          Adding to {(getSlotLabel(mealSlots[activeSlotIdx])||"MEAL 1").toUpperCase()}
                        </span>
                      </div>
                      <div style={{height:1,background:"rgba(255,255,255,0.15)",marginBottom:20}}/>
                    </>
                  )}
                </>
              );
            })()}

            {/* Step 2: Log methods */}
            {!logSlotConfirmed?(
              <div style={{fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.5)",textAlign:"center",padding:"24px 0",letterSpacing:"0.02em"}}>Select a meal above to continue</div>
            ):(
              <>
                {!logMode&&(()=>{
                  const Card=({primary,icon,title,sub,onClick})=>(
                    <button onClick={onClick} style={{width:"100%",background:"var(--cm-paper,#FFFFFF)",border:primary?"1.5px solid var(--cm-red,#FF3B30)":"1px solid rgba(var(--cm-red-rgb,255,59,48),0.12)",borderRadius:20,padding:primary?"26px 22px":"22px 22px",display:"flex",alignItems:"center",gap:16,cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:14,WebkitTapHighlightColor:"transparent",boxShadow:primary?"0 4px 18px rgba(0,0,0,.10)":"0 2px 10px rgba(0,0,0,.05)"}}>
                      <div style={{width:primary?54:48,height:primary?54:48,borderRadius:14,background:primary?"var(--cm-red,#FF3B30)":"rgba(var(--cm-red-rgb,255,59,48),0.10)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icon}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:800,fontSize:primary?20:17,letterSpacing:"-0.01em",color:"var(--cm-ink)",lineHeight:1.1}}>{title}</div>
                        <div style={{fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:500,color:"rgba(var(--cm-ink-rgb,10,10,10),0.55)",marginTop:4,lineHeight:1.4}}>{sub}</div>
                      </div>
                      <div style={{color:"var(--cm-red,#FF3B30)",fontSize:18,fontWeight:700,flexShrink:0,opacity:0.5}}>→</div>
                    </button>
                  );
                  const camIcon=<svg width="22" height="19" viewBox="0 0 18 15" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4A1 1 0 012 3h1a1 1 0 00.9-.55l.2-.4A1 1 0 015 1.5h8a1 1 0 01.9.55l.2.4A1 1 0 0015 3h1a1 1 0 011 1v9a1 1 0 01-1 1H2a1 1 0 01-1-1V4z"/><circle cx="9" cy="8" r="2.5"/></svg>;
                  const penIcon=<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cm-ink)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>;
                  const forkIcon=<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cm-ink)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 3v6a2 2 0 0 0 2 2v10M8 3v6a2 2 0 0 1-2 2M16 3c-1.5 0-3 1.5-3 4s1.5 4 3 4v9"/></svg>;
                  return(
                    <>
                      <div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:700,color:"#fff",letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:12}}>How do you want to log?</div>
                      <Card primary icon={camIcon} title="Scan & Snap" sub="Photo or barcode → instant macros" onClick={()=>setLogMode("scan")}/>
                      <Card icon={penIcon} title="Describe" sub="Type it, search, saved foods or quick add" onClick={()=>setLogMode("ai")}/>
                      <Card icon={forkIcon} title="Restaurant AI" sub="Best picks for any menu, near you" onClick={()=>{setRestaurantStandalone(true);openRestaurantAI();}}/>
                    </>
                  );
                })()}
                {logMode&&logMode!=="restaurant"&&(
                  <button onClick={()=>{setLogMode(null);setAiEstimate(null);setAiEstimating(false);}} style={{background:"none",border:"none",fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.7)",cursor:"pointer",padding:"0 0 16px",letterSpacing:"0.06em",textTransform:"uppercase",display:"block"}}>← All methods</button>
                )}
                {logMode==="scan"&&(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {[
                      {title:"Photo",sub:"Snap your plate",icon:<svg width="24" height="20" viewBox="0 0 18 15" fill="none" stroke="var(--cm-red,#FF3B30)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4A1 1 0 012 3h1a1 1 0 00.9-.55l.2-.4A1 1 0 015 1.5h8a1 1 0 01.9.55l.2.4A1 1 0 0015 3h1a1 1 0 011 1v9a1 1 0 01-1 1H2a1 1 0 01-1-1V4z"/><circle cx="9" cy="8" r="2.5"/></svg>,onClick:()=>{setLogMode(null);onOpenPhotoLogger&&onOpenPhotoLogger();}},
                      {title:"Barcode",sub:"Scan a package",icon:<svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="var(--cm-red,#FF3B30)" strokeWidth="1.5" strokeLinecap="round"><line x1="1" y1="3" x2="1" y2="15"/><line x1="3.5" y1="3" x2="3.5" y2="15"/><line x1="6" y1="3" x2="6" y2="15"/><line x1="7.5" y1="3" x2="7.5" y2="15"/><line x1="10" y1="3" x2="10" y2="15"/><line x1="13" y1="3" x2="13" y2="15"/><line x1="15.5" y1="3" x2="15.5" y2="15"/><line x1="17" y1="3" x2="17" y2="15"/></svg>,onClick:()=>setLogMode("barcode")},
                    ].map(({title,sub,icon,onClick})=>(
                      <button key={title} onClick={onClick} style={{background:"var(--cm-paper,#FFFFFF)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.12)",borderRadius:18,padding:"28px 16px",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:12,cursor:"pointer",fontFamily:"inherit",textAlign:"left",WebkitTapHighlightColor:"transparent",boxShadow:"0 2px 10px rgba(0,0,0,.05)"}}>
                        <div style={{width:48,height:48,borderRadius:14,background:"rgba(var(--cm-red-rgb,255,59,48),0.10)",display:"flex",alignItems:"center",justifyContent:"center"}}>{icon}</div>
                        <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:800,fontSize:16,letterSpacing:"-0.01em",color:"var(--cm-red,#FF3B30)"}}>{title}</div>
                        <div style={{fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:500,color:"rgba(var(--cm-red-rgb,255,59,48),0.5)"}}>{sub}</div>
                      </button>
                    ))}
                  </div>
                )}
                {["ai","search","myfoods","quick"].includes(logMode)&&(
                  <div style={{display:"flex",background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:999,padding:3,gap:2,marginBottom:16}}>
                    {[["ai","Describe"],["search","Search"],["myfoods","My Foods"],["quick","Quick"]].map(([m,lbl])=>(
                      <button key={m} onClick={()=>{setLogMode(m);if(m!=="ai"){setAiEstimate(null);setAiEstimating(false);}}} style={{flex:1,padding:"8px 0",borderRadius:999,border:"none",background:logMode===m?"#FFFFFF":"transparent",color:logMode===m?"var(--cm-red,#FF3B30)":"rgba(255,255,255,0.6)",fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,cursor:"pointer",letterSpacing:"0.02em",textTransform:"uppercase",WebkitTapHighlightColor:"transparent"}}>{lbl}</button>
                    ))}
                  </div>
                )}
                {logMode==="search"&&<FoodSearchScreen user={user} logEntry={logEntry} mealSlots={mealSlots} activeSlotIdx={activeSlotIdx} setActiveSlotIdx={setActiveSlotIdx} addMealSlot={addMealSlot} setFuelScreen={setFuelScreen} isMobile={isMobile}/>}
                {logMode==="ai"&&(
                  <>
                    {!aiEstimate&&!aiEstimating&&(
                      <>
                        <div style={{background:"var(--cm-paper,#FFFFFF)",border:`1px solid ${T.bd}`,borderRadius:18,padding:"20px",marginBottom:12,boxShadow:"0 2px 10px rgba(0,0,0,.05)"}}>
                          <textarea value={foodInput} onChange={e=>setFoodInput(e.target.value)} placeholder="Describe your meal... e.g. grilled chicken 6oz, brown rice 1 cup, steamed broccoli" style={{width:"100%",background:"none",border:"none",color:"var(--cm-ink)",fontSize:14,resize:"none",outline:"none",minHeight:96,fontFamily:"inherit",boxSizing:"border-box",lineHeight:1.6}}/>
                        </div>
                        <PrimaryBtn onClick={handleAiDescribeSubmit} label="ESTIMATE MACROS →" disabled={!foodInput.trim()}/>
                      </>
                    )}
                    {aiEstimating&&(
                      <div style={{background:"var(--cm-paper,#FFFFFF)",borderRadius:12,padding:20,textAlign:"center"}}>
                        <div style={{...mno,fontSize:10,color:"rgba(var(--cm-red-rgb,255,59,48),0.4)",letterSpacing:"0.16em"}}>ESTIMATING...</div>
                      </div>
                    )}
                    {aiEstimate&&!aiEstimating&&(
                      <div style={{background:"var(--cm-paper,#FFFFFF)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.15)",borderRadius:18,padding:"24px 20px",marginTop:16,boxShadow:"0 2px 10px rgba(0,0,0,.05)"}}>
                        <div style={{...mno,fontSize:10,color:"var(--cm-red,#FF3B30)",letterSpacing:"0.16em",marginBottom:12}}>DOES THIS SOUND RIGHT?</div>
                        <div style={{fontFamily:"'Archivo',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:18,color:"var(--cm-red,#FF3B30)",marginBottom:14,lineHeight:1.2}}>{aiEstimate.description}</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                          {[
                            {label:"KCAL",val:aiEstimate.calories,color:"var(--cm-red,#FF3B30)",bg:"rgba(var(--cm-red-rgb,255,59,48),0.06)"},
                            {label:"PROTEIN",val:`${aiEstimate.protein}g`,color:"var(--cm-red,#FF3B30)",bg:"rgba(var(--cm-red-rgb,255,59,48),0.06)"},
                            {label:"CARBS",val:`${aiEstimate.carbs}g`,color:"#60a5fa",bg:"rgba(96,165,250,0.06)"},
                            {label:"FAT",val:`${aiEstimate.fat}g`,color:"#FEA020",bg:"rgba(254,160,32,0.06)"},
                          ].map(({label,val,color,bg})=>(
                            <div key={label} style={{background:bg,borderRadius:10,padding:12,textAlign:"center"}}>
                              <div style={{fontFamily:"'Archivo',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:28,color,lineHeight:1}}>{val}</div>
                              <div style={{...mno,fontSize:9,color:"var(--cm-red,#FF3B30)",letterSpacing:"0.12em",marginTop:4}}>{label}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{...mno,fontSize:9,color:"rgba(var(--cm-red-rgb,255,59,48),0.3)",letterSpacing:"0.1em",marginBottom:16}}>AI estimate — values may vary</div>
                        <button onClick={()=>{logEntryWithUndo({food:aiEstimate.food,calories:aiEstimate.calories,protein:aiEstimate.protein,carbs:aiEstimate.carbs,fat:aiEstimate.fat,id:Date.now(),method:"ai",slot:mealSlots[activeSlotIdx]||1});setFoodInput("");setAiEstimate(null);setFuelScreen("home");}} style={{width:"100%",padding:"14px",background:"var(--cm-red,#FF3B30)",border:"none",borderRadius:12,color:"#fff",...mno,fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.12em",marginBottom:8}}>LOOKS RIGHT — LOG IT →</button>
                        <button onClick={()=>setAiEstimate(null)} style={{width:"100%",padding:"14px",background:"transparent",border:"1px solid rgba(var(--cm-ink-rgb,10,10,10),0.12)",borderRadius:12,...mno,fontSize:11,fontWeight:700,cursor:"pointer",color:"rgba(var(--cm-red-rgb,255,59,48),0.5)",letterSpacing:"0.12em"}}>TRY AGAIN</button>
                      </div>
                    )}
                  </>
                )}
                {logMode==="myfoods"&&(
                  <>
                    {myFoodsHistory.length>0&&(
                      <>
                        <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:"var(--cm-red,#FF3B30)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Recent foods</div>
                        {myFoodsHistory.slice(0,5).map((f,i)=>(
                          <button key={i} onClick={()=>{logEntryWithUndo({food:f.food_name,calories:f.food_data?.calories||0,protein:f.food_data?.protein||0,carbs:f.food_data?.carbs||0,fat:f.food_data?.fat||0,id:Date.now(),slot:mealSlots[activeSlotIdx]||1,source:f.food_data?.source||"usda"});setLogMode(null);}} style={{width:"100%",background:"var(--cm-paper,#FFFFFF)",border:"1px solid rgba(var(--cm-ink-rgb,10,10,10),0.07)",borderRadius:10,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
                            <div>
                              <div style={{fontSize:14,fontWeight:700,color:"var(--cm-red,#FF3B30)"}}>{f.food_name}</div>
                              <div style={{...mno,fontSize:9,color:"rgba(var(--cm-red-rgb,255,59,48),0.4)",marginTop:2}}>{f.food_data?.calories} kcal · P {f.food_data?.protein}g</div>
                            </div>
                            <div style={{color:"var(--cm-red,#FF3B30)",...mno,fontSize:12,flexShrink:0}}>+</div>
                          </button>
                        ))}
                      </>
                    )}
                    <button onClick={()=>setFuelScreen("kitchen")} style={{width:"100%",background:"rgba(var(--cm-red-rgb,255,59,48),0.06)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.15)",borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",fontFamily:"inherit",marginBottom:20,marginTop:8}}>
                      <div style={{fontFamily:"'Archivo',sans-serif",fontStyle:"italic",fontWeight:700,fontSize:14,color:"var(--cm-red,#FF3B30)",textTransform:"uppercase"}}>See all saved foods</div>
                      <div style={{color:"var(--cm-red,#FF3B30)",...mno,fontSize:10}}>→</div>
                    </button>
                    <div style={{height:1,background:"rgba(var(--cm-red-rgb,255,59,48),0.08)",marginBottom:16}}/>
                    <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:"var(--cm-red,#FF3B30)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:12}}>Quick add</div>
                    <div style={{background:"var(--cm-paper,#FFFFFF)",border:`1px solid ${T.bd}`,borderRadius:12,padding:"16px",marginBottom:14}}>
                      {[["Name (optional)","text","name","e.g. Protein shake"],["Calories","number","calories","0"],["Protein (g)","number","protein","0"],["Carbs (g)","number","carbs","0"],["Fat (g)","number","fat","0"]].map(([l,t,k,ph])=>(
                        <div key={k} style={{marginBottom:12}}>
                          <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>{l}</div>
                          <input type={t} value={quickFields[k]} onChange={e=>setQF(q=>({...q,[k]:e.target.value}))} placeholder={ph} style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:8,padding:"10px 12px",color:"var(--cm-red,#FF3B30)",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                        </div>
                      ))}
                    </div>
                    <PrimaryBtn onClick={addQuick} label="Add Entry →" disabled={!quickFields.calories}/>
                  </>
                )}
                {logMode==="quick"&&(
                  <>
                    {/* Calories — the only required field, shown prominently */}
                    <div style={{background:"var(--cm-paper,#FFFFFF)",border:`1px solid ${T.bd}`,borderRadius:12,padding:"20px 16px",marginBottom:10}}>
                      <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Calories</div>
                      <input
                        autoFocus
                        type="number"
                        inputMode="numeric"
                        value={quickFields.calories}
                        onChange={e=>setQF(q=>({...q,calories:e.target.value}))}
                        placeholder="0"
                        style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:8,padding:"14px 12px",color:"var(--cm-red,#FF3B30)",fontSize:32,fontWeight:900,outline:"none",boxSizing:"border-box",fontFamily:"'Archivo',sans-serif",textAlign:"center"}}
                      />
                    </div>
                    {/* Expand toggle for name + macros */}
                    <button onClick={()=>setShowQAExtras(v=>!v)} style={{background:"none",border:"none",...mno,fontSize:9,color:showQAExtras?"var(--cm-red,#FF3B30)":"rgba(var(--cm-ink-rgb,10,10,10),0.4)",cursor:"pointer",padding:"4px 0 14px",letterSpacing:"0.12em",display:"block",textAlign:"left",WebkitTapHighlightColor:"transparent"}}>
                      {showQAExtras?"▼ HIDE DETAILS":"▶ ADD NAME & MACROS (optional)"}
                    </button>
                    {showQAExtras&&(
                      <div style={{background:"var(--cm-paper,#FFFFFF)",border:`1px solid ${T.bd}`,borderRadius:12,padding:"16px",marginBottom:14}}>
                        {[["Name (optional)","text","name","e.g. Protein shake"],["Protein (g)","number","protein","0"],["Carbs (g)","number","carbs","0"],["Fat (g)","number","fat","0"]].map(([l,t,k,ph])=>(
                          <div key={k} style={{marginBottom:12}}>
                            <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>{l}</div>
                            <input type={t} value={quickFields[k]} onChange={e=>setQF(q=>({...q,[k]:e.target.value}))} placeholder={ph} style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:8,padding:"10px 12px",color:"var(--cm-red,#FF3B30)",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
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
                    {barcodeResult&&<div style={{background:"var(--cm-paper,#FFFFFF)",border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px",marginBottom:12,marginTop:8}}>
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
            </div>
          </div>
        )}

        {/* ── KITCHEN (Recipes + Meal Prep) ── */}
        {fuelScreen==="kitchen"&&(
          <div style={{maxWidth:isMobile?"100%":700}}>

            {/* Home/Kitchen toggle — kept at top of Kitchen so users can switch back */}
            {GOCLUB_REDESIGN&&_fuelToggle}

            {/* Meal prep regenerate banner */}
            {showRegenerateBanner&&(
              <div style={{background:"var(--cm-paper,#FFFFFF)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.12)",borderRadius:12,padding:"14px 16px",marginBottom:16,display:"flex",alignItems:"flex-start",gap:12,boxShadow:'0 2px 12px rgba(0,0,0,.08)'}}>
                <span style={{color:"var(--cm-red,#FF3B30)",fontSize:16,flexShrink:0,lineHeight:1.3}}>!</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:"var(--cm-red,#FF3B30)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:4}}>Meal plan outdated</div>
                  <div style={{fontFamily:"'Archivo',sans-serif",fontSize:14,fontWeight:500,color:"var(--cm-ink,#0A0A0A)",lineHeight:1.5,marginBottom:12}}>Your training changed. Regenerate your meal plan to match.</div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{localStorage.removeItem('__mp_regen_needed');setShowRegenerateBanner(false);setMealPrepScreen('setup');setFuelScreen('mealprep');}} style={{background:"var(--cm-red,#FF3B30)",border:"none",borderRadius:999,padding:"9px 16px",fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:700,color:"#fff",letterSpacing:"0.02em",cursor:"pointer"}}>Regenerate →</button>
                    <button onClick={()=>{localStorage.removeItem('__mp_regen_needed');setShowRegenerateBanner(false);/* keep-this-plan: re-stamp the live signature so it won't re-flag until training changes AGAIN */if(mealPrepPlan)setMealPrepPlan(p=>p?{...p,trainingSig:_trainingSig()}:p);}} style={{background:"transparent",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.25)",borderRadius:999,padding:"9px 16px",fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:700,color:"rgba(var(--cm-red-rgb,255,59,48),0.6)",letterSpacing:"0.02em",cursor:"pointer"}}>Dismiss</button>
                  </div>
                </div>
              </div>
            )}

            {/* MEAL PREP — training-spine week (active plan) OR generate-your-week (empty) */}
            {(()=>{
              const _pill={fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.04em",textTransform:"uppercase",borderRadius:999,padding:"9px 16px",cursor:"pointer",WebkitTapHighlightColor:"transparent"};
              if(!mealPrepPlan){
                return(
                  <div style={{marginBottom:18,background:'var(--cm-paper,#FFFFFF)',border:'1px solid rgba(var(--cm-red-rgb,255,59,48),0.22)',borderRadius:20,padding:'28px 24px',boxShadow:'0 4px 18px rgba(0,0,0,.10)'}}>
                    <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:'var(--cm-red,#FF3B30)',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:8}}>Meal Prep</div>
                    <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:800,fontSize:28,letterSpacing:'-0.01em',color:'var(--cm-red,#FF3B30)',lineHeight:1.05,marginBottom:8}}>Generate your week</div>
                    <div style={{fontFamily:"'Archivo',sans-serif",fontSize:14,fontWeight:500,color:'rgba(var(--cm-red-rgb,255,59,48),0.55)',lineHeight:1.5,marginBottom:18}}>Pick your diet, meals per day & restrictions — AI builds a training-aware weekly plan with a grocery list.</div>
                    <button onClick={()=>{setMealPrepScreen('setup');setFuelScreen('mealprep');}} style={{..._pill,background:'var(--cm-red,#FF3B30)',border:'none',color:'#fff',padding:'13px 26px',fontSize:12}}>Set up my week →</button>
                  </div>
                );
              }
              const days=mealPrepPlan.days||[];
              const totalMeals=days.reduce((s,d)=>s+(d.meals||[]).filter(m=>!m.unfillable&&m.name).length,0);
              const restBase=weekMacros?.find(x=>x.dayType==='rest');
              const sessColor=(d)=>{
                const dp=wPrefs?.dayPlan?.[d.day];
                if(dp?.run)return '#60a5fa'; if(dp?.lift)return 'var(--cm-red,#FF3B30)';
                const st=d.sessionType;
                return st==='rest'?'rgba(var(--cm-ink-rgb,10,10,10),0.35)':(st==='run'||st==='cardio')?'#60a5fa':(st==='hyrox'||st==='hybrid')?'#FEA020':'var(--cm-red,#FF3B30)';
              };
              const sessLabel=(d)=>_sessFull(d.day,d.sessionType);
              // P1 — freshness. generatedAt stamped at build time (P0); legacy sig-less plans have none → no age line.
              const _ageDays=mealPrepPlan?.generatedAt?Math.floor((Date.now()-new Date(mealPrepPlan.generatedAt).getTime())/86400000):null;
              const _ageLabel=_ageDays==null?null:(_ageDays<=0?'Planned today':_ageDays===1?'Planned yesterday':`Planned ${_ageDays} days ago`);
              const _planElapsed=_ageDays!=null&&_ageDays>=7; // rolling 7-day window fully elapsed → time to plan next week
              return(
                <div style={{marginBottom:18,background:'var(--cm-paper,#FFFFFF)',border:'1px solid rgba(var(--cm-red-rgb,255,59,48),0.18)',borderRadius:20,padding:'24px 22px',boxShadow:'0 4px 18px rgba(0,0,0,.10)'}}>
                  <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:'var(--cm-red,#FF3B30)',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:4}}>Your week, fueled for training</div>
                  <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:800,fontSize:18,letterSpacing:'-0.01em',color:'var(--cm-ink,#0A0A0A)',textTransform:'capitalize',marginBottom:14}}>{mealPrepPrefs.dietPreset||'balanced'} · {totalMeals} meals prepped</div>
                  {_ageLabel&&<div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:500,color:'rgba(var(--cm-ink-rgb,10,10,10),0.42)',marginTop:-10,marginBottom:14}}>{_ageLabel}</div>}
                  <AllergyDisclaimer style={{marginBottom:16}}/>
                  {_planElapsed?(
                    <div style={{padding:'6px 2px 4px'}}>
                      <div style={{fontFamily:"'Archivo',sans-serif",fontSize:14,fontWeight:500,color:'rgba(var(--cm-ink-rgb,10,10,10),0.6)',lineHeight:1.5,marginBottom:14}}>This week's plan has ended.</div>
                      <button onClick={()=>{setMealPrepScreen('setup');setFuelScreen('mealprep');}} style={{..._pill,background:'var(--cm-red,#FF3B30)',border:'none',color:'#fff',padding:'13px 24px',fontSize:12}}>Plan next week →</button>
                    </div>
                  ):(
                  <div>
                    {days.map((d,dayIndex)=>{
                      const wm=weekMacros?.find(x=>x.day===d.day);
                      const isToday=d.day.slice(0,3)===todayKey;
                      const col=sessColor(d);
                      const meals=(d.meals||[]).filter(m=>!m.unfillable&&m.name);
                      const carbDelta=(wm&&restBase)?Math.round(wm.carbs-restBase.carbs):null;
                      const why=(carbDelta==null||d.sessionType==='rest')?'':carbDelta>8?`+${carbDelta}g carbs`:carbDelta<-8?'eased':'steady';
                      return(
                        <div key={d.day} style={{display:'flex',gap:12,alignItems:'stretch',padding:'10px 10px',borderRadius:12,background:isToday?'rgba(var(--cm-red-rgb,255,59,48),0.07)':'transparent',marginBottom:2}}>
                          <div style={{width:4,borderRadius:2,background:col,flexShrink:0}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                              <span style={{fontFamily:"'Archivo',sans-serif",fontSize:13,fontWeight:isToday?800:700,color:'var(--cm-ink,#0A0A0A)',letterSpacing:'0.02em'}}>{d.day.slice(0,3).toUpperCase()}</span>
                              <span style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:700,color:col,textTransform:'uppercase',letterSpacing:'0.04em'}}>{sessLabel(d)}</span>
                              {why&&<span style={{marginLeft:'auto',fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:600,color:'rgba(var(--cm-ink-rgb,10,10,10),0.4)'}}>{why}</span>}
                            </div>
                            {meals.length?(
                              <div style={{lineHeight:1.4}}>
                                {meals.map((m,mi)=>(
                                  <span key={mi}>
                                    <span onClick={()=>{_hM();setDetailFrom('kitchen');setMealIngChecked(new Set());setActiveMealDetail({day:d,meal:m,dayIndex,mealIndex:(d.meals||[]).indexOf(m)});setMealPrepScreen('plan');setFuelScreen('mealprep');}}
                                      style={{fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:600,color:'var(--cm-red,#FF3B30)',cursor:'pointer'}}>{m.name}</span>
                                    {mi<meals.length-1&&<span style={{fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:500,color:'rgba(var(--cm-ink-rgb,10,10,10),0.3)'}}> · </span>}
                                  </span>
                                ))}
                              </div>
                            ):(
                              <div style={{fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:500,color:'rgba(var(--cm-ink-rgb,10,10,10),0.45)'}}>No meals planned</div>
                            )}
                            {isToday&&<button onClick={()=>setFuelScreen('home')} style={{..._pill,marginTop:8,padding:'7px 14px',fontSize:11,background:'var(--cm-red,#FF3B30)',border:'none',color:'#fff'}}>Log today's meals →</button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                  <div style={{display:'flex',gap:8,marginTop:16,flexWrap:'wrap'}}>
                    <button onClick={()=>{setMealPrepScreen('plan');setFuelScreen('mealprep');}} style={{..._pill,background:'var(--cm-red,#FF3B30)',border:'none',color:'#fff'}}>View plan</button>
                    <button onClick={()=>{setGroceryFrom('kitchen');setMealPrepScreen('plan');setFuelScreen('mealprep');setShowGroceryList(true);}} style={{..._pill,background:'transparent',border:'1px solid rgba(var(--cm-red-rgb,255,59,48),0.3)',color:'var(--cm-red,#FF3B30)'}}>Grocery</button>
                    <button onClick={()=>{setMealPrepScreen('setup');setFuelScreen('mealprep');}} style={{..._pill,background:'transparent',border:'1px solid rgba(var(--cm-red-rgb,255,59,48),0.3)',color:'var(--cm-red,#FF3B30)'}}>Regenerate</button>
                  </div>
                </div>
              );
            })()}

            {/* Recipes — demoted secondary section below the meal-prep week */}
            <div style={{borderTop:"1px solid rgba(255,255,255,0.15)",marginTop:24,paddingTop:22}}>
              <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.6)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>Recipes</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{fontFamily:"'Archivo',sans-serif",fontSize:20,fontWeight:800,letterSpacing:"-0.01em",color:'var(--cm-paper,#FFFFFF)'}}>My Recipes</div>
                <button onClick={()=>{setRecipeEditing(null);setShowRecipeBuilder(true);}} style={{padding:"8px 16px",background:"rgba(255,255,255,0.15)",color:"#fff",border:"1px solid rgba(255,255,255,0.25)",borderRadius:999,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'Archivo',sans-serif",letterSpacing:"0.04em",textTransform:"uppercase",flexShrink:0}}>+ New</button>
              </div>
              <p style={{fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.5)",marginBottom:16}}>Save multi-ingredient meals · log in one tap</p>
            </div>

            {/* AI recipe ideas button */}
            <button onClick={fetchRecipes} style={{width:"100%",padding:"18px 18px",background:"var(--cm-paper,#FFFFFF)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.22)",borderRadius:18,cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:14,marginBottom:16,boxShadow:"0 2px 10px rgba(0,0,0,.05)"}}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke={T.prot} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--cm-red,#FF3B30)"}}>AI Recipe Ideas</div>
                <div style={{fontSize:11,color:T.mu}}>Generate recipes for your remaining macros today</div>
              </div>
              <div style={{color:T.prot,fontSize:11,fontWeight:700}}>{recipesLoading?"…":"Generate →"}</div>
            </button>

            {/* AI result */}
            {(recipes||recipesLoading)&&(
              <div style={{background:'var(--cm-paper,#FFFFFF)',border:`1px solid ${T.bd}`,borderRadius:18,padding:"22px",marginBottom:16,boxShadow:"0 2px 10px rgba(0,0,0,.05)"}}>
                {recipesLoading
                  ?<div style={{padding:"8px 0"}}><AIContentSkeleton/></div>
                  :<><div style={{lineHeight:1.85,fontSize:13,color:"var(--cm-red,#FF3B30)",whiteSpace:"pre-wrap"}}>{recipes}</div><div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}><FlagBtn responseText={recipes} feature="recipes" user={user}/></div></>
                }
              </div>
            )}

            {/* Smart save suggestion */}
            {recipeSuggestSlot&&(
              <div style={{background:"var(--cm-paper,#FFFFFF)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.12)",borderRadius:18,padding:"20px 20px",marginBottom:16,boxShadow:"0 2px 10px rgba(0,0,0,.05)"}}>
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
                <div style={{background:"var(--cm-paper,#FFFFFF)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),.35)",borderRadius:20,padding:"28px 24px",maxWidth:340,width:"100%",textAlign:"center"}}>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:8,color:'var(--cm-red,#FF3B30)'}}>Delete "{recipeDeleteConfirm.name}"?</div>
                  <div style={{fontSize:12,color:T.mu,marginBottom:24,lineHeight:1.6}}>This recipe will be permanently removed.</div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>setRecipeDeleteConfirm(null)} style={{flex:1,padding:"13px",background:'var(--cm-paper,#FFFFFF)',border:`1px solid ${T.bd}`,borderRadius:10,color:"var(--cm-red,#FF3B30)",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                    <button onClick={()=>{handleDeleteRecipe(recipeDeleteConfirm.id);setRecipeDeleteConfirm(null);}} style={{flex:1,padding:"13px",background:"rgba(var(--cm-red-rgb,255,59,48),.15)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),.5)",borderRadius:10,color:T.prot,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
                  </div>
                </div>
              </div>
            )}

            {/* Recipe list */}
            {userRecipes.length===0?(
              <div style={{textAlign:"center",padding:"56px 20px",border:`1px dashed ${T.bd}`,borderRadius:16}}>
                <svg width={48} height={48} viewBox="0 0 24 24" fill="none" style={{margin:"0 auto 14px",display:"block",opacity:.4}}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" stroke="var(--cm-red,#FF3B30)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>No recipes yet</div>
                <div style={{fontSize:12,color:T.mu,lineHeight:1.65,maxWidth:280,margin:"0 auto 24px"}}>Create your first recipe to log multiple foods in one tap</div>
                <button onClick={()=>{setRecipeEditing(null);setShowRecipeBuilder(true);}} style={{padding:"14px 28px",background:T.prot,color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>+ Create Recipe</button>
              </div>
            ):(
              <>
                {/* Search + category filter */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,background:'var(--cm-paper,#FFFFFF)',border:`1px solid ${T.bd}`,borderRadius:12,padding:"10px 14px"}}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{flexShrink:0,opacity:.4}}><circle cx={11} cy={11} r={8} stroke="var(--cm-red,#FF3B30)" strokeWidth={2}/><path d="m21 21-4.35-4.35" stroke="var(--cm-red,#FF3B30)" strokeWidth={2} strokeLinecap="round"/></svg>
                  <input value={recipeSearch} onChange={e=>setRecipeSearch(e.target.value)} placeholder="Search recipes…" style={{flex:1,background:"none",border:"none",outline:"none",color:"var(--cm-red,#FF3B30)",fontSize:13,fontFamily:"inherit"}}/>
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
                        <div key={r.id} style={{background:'var(--cm-paper,#FFFFFF)',border:'1px solid rgba(var(--cm-red-rgb,255,59,48),0.12)',borderRadius:16,padding:"16px",boxShadow:'0 2px 12px rgba(0,0,0,.08)'}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontFamily:"'Archivo',sans-serif",fontSize:18,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:'var(--cm-red,#FF3B30)'}}>{r.name}</div>
                              <div style={{fontSize:11,color:T.mu}}>
                                {ingCount} ingredient{ingCount!==1?"s":""}{totalGrams>0?` · ${totalGrams}g total`:""}
                              </div>
                            </div>
                            {r.category&&<span style={{fontSize:9,background:"rgba(var(--cm-red-rgb,255,59,48),0.08)",color:"rgba(var(--cm-red-rgb,255,59,48),0.5)",borderRadius:5,padding:"3px 8px",flexShrink:0,marginLeft:8,fontWeight:700}}>{r.category}</span>}
                          </div>
                          {/* Macro bar */}
                          <div style={{height:5,borderRadius:3,overflow:"hidden",display:"flex",marginBottom:8,background:'rgba(var(--cm-red-rgb,255,59,48),0.08)'}}>
                            <div style={{width:`${pPct}%`,background:T.prot,transition:"width 0.32s cubic-bezier(.2,.7,.3,1)"}}/>
                            <div style={{width:`${cPct}%`,background:T.carb,transition:"width 0.32s cubic-bezier(.2,.7,.3,1)"}}/>
                            <div style={{width:`${fPct}%`,background:T.fat,transition:"width 0.32s cubic-bezier(.2,.7,.3,1)"}}/>
                          </div>
                          <div style={{display:"flex",gap:14,marginBottom:8}}>
                            <div style={{fontSize:15,fontWeight:900,color:'var(--cm-red,#FF3B30)'}}>{r.calories_per_serving}<span style={{fontSize:10,color:T.mu,fontWeight:400}}> kcal</span></div>
                            <div style={{fontSize:12,color:T.prot,fontWeight:700}}>{r.protein_per_serving}g P</div>
                            <div style={{fontSize:12,color:T.carb,fontWeight:700}}>{r.carbs_per_serving}g C</div>
                            <div style={{fontSize:12,color:T.fat,fontWeight:700}}>{r.fat_per_serving}g F</div>
                          </div>
                          {daysSince!==null&&<div style={{fontSize:10,color:T.mu,marginBottom:12}}>Last made: {daysSince===0?"today":daysSince===1?"yesterday":`${daysSince}d ago`}</div>}
                          <div style={{display:"flex",gap:8}}>
                            <button onClick={()=>setRecipeLogging(r)} style={{flex:1,padding:"11px",background:T.prot,color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Archivo',sans-serif",letterSpacing:"0.05em"}}>Log →</button>
                            <button onClick={()=>{setRecipeEditing(r);setShowRecipeBuilder(true);}} style={{padding:"11px 16px",background:'var(--cm-paper,#FFFFFF)',border:`1px solid ${T.bd}`,borderRadius:10,color:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Edit</button>
                            <button onClick={()=>setRecipeDeleteConfirm(r)} style={{padding:"11px",background:"none",border:`1px solid rgba(var(--cm-red-rgb,255,59,48),.3)`,borderRadius:10,color:"rgba(var(--cm-red-rgb,255,59,48),.6)",cursor:"pointer",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
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

          </div>
        )}

        {/* ── OVERAGE NOTIFICATION ── */}
        {overageModal&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setOverageModal(null)}>
            <div style={{background:"var(--cm-paper,#FFFFFF)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.25)",borderRadius:"18px 18px 0 0",padding:"24px 20px 44px",maxWidth:480,width:"100%",boxShadow:"0 -8px 40px rgba(var(--cm-red-rgb,255,59,48),0.12)"}} onClick={e=>e.stopPropagation()}>
              <div style={{width:32,height:3,background:"rgba(var(--cm-red-rgb,255,59,48),0.12)",borderRadius:2,margin:"0 auto 20px"}}/>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"var(--cm-red,#FF3B30)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:6}}>// MEAL {overageModal.slot} LOGGED</div>
              <div style={{fontFamily:"'Archivo',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:22,color:"var(--cm-red,#FF3B30)",lineHeight:0.95,marginBottom:14}}>
                {getOverageHeadline(profile?.goal).replace('.','')}<span style={{color:"var(--cm-red,#FF3B30)"}}>.</span>
              </div>
              <div style={{fontSize:14,color:"rgba(var(--cm-red-rgb,255,59,48),0.6)",lineHeight:1.55,marginBottom:16}}>
                {getOverageCopy(profile?.goal,overageModal.slot,overageModal.overage,overageModal.remaining.length)}
              </div>
              {overageModal.remaining.length>0&&(
                <div style={{background:"rgba(var(--cm-red-rgb,255,59,48),0.05)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.12)",borderRadius:10,padding:"10px 14px",marginBottom:18}}>
                  {overageModal.remaining.map(s=>{
                    const newT=overageModal.newTargets[s]||0;
                    const oldT=overageModal.oldTargets[s]||0;
                    const diff=newT-oldT;
                    return(
                      <div key={s} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(var(--cm-red-rgb,255,59,48),0.5)",letterSpacing:"0.08em",textTransform:"uppercase"}}>{getSlotLabel(s)}</div>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:9}}>
                          <span style={{color:"var(--cm-red,#FF3B30)"}}>{newT} kcal</span>
                          {diff!==0&&<span style={{color:"var(--cm-red,#FF3B30)",marginLeft:4}}>({diff>0?"+":""}{diff})</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button onClick={()=>setOverageModal(null)} style={{width:"100%",padding:"14px",background:"var(--cm-red,#FF3B30)",color:"#fff",border:"none",borderRadius:12,fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>GOT IT</button>
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
                    <button onPointerDown={()=>_hL()} onClick={()=>setFuelScreen('kitchen')} style={{background:'none',border:'none',color:'rgba(255,255,255,0.85)',fontSize:20,cursor:'pointer',padding:'0 4px 0 0',lineHeight:1,flexShrink:0}}>←</button>
                    <div>
                      <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.6)',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:4}}>Meal Prep</div>
                      <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:800,fontSize:26,letterSpacing:'-0.01em',color:'#FFFFFF',lineHeight:1.05,textTransform:'uppercase'}}>Set up my week</div>
                    </div>
                  </div>
                  <div style={{fontFamily:"'Archivo',sans-serif",fontSize:13,fontWeight:500,color:'rgba(255,255,255,0.55)',marginBottom:24,lineHeight:1.55,marginTop:6}}>Cook once, fuel all week — built around your training schedule.</div>
                </motion.div>

                {/* Error */}
                {mealPrepError&&<motion.div initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}} style={{fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:600,color:'#FFFFFF',marginBottom:14,padding:'12px 16px',background:'rgba(255,255,255,0.14)',border:'1px solid rgba(255,255,255,0.25)',borderRadius:12}}>{mealPrepError}</motion.div>}

                {/* Section card surface — reusable */}
                {/* SELECT DAYS */}
                <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.07}}
                  style={{background:'var(--cm-paper,#FFFFFF)',border:'1px solid rgba(var(--cm-red-rgb,255,59,48),0.1)',borderRadius:16,padding:'16px 16px 14px',marginBottom:16,boxShadow:'0 2px 12px rgba(0,0,0,.08)'}}>
                  <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:'rgba(var(--cm-ink-rgb,10,10,10),0.45)',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:12}}>Select days</div>
                  <div style={{display:'flex',overflowX:'auto',scrollbarWidth:'none',msOverflowStyle:'none',WebkitOverflowScrolling:'touch',gap:8,paddingBottom:2}}>
                    {WDAYS_ORDER.map(day=>{
                      const sessionType=schedule?.[day]||'rest';
                      const isTraining=sessionType==='training'||sessionType==='cardio'||sessionType==='run'||sessionType==='hyrox';
                      const focusLabel=_sessShort(day,sessionType);
                      const selected=mealPrepPrefs.selectedDays.includes(day);
                      return(
                        <motion.button key={day} whileTap={{scale:0.88}} onPointerDown={()=>_hL()}
                          onClick={()=>{_hM();setMealPrepPrefs(p=>({...p,selectedDays:selected?p.selectedDays.filter(d=>d!==day):[...p.selectedDays,day]}));}}
                          style={{width:64,minWidth:64,background:selected?'var(--cm-red,#FF3B30)':'var(--cm-paper,#FFFFFF)',borderRadius:12,padding:'10px 4px',textAlign:'center',border:selected?'1.5px solid var(--cm-red,#FF3B30)':'1px solid rgba(var(--cm-ink-rgb,10,10,10),0.12)',cursor:'pointer',flexShrink:0,outline:'none',transition:'all 0.15s'}}>
                          <div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:700,color:selected?'#FFFFFF':'var(--cm-ink,#0A0A0A)',letterSpacing:'0.04em',marginBottom:5}}>{day.toUpperCase()}</div>
                          <div style={{display:'inline-block',background:selected?'rgba(255,255,255,0.22)':isTraining?'rgba(var(--cm-red-rgb,255,59,48),0.12)':'rgba(var(--cm-ink-rgb,10,10,10),0.06)',borderRadius:20,padding:'2px 7px',fontFamily:"'Archivo',sans-serif",fontSize:8,fontWeight:700,color:selected?'#FFFFFF':isTraining?'var(--cm-red,#FF3B30)':'rgba(var(--cm-ink-rgb,10,10,10),0.4)',letterSpacing:'0.04em'}}>{isTraining?focusLabel:'REST'}</div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* MEALS PER DAY */}
                <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.13}}
                  style={{background:'var(--cm-paper,#FFFFFF)',border:'1px solid rgba(var(--cm-red-rgb,255,59,48),0.1)',borderRadius:16,padding:'16px 16px 14px',marginBottom:16,boxShadow:'0 2px 12px rgba(0,0,0,.08)'}}>
                  <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:'rgba(var(--cm-ink-rgb,10,10,10),0.45)',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:12}}>Meals per day</div>
                  <div style={{display:'flex',gap:8}}>
                    {[2,3,4,6].map(n=>{
                      const sel=mealPrepPrefs.mealsPerDay===n;
                      return(
                        <motion.button key={n} whileTap={{scale:0.9}} onPointerDown={()=>_hL()}
                          onClick={()=>{
                            _hM();
                            // 1. Update fitter immediately
                            setMealPrepPrefs(p=>({...p,mealsPerDay:n}));
                            // 2. Update slot-row display immediately (no reload needed)
                            setMealSlots(getSlotsForFreq(n));
                            // 3. Persist wprefs.mealFreq (existing path)
                            try{saveFlexPrefs({...(wPrefs||{}),mealFreq:String(n)});}catch{}
                            // 4. Persist profile_data.mealFreq (canonical source; merges, no clobber)
                            if(user)(async()=>{try{await sb.from("profiles").upsert({id:user.id,profile_data:{...(profile||{}),mealFreq:n}},{onConflict:"id"});}catch(e){console.error("[mealFreq upsert]",e);}})();
                            // 5. Freq change means a new plan will be generated — clear stale dismissals
                            setDismissedPlanned([]);
                            try{localStorage.removeItem(`cm_dismissed_planned_${today}`);}catch{}
                          }}
                          style={{flex:1,background:sel?'var(--cm-red,#FF3B30)':'var(--cm-paper,#FFFFFF)',border:sel?'1.5px solid var(--cm-red,#FF3B30)':'1px solid rgba(var(--cm-ink-rgb,10,10,10),0.12)',borderRadius:12,padding:'16px 0',fontFamily:"'Archivo',sans-serif",fontSize:16,fontWeight:800,color:sel?'#FFFFFF':'var(--cm-ink,#0A0A0A)',textAlign:'center',cursor:'pointer',outline:'none',transition:'all 0.15s'}}>
                          {n}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* DIET STYLE */}
                <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.19}}
                  style={{background:'var(--cm-paper,#FFFFFF)',border:'1px solid rgba(var(--cm-red-rgb,255,59,48),0.1)',borderRadius:16,padding:'16px 16px 14px',marginBottom:16,boxShadow:'0 2px 12px rgba(0,0,0,.08)'}}>
                  <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:'rgba(var(--cm-ink-rgb,10,10,10),0.45)',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:12}}>Diet style</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr',gap:10}}>
                    {(dietExpanded?DIET_PRESETS:DIET_PRESETS.filter(d=>['balanced','high-protein'].includes(d.id)||d.id===mealPrepPrefs.dietPreset)).map((d,di)=>{
                      const sel=mealPrepPrefs.dietPreset===d.id;
                      return(
                        <motion.button key={d.id} whileTap={{scale:0.98}} onPointerDown={()=>_hL()}
                          initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.21+di*0.035}}
                          onClick={()=>{
                            _hM();
                            setMealPrepPrefs(p=>({...p,dietPreset:d.id}));
                            try{if(typeof saveFlexPrefs==='function')saveFlexPrefs({...(wPrefs||{}),mealPrepDiet:d.id});}catch{}
                          }}
                          style={{position:'relative',display:'block',width:'100%',aspectRatio:'16/10',background:`linear-gradient(135deg,rgba(${sel?'255,59,48':'30,10,10'},${sel?'0.32':'0.18'}),rgba(0,0,0,0.85))`,border:sel?'2px solid var(--cm-red,#FF3B30)':'1px solid rgba(var(--cm-red-rgb,255,59,48),0.3)',borderRadius:16,cursor:'pointer',outline:'none',textAlign:'left',overflow:'hidden',padding:0,boxShadow:sel?'0 4px 18px rgba(var(--cm-red-rgb,255,59,48),0.22)':'0 2px 12px rgba(0,0,0,.10)',transition:'box-shadow 0.15s'}}>
                          {/* full-bleed photo (gradient fallback behind until images exist) */}
                          <img src={`/diet-images/${d.id}.jpg`} alt={d.label} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.display='none';}}/>
                          {/* legibility scrim */}
                          <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.78) 0%,rgba(0,0,0,0.30) 42%,rgba(0,0,0,0) 72%)'}}/>
                          {/* badge top-left */}
                          {d.badge&&<span style={{position:'absolute',top:10,left:10,fontFamily:"'Archivo',sans-serif",fontSize:8,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',padding:'3px 9px',borderRadius:999,background:d.badge==='NEW'?'rgba(34,197,94,0.95)':d.badge==='TRENDING'?'rgba(254,160,32,0.95)':'rgba(var(--cm-red-rgb,255,59,48),0.95)',color:'#fff'}}>{d.badge}</span>}
                          {/* selected check top-right */}
                          {sel&&<div style={{position:'absolute',top:10,right:10,width:27,height:27,borderRadius:999,background:'var(--cm-red,#FF3B30)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,.35)'}}><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M4 8.2l2.6 2.6 5-5.6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}
                          {/* white plate behind text — dark-on-white, legible over any photo */}
                          <div style={{position:'absolute',left:12,bottom:12,maxWidth:'calc(100% - 24px)',background:'var(--cm-paper,#FFFFFF)',borderRadius:12,padding:'9px 13px',boxShadow:'0 2px 10px rgba(0,0,0,0.28)'}}>
                            <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:800,fontSize:18,letterSpacing:'-0.01em',color:'var(--cm-ink,#0A0A0A)',textTransform:'uppercase',lineHeight:1}}>{d.label}</div>
                            <div style={{fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:500,color:'rgba(var(--cm-ink-rgb,10,10,10),0.55)',marginTop:3,lineHeight:1.3}}>{DIET_DESC[d.id]||''}</div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                  <button onClick={()=>{_hL();setDietExpanded(v=>!v);}} style={{marginTop:12,background:'none',border:'none',fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:700,color:'var(--cm-red,#FF3B30)',letterSpacing:'0.04em',textTransform:'uppercase',cursor:'pointer',padding:'4px 0'}}>{dietExpanded?'Fewer styles ↑':'More styles ↓'}</button>
                </motion.div>

                {/* PREP TIME */}
                <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.25}}
                  style={{background:'var(--cm-paper,#FFFFFF)',border:'1px solid rgba(var(--cm-red-rgb,255,59,48),0.1)',borderRadius:16,padding:'16px 16px 14px',marginBottom:16,boxShadow:'0 2px 12px rgba(0,0,0,.08)'}}>
                  <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:'rgba(var(--cm-ink-rgb,10,10,10),0.45)',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:12}}>Prep time</div>
                  <div style={{display:'flex',gap:8}}>
                    {[['30min','30 MIN'],['1hr','1 HOUR'],['2hr+','2+ HRS']].map(([val,label])=>{
                      const sel=mealPrepPrefs.prepTime===val;
                      return(
                        <motion.button key={val} whileTap={{scale:0.92}} onPointerDown={()=>_hL()}
                          onClick={()=>{_hM();setMealPrepPrefs(p=>({...p,prepTime:val}));}}
                          style={{flex:1,background:sel?'var(--cm-red,#FF3B30)':'var(--cm-paper,#FFFFFF)',border:sel?'1.5px solid var(--cm-red,#FF3B30)':'1px solid rgba(var(--cm-ink-rgb,10,10,10),0.12)',borderRadius:12,padding:'14px 0',fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:700,letterSpacing:'0.04em',color:sel?'#FFFFFF':'var(--cm-ink,#0A0A0A)',textAlign:'center',cursor:'pointer',outline:'none',transition:'all 0.15s'}}>
                          {label}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* RESTRICTIONS & ALLERGIES */}
                <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.30}}
                  style={{background:'var(--cm-paper,#FFFFFF)',border:'1px solid rgba(var(--cm-red-rgb,255,59,48),0.1)',borderRadius:16,padding:'16px 16px 14px',marginBottom:16,boxShadow:'0 2px 12px rgba(0,0,0,.08)'}}>
                  <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:'rgba(var(--cm-ink-rgb,10,10,10),0.45)',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:12}}>Restrictions &amp; allergies</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
                    {/* "None" = no restrictions == empty dietaryPrefs. Mutually exclusive with the
                        allergy chips by construction: selecting None clears all; selecting any real
                        allergy makes the array non-empty so None deselects itself. Stored value is
                        the empty array — the filter's existing "no restrictions" state, never a tag. */}
                    {(()=>{const active=mealPrepPrefs.dietaryPrefs.length===0;return(
                      <motion.button key="None" whileTap={{scale:0.9}} onPointerDown={()=>_hL()}
                        onClick={()=>{_hM();setMealPrepPrefs(p=>({...p,dietaryPrefs:[]}));}}
                        style={{background:active?'var(--cm-red,#FF3B30)':'var(--cm-paper,#FFFFFF)',border:active?'1.5px solid var(--cm-red,#FF3B30)':'1px solid rgba(var(--cm-ink-rgb,10,10,10),0.12)',borderRadius:999,padding:'9px 18px',fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:600,letterSpacing:'0.02em',color:active?'#FFFFFF':'var(--cm-ink,#0A0A0A)',cursor:'pointer',outline:'none',transition:'all 0.15s'}}>
                        None
                      </motion.button>
                    );})()}
                    {['No Dairy','No Gluten','No Pork','No Shellfish','No Eggs','No Nuts'].map(chip=>{
                      const active=mealPrepPrefs.dietaryPrefs.includes(chip);
                      return(
                        <motion.button key={chip} whileTap={{scale:0.9}} onPointerDown={()=>_hL()}
                          onClick={()=>{_hM();setMealPrepPrefs(p=>({...p,dietaryPrefs:active?p.dietaryPrefs.filter(c=>c!==chip):[...p.dietaryPrefs,chip]}));}}
                          style={{background:active?'var(--cm-red,#FF3B30)':'var(--cm-paper,#FFFFFF)',border:active?'1.5px solid var(--cm-red,#FF3B30)':'1px solid rgba(var(--cm-ink-rgb,10,10,10),0.12)',borderRadius:999,padding:'9px 18px',fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:600,letterSpacing:'0.02em',color:active?'#FFFFFF':'var(--cm-ink,#0A0A0A)',cursor:'pointer',outline:'none',transition:'all 0.15s'}}>
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
                    if(noDairy&&noEgg&&!noNut)return(<div style={{background:'rgba(var(--cm-red-rgb,255,59,48),0.06)',border:'1px solid rgba(var(--cm-red-rgb,255,59,48),0.16)',borderRadius:10,padding:'8px 14px',marginBottom:0}}>
                      <div style={{fontFamily:"'Archivo',sans-serif",fontSize:9,fontWeight:700,color:'var(--cm-red,#FF3B30)',letterSpacing:'0.14em',marginBottom:3,textTransform:'uppercase'}}>Heads up</div>
                      <div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:500,color:'rgba(var(--cm-red-rgb,255,59,48),0.65)',lineHeight:1.6}}>No Dairy + No Eggs is effectively a vegan protein profile. Options will be narrow — consider tofu, tempeh, legumes.</div>
                    </div>);
                    if(tightCount>=3)return(<div style={{background:'rgba(var(--cm-red-rgb,255,59,48),0.06)',border:'1px solid rgba(var(--cm-red-rgb,255,59,48),0.16)',borderRadius:10,padding:'8px 14px',marginBottom:0}}>
                      <div style={{fontFamily:"'Archivo',sans-serif",fontSize:9,fontWeight:700,color:'var(--cm-red,#FF3B30)',letterSpacing:'0.14em',marginBottom:3,textTransform:'uppercase'}}>Very restrictive combo</div>
                      <div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:500,color:'rgba(var(--cm-red-rgb,255,59,48),0.65)',lineHeight:1.6}}>No Dairy + No Eggs + No Nuts removes most protein staples. Some meal slots may not fill safely — the filter will flag them.</div>
                    </div>);
                    return null;
                  })()}
                </motion.div>

                {/* Safety disclaimer — PERSISTENT (always shown, not gated on having a restriction selected) */}
                <AllergyDisclaimer style={{marginBottom:20}}/>

                {/* Generate button */}
                <motion.button
                  whileTap={{scale:0.97}}
                  onPointerDown={()=>_hM()}
                  onClick={generateMealPrepPlan}
                  disabled={mealPrepPrefs.selectedDays.length===0}
                  initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.34}}
                  style={{width:'100%',background:mealPrepPrefs.selectedDays.length===0?'rgba(255,255,255,0.4)':'#FFFFFF',border:'none',borderRadius:999,padding:17,fontFamily:"'Archivo',sans-serif",fontWeight:800,fontSize:14,color:'var(--cm-red,#FF3B30)',letterSpacing:'0.04em',textTransform:'uppercase',cursor:mealPrepPrefs.selectedDays.length===0?'not-allowed':'pointer',opacity:mealPrepPrefs.selectedDays.length===0?0.6:1,boxShadow:'0 4px 18px rgba(0,0,0,.12)',marginBottom:8}}>
                  Generate my week →
                </motion.button>
              </div>
            )}

            {/* ── GENERATING SCREEN ── */}
            {mealPrepScreen==='generating'&&(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'85vh',paddingTop:60}}>
                <style>{`@keyframes mpPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.25;transform:scale(0.88)}}@keyframes mpOrbit{from{transform:rotate(0deg) translateX(44px) rotate(0deg)}to{transform:rotate(360deg) translateX(44px) rotate(-360deg)}}@keyframes mpBar{0%,100%{transform:scaleY(0.3)}50%{transform:scaleY(1)}}`}</style>
                {/* Pulsing logo ring */}
                <div style={{position:'relative',width:120,height:120,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <div style={{width:88,height:88,borderRadius:'50%',border:'2px solid rgba(var(--cm-red-rgb,255,59,48),0.25)',position:'absolute'}}/>
                  <div style={{width:64,height:64,borderRadius:'50%',background:'radial-gradient(circle,rgba(var(--cm-red-rgb,255,59,48),0.25),rgba(var(--cm-red-rgb,255,59,48),0.05))',border:'1.5px solid rgba(var(--cm-red-rgb,255,59,48),0.4)',animation:'mpPulse 1.6s ease-in-out infinite',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="rgba(var(--cm-red-rgb,255,59,48),0.3)"/><path d="M8 12.5l2.5 2.5 5-5" stroke="var(--cm-red,#FF3B30)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  {/* Orbiting dot */}
                  <div style={{position:'absolute',inset:0,animation:'mpOrbit 2s linear infinite'}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:'var(--cm-red,#FF3B30)',boxShadow:'0 0 10px rgba(var(--cm-red-rgb,255,59,48),0.8)'}}/>
                  </div>
                </div>
                <div style={{fontFamily:"'Archivo',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:38,color:'#f5f5f0',textAlign:'center',marginTop:28,textTransform:'uppercase',lineHeight:0.95}}>BUILDING<br/>YOUR WEEK.</div>
                <div style={{...mno,fontSize:10,color:'rgba(245,245,240,0.45)',textAlign:'center',letterSpacing:'0.14em',marginTop:18,minHeight:18,textTransform:'uppercase'}}>{MP_STATUSES[mpStatusIdx]}</div>
                {/* Animated equaliser bars */}
                <div style={{display:'flex',gap:4,marginTop:28,alignItems:'center',height:28}}>
                  {[0,1,2,3,4].map(i=>(
                    <div key={i} style={{width:4,height:22,background:'rgba(var(--cm-red-rgb,255,59,48),0.6)',borderRadius:2,transformOrigin:'bottom',animation:`mpBar 1.1s ease-in-out infinite`,animationDelay:`${i*0.13}s`}}/>
                  ))}
                </div>
              </div>
            )}

            {/* ── PLAN SCREEN ── */}
            {mealPrepScreen==='plan'&&mealPrepPlan&&(()=>{
              const totalMeals=(mealPrepPlan.days||[]).reduce((s,d)=>s+(d.meals||[]).filter(m=>!m.unfillable&&m.name).length,0);
              // EST PREP — the user's chosen prep-time window (fitter meals carry no per-meal prepTime).
              const prepDisplay=({'30min':'30 min','1hr':'1 hr','2hr+':'2+ hrs'})[mealPrepPrefs.prepTime]||'1 hr';
              // GROCERY — merged unique-ingredient count, keyed exactly like the grocery sheet (by item name);
              // mealPrepPlan.groceryList is null (the list is built lazily when the sheet opens).
              const _grocSet=new Set();
              for(const d of (mealPrepPlan.days||[])) for(const m of (d.meals||[])){ if(!m||m.unfillable) continue; for(const ing of (m.ingredients||m.ing||[])){ const nm=(typeof ing==='object')?ing?.item:String(ing); if(nm) _grocSet.add(String(nm).toLowerCase().trim()); } }
              const groceryCount=_grocSet.size;
              return(
                <div style={{paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 96px)'}}>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes mpBarAnim{0%,100%{transform:scaleY(0.3)}50%{transform:scaleY(1)}}`}</style>

                  {/* Allergen notice — muted Archivo */}
                  {mealPrepWarning&&<motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} style={{background:'rgba(255,255,255,0.10)',border:'1px solid rgba(255,255,255,0.18)',borderRadius:12,padding:'10px 14px',marginBottom:16}}>
                    <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.75)',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:4}}>Allergen notice</div>
                    <div style={{fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:500,color:'rgba(255,255,255,0.8)',lineHeight:1.5}}>{mealPrepWarning}</div>
                  </motion.div>}
                  {mealPrepPrefs.dietaryPrefs.length>0&&!mealPrepWarning&&<div style={{marginBottom:14}}>
                    <div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:500,color:'rgba(255,255,255,0.5)',lineHeight:1.5}}>Allergy filters applied. Always verify ingredients — not medical advice.</div>
                  </div>}

                  {/* Header */}
                  <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} style={{display:'flex',alignItems:'center',gap:14,marginBottom:18}}>
                    <button onPointerDown={()=>_hL()} onClick={()=>setMealPrepScreen('setup')} style={{background:'none',border:'none',color:'rgba(255,255,255,0.85)',fontSize:22,cursor:'pointer',padding:'0 4px 0 0',lineHeight:1,flexShrink:0}}>←</button>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.65)',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:4}}>Your week · Ready</div>
                      <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:800,fontSize:26,letterSpacing:'-0.01em',color:'#FFFFFF',lineHeight:1}}>Your week</div>
                    </div>
                    <button onPointerDown={()=>_hM()} onClick={()=>generateMealPrepPlan()} style={{background:'rgba(255,255,255,0.16)',border:'none',borderRadius:999,padding:'9px 16px',fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:700,color:'#fff',letterSpacing:'0.02em',cursor:'pointer',flexShrink:0}}>Regenerate</button>
                  </motion.div>

                  {/* Summary strip — clean Archivo stat chips */}
                  <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.06}} style={{background:'var(--cm-paper,#FFFFFF)',borderRadius:16,padding:'16px',marginBottom:22,display:'flex',justifyContent:'space-around',boxShadow:'0 2px 12px rgba(0,0,0,.08)'}}>
                    {[[String(totalMeals),'meals'],[prepDisplay,'est prep'],[String(groceryCount),'grocery']].map(([val,lbl])=>(
                      <div key={lbl} style={{textAlign:'center'}}>
                        <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:800,fontSize:22,letterSpacing:'-0.01em',color:'var(--cm-red,#FF3B30)',lineHeight:1}}>{val}</div>
                        <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:'rgba(var(--cm-ink-rgb,10,10,10),0.4)',letterSpacing:'0.1em',marginTop:4,textTransform:'uppercase'}}>{lbl}</div>
                      </div>
                    ))}
                  </motion.div>

                  {/* Day sections */}
                  {(mealPrepPlan.days||[]).map((day,dayIndex)=>{
                    const isRegDay=regeneratingDay===dayIndex;
                    const _dp=wPrefs?.dayPlan?.[day.day];
                    const isTrainingDay=!!(_dp?.run||_dp?.lift||(day.sessionType&&day.sessionType!=='rest'&&day.sessionType!=='Rest'));
                    const sessFull=_sessFull(day.day,day.sessionType); // dayPlan-first: "Upper Day" / "5 Mile Run" / "Rest"
                    const sessCol=_dp?.run?'#60a5fa':_dp?.lift?'#fff':(day.sessionType==='run'||day.sessionType==='cardio')?'#60a5fa':(day.sessionType==='rest')?'rgba(255,255,255,0.55)':'#fff';
                    return(
                      <motion.div key={dayIndex} initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:0.08+dayIndex*0.06}} style={{marginBottom:18}}>
                        {/* Day header row */}
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,paddingLeft:2,gap:10}}>
                          <div style={{minWidth:0}}>
                            <div style={{fontFamily:"'Archivo',sans-serif",fontSize:14,fontWeight:800,letterSpacing:'0.02em',textTransform:'uppercase',color:'#fff',lineHeight:1}}>
                              {day.day?.slice(0,3)} <span style={{opacity:0.5}}>·</span> <span style={{color:sessCol,fontWeight:700}}>{sessFull}</span>
                            </div>
                            <div style={{display:'flex',gap:9,marginTop:6,flexWrap:'wrap'}}>
                              <span style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.7)'}}>{(day.totalCalories||0).toLocaleString()} kcal</span>
                              <span style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.55)'}}>{day.totalProtein||0}P · {day.totalCarbs||0}C · {day.totalFat||0}F</span>
                            </div>
                          </div>
                          <button onPointerDown={()=>_hL()} onClick={()=>!isRegDay&&regenerateDay(dayIndex)}
                            style={{background:'rgba(255,255,255,0.14)',border:'none',borderRadius:999,padding:'8px 14px',display:'flex',alignItems:'center',gap:6,cursor:'pointer',flexShrink:0,opacity:isRegDay?0.45:1,outline:'none'}}>
                            {isRegDay
                              ?<div style={{width:13,height:13,border:'1.5px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
                              :<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 8A6 6 0 002.5 4"/><path d="M2 8A6 6 0 0013.5 12"/><polyline points="2,1 2,4 5,4"/><polyline points="14,12 14,15 11,15"/></svg>
                            }
                            <span style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:700,color:'#fff',letterSpacing:'0.04em'}}>Redo</span>
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
                                background:'var(--cm-paper,#FFFFFF)',
                                border:'1px dashed rgba(254,160,32,0.2)',
                                borderRadius:14,marginBottom:8,padding:'14px 14px',
                                display:'flex',alignItems:'center',gap:12,opacity:0.65,
                                boxShadow:'0 2px 12px rgba(0,0,0,.08)',
                              }}>
                                <div style={{fontSize:26,flexShrink:0,lineHeight:1}}>🍽️</div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:'#d97706',letterSpacing:'0.12em',marginBottom:3,textTransform:'uppercase'}}>
                                    Meal {mealIndex+1} · {(meal.slot||'')} · thin pool
                                  </div>
                                  <div style={{fontFamily:"'Archivo',sans-serif",fontSize:13,fontWeight:500,color:'rgba(var(--cm-ink-rgb,10,10,10),0.5)',lineHeight:1.3}}>
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
                              onClick={()=>{if(!isRegMeal){_hM();setDetailFrom('plan');setMealIngChecked(new Set());setActiveMealDetail({day,meal,dayIndex,mealIndex});}}}
                              style={{
                                background:'var(--cm-paper,#FFFFFF)',
                                border:'1px solid rgba(var(--cm-red-rgb,255,59,48),0.14)',
                                borderRadius:14,
                                marginBottom:8,
                                padding:'14px 14px',
                                display:'flex',
                                alignItems:'center',
                                gap:12,
                                boxShadow:'0 2px 12px rgba(0,0,0,.08)',
                                cursor:'pointer',
                                opacity:isRegMeal?0.45:1,
                              }}
                            >
                              <FoodIcon name={meal.name} size={44} userId={user?.id} />
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:'rgba(var(--cm-red-rgb,255,59,48),0.55)',letterSpacing:'0.12em',marginBottom:3,textTransform:'uppercase'}}>Meal {mealIndex+1}</div>
                                <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:16,letterSpacing:'-0.01em',color:'var(--cm-ink,#0A0A0A)',lineHeight:1.15,marginBottom:7,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{meal.name}</div>
                                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                                  <span style={{background:'rgba(var(--cm-red-rgb,255,59,48),0.1)',borderRadius:20,padding:'3px 9px',fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:'var(--cm-red,#FF3B30)'}}>{meal.calories} kcal</span>
                                  <span style={{background:'rgba(34,197,94,0.1)',borderRadius:20,padding:'3px 9px',fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:'#16a34a'}}>{meal.protein}P</span>
                                  <span style={{background:'rgba(96,165,250,0.12)',borderRadius:20,padding:'3px 9px',fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:'#3b82f6'}}>{meal.carbs}C</span>
                                  <span style={{background:'rgba(254,160,32,0.12)',borderRadius:20,padding:'3px 9px',fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,color:'#d97706'}}>{meal.fat}F</span>
                                </div>
                              </div>
                              {/* per-meal swap (⇄) — stops propagation so it doesn't open the detail sheet */}
                              {isRegMeal
                                ?<div style={{width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><div style={{width:14,height:14,border:'1.5px solid var(--cm-red,#FF3B30)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/></div>
                                :<button onPointerDown={e=>{e.stopPropagation();_hL();}} onClick={e=>{e.stopPropagation();_hM();regenerateMeal(dayIndex,mealIndex);}} aria-label="Swap meal" style={{background:'rgba(var(--cm-red-rgb,255,59,48),0.08)',border:'1px solid rgba(var(--cm-red-rgb,255,59,48),0.18)',borderRadius:10,width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:'pointer',padding:0}}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--cm-red,#FF3B30)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                                  </button>
                              }
                            </motion.div>
                          );
                        })}
                        {isTrainingDay&&(
                          <div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:500,color:'rgba(255,255,255,0.45)',paddingLeft:4,paddingTop:2}}>Carbs elevated to fuel {sessFull.toLowerCase()}.</div>
                        )}
                      </motion.div>
                    );
                  })}
                  {/* ── ACTION BAR — in normal flow at the end of the list; scrolls with content, sits above the tab bar (cleared by the container's paddingBottom). ── */}
                  <div style={{display:'flex',gap:10,marginTop:12}}>
                    <motion.button whileTap={{scale:0.96}} onPointerDown={()=>_hL()} onClick={()=>{_hM();setGroceryFrom('plan');setShowGroceryList(true);}}
                      style={{flex:1,background:'rgba(255,255,255,0.16)',border:'none',borderRadius:999,padding:'14px',fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:13,color:'#fff',letterSpacing:'0.02em',cursor:'pointer'}}>
                      Grocery
                    </motion.button>
                    <motion.button whileTap={{scale:0.96}} onPointerDown={()=>_hL()} onClick={()=>setMpSaveConfirm(true)}
                      style={{flex:1.3,background:'var(--cm-paper,#FFFFFF)',border:'none',borderRadius:999,padding:'14px',fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:13,color:'var(--cm-red,#FF3B30)',letterSpacing:'0.02em',cursor:'pointer',boxShadow:'0 6px 20px rgba(0,0,0,.28)'}}>
                      Save
                    </motion.button>
                  </div>
                </div>
              );
            })()}

            {/* ── MEAL DETAIL SHEET ── */}
            <AnimatePresence>
            {activeMealDetail&&(()=>{
              const {meal,day}=activeMealDetail;
              const cal=meal?.calories||0, pro=meal?.protein||0, carb=meal?.carbs||0, fat=meal?.fat||0;
              const ings=meal?.ingredients||meal?.ing||[];
              const inst=meal?.instructions||null;
              const dietTags=(meal?.dietTags||[]).filter(t=>t&&t!=='none');
              const allergenTags=(meal?.allergenTags||[]);
              const maxMacro=Math.max(pro,carb,fat)||1;
              const sessFull=day?_sessFull(day.day,day.sessionType):'';
              const fmtMin=(m)=>{m=Math.round(m||0);return m>=60?`${Math.floor(m/60)}h${m%60?` ${m%60}m`:''}`:`${m}m`;};
              const MB=[{label:'Protein',value:pro,color:'var(--cm-red,#FF3B30)'},{label:'Carbs',value:carb,color:'#60a5fa'},{label:'Fat',value:fat,color:'#FEA020'}];
              const stepMeta=(s)=>[s.type,s.duration_min?fmtMin(s.duration_min):null,s.appliance,s.temp?`${s.temp.value}°${s.temp.unit}`:null].filter(Boolean).join(' · ');
              const card={background:'var(--cm-paper,#FFFFFF)',borderRadius:16,padding:'16px',marginBottom:14,boxShadow:'0 2px 12px rgba(0,0,0,.10)'};
              const eyebrow={fontFamily:"'Archivo',sans-serif",fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase'};
              const chip={fontFamily:"'Archivo',sans-serif",fontSize:10.5,fontWeight:600,color:'rgba(255,255,255,0.92)',background:'rgba(255,255,255,0.14)',borderRadius:999,padding:'5px 11px',textTransform:'capitalize'};
              return(
                <motion.div key="meal-detail-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.18}}
                  style={{position:'fixed',inset:0,zIndex:500,background:'var(--cm-red,#FF3B30)'}} onClick={()=>{_hL();closeMealDetail();}}>
                  <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',damping:28,stiffness:290}}
                    style={{position:'absolute',inset:0,overflowY:'auto',WebkitOverflowScrolling:'touch'}} onClick={e=>e.stopPropagation()}>
                    <div style={{padding:'max(52px,env(safe-area-inset-top,48px)) 18px max(40px,env(safe-area-inset-bottom,28px))'}}>
                      {/* Close */}
                      <button onPointerDown={()=>_hL()} onClick={()=>{_hM();closeMealDetail();}}
                        style={{background:'rgba(255,255,255,0.16)',border:'none',borderRadius:999,padding:'8px 16px',display:'flex',alignItems:'center',gap:7,cursor:'pointer',marginBottom:22}}>
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M10 4l-4 4 4 4"/></svg>
                        <span style={{...eyebrow,fontSize:10,color:'#fff'}}>Close</span>
                      </button>
                      {/* Title + session */}
                      {day&&<div style={{...eyebrow,fontSize:10,color:'rgba(255,255,255,0.7)',marginBottom:6}}>{day.day?.slice(0,3)} · {sessFull}</div>}
                      <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:800,fontSize:30,letterSpacing:'-0.01em',color:'#fff',lineHeight:1.05,marginBottom:18}}>{meal?.name}</div>

                      {/* Macros */}
                      <div style={card}>
                        <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:14}}>
                          <span style={{fontFamily:"'Archivo',sans-serif",fontWeight:800,fontSize:30,letterSpacing:'-0.01em',color:'var(--cm-ink,#0A0A0A)',lineHeight:1}}>{cal}</span>
                          <span style={{...eyebrow,fontSize:11,color:'rgba(var(--cm-ink-rgb,10,10,10),0.4)'}}>kcal</span>
                        </div>
                        {MB.map(({label,value,color})=>(
                          <div key={label} style={{marginBottom:10}}>
                            <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                              <span style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:700,color:'rgba(var(--cm-ink-rgb,10,10,10),0.5)',letterSpacing:'0.04em'}}>{label}</span>
                              <span style={{fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:700,color}}>{value}g</span>
                            </div>
                            <div style={{height:6,background:'rgba(var(--cm-ink-rgb,10,10,10),0.07)',borderRadius:3,overflow:'hidden'}}>
                              <motion.div style={{height:'100%',background:color,borderRadius:3}} initial={{width:0}} animate={{width:`${(value/maxMacro)*100}%`}} transition={{duration:0.7,ease:'easeOut'}}/>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Time · servings · tags */}
                      {(inst||dietTags.length>0||allergenTags.length>0||meal?.servings)&&(
                        <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:16}}>
                          {inst?.total_time_min!=null&&<span style={chip}>{fmtMin(inst.total_time_min)} total</span>}
                          {(inst?.yield_servings||meal?.servings)&&<span style={chip}>serves {inst?.yield_servings||meal?.servings}</span>}
                          {meal?.recipe_kind&&<span style={chip}>{meal.recipe_kind}</span>}
                          {dietTags.map(t=><span key={'d'+t} style={chip}>{String(t).replace(/[_-]/g,' ')}</span>)}
                          {allergenTags.map(t=><span key={'a'+t} style={chip}>contains {String(t).replace(/[_-]/g,' ')}</span>)}
                        </div>
                      )}

                      {/* Ingredients — scaled, checkable */}
                      {ings.length>0&&(
                        <div style={card}>
                          <div style={{...eyebrow,fontSize:10,color:'rgba(var(--cm-ink-rgb,10,10,10),0.42)',marginBottom:10}}>Ingredients</div>
                          {ings.map((ing,i)=>{
                            const nm=typeof ing==='object'?(ing?.item||''):String(ing);
                            const amt=typeof ing==='object'?(ing?.amount||''):'';
                            const checked=mealIngChecked.has(i);
                            return(
                              <div key={i} onClick={()=>setMealIngChecked(prev=>{const n=new Set(prev);if(n.has(i))n.delete(i);else n.add(i);return n;})}
                                style={{display:'flex',alignItems:'center',gap:11,padding:'9px 0',borderBottom:i<ings.length-1?'1px solid rgba(var(--cm-ink-rgb,10,10,10),0.06)':'none',cursor:'pointer'}}>
                                <div style={{width:20,height:20,borderRadius:6,flexShrink:0,border:checked?'none':'1.5px solid rgba(var(--cm-ink-rgb,10,10,10),0.2)',background:checked?'var(--cm-red,#FF3B30)':'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                  {checked&&<svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M2 7l3.5 3.5 5.5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </div>
                                <FoodIcon name={nm||String(ing)} size={28} userId={user?.id}/>
                                <div style={{flex:1,minWidth:0,fontFamily:"'Archivo',sans-serif",fontWeight:600,fontSize:14,color:checked?'rgba(var(--cm-ink-rgb,10,10,10),0.35)':'var(--cm-ink,#0A0A0A)',textDecoration:checked?'line-through':'none',textTransform:'capitalize',lineHeight:1.15,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{nm||String(ing)}</div>
                                {amt&&<div style={{fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:700,color:checked?'rgba(var(--cm-ink-rgb,10,10,10),0.3)':'rgba(var(--cm-ink-rgb,10,10,10),0.55)',flexShrink:0}}>{amt}</div>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Steps — only when authored */}
                      {inst?.sections?.length>0&&(
                        <div style={card}>
                          <div style={{...eyebrow,fontSize:10,color:'rgba(var(--cm-ink-rgb,10,10,10),0.42)',marginBottom:12}}>Steps</div>
                          {inst.sections.map((sec,si)=>(
                            <div key={si} style={{marginBottom:si<inst.sections.length-1?16:0}}>
                              {inst.sections.length>1&&sec.title&&<div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:800,color:'var(--cm-red,#FF3B30)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:9}}>{sec.title}</div>}
                              {(sec.steps||[]).map((st,sti)=>(
                                <div key={sti} style={{display:'flex',gap:11,marginBottom:11}}>
                                  <div style={{width:23,height:23,flexShrink:0,borderRadius:999,background:'rgba(var(--cm-red-rgb,255,59,48),0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:800,color:'var(--cm-red,#FF3B30)',marginTop:1}}>{st.n}</div>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontFamily:"'Archivo',sans-serif",fontSize:14,fontWeight:500,color:'var(--cm-ink,#0A0A0A)',lineHeight:1.5}}>{st.text}</div>
                                    {stepMeta(st)&&<div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:600,color:'rgba(var(--cm-ink-rgb,10,10,10),0.4)',letterSpacing:'0.04em',textTransform:'uppercase',marginTop:3}}>{stepMeta(st)}</div>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Make ahead / storage / reheat */}
                      {inst&&(inst.make_ahead||inst.storage||inst.reheat)&&(
                        <div style={card}>
                          {[['Make ahead',inst.make_ahead],['Storage',inst.storage],['Reheat',inst.reheat]].filter(([,v])=>v).map(([k,v],ri,arr)=>(
                            <div key={k} style={{marginBottom:ri<arr.length-1?12:0}}>
                              <div style={{...eyebrow,fontSize:9,color:'var(--cm-red,#FF3B30)',marginBottom:3}}>{k}</div>
                              <div style={{fontFamily:"'Archivo',sans-serif",fontSize:13,fontWeight:500,color:'rgba(var(--cm-ink-rgb,10,10,10),0.7)',lineHeight:1.5}}>{v}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Swap */}
                      <motion.button whileTap={{scale:0.97}} onPointerDown={()=>_hL()}
                        onClick={()=>{_hM();const from=detailFrom;const di=activeMealDetail.dayIndex,mi=activeMealDetail.mealIndex;setActiveMealDetail(null);if(from==='kitchen')setFuelScreen('kitchen');regenerateMeal(di,mi);}}
                        style={{width:'100%',background:'rgba(255,255,255,0.14)',border:'none',borderRadius:14,padding:15,fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:13,color:'#fff',letterSpacing:'0.02em',cursor:'pointer',marginTop:4}}>
                        Swap this meal
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })()}
            </AnimatePresence>

            {/* ── GROCERY LIST BOTTOM SHEET (aisle-grouped · merged qty · check-off) ── */}
            {showGroceryList&&mealPrepPlan&&(()=>{
              const days=mealPrepPlan.days||[];
              const planKey=mealPrepPlan.generatedAt||'plan';
              const useMetric=profile?.wUnit==='kg';
              // Aggregate every meal ingredient → merge by item name, summing qty per unit.
              const agg=new Map();
              for(const d of days){ for(const m of (d.meals||[])){ if(!m||m.unfillable) continue; for(const ing of (m.ingredients||m.ing||[])){
                if(!ing) continue;
                const name=(typeof ing==='object')?ing.item:String(ing);
                if(!name) continue;
                const key=name.toLowerCase().trim();
                let n=(typeof ing==='object'&&typeof ing.qty==='number')?ing.qty:null;
                let u=(typeof ing==='object'&&ing.unit)?ing.unit:null;
                if(n==null&&typeof ing==='object'){ const p=parseGroceryAmt(ing.amount); n=p.n; if(!u)u=p.unit; } // legacy plan fallback
                const e=agg.get(key)||{item:name,unit:u,qty:0,count:0,summable:true};
                e.count+=1;
                if(n!=null){ if(e.unit==null)e.unit=u; if(u===e.unit)e.qty+=n; else e.summable=false; }
                agg.set(key,e);
              }}}
              const allItems=[...agg.values()];
              const byAisle={};
              for(const e of allItems){ const a=aisleForIngredient(e.item); (byAisle[a]=byAisle[a]||[]).push(e); }
              for(const a in byAisle) byAisle[a].sort((x,y)=>x.item.localeCompare(y.item));
              const aisles=GROCERY_AISLE_ORDER.filter(a=>byAisle[a]?.length);
              const totalItems=allItems.length;
              const gatheredSet=new Set(groceryGathered[planKey]||[]);
              const gatheredCount=allItems.filter(e=>gatheredSet.has(e.item.toLowerCase().trim())).length;
              const pct=totalItems?Math.round(gatheredCount/totalItems*100):0;
              const totalMeals=days.reduce((s,d)=>s+(d.meals||[]).filter(m=>!m.unfillable&&m.name).length,0);
              const prepLabel=({'30min':'~30m prep','1hr':'~1h prep','2hr':'~2h prep','3hr':'~3h prep'})[mealPrepPrefs.prepTime]||null;
              const diet=mealPrepPrefs.dietPreset||'balanced';
              const toggle=(k)=>{_hL();setGroceryGathered(prev=>{const cur=new Set(prev[planKey]||[]);if(cur.has(k))cur.delete(k);else cur.add(k);return{...prev,[planKey]:[...cur]};});};
              const cleanName=(s)=>{const n=String(s||'').replace(/,\s*(raw|cooked|atlantic|pacific|boneless|skinless|ground|whole|fresh|dried|chopped|sliced|diced)\b/gi,'').replace(/\s+/g,' ').trim();return n?n.charAt(0).toUpperCase()+n.slice(1):s;};
              // Aisle icons from the app's bundled fluent-emoji-flat pack (src/iconData.js).
              const AISLE_ICON={
                'Produce':'fluent-emoji-flat:green-salad',
                'Meat & Seafood':'fluent-emoji-flat:poultry-leg',
                'Dairy & Eggs':'fluent-emoji-flat:egg',
                'Pantry':'fluent-emoji-flat:sheaf-of-rice',
                'Frozen':'fluent-emoji-flat:ice-cream',
              };
              const labelEb={fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase'};
              return(
                <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.72)',zIndex:490}} onClick={()=>{_hL();closeGrocery();}}>
                  <motion.div
                    initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}
                    transition={{type:'spring',damping:28,stiffness:300}}
                    style={{position:'fixed',bottom:0,left:0,right:0,background:'var(--cm-red,#FF3B30)',borderRadius:'22px 22px 0 0',maxHeight:'90vh',overflowY:'auto',zIndex:500,paddingBottom:'max(28px,env(safe-area-inset-bottom,20px))',WebkitOverflowScrolling:'touch'}}
                    onClick={e=>e.stopPropagation()}
                  >
                    <div style={{width:38,height:4,background:'rgba(255,255,255,0.35)',borderRadius:2,margin:'14px auto 16px'}}/>
                    {/* Header */}
                    <div style={{padding:'0 20px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{...labelEb,fontSize:10,color:'rgba(255,255,255,0.7)',marginBottom:4}}>Cook once · this week</div>
                        <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:800,fontSize:26,letterSpacing:'-0.01em',color:'#fff',lineHeight:1}}>Grocery List</div>
                        <div style={{fontFamily:"'Archivo',sans-serif",fontSize:12,fontWeight:500,color:'rgba(255,255,255,0.7)',marginTop:6,textTransform:'capitalize'}}>{totalMeals} meals{prepLabel?` · ${prepLabel}`:''} · {diet}</div>
                      </div>
                      <button onPointerDown={()=>_hL()} onClick={()=>closeGrocery()} style={{background:'rgba(255,255,255,0.16)',border:'none',borderRadius:9,width:32,height:32,color:'#fff',fontSize:15,cursor:'pointer',lineHeight:1,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginLeft:12}}>✕</button>
                    </div>
                    {/* Progress */}
                    <div style={{padding:'0 20px',marginBottom:18}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:7}}>
                        <span style={{...labelEb,fontSize:11,color:'#fff'}}>{gatheredCount} of {totalItems} gathered</span>
                        <span style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.7)'}}>{pct}%</span>
                      </div>
                      <div style={{height:6,borderRadius:3,background:'rgba(255,255,255,0.22)',overflow:'hidden'}}>
                        <motion.div animate={{width:`${pct}%`}} transition={{type:'spring',damping:26,stiffness:240}} style={{height:'100%',borderRadius:3,background:'#fff'}}/>
                      </div>
                    </div>
                    {/* Aisle cards */}
                    <div style={{padding:'0 14px'}}>
                      {aisles.map(aisle=>{
                        const list=byAisle[aisle];
                        const aGathered=list.filter(e=>gatheredSet.has(e.item.toLowerCase().trim())).length;
                        const allDone=aGathered===list.length;
                        const collapsed=groceryCollapsed[aisle]??(list.length>7); // long aisles default-collapsed
                        return(
                          <div key={aisle} style={{background:'var(--cm-paper,#FFFFFF)',borderRadius:16,marginBottom:12,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.10)'}}>
                            <button onPointerDown={()=>_hL()} onClick={()=>setGroceryCollapsed(p=>({...p,[aisle]:!collapsed}))} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}>
                              <div style={{width:34,height:34,borderRadius:9,background:'rgba(var(--cm-ink-rgb,10,10,10),0.05)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,opacity:allDone?0.45:1}}>
                                <Icon icon={AISLE_ICON[aisle]} width={22} height={22}/>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{...labelEb,fontSize:11,color:'var(--cm-ink,#0A0A0A)'}}>{aisle}</div>
                                <div style={{fontFamily:"'Archivo',sans-serif",fontSize:11,fontWeight:600,color:allDone?'#16a34a':'rgba(var(--cm-ink-rgb,10,10,10),0.4)',marginTop:2}}>{allDone?'✓ all gathered':`${aGathered}/${list.length} gathered`}</div>
                              </div>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(var(--cm-ink-rgb,10,10,10),0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,transform:collapsed?'rotate(0deg)':'rotate(180deg)',transition:'transform .2s'}}><path d="M6 9l6 6 6-6"/></svg>
                            </button>
                            {!collapsed&&<div style={{borderTop:'1px solid rgba(var(--cm-ink-rgb,10,10,10),0.06)'}}>
                              {list.map(e=>{
                                const k=e.item.toLowerCase().trim();
                                const checked=gatheredSet.has(k);
                                const qtyStr=e.summable?toShoppingQty(e.item,e.qty,e.unit,useMetric):'';
                                return(
                                  <div key={k} onPointerDown={()=>_hL()} onClick={()=>toggle(k)} style={{display:'flex',alignItems:'center',gap:13,padding:'12px 16px',borderBottom:'1px solid rgba(var(--cm-ink-rgb,10,10,10),0.05)',cursor:'pointer'}}>
                                    <div style={{width:22,height:22,borderRadius:6,border:checked?'none':'1.5px solid rgba(var(--cm-ink-rgb,10,10,10),0.22)',background:checked?'var(--cm-red,#FF3B30)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .15s'}}>
                                      {checked&&<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 7l3.5 3.5 5.5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </div>
                                    <div style={{flex:1,minWidth:0}}>
                                      <div style={{fontFamily:"'Archivo',sans-serif",fontSize:15,fontWeight:checked?500:600,color:checked?'rgba(var(--cm-ink-rgb,10,10,10),0.3)':'var(--cm-ink,#0A0A0A)',textDecoration:checked?'line-through':'none',lineHeight:1.25}}>{cleanName(e.item)}</div>
                                      {e.count>1&&<div style={{fontFamily:"'Archivo',sans-serif",fontSize:10,fontWeight:600,color:'rgba(var(--cm-ink-rgb,10,10,10),0.38)',marginTop:1}}>across {e.count} meals</div>}
                                    </div>
                                    {qtyStr&&<div style={{fontFamily:"'Archivo',sans-serif",fontSize:13,fontWeight:700,color:checked?'rgba(var(--cm-ink-rgb,10,10,10),0.3)':'var(--cm-red,#FF3B30)',flexShrink:0,whiteSpace:'nowrap',marginLeft:8,fontVariantNumeric:'tabular-nums'}}>{qtyStr}</div>}
                                  </div>
                                );
                              })}
                            </div>}
                          </div>
                        );
                      })}
                      {totalItems===0&&<div style={{fontFamily:"'Archivo',sans-serif",fontSize:14,fontWeight:500,color:'rgba(255,255,255,0.8)',textAlign:'center',padding:'24px 0'}}>No ingredients in this plan yet.</div>}
                    </div>
                    {/* Done */}
                    <div style={{padding:'10px 20px 4px'}}>
                      <button onPointerDown={()=>_hL()} onClick={()=>closeGrocery()} style={{width:'100%',background:'#fff',border:'none',borderRadius:14,padding:'15px',fontFamily:"'Archivo',sans-serif",fontSize:13,fontWeight:700,letterSpacing:'0.04em',color:'var(--cm-red,#FF3B30)',cursor:'pointer'}}>Done</button>
                    </div>
                  </motion.div>
                </div>
              );
            })()}

            {/* ── SAVE CONFIRM ── */}
            {mpSaveConfirm&&(
              <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setMpSaveConfirm(false)}>
                <div style={{background:'var(--cm-paper,#FFFFFF)',borderRadius:16,padding:24,textAlign:'center',maxWidth:360,width:'100%',boxShadow:'0 2px 12px rgba(0,0,0,.08)'}} onClick={e=>e.stopPropagation()}>
                  <div style={{fontFamily:"'Archivo',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:24,color:'var(--cm-red,#FF3B30)',marginBottom:8}}>LOG THIS PLAN?</div>
                  <div style={{...mno,fontSize:10,color:'rgba(var(--cm-red-rgb,255,59,48),0.4)',lineHeight:1.7,marginBottom:20}}>This will pre-log all meals to your food diary for the selected days.</div>
                  <button onClick={saveMealPrepPlan} style={{width:'100%',background:'var(--cm-red,#FF3B30)',border:'none',borderRadius:12,padding:14,...mno,fontWeight:700,fontSize:11,color:'#fff',letterSpacing:'0.14em',cursor:'pointer',marginBottom:10}}>CONFIRM & SAVE →</button>
                  <button onClick={()=>setMpSaveConfirm(false)} style={{width:'100%',background:'transparent',border:'1px solid rgba(var(--cm-red-rgb,255,59,48),0.12)',borderRadius:12,padding:12,...mno,fontSize:10,color:'rgba(var(--cm-red-rgb,255,59,48),0.4)',letterSpacing:'0.12em',cursor:'pointer'}}>CANCEL</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* hidden file input for menu scan — used by both inline tab and modal */}
        <input ref={menuScanRef} type="file" accept="image/*" capture="environment" onChange={handleMenuScan} style={{display:"none"}}/>

        {/* ── RESTAURANT AI STANDALONE SCREEN ── */}
        {restaurantAI&&restaurantStandalone&&(
          <div style={{position:"fixed",inset:0,background:"var(--cm-red)",zIndex:600,overflowY:"auto",paddingBottom:60,WebkitOverflowScrolling:"touch"}}>
            <div style={{position:"fixed",top:"-10%",left:"50%",transform:"translateX(-50%)",width:"70%",height:"50%",background:"radial-gradient(ellipse,rgba(255,255,255,0.15),transparent 70%)",pointerEvents:"none",zIndex:401}}/>
            <div style={{position:"relative",zIndex:402,padding:"56px 18px 20px"}}>
              <button onClick={raBack} style={{background:"none",border:"none",fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.7)",cursor:"pointer",padding:0,letterSpacing:"0.12em",marginBottom:20,display:"block"}}>← BACK</button>
              <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:800,fontSize:13,color:"#fff",letterSpacing:"0.03em",textTransform:"uppercase",marginBottom:10}}>Restaurant AI</div>
              <div style={{background:"var(--cm-paper,#FFFFFF)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.12)",borderRadius:10,padding:"10px 14px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,boxShadow:"0 2px 12px rgba(0,0,0,.08)"}}>
                {[
                  {label:"MEAL",value:String(restaurantAI.slot)},
                  {label:"KCAL",value:String(restaurantAI.calTarget)},
                  {label:"PROTEIN",value:`${restaurantAI.proteinTarget}G`,color:"#16a34a"},
                  {label:"CARBS",value:`${restaurantAI.carbTarget}G`},
                  {label:"FAT",value:`${restaurantAI.fatTarget}G`},
                ].map(({label,value,color})=>(
                  <div key={label} style={{textAlign:"center"}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"rgba(var(--cm-ink-rgb,10,10,10),0.45)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>{label}</div>
                    <div style={{fontFamily:"'Archivo',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:16,color:color||"var(--cm-ink)",lineHeight:1}}>{value}</div>
                  </div>
                ))}
              </div>

              {/* PICKER */}
              {raStep==='picker'&&(
                <div>
                  <div onClick={()=>setRaStep('nearme')} style={{background:"var(--cm-paper,#FFFFFF)",border:"1px solid rgba(var(--cm-ink-rgb,10,10,10),0.07)",borderRadius:14,padding:18,marginBottom:10,display:"flex",alignItems:"center",gap:14,cursor:"pointer",position:"relative",boxShadow:"0 2px 12px rgba(0,0,0,.08)"}}>
                    <div style={{width:48,height:48,borderRadius:10,background:"rgba(var(--cm-red-rgb,255,59,48),0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--cm-ink)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Archivo',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:20,color:"var(--cm-ink)",textTransform:"uppercase",letterSpacing:"0.02em"}}>NEAR ME<span style={{color:"var(--cm-red,#FF3B30)"}}>.</span></div>
                      <div style={{fontSize:13,color:"rgba(var(--cm-ink-rgb,10,10,10),0.5)",marginTop:4,lineHeight:1.4}}>Find restaurants nearby and get AI recommendations based on their menu.</div>
                    </div>
                    <div style={{color:"var(--cm-red,#FF3B30)",fontFamily:"'DM Mono',monospace",fontSize:12,flexShrink:0}}>→</div>
                  </div>
                  <div onClick={()=>menuScanRef.current?.click()} style={{background:"var(--cm-paper,#FFFFFF)",border:"1px solid rgba(var(--cm-ink-rgb,10,10,10),0.07)",borderRadius:14,padding:18,marginBottom:10,display:"flex",alignItems:"center",gap:14,cursor:"pointer",position:"relative",boxShadow:"0 2px 12px rgba(0,0,0,.08)"}}>
                    <div style={{width:48,height:48,borderRadius:10,background:"rgba(96,165,250,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 014 0v2"/><circle cx="12" cy="13" r="3"/></svg>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Archivo',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:20,color:"var(--cm-ink)",textTransform:"uppercase",letterSpacing:"0.02em"}}>SCAN MENU<span style={{color:"#60a5fa"}}>.</span></div>
                      <div style={{fontSize:13,color:"rgba(var(--cm-ink-rgb,10,10,10),0.5)",marginTop:4,lineHeight:1.4}}>Photograph any menu and AI recommends what to order based on your targets.</div>
                    </div>
                    <div style={{color:"#60a5fa",fontFamily:"'DM Mono',monospace",fontSize:12,flexShrink:0}}>→</div>
                  </div>
                </div>
              )}

              {/* NEAR ME */}
              {raStep==='nearme'&&(
                <div>
                  <div style={{display:"flex",gap:8,marginBottom:14}}>
                    <input value={raNearbyCity} onChange={e=>setRaNearbyCity(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchRaNearby()} placeholder="City or area…" style={{flex:1,background:"var(--cm-paper,#FFFFFF)",border:"1px solid rgba(var(--cm-ink-rgb,10,10,10),0.12)",borderRadius:10,padding:"12px 14px",color:"var(--cm-ink)",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
                    <button onClick={fetchRaNearby} disabled={raNearbyLoading||!raNearbyCity.trim()} style={{padding:"12px 18px",background:raNearbyLoading?"rgba(var(--cm-red-rgb,255,59,48),0.5)":"var(--cm-red,#FF3B30)",color:"#fff",border:"none",borderRadius:10,fontWeight:800,fontSize:13,cursor:raNearbyLoading?"default":"pointer",fontFamily:"'Archivo',sans-serif",letterSpacing:"0.04em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{raNearbyLoading?"Searching…":"Find →"}</button>
                  </div>
                  {raNearbyError&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(var(--cm-red-rgb,255,59,48),0.8)",marginBottom:12,padding:"8px 12px",background:"rgba(var(--cm-red-rgb,255,59,48),0.08)",borderRadius:8}}>{raNearbyError}</div>}
                  {raNearbyLoading&&[1,2,3].map(i=>(
                    <div key={i} style={{height:70,borderRadius:12,background:"rgba(255,255,255,0.15)",marginBottom:8,animation:"cm-pulse 1.4s ease-in-out infinite",animationDelay:`${i*0.15}s`}}/>
                  ))}
                  {raNearby.length>0&&(
                    <div>
                      <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:11,color:"#fff",letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:10}}>{raNearby.length} Restaurants Nearby</div>
                      {raNearby.slice(0,10).map((r,i)=>(
                        <div key={i} onClick={()=>handleRaRestaurantTap(r)} style={{background:"var(--cm-paper,#FFFFFF)",border:"1px solid rgba(var(--cm-ink-rgb,10,10,10),0.07)",borderRadius:12,padding:"14px 16px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",boxShadow:"0 2px 12px rgba(0,0,0,.08)"}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontFamily:"'Archivo',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:18,color:"var(--cm-ink)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                            <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:500,fontSize:11,color:"rgba(var(--cm-ink-rgb,10,10,10),0.55)",marginTop:3,letterSpacing:0}}>{r.vicinity||""}{r.rating?` · ${r.rating}★`:""}</div>
                          </div>
                          <div style={{color:"var(--cm-red,#FF3B30)",fontFamily:"'DM Mono',monospace",fontSize:12,flexShrink:0,marginLeft:12}}>→</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* RESULT */}
              {raStep==='result'&&(
                <div>
                  {raRestaurant&&<div style={{fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:12,color:"#fff",letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:16}}>{raRestaurant.name}</div>}
                  {raLoading&&(
                    <div>
                      {[1,2,3,4].map(i=>(
                        <div key={i} style={{height:i===1?120:70,borderRadius:12,background:"rgba(255,255,255,0.15)",marginBottom:10,animation:"cm-pulse 1.4s ease-in-out infinite",animationDelay:`${i*0.15}s`}}/>
                      ))}
                      <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:13,color:"#fff",textAlign:"center",marginTop:12,letterSpacing:0,transition:"opacity 0.3s"}}>
                        {RA_LOAD_MSGS[raLoadOrder.current[raLoadMsg % RA_LOAD_MSGS.length]]}
                      </div>
                    </div>
                  )}
                  {raError&&!raLoading&&(
                    <div style={{background:"rgba(var(--cm-red-rgb,255,59,48),0.08)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.2)",borderRadius:12,padding:"14px 16px",fontFamily:"'DM Mono',monospace",fontSize:11,color:"rgba(var(--cm-red-rgb,255,59,48),0.8)"}}>{raError}</div>
                  )}
                  {raResult&&!raLoading&&(()=>{
                    const b=raResult.best_order;
                    const m=b?.estimated_macros||{};
                    const calStyle=raMacroChipStyle(m.calories,restaurantAI.calTarget);
                    const protStyle=raMacroChipStyle(m.protein_g,restaurantAI.proteinTarget,true);
                    const carbStyle=raMacroChipStyle(m.carbs_g,restaurantAI.carbTarget);
                    const fatStyle=raMacroChipStyle(m.fat_g,restaurantAI.fatTarget);
                    const coveragePct=Math.min(100,Math.round(b?.protein_coverage_pct||0));
                    const modCount=(b?.customisation||"").split(/[,;]|\band\b/i).map(s=>s.trim()).filter(Boolean).length;
                    const hasDetail=!!(b?.customisation)||(b?.warnings||[]).length>0;
                    return(
                      <div>
                        {/* ORDER THIS */}
                        <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:11,color:"#fff",letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:8}}>Order This</div>
                        <div style={{background:"var(--cm-paper,#FFFFFF)",border:"1px solid rgba(var(--cm-ink-rgb,10,10,10),0.08)",borderRadius:14,padding:16,marginBottom:16,position:"relative",overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.08)"}}>
                          {/* dish name + mods tag */}
                          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:10,marginBottom:4}}>
                            <div style={{fontFamily:"'Archivo',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:19,color:"var(--cm-ink)",lineHeight:1}}>{b?.item||"—"}<span style={{color:"var(--cm-red,#FF3B30)"}}>.</span></div>
                            {modCount>0&&<span style={{flexShrink:0,fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:10,color:"var(--cm-ink)",background:"rgba(var(--cm-ink-rgb,10,10,10),0.06)",borderRadius:999,padding:"3px 9px",textTransform:"uppercase",letterSpacing:"0.02em"}}>{modCount} swap{modCount>1?"s":""}</span>}
                          </div>
                          {/* one-line why */}
                          <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:500,fontSize:13,color:"rgba(var(--cm-ink-rgb,10,10,10),0.75)",lineHeight:1.4,marginBottom:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b?.reason}</div>
                          {/* macro row */}
                          <div style={{display:"flex",gap:8,marginBottom:10}}>
                            {[
                              {label:"CAL",val:m.calories,style:calStyle},
                              {label:"PROTEIN",val:`${m.protein_g}G`,style:protStyle},
                              {label:"CARBS",val:`${m.carbs_g}G`,style:carbStyle},
                              {label:"FAT",val:`${m.fat_g}G`,style:fatStyle},
                            ].map(({label,val,style})=>(
                              <div key={label} style={{flex:1,minWidth:0,background:style.bg,borderRadius:8,padding:"6px 6px",textAlign:"center"}}>
                                <div style={{fontFamily:"'Archivo',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:16,color:style.color,lineHeight:1}}>{val}</div>
                                <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:9,color:"rgba(var(--cm-ink-rgb,10,10,10),0.55)",letterSpacing:"0.02em",marginTop:2,textTransform:"uppercase"}}>{label}</div>
                              </div>
                            ))}
                          </div>
                          {/* coverage bar */}
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:hasDetail?12:0}}>
                            <div style={{flex:1,height:3,background:"rgba(var(--cm-ink-rgb,10,10,10),0.08)",borderRadius:2,overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${coveragePct}%`,background:"#16a34a",borderRadius:2,transition:"width 0.6s ease"}}/>
                            </div>
                            <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:600,fontSize:10,color:"#16a34a",flexShrink:0,letterSpacing:0}}>Covers {coveragePct}% protein</div>
                          </div>
                          {/* toggle: how to order it + sodium note (collapsed by default) */}
                          {hasDetail&&(
                            <>
                              <button onClick={()=>setRaBestExpanded(v=>!v)} style={{width:"100%",background:"none",border:"none",borderTop:"1px solid rgba(var(--cm-ink-rgb,10,10,10),0.08)",padding:"11px 0 0",marginTop:2,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:12,color:"var(--cm-red,#FF3B30)",letterSpacing:0,textAlign:"left"}}>
                                <span>How to order it{(b?.warnings||[]).length>0?" + sodium note":""}</span>
                                <span style={{flexShrink:0,marginLeft:8,transition:"transform 0.2s",transform:raBestExpanded?"rotate(180deg)":"none"}}>↓</span>
                              </button>
                              {raBestExpanded&&(
                                <div style={{marginTop:10}}>
                                  {b?.customisation&&<div style={{fontFamily:"'Archivo',sans-serif",fontWeight:600,fontSize:13,color:"var(--cm-ink)",lineHeight:1.5,marginBottom:(b?.warnings||[]).length>0?12:0}}>{b.customisation}</div>}
                                  {(b?.warnings||[]).map((w,i)=>(
                                    <div key={i} style={{display:"flex",gap:8,marginBottom:6}}>
                                      <span style={{fontSize:13,color:"var(--cm-red,#FF3B30)",flexShrink:0,lineHeight:1.3}}>⚠</span>
                                      <div>
                                        <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:12,color:"var(--cm-ink)",lineHeight:1.4}}>{w.message}</div>
                                        {w.fix&&<div style={{fontFamily:"'Archivo',sans-serif",fontWeight:500,fontSize:11,color:"rgba(var(--cm-ink-rgb,10,10,10),0.65)",marginTop:2,lineHeight:1.4}}>{w.fix}</div>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <button
                          onClick={()=>handleAddRestaurantDish(b)}
                          style={{width:"100%",padding:"15px",background:"var(--cm-red,#FF3B30)",border:"none",borderRadius:12,fontFamily:"'Archivo',sans-serif",fontWeight:800,fontSize:13,color:"#fff",letterSpacing:"0.04em",textTransform:"uppercase",cursor:"pointer",marginBottom:16,boxShadow:"0 4px 16px rgba(var(--cm-red-rgb,255,59,48),0.35)"}}
                        >ADD TO MEAL {restaurantAI.slot}</button>

                        {/* ALSO GOOD */}
                        {(raResult.backup_options||[]).length>0&&(
                          <div style={{marginBottom:16}}>
                            <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:11,color:"#fff",letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:8}}>Also Good</div>
                            {raResult.backup_options.map((opt,i)=>{
                              const open=raBackupOpen===i;
                              return(
                              <div key={i} onClick={()=>setRaBackupOpen(open?null:i)} style={{background:"var(--cm-paper,#FFFFFF)",border:"1px solid rgba(var(--cm-ink-rgb,10,10,10),0.08)",borderRadius:10,padding:"12px 14px",marginBottom:6,boxShadow:"0 2px 12px rgba(0,0,0,.08)",cursor:"pointer"}}>
                                <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:10}}>
                                  <div style={{fontFamily:"'Archivo',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:16,color:"var(--cm-ink)"}}>{opt.item}<span style={{color:"var(--cm-red,#FF3B30)"}}>.</span></div>
                                  <span style={{flexShrink:0,fontSize:13,color:"var(--cm-red,#FF3B30)",transition:"transform 0.2s",transform:open?"rotate(180deg)":"none"}}>↓</span>
                                </div>
                                <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:500,fontSize:13,color:"rgba(var(--cm-ink-rgb,10,10,10),0.7)",lineHeight:1.4,marginTop:3,...(open?{}:{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"})}}>{opt.reason}</div>
                                {open&&opt.customisation&&<div style={{fontFamily:"'Archivo',sans-serif",fontWeight:600,fontSize:12,color:"var(--cm-ink)",letterSpacing:0,marginTop:6}}>{opt.customisation}</div>}
                              </div>
                              );
                            })}
                          </div>
                        )}

                        {/* SKIP THESE */}
                        {(raResult.avoid||[]).length>0&&(
                          <div style={{marginBottom:16}}>
                            <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:11,color:"#fff",letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:8}}>Skip These</div>
                            {raResult.avoid.map((item,i)=>(
                              <div key={i} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:10,padding:"12px 14px",marginBottom:6,display:"flex",gap:10,alignItems:"flex-start"}}>
                                <div style={{flex:1}}>
                                  <div style={{fontFamily:"'Archivo',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:16,color:"rgba(255,255,255,0.7)",textDecoration:"line-through",marginBottom:3}}>{item.item}</div>
                                  <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:500,fontSize:13,color:"rgba(255,255,255,0.75)",lineHeight:1.45}}>{item.reason}</div>
                                </div>
                                <div style={{color:"rgba(var(--cm-red-rgb,255,59,48),0.5)",fontSize:16,flexShrink:0}}>✕</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* COACH SAYS */}
                        {raResult.coach_note&&(
                          <div>
                            <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:700,fontSize:11,color:"#fff",letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:8}}>Coach Says</div>
                            <div style={{background:"rgba(255,255,255,0.12)",borderLeft:"3px solid rgba(255,255,255,0.8)",borderRadius:"0 10px 10px 0",padding:"12px 14px"}}>
                              <div style={{fontFamily:"'Archivo',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:16,color:"#FFFFFF",lineHeight:1.45}}>"{raResult.coach_note}"</div>
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

        {/* ── MEAL LOCK GATE MODAL ── */}
        {lockGate&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
            <div style={{background:"var(--cm-paper,#FFFFFF)",border:"1.5px solid rgba(var(--cm-red-rgb,255,59,48),0.15)",borderRadius:20,padding:28,maxWidth:340,width:"100%",textAlign:"center",boxShadow:'0 2px 12px rgba(0,0,0,.08)'}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"var(--cm-red,#FF3B30)",letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:12}}>// LOCK IN MEAL {lockGate.slotToLock}?</div>
              <div style={{fontFamily:"'Archivo',sans-serif",fontWeight:900,fontSize:24,color:"var(--cm-red,#FF3B30)",lineHeight:1.1,marginBottom:10,textTransform:"uppercase"}}>Finished with {getSlotLabel(lockGate.slotToLock)}?</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(var(--cm-red-rgb,255,59,48),0.5)",lineHeight:1.6,marginBottom:24}}>Locking seals this meal. Items become read-only and macros are recorded for the day.</div>
              <div style={{display:"flex",gap:10}}>
                <button
                  onClick={()=>{
                    const newLocked=[...(lockedSlots||[]),lockGate.slotToLock];
                    if(onLockSlots)onLockSlots(newLocked);
                    if(lockGate.pendingEntry){
                      // Came from planned-card confirm → log the entry directly after locking
                      logEntry(lockGate.pendingEntry);
                      setLockGate(null);
                    }else{
                      pendingLogSlotRef.current=lockGate.pendingIdx;
                      setLockGate(null);
                      setFuelScreen('log');
                    }
                  }}
                  style={{flex:2,padding:"14px",background:"var(--cm-red,#FF3B30)",border:"none",borderRadius:12,fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:10,color:"#fff",letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>
                  YES — LOCK IT
                </button>
                <button
                  onClick={()=>{
                    // If from planned-card confirm, log without locking the earlier slot
                    if(lockGate.pendingEntry)logEntry(lockGate.pendingEntry);
                    setLockGate(null);
                  }}
                  style={{flex:1,padding:"14px",background:"rgba(var(--cm-red-rgb,255,59,48),0.04)",border:"1px solid rgba(var(--cm-red-rgb,255,59,48),0.12)",borderRadius:12,fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:10,color:"rgba(var(--cm-red-rgb,255,59,48),0.5)",letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>
                  NOT YET
                </button>
              </div>
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
