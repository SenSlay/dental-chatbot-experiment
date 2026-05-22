import { Prisma, Technique } from "@prisma/client";
import { runPromptEngineeringEngine } from "@/lib/engines/promptEngineeringEngine";
import { runRagEngine } from "@/lib/engines/ragEngine";
import { logExperimentResult } from "@/lib/experiment/logResult";
import type { ConversationTurn } from "@/types/conversation";
import type {
  EngineTurnResult,
  RunScenarioInput,
  RunScenarioResult,
} from "@/types/experiment";
import type { RetrievedKbEntry } from "@/types/rag";

function toJsonValue(value: RetrievedKbEntry[]): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function generateTurnResponse({
  input,
  conversationHistory,
  userMessage,
}: {
  input: RunScenarioInput;
  conversationHistory: ConversationTurn[];
  userMessage: string;
}): Promise<EngineTurnResult> {
  if (input.technique === Technique.PROMPT_ENGINEERING) {
    return runPromptEngineeringEngine({
      kb: input.kb,
      conversationHistory,
      userMessage,
      model: input.model,
      temperature: input.temperature,
      maxOutputTokens: input.maxOutputTokens,
    });
  }

  const ragResult = await runRagEngine({
    kb: input.kb,
    kbSize: input.kbSize,
    conversationHistory,
    userMessage,
    topK: input.topK,
    model: input.model,
    temperature: input.temperature,
    maxOutputTokens: input.maxOutputTokens,
  });

  return ragResult;
}

export async function runScenario(
  input: RunScenarioInput,
): Promise<RunScenarioResult> {
  const conversationHistory: ConversationTurn[] = [];
  let generatedResponses = 0;

  for (const turn of input.scenario.turns) {
    const startedAt = Date.now();

    try {
      const response = await generateTurnResponse({
        input,
        conversationHistory,
        userMessage: turn.userMessage,
      });
      const latencyMs = Date.now() - startedAt;
      const retrievedContext = response.retrievedContext ?? [];

      await logExperimentResult({
        experimentRunId: input.experimentRunId,
        scenarioId: input.scenario.id,
        scenarioCategory: input.scenario.category,
        inputType: input.scenario.inputType,
        isMultiTurn: input.scenario.isMultiTurn,
        turnNumber: turn.turn,
        userMessage: turn.userMessage,
        expectedBehavior: turn.expectedBehavior,
        assistantResponse: response.assistantResponse,
        technique: input.technique,
        kbSize: input.kbSize,
        latencyMs,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        totalTokens: response.totalTokens,
        retrievedContextJson:
          input.technique === Technique.RAG ? toJsonValue(retrievedContext) : null,
        error: null,
      });

      conversationHistory.push({
        userMessage: turn.userMessage,
        assistantResponse: response.assistantResponse,
      });
      generatedResponses += 1;
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const message = error instanceof Error ? error.message : String(error);

      await logExperimentResult({
        experimentRunId: input.experimentRunId,
        scenarioId: input.scenario.id,
        scenarioCategory: input.scenario.category,
        inputType: input.scenario.inputType,
        isMultiTurn: input.scenario.isMultiTurn,
        turnNumber: turn.turn,
        userMessage: turn.userMessage,
        expectedBehavior: turn.expectedBehavior,
        assistantResponse: null,
        technique: input.technique,
        kbSize: input.kbSize,
        latencyMs,
        inputTokens: null,
        outputTokens: null,
        totalTokens: null,
        retrievedContextJson: null,
        error: message,
      });

      throw error;
    }
  }

  return {
    generatedResponses,
    conversationHistory,
  };
}
