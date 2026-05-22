import type { ResponseUsage } from "openai/resources/responses/responses";
import type { ResponseTokenUsage } from "./types";

export function mapResponseUsage(usage: ResponseUsage | null | undefined): ResponseTokenUsage {
  if (!usage) {
    throw new Error("OpenAI response did not include token usage.");
  }

  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    totalTokens: usage.total_tokens,
  };
}
