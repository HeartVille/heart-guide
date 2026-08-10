alter table public.guide_events
  add column if not exists visitor_key text;

create index if not exists guide_events_analytics_visitor_idx
  on public.guide_events (guide_id, event_type, visitor_key);
