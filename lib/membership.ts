import type { SupabaseClient } from "@supabase/supabase-js";

export async function hasFounderAccess(supabase: SupabaseClient, email: string) {
  const { data } = await supabase
    .from("founder_memberships")
    .select("status")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  return data?.status === "active";
}
