import { loadKb } from "../src/lib/data/loadKb";
import { loadOrCreateKbEmbeddings } from "../src/lib/rag/embedKb";
import { KB_SIZES } from "../src/types/kb";

async function main() {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error("OPENAI_API_KEY is required to prepare embedding caches.");
  }

  for (const kbSize of KB_SIZES) {
    const kb = await loadKb(kbSize);
    const dataset = await loadOrCreateKbEmbeddings(kb, kbSize);
    console.log(
      `Prepared kb_${kbSize} embeddings (${dataset.entries.length} entries, ${dataset.embeddingModel})`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
