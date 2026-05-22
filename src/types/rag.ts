import type { GeneratedResponse } from "@/lib/openai/types";
import type { ConversationTurn } from "./conversation";
import type { KbSize, KnowledgeBase } from "./kb";
import type { FlattenedKbSourceType } from "./kbFormatting";

export type EmbeddedKbEntry = {
  index: number;
  id: string;
  sourceType: FlattenedKbSourceType;
  title: string;
  text: string;
  textHash: string;
  embedding: number[];
};

export type EmbeddedKbDataset = {
  schemaVersion: number;
  kbSize: KbSize;
  embeddingModel: string;
  generatedAt: string;
  entries: EmbeddedKbEntry[];
};

export type RetrievedKbEntry = {
  id: string;
  sourceType: FlattenedKbSourceType;
  title: string;
  text: string;
  similarity: number;
};

export type RagEngineInput = {
  kb: KnowledgeBase;
  kbSize: KbSize;
  conversationHistory: ConversationTurn[];
  userMessage: string;
  topK?: number;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

export type RagEngineResult = GeneratedResponse & {
  retrievedContext: RetrievedKbEntry[];
};
