import type { NextRequest } from "next/server";
import { dataResponse, errorResponse } from "@/lib/api/json";
import { parseExperimentRunFilters } from "@/lib/api/query";
import { listExperimentRuns } from "@/lib/experiment/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let filters: ReturnType<typeof parseExperimentRunFilters>;

  try {
    filters = parseExperimentRunFilters(request.nextUrl.searchParams);
  } catch (error) {
    return errorResponse(error, { status: 400 });
  }

  try {
    const runs = await listExperimentRuns(filters);
    return dataResponse(runs);
  } catch (error) {
    return errorResponse(error);
  }
}
