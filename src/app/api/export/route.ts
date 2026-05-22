import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api/json";
import { parseExperimentResultFilters } from "@/lib/api/query";
import { listExperimentResults } from "@/lib/experiment/queries";
import { resultsToCsv } from "@/lib/export/resultsToCsv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let filters: ReturnType<typeof parseExperimentResultFilters>;

  try {
    filters = parseExperimentResultFilters(request.nextUrl.searchParams);
  } catch (error) {
    return errorResponse(error, { status: 400 });
  }

  try {
    const results = await listExperimentResults(filters);
    const csv = resultsToCsv(results.items);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="experiment-results.csv"',
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
