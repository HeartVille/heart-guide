export type GuideAnalyticsEvent = {
  id: string;
  guide_id: string;
  event_type: "started" | "completed" | "cta_clicked";
  visitor_key: string | null;
};

export type GuideAnalytics = {
  participants: number;
  completed: number;
  ctaClicks: number;
  completionRate: number;
  ctaRate: number;
};

const emptyAnalytics: GuideAnalytics = { participants: 0, completed: 0, ctaClicks: 0, completionRate: 0, ctaRate: 0 };

function percentage(numerator: number, denominator: number) {
  return denominator ? Math.round((numerator / denominator) * 100) : 0;
}

export function summariseGuideAnalytics(events: GuideAnalyticsEvent[]): GuideAnalytics {
  if (!events.length) return emptyAnalytics;
  const visitors = { started: new Set<string>(), completed: new Set<string>(), ctaClicked: new Set<string>() };

  for (const event of events) {
    const visitor = event.visitor_key || event.id;
    if (event.event_type === "started") visitors.started.add(visitor);
    if (event.event_type === "completed") visitors.completed.add(visitor);
    if (event.event_type === "cta_clicked") visitors.ctaClicked.add(visitor);
  }

  const participants = visitors.started.size;
  const completed = visitors.completed.size;
  const ctaClicks = visitors.ctaClicked.size;
  return { participants, completed, ctaClicks, completionRate: percentage(completed, participants), ctaRate: percentage(ctaClicks, completed) };
}

export function analyticsByGuide(events: GuideAnalyticsEvent[]) {
  const grouped = new Map<string, GuideAnalyticsEvent[]>();
  for (const event of events) grouped.set(event.guide_id, [...(grouped.get(event.guide_id) ?? []), event]);
  return new Map([...grouped].map(([guideId, guideEvents]) => [guideId, summariseGuideAnalytics(guideEvents)]));
}
