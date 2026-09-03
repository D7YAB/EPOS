alter table public.categories
  add column if not exists sort_order integer;

with ranked_categories as (
  select
    id,
    row_number() over (order by name asc, id asc) - 1 as position
  from public.categories
)
update public.categories as category
set sort_order = ranked.position
from ranked_categories as ranked
where category.id = ranked.id
  and category.sort_order is null;

alter table public.categories
  alter column sort_order set default 0,
  alter column sort_order set not null;

create index if not exists idx_categories_sort_order
  on public.categories(sort_order, name);
