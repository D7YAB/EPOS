create table if not exists public.postcode_address_cache (
  postcode text primary key,
  addresses jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.postcode_address_cache enable row level security;

-- Match main: the public key can access the postcode cache.
grant select, insert, update, delete on table public.postcode_address_cache to anon, authenticated, service_role;
drop policy if exists "read_postcode_address_cache" on public.postcode_address_cache;
drop policy if exists "open_postcode_address_cache" on public.postcode_address_cache;
create policy "open_postcode_address_cache" on public.postcode_address_cache
  for all to anon, authenticated using (true) with check (true);
