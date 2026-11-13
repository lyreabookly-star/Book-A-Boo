-- Book-A-Boo: œuvres et chapitres privés des auteurs
-- Cette migration décrit le schéma déjà appliqué au projet BooklyStar.

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  synopsis text not null default '' check (char_length(synopsis) <= 1200),
  genre text not null default '',
  language text not null default 'fr' check (language in ('fr','en','es','pt')),
  status text not null default 'draft' check (status in ('draft','published')),
  visibility text not null default 'private' check (visibility in ('private','public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Chapitre 1' check (char_length(title) between 1 and 160),
  content text not null default '',
  chapter_number integer not null default 1 check (chapter_number > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, chapter_number)
);

create index if not exists stories_author_updated_idx on public.stories(author_id, updated_at desc);
create index if not exists chapters_story_number_idx on public.chapters(story_id, chapter_number);

alter table public.stories enable row level security;
alter table public.chapters enable row level security;

grant select on public.stories to anon, authenticated;
grant insert, update, delete on public.stories to authenticated;
grant select on public.chapters to anon, authenticated;
grant insert, update, delete on public.chapters to authenticated;

drop policy if exists "Authors manage their own stories" on public.stories;
create policy "Authors manage their own stories"
on public.stories for all to authenticated
using ((select auth.uid()) = author_id)
with check ((select auth.uid()) = author_id);

drop policy if exists "Public can read published public stories" on public.stories;
create policy "Public can read published public stories"
on public.stories for select to anon, authenticated
using (status = 'published' and visibility = 'public');

drop policy if exists "Authors manage their own chapters" on public.chapters;
create policy "Authors manage their own chapters"
on public.chapters for all to authenticated
using (
  (select auth.uid()) = author_id
  and exists (select 1 from public.stories s where s.id = story_id and s.author_id = (select auth.uid()))
)
with check (
  (select auth.uid()) = author_id
  and exists (select 1 from public.stories s where s.id = story_id and s.author_id = (select auth.uid()))
);

drop policy if exists "Public can read chapters of published public stories" on public.chapters;
create policy "Public can read chapters of published public stories"
on public.chapters for select to anon, authenticated
using (
  exists (
    select 1 from public.stories s
    where s.id = story_id and s.status = 'published' and s.visibility = 'public'
  )
);
