import type { Prisma, RunStatus, RunType, Technique } from "@prisma/client";
import type { ConversationTurn } from "./conversation";
import type { KbSize } from "./kb";
import type { KnowledgeBase } from "./kb";
import type { RetrievedKbEntry } from "./rag";
import type { Scenario } from "./scenario";
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

export type RunScenarioInput = {
  experimentRunId: string;
  kb: KnowledgeBase;
  kbSize: KbSize;
  scenario: Scenario;
  technique: Technique;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topK?: number;
};

export type RunScenarioResult = {
  generatedResponses: number;
  conversationHistory: ConversationTurn[];
};

export type RunExperimentInput = {
  name: string;
  runType: RunType;
  kbSizes?: KbSize[];
  techniques?: Technique[];
  scenarioIds?: string[];
  model?: string;
  embeddingModel?: string;
  ragTopK?: number;
  temperature?: number;
  maxOutputTokens?: number;
  scenarioFileVersion?: string | null;
  notes?: string | null;
  throwOnFailure?: boolean;
};

export type ResolvedRunPlan = {
  kbSizes: KbSize[];
  techniques: Technique[];
  scenarioIds: string[];
};

export type RunExperimentResult = {
  experimentRunId: string;
  status: RunStatus;
  generatedResponses: number;
};

export type EngineTurnResult = {
  responseId: string;
  assistantResponse: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  retrievedContext?: RetrievedKbEntry[];
};
