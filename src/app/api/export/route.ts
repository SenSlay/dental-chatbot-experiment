import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api/json";
import { parseExperimentResultFilters } from "@/lib/api/query";
import { listExperimentResults } from "@/lib/experiment/queries";
import { resultsToCsv } from "@/lib/export/resultsToCsv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function sanitizeCsvFilePart(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "experiment";
}

export function getExportFilename(
  filters: ReturnType<typeof parseExperimentResultFilters>,
  results: Awaited<ReturnType<typeof listExperimentResults>>,
): string {
  if (filters.experimentRunId && results.items.length > 0) {
    const runName = results.items[0].experimentRun.name;
    return `${sanitizeCsvFilePart(runName)}-${filters.experimentRunId}.csv`;
  }

  if (filters.experimentRunId) {
    return `experiment-${filters.experimentRunId}.csv`;
  }

  return "experiment-results-filtered.csv";
}

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
    const filename = getExportFilename(filters, results);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
