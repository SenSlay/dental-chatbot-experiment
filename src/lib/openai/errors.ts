import OpenAI from "openai";

export function formatOpenAIError(error: unknown): string {
  if (error instanceof OpenAI.APIError) {
    const parts = [
      `OpenAI API error ${error.status ?? "unknown"}`,
      error.code ? `code=${error.code}` : null,
      error.message,
    ].filter(Boolean);

    return parts.join(": ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
