import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { guideId?: string; eventType?: string } | null;
  const guideId = body?.guideId;
  const eventType = body?.eventType;

  if (!guideId || (eventType !== "started" && eventType !== "completed")) {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }

  const supabase = createAdminClient();
  await supabase.from("guide_events").insert({ guide_id: guideId, event_type: eventType });

  return NextResponse.json({ ok: true });
}
