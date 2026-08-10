import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { guideId?: string; eventType?: string; visitorKey?: string } | null;
  const guideId = body?.guideId;
  const eventType = body?.eventType;
  const visitorKey = body?.visitorKey?.trim();

  if (!guideId || (eventType !== "started" && eventType !== "completed" && eventType !== "cta_clicked")) {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("guide_events").insert({
    guide_id: guideId,
    event_type: eventType,
    visitor_key: visitorKey && /^[a-zA-Z0-9-]{16,100}$/.test(visitorKey) ? visitorKey : null,
  });
  if (error) return NextResponse.json({ error: "Unable to record event." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
