#!/usr/bin/env python3
"""Generate seed-batch3-b.json (lunch) and seed-batch3-c.json (dinner+snack)."""
import json

def r(name, slot, tags, servings, ingredients, instructions):
    return {"name": name, "meal_slot": slot, "diet_tags": tags, "servings": servings,
            "ingredients": [{"item": i[0], "qty": i[1], "unit": i[2]} for i in ingredients],
            "instructions": instructions}

# ── LUNCH (70 recipes) ────────────────────────────────────────────────────────
lunch = [
  r("Carnivore Ribeye Strip Lunch Plate","lunch",
    ["carnivore","keto","paleo","high-protein","low-carb"],1,
    [("beef, sirloin steak, lean, raw",250,"g"),("sea salt",3,"g"),("black pepper, ground",2,"g"),("beef broth",60,"ml")],
    "Season steak generously with salt and pepper. Sear in very hot cast-iron 3 min per side for medium-rare. Rest 5 min, slice, serve with broth drizzled over."),

  r("Carnivore Ground Beef Burger Bowl","lunch",
    ["carnivore","keto","high-protein","low-carb"],1,
    [("ground beef, 80% lean, raw",200,"g"),("egg, whole, raw",1,"whole"),("cheddar cheese",50,"g"),("sea salt",2,"g"),("black pepper, ground",1,"g")],
    "Mix beef with egg, salt, pepper. Form thick patty; cook in hot pan 4 min per side. Melt cheddar on top. Serve in bowl."),

  r("Carnivore Lamb Chop Lunch Plate","lunch",
    ["carnivore","keto","paleo","high-protein","low-carb"],1,
    [("lamb, rib chop, lean, raw",250,"g"),("sea salt",3,"g"),("black pepper, ground",2,"g")],
    "Season lamb chops generously. Sear in hot skillet 3-4 min per side until internal temp 135°F for medium. Rest 5 min and serve."),

  r("Carnivore Pork Tenderloin Slices","lunch",
    ["carnivore","keto","high-protein","low-carb"],2,
    [("pork tenderloin, raw",400,"g"),("sea salt",4,"g"),("black pepper, ground",2,"g"),("heavy cream",60,"ml")],
    "Season tenderloin. Sear all sides 3 min; finish at 400°F oven 15 min. Rest, slice, serve drizzled with warmed heavy cream."),

  r("Carnivore Turkey Breast Lunch Plate","lunch",
    ["carnivore","keto","high-protein","low-carb"],1,
    [("turkey breast, raw",200,"g"),("chicken broth",80,"ml"),("sea salt",2,"g"),("black pepper, ground",1,"g")],
    "Season turkey with salt and pepper. Cook in pan with broth, simmer covered 8 min per side until cooked through. Slice and serve with pan juices."),

  r("Carnivore Beef Liver and Bacon Plate","lunch",
    ["carnivore","keto","paleo","high-protein"],1,
    [("beef liver, raw",200,"g"),("bacon, cured, pan-fried",40,"g"),("sea salt",2,"g"),("black pepper, ground",1,"g")],
    "Cook bacon until crisp; crumble. In same pan cook sliced liver 2-3 min per side over medium-high. Season. Serve topped with crumbled bacon."),

  r("Carnivore Bacon Ground Beef Bowl","lunch",
    ["carnivore","keto","high-protein","low-carb"],1,
    [("ground beef, 90% lean, raw",180,"g"),("bacon, cured, pan-fried",40,"g"),("egg, whole, raw",2,"whole"),("sea salt",2,"g")],
    "Cook bacon; crumble and set aside. Brown ground beef in same pan. Fry eggs alongside beef. Combine in bowl; season with salt."),

  r("Carnivore Sirloin Steak Strips","lunch",
    ["carnivore","keto","paleo","high-protein","low-carb"],1,
    [("beef, sirloin steak, lean, raw",220,"g"),("sea salt",3,"g"),("black pepper, ground",2,"g"),("beef broth",50,"ml")],
    "Slice sirloin thin against grain. Season generously. Sear strips in very hot dry pan 1-2 min total. Deglaze with broth and serve."),

  r("Carnivore Shrimp Butter Lunch Bowl","lunch",
    ["carnivore","keto","pescatarian","high-protein","low-carb"],1,
    [("shrimp, raw",200,"g"),("heavy cream",60,"ml"),("sea salt",2,"g"),("black pepper, ground",1,"g")],
    "Cook shrimp in hot dry pan 1-2 min per side until pink. Add cream and simmer 2 min. Season with salt and pepper."),

  r("Carnivore Tuna Steak Plate","lunch",
    ["carnivore","keto","pescatarian","high-protein","low-carb"],1,
    [("tuna, canned in water, drained",180,"g"),("egg, whole, hard-boiled",2,"whole"),("sea salt",2,"g"),("black pepper, ground",1,"g")],
    "Drain tuna and place in bowl. Slice hard-boiled eggs alongside. Season with salt and pepper. Serve chilled."),

  r("Carnivore Ground Turkey Patties","lunch",
    ["carnivore","keto","high-protein","low-carb"],1,
    [("ground turkey, raw",200,"g"),("egg, whole, raw",1,"whole"),("sea salt",2,"g"),("black pepper, ground",1,"g")],
    "Mix ground turkey with egg, salt, pepper. Form 2 patties. Cook in dry pan 5 min per side until cooked through."),

  r("Carnivore Halibut Lunch Plate","lunch",
    ["carnivore","keto","pescatarian","high-protein","low-carb"],1,
    [("halibut, atlantic, raw",200,"g"),("sea salt",2,"g"),("black pepper, ground",1,"g"),("heavy cream",40,"ml")],
    "Season halibut. Pan-sear 4-5 min per side until golden. Drizzle with cream last minute. Serve immediately."),

  r("Keto Chicken Caesar Salad","lunch",
    ["keto","high-protein","low-carb","balanced"],1,
    [("chicken breast, broilers or fryers, raw",180,"g"),("romaine lettuce",120,"g"),("parmesan cheese",30,"g"),("olive oil",20,"ml"),("lemon juice, raw",15,"ml"),("dijon mustard",10,"g"),("sea salt",1,"g")],
    "Grill or pan-cook chicken breast; slice thin. Whisk olive oil, lemon, and Dijon for dressing. Toss romaine with dressing and parmesan. Top with sliced chicken."),

  r("Keto Avocado Tuna Lettuce Cups","lunch",
    ["keto","pescatarian","high-protein","low-carb","paleo"],1,
    [("tuna, canned in water, drained",160,"g"),("avocado, raw",100,"g"),("romaine lettuce",80,"g"),("lemon juice, raw",15,"ml"),("dijon mustard",10,"g"),("sea salt",1,"g")],
    "Mash avocado; mix with tuna, lemon juice, mustard, and salt. Spoon into large romaine leaves and serve as cups."),

  r("Keto Beef Zucchini Noodle Bowl","lunch",
    ["keto","high-protein","low-carb","paleo"],1,
    [("ground beef, 90% lean, raw",180,"g"),("zucchini, raw",200,"g"),("tomato products, canned, diced",150,"g"),("olive oil",15,"ml"),("garlic, raw",5,"g"),("italian seasoning",2,"g"),("sea salt",2,"g")],
    "Spiralize zucchini. Brown beef in olive oil with garlic and Italian seasoning. Add diced tomatoes; simmer 5 min. Pour over zucchini noodles."),

  r("Keto Salmon Spinach Salad","lunch",
    ["keto","pescatarian","high-protein","low-carb","mediterranean"],1,
    [("salmon, atlantic, farmed, raw",160,"g"),("spinach, raw",100,"g"),("avocado, raw",80,"g"),("olive oil",20,"ml"),("lemon juice, raw",15,"ml"),("sea salt",1,"g")],
    "Season salmon; pan-sear 4 min per side. Flake over fresh spinach and sliced avocado. Dress with olive oil and lemon."),

  r("Keto Egg Salad Lettuce Cups","lunch",
    ["keto","vegetarian","high-protein","low-carb"],1,
    [("egg, whole, hard-boiled",4,"whole"),("romaine lettuce",80,"g"),("dijon mustard",15,"g"),("olive oil",20,"ml"),("sea salt",1,"g"),("black pepper, ground",1,"g")],
    "Chop hard-boiled eggs. Mix with Dijon mustard, olive oil, salt, and pepper. Spoon into romaine lettuce cups."),

  r("Keto Turkey Avocado Lettuce Cups","lunch",
    ["keto","high-protein","low-carb"],1,
    [("turkey breast, deli, sliced",120,"g"),("avocado, raw",100,"g"),("romaine lettuce",80,"g"),("dijon mustard",10,"g"),("sea salt",1,"g"),("black pepper, ground",1,"g")],
    "Lay romaine leaves flat. Spread with Dijon. Layer turkey slices and sliced avocado. Season with salt and pepper."),

  r("Keto Shrimp Cauliflower Rice Bowl","lunch",
    ["keto","pescatarian","high-protein","low-carb","paleo"],1,
    [("shrimp, raw",180,"g"),("cauliflower, raw",250,"g"),("garlic, raw",5,"g"),("olive oil",20,"ml"),("lemon juice, raw",15,"ml"),("sea salt",2,"g")],
    "Pulse cauliflower to rice-size; sauté in 10ml oil 5 min. Cook shrimp in remaining oil with garlic 2 min per side. Serve shrimp over cauliflower rice with lemon."),

  r("Keto Pork Tenderloin Asparagus","lunch",
    ["keto","high-protein","low-carb","paleo"],2,
    [("pork tenderloin, raw",350,"g"),("asparagus, raw",200,"g"),("olive oil",20,"ml"),("garlic, raw",5,"g"),("sea salt",2,"g"),("black pepper, ground",1,"g")],
    "Season pork with salt, pepper, garlic. Sear all sides in oil; roast at 400°F for 18 min. Toss asparagus with oil and roast last 12 min. Slice and plate together."),

  r("Keto Cheddar Beef Stuffed Peppers","lunch",
    ["keto","high-protein","low-carb"],2,
    [("ground beef, 80% lean, raw",250,"g"),("bell peppers, raw",200,"g"),("cheddar cheese",80,"g"),("onions, raw",60,"g"),("sea salt",2,"g"),("black pepper, ground",1,"g")],
    "Halve and hollow peppers. Brown beef with diced onion; season. Fill pepper halves. Top with shredded cheddar. Bake at 375°F for 20 min."),

  r("Keto Lamb Feta Salad","lunch",
    ["keto","high-protein","low-carb","mediterranean"],1,
    [("lamb, rib chop, lean, raw",180,"g"),("mixed greens",80,"g"),("feta cheese",50,"g"),("cucumber, raw",80,"g"),("olive oil",20,"ml"),("lemon juice, raw",15,"ml"),("sea salt",1,"g")],
    "Season and cook lamb chop 3 min per side. Rest and slice thin. Toss greens, cucumber, feta with oil and lemon. Top with sliced lamb."),

  r("Keto Ground Beef Taco Lettuce Bowl","lunch",
    ["keto","high-protein","low-carb"],1,
    [("ground beef, 90% lean, raw",180,"g"),("romaine lettuce",100,"g"),("avocado, raw",80,"g"),("cheddar cheese",40,"g"),("salsa, ready-to-serve",40,"g"),("cumin, ground",2,"g"),("sea salt",2,"g")],
    "Brown beef with cumin and salt. Arrange chopped romaine in bowl. Top with beef, diced avocado, cheddar, and salsa."),

  r("Vegan Tempeh Stir Fry Bowl","lunch",
    ["vegan","vegetarian","high-protein","balanced"],1,
    [("tempeh",150,"g"),("broccoli, raw",120,"g"),("brown rice, cooked",185,"g"),("sesame oil",15,"ml"),("soy sauce",20,"ml"),("ginger root, raw",5,"g"),("garlic, raw",5,"g")],
    "Cube tempeh; stir-fry in sesame oil 5 min until golden. Add broccoli, garlic, ginger; cook 4 min. Add soy sauce; toss. Serve over brown rice."),

  r("Vegan Lentil Avocado Power Bowl","lunch",
    ["vegan","vegetarian","high-protein","balanced","mediterranean"],1,
    [("lentils, mature seeds, cooked, boiled",200,"g"),("avocado, raw",100,"g"),("spinach, raw",60,"g"),("tomatoes, cherry",80,"g"),("lemon juice, raw",15,"ml"),("olive oil",15,"ml"),("cumin, ground",2,"g")],
    "Warm lentils with cumin and olive oil. Place spinach in bowl; top with lentils, sliced avocado, and cherry tomatoes. Drizzle lemon juice."),

  r("Vegan Black Bean Quinoa Lunch Bowl","lunch",
    ["vegan","vegetarian","high-protein","balanced"],1,
    [("black beans, canned, drained",150,"g"),("quinoa, cooked",185,"g"),("avocado, raw",80,"g"),("tomatoes, cherry",80,"g"),("olive oil",10,"ml"),("lemon juice, raw",15,"ml"),("cumin, ground",2,"g")],
    "Mix warm quinoa with black beans, cumin, and olive oil. Top with diced avocado and halved cherry tomatoes. Drizzle lemon and serve."),

  r("Vegan Tofu Peanut Rice Bowl","lunch",
    ["vegan","vegetarian","high-protein","balanced"],1,
    [("tofu, firm, raw",150,"g"),("brown rice, cooked",185,"g"),("peanut butter, smooth",30,"g"),("soy sauce",20,"ml"),("ginger root, raw",5,"g"),("cucumber, raw",80,"g"),("sesame oil",10,"ml")],
    "Bake tofu cubes at 400°F for 20 min until crispy. Whisk peanut butter, soy sauce, ginger, sesame oil for sauce. Toss with rice and tofu; add cucumber strips."),

  r("Vegan Chickpea Spinach Wrap","lunch",
    ["vegan","vegetarian","high-protein","balanced"],1,
    [("chickpeas, mature seeds, canned, drained",150,"g"),("spinach, raw",60,"g"),("flour tortilla, large",60,"g"),("avocado, raw",80,"g"),("lemon juice, raw",15,"ml"),("cumin, ground",2,"g"),("sea salt",1,"g")],
    "Mash chickpeas with lemon, cumin, salt. Spread on tortilla. Layer with spinach and sliced avocado. Roll tightly and slice."),

  r("Vegan Edamame Quinoa Salad","lunch",
    ["vegan","vegetarian","high-protein","balanced"],1,
    [("quinoa, cooked",185,"g"),("edamame, frozen, prepared",120,"g"),("cucumber, raw",100,"g"),("sesame oil",15,"ml"),("soy sauce",15,"ml"),("ginger root, raw",5,"g"),("lemon juice, raw",10,"ml")],
    "Combine quinoa and edamame. Toss with sesame oil, soy sauce, grated ginger, and lemon. Add diced cucumber. Serve warm or chilled."),

  r("Vegan Butternut Squash Lentil Soup","lunch",
    ["vegan","vegetarian","high-protein","balanced"],2,
    [("lentils, mature seeds, cooked, boiled",200,"g"),("butternut squash, raw",250,"g"),("onions, raw",80,"g"),("garlic, raw",5,"g"),("olive oil",15,"ml"),("cumin, ground",3,"g"),("sea salt",2,"g")],
    "Sauté onion and garlic in oil 3 min. Add cubed squash, lentils, 600ml water, cumin, salt. Simmer 20 min until squash is tender. Blend partially for creamy texture."),

  r("Vegan Kidney Bean Veggie Bowl","lunch",
    ["vegan","vegetarian","high-protein","balanced"],1,
    [("kidney beans, canned, drained",150,"g"),("brown rice, cooked",185,"g"),("kale, raw",80,"g"),("olive oil",15,"ml"),("lemon juice, raw",15,"ml"),("garlic, raw",5,"g"),("sea salt",1,"g")],
    "Massage kale with olive oil and lemon 2 min. Warm kidney beans with garlic. Bowl: rice base, topped with beans and massaged kale. Season and serve."),

  r("Vegan Kale Tahini Buddha Bowl","lunch",
    ["vegan","vegetarian","high-protein","balanced","mediterranean"],1,
    [("chickpeas, mature seeds, canned, drained",120,"g"),("kale, raw",100,"g"),("quinoa, cooked",150,"g"),("tahini",30,"g"),("lemon juice, raw",20,"ml"),("olive oil",10,"ml"),("garlic, raw",4,"g")],
    "Roast chickpeas at 400°F 25 min until crispy. Massage kale with olive oil. Whisk tahini with lemon and garlic for dressing. Bowl: quinoa, kale, chickpeas; drizzle dressing."),

  r("Vegan Tempeh Avocado Wrap","lunch",
    ["vegan","vegetarian","high-protein","balanced"],1,
    [("tempeh",120,"g"),("avocado, raw",80,"g"),("flour tortilla, large",60,"g"),("spinach, raw",40,"g"),("soy sauce",15,"ml"),("sesame oil",10,"ml")],
    "Slice tempeh; pan-fry in sesame oil with soy sauce 3 min per side. Warm tortilla; layer spinach, tempeh, and sliced avocado. Roll and serve."),

  r("Vegan Black Bean Sweet Potato Burrito Bowl","lunch",
    ["vegan","vegetarian","high-protein","balanced"],1,
    [("black beans, canned, drained",150,"g"),("sweet potato, raw",150,"g"),("brown rice, cooked",150,"g"),("salsa, ready-to-serve",50,"g"),("olive oil",10,"ml"),("cumin, ground",2,"g"),("sea salt",1,"g")],
    "Dice and roast sweet potato with oil, cumin, salt at 400°F 20 min. Warm beans. Bowl: rice base topped with black beans, roasted sweet potato, and salsa."),

  r("Vegan Lentil Mango Salad","lunch",
    ["vegan","vegetarian","high-protein","balanced"],1,
    [("lentils, mature seeds, cooked, boiled",180,"g"),("mango, raw",100,"g"),("arugula, raw",80,"g"),("lemon juice, raw",20,"ml"),("olive oil",15,"ml"),("sea salt",1,"g")],
    "Toss warm lentils with olive oil, lemon, and salt. Mix with fresh arugula and diced mango. Serve immediately."),

  r("Vegan Tofu Sesame Noodles","lunch",
    ["vegan","vegetarian","high-protein","balanced"],1,
    [("tofu, firm, raw",150,"g"),("brown rice, cooked",185,"g"),("sesame oil",15,"ml"),("soy sauce",20,"ml"),("peanut butter, smooth",20,"g"),("ginger root, raw",5,"g"),("cucumber, raw",80,"g")],
    "Bake tofu until crispy. Whisk sesame oil, soy sauce, peanut butter, grated ginger for sauce. Toss brown rice with sauce; top with tofu and sliced cucumber."),

  r("Vegan Chickpea Avocado Salad","lunch",
    ["vegan","vegetarian","high-protein","balanced","mediterranean"],1,
    [("chickpeas, mature seeds, canned, drained",150,"g"),("avocado, raw",100,"g"),("cucumber, raw",100,"g"),("tomatoes, cherry",80,"g"),("lemon juice, raw",20,"ml"),("olive oil",15,"ml"),("sea salt",1,"g")],
    "Combine chickpeas, diced avocado, sliced cucumber, halved cherry tomatoes. Dress with olive oil, lemon, and salt. Toss gently and serve."),

  r("Pescatarian Salmon Caesar Wrap","lunch",
    ["pescatarian","high-protein","balanced","mediterranean"],1,
    [("salmon, atlantic, farmed, raw",150,"g"),("romaine lettuce",80,"g"),("flour tortilla, large",60,"g"),("parmesan cheese",20,"g"),("lemon juice, raw",15,"ml"),("olive oil",15,"ml"),("dijon mustard",10,"g")],
    "Pan-sear salmon 4 min per side; flake. Whisk oil, lemon, Dijon, parmesan for dressing. Toss romaine with dressing; fill tortilla with romaine and salmon. Roll and slice."),

  r("Pescatarian Tuna Brown Rice Bowl","lunch",
    ["pescatarian","high-protein","balanced"],1,
    [("tuna, canned in water, drained",140,"g"),("brown rice, cooked",185,"g"),("avocado, raw",80,"g"),("cucumber, raw",80,"g"),("soy sauce",15,"ml"),("sesame oil",10,"ml"),("lemon juice, raw",10,"ml")],
    "Season tuna with soy sauce, sesame oil, lemon. Arrange over brown rice. Top with sliced avocado and cucumber."),

  r("Pescatarian Shrimp Avocado Salad","lunch",
    ["pescatarian","keto","high-protein","low-carb","paleo"],1,
    [("shrimp, raw",180,"g"),("avocado, raw",100,"g"),("mixed greens",80,"g"),("cucumber, raw",80,"g"),("lemon juice, raw",20,"ml"),("olive oil",15,"ml"),("sea salt",1,"g")],
    "Boil or grill shrimp 2-3 min until pink. Chill. Toss greens, cucumber, and avocado. Top with shrimp. Dress with olive oil and lemon."),

  r("Pescatarian Cod Taco Bowl","lunch",
    ["pescatarian","high-protein","balanced"],1,
    [("cod, atlantic, raw",160,"g"),("brown rice, cooked",150,"g"),("cabbage, raw",80,"g"),("avocado, raw",80,"g"),("salsa, ready-to-serve",50,"g"),("olive oil",15,"ml"),("lemon juice, raw",15,"ml")],
    "Season cod; bake at 400°F 12 min. Flake into bowl with rice. Top with shredded cabbage, avocado, salsa. Drizzle oil and lemon."),

  r("Pescatarian Halibut Quinoa Salad","lunch",
    ["pescatarian","high-protein","balanced","mediterranean"],1,
    [("halibut, atlantic, raw",160,"g"),("quinoa, cooked",150,"g"),("arugula, raw",80,"g"),("lemon juice, raw",20,"ml"),("olive oil",15,"ml"),("sea salt",1,"g")],
    "Season halibut; pan-sear 4 min per side. Flake over warm quinoa and fresh arugula. Dress with olive oil and lemon."),

  r("Pescatarian Mahi Mahi Veggie Bowl","lunch",
    ["pescatarian","high-protein","balanced","paleo"],1,
    [("mahi-mahi, raw",160,"g"),("quinoa, cooked",150,"g"),("broccoli, raw",100,"g"),("lemon juice, raw",15,"ml"),("olive oil",15,"ml"),("sea salt",1,"g"),("garlic, raw",4,"g")],
    "Roast broccoli with oil, garlic, salt at 400°F 15 min. Pan-sear mahi mahi 4 min per side. Serve fish and broccoli over quinoa with lemon."),

  r("Pescatarian Tilapia Taco Bowl","lunch",
    ["pescatarian","high-protein","balanced"],1,
    [("tilapia, raw",160,"g"),("brown rice, cooked",150,"g"),("black beans, canned, drained",80,"g"),("avocado, raw",80,"g"),("salsa, ready-to-serve",50,"g"),("olive oil",10,"ml"),("cumin, ground",2,"g")],
    "Season tilapia with cumin; cook in olive oil 3 min per side. Flake over rice. Top with black beans, avocado, and salsa."),

  r("Pescatarian Smoked Salmon Grain Bowl","lunch",
    ["pescatarian","high-protein","balanced","mediterranean"],1,
    [("smoked salmon",100,"g"),("quinoa, cooked",150,"g"),("arugula, raw",60,"g"),("cucumber, raw",80,"g"),("olive oil",15,"ml"),("lemon juice, raw",15,"ml")],
    "Layer quinoa in bowl. Top with arugula, cucumber, and smoked salmon. Drizzle with olive oil and lemon."),

  r("Pescatarian Shrimp Edamame Bowl","lunch",
    ["pescatarian","high-protein","balanced"],1,
    [("shrimp, raw",150,"g"),("edamame, frozen, prepared",100,"g"),("brown rice, cooked",150,"g"),("sesame oil",15,"ml"),("soy sauce",15,"ml"),("ginger root, raw",5,"g")],
    "Cook shrimp in sesame oil with grated ginger 2 min per side. Add edamame and soy sauce; toss. Serve over brown rice."),

  r("Pescatarian Tuna Mediterranean Salad","lunch",
    ["pescatarian","mediterranean","high-protein","balanced","low-carb"],1,
    [("tuna, canned in water, drained",140,"g"),("mixed greens",80,"g"),("tomatoes, cherry",80,"g"),("cucumber, raw",80,"g"),("feta cheese",40,"g"),("olive oil",20,"ml"),("lemon juice, raw",15,"ml")],
    "Toss greens, cherry tomatoes, and cucumber with olive oil and lemon. Top with tuna and crumbled feta."),

  r("Pescatarian Salmon Lentil Bowl","lunch",
    ["pescatarian","high-protein","balanced","mediterranean"],1,
    [("salmon, atlantic, farmed, raw",140,"g"),("lentils, mature seeds, cooked, boiled",150,"g"),("spinach, raw",60,"g"),("lemon juice, raw",20,"ml"),("olive oil",15,"ml"),("sea salt",1,"g")],
    "Pan-sear salmon 4 min per side. Flake over warm lentils and fresh spinach. Dress with olive oil and lemon."),

  r("Pescatarian Cod Kale Salad","lunch",
    ["pescatarian","high-protein","balanced","paleo"],1,
    [("cod, atlantic, raw",160,"g"),("kale, raw",100,"g"),("avocado, raw",80,"g"),("lemon juice, raw",20,"ml"),("olive oil",20,"ml"),("sea salt",1,"g")],
    "Bake cod at 400°F 12 min. Massage kale with olive oil and lemon until tender. Serve flaked cod over kale with sliced avocado."),

  r("Pescatarian Tilapia Brown Rice Power Bowl","lunch",
    ["pescatarian","high-protein","balanced"],1,
    [("tilapia, raw",160,"g"),("brown rice, cooked",185,"g"),("broccoli, raw",100,"g"),("sesame oil",10,"ml"),("soy sauce",15,"ml"),("sea salt",1,"g")],
    "Pan-cook tilapia in sesame oil 3 min per side. Steam broccoli 4 min. Serve fish and broccoli over brown rice with soy sauce."),

  r("Pescatarian Shrimp Quinoa Mediterranean Bowl","lunch",
    ["pescatarian","mediterranean","high-protein","balanced"],1,
    [("shrimp, raw",150,"g"),("quinoa, cooked",150,"g"),("tomatoes, cherry",80,"g"),("feta cheese",40,"g"),("cucumber, raw",60,"g"),("olive oil",15,"ml"),("lemon juice, raw",15,"ml")],
    "Grill shrimp 2 min per side. Toss quinoa with cherry tomatoes, cucumber, feta, olive oil, and lemon. Top with shrimp."),

  r("Paleo Chicken Sweet Potato Bowl","lunch",
    ["paleo","high-protein","balanced"],1,
    [("chicken breast, broilers or fryers, raw",180,"g"),("sweet potato, raw",150,"g"),("spinach, raw",60,"g"),("olive oil",15,"ml"),("sea salt",2,"g"),("paprika",2,"g")],
    "Dice sweet potato; roast with oil, salt, paprika at 400°F 20 min. Pan-cook chicken 6 min per side. Slice and serve over spinach with sweet potato."),

  r("Paleo Beef Lettuce Wrap","lunch",
    ["paleo","keto","high-protein","low-carb"],1,
    [("ground beef, 90% lean, raw",180,"g"),("romaine lettuce",80,"g"),("avocado, raw",80,"g"),("onions, raw",40,"g"),("salsa, ready-to-serve",40,"g"),("olive oil",10,"ml"),("cumin, ground",2,"g")],
    "Cook ground beef with onion, cumin, and olive oil until browned. Spoon into romaine leaves. Top with salsa and sliced avocado."),

  r("Paleo Salmon Avocado Mixed Green Salad","lunch",
    ["paleo","pescatarian","keto","high-protein","low-carb"],1,
    [("salmon, atlantic, farmed, raw",160,"g"),("avocado, raw",100,"g"),("mixed greens",80,"g"),("lemon juice, raw",20,"ml"),("olive oil",20,"ml"),("sea salt",1,"g")],
    "Pan-sear salmon skin-side down 4 min; flip and cook 2 min. Flake over greens with sliced avocado. Dress with olive oil and lemon."),

  r("Paleo Turkey Veggie Roasted Bowl","lunch",
    ["paleo","high-protein","balanced"],1,
    [("turkey breast, raw",180,"g"),("sweet potato, raw",120,"g"),("broccoli, raw",120,"g"),("olive oil",15,"ml"),("sea salt",2,"g"),("paprika",2,"g")],
    "Roast cubed sweet potato and broccoli with oil and paprika at 400°F 20 min. Pan-cook turkey 6 min per side. Slice and serve with vegetables."),

  r("Paleo Lamb Roasted Vegetable Plate","lunch",
    ["paleo","high-protein","balanced"],1,
    [("lamb, rib chop, lean, raw",200,"g"),("zucchini, raw",150,"g"),("bell peppers, raw",100,"g"),("olive oil",20,"ml"),("rosemary, fresh",5,"g"),("sea salt",2,"g")],
    "Toss sliced zucchini and peppers with oil, rosemary, salt; roast at 400°F 15 min. Season lamb chop; sear 3-4 min per side. Serve with vegetables."),

  r("Paleo Beef and Beet Salad","lunch",
    ["paleo","high-protein","balanced"],1,
    [("beef, sirloin steak, lean, raw",180,"g"),("beets, raw",150,"g"),("arugula, raw",80,"g"),("walnuts, raw",20,"g"),("olive oil",20,"ml"),("balsamic vinegar",15,"ml"),("sea salt",1,"g")],
    "Roast beets at 400°F 45 min; peel and slice. Sear steak 3 min per side; rest and slice. Toss arugula with oil and balsamic. Top with steak, beets, walnuts."),

  r("Paleo Chicken Butternut Squash Bowl","lunch",
    ["paleo","high-protein","balanced"],1,
    [("chicken breast, broilers or fryers, raw",180,"g"),("butternut squash, raw",150,"g"),("spinach, raw",60,"g"),("olive oil",15,"ml"),("cinnamon, ground",1,"g"),("sea salt",2,"g")],
    "Cube squash; roast with oil, cinnamon, salt at 400°F 20 min. Pan-cook chicken 6 min per side. Slice and serve over spinach with roasted squash."),

  r("Paleo Ground Turkey Zucchini Bowl","lunch",
    ["paleo","keto","high-protein","low-carb"],1,
    [("ground turkey, raw",180,"g"),("zucchini, raw",200,"g"),("onions, raw",60,"g"),("garlic, raw",5,"g"),("olive oil",15,"ml"),("italian seasoning",2,"g"),("sea salt",2,"g")],
    "Brown ground turkey with onion and garlic in olive oil. Season with Italian seasoning. Slice zucchini; fold into turkey and cook 3 more min."),

  r("Paleo Pork Apple Salad","lunch",
    ["paleo","high-protein","balanced"],1,
    [("pork tenderloin, raw",180,"g"),("apples, raw",120,"g"),("mixed greens",80,"g"),("walnuts, raw",20,"g"),("olive oil",20,"ml"),("balsamic vinegar",15,"ml"),("sea salt",2,"g")],
    "Season pork; sear 3 min per side, finish at 400°F 10 min. Slice thin. Toss greens, sliced apple, walnuts with oil and balsamic. Top with pork."),

  r("Paleo Shrimp and Vegetable Salad","lunch",
    ["paleo","pescatarian","keto","high-protein","low-carb"],1,
    [("shrimp, raw",180,"g"),("avocado, raw",100,"g"),("mixed greens",80,"g"),("carrots, raw",60,"g"),("olive oil",20,"ml"),("lemon juice, raw",15,"ml"),("sea salt",1,"g")],
    "Cook shrimp in olive oil with salt 2 min per side. Chill briefly. Toss greens, julienned carrots, avocado with lemon and oil. Top with shrimp."),

  r("Mediterranean Chicken Quinoa Salad","lunch",
    ["mediterranean","high-protein","balanced"],1,
    [("chicken breast, broilers or fryers, raw",160,"g"),("quinoa, cooked",150,"g"),("tomatoes, cherry",80,"g"),("cucumber, raw",80,"g"),("feta cheese",40,"g"),("olive oil",20,"ml"),("lemon juice, raw",15,"ml")],
    "Pan-grill chicken 6 min per side; slice thin. Toss quinoa with tomatoes, cucumber, feta, olive oil, and lemon. Top with sliced chicken."),

  r("Mediterranean Lentil Tomato Soup","lunch",
    ["mediterranean","vegan","vegetarian","high-protein","balanced"],2,
    [("lentils, mature seeds, cooked, boiled",200,"g"),("tomato products, canned, diced",400,"g"),("onions, raw",80,"g"),("garlic, raw",8,"g"),("olive oil",20,"ml"),("cumin, ground",3,"g"),("sea salt",2,"g")],
    "Sauté onion and garlic in olive oil 4 min. Add lentils, diced tomatoes, cumin, salt, 400ml water. Simmer 15 min. Serve with olive oil drizzle."),

  r("Mediterranean Falafel Hummus Bowl","lunch",
    ["mediterranean","vegan","vegetarian","high-protein","balanced"],1,
    [("chickpeas, mature seeds, canned, drained",150,"g"),("hummus, commercial",80,"g"),("cucumber, raw",80,"g"),("tomatoes, cherry",80,"g"),("olive oil",15,"ml"),("lemon juice, raw",15,"ml"),("paprika",1,"g")],
    "Roast chickpeas with paprika at 400°F 25 min until crispy. Spread hummus in bowl. Top with crispy chickpeas, cucumber, tomatoes. Drizzle with olive oil and lemon."),

  r("Mediterranean Shrimp Tuna Salad","lunch",
    ["mediterranean","pescatarian","high-protein","low-carb","balanced"],1,
    [("shrimp, raw",120,"g"),("tuna, canned in water, drained",80,"g"),("mixed greens",80,"g"),("tomatoes, cherry",80,"g"),("olive oil",20,"ml"),("lemon juice, raw",15,"ml"),("feta cheese",30,"g")],
    "Cook shrimp 2 min per side; chill. Toss greens and tomatoes with olive oil and lemon. Top with shrimp, tuna, and crumbled feta."),

  r("Mediterranean Salmon Arugula Salad","lunch",
    ["mediterranean","pescatarian","high-protein","balanced","keto","low-carb"],1,
    [("salmon, atlantic, farmed, raw",160,"g"),("arugula, raw",80,"g"),("tomatoes, cherry",80,"g"),("feta cheese",40,"g"),("olive oil",20,"ml"),("balsamic vinegar",15,"ml"),("sea salt",1,"g")],
    "Pan-sear salmon 4 min per side. Toss arugula and tomatoes with olive oil and balsamic. Top with flaked salmon and crumbled feta."),

  r("Mediterranean Greek Veggie Bowl","lunch",
    ["mediterranean","vegan","vegetarian","balanced"],1,
    [("quinoa, cooked",150,"g"),("cucumber, raw",100,"g"),("tomatoes, cherry",80,"g"),("hummus, commercial",80,"g"),("olive oil",15,"ml"),("lemon juice, raw",15,"ml")],
    "Bowl: quinoa base topped with hummus. Add cucumber and cherry tomatoes. Drizzle with olive oil and lemon juice."),

  r("Mediterranean Chicken Eggplant Bowl","lunch",
    ["mediterranean","high-protein","balanced","paleo"],1,
    [("chicken breast, broilers or fryers, raw",160,"g"),("eggplant, raw",150,"g"),("tomato products, canned, diced",150,"g"),("olive oil",20,"ml"),("garlic, raw",5,"g"),("italian seasoning",2,"g"),("sea salt",2,"g")],
    "Cube eggplant; sauté in olive oil with garlic and Italian seasoning 5 min. Add tomatoes; simmer 10 min. Pan-cook chicken 6 min per side, slice; serve over eggplant."),

  r("Mediterranean Tuna Olive Salad","lunch",
    ["mediterranean","pescatarian","high-protein","low-carb","balanced"],1,
    [("tuna, canned in water, drained",140,"g"),("mixed greens",80,"g"),("cucumber, raw",80,"g"),("tomatoes, cherry",80,"g"),("olive oil",25,"ml"),("lemon juice, raw",15,"ml"),("sea salt",1,"g")],
    "Toss greens, cucumber, and tomatoes with olive oil and lemon. Top with drained tuna; season with salt."),
]

