import { readFile } from "node:fs/promises";
import path from "node:path";
import type { KbSize, KnowledgeBase } from "@/types/kb";
import { validateKbDataset } from "./validateDataset";

const KB_FILE_BY_SIZE: Record<KbSize, string> = {
  30: "kb_30.json",
  100: "kb_100.json",
  300: "kb_300.json",
};

export function getKbFilePath(kbSize: KbSize): string {
  return path.join(process.cwd(), "data", "kb", KB_FILE_BY_SIZE[kbSize]);
}

export async function loadKb(kbSize: KbSize): Promise<KnowledgeBase> {
  const filePath = getKbFilePath(kbSize);
  let raw: string;

  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[${filePath}] failed to read KB file: ${message}`);
  }

  let data: unknown;

  try {
    data = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[${filePath}] failed to parse JSON: ${message}`);
  }

  return validateKbDataset(data, { kbSize, filePath });
}
