-- Remove the Founder-Access-gated publish requirement for creators.
-- Any signed-in creator can publish freely again; the visitor-facing
-- Founder Access / founder_memberships system (GHL-driven) is untouched.
-- Run once against the live project (Studio SQL editor).

drop policy if exists "Anyone can read live published guides, creators read their own" on public.guides;

create policy "Anyone can read published guides, creators read their own"
  on public.guides for select
  to public
  using (status = 'published' or creator_id = auth.uid());

drop function if exists public.creator_has_active_access(uuid);

alter table public.creator_profiles
  drop column if exists manual_publish_override;
