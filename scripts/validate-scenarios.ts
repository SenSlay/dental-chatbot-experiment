import { loadScenarios } from "../src/lib/data/loadScenarios";
import { getScenarioTurnCount } from "../src/lib/data/validateDataset";

async function main() {
  const scenarios = await loadScenarios();
  console.log(
    `Validated scenarios.json (${scenarios.length} scenarios, ${getScenarioTurnCount(
      scenarios,
    )} turns)`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
