import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/site-header";
import { createGuide } from "../../actions";
import GuideForm from "../../guide-form";

export const dynamic = "force-dynamic";

export default async function NewGuidePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/creator/guides/new");

  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) redirect("/creator/profile");

  return (
    <>
    <SiteHeader />
    <main className="auth-page">
      <div className="auth-card creator-form-card">
        <p className="eyebrow" style={{ textAlign: "center" }}>Creator Studio</p>
        <h1>Create a Heart Guide</h1>
        <p>Your guide will be saved as a draft until you publish it from your dashboard.</p>
        <GuideForm action={createGuide} submitLabel="Save as draft" />
        {error && <p className="auth-error">{error}</p>}
      </div>
    </main>
    </>
  );
}
