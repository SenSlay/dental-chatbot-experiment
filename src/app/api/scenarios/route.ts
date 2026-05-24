import { dataResponse, errorResponse } from "@/lib/api/json";
import { loadScenarios } from "@/lib/data/loadScenarios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const scenarios = await loadScenarios();

    return dataResponse(
      scenarios.map((scenario) => ({
        id: scenario.id,
        category: scenario.category,
        inputType: scenario.inputType,
        isMultiTurn: scenario.isMultiTurn,
        turnCount: scenario.turns.length,
        firstUserMessage: scenario.turns[0]?.userMessage ?? "",
      })),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
