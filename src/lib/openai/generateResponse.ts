import { getOpenAIClient, getOpenAISettings } from "./client";
import { formatOpenAIError } from "./errors";
import { mapResponseUsage } from "./usage";
import type { GeneratedResponse, GenerateResponseOptions } from "./types";

export async function generateResponse(
  options: GenerateResponseOptions,
): Promise<GeneratedResponse> {
  const settings = getOpenAISettings();
  const client = getOpenAIClient();

  try {
    const response = await client.responses.create({
      model: options.model ?? settings.responseModel,
      instructions: options.instructions,
      input: options.input,
      temperature: options.temperature ?? settings.temperature,
      max_output_tokens: options.maxOutputTokens ?? settings.maxOutputTokens,
      store: false,
    });

    const assistantResponse = response.output_text;

    if (!assistantResponse.trim()) {
      throw new Error(`OpenAI response ${response.id} did not include output text.`);
    }

    return {
      responseId: response.id,
      assistantResponse,
      ...mapResponseUsage(response.usage),
    };
  } catch (error) {
    throw new Error(formatOpenAIError(error));
  }
}
