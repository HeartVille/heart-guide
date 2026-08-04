import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notifyNewSignup } from "@/lib/notify";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await notifyNewSignup(data.user?.email, data.user?.user_metadata?.full_name as string | undefined);
      redirect(next);
    }
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      await notifyNewSignup(data.user?.email, data.user?.user_metadata?.full_name as string | undefined);
      redirect(next);
    }
  }

  redirect("/sign-in?error=" + encodeURIComponent("That confirmation link is invalid or has expired."));
}
