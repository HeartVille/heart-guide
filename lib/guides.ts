import type { SupabaseClient } from "@supabase/supabase-js";

export type JourneyStep = { label: string; question: string; placeholder: string };
export type ResourceLink = { label: string; url: string };
export type Creator = {
  displayName: string;
  bio: string | null;
  websiteUrl: string | null;
  consultationUrl: string | null;
  resourceUrl: string | null;
  resourceLinks: ResourceLink[];
};
export type Guide = {
  id: string;
  title: string;
  category: string;
  description: string;
  colour: string;
  symbol: string;
  questions: JourneyStep[];
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
  creator_id: string;
};

type CreatorRow = {
  user_id: string;
  display_name: string;
  bio: string | null;
  website_url: string | null;
  consultation_url: string | null;
  resource_url: string | null;
  resource_links: ResourceLink[] | null;
};

export async function getPublishedGuides(supabase: SupabaseClient): Promise<Guide[]> {
  const { data: guideRows } = await supabase
    .from("guides")
    .select("id, title, category, description, colour, symbol, questions, creator_id")
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
          .select("user_id, display_name, bio, website_url, consultation_url, resource_url, resource_links")
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
      creator: creatorRow
        ? {
            displayName: creatorRow.display_name,
            bio: creatorRow.bio,
            websiteUrl: creatorRow.website_url,
            consultationUrl: creatorRow.consultation_url,
            resourceUrl: creatorRow.resource_url,
            resourceLinks: creatorRow.resource_links ?? [],
          }
        : null,
    };
  });
}
