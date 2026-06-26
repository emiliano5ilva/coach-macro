// One-time script: extracts only the icons we use from the full iconify-json
// packages into src/iconData.js. Run with: node scripts/extract-icons.js
// Packages are installed temporarily (--no-save) and not bundled.

import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// --- Collect the unique icon names we need from each prefix ---

const FOOD_ICON_MAP = {
  chicken: "fluent-emoji-flat:poultry-leg",
  poultry: "fluent-emoji-flat:poultry-leg",
  turkey: "fluent-emoji-flat:turkey",
  bacon: "fluent-emoji-flat:bacon",
  beef: "fluent-emoji-flat:cut-of-meat",
  steak: "fluent-emoji-flat:cut-of-meat",
  pork: "fluent-emoji-flat:cut-of-meat",
  ham: "fluent-emoji-flat:cut-of-meat",
  veal: "fluent-emoji-flat:cut-of-meat",
  lamb: "fluent-emoji-flat:cut-of-meat",
  venison: "fluent-emoji-flat:cut-of-meat",
  fish: "fluent-emoji-flat:fish",
  salmon: "fluent-emoji-flat:fish",
  tuna: "fluent-emoji-flat:fish",
  cod: "fluent-emoji-flat:fish",
  shrimp: "fluent-emoji-flat:shrimp",
  prawn: "fluent-emoji-flat:shrimp",
  lobster: "fluent-emoji-flat:lobster",
  crab: "fluent-emoji-flat:crab",
  egg: "fluent-emoji-flat:egg",
  pizza: "fluent-emoji-flat:pizza",
  burger: "fluent-emoji-flat:hamburger",
  hamburger: "fluent-emoji-flat:hamburger",
  taco: "fluent-emoji-flat:taco",
  burrito: "fluent-emoji-flat:burrito",
  sandwich: "fluent-emoji-flat:sandwich",
  "hot dog": "fluent-emoji-flat:hot-dog",
  hotdog: "fluent-emoji-flat:hot-dog",
  fries: "fluent-emoji-flat:french-fries",
  sushi: "fluent-emoji-flat:sushi",
  curry: "fluent-emoji-flat:curry-rice",
  dumpling: "fluent-emoji-flat:dumpling",
  falafel: "fluent-emoji-flat:falafel",
  rice: "fluent-emoji-flat:cooked-rice",
  quinoa: "fluent-emoji-flat:cooked-rice",
  pasta: "fluent-emoji-flat:spaghetti",
  spaghetti: "fluent-emoji-flat:spaghetti",
  noodle: "fluent-emoji-flat:spaghetti",
  ramen: "fluent-emoji-flat:spaghetti",
  bread: "fluent-emoji-flat:bread",
  toast: "fluent-emoji-flat:bread",
  pancake: "fluent-emoji-flat:pancakes",
  waffle: "fluent-emoji-flat:pancakes",
  pretzel: "fluent-emoji-flat:pretzel",
  oat: "fluent-emoji-flat:sheaf-of-rice",
  oatmeal: "fluent-emoji-flat:sheaf-of-rice",
  cereal: "fluent-emoji-flat:sheaf-of-rice",
  cheese: "fluent-emoji-flat:cheese-wedge",
  yogurt: "fluent-emoji-flat:glass-of-milk",
  milk: "fluent-emoji-flat:glass-of-milk",
  dairy: "fluent-emoji-flat:glass-of-milk",
  cream: "fluent-emoji-flat:glass-of-milk",
  creamer: "fluent-emoji-flat:glass-of-milk",
  protein: "fluent-emoji-flat:flexed-biceps",
  shake: "fluent-emoji-flat:flexed-biceps",
  whey: "fluent-emoji-flat:flexed-biceps",
  bar: "fluent-emoji-flat:flexed-biceps",
  quest: "fluent-emoji-flat:flexed-biceps",
  kind: "fluent-emoji-flat:flexed-biceps",
  clif: "fluent-emoji-flat:flexed-biceps",
  donut: "fluent-emoji-flat:doughnut",
  doughnut: "fluent-emoji-flat:doughnut",
  cookie: "fluent-emoji-flat:cookie",
  cake: "fluent-emoji-flat:shortcake",
  chocolate: "fluent-emoji-flat:chocolate-bar",
  "ice cream": "fluent-emoji-flat:ice-cream",
  apple: "fluent-emoji-flat:red-apple",
  banana: "fluent-emoji-flat:banana",
  orange: "fluent-emoji-flat:tangerine",
  tangerine: "fluent-emoji-flat:tangerine",
  strawberry: "fluent-emoji-flat:strawberry",
  grape: "fluent-emoji-flat:grapes",
  watermelon: "fluent-emoji-flat:watermelon",
  pineapple: "fluent-emoji-flat:pineapple",
  mango: "fluent-emoji-flat:mango",
  peach: "fluent-emoji-flat:peach",
  cherry: "fluent-emoji-flat:cherries",
  lemon: "fluent-emoji-flat:lemon",
  lime: "fluent-emoji-flat:lemon",
  pear: "fluent-emoji-flat:pear",
  kiwi: "fluent-emoji-flat:kiwi-fruit",
  blueberry: "fluent-emoji-flat:blueberries",
  coconut: "fluent-emoji-flat:coconut",
  avocado: "fluent-emoji-flat:avocado",
  tomato: "fluent-emoji-flat:tomato",
  carrot: "fluent-emoji-flat:carrot",
  broccoli: "fluent-emoji-flat:broccoli",
  corn: "fluent-emoji-flat:ear-of-corn",
  mushroom: "fluent-emoji-flat:mushroom",
  potato: "fluent-emoji-flat:potato",
  peanut: "fluent-emoji-flat:peanuts",
  almond: "fluent-emoji-flat:peanuts",
  nut: "fluent-emoji-flat:peanuts",
  salad: "fluent-emoji-flat:green-salad",
  lettuce: "fluent-emoji-flat:green-salad",
  tofu: "fluent-emoji-flat:pot-of-food",
  tempeh: "fluent-emoji-flat:pot-of-food",
  hummus: "fluent-emoji-flat:falafel",
  soup: "fluent-emoji-flat:pot-of-food",
  stew: "fluent-emoji-flat:pot-of-food",
  broth: "fluent-emoji-flat:pot-of-food",
  coffee: "fluent-emoji-flat:hot-beverage",
  latte: "fluent-emoji-flat:hot-beverage",
  espresso: "fluent-emoji-flat:hot-beverage",
  tea: "fluent-emoji-flat:teacup-without-handle",
  juice: "fluent-emoji-flat:beverage-box",
  smoothie: "fluent-emoji-flat:tropical-drink",
  beer: "fluent-emoji-flat:beer-mug",
  wine: "fluent-emoji-flat:wine-glass",
};

