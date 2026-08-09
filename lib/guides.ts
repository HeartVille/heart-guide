import type { SupabaseClient } from "@supabase/supabase-js";

export type JourneyStep = { label: string; question: string; placeholder: string };
export type Creator = {
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  resourceTitle: string | null;
  resourceDescription: string | null;
  resourceUrl: string | null;
  ctaLabel: string | null;
};
export type Guide = {
  id: string;
  title: string;
  category: string;
  description: string;
  colour: string;
  symbol: string;
  questions: JourneyStep[];
  resultHeading: string;
  resultInsight: string;
  resultPrompt: string;
  creator: Creator | null;
};

type GuideRow = {
  id: string;
  title: string;
  category: string;
  description: string;
  colour: string;
  symbol: string;
  questions: JourneyStep[];
  result_heading: string;
  result_insight: string;
  result_prompt: string;
  creator_id: string;
};

type CreatorRow = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  resource_title: string | null;
  resource_description: string | null;
  resource_url: string | null;
  cta_label: string | null;
};

export async function getPublishedGuides(supabase: SupabaseClient): Promise<Guide[]> {
  const { data: guideRows } = await supabase
    .from("guides")
    .select("id, title, category, description, colour, symbol, questions, result_heading, result_insight, result_prompt, creator_id")
    .eq("status", "published")
    .order("created_at", { ascending: true });

  return attachCreators(supabase, (guideRows as GuideRow[] | null) ?? []);
}

export async function attachCreators(supabase: SupabaseClient, guideRows: GuideRow[]): Promise<Guide[]> {
  const creatorIds = [...new Set(guideRows.map((row) => row.creator_id))];

  const { data: creatorRows } =
    creatorIds.length > 0
      ? await supabase
          .from("creator_profiles")
          .select("user_id, display_name, avatar_url, bio, resource_title, resource_description, resource_url, cta_label")
          .in("user_id", creatorIds)
      : { data: [] as CreatorRow[] };

  const creatorById = new Map((creatorRows as CreatorRow[] | null ?? []).map((row) => [row.user_id, row]));

  return guideRows.map((row) => {
    const creatorRow = creatorById.get(row.creator_id);
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      description: row.description,
      colour: row.colour,
      symbol: row.symbol,
      questions: row.questions,
      resultHeading: row.result_heading,
      resultInsight: row.result_insight,
      resultPrompt: row.result_prompt,
      creator: creatorRow
        ? {
            displayName: creatorRow.display_name,
            avatarUrl: creatorRow.avatar_url,
            bio: creatorRow.bio,
            resourceTitle: creatorRow.resource_title,
            resourceDescription: creatorRow.resource_description,
            resourceUrl: creatorRow.resource_url,
            ctaLabel: creatorRow.cta_label,
          }
        : null,
    };
  });
}
