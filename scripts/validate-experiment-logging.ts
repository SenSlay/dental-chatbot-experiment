import { RunStatus, RunType, Technique } from "@prisma/client";
import type {
  CreateExperimentRunInput,
  LogExperimentResultInput,
} from "../src/types/experiment";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function validateRunInput(input: CreateExperimentRunInput): void {
  assert(input.runType === RunType.PILOT, "runType should use Prisma RunType enum");
  assert(input.ragTopK === 5, "ragTopK should be preserved");
  assert(input.temperature === 0, "temperature should be preserved");
  assert(input.maxOutputTokens === 500, "maxOutputTokens should be preserved");
}

function validateResultInput(input: LogExperimentResultInput): void {
  assert(
    input.technique === Technique.PROMPT_ENGINEERING || input.technique === Technique.RAG,
    "technique should use Prisma Technique enum",
  );
  assert(input.kbSize === 30, "kbSize should be a supported KB size");
  assert(input.turnNumber === 1, "turnNumber should be preserved");
  assert(input.inputTokens === 10, "inputTokens should be preserved");
  assert(input.outputTokens === 20, "outputTokens should be preserved");
  assert(input.totalTokens === 30, "totalTokens should be preserved");
}

function main() {
  const runInput: CreateExperimentRunInput = {
    name: "Validation pilot run",
    runType: RunType.PILOT,
    model: "gpt-4o-mini",
    embeddingModel: "text-embedding-3-large",
    ragTopK: 5,
    temperature: 0,
    maxOutputTokens: 500,
    scenarioFileVersion: "validation",
    notes: "Offline validation only",
  };

  const peResultInput: LogExperimentResultInput = {
    experimentRunId: "validation-run",
    scenarioId: "scenario_001",
    scenarioCategory: "general_inquiry",
    inputType: "clean",
    isMultiTurn: false,
    turnNumber: 1,
    userMessage: "What time do you open?",
    expectedBehavior: "The assistant should answer using the KB.",
    assistantResponse: "The clinic opens at 9 AM.",
    technique: Technique.PROMPT_ENGINEERING,
    kbSize: 30,
    latencyMs: 1000,
    inputTokens: 10,
    outputTokens: 20,
    totalTokens: 30,
    retrievedContextJson: null,
    error: null,
  };

  const ragResultInput: LogExperimentResultInput = {
    ...peResultInput,
    technique: Technique.RAG,
    retrievedContextJson: [
      {
        id: "faq_001",
        sourceType: "faq",
        title: "Clinic hours",
        text: "ID: faq_001\nQuestion: What time do you open?\nAnswer: 9 AM.",
        similarity: 0.9,
      },
    ],
  };

  validateRunInput(runInput);
  validateResultInput(peResultInput);
  validateResultInput(ragResultInput);

  assert(RunStatus.PENDING === "PENDING", "RunStatus enum should be available");
  assert(RunStatus.RUNNING === "RUNNING", "RunStatus enum should include RUNNING");
  assert(RunStatus.COMPLETED === "COMPLETED", "RunStatus enum should include COMPLETED");
  assert(RunStatus.FAILED === "FAILED", "RunStatus enum should include FAILED");

  console.log("Validated experiment logging types and enum mappings");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
