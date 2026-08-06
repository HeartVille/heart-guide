import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasFounderAccess } from "@/lib/membership";
import { getPublishedGuides } from "@/lib/guides";
import HeartGuideClient from "../../heart-guide-client";

export const dynamic = "force-dynamic";

export default async function GuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [founderAccess, guides] = await Promise.all([
    user?.email ? hasFounderAccess(supabase, user.email) : Promise.resolve(false),
    getPublishedGuides(supabase),
  ]);

  if (!guides.some((guide) => guide.id === id)) {
    redirect("/explore");
  }

  return (
    <HeartGuideClient
      initialView="journey"
      initialGuideId={id}
      founderAccess={founderAccess}
      guides={guides}
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
