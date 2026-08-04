-- Founding Creator: GHL-backed 30-day-free-trial subscription that gates
-- guide publishing (same payment link as visitor Founder Access, so
-- founder_memberships stays the single source of truth for "active
-- founder-level access" across both entry points).
-- Run once against the live project (Studio SQL editor).

-- Lets the first few beta testers publish without a card while the whole
-- flow is being verified. Flip manually via SQL; no UI for this.
alter table public.creator_profiles
  add column if not exists manual_publish_override boolean not null default false;

-- Single source of truth for "can this creator's guides go live", used by
-- both the guides RLS policy below and the app. security definer so it can
-- read across auth.users / founder_memberships regardless of the caller's
-- own row-level restrictions; it only ever returns a boolean, so this does
-- not widen what data callers can read.
create or replace function public.creator_has_active_access(creator uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from auth.users u
      join public.founder_memberships fm on fm.email = u.email
      where u.id = creator
        and fm.status = 'active'
    )
    or exists (
      select 1
      from public.creator_profiles cp
      where cp.user_id = creator
        and cp.manual_publish_override = true
    );
$$;

drop policy if exists "Anyone can read published guides, creators read their own" on public.guides;

create policy "Anyone can read live published guides, creators read their own"
  on public.guides for select
  to public
  using (
    (status = 'published' and public.creator_has_active_access(creator_id))
    or creator_id = auth.uid()
  );
