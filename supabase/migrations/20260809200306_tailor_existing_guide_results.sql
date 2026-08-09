update public.guides
set
  result_heading = case title
    when 'Weekly Heart Compass' then 'Your next week has a centre.'
    when 'Aligned Visibility' then 'Visibility can begin with service.'
    when 'Loving Boundaries' then 'Your boundary is protecting something worthy.'
    when 'Heart-Mindful Pause' then 'Your own wisdom is already here.'
    when 'Connection Clarity' then 'Clarity begins with what you are longing for.'
    when 'Navigating Relationship Tensions' then 'The need beneath the tension is your compass.'
    else result_heading
  end,
  result_insight = case title
    when 'Weekly Heart Compass' then 'What you are ready to release makes space for the intention you chose. Let it guide your energy rather than become another standard to meet.'
    when 'Aligned Visibility' then 'The truth you named is not something you need to perform; it is something useful you are ready to offer. Your next action can be generous, small and recognisably yours.'
    when 'Loving Boundaries' then 'The need or value you named is the heart of this boundary. Clear words can honour both you and the relationship without requiring a long justification.'
    when 'Heart-Mindful Pause' then 'The quiet wisdom you heard offers a gentler way back into your day. Your next choice does not need to solve everything; it only needs to honour what you noticed.'
    when 'Connection Clarity' then 'The longing you named reveals what matters beneath the difficulty. Let your next action express that truth without trying to control the other person’s response.'
    when 'Navigating Relationship Tensions' then 'The need you uncovered offers a clearer place to respond from. A small honest action can interrupt the old pattern without forcing an immediate resolution.'
    else result_insight
  end,
  result_prompt = case title
    when 'Weekly Heart Compass' then 'What is one small way you can honour this intention in the next 24 hours?'
    when 'Aligned Visibility' then 'How can you make this action useful to one real person rather than impressive to everyone?'
    when 'Loving Boundaries' then 'What will help you hold this boundary warmly and consistently after you express it?'
    when 'Heart-Mindful Pause' then 'What reminder could help you return to this choice when the day becomes busy again?'
    when 'Connection Clarity' then 'What would help you take this step with honesty, care and room for the other person’s truth?'
    when 'Navigating Relationship Tensions' then 'What would make this action feel both courageous and emotionally safe enough to take?'
    else result_prompt
  end,
  updated_at = now()
where title in (
  'Weekly Heart Compass',
  'Aligned Visibility',
  'Loving Boundaries',
  'Heart-Mindful Pause',
  'Connection Clarity',
  'Navigating Relationship Tensions'
);
