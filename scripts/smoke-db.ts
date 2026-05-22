import { RunType, Technique } from "@prisma/client";
import {
  createExperimentRun,
  logExperimentResult,
  markExperimentRunCompleted,
  markExperimentRunRunning,
} from "../src/lib/experiment/logResult";
import { prisma } from "../src/lib/prisma";

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required to run the DB smoke test.");
  }

  const run = await createExperimentRun({
    name: `DB smoke test ${new Date().toISOString()}`,
    runType: RunType.PILOT,
    model: process.env.OPENAI_RESPONSE_MODEL ?? "gpt-4o-mini",
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-large",
    ragTopK: Number(process.env.RAG_TOP_K ?? 5),
    temperature: Number(process.env.EXPERIMENT_TEMPERATURE ?? 0),
    maxOutputTokens: Number(process.env.EXPERIMENT_MAX_OUTPUT_TOKENS ?? 500),
    scenarioFileVersion: "smoke-test",
    notes: "Synthetic DB smoke test. Safe to ignore for thesis analysis.",
  });

  await markExperimentRunRunning(run.id);

  await logExperimentResult({
    experimentRunId: run.id,
    scenarioId: "smoke_scenario",
    scenarioCategory: "general_inquiry",
    inputType: "clean",
    isMultiTurn: false,
    turnNumber: 1,
    userMessage: "What time do you open?",
    expectedBehavior: "Synthetic smoke result only.",
    assistantResponse: "Synthetic assistant response.",
    technique: Technique.PROMPT_ENGINEERING,
    kbSize: 30,
    latencyMs: 1,
    inputTokens: 1,
    outputTokens: 1,
    totalTokens: 2,
    retrievedContextJson: null,
    error: null,
  });

  await markExperimentRunCompleted(run.id);
  console.log(`Created DB smoke pilot run: ${run.id}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
