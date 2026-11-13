-- User settings and profile visibility for Book-A-Boo.
-- This migration has already been applied to the BooklyStar production database.
alter table public.profiles
  add column if not exists is_public boolean not null default true,
  add column if not exists show_library_on_profile boolean not null default true;

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'light' check (theme in ('light','dark')),
  preferred_language text not null default 'fr' check (preferred_language in ('fr','en','es','pt')),
  email_notifications boolean not null default true,
  product_updates boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;
grant select, insert, update on public.user_settings to authenticated;

drop policy if exists "Users can view their own settings" on public.user_settings;
create policy "Users can view their own settings" on public.user_settings
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert their own settings" on public.user_settings;
create policy "Users can insert their own settings" on public.user_settings
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own settings" on public.user_settings;
create policy "Users can update their own settings" on public.user_settings
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles
for select to anon, authenticated using (is_public = true or (select auth.uid()) = id);
