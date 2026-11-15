alter table public.stories add column if not exists slug text;

update public.stories
set slug = coalesce(
  nullif(trim(both '-' from regexp_replace(
    regexp_replace(
      lower(translate(title,
        'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝŸàáâãäåæçèéêëìíîïðñòóôõöøùúûüýÿ',
        'AAAAAAACEEEEIIIIDNOOOOOOUUUUYYaaaaaaaceeeeiiiidnoooooouuuuyy'
      )),
      '[^a-z0-9]+', '-', 'g'
    ), '(^-|-$)', '', 'g'
  )), 'oeuvre') || '-' || left(id::text, 8)
)
where slug is null or slug = '';

create unique index if not exists stories_slug_unique_idx on public.stories(slug);
alter table public.stories alter column slug set not null;
