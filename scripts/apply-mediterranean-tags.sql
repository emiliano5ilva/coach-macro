-- Mediterranean diet-tag reconciliation. Run AFTER seeding the recipe library.
-- Idempotent: only adds 'mediterranean' where missing; safe to run repeatedly.
-- Part 1 (rule): every plant/fish recipe is Mediterranean-compatible.
UPDATE recipes
SET diet_tags = array_append(diet_tags, 'mediterranean')
WHERE user_id IS NULL
  AND NOT ('mediterranean' = ANY(diet_tags))
  AND diet_tags && ARRAY['pescatarian','vegetarian','vegan'];
-- Part 2 (explicit): hand-classified poultry/egg/lamb dishes (no plant/fish tag to key on).
UPDATE recipes
SET diet_tags = array_append(diet_tags, 'mediterranean')
WHERE user_id IS NULL
  AND NOT ('mediterranean' = ANY(diet_tags))
  AND name = ANY(ARRAY[
    'Chicken Rice Power Bowl','Chicken Tikka Masala','Grilled Chicken Quinoa Bowl',
    'Keto Chicken Caesar Salad','Keto Chicken Parmesan Style','Keto Chicken Thigh Asparagus Plate',
    'Keto Cobb Salad','Keto Lamb Feta Salad','Keto Turkey Avocado Lettuce Cups',
    'Keto Turkey Cheese Roll-Ups','Keto Turkey Cream Cheese Rolls','Keto Turkey Stuffed Bell Pepper',
    'Lamb Chops with Roasted Sweet Potato','Lean Turkey Wrap','Mediterranean Chicken Eggplant Bowl',
    'Mediterranean Chicken Quinoa Salad','Mediterranean Chicken Vegetable Bake',
    'Mediterranean Lamb Vegetable Tagine','Mediterranean Lemon Herb Chicken',
    'Paleo Almond-Crusted Chicken Breast','Paleo Chicken Breast Roasted Beets',
    'Paleo Chicken Butternut Squash Bowl','Paleo Chicken Kale Sweet Potato Bowl',
    'Paleo Chicken Sweet Potato Bowl','Paleo Chicken Vegetable Soup',
    'Paleo Egg and Sweet Potato Hash','Paleo Ground Turkey Vegetable Skillet',
    'Paleo Ground Turkey Zucchini Bowl','Paleo Mango Chicken Salad',
    'Paleo Sweet Potato Turkey Bowl','Paleo Turkey Meatball Veggie Bowl',
    'Paleo Turkey Veggie Roasted Bowl','Paleo Turkey Veggie Scramble',
    'Turkey Hummus Rollup Snack','Turkey Meatball Zucchini Marinara'
  ]);
