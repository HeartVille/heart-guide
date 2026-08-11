-- Platform owners may have a creator profile and still manage the built-in
-- Heart Guide library. All other creators remain limited to one live guide.

alter table public.creator_profiles
  add column if not exists is_platform_owner boolean not null default false;

create or replace function public.enforce_one_live_guide_per_free_creator()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published'
    and exists (select 1 from public.creator_profiles where user_id = new.creator_id)
    and not coalesce(
      (select is_platform_owner from public.creator_profiles where user_id = new.creator_id),
      false
    )
    and exists (
      select 1
      from public.guides
      where creator_id = new.creator_id
        and status = 'published'
        and id is distinct from new.id
    ) then
    raise exception using
      errcode = '23505',
      message = 'Free creators can publish one live guide at a time.',
      hint = 'Unpublish your current live guide before publishing another one.';
  end if;

  return new;
end;
$$;
