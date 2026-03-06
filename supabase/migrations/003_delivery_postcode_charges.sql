create table if not exists public.delivery_postcode_charges (
  postcode_prefix text primary key,
  charge numeric(10,2) not null check (charge >= 0),
  created_at timestamptz not null default now()
);

alter table public.delivery_postcode_charges enable row level security;

drop policy if exists "open_delivery_postcode_charges" on public.delivery_postcode_charges;
create policy "open_delivery_postcode_charges"
  on public.delivery_postcode_charges
  for all
  to anon, authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on public.delivery_postcode_charges to anon, authenticated;

