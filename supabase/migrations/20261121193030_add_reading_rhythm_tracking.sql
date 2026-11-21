-- Private reading rhythm settings and per-chapter progress.
create table if not exists public.user_reading_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tracking_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.user_reading_preferences enable row level security;
grant select, insert, update, delete on public.user_reading_preferences to authenticated;
create policy "Readers manage their own reading preferences"
on public.user_reading_preferences for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create table if not exists public.user_reading_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  chapter_number integer not null default 1,
  scroll_ratio numeric(5,4) not null default 0 check (scroll_ratio >= 0 and scroll_ratio <= 1),
  words_read integer not null default 0 check (words_read >= 0),
  active_seconds integer not null default 0 check (active_seconds >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, story_id, chapter_id)
);
create index if not exists user_reading_progress_user_updated_idx
on public.user_reading_progress (user_id, updated_at desc);
alter table public.user_reading_progress enable row level security;
grant select, insert, update, delete on public.user_reading_progress to authenticated;
create policy "Readers manage their own reading progress"
on public.user_reading_progress for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
