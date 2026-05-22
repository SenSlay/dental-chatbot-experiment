import { RunType, Technique } from "@prisma/client";
import { resolveRunPlan } from "../src/lib/experiment/runExperiment";
import type { Scenario } from "../src/types/scenario";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertThrows(fn: () => unknown, expectedMessage: string): void {
  try {
    fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.includes(expectedMessage)) {
      throw new Error(`Expected error containing "${expectedMessage}", got "${message}"`);
    }

    return;
  }

  throw new Error(`Expected function to throw: ${expectedMessage}`);
}

const scenarios: Scenario[] = [
  {
    id: "scenario_001",
    category: "general_inquiry",
    inputType: "clean",
    isMultiTurn: false,
    turns: [
      {
        turn: 1,
        userMessage: "What time do you open?",
        expectedBehavior: "The assistant should answer from the KB.",
      },
    ],
  },
  {
    id: "scenario_002",
    category: "service_question",
    inputType: "noisy_taglish",
    isMultiTurn: true,
    turns: [
      {
        turn: 1,
        userMessage: "May cleaning kayo?",
        expectedBehavior: "The assistant should answer from the KB.",
      },
      {
        turn: 2,
        userMessage: "hm po?",
        expectedBehavior: "The assistant should preserve prior context.",
      },
    ],
  },
];

function main() {
  const defaultPilotPlan = resolveRunPlan(
    {
      name: "Pilot default",
      runType: RunType.PILOT,
    },
    scenarios,
  );

  assert(defaultPilotPlan.kbSizes.length === 3, "default pilot should include all KB sizes");
  assert(
    defaultPilotPlan.techniques.length === 2,
    "default pilot should include both techniques",
  );
  assert(
    defaultPilotPlan.scenarioIds.length === scenarios.length,
    "default pilot should include all provided scenarios",
  );

  const selectedPilotPlan = resolveRunPlan(
    {
      name: "Selected pilot",
      runType: RunType.PILOT,
      kbSizes: [30],
      techniques: [Technique.PROMPT_ENGINEERING],
      scenarioIds: ["scenario_001"],
    },
    scenarios,
  );

  assert(selectedPilotPlan.kbSizes[0] === 30, "selected pilot should keep KB size");
  assert(
    selectedPilotPlan.techniques[0] === Technique.PROMPT_ENGINEERING,
    "selected pilot should keep technique",
  );
  assert(
    selectedPilotPlan.scenarioIds[0] === "scenario_001",
    "selected pilot should keep scenario ID",
  );

  const fullOfficialPlan = resolveRunPlan(
    {
      name: "Full official",
      runType: RunType.OFFICIAL,
      kbSizes: [300, 100, 30],
      techniques: [Technique.RAG, Technique.PROMPT_ENGINEERING],
      scenarioIds: ["scenario_002", "scenario_001"],
    },
    scenarios,
  );

  assert(fullOfficialPlan.kbSizes.length === 3, "official should accept all KB sizes");
  assert(
    fullOfficialPlan.techniques.length === 2,
    "official should accept both techniques",
  );
  assert(
    fullOfficialPlan.scenarioIds.length === scenarios.length,
    "official should accept all scenarios",
  );

  assertThrows(
    () =>
      resolveRunPlan(
        {
          name: "Partial official",
          runType: RunType.OFFICIAL,
          kbSizes: [30],
        },
        scenarios,
      ),
    "Official runs must include all KB sizes",
  );

  assertThrows(
    () =>
      resolveRunPlan(
        {
          name: "Unknown scenario",
          runType: RunType.PILOT,
          scenarioIds: ["missing"],
        },
        scenarios,
      ),
    "Unknown scenario ID",
  );

  console.log("Validated experiment runner planning rules");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
