import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canPublishGuides } from "@/lib/membership";
import { FOUNDER_CHECKOUT_URL } from "@/lib/founder-checkout";
import SiteHeader from "@/components/site-header";
import { deleteGuide, setGuideStatus, updateGuide } from "../../actions";
import GuideForm from "../../guide-form";

export const dynamic = "force-dynamic";

export default async function EditGuidePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/creator/guides/${id}`);

  const { data: guide } = await supabase
    .from("guides")
    .select("id, title, category, description, colour, symbol, questions, status, creator_id")
    .eq("id", id)
    .maybeSingle();

  if (!guide || guide.creator_id !== user.id) {
    redirect("/creator");
  }

  const canPublish = await canPublishGuides(supabase, user.id);

  return (
    <>
    <SiteHeader />
    <main className="auth-page">
      <div className="auth-card creator-form-card">
        <p className="eyebrow" style={{ textAlign: "center" }}>Creator Studio</p>
        <h1>Edit Heart Guide</h1>
        <p>This guide is currently <strong>{guide.status === "published" ? "published" : "a draft"}</strong>.</p>
        <GuideForm action={updateGuide.bind(null, guide.id)} submitLabel="Save changes" initial={guide} />
        {error && <p className="auth-error">{error}</p>}

        <div className="actions" style={{ justifyContent: "center", marginTop: 24, flexDirection: "column", alignItems: "center" }}>
          {guide.status === "published" ? (
            <form action={setGuideStatus.bind(null, guide.id, "draft")}>
              <button className="button secondary" type="submit">Unpublish</button>
            </form>
          ) : canPublish ? (
            <form action={setGuideStatus.bind(null, guide.id, "published")}>
              <button className="button secondary" type="submit">Publish</button>
            </form>
          ) : (
            <>
              <a className="button primary" href={FOUNDER_CHECKOUT_URL}>Publish My Guide Free for 30 Days <span>→</span></a>
              <p className="membership-note" style={{ textAlign: "center", maxWidth: 360 }}>
                <strong>30 days free, then $19/month.</strong>
                <br />
                No charge today. Cancel anytime before your trial ends. Your Guide will be paused if you cancel, but your content will remain saved.
                <br />
                After checkout, come back here and publish — your access unlocks automatically.
              </p>
            </>
          )}

          <form action={deleteGuide.bind(null, guide.id)}>
            <button className="button secondary" type="submit">Delete guide</button>
          </form>
        </div>
      </div>
    </main>
    </>
  );
}
