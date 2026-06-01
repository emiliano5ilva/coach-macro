import { ai, sb } from "./client.js";

// Food icon keyword → Iconify icon ID mappings.
// getFoodIcon() does substring matching, so "chicken breast" hits "chicken".
// Order matters: first match wins. More specific keywords should appear earlier.

export const FOOD_ICON_MAP = {
  // Proteins — meat
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

  // Fast food / prepared
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

  // Grains / carbs
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

  // Dairy / protein
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

  // Sweets / dessert
  donut: "fluent-emoji-flat:doughnut",
  doughnut: "fluent-emoji-flat:doughnut",
  cookie: "fluent-emoji-flat:cookie",
  cake: "fluent-emoji-flat:shortcake",
  chocolate: "fluent-emoji-flat:chocolate-bar",
  "ice cream": "fluent-emoji-flat:ice-cream",

  // Fruits
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

  // Vegetables
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

  // Plant proteins
  tofu: "fluent-emoji-flat:pot-of-food",
  tempeh: "fluent-emoji-flat:pot-of-food",
  hummus: "fluent-emoji-flat:falafel",

  // Soups / mixed
  soup: "fluent-emoji-flat:pot-of-food",
  stew: "fluent-emoji-flat:pot-of-food",
  broth: "fluent-emoji-flat:pot-of-food",

  // Beverages
  coffee: "fluent-emoji-flat:hot-beverage",
  latte: "fluent-emoji-flat:hot-beverage",
  espresso: "fluent-emoji-flat:hot-beverage",
  tea: "fluent-emoji-flat:teacup-without-handle",
  juice: "fluent-emoji-flat:beverage-box",
  smoothie: "fluent-emoji-flat:tropical-drink",
  beer: "fluent-emoji-flat:beer-mug",
  wine: "fluent-emoji-flat:wine-glass",
};

export const TWEMOJI_FALLBACK_MAP = {
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

const GENERIC_FALLBACK = "fluent-emoji-flat:fork-and-knife-with-plate";

export function getFoodIcon(foodName) {
  if (!foodName) return GENERIC_FALLBACK;
  const lower = foodName.toLowerCase();

  for (const [keyword, iconId] of Object.entries(FOOD_ICON_MAP)) {
    if (lower.includes(keyword)) return iconId;
  }

  for (const [keyword, iconId] of Object.entries(TWEMOJI_FALLBACK_MAP)) {
    if (lower.includes(keyword)) return iconId;
  }

  console.log("[icon-miss]", foodName);
  return GENERIC_FALLBACK;
}

// Session-scoped caches — survive re-renders, reset on page reload.
const _iconCache = new Map();    // resolved: normalizedName → iconId
const _inProgress = new Map();  // in-flight: normalizedName → Promise

export async function resolveIconWithAI(foodName, userId) {
  const key = foodName.toLowerCase().trim();

  if (_iconCache.has(key)) return _iconCache.get(key);
  if (_inProgress.has(key)) return _inProgress.get(key);

  const allIcons = [
    ...Object.values(FOOD_ICON_MAP),
    ...Object.values(TWEMOJI_FALLBACK_MAP),
    GENERIC_FALLBACK,
  ];
  const uniqueIcons = [...new Set(allIcons)].join("\n");

  const promise = (async () => {
    try {
      const result = await ai(
        `Food item: "${foodName}"
Available icon IDs:
${uniqueIcons}

Reply with ONLY the single most appropriate icon ID from the list above. No explanation, no markdown, just the icon ID.
If nothing fits, reply: fluent-emoji-flat:fork-and-knife-with-plate`,
        50,
        "icon_resolve"
      );

      const iconId = result.trim();
      const resolved = allIcons.includes(iconId) ? iconId : GENERIC_FALLBACK;

      _iconCache.set(key, resolved);

      if (userId) {
        const { data } = await sb
          .from("food_history")
          .select("id, food_data")
          .eq("user_id", userId)
          .ilike("food_name", foodName)
          .maybeSingle();
        if (data) {
          await sb
            .from("food_history")
            .update({ food_data: { ...data.food_data, icon: resolved } })
            .eq("id", data.id);
        }
      }

      console.log("[icon-ai]", foodName, "→", resolved);
      return resolved;
    } catch (e) {
      console.error("[icon-ai-fail]", foodName, e);
      return GENERIC_FALLBACK;
    } finally {
      _inProgress.delete(key);
    }
  })();

  _inProgress.set(key, promise);
  return promise;
}
