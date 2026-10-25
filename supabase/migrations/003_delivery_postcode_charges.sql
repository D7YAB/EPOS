create table if not exists public.delivery_postcode_charges (
  postcode_prefix text primary key,
  charge numeric(10,2) not null check (charge >= 0),
  created_at timestamptz not null default now()
);

alter table public.delivery_postcode_charges enable row level security;

-- Match main: delivery rates can be managed using the public key.
grant select, insert, update, delete on table public.delivery_postcode_charges to anon, authenticated, service_role;
drop policy if exists "read_delivery_postcode_charges" on public.delivery_postcode_charges;
drop policy if exists "open_delivery_postcode_charges" on public.delivery_postcode_charges;
create policy "open_delivery_postcode_charges" on public.delivery_postcode_charges
  for all to anon, authenticated using (true) with check (true);
