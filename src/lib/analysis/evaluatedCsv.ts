import { csvRowsToObjects, objectsToCsv, parseCsv } from "./csv";
import type { CsvRow } from "./csv";

export const REQUIRED_ORIGINAL_COLUMNS = [
  "runId",
  "runName",
  "runType",
  "isFinalAnalysis",
  "scenarioId",
  "scenarioCategory",
  "inputType",
  "isMultiTurn",
  "turnNumber",
  "technique",
  "kbSize",
  "latencyMs",
  "inputTokens",
  "outputTokens",
  "totalTokens",
] as const;

export const REQUIRED_CONSENSUS_COLUMNS = [
  "consensusAccuracyScore",
  "consensusHallucination",
  "consensusContextRetentionScore",
  "consensusNotes",
] as const;

export const EVALUATOR_PROCESS_COLUMNS = [
  "evaluator1AccuracyScore",
  "evaluator1Hallucination",
  "evaluator1ContextRetentionScore",
  "evaluator1Notes",
  "evaluator2AccuracyScore",
  "evaluator2Hallucination",
  "evaluator2ContextRetentionScore",
  "evaluator2Notes",
] as const;

const AGGREGATE_TABLES = [
  {
    table: "Overall",
    group: (_row: ScoredEvaluationRow) => "All evaluated responses",
  },
  {
    table: "By Technique",
    group: (row: ScoredEvaluationRow) => row.technique,
  },
  {
    table: "By Technique and KB Size",
    group: (row: ScoredEvaluationRow) => `${row.technique} / KB ${row.kbSize}`,
  },
  {
    table: "By Technique and Input Type",
    group: (row: ScoredEvaluationRow) => `${row.technique} / ${row.inputType}`,
  },
  {
    table: "By Technique and Scenario Category",
    group: (row: ScoredEvaluationRow) => `${row.technique} / ${row.scenarioCategory}`,
  },
  {
    table: "By Technique and Scenario Type",
    group: (row: ScoredEvaluationRow) =>
      `${row.technique} / ${row.isMultiTurn ? "Multi-turn" : "Single-turn"}`,
  },
] as const;

const COMPARISON_TABLES = [
  {
    table: "Overall",
    group: (_row: ScoredEvaluationRow) => "All evaluated responses",
  },
  {
    table: "By KB Size",
    group: (row: ScoredEvaluationRow) => `KB ${row.kbSize}`,
  },
  {
    table: "By Input Type",
    group: (row: ScoredEvaluationRow) => row.inputType,
  },
  {
    table: "By Scenario Category",
    group: (row: ScoredEvaluationRow) => row.scenarioCategory,
  },
  {
    table: "By Scenario Type",
    group: (row: ScoredEvaluationRow) =>
      row.isMultiTurn ? "Multi-turn" : "Single-turn",
  },
] as const;

export type ScoredEvaluationRow = {
  raw: CsvRow;
  runId: string;
  runName: string;
  runType: string;
  isFinalAnalysis: boolean;
  scenarioId: string;
  scenarioCategory: string;
  inputType: string;
  isMultiTurn: boolean;
  turnNumber: number | null;
  technique: string;
  kbSize: string;
  latencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  accuracyScore: number;
  hallucination: boolean;
  contextRetentionScore: number | null;
};

export type AggregateRow = {
  table: string;
  group: string;
  responseCount: number;
  averageAccuracyScore: number;
  accuracyPercent: number;
  hallucinationRate: number;
  averageContextRetentionScore: number | null;
  contextRetentionPercent: number | null;
  averageLatencyMs: number | null;
  averageInputTokens: number | null;
  averageOutputTokens: number | null;
  averageTotalTokens: number | null;
};

export type ComparisonRow = {
  table: string;
  group: string;
  promptEngineeringCount: number;
  ragCount: number;
  promptEngineeringAccuracyPercent: number | null;
  ragAccuracyPercent: number | null;
  accuracyDifference: number | null;
  promptEngineeringHallucinationRate: number | null;
  ragHallucinationRate: number | null;
  hallucinationRateDifference: number | null;
  promptEngineeringAverageLatencyMs: number | null;
  ragAverageLatencyMs: number | null;
  latencyDifferenceMs: number | null;
  promptEngineeringAverageTotalTokens: number | null;
  ragAverageTotalTokens: number | null;
  totalTokensDifference: number | null;
};

export type AnalysisResult = {
  rowCount: number;
  scoredRowCount: number;
  invalidScoreCount: number;
  runIds: string[];
  hasFinalAnalysisRun: boolean;
  warnings: string[];
  errors: string[];
  scoredRows: ScoredEvaluationRow[];
  aggregateRows: AggregateRow[];
  comparisonRows: ComparisonRow[];
};