# ── DINNER (70 recipes) ───────────────────────────────────────────────────────
dinner = [
  r("Carnivore NY Strip Steak Dinner","dinner",
    ["carnivore","keto","paleo","high-protein","low-carb"],1,
    [("beef, sirloin steak, lean, raw",280,"g"),("sea salt",3,"g"),("black pepper, ground",2,"g"),("beef broth",80,"ml")],
    "Season steak heavily with salt and pepper. Sear in cast iron 4 min per side for medium-rare. Rest 5 min. Serve with broth as au jus."),

  r("Carnivore Lamb Rack Dinner Plate","dinner",
    ["carnivore","keto","paleo","high-protein","low-carb"],1,
    [("lamb, rib chop, lean, raw",300,"g"),("sea salt",4,"g"),("black pepper, ground",2,"g")],
    "Season lamb rack with salt and pepper. Sear fat-side down 3 min; transfer to 400°F oven for 12-15 min until internal temp 135°F. Rest 5 min."),

  r("Carnivore Pork Chop Dinner","dinner",
    ["carnivore","keto","high-protein","low-carb"],1,
    [("pork chop, lean, raw",280,"g"),("sea salt",3,"g"),("black pepper, ground",2,"g"),("heavy cream",60,"ml")],
    "Season pork chop. Sear 5 min per side in hot skillet. Remove; add cream to pan and reduce 2 min. Serve chop with cream sauce."),

  r("Carnivore Ground Beef Dinner Bowl","dinner",
    ["carnivore","keto","high-protein","low-carb"],1,
    [("ground beef, 80% lean, raw",250,"g"),("egg, whole, raw",2,"whole"),("cheddar cheese",60,"g"),("sea salt",2,"g"),("black pepper, ground",1,"g")],
    "Brown ground beef in a pan; season with salt and pepper. Push to one side; fry eggs in rendered fat. Top with melted cheddar. Serve in bowl."),

  r("Carnivore Beef Liver Bacon Dinner","dinner",
    ["carnivore","keto","paleo","high-protein"],1,
    [("beef liver, raw",250,"g"),("bacon, cured, pan-fried",50,"g"),("sea salt",2,"g"),("black pepper, ground",1,"g"),("beef broth",60,"ml")],
    "Cook bacon until crisp; remove. In bacon fat, cook sliced liver 3 min per side. Deglaze with broth. Serve liver topped with bacon."),

  r("Carnivore Turkey Breast Dinner","dinner",
    ["carnivore","keto","high-protein","low-carb"],2,
    [("turkey breast, raw",400,"g"),("sea salt",4,"g"),("black pepper, ground",2,"g"),("chicken broth",100,"ml")],
    "Season turkey breast generously. Sear all sides in hot pan; add broth and bake at 375°F for 25-30 min until internal temp 165°F. Rest 5 min, slice."),

  r("Carnivore Ribeye with Bone Broth","dinner",
    ["carnivore","keto","paleo","high-protein","low-carb"],1,
    [("beef, sirloin steak, lean, raw",300,"g"),("beef broth",120,"ml"),("sea salt",3,"g"),("black pepper, ground",2,"g")],
    "Season ribeye. Sear 4 min per side in very hot cast iron. Rest 5 min. Warm beef broth and serve alongside for sipping."),

  r("Carnivore Shrimp Cream Dinner","dinner",
    ["carnivore","keto","pescatarian","high-protein","low-carb"],1,
    [("shrimp, raw",250,"g"),("heavy cream",100,"ml"),("sea salt",2,"g"),("black pepper, ground",1,"g")],
    "Cook shrimp in hot pan 1-2 min per side until pink. Add heavy cream; simmer 3 min to make sauce. Season with salt and pepper."),

  r("Carnivore Halibut Dinner","dinner",
    ["carnivore","keto","pescatarian","high-protein","low-carb"],1,
    [("halibut, atlantic, raw",250,"g"),("sea salt",3,"g"),("black pepper, ground",2,"g"),("heavy cream",50,"ml")],
    "Season halibut. Pan-sear 5 min per side until golden and cooked through. Drizzle cream over fish in last minute of cooking. Serve immediately."),

  r("Carnivore Ground Lamb Dinner Bowl","dinner",
    ["carnivore","keto","paleo","high-protein","low-carb"],1,
    [("lamb, rib chop, lean, raw",250,"g"),("ground beef, 90% lean, raw",150,"g"),("sea salt",3,"g"),("black pepper, ground",2,"g")],
    "Mince lamb; combine with ground beef, salt, pepper. Form into thick patties. Cook in hot dry pan 4 min per side for medium. Serve in bowl."),

  r("Carnivore Pork Tenderloin Dinner","dinner",
    ["carnivore","keto","high-protein","low-carb"],2,
    [("pork tenderloin, raw",500,"g"),("heavy cream",80,"ml"),("sea salt",4,"g"),("black pepper, ground",2,"g")],
    "Season pork. Sear all sides in hot pan; roast at 400°F for 20 min until internal 145°F. Rest, slice. Reduce cream in pan for sauce."),

  r("Carnivore Sirloin Ground Beef Mix","dinner",
    ["carnivore","keto","paleo","high-protein","low-carb"],2,
    [("beef, sirloin steak, lean, raw",200,"g"),("ground beef, 80% lean, raw",200,"g"),("sea salt",3,"g"),("black pepper, ground",2,"g"),("beef broth",80,"ml")],
    "Form ground beef into 2 patties; cook 4 min per side. Sear sirloin 3 min per side. Serve both on plate with broth drizzle."),

  r("Carnivore Salmon Butter Dinner","dinner",
    ["carnivore","keto","pescatarian","paleo","high-protein","low-carb"],1,
    [("salmon, atlantic, farmed, raw",250,"g"),("sea salt",3,"g"),("black pepper, ground",2,"g"),("heavy cream",50,"ml")],
    "Season salmon. Sear skin-side down 5 min; flip and cook 3 min. Drizzle with cream in last minute. Serve immediately."),

  r("Keto Chicken Parmesan Style","dinner",
    ["keto","high-protein","low-carb"],2,
    [("chicken breast, broilers or fryers, raw",360,"g"),("mozzarella cheese",80,"g"),("tomato products, canned, diced",200,"g"),("parmesan cheese",40,"g"),("olive oil",20,"ml"),("italian seasoning",3,"g"),("sea salt",2,"g")],
    "Pound chicken thin; season and pan-sear in olive oil 4 min per side. Top with tomato, mozzarella, and parmesan. Bake at 375°F for 12 min until cheese is bubbly."),

  r("Keto Beef Zucchini Lasagna","dinner",
    ["keto","high-protein","low-carb"],2,
    [("ground beef, 80% lean, raw",300,"g"),("zucchini, raw",300,"g"),("ricotta cheese, whole milk",150,"g"),("mozzarella cheese",100,"g"),("tomato products, canned, diced",200,"g"),("sea salt",3,"g"),("italian seasoning",3,"g")],
    "Slice zucchini lengthwise into strips. Brown beef with Italian seasoning. Layer in baking dish: zucchini, beef, ricotta, diced tomato, mozzarella. Bake at 375°F for 35 min."),

  r("Keto Shrimp Scampi Zucchini Noodles","dinner",
    ["keto","pescatarian","high-protein","low-carb","paleo"],1,
    [("shrimp, raw",200,"g"),("zucchini, raw",250,"g"),("garlic, raw",8,"g"),("olive oil",25,"ml"),("lemon juice, raw",20,"ml"),("sea salt",2,"g"),("black pepper, ground",1,"g")],
    "Spiralize zucchini. Cook shrimp in olive oil with garlic 2 min per side. Add zucchini noodles; toss 2 min. Finish with lemon juice, salt, and pepper."),

  r("Keto Lamb Cauliflower Mash Plate","dinner",
    ["keto","high-protein","low-carb"],1,
    [("lamb, rib chop, lean, raw",250,"g"),("cauliflower, raw",300,"g"),("heavy cream",60,"ml"),("olive oil",20,"ml"),("sea salt",2,"g"),("rosemary, fresh",5,"g")],
    "Steam cauliflower until tender; blend with cream, salt, and olive oil for mash. Season lamb with rosemary and salt; sear 3-4 min per side. Serve over cauli mash."),

  r("Keto Salmon Avocado Cream Dinner","dinner",
    ["keto","pescatarian","high-protein","low-carb","paleo"],1,
    [("salmon, atlantic, farmed, raw",220,"g"),("avocado, raw",120,"g"),("heavy cream",50,"ml"),("lemon juice, raw",15,"ml"),("sea salt",2,"g"),("garlic, raw",4,"g")],
    "Sear salmon skin-side down 5 min; flip and cook 3 min. Blend avocado, cream, lemon, garlic for sauce. Serve salmon over avocado cream."),

  r("Keto Turkey Stuffed Bell Pepper","dinner",
    ["keto","high-protein","low-carb"],2,
    [("ground turkey, raw",300,"g"),("bell peppers, raw",250,"g"),("cheddar cheese",80,"g"),("onions, raw",60,"g"),("tomato products, canned, diced",150,"g"),("italian seasoning",3,"g"),("sea salt",2,"g")],
    "Halve and hollow peppers. Brown turkey with onion, Italian seasoning; stir in diced tomato. Fill peppers, top with cheddar. Bake at 375°F for 25 min."),

  r("Keto Beef Cauliflower Stew","dinner",
    ["keto","high-protein","low-carb","paleo"],2,
    [("ground beef, 90% lean, raw",300,"g"),("cauliflower, raw",250,"g"),("tomato products, canned, diced",200,"g"),("beef broth",200,"ml"),("onions, raw",80,"g"),("garlic, raw",6,"g"),("olive oil",15,"ml")],
    "Brown beef with onion and garlic. Add cauliflower florets, tomatoes, and broth. Simmer covered 20 min until cauliflower is tender. Season and serve."),

  r("Keto Cod Parmesan Crust Dinner","dinner",
    ["keto","pescatarian","high-protein","low-carb"],1,
    [("cod, atlantic, raw",220,"g"),("parmesan cheese",50,"g"),("almond flour",30,"g"),("olive oil",20,"ml"),("sea salt",2,"g"),("black pepper, ground",1,"g")],
    "Mix parmesan and almond flour. Press onto top of cod fillets. Bake at 400°F for 15 min until crust is golden and fish flakes easily."),

  r("Keto Chicken Thigh Asparagus Plate","dinner",
    ["keto","high-protein","low-carb","paleo"],2,
    [("chicken breast, broilers or fryers, raw",360,"g"),("asparagus, raw",200,"g"),("olive oil",25,"ml"),("garlic, raw",5,"g"),("lemon juice, raw",15,"ml"),("sea salt",2,"g")],
    "Season chicken; roast at 400°F for 25-30 min until golden. Toss asparagus with oil and garlic; roast last 12 min. Squeeze lemon over everything. Serve together."),

  r("Keto Mozzarella Stuffed Meatballs","dinner",
    ["keto","high-protein","low-carb"],2,
    [("ground beef, 80% lean, raw",300,"g"),("mozzarella cheese",80,"g"),("egg, whole, raw",1,"whole"),("almond flour",30,"g"),("italian seasoning",3,"g"),("sea salt",2,"g")],
    "Mix beef, egg, almond flour, Italian seasoning, salt. Form balls stuffed with mozzarella cube. Bake at 400°F for 20 min until browned and cooked through."),

  r("Keto Pork Tenderloin Cream Sauce","dinner",
    ["keto","high-protein","low-carb"],2,
    [("pork tenderloin, raw",500,"g"),("heavy cream",100,"ml"),("garlic, raw",5,"g"),("sea salt",3,"g"),("black pepper, ground",2,"g"),("rosemary, fresh",5,"g")],
    "Season pork with rosemary, salt, pepper. Sear all sides; roast at 400°F 20 min. Rest and slice. Deglaze pan with cream and garlic; reduce 3 min. Serve sauce over pork."),

  r("Keto Halibut Herb Butter Dinner","dinner",
    ["keto","pescatarian","high-protein","low-carb","paleo"],1,
    [("halibut, atlantic, raw",220,"g"),("olive oil",20,"ml"),("lemon juice, raw",15,"ml"),("garlic, raw",4,"g"),("rosemary, fresh",5,"g"),("sea salt",2,"g")],
    "Marinate halibut in olive oil, lemon, garlic, rosemary 10 min. Pan-sear 4-5 min per side until golden. Serve with pan drippings."),

  r("Vegan Tempeh Broccoli Stir Fry","dinner",
    ["vegan","vegetarian","high-protein","balanced"],2,
    [("tempeh",200,"g"),("broccoli, raw",200,"g"),("brown rice, cooked",370,"g"),("sesame oil",20,"ml"),("soy sauce",30,"ml"),("ginger root, raw",8,"g"),("garlic, raw",5,"g")],
    "Cube tempeh; stir-fry in sesame oil 5 min. Add broccoli, garlic, ginger; cook 4 min. Add soy sauce; toss until coated. Serve over brown rice."),

  r("Vegan Lentil Walnut Bolognese","dinner",
    ["vegan","vegetarian","high-protein","balanced"],2,
    [("lentils, mature seeds, cooked, boiled",250,"g"),("walnuts, raw",40,"g"),("tomato products, canned, diced",400,"g"),("onions, raw",80,"g"),("garlic, raw",6,"g"),("olive oil",20,"ml"),("italian seasoning",3,"g")],
    "Pulse walnuts coarsely. Sauté onion and garlic in olive oil 4 min. Add lentils, walnuts, tomatoes, and Italian seasoning; simmer 20 min. Serve over spiralized zucchini or brown rice."),

  r("Vegan Black Bean Enchilada Bowl","dinner",
    ["vegan","vegetarian","high-protein","balanced"],2,
    [("black beans, canned, drained",300,"g"),("brown rice, cooked",370,"g"),("bell peppers, raw",150,"g"),("tomato products, canned, diced",200,"g"),("cumin, ground",3,"g"),("olive oil",15,"ml"),("sea salt",2,"g")],
    "Sauté peppers in olive oil 4 min. Add black beans, tomatoes, cumin, and salt; simmer 10 min. Serve over brown rice."),

  r("Vegan Tofu Tikka Masala","dinner",
    ["vegan","vegetarian","high-protein","balanced"],2,
    [("tofu, firm, raw",300,"g"),("coconut milk",200,"ml"),("tomato products, canned, diced",200,"g"),("onions, raw",80,"g"),("garlic, raw",6,"g"),("ginger root, raw",8,"g"),("cumin, ground",3,"g"),("olive oil",15,"ml")],
    "Cube and bake tofu at 400°F 20 min. Sauté onion, garlic, ginger in olive oil 4 min. Add tomatoes, coconut milk, cumin; simmer 15 min. Add tofu; simmer 5 min. Serve with brown rice."),

  r("Vegan Chickpea Eggplant Stew","dinner",
    ["vegan","vegetarian","high-protein","balanced","mediterranean"],2,
    [("chickpeas, mature seeds, canned, drained",250,"g"),("eggplant, raw",250,"g"),("tomato products, canned, diced",300,"g"),("onions, raw",80,"g"),("garlic, raw",6,"g"),("olive oil",20,"ml"),("cumin, ground",3,"g")],
    "Cube eggplant; sauté in olive oil with onion and garlic 6 min. Add chickpeas, tomatoes, cumin, and 200ml water. Simmer 20 min until thick. Serve over quinoa."),

  r("Vegan Tempeh Thai Peanut Bowl","dinner",
    ["vegan","vegetarian","high-protein","balanced"],2,
    [("tempeh",200,"g"),("brown rice, cooked",370,"g"),("broccoli, raw",150,"g"),("peanut butter, smooth",40,"g"),("soy sauce",25,"ml"),("ginger root, raw",8,"g"),("sesame oil",15,"ml")],
    "Cube tempeh; bake at 400°F 20 min. Steam broccoli 4 min. Whisk peanut butter, soy sauce, ginger, sesame oil for sauce. Toss all with sauce; serve over brown rice."),

  r("Vegan Lentil Shepherds Pie","dinner",
    ["vegan","vegetarian","high-protein","balanced"],2,
    [("lentils, mature seeds, cooked, boiled",250,"g"),("sweet potato, raw",300,"g"),("carrots, raw",100,"g"),("onions, raw",80,"g"),("olive oil",20,"ml"),("cumin, ground",2,"g"),("sea salt",3,"g")],
    "Roast mashed sweet potato with salt for topping. Sauté onion, carrot in oil 5 min; add lentils, cumin, 200ml water; simmer 10 min. Pour into baking dish; top with mashed sweet potato. Bake 400°F 20 min."),

  r("Vegan Black Bean Quinoa Chili","dinner",
    ["vegan","vegetarian","high-protein","balanced"],2,
    [("black beans, canned, drained",300,"g"),("quinoa, cooked",185,"g"),("tomato products, canned, diced",400,"g"),("bell peppers, raw",150,"g"),("onions, raw",80,"g"),("cumin, ground",4,"g"),("olive oil",15,"ml")],
    "Sauté onion and pepper in olive oil 4 min. Add black beans, tomatoes, cumin, and quinoa. Simmer 15 min until flavors meld. Season and serve."),

  r("Vegan Tofu Mushroom Stir Fry","dinner",
    ["vegan","vegetarian","high-protein","balanced"],1,
    [("tofu, firm, raw",180,"g"),("mushrooms, portobello, raw",150,"g"),("brown rice, cooked",185,"g"),("soy sauce",25,"ml"),("sesame oil",15,"ml"),("garlic, raw",5,"g"),("ginger root, raw",5,"g")],
    "Cube tofu; pan-fry in sesame oil until golden 6 min. Add sliced mushrooms, garlic, ginger; cook 4 min. Add soy sauce; toss. Serve over brown rice."),

  r("Vegan Chickpea Spinach Coconut Curry","dinner",
    ["vegan","vegetarian","high-protein","balanced"],2,
    [("chickpeas, mature seeds, canned, drained",300,"g"),("spinach, raw",120,"g"),("coconut milk",200,"ml"),("tomato products, canned, diced",200,"g"),("onions, raw",80,"g"),("garlic, raw",6,"g"),("cumin, ground",3,"g"),("olive oil",15,"ml")],
    "Sauté onion and garlic in olive oil 4 min. Add tomatoes, coconut milk, cumin; simmer 8 min. Add chickpeas; simmer 10 min. Stir in spinach until wilted. Serve with brown rice."),

  r("Vegan Edamame Tofu Rice Bowl","dinner",
    ["vegan","vegetarian","high-protein","balanced"],1,
    [("tofu, firm, raw",150,"g"),("edamame, frozen, prepared",100,"g"),("brown rice, cooked",185,"g"),("sesame oil",15,"ml"),("soy sauce",20,"ml"),("ginger root, raw",5,"g")],
    "Pan-fry tofu in sesame oil until golden. Add edamame and soy sauce; toss. Serve over brown rice with grated ginger."),

  r("Vegan Lentil Sweet Potato Soup","dinner",
    ["vegan","vegetarian","high-protein","balanced"],2,
    [("lentils, mature seeds, cooked, boiled",250,"g"),("sweet potato, raw",200,"g"),("onions, raw",80,"g"),("garlic, raw",5,"g"),("olive oil",15,"ml"),("cumin, ground",3,"g"),("sea salt",2,"g")],
    "Sauté onion and garlic in olive oil 3 min. Add cubed sweet potato, lentils, 600ml water, cumin, and salt. Simmer 20 min until sweet potato is tender. Blend partially."),

  r("Vegan Tempeh Buddha Bowl Tahini","dinner",
    ["vegan","vegetarian","high-protein","balanced"],1,
    [("tempeh",150,"g"),("quinoa, cooked",185,"g"),("kale, raw",80,"g"),("carrots, raw",80,"g"),("tahini",30,"g"),("lemon juice, raw",20,"ml"),("sesame oil",10,"ml")],
    "Bake tempeh slices at 400°F 20 min until crispy. Massage kale with sesame oil. Whisk tahini with lemon for dressing. Bowl: quinoa, kale, sliced carrot, tempeh; drizzle dressing."),

  r("Pescatarian Baked Halibut Tomato Dinner","dinner",
    ["pescatarian","mediterranean","high-protein","balanced","paleo"],2,
    [("halibut, atlantic, raw",400,"g"),("tomato products, canned, diced",200,"g"),("garlic, raw",5,"g"),("olive oil",20,"ml"),("italian seasoning",3,"g"),("sea salt",2,"g"),("lemon juice, raw",15,"ml")],
    "Place halibut in baking dish. Top with diced tomatoes, garlic, Italian seasoning, olive oil, and lemon. Bake at 400°F for 18-20 min until fish flakes."),

  r("Pescatarian Shrimp Stir Fry Brown Rice","dinner",
    ["pescatarian","high-protein","balanced"],2,
    [("shrimp, raw",300,"g"),("brown rice, cooked",370,"g"),("broccoli, raw",150,"g"),("sesame oil",20,"ml"),("soy sauce",25,"ml"),("garlic, raw",5,"g"),("ginger root, raw",5,"g")],
    "Stir-fry shrimp in sesame oil with garlic and ginger 2-3 min. Add broccoli; cook 4 min. Add soy sauce; toss. Serve over brown rice."),

  r("Pescatarian Salmon Herb Quinoa Dinner","dinner",
    ["pescatarian","mediterranean","high-protein","balanced"],2,
    [("salmon, atlantic, farmed, raw",360,"g"),("quinoa, cooked",370,"g"),("asparagus, raw",200,"g"),("olive oil",25,"ml"),("lemon juice, raw",20,"ml"),("garlic, raw",5,"g"),("sea salt",2,"g")],
    "Roast asparagus with oil and garlic at 400°F 12 min. Season salmon; bake at 400°F 15 min. Serve over quinoa with lemon squeeze."),

  r("Pescatarian Cod Lemon Asparagus","dinner",
    ["pescatarian","keto","high-protein","low-carb","paleo"],1,
    [("cod, atlantic, raw",220,"g"),("asparagus, raw",200,"g"),("olive oil",20,"ml"),("lemon juice, raw",20,"ml"),("garlic, raw",4,"g"),("sea salt",2,"g")],
    "Toss asparagus with oil and garlic; roast at 400°F 12 min. Season cod with salt; bake on same sheet for last 12 min. Squeeze lemon over everything."),

  r("Pescatarian Tilapia Sweet Potato Dinner","dinner",
    ["pescatarian","high-protein","balanced"],1,
    [("tilapia, raw",180,"g"),("sweet potato, raw",150,"g"),("broccoli, raw",120,"g"),("olive oil",15,"ml"),("sea salt",2,"g"),("paprika",2,"g")],
    "Cube sweet potato; roast with oil, paprika, salt at 400°F 20 min. Season tilapia; bake at same temp last 12 min. Steam broccoli. Serve together."),

  r("Pescatarian Mahi Mahi Coconut Curry","dinner",
    ["pescatarian","high-protein","balanced","paleo"],2,
    [("mahi-mahi, raw",360,"g"),("coconut milk",200,"ml"),("tomato products, canned, diced",200,"g"),("onions, raw",80,"g"),("garlic, raw",5,"g"),("ginger root, raw",8,"g"),("cumin, ground",3,"g"),("olive oil",15,"ml")],
    "Sauté onion, garlic, ginger in olive oil 4 min. Add tomatoes, coconut milk, cumin; simmer 10 min. Add mahi mahi chunks; cook 8 min until fish is cooked through. Serve with brown rice."),

  r("Pescatarian Tuna Zucchini Noodle Bowl","dinner",
    ["pescatarian","keto","high-protein","low-carb","paleo"],1,
    [("tuna, canned in water, drained",140,"g"),("zucchini, raw",250,"g"),("avocado, raw",80,"g"),("olive oil",15,"ml"),("lemon juice, raw",15,"ml"),("garlic, raw",4,"g"),("sea salt",1,"g")],
    "Spiralize zucchini; sauté in olive oil with garlic 3 min. Top with tuna and sliced avocado. Drizzle with lemon juice and season."),

  r("Pescatarian Salmon Spinach Quinoa Bake","dinner",
    ["pescatarian","high-protein","balanced","mediterranean"],2,
    [("salmon, atlantic, farmed, raw",360,"g"),("quinoa, cooked",370,"g"),("spinach, raw",120,"g"),("olive oil",20,"ml"),("lemon juice, raw",20,"ml"),("garlic, raw",5,"g"),("sea salt",2,"g")],
    "Toss quinoa with olive oil, garlic, salt. Spread in baking dish. Top with spinach and salmon fillets. Drizzle with lemon. Bake at 400°F for 20 min."),

  r("Pescatarian Shrimp Black Bean Rice Bowl","dinner",
    ["pescatarian","high-protein","balanced"],2,
    [("shrimp, raw",300,"g"),("brown rice, cooked",370,"g"),("black beans, canned, drained",150,"g"),("avocado, raw",100,"g"),("salsa, ready-to-serve",60,"g"),("olive oil",15,"ml"),("cumin, ground",2,"g")],
    "Cook shrimp in olive oil with cumin 2 min per side. Warm black beans. Bowl: rice base with black beans, shrimp, avocado, and salsa."),

  r("Pescatarian Halibut Kale Lemon Plate","dinner",
    ["pescatarian","keto","high-protein","low-carb","paleo"],1,
    [("halibut, atlantic, raw",220,"g"),("kale, raw",100,"g"),("olive oil",20,"ml"),("lemon juice, raw",20,"ml"),("garlic, raw",4,"g"),("sea salt",2,"g")],
    "Massage kale with olive oil and lemon. Season halibut; pan-sear 4-5 min per side. Serve fish over kale; drizzle with pan juices and extra lemon."),

  r("Pescatarian Tilapia Avocado Mango Salsa","dinner",
    ["pescatarian","paleo","high-protein","balanced"],1,
    [("tilapia, raw",180,"g"),("avocado, raw",80,"g"),("mango, raw",80,"g"),("lemon juice, raw",20,"ml"),("olive oil",15,"ml"),("sea salt",2,"g")],
    "Season tilapia; bake at 400°F 12 min. Dice avocado and mango; toss with lemon juice and salt for salsa. Serve fish topped with salsa."),

  r("Pescatarian Cod Sweet Potato Fishcake Bowl","dinner",
    ["pescatarian","high-protein","balanced"],2,
    [("cod, atlantic, raw",300,"g"),("sweet potato, raw",200,"g"),("onions, raw",60,"g"),("olive oil",20,"ml"),("paprika",2,"g"),("sea salt",2,"g"),("lemon juice, raw",15,"ml")],
    "Bake cod at 400°F 12 min; flake. Roast diced sweet potato with oil, paprika, salt 20 min. Mix cod and sweet potato; form into cakes; pan-fry in olive oil 3 min per side."),

  r("Pescatarian Shrimp Broccoli Garlic Rice","dinner",
    ["pescatarian","high-protein","balanced"],2,
    [("shrimp, raw",300,"g"),("broccoli, raw",200,"g"),("brown rice, cooked",370,"g"),("garlic, raw",6,"g"),("olive oil",20,"ml"),("lemon juice, raw",15,"ml"),("sea salt",2,"g")],
    "Roast broccoli with oil, garlic, salt at 400°F 15 min. Cook shrimp in olive oil with garlic 2 min per side. Serve shrimp and broccoli over brown rice with lemon."),

  r("Paleo Chicken Breast Roasted Beets","dinner",
    ["paleo","high-protein","balanced"],1,
    [("chicken breast, broilers or fryers, raw",200,"g"),("beets, raw",150,"g"),("mixed greens",60,"g"),("olive oil",20,"ml"),("balsamic vinegar",15,"ml"),("sea salt",2,"g")],
    "Roast sliced beets at 400°F 25 min. Season chicken; pan-cook 6 min per side. Rest, slice. Arrange over greens with beets; drizzle with olive oil and balsamic."),

  r("Paleo Ground Beef Sweet Potato Shepherd Pie","dinner",
    ["paleo","high-protein","balanced"],2,
    [("ground beef, 90% lean, raw",300,"g"),("sweet potato, raw",300,"g"),("carrots, raw",100,"g"),("onions, raw",80,"g"),("olive oil",20,"ml"),("sea salt",3,"g"),("paprika",2,"g")],
    "Roast and mash sweet potato. Sauté onion, carrot in oil 5 min; add beef and cook 6 min; season. Pour into baking dish; top with mashed sweet potato. Bake at 400°F 20 min."),

  r("Paleo Pork Tenderloin with Apple","dinner",
    ["paleo","high-protein","balanced"],2,
    [("pork tenderloin, raw",500,"g"),("apples, raw",200,"g"),("onions, raw",80,"g"),("olive oil",20,"ml"),("cinnamon, ground",2,"g"),("sea salt",3,"g")],
    "Season pork; sear all sides in olive oil. Roast at 400°F 20 min. Meanwhile, sauté sliced apples and onions with cinnamon until soft. Rest pork; slice and serve with apple mixture."),

  r("Paleo Salmon with Mango Avocado Salsa","dinner",
    ["paleo","pescatarian","keto","high-protein","low-carb"],2,
    [("salmon, atlantic, farmed, raw",400,"g"),("avocado, raw",160,"g"),("mango, raw",120,"g"),("lemon juice, raw",20,"ml"),("olive oil",20,"ml"),("sea salt",2,"g")],
    "Dice avocado and mango; toss with lemon juice for salsa. Season salmon; sear skin-side down 5 min; flip and cook 3 min. Serve topped with salsa."),

  r("Paleo Turkey Meatball Veggie Bowl","dinner",
    ["paleo","high-protein","balanced"],2,
    [("ground turkey, raw",400,"g"),("zucchini, raw",200,"g"),("tomato products, canned, diced",200,"g"),("onions, raw",60,"g"),("olive oil",20,"ml"),("italian seasoning",3,"g"),("sea salt",2,"g")],
    "Mix turkey with Italian seasoning and salt; form meatballs. Brown in olive oil 4 min. Add diced tomato and zucchini; simmer 15 min. Serve meatballs with vegetable sauce."),

  r("Paleo Lamb Stew Root Vegetables","dinner",
    ["paleo","high-protein","balanced"],2,
    [("lamb, rib chop, lean, raw",300,"g"),("carrots, raw",150,"g"),("sweet potato, raw",150,"g"),("onions, raw",80,"g"),("beef broth",300,"ml"),("olive oil",20,"ml"),("rosemary, fresh",5,"g")],
    "Cube and brown lamb in olive oil 5 min. Add carrots, diced sweet potato, onion, rosemary, and broth. Simmer covered 30 min until lamb and veg are tender."),

  r("Paleo Beef Butternut Squash Curry","dinner",
    ["paleo","high-protein","balanced"],2,
    [("ground beef, 90% lean, raw",300,"g"),("butternut squash, raw",250,"g"),("coconut milk",200,"ml"),("onions, raw",80,"g"),("garlic, raw",5,"g"),("cumin, ground",3,"g"),("olive oil",15,"ml")],
    "Sauté onion and garlic in olive oil 4 min. Add beef; cook 5 min. Add cubed squash, coconut milk, cumin; simmer 20 min until squash is tender."),

  r("Paleo Shrimp Asparagus Stir Fry","dinner",
    ["paleo","pescatarian","keto","high-protein","low-carb"],1,
    [("shrimp, raw",200,"g"),("asparagus, raw",200,"g"),("garlic, raw",5,"g"),("olive oil",20,"ml"),("lemon juice, raw",15,"ml"),("sea salt",2,"g")],
    "Toss asparagus with half the oil and garlic; roast at 400°F 10 min. Cook shrimp in remaining oil with garlic 2 min per side. Combine; drizzle with lemon."),

  r("Paleo Chicken Kale Sweet Potato Bowl","dinner",
    ["paleo","high-protein","balanced"],1,
    [("chicken breast, broilers or fryers, raw",200,"g"),("sweet potato, raw",150,"g"),("kale, raw",80,"g"),("olive oil",20,"ml"),("lemon juice, raw",15,"ml"),("sea salt",2,"g")],
    "Dice and roast sweet potato at 400°F 20 min. Pan-cook chicken 6 min per side; slice. Massage kale with olive oil and lemon. Assemble bowl with all components."),

  r("Paleo Ground Turkey Vegetable Skillet","dinner",
    ["paleo","high-protein","balanced"],2,
    [("ground turkey, raw",300,"g"),("zucchini, raw",150,"g"),("bell peppers, raw",150,"g"),("onions, raw",80,"g"),("olive oil",20,"ml"),("cumin, ground",2,"g"),("sea salt",2,"g")],
    "Cook ground turkey in olive oil with onion and cumin until browned. Add diced zucchini and pepper; cook 5 more min until tender. Season and serve."),

  r("Mediterranean Lemon Herb Chicken","dinner",
    ["mediterranean","high-protein","balanced","paleo"],2,
    [("chicken breast, broilers or fryers, raw",400,"g"),("lemon juice, raw",30,"ml"),("garlic, raw",8,"g"),("olive oil",30,"ml"),("italian seasoning",5,"g"),("sea salt",3,"g")],
    "Marinate chicken in lemon, garlic, olive oil, Italian seasoning for 30 min. Pan-sear 7 min per side or bake at 400°F for 25 min until golden and cooked through."),

  r("Mediterranean Baked Salmon Capers","dinner",
    ["mediterranean","pescatarian","high-protein","balanced","keto","low-carb"],2,
    [("salmon, atlantic, farmed, raw",400,"g"),("tomatoes, cherry",150,"g"),("olive oil",25,"ml"),("lemon juice, raw",20,"ml"),("garlic, raw",5,"g"),("sea salt",2,"g"),("italian seasoning",3,"g")],
    "Arrange salmon in baking dish. Scatter cherry tomatoes and garlic. Drizzle with olive oil and lemon; season with Italian seasoning and salt. Bake at 400°F for 18-20 min."),

  r("Mediterranean Eggplant Lentil Stew","dinner",
    ["mediterranean","vegan","vegetarian","high-protein","balanced"],2,
    [("lentils, mature seeds, cooked, boiled",250,"g"),("eggplant, raw",300,"g"),("tomato products, canned, diced",300,"g"),("onions, raw",80,"g"),("garlic, raw",6,"g"),("olive oil",25,"ml"),("cumin, ground",3,"g")],
    "Cube eggplant and salt it; let drain 10 min. Sauté onion and garlic in olive oil 4 min. Add eggplant; cook 5 min. Add lentils, tomatoes, cumin; simmer 20 min."),

  r("Mediterranean Cod Tomato Caper Sauce","dinner",
    ["mediterranean","pescatarian","high-protein","balanced","paleo","keto","low-carb"],2,
    [("cod, atlantic, raw",400,"g"),("tomato products, canned, diced",200,"g"),("olive oil",25,"ml"),("garlic, raw",5,"g"),("lemon juice, raw",15,"ml"),("italian seasoning",3,"g"),("sea salt",2,"g")],
    "Sauté garlic in olive oil 1 min. Add tomatoes and Italian seasoning; simmer 8 min. Add cod; cover and cook 10 min until fish flakes. Finish with lemon juice."),

  r("Mediterranean Chicken Vegetable Bake","dinner",
    ["mediterranean","high-protein","balanced","paleo"],2,
    [("chicken breast, broilers or fryers, raw",400,"g"),("zucchini, raw",150,"g"),("bell peppers, raw",150,"g"),("tomatoes, cherry",150,"g"),("olive oil",30,"ml"),("garlic, raw",6,"g"),("italian seasoning",4,"g")],
    "Toss chicken and vegetables with olive oil, garlic, Italian seasoning. Spread in baking dish. Bake at 400°F for 30-35 min until chicken is cooked and vegetables are tender."),

  r("Mediterranean Shrimp Quinoa Skillet","dinner",
    ["mediterranean","pescatarian","high-protein","balanced"],2,
    [("shrimp, raw",300,"g"),("quinoa, cooked",370,"g"),("tomatoes, cherry",150,"g"),("spinach, raw",80,"g"),("olive oil",25,"ml"),("garlic, raw",5,"g"),("lemon juice, raw",20,"ml")],
    "Cook shrimp in olive oil with garlic 2 min per side. Add cherry tomatoes; cook 2 min. Add cooked quinoa and spinach; toss until spinach wilts. Finish with lemon."),

  r("Mediterranean Lamb Vegetable Tagine","dinner",
    ["mediterranean","high-protein","balanced","paleo"],2,
    [("lamb, rib chop, lean, raw",400,"g"),("zucchini, raw",150,"g"),("carrots, raw",100,"g"),("tomato products, canned, diced",200,"g"),("onions, raw",80,"g"),("olive oil",25,"ml"),("cumin, ground",3,"g")],
    "Brown lamb in olive oil with onion 5 min. Add zucchini, carrots, tomatoes, cumin, and 200ml water. Simmer covered 30 min until lamb is tender."),

  r("Mediterranean Tofu Roasted Vegetable Bowl","dinner",
    ["mediterranean","vegan","vegetarian","high-protein","balanced"],2,
    [("tofu, firm, raw",300,"g"),("eggplant, raw",150,"g"),("zucchini, raw",150,"g"),("tomatoes, cherry",120,"g"),("olive oil",30,"ml"),("italian seasoning",3,"g"),("sea salt",2,"g")],
    "Cube tofu and vegetables; toss with olive oil, Italian seasoning, salt. Spread on sheet pan. Roast at 400°F for 30 min, tossing halfway. Serve over quinoa with lemon."),
]

