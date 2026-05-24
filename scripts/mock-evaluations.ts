import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { csvEscape, csvRowsToObjects, parseCsv } from "../src/lib/analysis/csv";
import {
  EVALUATOR_PROCESS_COLUMNS,
  REQUIRED_ORIGINAL_COLUMNS,
  REQUIRED_CONSENSUS_COLUMNS,
} from "../src/lib/analysis/evaluatedCsv";

const EVALUATION_COLUMNS = [
  ...EVALUATOR_PROCESS_COLUMNS,
  ...REQUIRED_CONSENSUS_COLUMNS,
] as const;

const MOCK_NOTE = "Mock evaluation for workflow testing only.";

type CliOptions = {
  inputPath: string;
  outputPath: string | null;
  seed: number | null;
};

function usage(): string {
  return [
    "Usage:",
    "  npm run mock:evaluations -- <export.csv> [output.csv] [--seed=123]",
    "",
    "Creates a separate .mock-evaluated.csv file with fake evaluation scores.",
    "Use this only to test the analysis workflow, never for thesis results.",
  ].join("\n");
}

function parseArgs(args: string[]): CliOptions {
  const positional: string[] = [];
  let seed: number | null = null;

  args.forEach((arg) => {
    if (arg.startsWith("--seed=")) {
      const parsed = Number(arg.slice("--seed=".length));

      if (!Number.isInteger(parsed)) {
        throw new Error("--seed must be an integer");
      }

      seed = parsed;
      return;
    }

    positional.push(arg);
  });

  if (positional.length < 1 || positional.length > 2) {
    throw new Error(usage());
  }

  return {
    inputPath: positional[0],
    outputPath: positional[1] ?? null,
    seed,
  };
}

function defaultOutputPath(inputPath: string): string {
  const parsed = path.parse(inputPath);
  return path.join(parsed.dir, `${parsed.name}.mock-evaluated${parsed.ext || ".csv"}`);
}

function hashText(text: string): number {
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = Math.imul(state, 1664525) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
}

function weightedScore(random: () => number): string {
  const roll = random();

  if (roll < 0.2) {
    return "0";
  }

  if (roll < 0.55) {
    return "1";
  }

  return "2";
}

function parseBoolean(value: string | undefined): boolean {
  const normalized = (value ?? "").trim().toLowerCase();
  return ["true", "yes", "1"].includes(normalized);
}

function consensusScore(first: string, second: string): string {
  return String(Math.round((Number(first) + Number(second)) / 2));
}

function serializeRows(headers: string[], rows: Record<string, string>[]): string {
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(",")),
  ].join("\n");
}

function missingColumns(headers: string[], columns: readonly string[]): string[] {
  const headerSet = new Set(headers);
  return columns.filter((column) => !headerSet.has(column));
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const inputText = await readFile(options.inputPath, "utf8");
  const parsedRows = parseCsv(inputText);

  if (parsedRows.length === 0) {
    throw new Error(`CSV has no rows: ${options.inputPath}`);
  }

  const headers = parsedRows[0].map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, "") : header,
  );
  const missingEvaluationColumns = EVALUATION_COLUMNS.filter(
    (column) => !headers.includes(column),
  );
  const missingSourceColumns = missingColumns(headers, REQUIRED_ORIGINAL_COLUMNS);

  if (missingSourceColumns.length > 0) {
    throw new Error(
      [
        `CSV does not look like an experiment export: ${options.inputPath}`,
        `Missing required source columns: ${missingSourceColumns.join(", ")}`,
      ].join("\n"),
    );
  }

  const outputHeaders = [...headers, ...missingEvaluationColumns];
  const rows = csvRowsToObjects(parsedRows);
  const seed =
    options.seed ?? hashText(`${path.resolve(options.inputPath)}\n${inputText}`);
  const random = createRandom(seed);

  const outputRows = rows.map((row) => {
    const isMultiTurn = parseBoolean(row.isMultiTurn);
    const evaluator1AccuracyScore = weightedScore(random);
    const evaluator2AccuracyScore = weightedScore(random);
    const evaluator1Hallucination = random() < 0.2 ? "true" : "false";
    const evaluator2Hallucination = random() < 0.2 ? "true" : "false";
    const evaluator1ContextRetentionScore = isMultiTurn ? weightedScore(random) : "";
    const evaluator2ContextRetentionScore = isMultiTurn ? weightedScore(random) : "";
    const consensusContextRetentionScore = isMultiTurn
      ? consensusScore(evaluator1ContextRetentionScore, evaluator2ContextRetentionScore)
      : "";

    return {
      ...row,
      evaluator1AccuracyScore,
      evaluator1Hallucination,
      evaluator1ContextRetentionScore,
      evaluator1Notes: MOCK_NOTE,
      evaluator2AccuracyScore,
      evaluator2Hallucination,
      evaluator2ContextRetentionScore,
      evaluator2Notes: MOCK_NOTE,
      consensusAccuracyScore: consensusScore(
        evaluator1AccuracyScore,
        evaluator2AccuracyScore,
      ),
      consensusHallucination:
        evaluator1Hallucination === "true" || evaluator2Hallucination === "true"
          ? "true"
          : "false",
      consensusContextRetentionScore,
      consensusNotes: MOCK_NOTE,
    };
  });
  const outputPath = options.outputPath ?? defaultOutputPath(options.inputPath);
  const inputAbsolutePath = path.resolve(options.inputPath);
  const outputAbsolutePath = path.resolve(outputPath);

  if (inputAbsolutePath === outputAbsolutePath) {
    throw new Error(
      "Refusing to overwrite the input CSV. Choose a different output path or omit it.",
    );
  }

  await writeFile(outputPath, `${serializeRows(outputHeaders, outputRows)}\n`, "utf8");

  console.log(`Wrote mock evaluated CSV: ${outputPath}`);
  console.log(`Rows: ${outputRows.length}`);
  console.log(`Seed: ${seed}`);
  console.log("Use this file only for workflow testing, not thesis analysis.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
