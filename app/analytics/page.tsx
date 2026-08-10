import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyticsByGuide, summariseGuideAnalytics, type GuideAnalyticsEvent } from "@/lib/guide-analytics";
import SiteHeader from "@/components/site-header";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/analytics");

  const ownerEmail = (process.env.ADMIN_NOTIFICATION_EMAIL ?? "hello@heartville.org").trim().toLowerCase();
  if (user.email?.toLowerCase() !== ownerEmail) redirect("/creator");

  const admin = createAdminClient();
  const [{ data: guides }, { data: events }, { data: profiles }] = await Promise.all([
    admin.from("guides").select("id, title, creator_id, status").order("created_at", { ascending: false }),
    admin.from("guide_events").select("id, guide_id, event_type, visitor_key"),
    admin.from("creator_profiles").select("user_id, display_name"),
  ]);

  const allEvents = (events ?? []) as GuideAnalyticsEvent[];
  const totals = summariseGuideAnalytics(allEvents);
  const perGuide = analyticsByGuide(allEvents);
  const profileNames = new Map((profiles ?? []).map((profile) => [profile.user_id, profile.display_name]));
  const guideRows = (guides ?? []).map((guide) => ({
    ...guide,
    creatorName: profileNames.get(guide.creator_id) ?? "Heart Guide",
    analytics: perGuide.get(guide.id) ?? { participants: 0, completed: 0, ctaClicks: 0, completionRate: 0, ctaRate: 0 },
  })).sort((a, b) => b.analytics.participants - a.analytics.participants);

  return (
    <>
      <SiteHeader />
      <main className="creator-page single-column">
        <section className="dashboard analytics-dashboard">
          <Link className="text-button analytics-back" href="/creator">← Creator Studio</Link>
          <p className="eyebrow">Heart Guide owner view</p>
          <h1>Guide performance</h1>
          <p className="analytics-lede">All-time participant flow across Heart Guide. Reflections and Message Score text are never shown here.</p>

          <section className="metrics" aria-label="Heart Guide analytics">
            <article><small>Participants</small><strong>{totals.participants}</strong><span>Started a guide</span></article>
            <article><small>Completion rate</small><strong>{totals.completionRate}%</strong><span>{totals.completed} completed</span></article>
            <article><small>CTA clicks</small><strong>{totals.ctaClicks}</strong><span>After a completed guide</span></article>
            <article><small>CTA conversion</small><strong>{totals.ctaRate}%</strong><span>Of completed journeys</span></article>
          </section>

          <section className="panel analytics-table-wrap">
            <div className="panel-title"><div><h2>Guide-by-guide performance</h2><p>Use this to spot guides worth sharing, improving or supporting.</p></div></div>
            <div className="analytics-table">
              <div className="analytics-row analytics-row-head"><span>Guide</span><span>Creator</span><span>Participants</span><span>Completed</span><span>CTA conversion</span></div>
              {guideRows.map((guide) => (
                <div className="analytics-row" key={guide.id}>
                  <strong>{guide.title}</strong><span>{guide.creatorName}</span><span>{guide.analytics.participants}</span><span>{guide.analytics.completionRate}%</span><span>{guide.analytics.ctaRate}%</span>
                </div>
              ))}
            </div>
          </section>
          <p className="analytics-note">Analytics use a random browser identifier from today onward to avoid counting the same browser repeatedly. No guide answers are included.</p>
        </section>
      </main>
    </>
  );
}
