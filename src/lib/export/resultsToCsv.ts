import type { ExperimentResultWithRun } from "@/lib/experiment/queries";

const CSV_HEADERS = [
  "runId",
  "runName",
  "runType",
  "runStatus",
  "isFinalAnalysis",
  "model",
  "embeddingModel",
  "ragTopK",
  "temperature",
  "maxOutputTokens",
  "scenarioId",
  "scenarioCategory",
  "inputType",
  "isMultiTurn",
  "turnNumber",
  "userMessage",
  "expectedBehavior",
  "assistantResponse",
  "technique",
  "kbSize",
  "latencyMs",
  "inputTokens",
  "outputTokens",
  "totalTokens",
  "retrievedContextJson",
  "error",
  "resultCreatedAt",
  "runCreatedAt",
  "runStartedAt",
  "runCompletedAt",
] as const;

function csvEscape(value: unknown): string {
  if (value == null) {
    return "";
  }

  const text = value instanceof Date ? value.toISOString() : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function jsonValue(value: unknown): string {
  if (value == null) {
    return "";
  }

  return JSON.stringify(value);
}

function rowToValues(row: ExperimentResultWithRun): unknown[] {
  return [
    row.experimentRun.id,
    row.experimentRun.name,
    row.experimentRun.runType,
    row.experimentRun.status,
    row.experimentRun.isFinalAnalysis,
    row.experimentRun.model,
    row.experimentRun.embeddingModel,
    row.experimentRun.ragTopK,
    row.experimentRun.temperature,
    row.experimentRun.maxOutputTokens,
    row.scenarioId,
    row.scenarioCategory,
    row.inputType,
    row.isMultiTurn,
    row.turnNumber,
    row.userMessage,
    row.expectedBehavior,
    row.assistantResponse,
    row.technique,
    row.kbSize,
    row.latencyMs,
    row.inputTokens,
    row.outputTokens,
    row.totalTokens,
    jsonValue(row.retrievedContextJson),
    row.error,
    row.createdAt,
    row.experimentRun.createdAt,
    row.experimentRun.startedAt,
    row.experimentRun.completedAt,
  ];
}

export function resultsToCsv(rows: ExperimentResultWithRun[]): string {
  return [
    CSV_HEADERS.join(","),
    ...rows.map((row) => rowToValues(row).map(csvEscape).join(",")),
  ].join("\n");
}
