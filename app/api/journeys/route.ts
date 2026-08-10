import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyGuideCompleted } from "@/lib/notify";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const [guideEntriesResult, messageScoreResults] = await Promise.all([
    supabase
      .from("guide_journey_entries")
      .select("id, guide_id, answers, current_step, completed, created_at, updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("message_score_results")
      .select("id, slug, original_message, overall_score, created_at, updated_at")
      .order("updated_at", { ascending: false }),
  ]);

  if (guideEntriesResult.error || messageScoreResults.error) {
    return NextResponse.json({ error: "Unable to load journeys." }, { status: 500 });
  }

  const journeys = [
    ...(guideEntriesResult.data ?? []).map((row) => ({
      kind: "guide" as const,
      id: row.id,
      guideId: row.guide_id,
      answers: row.answers ?? [],
      currentStep: row.current_step,
      completed: row.completed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    ...(messageScoreResults.data ?? []).map((row) => ({
      kind: "message-score" as const,
      id: row.id,
      slug: row.slug,
      title: "Soul-Aligned Message Score",
      originalMessage: row.original_message,
      overallScore: row.overall_score,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return NextResponse.json({
    journeys,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = (await request.json()) as {
    guideId?: string;
    journeyId?: string;
    answers?: unknown;
    currentStep?: number;
    completed?: boolean;
  };

  if (!body.guideId || !Array.isArray(body.answers)) {
    return NextResponse.json({ error: "Invalid journey." }, { status: 400 });
  }

  const { data: guide } = await supabase
    .from("guides")
    .select("id, title, category, questions")
    .eq("id", body.guideId)
    .maybeSingle();

  if (!guide) {
    return NextResponse.json({ error: "Invalid journey." }, { status: 400 });
  }

  const answers = body.answers.slice(0, 4).map((answer) => String(answer).slice(0, 5000));
  while (answers.length < 4) answers.push("");
  const currentStep = Math.max(0, Math.min(3, Number(body.currentStep) || 0));
  const completed = Boolean(body.completed);
  const updatedAt = new Date().toISOString();

  let alreadyCompleted = false;
  if (body.journeyId) {
    const { data: existing } = await supabase
      .from("guide_journey_entries")
      .select("completed")
      .eq("id", body.journeyId)
      .maybeSingle();
    alreadyCompleted = existing?.completed === true;
  }

  async function notifyIfNewlyCompleted() {
    if (!completed || alreadyCompleted) return;
    const questions = (guide!.questions ?? []) as { question: string }[];
    const qa = answers.map((answer, index) => ({ question: questions[index]?.question ?? `Question ${index + 1}`, answer }));
    await notifyGuideCompleted(
      user!.email,
      user!.user_metadata?.full_name as string | undefined,
      guide!.title,
      guide!.category,
      qa,
    );
  }

  if (body.journeyId) {
    const { data, error } = await supabase
      .from("guide_journey_entries")
      .update({ answers, current_step: currentStep, completed, updated_at: updatedAt })
      .eq("id", body.journeyId)
      .select("id, created_at, updated_at")
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "Unable to save." }, { status: 500 });
    }

    await notifyIfNewlyCompleted();
    return NextResponse.json({ journeyId: data.id, createdAt: data.created_at, updatedAt: data.updated_at });
  }

  const { data, error } = await supabase
    .from("guide_journey_entries")
    .insert({
      user_id: user.id,
      guide_id: body.guideId,
      answers,
      current_step: currentStep,
      completed,
      updated_at: updatedAt,
    })
    .select("id, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Unable to save." }, { status: 500 });
  }

  await notifyIfNewlyCompleted();
  return NextResponse.json({ journeyId: data.id, createdAt: data.created_at, updatedAt: data.updated_at });
}
