create table if not exists public.postcode_address_cache (
  postcode text primary key,
  addresses jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.postcode_address_cache enable row level security;

drop policy if exists "open_postcode_address_cache" on public.postcode_address_cache;
create policy "open_postcode_address_cache"
  on public.postcode_address_cache
  for all
  to anon, authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on public.postcode_address_cache to anon, authenticated;
