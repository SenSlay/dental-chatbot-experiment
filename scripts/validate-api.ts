import { RunStatus, RunType, Technique } from "@prisma/client";
import {
  parseExperimentResultFilters,
  parseRunRequestBody,
} from "../src/lib/api/query";
import { errorResponse } from "../src/lib/api/json";
import { markFinalAnalysisRun } from "../src/lib/experiment/queries";
import { resultsToCsv } from "../src/lib/export/resultsToCsv";
import type { ExperimentResultWithRun } from "../src/lib/experiment/queries";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function assertRejects(
  fn: () => Promise<unknown>,
  expectedMessage: string,
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.includes(expectedMessage)) {
      throw new Error(`Expected error containing "${expectedMessage}", got "${message}"`);
    }

    return;
  }

  throw new Error(`Expected function to reject: ${expectedMessage}`);
}

function validateQueryParsing(): void {
  const filters = parseExperimentResultFilters(
    new URLSearchParams(
      "experimentRunId=run_1&technique=prompt_engineering&kbSize=30&scenarioCategory=general_inquiry&inputType=clean&scenarioId=scenario_001&hasError=false&limit=25&offset=5",
    ),
    { includePagination: true },
  );

  assert(filters.experimentRunId === "run_1", "experimentRunId should parse");
  assert(
    filters.technique === Technique.PROMPT_ENGINEERING,
    "technique should parse",
  );
  assert(filters.kbSize === 30, "kbSize should parse");
  assert(filters.hasError === false, "hasError should parse");
  assert(filters.limit === 25, "limit should parse");
  assert(filters.offset === 5, "offset should parse");

  const runBody = parseRunRequestBody({
    name: "Small pilot",
    runType: "pilot",
    kbSizes: [30],
    techniques: ["rag"],
    scenarioIds: ["scenario_001"],
    notes: "Test notes",
  });

  assert(runBody.runType === RunType.PILOT, "runType should parse");
  assert(runBody.techniques?.[0] === Technique.RAG, "technique body should parse");
}

function validateCsvEscaping(): void {
  const row = {
    id: "result_1",
    experimentRunId: "run_1",
    scenarioId: "scenario_001",
    scenarioCategory: "general_inquiry",
    inputType: "clean",
    isMultiTurn: false,
    turnNumber: 1,
    userMessage: "Hello, clinic",
    expectedBehavior: "Answer with \"clinic\" info.",
    assistantResponse: "Line 1\nLine 2",
    technique: Technique.RAG,
    kbSize: 30,
    latencyMs: 100,
    inputTokens: 10,
    outputTokens: 20,
    totalTokens: 30,
    retrievedContextJson: [{ id: "faq_001", text: "A,B" }],
    error: null,
    createdAt: new Date("2026-05-23T00:00:00.000Z"),
    experimentRun: {
      id: "run_1",
      name: "Run, with comma",
      runType: RunType.PILOT,
      status: RunStatus.COMPLETED,
      model: "gpt-4o-mini",
      embeddingModel: "text-embedding-3-large",
      ragTopK: 5,
      temperature: 0,
      maxOutputTokens: 500,
      scenarioFileVersion: "data/scenarios/scenarios.json",
      notes: null,
      isFinalAnalysis: false,
      startedAt: null,
      completedAt: null,
      createdAt: new Date("2026-05-23T00:00:00.000Z"),
      updatedAt: new Date("2026-05-23T00:00:00.000Z"),
    },
  } as ExperimentResultWithRun;

  const csv = resultsToCsv([row]);

  assert(csv.includes('"Run, with comma"'), "CSV should escape commas");
  assert(csv.includes('"Answer with ""clinic"" info."'), "CSV should escape quotes");
  assert(csv.includes('"Line 1\nLine 2"'), "CSV should escape newlines");
  assert(csv.includes('"[{""id"":""faq_001"",""text"":""A,B""}]"'), "CSV should escape JSON");
}

async function validateRequestValidation(): Promise<void> {
  await assertRejects(
    async () => parseRunRequestBody({ name: "Bad run", runType: "pilot", kbSizes: 30 }),
    "kbSizes must be an array",
  );

  await assertRejects(
    async () =>
      parseRunRequestBody({
        name: "Bad run",
        runType: "pilot",
        techniques: "rag",
      }),
    "techniques must be an array",
  );
}

async function validateFinalAnalysisSelection(): Promise<void> {
  const incompleteDb = {
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        experimentRun: {
          findUnique: async () => ({
            id: "run_1",
            runType: RunType.OFFICIAL,
            status: RunStatus.FAILED,
          }),
          updateMany: async () => undefined,
          update: async () => undefined,
        },
      }),
  };

  await assertRejects(
    () => markFinalAnalysisRun("run_1", incompleteDb as never),
    "completed official",
  );

  let clearedExisting = false;
  let markedTarget = false;
  const validDb = {
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        experimentRun: {
          findUnique: async () => ({
            id: "run_1",
            runType: RunType.OFFICIAL,
            status: RunStatus.COMPLETED,
          }),
          updateMany: async () => {
            clearedExisting = true;
          },
          update: async () => {
            markedTarget = true;
            return { id: "run_1", isFinalAnalysis: true };
          },
        },
      }),
  };

  await markFinalAnalysisRun("run_1", validDb as never);
  assert(clearedExisting, "Final analysis helper should clear existing markers");
  assert(markedTarget, "Final analysis helper should mark target run");
}

async function validateErrorResponses(): Promise<void> {
  const validationResponse = errorResponse(new Error("Bad request detail"), {
    status: 400,
  });
  const validationBody = await validationResponse.json();

  assert(
    validationBody.error === "Bad request detail",
    "Validation API errors should keep useful messages",
  );

  const originalConsoleError = console.error;
  let runtimeResponse: Response;

  try {
    console.error = () => undefined;
    runtimeResponse = errorResponse(new Error("DATABASE_URL=secret"), {
      status: 500,
    });
  } finally {
    console.error = originalConsoleError;
  }

  const runtimeBody = await runtimeResponse.json();

  assert(
    runtimeBody.error === "Unexpected API error.",
    "Runtime API errors should not expose internal details",
  );
}

async function main() {
  validateQueryParsing();
  validateCsvEscaping();
  await validateRequestValidation();
  await validateFinalAnalysisSelection();
  await validateErrorResponses();
  console.log("Validated API parsing, CSV export, and final-analysis rules");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
