-- Hungry Haddock menu transcribed from IMG_9223.heic.
-- Nugget quantities confirmed by the owner: 7, 10 and 14.
-- Pending: the two cropped GBP 6.00 meal names; see supabase/HUNGRY_HADDOCK_SETUP.md.
-- Fish Cake and Chips appears twice on the board and is imported once.
-- Stable hh- IDs make this safe to re-run without clearing existing data.

insert into public.categories (id, name, color, sort_order) values
  ('hh-dinners-special', 'Dinners Special', 'bg-[oklch(0.55_0.22_27)]', 0),
  ('hh-chicken', 'Chicken', 'bg-[oklch(0.7_0.18_55)]', 1),
  ('hh-burgers', 'Burgers', 'bg-[oklch(0.65_0.18_80)]', 2),
  ('hh-fish', 'Fish', 'bg-[oklch(0.55_0.15_250)]', 3),
  ('hh-sausage', 'Sausage', 'bg-[oklch(0.6_0.15_30)]', 4),
  ('hh-sides', 'Sides', 'bg-[oklch(0.65_0.2_145)]', 5),
  ('hh-drinks', 'Drinks', 'bg-[oklch(0.6_0.15_250)]', 6),
  ('hh-extras', 'Extras', 'bg-[oklch(0.7_0.15_330)]', 7),
  ('hh-pie', 'Pie', 'bg-[oklch(0.68_0.12_52)]', 8),
  ('hh-puddings', 'Puddings', 'bg-[oklch(0.55_0.15_200)]', 9)
on conflict (id) do update set name = excluded.name, color = excluded.color, sort_order = excluded.sort_order;

insert into public.menu_items (id, name, price, category_id) values
  ('hh-sausage-dinner', 'Sausage Dinner', 5.00, 'hh-dinners-special'),
  ('hh-fish-cake-and-chips', 'Fish Cake and Chips', 5.00, 'hh-dinners-special'),
  ('hh-any-pie-and-chips', 'Any Pie and Chips', 5.00, 'hh-dinners-special'),
  ('hh-large-sausage-and-chips', 'Large Sausage and Chips', 5.00, 'hh-dinners-special'),
  ('hh-chicken-quarter-with-chips', 'Chicken Quarter with Chips', 6.50, 'hh-dinners-special'),
  ('hh-chicken-quarter-and-rice', 'Chicken Quarter and Rice', 6.50, 'hh-dinners-special'),
  ('hh-nuggets-7-with-chips', '7 Chicken Nuggets with Chips', 5.50, 'hh-chicken'),
  ('hh-nuggets-10-with-chips', '10 Chicken Nuggets with Chips', 6.50, 'hh-chicken'),
  ('hh-nuggets-14-with-chips', '14 Chicken Nuggets with Chips', 7.90, 'hh-chicken'),
  ('hh-chicken-burger-meal', 'Chicken Burger and Chips Meal', 5.99, 'hh-burgers'),
  ('hh-beef-burger-meal', 'Beef Burger Meal', 5.99, 'hh-burgers'),
  ('hh-cheese-burger', 'Cheese Burger', 5.99, 'hh-burgers'),
  ('hh-haddock', 'Haddock', 6.90, 'hh-fish'),
  ('hh-cod', 'Cod', 6.90, 'hh-fish'),
  ('hh-large-fish-and-chips', 'Large Fish and Chips', 9.50, 'hh-fish'),
  ('hh-small-sausage', 'Small Sausage', 1.50, 'hh-sausage'),
  ('hh-battered-sausage', 'Battered Sausage', 2.70, 'hh-sausage'),
  ('hh-large-sausage', 'Large Sausage', 2.50, 'hh-sausage'),
  ('hh-small-battered-sausage', 'Small Battered Sausage', 1.70, 'hh-sausage'),
  ('hh-small-chips', 'Small Chips', 2.70, 'hh-sides'),
  ('hh-large-chips', 'Large Chips', 3.50, 'hh-sides'),
  ('hh-hash-brown', 'Hash Brown', 0.70, 'hh-sides'),
  ('hh-hash-browns-5', 'Hash Browns (5)', 3.00, 'hh-sides'),
  ('hh-curry', 'Curry', 1.50, 'hh-sides'),
  ('hh-peas', 'Peas', 1.50, 'hh-sides'),
  ('hh-barm', 'Barm', 0.70, 'hh-sides'),
  ('hh-sachets-3', '3 Sachets', 0.30, 'hh-sides'),
  ('hh-potato-scallop', 'Potato Scallop', 0.40, 'hh-sides'),
  ('hh-gravy', 'Gravy', 1.50, 'hh-sides'),
  ('hh-cans', 'Cans', 1.50, 'hh-drinks'),
  ('hh-water', 'Water', 1.00, 'hh-drinks'),
  ('hh-sausage-barm', 'Sausage Barm', 3.50, 'hh-extras'),
  ('hh-chips-barm', 'Chips Barm', 3.50, 'hh-extras'),
  ('hh-chips-cheese-gravy', 'Chips Cheese & Gravy', 4.90, 'hh-extras'),
  ('hh-meat-pie', 'Meat Pie', 2.70, 'hh-pie'),
  ('hh-steak-pie', 'Steak Pie', 2.70, 'hh-pie'),
  ('hh-cheese-onion-pie', 'Cheese & Onion Pie', 2.70, 'hh-pie'),
  ('hh-chicken-mushroom-pie', 'Chicken & Mushroom Pie', 2.70, 'hh-pie'),
  ('hh-meat-potato-pie', 'Meat & Potato Pie', 2.70, 'hh-pie'),
  ('hh-steak-pudding', 'Steak Pudding', 2.70, 'hh-puddings')
on conflict (id) do update set name = excluded.name, price = excluded.price, category_id = excluded.category_id;

-- Pie selections share the advertised GBP 5.00 meal price.
insert into public.product_variations (id, item_id, name, price_modifier) values
  ('hh-pie-meal-meat-pie', 'hh-any-pie-and-chips', 'Meat Pie', 0.00),
  ('hh-pie-meal-steak-pie', 'hh-any-pie-and-chips', 'Steak Pie', 0.00),
  ('hh-pie-meal-cheese-onion-pie', 'hh-any-pie-and-chips', 'Cheese & Onion Pie', 0.00),
  ('hh-pie-meal-chicken-mushroom-pie', 'hh-any-pie-and-chips', 'Chicken & Mushroom Pie', 0.00),
  ('hh-pie-meal-meat-potato-pie', 'hh-any-pie-and-chips', 'Meat & Potato Pie', 0.00)
on conflict (id) do update set item_id = excluded.item_id, name = excluded.name, price_modifier = excluded.price_modifier;
