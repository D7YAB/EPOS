-- Dinners Special confirmed by the owner on 25 October 2026.
-- This confirmation supersedes the earlier shop-board price for Sausage Dinner.
-- Apply after 006_hungry_haddock_menu.sql and seed_hungry_haddock_leaflet_details.sql.
-- Existing included sauce choices are preserved. No rows are deleted.
begin;
set local statement_timeout = '10s';

insert into public.menu_items (id, name, price, category_id) values
  ('hh-sausage-dinner', 'Sausage Dinner', 6.00, 'hh-dinners-special'),
  ('hh-fish-cake-and-chips', 'Fish Cake and Chips', 5.00, 'hh-dinners-special'),
  ('hh-any-pie-and-chips', 'Any Pie and Chips', 5.00, 'hh-dinners-special'),
  ('hh-large-sausage-and-chips', 'Large Sausage and Chips', 5.00, 'hh-dinners-special'),
  ('hh-dice-chicken-chips-cheese', 'Dice Chicken and Chips and Cheese', 6.00, 'hh-dinners-special'),
  ('hh-chicken-quarter-with-chips', 'Chicken Quarter with Chips', 6.50, 'hh-dinners-special'),
  ('hh-chicken-quarter-and-rice', 'Chicken Quarter with Rice', 6.50, 'hh-dinners-special')
on conflict (id) do update set name = excluded.name, price = excluded.price, category_id = excluded.category_id;

commit;
