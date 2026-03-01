import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let tenantId = req.nextUrl.searchParams.get("tenant_id");
  // default tenant id used in local/dev DB schema when none is provided
  if (!tenantId) {
    tenantId = '00000000-0000-0000-0000-000000000000';
  }

  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const since72h = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();

  const { data: events, error } = await supabase
    .from("retrieval_events")
    .select("user_id, correct, created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", since72h)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group events by user
  const userMap = new Map<string, { correct: boolean; created_at: string }[]>();
  for (const event of events ?? []) {
    if (!userMap.has(event.user_id)) userMap.set(event.user_id, []);
    userMap.get(event.user_id)!.push(event);
  }

  const stats = Array.from(userMap.entries()).map(([userId, userEvents]) => {
    const events24h = userEvents.filter((e) => e.created_at >= since24h);
    const events72h = userEvents;

    const retention24h =
      events24h.length > 0
        ? events24h.filter((e) => e.correct).length / events24h.length
        : null;

    const retention72h =
      events72h.length > 0
        ? events72h.filter((e) => e.correct).length / events72h.length
        : null;

    return {
      user_id: userId,
      retention_24h:
        retention24h !== null
          ? `${(retention24h * 100).toFixed(1)}%`
          : "no data",
      retention_72h:
        retention72h !== null
          ? `${(retention72h * 100).toFixed(1)}%`
          : "no data",
      total_reviews_24h: events24h.length,
      total_reviews_72h: events72h.length,
    };
  });

  return NextResponse.json({ stats });
}
