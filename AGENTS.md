# AGENTS.md

## Project Identity

This project is a thesis experiment runner for comparing Prompt Engineering and Retrieval-Augmented Generation (RAG) in an AI-based customer service chatbot for Philippine dental clinics.

This is not a production chatbot or SaaS product.

The primary goal is to run controlled experiments, generate chatbot responses, and log clean metadata for later evaluation and analysis.

## Research Alignment

The application must support the thesis methodology:

- Compare two techniques:
  - Prompt Engineering
  - Retrieval-Augmented Generation (RAG)

- Use the same underlying LLM for both techniques.

- Use three knowledge base sizes:
  - 30 entries
  - 100 entries
  - 300 entries

- Use the same fixed scenario set across all experiment conditions.

- Use 60 fixed scenarios for official experiment runs.

- Log:
  - generated assistant response
  - scenario ID
  - scenario category
  - input type
  - turn number
  - technique
  - KB size
  - latency
  - prompt tokens
  - completion tokens
  - total tokens
  - retrieved context for RAG

## Technical Stack

Use:

- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma
- OpenAI API

The app is local-only. Deployment is not required.

## Non-Goals

Do not build:

- a production booking system
- authentication
- billing
- user accounts
- real patient records
- real clinic integrations
- polished public chatbot UI
- unnecessary SaaS features

## Scenario Rules

Scenarios contain predefined user turns only.

The app must generate assistant replies dynamically during the experiment.

For multi-turn scenarios:

1. Send the first user message.
2. Generate the assistant response.
3. Save the generated response.
4. Append the user message and assistant response to conversation history.
5. Continue with the next user turn.

Do not hardcode assistant replies into the experiment conversation.

Use the same conversation history policy for Prompt Engineering and RAG. If a turn limit is introduced, keep it fixed across all experiment conditions.

## Prompt Engineering Mode

Prompt Engineering mode must construct a prompt using:

- system instructions
- conversation history
- the full selected knowledge base

No semantic retrieval should be used in this mode.

## RAG Mode

RAG mode must:

- flatten the selected knowledge base into retrievable text entries
- embed the user query
- compare query embedding against KB entry embeddings using cosine similarity
- retrieve top-k entries
- construct a prompt using:
  - system instructions
  - conversation history
  - retrieved entries only

Default RAG settings:

- embedding model: text-embedding-3-large
- retrieval depth: k = 5
- similarity metric: cosine similarity

## Development Rules

- Keep changes minimal and aligned with the experiment.
- Prefer clear, boring, maintainable code.
- Do not invent new features without being asked.
- Validate JSON dataset structures before running experiments.
- Preserve raw experiment data.
- Never overwrite official experiment results without explicit confirmation.
- Separate pilot runs from official runs.
- When the user is discussing, reviewing, planning, or asking for opinions, do not edit files unless the user explicitly asks for changes.
