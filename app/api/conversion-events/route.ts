import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const conversionEventTypes = new Set([
  "message_score_started",
  "message_score_completed",
  "validation_booking_clicked",
  "founder_checkout_started",
]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { eventType?: string; visitorKey?: string } | null;
  const eventType = body?.eventType;
  const visitorKey = body?.visitorKey?.trim();

  if (!eventType || !conversionEventTypes.has(eventType)) {
    return NextResponse.json({ error: "Invalid conversion event." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("conversion_funnel_events").insert({
    event_type: eventType,
    visitor_key: visitorKey && /^[a-zA-Z0-9-]{16,100}$/.test(visitorKey) ? visitorKey : null,
  });
  if (error) return NextResponse.json({ error: "Unable to record conversion event." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
