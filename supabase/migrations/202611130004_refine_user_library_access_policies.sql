drop policy if exists "Users manage their own library" on public.user_library;
drop policy if exists "Public can view shared libraries" on public.user_library;

create policy "Users can view own and shared library" on public.user_library
for select to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.profiles p
    where p.id = user_library.user_id
      and p.is_public = true
      and p.show_library_on_profile = true
  )
);

create policy "Public can view shared libraries" on public.user_library
for select to anon
using (
  exists (
    select 1 from public.profiles p
    where p.id = user_library.user_id
      and p.is_public = true
      and p.show_library_on_profile = true
  )
);

create policy "Users can add to their own library" on public.user_library
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own library" on public.user_library
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can remove from their own library" on public.user_library
for delete to authenticated
using ((select auth.uid()) = user_id);