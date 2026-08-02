import { createClient } from "@/lib/supabase/server";
import { hasFounderAccess } from "@/lib/membership";
import HeartGuideClient from "./heart-guide-client";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const founderAccess = user?.email ? await hasFounderAccess(supabase, user.email) : false;

  return (
    <HeartGuideClient
      founderAccess={founderAccess}
      user={
        user?.email
          ? {
              email: user.email,
              name: (user.user_metadata?.full_name as string | undefined) ?? user.email,
            }
          : null
      }
    />
  );
}
