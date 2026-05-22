import type { NextRequest } from "next/server";
import { dataResponse, errorResponse } from "@/lib/api/json";
import { parseExperimentResultFilters } from "@/lib/api/query";
import { listExperimentResults } from "@/lib/experiment/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let filters: ReturnType<typeof parseExperimentResultFilters>;

  try {
    filters = parseExperimentResultFilters(request.nextUrl.searchParams, {
      includePagination: true,
    });
  } catch (error) {
    return errorResponse(error, { status: 400 });
  }

  try {
    const results = await listExperimentResults(filters);
    return dataResponse(results);
  } catch (error) {
    return errorResponse(error);
  }
}
