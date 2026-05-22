import { NextResponse } from "next/server";

export type ApiErrorInit = {
  status?: number;
};

export function dataResponse<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data }, init);
}

export function errorResponse(
  error: unknown,
  init: ApiErrorInit = {},
): NextResponse {
  const status = init.status ?? 500;
  const rawMessage = error instanceof Error ? error.message : String(error);
  const message =
    status >= 500 ? "Unexpected API error." : rawMessage || "Unexpected API error.";

  if (status >= 500) {
    console.error(rawMessage || error);
  }

  return NextResponse.json(
    { error: message },
    { status },
  );
}
