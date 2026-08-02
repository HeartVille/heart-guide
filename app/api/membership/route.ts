import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasFounderAccess } from "@/lib/membership";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ signedIn: false, founderAccess: false });
  }

  return NextResponse.json({
    signedIn: true,
    founderAccess: await hasFounderAccess(supabase, user.email),
  });
}
