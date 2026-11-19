-- Keep the database limit aligned with the 5,000-character synopsis field in the writing studio.
alter table public.stories drop constraint if exists stories_synopsis_check;
alter table public.stories add constraint stories_synopsis_check check (char_length(synopsis) <= 5000);
