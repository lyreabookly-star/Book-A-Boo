-- Book-A-Boo: fondations des profils membres
-- À exécuter dans Supabase SQL Editor après validation du projet.
-- Les noms/prénoms restent privés; seul le pseudonyme et les champs publics
-- du profil sont lisibles par les visiteurs.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique
    check (username = lower(username) and username ~ '^[a-z0-9_]{3,24}$'),
  display_name text,
  avatar_url text,
  bio text not null default '' check (char_length(bio) <= 300),
  preferred_language text not null default 'fr'
    check (preferred_language in ('fr', 'en', 'es', 'pt')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_private (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '' check (char_length(first_name) <= 80),
  last_name text not null default '' check (char_length(last_name) <= 80),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;

-- Les profils publics sont consultables, mais chaque membre ne modifie que le sien.
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- Les prénoms et noms ne sont accessibles qu'à leur propriétaire.
drop policy if exists "Users can view their own private profile" on public.profile_private;
create policy "Users can view their own private profile"
  on public.profile_private for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own private profile" on public.profile_private;
create policy "Users can create their own private profile"
  on public.profile_private for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own private profile" on public.profile_private;
create policy "Users can update their own private profile"
  on public.profile_private for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Création automatique des deux lignes de profil lors de l'inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
  safe_username text;
begin
  requested_username := coalesce(new.raw_user_meta_data ->> 'username', '');
  safe_username := lower(regexp_replace(requested_username, '[^a-zA-Z0-9_]', '', 'g'));

  if length(safe_username) < 3 then
    safe_username := 'lecteur_' || replace(left(new.id::text, 8), '-', '');
  end if;

  if exists (select 1 from public.profiles p where p.username = safe_username) then
    safe_username := 'lecteur_' || replace(left(new.id::text, 8), '-', '');
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    safe_username,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  );

  insert into public.profile_private (user_id, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', '')
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Bucket public pour afficher les photos de profil.
-- Les fichiers sont rangés dans un dossier portant l'UUID du propriétaire.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar images are publicly viewable" on storage.objects;
create policy "Avatar images are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
