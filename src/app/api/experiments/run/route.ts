import type { NextRequest } from "next/server";
import { dataResponse, errorResponse } from "@/lib/api/json";
import { parseRunRequestBody } from "@/lib/api/query";
import { runExperiment } from "@/lib/experiment/runExperiment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", { status: 400 });
  }

  let input: ReturnType<typeof parseRunRequestBody>;

  try {
    input = parseRunRequestBody(body);
  } catch (error) {
    return errorResponse(error, { status: 400 });
  }

  try {
    const result = await runExperiment({
      ...input,
      throwOnFailure: false,
    });

    return dataResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
