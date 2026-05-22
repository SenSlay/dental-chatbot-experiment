# Implementation Plan

## Goal

Build a local Next.js experiment runner for comparing Prompt Engineering and RAG using fixed dental clinic KB datasets and scenario datasets.

Do not build unnecessary production chatbot features.

## Phase 1: Project Setup

Tasks:

- Set up Next.js App Router with TypeScript.
- Install Prisma.
- Configure PostgreSQL.
- Add OpenAI SDK.
- Create `.env.example`.

Required environment variables:

```txt
DATABASE_URL=
OPENAI_API_KEY=
OPENAI_RESPONSE_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
RAG_TOP_K=5
EXPERIMENT_TEMPERATURE=0
EXPERIMENT_MAX_OUTPUT_TOKENS=500
```

## Phase 2: Prisma Schema

Create models:

- `ExperimentRun`
- `ExperimentResult`

Do not create `Evaluation` yet. The evaluation rubric is not finalized, so the model should be added in a later phase when the rubric is stable.

## Phase 3: Dataset Loading

Implement:

- `src/lib/data/loadKb.ts`
- `src/lib/data/loadScenarios.ts`
- `src/lib/data/validateDataset.ts`

Requirements:

- Load KB JSON files from `data/kb`.
- Load scenarios from `data/scenarios/scenarios.json`.
- Validate required fields.
- Validate the official scenario count is 60 before official runs.
- Throw clear errors for invalid data.

## Phase 4: KB Formatting

Implement:

- `src/lib/kb/flattenKb.ts`
- `src/lib/kb/formatKbForPrompt.ts`

Requirements:

- `flattenKb` converts grouped KB JSON into a flat list of retrievable entries.
- `formatKbForPrompt` converts full KB into structured text for Prompt Engineering mode.

Flattened entry shape:

```ts
type FlattenedKbEntry = {
  id: string;
  sourceType: "faq" | "offering" | "policy" | "dentist_profile";
  title: string;
  text: string;
};
```

## Phase 5: OpenAI Client

Implement:

- `src/lib/openai/client.ts`
- `src/lib/openai/usage.ts`

Requirements:

- Centralize OpenAI Responses API client creation.
- Return assistant response and Responses API token usage.
- Handle API errors safely.
- Rename persisted token fields from `promptTokens` and `completionTokens` to `inputTokens` and `outputTokens` before experiment runs begin.
- Use the same Responses API wrapper and response model for Prompt Engineering and RAG.

## Phase 6: Prompt Engineering Engine

Implement:

- `src/lib/prompts/systemPrompt.ts`
- `src/lib/prompts/promptEngineeringPrompt.ts`
- `src/lib/engines/promptEngineeringEngine.ts`

Input:

```ts
{
  kb,
  conversationHistory,
  userMessage
}
```

Output:

```ts
{
  assistantResponse,
  inputTokens,
  outputTokens,
  totalTokens
}
```

Rules:

- Inject full KB.
- Include conversation history.
- Do not perform retrieval.

## Phase 7: RAG Engine

Implement:

- `src/lib/rag/embedKb.ts`
- `src/lib/rag/cosineSimilarity.ts`
- `src/lib/rag/retrieveTopK.ts`
- `src/lib/engines/ragEngine.ts`

Requirements:

- Flatten KB.
- Generate or load cached embeddings.
- Embed current user message.
- Retrieve top 5 KB entries by cosine similarity.
- Inject only retrieved entries into the prompt.
- Save retrieved entries in result logs.
- Return `inputTokens`, `outputTokens`, and `totalTokens` from the same Responses API wrapper used by Prompt Engineering mode.

Use JSON embedding cache in:

```txt
data/embeddings/
```

Do not require pgvector for the first implementation.

## Phase 8: Experiment Runner

Implement:

- `src/lib/experiment/runExperiment.ts`
- `src/lib/experiment/runScenario.ts`
- `src/lib/experiment/logResult.ts`

Requirements:

- Support selected KB size or all KB sizes.
- Support selected technique or both techniques.
- Support selected scenario or all scenarios.
- Generate assistant response for every user turn.
- Append generated assistant responses to conversation history.
- Log each generated assistant response.
- Separate pilot runs from official runs.

## Phase 9: API Routes

Create:

- `src/app/api/experiments/run/route.ts`
- `src/app/api/experiments/route.ts`
- `src/app/api/results/route.ts`
- `src/app/api/export/route.ts`

API behavior:

- `/api/experiments/run` starts a pilot or official experiment run.
- `/api/experiments` lists experiment runs.
- `/api/results` lists experiment results with filters.
- `/api/export` exports results to CSV.

## Phase 10: UI

Create pages:

- `src/app/experiments/page.tsx`
- `src/app/results/page.tsx`

Experiments page:

- Select run type: pilot or official.
- Select KB size: 30, 100, 300, or all.
- Select technique: prompt_engineering, rag, or both.
- Optional scenario ID for debugging.
- Button to run experiment.
- Show status.

Results page:

- Show table of generated responses.
- Filter by experiment run.
- Filter by KB size.
- Filter by technique.
- Filter by category.
- Filter by input type.
- View retrieved context for RAG.
- Export CSV.

## Phase 11: Evaluation Later

Do not build evaluation UI yet.

Add the `Evaluation` model later when the rubric in `docs/EVALUATION_GUIDE.md` is finalized.
