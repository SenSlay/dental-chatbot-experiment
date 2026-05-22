import type { Prisma, RunStatus, RunType, Technique } from "@prisma/client";
import type { KbSize } from "./kb";
import type { ScenarioCategory, ScenarioInputType } from "./scenario";

export type CreateExperimentRunInput = {
  name: string;
  runType: RunType;
  model: string;
  embeddingModel: string;
  ragTopK: number;
  temperature: number;
  maxOutputTokens: number;
  scenarioFileVersion?: string | null;
  notes?: string | null;
};

export type ExperimentRunStatus = RunStatus;

export type LogExperimentResultInput = {
  experimentRunId: string;
  scenarioId: string;
  scenarioCategory: ScenarioCategory;
  inputType: ScenarioInputType;
  isMultiTurn: boolean;
  turnNumber: number;
  userMessage: string;
  expectedBehavior: string;
  assistantResponse?: string | null;
  technique: Technique;
  kbSize: KbSize;
  latencyMs?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  retrievedContextJson?: Prisma.InputJsonValue | null;
  error?: string | null;
};
