import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { siteOrigin } from "@/lib/site";
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

  const shareUrl = guide.status === "published" ? `${await siteOrigin()}/guides/${guide.id}` : null;

  return (
    <>
    <SiteHeader />
    <main className="auth-page">
      <div className="auth-card creator-form-card">
        <p className="eyebrow" style={{ textAlign: "center" }}>Creator Studio</p>
        <h1>Edit Heart Guide</h1>
        <p>This guide is currently <strong>{guide.status === "published" ? "published" : "a draft"}</strong>.</p>
        {shareUrl && (
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
            Share this link: <a href={shareUrl}>{shareUrl}</a>
          </p>
        )}
        <GuideForm action={updateGuide.bind(null, guide.id)} submitLabel="Save changes" initial={guide} />
        {error && <p className="auth-error">{error}</p>}

        <div className="actions" style={{ justifyContent: "center", marginTop: 24 }}>
          <form action={setGuideStatus.bind(null, guide.id, guide.status === "published" ? "draft" : "published")}>
            <button className="button secondary" type="submit">{guide.status === "published" ? "Unpublish" : "Publish"}</button>
          </form>
          <form action={deleteGuide.bind(null, guide.id)}>
            <button className="button secondary" type="submit">Delete guide</button>
          </form>
        </div>
      </div>
    </main>
    </>
  );
}
