-- Simplified creator CTA: name, avatar, bio, one resource, one CTA button.
-- Run once against the live project (Studio SQL editor).

alter table public.creator_profiles
  add column if not exists avatar_url text,
  add column if not exists resource_title text,
  add column if not exists resource_description text,
  add column if not exists cta_label text;
