-- Explicitly approved by the owner and applied on 25 October 2026.
-- Recorded remotely as migration restore_main_public_key_access.
-- Restore main's public-key access model for the eight EPOS application tables.
-- Anyone with the public/publishable key can read, create, update and delete
-- rows in these tables, including orders, customer details and cached addresses.
-- Row-level security stays enabled, with the same unrestricted row policies as main.
-- This changes permissions only; it does not delete application data.
begin;

grant usage on schema public to anon, authenticated;

alter table public.categories enable row level security;
grant select, insert, update, delete on table public.categories to anon, authenticated;
drop policy if exists "read_categories" on public.categories;
drop policy if exists "open_categories" on public.categories;
create policy "open_categories" on public.categories
  for all to anon, authenticated using (true) with check (true);

alter table public.menu_items enable row level security;
grant select, insert, update, delete on table public.menu_items to anon, authenticated;
drop policy if exists "read_menu_items" on public.menu_items;
drop policy if exists "open_menu_items" on public.menu_items;
create policy "open_menu_items" on public.menu_items
  for all to anon, authenticated using (true) with check (true);

alter table public.product_variations enable row level security;
grant select, insert, update, delete on table public.product_variations to anon, authenticated;
drop policy if exists "read_product_variations" on public.product_variations;
drop policy if exists "open_product_variations" on public.product_variations;
create policy "open_product_variations" on public.product_variations
  for all to anon, authenticated using (true) with check (true);

alter table public.product_add_ons enable row level security;
grant select, insert, update, delete on table public.product_add_ons to anon, authenticated;
drop policy if exists "read_product_add_ons" on public.product_add_ons;
drop policy if exists "open_product_add_ons" on public.product_add_ons;
create policy "open_product_add_ons" on public.product_add_ons
  for all to anon, authenticated using (true) with check (true);

alter table public.orders enable row level security;
grant select, insert, update, delete on table public.orders to anon, authenticated;
drop policy if exists "read_orders" on public.orders;
drop policy if exists "open_orders" on public.orders;
create policy "open_orders" on public.orders
  for all to anon, authenticated using (true) with check (true);

alter table public.order_items enable row level security;
grant select, insert, update, delete on table public.order_items to anon, authenticated;
drop policy if exists "read_order_items" on public.order_items;
drop policy if exists "open_order_items" on public.order_items;
create policy "open_order_items" on public.order_items
  for all to anon, authenticated using (true) with check (true);

alter table public.delivery_postcode_charges enable row level security;
grant select, insert, update, delete on table public.delivery_postcode_charges to anon, authenticated;
drop policy if exists "read_delivery_postcode_charges" on public.delivery_postcode_charges;
drop policy if exists "open_delivery_postcode_charges" on public.delivery_postcode_charges;
create policy "open_delivery_postcode_charges" on public.delivery_postcode_charges
  for all to anon, authenticated using (true) with check (true);

alter table public.postcode_address_cache enable row level security;
grant select, insert, update, delete on table public.postcode_address_cache to anon, authenticated;
drop policy if exists "read_postcode_address_cache" on public.postcode_address_cache;
drop policy if exists "open_postcode_address_cache" on public.postcode_address_cache;
create policy "open_postcode_address_cache" on public.postcode_address_cache
  for all to anon, authenticated using (true) with check (true);

grant usage, select on sequence public.orders_order_number_seq to anon, authenticated;

commit;
