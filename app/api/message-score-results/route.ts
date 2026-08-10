import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type MessageScoreResultPayload = {
  originalMessage?: string;
  overallScore?: number;
  categoryScores?: Record<string, number>;
  greatestStrength?: string;
  priorityImprovement?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = (await request.json()) as MessageScoreResultPayload;
  const originalMessage = body.originalMessage?.trim() ?? "";
  const overallScore = Number(body.overallScore);
  const greatestStrength = body.greatestStrength?.trim() ?? "";
  const priorityImprovement = body.priorityImprovement?.trim() ?? "";

  if (
    originalMessage.length < 25 ||
    originalMessage.length > 20000 ||
    !Number.isInteger(overallScore) ||
    overallScore < 0 ||
    overallScore > 100 ||
    !greatestStrength ||
    !priorityImprovement
  ) {
    return NextResponse.json({ error: "Invalid Message Score result." }, { status: 400 });
  }

  const categoryScores = Object.fromEntries(
    Object.entries(body.categoryScores ?? {})
      .filter(([name, score]) => name.length > 0 && name.length <= 120 && Number.isFinite(score))
      .map(([name, score]) => [name, Math.max(0, Math.min(20, Math.round(score)))]),
  );

  const { data, error } = await supabase
    .from("message_score_results")
    .insert({
      user_id: user.id,
      slug: "soul-aligned-message-score",
      original_message: originalMessage,
      overall_score: overallScore,
      category_scores: categoryScores,
      greatest_strength: greatestStrength,
      priority_improvement: priorityImprovement,
    })
    .select("id, slug, created_at, updated_at")
    .single();

  if (error || !data) return NextResponse.json({ error: "Unable to save your Message Score." }, { status: 500 });

  return NextResponse.json({
    resultId: data.id,
    slug: data.slug,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });
}
