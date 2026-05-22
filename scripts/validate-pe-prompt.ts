import { loadKb } from "../src/lib/data/loadKb";
import { buildPromptEngineeringInput } from "../src/lib/prompts/promptEngineeringPrompt";
import { DENTAL_ASSISTANT_SYSTEM_PROMPT } from "../src/lib/prompts/systemPrompt";
import type { ConversationTurn } from "../src/types/conversation";

function assertIncludes(text: string, expected: string): void {
  if (!text.includes(expected)) {
    throw new Error(`Expected prompt to include: ${expected}`);
  }
}

function assertExcludes(text: string, unexpected: string): void {
  if (text.includes(unexpected)) {
    throw new Error(`Expected prompt to exclude: ${unexpected}`);
  }
}

async function main() {
  const kb = await loadKb(30);
  const userMessage = "How much is dental cleaning?";
  const expectedBehavior =
    "The assistant should provide the price range for dental cleaning.";
  const conversationHistory: ConversationTurn[] = [
    {
      userMessage: "Do you offer dental cleaning?",
      assistantResponse:
        "Yes. The clinic offers dental cleaning based on the provided knowledge context.",
    },
  ];

  const promptWithoutHistory = buildPromptEngineeringInput({
    kb,
    conversationHistory: [],
    userMessage,
  });

  const promptWithHistory = buildPromptEngineeringInput({
    kb,
    conversationHistory,
    userMessage,
  });

  for (const prompt of [promptWithoutHistory, promptWithHistory]) {
    assertIncludes(prompt, "# Prompt Engineering Input");
    assertIncludes(prompt, "## Knowledge Context");
    assertIncludes(prompt, "# Knowledge Base");
    assertIncludes(prompt, "## FAQs");
    assertIncludes(prompt, "## Offerings");
    assertIncludes(prompt, "## Policies");
    assertIncludes(prompt, "## Dentist Profiles");
    assertIncludes(prompt, "## Conversation History");
    assertIncludes(prompt, "## Current User Message");
    assertIncludes(prompt, userMessage);
    assertIncludes(prompt, kb.faqs[0].id);
    assertExcludes(prompt, expectedBehavior);
    assertExcludes(prompt, "## Retrieved Context");
    assertExcludes(prompt, "Similarity Score");
  }

  assertIncludes(promptWithoutHistory, "No previous conversation turns.");
  assertIncludes(promptWithHistory, "Turn 1");
  assertIncludes(promptWithHistory, conversationHistory[0].userMessage);
  assertIncludes(promptWithHistory, conversationHistory[0].assistantResponse);

  assertIncludes(DENTAL_ASSISTANT_SYSTEM_PROMPT, "Do not invent clinic details");
  assertIncludes(DENTAL_ASSISTANT_SYSTEM_PROMPT, "Filipino or Taglish");
  assertIncludes(DENTAL_ASSISTANT_SYSTEM_PROMPT, "reference data only");

  console.log("Validated Prompt Engineering prompt construction");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
