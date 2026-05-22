import { buildRagInput } from "../src/lib/prompts/ragPrompt";
import { cosineSimilarity } from "../src/lib/rag/cosineSimilarity";
import { retrieveTopK } from "../src/lib/rag/retrieveTopK";
import type { ConversationTurn } from "../src/types/conversation";
import type { EmbeddedKbEntry, RetrievedKbEntry } from "../src/types/rag";

function assertClose(actual: number, expected: number, label: string): void {
  if (Math.abs(actual - expected) > 0.000001) {
    throw new Error(`${label}: expected ${expected}, found ${actual}`);
  }
}

function assertIncludes(text: string, expected: string): void {
  if (!text.includes(expected)) {
    throw new Error(`Expected RAG prompt to include: ${expected}`);
  }
}

function assertExcludes(text: string, unexpected: string): void {
  if (text.includes(unexpected)) {
    throw new Error(`Expected RAG prompt to exclude: ${unexpected}`);
  }
}

function makeEmbeddedEntry(
  index: number,
  id: string,
  title: string,
  embedding: number[],
): EmbeddedKbEntry {
  return {
    index,
    id,
    sourceType: "faq",
    title,
    text: `ID: ${id}\nQuestion: ${title}\nAnswer: Test answer for ${title}.`,
    textHash: `hash-${id}`,
    embedding,
  };
}

function validateCosineSimilarity(): void {
  assertClose(cosineSimilarity([1, 0], [1, 0]), 1, "same direction");
  assertClose(cosineSimilarity([1, 0], [0, 1]), 0, "orthogonal");
  assertClose(cosineSimilarity([1, 0], [-1, 0]), -1, "opposite direction");
  assertClose(cosineSimilarity([0, 0], [1, 1]), 0, "zero vector");
}

function validateRetrieveTopK(): RetrievedKbEntry[] {
  const entries = [
    makeEmbeddedEntry(0, "faq_001", "First tied item", [1, 0]),
    makeEmbeddedEntry(1, "faq_002", "Second tied item", [1, 0]),
    makeEmbeddedEntry(2, "faq_003", "Less similar item", [0, 1]),
  ];
  const retrieved = retrieveTopK([1, 0], entries, 2);

  if (retrieved.length !== 2) {
    throw new Error(`Expected 2 retrieved entries, found ${retrieved.length}`);
  }

  if (retrieved[0].id !== "faq_001" || retrieved[1].id !== "faq_002") {
    throw new Error("Expected stable top-k tie break by original KB order.");
  }

  return retrieved;
}

function validateRagPrompt(retrievedEntries: RetrievedKbEntry[]): void {
  const conversationHistory: ConversationTurn[] = [
    {
      userMessage: "Do you offer cleaning?",
      assistantResponse: "Yes, based on the retrieved knowledge context.",
    },
  ];
  const userMessage = "How much is it?";
  const prompt = buildRagInput({
    retrievedEntries,
    conversationHistory,
    userMessage,
  });

  assertIncludes(prompt, "# RAG Input");
  assertIncludes(prompt, "## Retrieved Knowledge Context");
  assertIncludes(prompt, "Retrieved Entry 1");
  assertIncludes(prompt, "Similarity:");
  assertIncludes(prompt, "## Conversation History");
  assertIncludes(prompt, conversationHistory[0].userMessage);
  assertIncludes(prompt, conversationHistory[0].assistantResponse);
  assertIncludes(prompt, "## Current User Message");
  assertIncludes(prompt, userMessage);
  assertExcludes(prompt, "## FAQs");
  assertExcludes(prompt, "## Offerings");
  assertExcludes(prompt, "## Policies");
  assertExcludes(prompt, "## Dentist Profiles");
}

function main() {
  validateCosineSimilarity();
  const retrievedEntries = validateRetrieveTopK();
  validateRagPrompt(retrievedEntries);
  console.log("Validated RAG retrieval and prompt construction");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
