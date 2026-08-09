alter table public.guides
  add column if not exists result_heading text not null default 'A clearer direction is taking shape.',
  add column if not exists result_insight text not null default 'Your answers point to what matters most and the next step you are ready to take.',
  add column if not exists result_prompt text not null default 'What support, timing or boundary would make this feel possible?';

comment on column public.guides.result_heading is 'Short heading shown when a participant completes this guide.';
comment on column public.guides.result_insight is 'Creator-authored interpretation that frames the participant answers.';
comment on column public.guides.result_prompt is 'Closing reflection that helps the participant act with care.';