# ── SNACK (32 recipes) ────────────────────────────────────────────────────────
snack = [
  r("Vegan Almond Date Protein Balls","snack",
    ["vegan","vegetarian","balanced","high-protein"],4,
    [("almonds, raw",100,"g"),("almond butter",60,"g"),("protein powder, plant-based",30,"g"),("chia seeds",20,"g"),("cinnamon, ground",2,"g"),("coconut oil",20,"ml")],
    "Blend almonds, almond butter, protein powder, chia seeds, cinnamon, and coconut oil until combined. Roll into 12 balls. Refrigerate 30 min until firm."),

  r("Vegan Hemp Seed Cocoa Bites","snack",
    ["vegan","vegetarian","balanced","high-protein"],4,
    [("hemp seeds, hulled",60,"g"),("cocoa powder, unsweetened",20,"g"),("almond butter",60,"g"),("maple syrup",20,"ml"),("vanilla extract",5,"ml"),("coconut oil",15,"ml")],
    "Mix hemp seeds, cocoa powder, almond butter, maple syrup, vanilla, and coconut oil. Press into small silicone molds or roll into balls. Freeze 20 min."),

  r("Vegan Edamame with Sea Salt","snack",
    ["vegan","vegetarian","high-protein","low-carb","balanced"],1,
    [("edamame, frozen, prepared",200,"g"),("sea salt",2,"g"),("sesame oil",5,"ml")],
    "Steam edamame until tender and bright green. Drizzle with sesame oil; toss with sea salt. Serve warm or at room temperature."),

  r("Vegan Chia Berry Pudding","snack",
    ["vegan","vegetarian","balanced"],2,
    [("chia seeds",50,"g"),("coconut milk",300,"ml"),("blueberries, raw",80,"g"),("maple syrup",15,"ml"),("vanilla extract",5,"ml")],
    "Stir chia seeds, coconut milk, maple syrup, and vanilla together. Refrigerate 4 hours or overnight. Top with fresh blueberries before serving."),

  r("Vegan Peanut Butter Apple Slices","snack",
    ["vegan","vegetarian","balanced"],1,
    [("apples, raw",180,"g"),("peanut butter, smooth",40,"g"),("chia seeds",10,"g"),("cinnamon, ground",1,"g")],
    "Core and slice apple into wedges. Spread each slice with peanut butter. Sprinkle with chia seeds and cinnamon. Serve immediately."),

  r("Vegan Cashew Berry Smoothie","snack",
    ["vegan","vegetarian","balanced","high-protein"],1,
    [("cashews, raw",40,"g"),("blueberries, raw",80,"g"),("banana, raw",100,"g"),("coconut milk",200,"ml"),("protein powder, plant-based",20,"g")],
    "Blend cashews, blueberries, banana, protein powder, and coconut milk until smooth. Pour and serve immediately."),

  r("Vegan Black Bean Hummus Veggies","snack",
    ["vegan","vegetarian","high-protein","balanced"],2,
    [("black beans, canned, drained",150,"g"),("hummus, commercial",80,"g"),("carrots, raw",120,"g"),("cucumber, raw",100,"g"),("lemon juice, raw",15,"ml"),("cumin, ground",2,"g")],
    "Blend black beans with hummus, lemon, cumin for dip. Slice carrots and cucumber into sticks. Serve with black bean hummus."),

  r("Vegan Coconut Almond Energy Bar","snack",
    ["vegan","vegetarian","balanced"],4,
    [("almonds, raw",80,"g"),("coconut oil",30,"ml"),("almond butter",60,"g"),("flaxseed, ground",20,"g"),("cocoa powder, unsweetened",15,"g"),("maple syrup",25,"ml")],
    "Blend almonds; mix with all ingredients until combined. Press into lined baking pan. Refrigerate 2 hours until firm. Cut into bars."),

  r("Carnivore Beef Jerky Bowl","snack",
    ["carnivore","keto","high-protein","low-carb"],1,
    [("beef, sirloin steak, lean, raw",150,"g"),("sea salt",3,"g"),("black pepper, ground",2,"g")],
    "Slice sirloin paper-thin against the grain. Toss with salt and pepper. Dehydrate at 165°F for 4-6 hours or bake at lowest oven setting 3-4 hours until dry and chewy."),

  r("Carnivore Smoked Salmon Bites","snack",
    ["carnivore","keto","pescatarian","high-protein","low-carb"],1,
    [("smoked salmon",100,"g"),("cream cheese",50,"g"),("sea salt",1,"g"),("black pepper, ground",1,"g")],
    "Spread cream cheese on thin smoked salmon slices. Roll into bite-size pieces. Season lightly and serve chilled."),

  r("Carnivore Hard Boiled Eggs and Bacon","snack",
    ["carnivore","keto","high-protein","low-carb"],1,
    [("egg, whole, hard-boiled",3,"whole"),("bacon, cured, pan-fried",40,"g"),("sea salt",1,"g")],
    "Peel and halve hard-boiled eggs. Cook bacon until crisp. Serve eggs alongside crumbled bacon with a pinch of sea salt."),

  r("Carnivore Ground Beef Snack Patties","snack",
    ["carnivore","keto","high-protein","low-carb"],2,
    [("ground beef, 80% lean, raw",200,"g"),("sea salt",2,"g"),("black pepper, ground",1,"g")],
    "Season ground beef with salt and pepper. Form into 4 mini patties. Cook in a hot pan 3 min per side. Serve warm as snack patties."),

  r("Carnivore Pork Rind Cream Cheese Snack","snack",
    ["carnivore","keto","high-protein","low-carb"],1,
    [("pork chop, lean, raw",100,"g"),("cream cheese",50,"g"),("sea salt",1,"g"),("black pepper, ground",1,"g")],
    "Cook thin pork slices until crispy. Serve topped with cream cheese and a pinch of salt and pepper."),

  r("Carnivore Ground Turkey Snack Bites","snack",
    ["carnivore","keto","high-protein","low-carb"],2,
    [("ground turkey, raw",200,"g"),("sea salt",2,"g"),("black pepper, ground",1,"g")],
    "Mix ground turkey with salt and pepper; roll into balls. Bake at 400°F for 15 min until cooked through. Serve warm."),

  r("Keto Cheese Almond Snack Plate","snack",
    ["keto","vegetarian","high-protein","low-carb"],1,
    [("cheddar cheese",60,"g"),("almonds, raw",30,"g"),("cucumber, raw",100,"g"),("sea salt",1,"g")],
    "Slice cheddar cheese. Arrange on plate with almonds and cucumber rounds. Season lightly with salt."),

  r("Keto Avocado Cream Cheese Bites","snack",
    ["keto","vegetarian","high-protein","low-carb","paleo"],1,
    [("avocado, raw",150,"g"),("cream cheese",40,"g"),("sea salt",1,"g"),("black pepper, ground",1,"g"),("lemon juice, raw",10,"ml")],
    "Halve avocado and remove pit. Fill each half with cream cheese. Season with salt, pepper, and lemon juice."),

  r("Keto Salmon Cucumber Rounds","snack",
    ["keto","pescatarian","high-protein","low-carb","paleo"],1,
    [("smoked salmon",80,"g"),("cucumber, raw",150,"g"),("cream cheese",40,"g"),("sea salt",1,"g")],
    "Slice cucumber into thick rounds. Top each with a dollop of cream cheese and a piece of smoked salmon. Season with salt."),

  r("Keto Cheddar Egg Snack Puffs","snack",
    ["keto","vegetarian","high-protein","low-carb"],2,
    [("egg, whole, raw",4,"whole"),("cheddar cheese",80,"g"),("sea salt",1,"g"),("black pepper, ground",1,"g")],
    "Whisk eggs with shredded cheddar, salt, and pepper. Pour into greased muffin tin (half full). Bake at 375°F for 12 min until puffed and golden."),

  r("Keto Pumpkin Seed Parmesan Mix","snack",
    ["keto","vegetarian","high-protein","low-carb"],2,
    [("pumpkin seeds, raw",60,"g"),("parmesan cheese",30,"g"),("sea salt",1,"g"),("paprika",1,"g")],
    "Toss pumpkin seeds with grated parmesan, salt, and paprika. Spread on baking sheet. Toast at 350°F for 8-10 min until golden."),

  r("Keto Turkey Cream Cheese Rolls","snack",
    ["keto","high-protein","low-carb"],1,
    [("turkey breast, deli, sliced",100,"g"),("cream cheese",50,"g"),("cucumber, raw",60,"g"),("sea salt",1,"g")],
    "Lay turkey slices flat; spread cream cheese and add cucumber strips. Roll up tightly. Cut into bite-size pieces."),

  r("Keto Almond Butter Celery Sticks","snack",
    ["keto","vegetarian","low-carb","balanced"],1,
    [("celery, raw",150,"g"),("almond butter",40,"g"),("sea salt",1,"g")],
    "Slice celery into sticks. Fill the hollow of each stick with almond butter. Sprinkle with sea salt and serve."),

  r("Keto Cottage Cheese Flaxseed Bowl","snack",
    ["keto","vegetarian","high-protein","low-carb"],1,
    [("cottage cheese, lowfat",200,"g"),("flaxseed, ground",15,"g"),("walnuts, raw",20,"g"),("cinnamon, ground",1,"g")],
    "Scoop cottage cheese into bowl. Top with ground flaxseed, walnuts, and cinnamon. Stir gently and serve chilled."),

  r("Whey Protein Berry Shake","snack",
    ["high-protein","balanced","vegetarian"],1,
    [("whey protein powder",30,"g"),("blueberries, raw",80,"g"),("banana, raw",100,"g"),("whole milk",240,"ml"),("chia seeds",10,"g")],
    "Blend whey protein, blueberries, banana, and milk until smooth. Top with chia seeds."),

  r("Cottage Cheese with Strawberries Hemp","snack",
    ["high-protein","vegetarian","balanced"],1,
    [("cottage cheese, lowfat",200,"g"),("strawberries, raw",100,"g"),("hemp seeds, hulled",15,"g"),("honey",10,"ml")],
    "Spoon cottage cheese into bowl. Top with sliced strawberries and hemp seeds. Drizzle with honey."),

  r("Greek Yogurt Almond Protein Bowl","snack",
    ["high-protein","vegetarian","balanced"],1,
    [("greek yogurt, plain, nonfat",200,"g"),("almonds, raw",30,"g"),("blueberries, raw",60,"g"),("honey",10,"ml"),("cinnamon, ground",1,"g")],
    "Spoon yogurt into bowl. Top with almonds, blueberries, honey drizzle, and cinnamon."),

  r("Tuna Cucumber Bites","snack",
    ["pescatarian","high-protein","keto","low-carb","balanced"],1,
    [("tuna, canned in water, drained",120,"g"),("cucumber, raw",150,"g"),("dijon mustard",10,"g"),("lemon juice, raw",10,"ml"),("sea salt",1,"g")],
    "Drain tuna; mix with Dijon mustard, lemon juice, and salt. Slice cucumber into thick rounds. Top each round with tuna salad."),

  r("Turkey Hummus Rollup Snack","snack",
    ["high-protein","balanced"],1,
    [("turkey breast, deli, sliced",100,"g"),("hummus, commercial",60,"g"),("cucumber, raw",60,"g"),("spinach, raw",30,"g")],
    "Lay turkey slices on flat surface. Spread hummus on each slice. Add cucumber strip and spinach leaf. Roll up tightly."),

  r("Egg White Avocado Snack","snack",
    ["keto","vegetarian","high-protein","low-carb","paleo"],1,
    [("egg, whole, hard-boiled",3,"whole"),("avocado, raw",80,"g"),("lemon juice, raw",10,"ml"),("sea salt",1,"g"),("black pepper, ground",1,"g")],
    "Peel and slice eggs. Mash avocado with lemon, salt, and pepper. Arrange eggs alongside avocado mash."),

  r("Paleo Mango Coconut Bites","snack",
    ["paleo","vegan","vegetarian","balanced"],4,
    [("mango, raw",150,"g"),("coconut milk",80,"ml"),("chia seeds",20,"g"),("hemp seeds, hulled",20,"g"),("cinnamon, ground",1,"g")],
    "Blend mango and coconut milk. Stir in chia seeds, hemp seeds, and cinnamon. Pour into molds or a container. Freeze 2 hours until firm."),

  r("Paleo Apple Almond Butter Bowl","snack",
    ["paleo","vegan","vegetarian","balanced"],1,
    [("apples, raw",180,"g"),("almond butter",40,"g"),("walnuts, raw",20,"g"),("cinnamon, ground",1,"g")],
    "Core and chop apple into cubes. Drizzle almond butter over apple. Scatter walnuts and dust with cinnamon."),

  r("Paleo Banana Walnut Snack","snack",
    ["paleo","vegan","vegetarian","balanced"],1,
    [("banana, raw",120,"g"),("walnuts, raw",30,"g"),("almond butter",25,"g"),("cinnamon, ground",1,"g")],
    "Slice banana and arrange in bowl. Top with walnuts, drizzle almond butter, and dust with cinnamon."),

  r("Paleo Pumpkin Seed Hemp Mix","snack",
    ["paleo","vegan","vegetarian","high-protein","balanced"],2,
    [("pumpkin seeds, raw",50,"g"),("hemp seeds, hulled",30,"g"),("almonds, raw",40,"g"),("sea salt",1,"g"),("cinnamon, ground",1,"g")],
    "Toss pumpkin seeds, hemp seeds, and almonds with sea salt and cinnamon. Toast in a dry pan 3 minutes. Serve as trail mix."),
]

print(json.dumps(lunch, indent=2))
import sys
with open('/Users/emilianosilva/Developer/coach-macro/scripts/seed-batch3-b.json', 'w') as f:
    json.dump(lunch, f, indent=2)
with open('/Users/emilianosilva/Developer/coach-macro/scripts/seed-batch3-c.json', 'w') as f:
    json.dump(dinner + snack, f, indent=2)
print(f"Wrote batch-b: {len(lunch)} lunch recipes", file=sys.stderr)
print(f"Wrote batch-c: {len(dinner)} dinner + {len(snack)} snack = {len(dinner)+len(snack)} recipes", file=sys.stderr)
