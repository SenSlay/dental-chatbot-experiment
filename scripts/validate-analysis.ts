import { csvRowsToObjects, parseCsv } from "../src/lib/analysis/csv";
import {
  aggregateRowsToCsv,
  analyzeEvaluatedCsv,
  comparisonRowsToCsv,
} from "../src/lib/analysis/evaluatedCsv";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const fixtureCsv = `runId,runName,runType,isFinalAnalysis,scenarioId,scenarioCategory,inputType,isMultiTurn,turnNumber,userMessage,expectedBehavior,assistantResponse,technique,kbSize,latencyMs,inputTokens,outputTokens,totalTokens,evaluator1AccuracyScore,evaluator1Hallucination,evaluator1ContextRetentionScore,evaluator1Notes,evaluator2AccuracyScore,evaluator2Hallucination,evaluator2ContextRetentionScore,evaluator2Notes,consensusAccuracyScore,consensusHallucination,consensusContextRetentionScore,consensusNotes
run_1,"Pilot, quoted",PILOT,true,scenario_001,general_inquiry,clean,false,1,"Hello, clinic","Answer with ""clinic"" info.","Line 1
Line 2",PROMPT_ENGINEERING,30,100,10,20,30,2,false,,ok,2,false,,ok,2,false,,ok
run_1,"Pilot, quoted",PILOT,true,scenario_001,general_inquiry,clean,false,1,Hello,Answer,Answer,RAG,30,120,8,18,26,1,true,,note,1,true,,note,1,true,,note
run_1,"Pilot, quoted",PILOT,true,scenario_009,general_inquiry,clean,true,2,Follow-up,Retain context,Answer,RAG,30,140,9,19,28,2,false,2,note,2,false,2,note,2,false,2,note
`;

function validateCsvParser(): void {
  const rows = parseCsv(`\uFEFF${fixtureCsv}`);
  const objects = csvRowsToObjects(rows);

  assert(objects.length === 3, "CSV parser should parse three body rows");
  assert("runId" in objects[0], "CSV parser should strip BOM from first header");
  assert(
    objects[0].runName === "Pilot, quoted",
    "CSV parser should preserve quoted commas",
  );
  assert(
    objects[0].expectedBehavior === 'Answer with "clinic" info.',
    "CSV parser should preserve escaped quotes",
  );
  assert(
    objects[0].assistantResponse === "Line 1\nLine 2",
    "CSV parser should preserve multiline fields",
  );
}

function validateAnalysis(): void {
  const analysis = analyzeEvaluatedCsv(fixtureCsv);

  assert(analysis.errors.length === 0, "Fixture should not have import errors");
  assert(analysis.rowCount === 3, "Analysis should count rows");
  assert(analysis.scoredRowCount === 3, "Analysis should count scored rows");
  assert(analysis.invalidScoreCount === 0, "Fixture should not have invalid scores");

  const overall = analysis.aggregateRows.find((row) => row.table === "Overall");
  if (!overall) {
    throw new Error("Overall aggregate should exist");
  }
  assert(overall.responseCount === 3, "Overall aggregate should count rows");
  assert(overall.accuracyPercent === 83.33, "Accuracy percent should be calculated");
  assert(overall.hallucinationRate === 33.33, "Hallucination rate should be calculated");

  const comparison = analysis.comparisonRows.find((row) => row.table === "Overall");
  if (!comparison) {
    throw new Error("Overall comparison should exist");
  }
  assert(comparison.promptEngineeringCount === 1, "PE comparison count should exist");
  assert(comparison.ragCount === 2, "RAG comparison count should exist");

  assert(
    aggregateRowsToCsv(analysis.aggregateRows).includes("accuracyPercent"),
    "Aggregate CSV should include headers",
  );
  assert(
    comparisonRowsToCsv(analysis.comparisonRows).includes("accuracyDifference"),
    "Comparison CSV should include headers",
  );
}

function validateInvalidScores(): void {
  const invalidCsv = `${fixtureCsv}run_1,"Pilot, quoted",PILOT,true,scenario_010,general_inquiry,clean,true,1,Hello,Answer,Answer,RAG,30,100,8,18,26,2,false,2,note,2,false,2,note,bad,false,2,note
`;
  const analysis = analyzeEvaluatedCsv(invalidCsv);

  assert(analysis.invalidScoreCount === 1, "Invalid scores should be counted");
}

function validateMultiTurnContextRequired(): void {
  const missingContextCsv = `${fixtureCsv}run_1,"Pilot, quoted",PILOT,true,scenario_011,general_inquiry,clean,true,1,Hello,Answer,Answer,RAG,30,100,8,18,26,2,false,,note,2,false,,note,2,false,,note
`;
  const analysis = analyzeEvaluatedCsv(missingContextCsv);

  assert(
    analysis.invalidScoreCount === 1,
    "Blank multi-turn context retention should be counted as invalid",
  );
}

validateCsvParser();
validateAnalysis();
validateInvalidScores();
validateMultiTurnContextRequired();
console.log("Validated evaluated CSV analysis");
