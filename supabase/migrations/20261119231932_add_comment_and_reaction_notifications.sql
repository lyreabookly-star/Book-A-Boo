alter table public.user_settings
  add column if not exists notify_story_comments boolean not null default true,
  add column if not exists notify_story_reactions boolean not null default true;

alter table public.notifications
  drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type = any (array['new_follower','new_story','new_comment','new_reaction']::text[]));

create or replace function private.notify_story_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  story_author uuid;
begin
  select s.author_id into story_author
  from public.stories s
  where s.id = new.story_id
    and s.status = 'published'
    and s.visibility = 'public';

  if story_author is not null
     and story_author <> new.author_id
     and coalesce((select us.notify_story_comments from public.user_settings us where us.user_id = story_author), true) then
    insert into public.notifications (recipient_id, actor_id, type, story_id)
    values (story_author, new.author_id, 'new_comment', new.story_id);
  end if;
  return new;
end;
$function$;

create or replace function private.notify_story_reaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  story_author uuid;
begin
  select s.author_id into story_author
  from public.stories s
  where s.id = new.story_id
    and s.status = 'published'
    and s.visibility = 'public';

  if story_author is not null
     and story_author <> new.user_id
     and coalesce((select us.notify_story_reactions from public.user_settings us where us.user_id = story_author), true) then
    insert into public.notifications (recipient_id, actor_id, type, story_id)
    values (story_author, new.user_id, 'new_reaction', new.story_id);
  end if;
  return new;
end;
$function$;

revoke all on function private.notify_story_comment() from public, anon, authenticated;
revoke all on function private.notify_story_reaction() from public, anon, authenticated;

drop trigger if exists story_comments_notify_author on public.story_comments;
create trigger story_comments_notify_author
after insert on public.story_comments
for each row execute function private.notify_story_comment();

drop trigger if exists story_reactions_notify_author on public.story_reactions;
create trigger story_reactions_notify_author
after insert on public.story_reactions
for each row execute function private.notify_story_reaction();
