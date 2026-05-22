import type { NextRequest } from "next/server";
import { dataResponse, errorResponse } from "@/lib/api/json";
import { parseFinalAnalysisBody } from "@/lib/api/query";
import { markFinalAnalysisRun } from "@/lib/experiment/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", { status: 400 });
  }

  let experimentRunId: string;

  try {
    experimentRunId = parseFinalAnalysisBody(body);
  } catch (error) {
    return errorResponse(error, { status: 400 });
  }

  try {
    const run = await markFinalAnalysisRun(experimentRunId);
    return dataResponse(run);
  } catch (error) {
    return errorResponse(error, { status: 400 });
  }
}
