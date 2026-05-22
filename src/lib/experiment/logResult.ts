import { Prisma, RunStatus, Technique } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateExperimentRunInput,
  LogExperimentResultInput,
} from "@/types/experiment";

type ExperimentDbClient = PrismaClient | Prisma.TransactionClient;

function validatePositiveInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
}

function validateNonNegativeInteger(
  value: number | null | undefined,
  fieldName: string,
): void {
  if (value == null) {
    return;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer.`);
  }
}

function normalizeRetrievedContextJson(input: LogExperimentResultInput) {
  if (input.technique === Technique.PROMPT_ENGINEERING) {
    return Prisma.JsonNull;
  }

  return input.retrievedContextJson ?? Prisma.JsonNull;
}

export async function createExperimentRun(
  input: CreateExperimentRunInput,
  db: ExperimentDbClient = prisma,
) {
  validatePositiveInteger(input.ragTopK, "ragTopK");
  validatePositiveInteger(input.maxOutputTokens, "maxOutputTokens");

  if (input.temperature < 0 || input.temperature > 2) {
    throw new Error("temperature must be between 0 and 2.");
  }

  return db.experimentRun.create({
    data: {
      name: input.name,
      runType: input.runType,
      model: input.model,
      embeddingModel: input.embeddingModel,
      ragTopK: input.ragTopK,
      temperature: input.temperature,
      maxOutputTokens: input.maxOutputTokens,
      scenarioFileVersion: input.scenarioFileVersion ?? null,
      notes: input.notes ?? null,
    },
  });
}

export async function markExperimentRunRunning(
  experimentRunId: string,
  db: ExperimentDbClient = prisma,
) {
  return db.experimentRun.update({
    where: { id: experimentRunId },
    data: {
      status: RunStatus.RUNNING,
      startedAt: new Date(),
    },
  });
}

export async function markExperimentRunCompleted(
  experimentRunId: string,
  db: ExperimentDbClient = prisma,
) {
  return db.experimentRun.update({
    where: { id: experimentRunId },
    data: {
      status: RunStatus.COMPLETED,
      completedAt: new Date(),
    },
  });
}

export async function markExperimentRunFailed(
  experimentRunId: string,
  error: string,
  db: ExperimentDbClient = prisma,
) {
  const existingRun = await db.experimentRun.findUnique({
    where: { id: experimentRunId },
    select: { notes: true },
  });
  const failureNote = `Failure: ${error}`;
  const notes = existingRun?.notes
    ? `${existingRun.notes}\n\n${failureNote}`
    : failureNote;

  return db.experimentRun.update({
    where: { id: experimentRunId },
    data: {
      status: RunStatus.FAILED,
      completedAt: new Date(),
      notes,
    },
  });
}

export async function logExperimentResult(
  input: LogExperimentResultInput,
  db: ExperimentDbClient = prisma,
) {
  validatePositiveInteger(input.turnNumber, "turnNumber");
  validatePositiveInteger(input.kbSize, "kbSize");
  validateNonNegativeInteger(input.latencyMs, "latencyMs");
  validateNonNegativeInteger(input.inputTokens, "inputTokens");
  validateNonNegativeInteger(input.outputTokens, "outputTokens");
  validateNonNegativeInteger(input.totalTokens, "totalTokens");

  return db.experimentResult.create({
    data: {
      experimentRunId: input.experimentRunId,
      scenarioId: input.scenarioId,
      scenarioCategory: input.scenarioCategory,
      inputType: input.inputType,
      isMultiTurn: input.isMultiTurn,
      turnNumber: input.turnNumber,
      userMessage: input.userMessage,
      expectedBehavior: input.expectedBehavior,
      assistantResponse: input.assistantResponse ?? null,
      technique: input.technique,
      kbSize: input.kbSize,
      latencyMs: input.latencyMs ?? null,
      inputTokens: input.inputTokens ?? null,
      outputTokens: input.outputTokens ?? null,
      totalTokens: input.totalTokens ?? null,
      retrievedContextJson: normalizeRetrievedContextJson(input),
      error: input.error ?? null,
    },
  });
}