const TWEMOJI_FALLBACK_MAP = {
  duck: "twemoji:duck",
  lamb: "twemoji:cut-of-meat",
  caramel: "twemoji:custard",
  flan: "twemoji:custard",
  pudding: "twemoji:custard",
  bento: "twemoji:bento-box",
  "fried rice": "twemoji:cooked-rice",
  beans: "twemoji:beans",
  salt: "twemoji:salt",
  pepper: "twemoji:salt",
  spice: "twemoji:salt",
  honey: "twemoji:honey-pot",
  butter: "twemoji:butter",
  croissant: "twemoji:croissant",
  bagel: "twemoji:bagel",
  flatbread: "twemoji:flatbread",
  tamale: "twemoji:tamale",
  fondue: "twemoji:fondue",
  oyster: "twemoji:oyster",
  blowfish: "twemoji:blowfish",
  edamame: "twemoji:beans",
};

function collectNames(map, prefix) {
  const names = new Set();
  for (const iconId of Object.values(map)) {
    const [p, name] = iconId.split(":");
    if (p === prefix) names.add(name);
  }
  return [...names].sort();
}

// Also include the generic fallback icon
const FLUENT_NAMES = collectNames(FOOD_ICON_MAP, "fluent-emoji-flat");
FLUENT_NAMES.push("fork-and-knife-with-plate");
// Readiness check-in gateway icons
FLUENT_NAMES.push(
  "beaming-face-with-smiling-eyes",
  "slightly-smiling-face",
  "neutral-face",
  "tired-face",
  "skull"
);
// Tab-bar emojicon icons (Premium Pass). fork-and-knife-with-plate (fuel) already pushed above.
FLUENT_NAMES.push(
  "alarm-clock",             // today
  "person-lifting-weights",  // train + quick-log Lift
  "chart-increasing",        // progress
  "bust-in-silhouette"       // me
);
// Quick-log panel icons (Sub-step 3). Lift=person-lifting-weights, Food=fork-and-knife-with-plate (both above).
FLUENT_NAMES.push(
  "running-shoe",            // quick-log Run
  "droplet"                  // quick-log Water
);

