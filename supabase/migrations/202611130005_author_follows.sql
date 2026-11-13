-- Book-A-Boo: abonnements entre lecteurs et auteurs publics
create table if not exists public.author_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, author_id),
  constraint author_follows_no_self_follow check (follower_id <> author_id)
);

create index if not exists author_follows_author_created_idx
  on public.author_follows (author_id, created_at desc);

alter table public.author_follows enable row level security;
grant select, insert, delete on public.author_follows to authenticated;

drop policy if exists "Readers can view their own follows" on public.author_follows;
create policy "Readers can view their own follows"
  on public.author_follows for select to authenticated
  using ((select auth.uid()) = follower_id);

drop policy if exists "Readers can follow public authors" on public.author_follows;
create policy "Readers can follow public authors"
  on public.author_follows for insert to authenticated
  with check (
    (select auth.uid()) = follower_id
    and follower_id <> author_id
    and exists (
      select 1 from public.profiles p
      where p.id = author_id and p.is_public = true
    )
  );

drop policy if exists "Readers can unfollow authors" on public.author_follows;
create policy "Readers can unfollow authors"
  on public.author_follows for delete to authenticated
  using ((select auth.uid()) = follower_id);
