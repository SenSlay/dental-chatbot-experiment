import { RunStatus, RunType, Technique } from "@prisma/client";
import type { KbSize } from "@/types/kb";
import type {
  ListExperimentResultsFilters,
  ListExperimentRunsFilters,
} from "@/types/experiment";

const KB_SIZES = [30, 100, 300] as const;

function getOptionalParam(searchParams: URLSearchParams, key: string): string | undefined {
  const value = searchParams.get(key)?.trim();
  return value || undefined;
}

function parseBoolean(value: string | undefined, fieldName: string): boolean | undefined {
  if (value == null) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error(`${fieldName} must be true or false.`);
}

function parsePositiveInteger(
  value: string | undefined,
  fieldName: string,
): number | undefined {
  if (value == null) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }

  return parsed;
}

function parseNonNegativeInteger(
  value: string | undefined,
  fieldName: string,
): number | undefined {
  if (value == null) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative integer.`);
  }

  return parsed;
}

export function parseRunType(value: unknown): RunType {
  if (value === RunType.PILOT || value === "pilot") {
    return RunType.PILOT;
  }

  if (value === RunType.OFFICIAL || value === "official") {
    return RunType.OFFICIAL;
  }

  throw new Error("runType must be PILOT or OFFICIAL.");
}

export function parseRunStatus(value: unknown): RunStatus {
  if (value === RunStatus.PENDING || value === "pending") {
    return RunStatus.PENDING;
  }

  if (value === RunStatus.RUNNING || value === "running") {
    return RunStatus.RUNNING;
  }

  if (value === RunStatus.COMPLETED || value === "completed") {
    return RunStatus.COMPLETED;
  }

  if (value === RunStatus.FAILED || value === "failed") {
    return RunStatus.FAILED;
  }

  throw new Error("status must be PENDING, RUNNING, COMPLETED, or FAILED.");
}

export function parseTechnique(value: unknown): Technique {
  if (value === Technique.PROMPT_ENGINEERING || value === "prompt_engineering") {
    return Technique.PROMPT_ENGINEERING;
  }

  if (value === Technique.RAG || value === "rag") {
    return Technique.RAG;
  }

  throw new Error("technique must be PROMPT_ENGINEERING or RAG.");
}

export function parseKbSize(value: unknown): KbSize {
  const parsed = typeof value === "number" ? value : Number(value);

  if (KB_SIZES.includes(parsed as KbSize)) {
    return parsed as KbSize;
  }

  throw new Error("kbSize must be 30, 100, or 300.");
}

function parseStringArray(value: unknown, fieldName: string): string[] | undefined {
  if (value == null) {
    return undefined;
  }

  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`${fieldName} must be an array of strings.`);
  }

  return value;
}

function parseKbSizeArray(value: unknown): KbSize[] | undefined {
  if (value == null) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error("kbSizes must be an array.");
  }

  return value.map(parseKbSize);
}

function parseTechniqueArray(value: unknown): Technique[] | undefined {
  if (value == null) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error("techniques must be an array.");
  }

  return value.map(parseTechnique);
}

export function parseOptionalString(value: unknown, fieldName: string): string | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string.`);
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

export function parseRunRequestBody(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Request body must be a JSON object.");
  }

  const body = data as Record<string, unknown>;
  const name = parseOptionalString(body.name, "name");

  if (!name) {
    throw new Error("name is required.");
  }

  return {
    name,
    runType: parseRunType(body.runType),
    kbSizes: parseKbSizeArray(body.kbSizes),
    techniques: parseTechniqueArray(body.techniques),
    scenarioIds: parseStringArray(body.scenarioIds, "scenarioIds"),
    notes: parseOptionalString(body.notes, "notes") ?? null,
  };
}

export function parseFinalAnalysisBody(data: unknown): string {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Request body must be a JSON object.");
  }

  const experimentRunId = parseOptionalString(
    (data as Record<string, unknown>).experimentRunId,
    "experimentRunId",
  );

  if (!experimentRunId) {
    throw new Error("experimentRunId is required.");
  }

  return experimentRunId;
}

export function parseExperimentRunFilters(
  searchParams: URLSearchParams,
): ListExperimentRunsFilters {
  const runType = getOptionalParam(searchParams, "runType");
  const status = getOptionalParam(searchParams, "status");

  return {
    runType: runType ? parseRunType(runType) : undefined,
    status: status ? parseRunStatus(status) : undefined,
    isFinalAnalysis: parseBoolean(
      getOptionalParam(searchParams, "isFinalAnalysis"),
      "isFinalAnalysis",
    ),
  };
}

export function parseExperimentResultFilters(
  searchParams: URLSearchParams,
  options: { includePagination?: boolean } = {},
): ListExperimentResultsFilters {
  const technique = getOptionalParam(searchParams, "technique");
  const kbSize = getOptionalParam(searchParams, "kbSize");
  const limit = options.includePagination
    ? parsePositiveInteger(getOptionalParam(searchParams, "limit"), "limit") ?? 100
    : undefined;
  const offset = options.includePagination
    ? parseNonNegativeInteger(getOptionalParam(searchParams, "offset"), "offset") ?? 0
    : undefined;

  return {
    experimentRunId: getOptionalParam(searchParams, "experimentRunId"),
    technique: technique ? parseTechnique(technique) : undefined,
    kbSize: kbSize ? parseKbSize(kbSize) : undefined,
    scenarioCategory: getOptionalParam(searchParams, "scenarioCategory"),
    inputType: getOptionalParam(searchParams, "inputType"),
    scenarioId: getOptionalParam(searchParams, "scenarioId"),
    hasError: parseBoolean(getOptionalParam(searchParams, "hasError"), "hasError"),
    limit,
    offset,
  };
}
