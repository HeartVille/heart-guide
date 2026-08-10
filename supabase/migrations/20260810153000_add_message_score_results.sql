create table if not exists public.message_score_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text not null default 'soul-aligned-message-score' check (slug = 'soul-aligned-message-score'),
  original_message text not null check (char_length(original_message) between 25 and 20000),
  overall_score integer not null check (overall_score between 0 and 100),
  category_scores jsonb not null default '{}'::jsonb,
  greatest_strength text not null,
  priority_improvement text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists message_score_results_user_updated_idx
  on public.message_score_results (user_id, updated_at desc);

alter table public.message_score_results enable row level security;

create policy "Users can read their own message score results"
  on public.message_score_results for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can save their own message score results"
  on public.message_score_results for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
