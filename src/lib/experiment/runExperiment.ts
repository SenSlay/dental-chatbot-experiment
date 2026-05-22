import { RunStatus, RunType, Technique } from "@prisma/client";
import { loadKb } from "@/lib/data/loadKb";
import { loadScenarios } from "@/lib/data/loadScenarios";
import {
  createExperimentRun,
  markExperimentRunCompleted,
  markExperimentRunFailed,
  markExperimentRunRunning,
} from "@/lib/experiment/logResult";
import { runScenario } from "@/lib/experiment/runScenario";
import { getEmbeddingModel } from "@/lib/openai/embeddings";
import { getOpenAISettings } from "@/lib/openai/client";
import { KB_SIZES } from "@/types/kb";
import type { KbSize } from "@/types/kb";
import type {
  ResolvedRunPlan,
  RunExperimentInput,
  RunExperimentResult,
} from "@/types/experiment";
import type { Scenario } from "@/types/scenario";

const ALL_TECHNIQUES = [Technique.PROMPT_ENGINEERING, Technique.RAG] as const;
const DEFAULT_SCENARIO_FILE_VERSION = "data/scenarios/scenarios.json";

function getRagTopK(defaultValue = 5): number {
  const raw = process.env.RAG_TOP_K?.trim();

  if (!raw) {
    return defaultValue;
  }

  const topK = Number(raw);

  if (!Number.isInteger(topK) || topK <= 0) {
    throw new Error(`RAG_TOP_K must be a positive integer: ${raw}`);
  }

  return topK;
}

function dedupe<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function assertKnownScenarioIds(scenarios: Scenario[], scenarioIds: string[]): void {
  const knownIds = new Set(scenarios.map((scenario) => scenario.id));
  const missingIds = scenarioIds.filter((scenarioId) => !knownIds.has(scenarioId));

  if (missingIds.length > 0) {
    throw new Error(`Unknown scenario ID(s): ${missingIds.join(", ")}`);
  }
}

function assertKnownKbSizes(kbSizes: KbSize[]): void {
  const knownSizes = new Set<KbSize>(KB_SIZES);
  const unknownSizes = kbSizes.filter((kbSize) => !knownSizes.has(kbSize));

  if (unknownSizes.length > 0) {
    throw new Error(`Unknown KB size(s): ${unknownSizes.join(", ")}`);
  }
}

function assertKnownTechniques(techniques: Technique[]): void {
  const knownTechniques = new Set<Technique>(ALL_TECHNIQUES);
  const unknownTechniques = techniques.filter(
    (technique) => !knownTechniques.has(technique),
  );

  if (unknownTechniques.length > 0) {
    throw new Error(`Unknown technique(s): ${unknownTechniques.join(", ")}`);
  }
}

function isFullOfficialPlan(plan: ResolvedRunPlan, scenarios: Scenario[]): boolean {
  const expectedScenarioIds = scenarios.map((scenario) => scenario.id);

  return (
    plan.kbSizes.length === KB_SIZES.length &&
    KB_SIZES.every((kbSize) => plan.kbSizes.includes(kbSize)) &&
    plan.techniques.length === ALL_TECHNIQUES.length &&
    ALL_TECHNIQUES.every((technique) => plan.techniques.includes(technique)) &&
    plan.scenarioIds.length === expectedScenarioIds.length &&
    expectedScenarioIds.every((scenarioId) => plan.scenarioIds.includes(scenarioId))
  );
}

export function resolveRunPlan(
  input: RunExperimentInput,
  scenarios: Scenario[],
): ResolvedRunPlan {
  const kbSizes = dedupe(input.kbSizes ?? [...KB_SIZES]);
  const techniques = dedupe(input.techniques ?? [...ALL_TECHNIQUES]);
  const scenarioIds = dedupe(input.scenarioIds ?? scenarios.map((scenario) => scenario.id));

  if (kbSizes.length === 0) {
    throw new Error("At least one KB size must be selected.");
  }

  if (techniques.length === 0) {
    throw new Error("At least one technique must be selected.");
  }

  if (scenarioIds.length === 0) {
    throw new Error("At least one scenario must be selected.");
  }

  assertKnownKbSizes(kbSizes);
  assertKnownTechniques(techniques);
  assertKnownScenarioIds(scenarios, scenarioIds);

  const plan: ResolvedRunPlan = {
    kbSizes,
    techniques,
    scenarioIds,
  };

  if (input.runType === RunType.OFFICIAL && !isFullOfficialPlan(plan, scenarios)) {
    throw new Error(
      "Official runs must include all KB sizes, both techniques, and all scenarios.",
    );
  }

  return plan;
}

export async function runExperiment(
  input: RunExperimentInput,
): Promise<RunExperimentResult> {
  const scenarios = await loadScenarios();
  const plan = resolveRunPlan(input, scenarios);
  const openAISettings = getOpenAISettings();
  const model = input.model ?? openAISettings.responseModel;
  const embeddingModel = input.embeddingModel ?? getEmbeddingModel();
  const ragTopK = input.ragTopK ?? getRagTopK();
  const temperature = input.temperature ?? openAISettings.temperature;
  const maxOutputTokens = input.maxOutputTokens ?? openAISettings.maxOutputTokens;
  const run = await createExperimentRun({
    name: input.name,
    runType: input.runType,
    model,
    embeddingModel,
    ragTopK,
    temperature,
    maxOutputTokens,
    scenarioFileVersion:
      input.scenarioFileVersion ?? DEFAULT_SCENARIO_FILE_VERSION,
    notes: input.notes ?? null,
  });
  let generatedResponses = 0;

  try {
    await markExperimentRunRunning(run.id);

    for (const kbSize of plan.kbSizes) {
      const kb = await loadKb(kbSize);

      for (const technique of plan.techniques) {
        for (const scenarioId of plan.scenarioIds) {
          const scenario = scenarios.find((item) => item.id === scenarioId);

          if (!scenario) {
            throw new Error(`Unknown scenario ID during run: ${scenarioId}`);
          }

          const scenarioResult = await runScenario({
            experimentRunId: run.id,
            kb,
            kbSize: kbSize as KbSize,
            scenario,
            technique,
            model,
            temperature,
            maxOutputTokens,
            topK: ragTopK,
          });

          generatedResponses += scenarioResult.generatedResponses;
        }
      }
    }

    await markExperimentRunCompleted(run.id);

    return {
      experimentRunId: run.id,
      status: RunStatus.COMPLETED,
      generatedResponses,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markExperimentRunFailed(run.id, message);

    if (input.throwOnFailure) {
      throw error;
    }

    return {
      experimentRunId: run.id,
      status: RunStatus.FAILED,
      generatedResponses,
    };
  }
}
