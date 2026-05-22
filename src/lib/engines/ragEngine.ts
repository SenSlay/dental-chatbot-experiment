import { embedText, getEmbeddingModel } from "@/lib/openai/embeddings";
import { generateResponse } from "@/lib/openai/generateResponse";
import { buildRagInput } from "@/lib/prompts/ragPrompt";
import { DENTAL_ASSISTANT_SYSTEM_PROMPT } from "@/lib/prompts/systemPrompt";
import { loadOrCreateKbEmbeddings } from "@/lib/rag/embedKb";
import { retrieveTopK } from "@/lib/rag/retrieveTopK";
import type { RagEngineInput, RagEngineResult } from "@/types/rag";

function getRagTopK(defaultValue = 5): number {
  const raw = process.env.RAG_TOP_K?.trim();

  if (!raw) {
    return defaultValue;
  }

  const topK = Number(raw);

  if (!Number.isInteger(topK) || topK <= 0) {
    throw new Error(`RAG_TOP_K must be a positive integer: ${raw}`);
  }

  return topK;
}

export async function runRagEngine({
  kb,
  kbSize,
  conversationHistory,
  userMessage,
  topK,
  model,
  temperature,
  maxOutputTokens,
}: RagEngineInput): Promise<RagEngineResult> {
  const embeddingModel = getEmbeddingModel();
  const embeddedKb = await loadOrCreateKbEmbeddings(kb, kbSize, {
    embeddingModel,
  });
  const queryEmbedding = await embedText(userMessage, embeddingModel);
  const retrievedContext = retrieveTopK(
    queryEmbedding,
    embeddedKb.entries,
    topK ?? getRagTopK(),
  );
  const input = buildRagInput({
    retrievedEntries: retrievedContext,
    conversationHistory,
    userMessage,
  });
  const response = await generateResponse({
    instructions: DENTAL_ASSISTANT_SYSTEM_PROMPT,
    input,
    model,
    temperature,
    maxOutputTokens,
  });

  return {
    ...response,
    retrievedContext,
  };
}
