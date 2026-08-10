create or replace function public.enforce_one_live_guide_per_free_creator()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Built-in Heart Guides do not have a creator profile. The limit applies to
  -- self-serve creators, who must create a profile before they can create guides.
  if new.status = 'published'
    and exists (select 1 from public.creator_profiles where user_id = new.creator_id)
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

drop trigger if exists enforce_one_live_guide_per_free_creator on public.guides;

create trigger enforce_one_live_guide_per_free_creator
before insert or update of status, creator_id on public.guides
for each row
execute function public.enforce_one_live_guide_per_free_creator();
