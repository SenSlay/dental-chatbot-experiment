import type { ResponseInput } from "openai/resources/responses/responses";

export type OpenAISettings = {
  apiKey: string;
  responseModel: string;
  temperature: number;
  maxOutputTokens: number;
};

export type GenerateResponseOptions = {
  instructions: string;
  input: string | ResponseInput;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

export type GeneratedResponse = {
  responseId: string;
  assistantResponse: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type ResponseTokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};
