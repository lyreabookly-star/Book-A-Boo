-- Keep the same authorization rules while evaluating auth.uid() once per statement.
drop policy if exists "Editorial members can view own membership" on public.editorial_members;
create policy "Editorial members can view own membership"
  on public.editorial_members
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Editorial members can add selections" on public.editorial_selections;
create policy "Editorial members can add selections"
  on public.editorial_selections
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.editorial_members m
      where m.user_id = (select auth.uid())
        and m.can_manage = true
    )
  );

drop policy if exists "Editorial members can delete selections" on public.editorial_selections;
create policy "Editorial members can delete selections"
  on public.editorial_selections
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.editorial_members m
      where m.user_id = (select auth.uid())
        and m.can_manage = true
    )
  );

drop policy if exists "Editorial members can update selections" on public.editorial_selections;
create policy "Editorial members can update selections"
  on public.editorial_selections
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.editorial_members m
      where m.user_id = (select auth.uid())
        and m.can_manage = true
    )
  )
  with check (
    exists (
      select 1
      from public.editorial_members m
      where m.user_id = (select auth.uid())
        and m.can_manage = true
    )
  );

drop policy if exists "Users can submit content reports" on public.platform_content_reports;
create policy "Users can submit content reports"
  on public.platform_content_reports
  for insert
  to authenticated
  with check (reporter_id = (select auth.uid()));
