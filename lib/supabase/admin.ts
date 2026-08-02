import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for server-only code paths with no user session
 * (e.g. the GHL membership webhook). Bypasses RLS — never expose to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
