import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { flattenKb } from "@/lib/kb/flattenKb";
import { embedTexts, getEmbeddingModel } from "@/lib/openai/embeddings";
import type { KbSize, KnowledgeBase } from "@/types/kb";
import type { EmbeddedKbDataset, EmbeddedKbEntry } from "@/types/rag";

const EMBEDDING_CACHE_SCHEMA_VERSION = 1;

type LoadOrCreateKbEmbeddingsOptions = {
  embeddingModel?: string;
};

function sanitizeFilePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function getEmbeddingCacheFilePath(
  kbSize: KbSize,
  embeddingModel: string,
): string {
  return path.join(
    process.cwd(),
    "data",
    "embeddings",
    `kb_${kbSize}_${sanitizeFilePart(embeddingModel)}.json`,
  );
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function buildExpectedEntries(kb: KnowledgeBase): Omit<EmbeddedKbEntry, "embedding">[] {
  return flattenKb(kb).map((entry, index) => ({
    index,
    id: entry.id,
    sourceType: entry.sourceType,
    title: entry.title,
    text: entry.text,
    textHash: hashText(entry.text),
  }));
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === "number");
}

function isValidCache(
  data: unknown,
  kbSize: KbSize,
  embeddingModel: string,
  expectedEntries: Omit<EmbeddedKbEntry, "embedding">[],
): data is EmbeddedKbDataset {
  if (!data || typeof data !== "object") {
    return false;
  }

  const dataset = data as Partial<EmbeddedKbDataset>;

  if (
    dataset.schemaVersion !== EMBEDDING_CACHE_SCHEMA_VERSION ||
    dataset.kbSize !== kbSize ||
    dataset.embeddingModel !== embeddingModel ||
    !Array.isArray(dataset.entries) ||
    dataset.entries.length !== expectedEntries.length
  ) {
    return false;
  }

  let embeddingLength: number | null = null;

  return dataset.entries.every((entry, index) => {
    const expected = expectedEntries[index];

    if (
      entry.index !== expected.index ||
      entry.id !== expected.id ||
      entry.sourceType !== expected.sourceType ||
      entry.title !== expected.title ||
      entry.text !== expected.text ||
      entry.textHash !== expected.textHash ||
      !isNumberArray(entry.embedding) ||
      entry.embedding.length === 0
    ) {
      return false;
    }

    embeddingLength ??= entry.embedding.length;
    return entry.embedding.length === embeddingLength;
  });
}

async function readCachedEmbeddings(
  filePath: string,
  kbSize: KbSize,
  embeddingModel: string,
  expectedEntries: Omit<EmbeddedKbEntry, "embedding">[],
): Promise<EmbeddedKbDataset | null> {
  let raw: string;

  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    return null;
  }

  try {
    const data: unknown = JSON.parse(raw);
    return isValidCache(data, kbSize, embeddingModel, expectedEntries) ? data : null;
  } catch {
    return null;
  }
}

export async function loadOrCreateKbEmbeddings(
  kb: KnowledgeBase,
  kbSize: KbSize,
  options: LoadOrCreateKbEmbeddingsOptions = {},
): Promise<EmbeddedKbDataset> {
  const embeddingModel = options.embeddingModel ?? getEmbeddingModel();
  const expectedEntries = buildExpectedEntries(kb);
  const filePath = getEmbeddingCacheFilePath(kbSize, embeddingModel);
  const cached = await readCachedEmbeddings(
    filePath,
    kbSize,
    embeddingModel,
    expectedEntries,
  );

  if (cached) {
    return cached;
  }

  const embeddings = await embedTexts(
    expectedEntries.map((entry) => entry.text),
    embeddingModel,
  );

  const dataset: EmbeddedKbDataset = {
    schemaVersion: EMBEDDING_CACHE_SCHEMA_VERSION,
    kbSize,
    embeddingModel,
    generatedAt: new Date().toISOString(),
    entries: expectedEntries.map((entry, index) => ({
      ...entry,
      embedding: embeddings[index],
    })),
  };

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");

  return dataset;
}
