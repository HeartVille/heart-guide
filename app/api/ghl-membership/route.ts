import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type MembershipEvent = {
  email?: unknown;
  status?: unknown;
  plan?: unknown;
};

function secureEquals(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function POST(request: Request) {
  const expectedSecret = process.env.GHL_MEMBERSHIP_WEBHOOK_SECRET;
  const suppliedSecret = request.headers.get("x-heart-guide-secret") ?? "";
  if (!expectedSecret || !secureEquals(suppliedSecret, expectedSecret)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  let body: MembershipEvent;
  try {
    body = (await request.json()) as MembershipEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const requestedStatus = String(body.status ?? "active").trim().toLowerCase();
  const allowedStatuses = new Set(["active", "cancelled", "expired", "refunded", "past_due", "unpaid", "inactive"]);
  const status = allowedStatuses.has(requestedStatus) ? requestedStatus : "";
  const plan = String(body.plan ?? "Founder Access").trim().slice(0, 100);

  if (!email || !email.includes("@") || !status) {
    return NextResponse.json(
      { error: "A valid email and recognised membership status are required." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from("founder_memberships").upsert(
    { email, status, plan, source: "ghl", updated_at: updatedAt },
    { onConflict: "email" },
  );

  if (error) {
    return NextResponse.json({ error: "Unable to update membership." }, { status: 500 });
  }

  return NextResponse.json({ accepted: true, email, status, updatedAt });
}