const TWEMOJI_NAMES = collectNames(TWEMOJI_FALLBACK_MAP, "twemoji");

// --- Load the full icon collections ---

const fluentData = require("@iconify-json/fluent-emoji-flat");
const twemojiData = require("@iconify-json/twemoji");

const fluentIcons = fluentData.icons.icons;
const twemojiIcons = twemojiData.icons.icons;

// --- Extract only what we need, report any gaps ---

function extractSubset(allIcons, names, prefix) {
  const subset = {};
  const missing = [];
  for (const name of names) {
    if (allIcons[name]) {
      subset[name] = { body: allIcons[name].body };
    } else {
      missing.push(`${prefix}:${name}`);
    }
  }
  return { subset, missing };
}

const { subset: fluentSubset, missing: fluentMissing } =
  extractSubset(fluentIcons, FLUENT_NAMES, "fluent-emoji-flat");

const { subset: twemojiSubset, missing: twemojiMissing } =
  extractSubset(twemojiIcons, TWEMOJI_NAMES, "twemoji");

const allMissing = [...fluentMissing, ...twemojiMissing];

// --- Read collection-level dimensions from source packages (avoids viewBox=0 0 16 16 fallback) ---

const fluentW = fluentData.icons.width  || 16;
const fluentH = fluentData.icons.height || 16;
const twemojiW = twemojiData.icons.width  || 16;
const twemojiH = twemojiData.icons.height || 16;

// --- Write src/iconData.js ---

const output = `// Auto-generated by scripts/extract-icons.js — do not edit by hand.
// Re-run the script after updating FOOD_ICON_MAP or TWEMOJI_FALLBACK_MAP.
import { addCollection } from "@iconify/react";

addCollection({
  prefix: "fluent-emoji-flat",
  width: ${fluentW},
  height: ${fluentH},
  icons: ${JSON.stringify(fluentSubset, null, 2)},
});

addCollection({
  prefix: "twemoji",
  width: ${twemojiW},
  height: ${twemojiH},
  icons: ${JSON.stringify(twemojiSubset, null, 2)},
});
`;

writeFileSync(new URL("../src/iconData.js", import.meta.url), output, "utf8");

const sizeKB = (Buffer.byteLength(output, "utf8") / 1024).toFixed(1);
console.log(`\nWrote src/iconData.js — ${sizeKB} KB`);
console.log(`  fluent-emoji-flat: ${Object.keys(fluentSubset).length} icons`);
console.log(`  twemoji:           ${Object.keys(twemojiSubset).length} icons`);

if (allMissing.length) {
  console.warn("\nGAPS — icon names not found in packages:");
  allMissing.forEach((n) => console.warn("  MISSING:", n));
} else {
  console.log("\nNo gaps — all icon names resolved.");
}
