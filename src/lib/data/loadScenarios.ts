import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Scenario } from "@/types/scenario";
import { validateScenarioDataset } from "./validateDataset";

export function getScenariosFilePath(): string {
  return path.join(process.cwd(), "data", "scenarios", "scenarios.json");
}

export async function loadScenarios(): Promise<Scenario[]> {
  const filePath = getScenariosFilePath();
  let raw: string;

  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[${filePath}] failed to read scenarios file: ${message}`);
  }

  let data: unknown;

  try {
    data = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[${filePath}] failed to parse JSON: ${message}`);
  }

  return validateScenarioDataset(data, { filePath });
}
