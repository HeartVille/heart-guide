-- Privacy-safe measurement for the site-to-GHL conversion paths.
-- This records conversion stages and a random browser key only. It never
-- stores guide reflections, Message Score text, names, or email addresses.

create table if not exists public.conversion_funnel_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in (
    'message_score_started',
    'message_score_completed',
    'validation_booking_clicked',
    'founder_checkout_started'
  )),
  visitor_key text,
  created_at timestamptz not null default now()
);

create index if not exists conversion_funnel_events_event_visitor_idx
  on public.conversion_funnel_events (event_type, visitor_key);

alter table public.conversion_funnel_events enable row level security;

-- The application records events with its server-only service-role client.
-- No browser role can read or write these funnel records directly.
