-- Extra creator resource links (book, masterclass, calendar, etc.)
-- Run once against the live project (Studio SQL editor).

alter table public.creator_profiles
  add column if not exists resource_links jsonb not null default '[]'::jsonb;
