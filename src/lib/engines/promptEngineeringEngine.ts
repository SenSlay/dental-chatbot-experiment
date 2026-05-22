import type { KnowledgeBase } from "@/types/kb";
import type { ConversationTurn } from "@/types/conversation";
import { generateResponse } from "@/lib/openai/generateResponse";
import type { GeneratedResponse } from "@/lib/openai/types";
import { buildPromptEngineeringInput } from "@/lib/prompts/promptEngineeringPrompt";
import { DENTAL_ASSISTANT_SYSTEM_PROMPT } from "@/lib/prompts/systemPrompt";

export type PromptEngineeringEngineInput = {
  kb: KnowledgeBase;
  conversationHistory: ConversationTurn[];
  userMessage: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

export type PromptEngineeringEngineResult = GeneratedResponse;

export async function runPromptEngineeringEngine({
  kb,
  conversationHistory,
  userMessage,
  model,
  temperature,
  maxOutputTokens,
}: PromptEngineeringEngineInput): Promise<PromptEngineeringEngineResult> {
  const input = buildPromptEngineeringInput({
    kb,
    conversationHistory,
    userMessage,
  });

  return generateResponse({
    instructions: DENTAL_ASSISTANT_SYSTEM_PROMPT,
    input,
    model,
    temperature,
    maxOutputTokens,
  });
}
