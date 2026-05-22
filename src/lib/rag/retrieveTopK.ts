import type { EmbeddedKbEntry, RetrievedKbEntry } from "@/types/rag";
import { cosineSimilarity } from "./cosineSimilarity";

export function retrieveTopK(
  queryEmbedding: number[],
  embeddedEntries: EmbeddedKbEntry[],
  topK: number,
): RetrievedKbEntry[] {
  if (!Number.isInteger(topK) || topK <= 0) {
    throw new Error("RAG topK must be a positive integer.");
  }

  return embeddedEntries
    .map((entry) => ({
      entry,
      similarity: cosineSimilarity(queryEmbedding, entry.embedding),
    }))
    .sort((a, b) => {
      if (b.similarity !== a.similarity) {
        return b.similarity - a.similarity;
      }

      return a.entry.index - b.entry.index;
    })
    .slice(0, topK)
    .map(({ entry, similarity }) => ({
      id: entry.id,
      sourceType: entry.sourceType,
      title: entry.title,
      text: entry.text,
      similarity,
    }));
}
