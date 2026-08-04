import type { SupabaseClient } from "@supabase/supabase-js";

export async function hasFounderAccess(supabase: SupabaseClient, email: string) {
  const { data } = await supabase
    .from("founder_memberships")
    .select("status")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  return data?.status === "active";
}

/**
 * Whether this creator can publish guides right now — active Founder Access
 * (from either GHL or Stripe) or a manual beta-tester override. Backed by
 * the same Postgres function the guides RLS policy uses, so what a creator
 * sees here always matches what visitors are actually allowed to read.
 */
export async function canPublishGuides(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.rpc("creator_has_active_access", { creator: userId });
  return data === true;
}
