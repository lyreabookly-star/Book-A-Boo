create table if not exists public.user_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  status text not null default 'to_read' check (status in ('reading','to_read','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_library_user_story_unique unique (user_id, story_id)
);

create index if not exists user_library_user_status_updated_idx
  on public.user_library (user_id, status, updated_at desc);
create index if not exists user_library_story_id_idx
  on public.user_library (story_id);

alter table public.user_library enable row level security;
grant select, insert, update, delete on public.user_library to authenticated;
grant select on public.user_library to anon;

drop policy if exists "Users manage their own library" on public.user_library;
create policy "Users manage their own library" on public.user_library
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Public can view shared libraries" on public.user_library;
create policy "Public can view shared libraries" on public.user_library
for select to anon, authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = user_library.user_id
      and p.is_public = true
      and p.show_library_on_profile = true
  )
);
