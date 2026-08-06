-- Track clicks on a creator's resource CTA at the end of a guide result,
-- reusing guide_events (same shape as started/completed).
-- Run once against the live project (Studio SQL editor).

alter table public.guide_events drop constraint if exists guide_events_event_type_check;

alter table public.guide_events
  add constraint guide_events_event_type_check
  check (event_type in ('started', 'completed', 'cta_clicked'));
