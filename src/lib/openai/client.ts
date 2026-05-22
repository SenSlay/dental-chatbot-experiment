import OpenAI from "openai";
import type { OpenAISettings } from "./types";

let openAIClient: OpenAI | null = null;

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readNumberEnv(name: string): number {
  const value = readRequiredEnv(name);
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric environment variable ${name}: ${value}`);
  }

  return parsed;
}

export function getOpenAISettings(): OpenAISettings {
  const temperature = readNumberEnv("EXPERIMENT_TEMPERATURE");
  const maxOutputTokens = readNumberEnv("EXPERIMENT_MAX_OUTPUT_TOKENS");

  if (temperature < 0 || temperature > 2) {
    throw new Error("EXPERIMENT_TEMPERATURE must be between 0 and 2.");
  }

  if (!Number.isInteger(maxOutputTokens) || maxOutputTokens <= 0) {
    throw new Error("EXPERIMENT_MAX_OUTPUT_TOKENS must be a positive integer.");
  }

  return {
    apiKey: readRequiredEnv("OPENAI_API_KEY"),
    responseModel: readRequiredEnv("OPENAI_RESPONSE_MODEL"),
    temperature,
    maxOutputTokens,
  };
}

export function getOpenAIClient(): OpenAI {
  if (openAIClient) {
    return openAIClient;
  }

  const settings = getOpenAISettings();
  openAIClient = new OpenAI({ apiKey: settings.apiKey });

  return openAIClient;
}