function parseNumber(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();

  if (["true", "yes", "1"].includes(normalized)) {
    return true;
  }

  if (["false", "no", "0"].includes(normalized)) {
    return false;
  }

  return null;
}

function parseScore(value: string, allowedBlank: boolean): number | null | "invalid" {
  const normalized = value.trim().toLowerCase();

  if (!normalized || normalized === "n/a" || normalized === "null") {
    return allowedBlank ? null : "invalid";
  }

  const parsed = Number(normalized);

  if ([0, 1, 2].includes(parsed)) {
    return parsed;
  }

  return "invalid";
}

function missingColumns(headers: string[], columns: readonly string[]): string[] {
  const headerSet = new Set(headers);
  return columns.filter((column) => !headerSet.has(column));
}

function average(values: Array<number | null>): number | null {
  const numericValues = values.filter((value): value is number => value != null);

  if (numericValues.length === 0) {
    return null;
  }

  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
}

function roundMetric(value: number | null): number | null {
  if (value == null) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

function computeAggregate(
  table: string,
  group: string,
  rows: ScoredEvaluationRow[],
): AggregateRow {
  const contextRows = rows.filter((row) => row.contextRetentionScore != null);
  const accuracySum = rows.reduce((sum, row) => sum + row.accuracyScore, 0);
  const hallucinationCount = rows.filter((row) => row.hallucination).length;
  const contextSum = contextRows.reduce(
    (sum, row) => sum + (row.contextRetentionScore ?? 0),
    0,
  );

  return {
    table,
    group,
    responseCount: rows.length,
    averageAccuracyScore: roundMetric(accuracySum / rows.length) ?? 0,
    accuracyPercent: roundMetric((accuracySum / (rows.length * 2)) * 100) ?? 0,
    hallucinationRate:
      roundMetric((hallucinationCount / rows.length) * 100) ?? 0,
    averageContextRetentionScore:
      contextRows.length > 0 ? roundMetric(contextSum / contextRows.length) : null,
    contextRetentionPercent:
      contextRows.length > 0
        ? roundMetric((contextSum / (contextRows.length * 2)) * 100)
        : null,
    averageLatencyMs: roundMetric(average(rows.map((row) => row.latencyMs))),
    averageInputTokens: roundMetric(average(rows.map((row) => row.inputTokens))),
    averageOutputTokens: roundMetric(average(rows.map((row) => row.outputTokens))),
    averageTotalTokens: roundMetric(average(rows.map((row) => row.totalTokens))),
  };
}

function buildAggregateRows(rows: ScoredEvaluationRow[]): AggregateRow[] {
  return AGGREGATE_TABLES.flatMap(({ table, group }) => {
    const groups = new Map<string, ScoredEvaluationRow[]>();

    rows.forEach((row) => {
      const groupName = group(row);
      groups.set(groupName, [...(groups.get(groupName) ?? []), row]);
    });

    return [...groups.entries()].map(([groupName, groupRows]) =>
      computeAggregate(table, groupName, groupRows),
    );
  });
}

function delta(ragValue: number | null, peValue: number | null): number | null {
  if (ragValue == null || peValue == null) {
    return null;
  }

  return roundMetric(ragValue - peValue);
}

function buildComparisonRows(rows: ScoredEvaluationRow[]): ComparisonRow[] {
  const comparisonRows: ComparisonRow[] = [];

  COMPARISON_TABLES.forEach(({ table, group }) => {
    const groups = new Map<string, ScoredEvaluationRow[]>();

    rows.forEach((row) => {
      const groupName = group(row);
      groups.set(groupName, [...(groups.get(groupName) ?? []), row]);
    });

    [...groups.entries()].forEach(([groupName, groupRows]) => {
      const peRows = groupRows.filter((row) => row.technique === "PROMPT_ENGINEERING");
      const ragRows = groupRows.filter((row) => row.technique === "RAG");

      if (peRows.length === 0 || ragRows.length === 0) {
        return;
      }

      const pe = computeAggregate(table, groupName, peRows);
      const rag = computeAggregate(table, groupName, ragRows);

      comparisonRows.push({
        table,
        group: groupName,
        promptEngineeringCount: pe.responseCount,
        ragCount: rag.responseCount,
        promptEngineeringAccuracyPercent: pe.accuracyPercent,
        ragAccuracyPercent: rag.accuracyPercent,
        accuracyDifference: delta(rag.accuracyPercent, pe.accuracyPercent),
        promptEngineeringHallucinationRate: pe.hallucinationRate,
        ragHallucinationRate: rag.hallucinationRate,
        hallucinationRateDifference: delta(
          rag.hallucinationRate,
          pe.hallucinationRate,
        ),
        promptEngineeringAverageLatencyMs: pe.averageLatencyMs,
        ragAverageLatencyMs: rag.averageLatencyMs,
        latencyDifferenceMs: delta(rag.averageLatencyMs, pe.averageLatencyMs),
        promptEngineeringAverageTotalTokens: pe.averageTotalTokens,
        ragAverageTotalTokens: rag.averageTotalTokens,
        totalTokensDifference: delta(rag.averageTotalTokens, pe.averageTotalTokens),
      });
    });
  });

  return comparisonRows;
}

function parseScoredRow(row: CsvRow): ScoredEvaluationRow | null {
  const accuracyScore = parseScore(row.consensusAccuracyScore ?? "", false);
  const hallucination = parseBoolean(row.consensusHallucination ?? "");
  const contextRetentionScore = parseScore(
    row.consensusContextRetentionScore ?? "",
    true,
  );
  const isMultiTurn = parseBoolean(row.isMultiTurn) ?? false;

  if (
    accuracyScore === "invalid" ||
    accuracyScore == null ||
    hallucination == null ||
    contextRetentionScore === "invalid" ||
    (isMultiTurn && contextRetentionScore == null)
  ) {
    return null;
  }

  return {
    raw: row,
    runId: row.runId,
    runName: row.runName,
    runType: row.runType,
    isFinalAnalysis: parseBoolean(row.isFinalAnalysis) ?? false,
    scenarioId: row.scenarioId,
    scenarioCategory: row.scenarioCategory,
    inputType: row.inputType,
    isMultiTurn,
    turnNumber: parseNumber(row.turnNumber),
    technique: row.technique,
    kbSize: row.kbSize,
    latencyMs: parseNumber(row.latencyMs),
    inputTokens: parseNumber(row.inputTokens),
    outputTokens: parseNumber(row.outputTokens),
    totalTokens: parseNumber(row.totalTokens),
    accuracyScore,
    hallucination,
    contextRetentionScore,
  };
}

export function analyzeEvaluatedCsv(text: string): AnalysisResult {
  const parsedRows = parseCsv(text);
  const headers = parsedRows[0] ?? [];
  const rows = csvRowsToObjects(parsedRows);
  const errors = [
    ...missingColumns(headers, REQUIRED_ORIGINAL_COLUMNS).map(
      (column) => `Missing required source column: ${column}`,
    ),
    ...missingColumns(headers, REQUIRED_CONSENSUS_COLUMNS).map(
      (column) => `Missing required consensus column: ${column}`,
    ),
  ];
  const warnings = missingColumns(headers, EVALUATOR_PROCESS_COLUMNS).map(
    (column) => `Missing evaluator-process column: ${column}`,
  );

  if (errors.length > 0) {
    return {
      rowCount: rows.length,
      scoredRowCount: 0,
      invalidScoreCount: rows.length,
      runIds: [],
      hasFinalAnalysisRun: false,
      warnings,
      errors,
      scoredRows: [],
      aggregateRows: [],
      comparisonRows: [],
    };
  }

  const scoredRows = rows
    .map(parseScoredRow)
    .filter((row): row is ScoredEvaluationRow => row != null);
  const runIds = [...new Set(rows.map((row) => row.runId).filter(Boolean))];
  const hasFinalAnalysisRun = rows.some(
    (row) => parseBoolean(row.isFinalAnalysis) === true,
  );

  if (runIds.length > 1) {
    warnings.push(`Imported CSV contains multiple run IDs: ${runIds.join(", ")}`);
  }

  if (!hasFinalAnalysisRun) {
    warnings.push("Imported CSV does not contain a final-analysis run marker.");
  }

  return {
    rowCount: rows.length,
    scoredRowCount: scoredRows.length,
    invalidScoreCount: rows.length - scoredRows.length,
    runIds,
    hasFinalAnalysisRun,
    warnings,
    errors,
    scoredRows,
    aggregateRows: buildAggregateRows(scoredRows),
    comparisonRows: buildComparisonRows(scoredRows),
  };
}

export function aggregateRowsToCsv(rows: AggregateRow[]): string {
  return objectsToCsv(rows.map((row) => stringifyRecord(row)));
}

export function comparisonRowsToCsv(rows: ComparisonRow[]): string {
  return objectsToCsv(rows.map((row) => stringifyRecord(row)));
}

function stringifyRecord(record: Record<string, unknown>): CsvRow {
  return Object.entries(record).reduce<CsvRow>((row, [key, value]) => {
    row[key] = value == null ? "" : String(value);
    return row;
  }, {});
}
