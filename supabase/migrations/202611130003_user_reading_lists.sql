create table if not exists public.user_reading_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.user_reading_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.user_reading_lists(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (list_id, story_id)
);

alter table public.user_reading_lists enable row level security;
alter table public.user_reading_list_items enable row level security;

grant select, insert, update, delete on public.user_reading_lists to authenticated;
grant select, insert, delete on public.user_reading_list_items to authenticated;

drop policy if exists "Users manage their own reading lists" on public.user_reading_lists;
create policy "Users manage their own reading lists"
on public.user_reading_lists for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users view items in their own reading lists" on public.user_reading_list_items;
create policy "Users view items in their own reading lists"
on public.user_reading_list_items for select to authenticated
using (exists (select 1 from public.user_reading_lists l where l.id = list_id and l.user_id = (select auth.uid())));

drop policy if exists "Users add items to their own reading lists" on public.user_reading_list_items;
create policy "Users add items to their own reading lists"
on public.user_reading_list_items for insert to authenticated
with check (exists (select 1 from public.user_reading_lists l where l.id = list_id and l.user_id = (select auth.uid())));

drop policy if exists "Users remove items from their own reading lists" on public.user_reading_list_items;
create policy "Users remove items from their own reading lists"
on public.user_reading_list_items for delete to authenticated
using (exists (select 1 from public.user_reading_lists l where l.id = list_id and l.user_id = (select auth.uid())));

create index if not exists user_reading_lists_user_id_idx on public.user_reading_lists(user_id);
create index if not exists user_reading_list_items_list_id_idx on public.user_reading_list_items(list_id);
create index if not exists user_reading_list_items_story_id_idx on public.user_reading_list_items(story_id);
