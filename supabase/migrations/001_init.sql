create extension if not exists pgcrypto;

create table if not exists public.categories (
  id text primary key,
  name text not null,
  color text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id text primary key,
  name text not null,
  price numeric(10,2) not null,
  category_id text not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variations (
  id text primary key,
  item_id text not null references public.menu_items(id) on delete cascade,
  name text not null,
  price_modifier numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_add_ons (
  id text primary key,
  item_id text not null references public.menu_items(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  total numeric(10,2) not null,
  status text not null check (status in ('preparing','ready','collected','out_for_delivery','delivered','cancelled')),
  order_type text not null check (order_type in ('delivery','collection','instore')),
  customer jsonb not null default '{}'::jsonb,
  payment_status text not null check (payment_status in ('paid','unpaid')),
  payment_method text null check (payment_method in ('cash','card')),
  order_comment text null,
  created_at timestamptz not null default now(),
  ready_at timestamptz null,
  collected_at timestamptz null,
  out_for_delivery_at timestamptz null,
  delivered_at timestamptz null
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_snapshot jsonb not null,
  quantity integer not null check (quantity > 0),
  selected_variation jsonb null,
  add_ons jsonb not null default '[]'::jsonb,
  custom_add_ons jsonb not null default '[]'::jsonb,
  comment text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_menu_items_category on public.menu_items(category_id);
create index if not exists idx_product_variations_item on public.product_variations(item_id);
create index if not exists idx_product_add_ons_item on public.product_add_ons(item_id);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

create table if not exists public.delivery_postcode_charges (
  postcode_prefix text primary key,
  charge numeric(10,2) not null check (charge >= 0),
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.product_variations enable row level security;
alter table public.product_add_ons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.delivery_postcode_charges enable row level security;

drop policy if exists "open_categories" on public.categories;
create policy "open_categories" on public.categories for all to anon, authenticated using (true) with check (true);

drop policy if exists "open_menu_items" on public.menu_items;
create policy "open_menu_items" on public.menu_items for all to anon, authenticated using (true) with check (true);

drop policy if exists "open_product_variations" on public.product_variations;
create policy "open_product_variations" on public.product_variations for all to anon, authenticated using (true) with check (true);

drop policy if exists "open_product_add_ons" on public.product_add_ons;
create policy "open_product_add_ons" on public.product_add_ons for all to anon, authenticated using (true) with check (true);

drop policy if exists "open_orders" on public.orders;
create policy "open_orders" on public.orders for all to anon, authenticated using (true) with check (true);

drop policy if exists "open_order_items" on public.order_items;
create policy "open_order_items" on public.order_items for all to anon, authenticated using (true) with check (true);

drop policy if exists "open_delivery_postcode_charges" on public.delivery_postcode_charges;
create policy "open_delivery_postcode_charges" on public.delivery_postcode_charges for all to anon, authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
