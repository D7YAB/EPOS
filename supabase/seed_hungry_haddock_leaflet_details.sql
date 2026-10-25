-- Supplemental details from IMG_7917.PNG, IMG_7918.PNG and IMG_7919.PNG.
-- Owner instruction: KEEP SHOP-BOARD PRICES. No base price is changed here.
-- Included sauce selections cost GBP 0.00, as advertised on the leaflet.
-- Existing item IDs, board-only items, and order snapshots are preserved.
-- Apply after migrations 001 through 006. Safe to re-run.
begin;
set local statement_timeout = '10s';

update public.menu_items as item
set name = detail.name
from (values
  ('hh-any-pie-and-chips', 'Any Pie, Chips & Sauce'),
  ('hh-large-sausage-and-chips', 'Large Sausage, Chips & Sauce'),
  ('hh-large-fish-and-chips', 'Large Fish, Chips & Sauce'),
  ('hh-chicken-burger-meal', 'Chicken Burger and Chips Meal (Mild)'),
  ('hh-beef-burger-meal', 'Beef Burger Meal (Mild)'),
  ('hh-cheese-burger', 'Cheese Burger (Mild)'),
  ('hh-sachets-3', 'Sauce Sachet')
) as detail(id, name)
where item.id = detail.id;

-- The current app supports one required variation selection.
-- Use pie/sauce combinations so each pie meal includes exactly one pie and sauce.
-- Existing pie variation IDs are reused for Gravy, preserving stable references.
insert into public.product_variations (id, item_id, name, price_modifier) values
  ('hh-pie-meal-meat-pie', 'hh-any-pie-and-chips', 'Meat Pie / Gravy', 0.00),
  ('hh-pie-meal-meat-pie-curry', 'hh-any-pie-and-chips', 'Meat Pie / Curry', 0.00),
  ('hh-pie-meal-meat-pie-peas', 'hh-any-pie-and-chips', 'Meat Pie / Peas', 0.00),
  ('hh-pie-meal-steak-pie', 'hh-any-pie-and-chips', 'Steak Pie / Gravy', 0.00),
  ('hh-pie-meal-steak-pie-curry', 'hh-any-pie-and-chips', 'Steak Pie / Curry', 0.00),
  ('hh-pie-meal-steak-pie-peas', 'hh-any-pie-and-chips', 'Steak Pie / Peas', 0.00),
  ('hh-pie-meal-cheese-onion-pie', 'hh-any-pie-and-chips', 'Cheese & Onion Pie / Gravy', 0.00),
  ('hh-pie-meal-cheese-onion-pie-curry', 'hh-any-pie-and-chips', 'Cheese & Onion Pie / Curry', 0.00),
  ('hh-pie-meal-cheese-onion-pie-peas', 'hh-any-pie-and-chips', 'Cheese & Onion Pie / Peas', 0.00),
  ('hh-pie-meal-chicken-mushroom-pie', 'hh-any-pie-and-chips', 'Chicken & Mushroom Pie / Gravy', 0.00),
  ('hh-pie-meal-chicken-mushroom-pie-curry', 'hh-any-pie-and-chips', 'Chicken & Mushroom Pie / Curry', 0.00),
  ('hh-pie-meal-chicken-mushroom-pie-peas', 'hh-any-pie-and-chips', 'Chicken & Mushroom Pie / Peas', 0.00),
  ('hh-pie-meal-meat-potato-pie', 'hh-any-pie-and-chips', 'Meat & Potato Pie / Gravy', 0.00),
  ('hh-pie-meal-meat-potato-pie-curry', 'hh-any-pie-and-chips', 'Meat & Potato Pie / Curry', 0.00),
  ('hh-pie-meal-meat-potato-pie-peas', 'hh-any-pie-and-chips', 'Meat & Potato Pie / Peas', 0.00),
  ('hh-large-sausage-and-chips-gravy', 'hh-large-sausage-and-chips', 'Gravy', 0.00),
  ('hh-large-sausage-and-chips-curry', 'hh-large-sausage-and-chips', 'Curry', 0.00),
  ('hh-large-sausage-and-chips-peas', 'hh-large-sausage-and-chips', 'Peas', 0.00),
  ('hh-large-fish-and-chips-gravy', 'hh-large-fish-and-chips', 'Gravy', 0.00),
  ('hh-large-fish-and-chips-curry', 'hh-large-fish-and-chips', 'Curry', 0.00),
  ('hh-large-fish-and-chips-peas', 'hh-large-fish-and-chips', 'Peas', 0.00),
  ('hh-sachets-tomato', 'hh-sachets-3', 'Tomato Sauce', 0.00),
  ('hh-sachets-mayo', 'hh-sachets-3', 'Mayonnaise', 0.00),
  ('hh-sachets-tartare', 'hh-sachets-3', 'Tartare Sauce', 0.00)
on conflict (id) do update set item_id = excluded.item_id, name = excluded.name, price_modifier = excluded.price_modifier;

commit;
