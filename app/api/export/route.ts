import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let tenantId = req.nextUrl.searchParams.get("tenant_id");
  // default tenant id used in local/dev DB schema when none is provided
  if (!tenantId) {
    tenantId = '00000000-0000-0000-0000-000000000000';
  }

  const { data, error } = await supabase
    .from("retrieval_events")
    .select("id, tenant_id, user_id, concept_id, correct, response_time, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const headers = ["id", "tenant_id", "user_id", "concept_id", "correct", "response_time", "created_at"];
  const rows = (data ?? []).map((row) =>
    headers.map((h) => {
      const val = row[h as keyof typeof row];
      return val === null || val === undefined ? "" : String(val);
    }).join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=retrieval_events.csv",
    },
  });
}
