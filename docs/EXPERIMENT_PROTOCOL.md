# Experiment Protocol

## Purpose

This document defines how experiment runs should be executed.

The goal is to produce clean, repeatable outputs for comparing Prompt Engineering and RAG.

## Run Types

### Pilot Run

A pilot run is used for debugging.

Use pilot runs to check:

- broken JSON
- bad scenario wording
- invalid KB structure
- API errors
- logging bugs
- incorrect RAG retrieval
- token/latency logging issues

Pilot runs are not used for final thesis analysis.

### Official Run

An official run is the final experiment batch used for analysis.

Official runs should only be performed after:

- KB files are finalized
- scenarios are finalized
- prompts are finalized
- model settings are finalized
- logging has been tested
- pilot runs have passed

## Experimental Conditions

Each official run should execute:

```txt
60 scenarios
x 3 KB sizes
x 2 techniques
= 360 scenario-level runs
```

Because multi-turn scenarios contain multiple user turns, the number of generated responses may be higher than 360. Every generated assistant response should be logged.

The fixed 60-scenario set is a project-level experiment decision and must be reused across all conditions.

## Execution Loop

The experiment runner should follow this logic:

```txt
for each kbSize in [30, 100, 300]:
  load selected KB

  for each technique in ["prompt_engineering", "rag"]:
    for each scenario in scenarios:
      conversationHistory = []

      for each turn in scenario.turns:
        send userMessage and conversationHistory to selected technique
        generate assistant response
        log generated response and metadata
        append user message and assistant response to conversationHistory
```

## Prompt Engineering Execution

For each turn:

1. Load full selected KB.
2. Format full KB as structured text.
3. Build prompt using system instructions, conversation history, full KB content, and current user message.
4. Generate assistant response.
5. Log response and metadata.

No semantic retrieval should be used in Prompt Engineering mode.

## RAG Execution

For each turn:

1. Flatten selected KB into retrievable entries.
2. Load or generate KB embeddings.
3. Embed current user message.
4. Compute cosine similarity against KB entry embeddings.
5. Retrieve top 5 entries.
6. Build prompt using system instructions, conversation history, retrieved entries, and current user message.
7. Generate assistant response.
8. Log response, retrieved entries, and metadata.

## Controlled Variables

Keep these fixed during official runs:

- model
- temperature
- max output tokens
- RAG top-k
- embedding model
- scenario file
- KB files
- system prompt
- conversation history policy
- runtime environment

## Conversation History Policy

Prompt Engineering and RAG must use the same conversation history policy.

For the first implementation, retain all previous turns within the current scenario because scenario conversations are bounded. If a fixed last-N turn limit is introduced later, use the same N for both techniques and record it as part of the run metadata.

## Official Run Rules

- Do not edit KB files during an official run.
- Do not edit scenarios during an official run.
- Do not edit prompts during an official run.
- Do not delete raw results.
- Do not overwrite official results.
- If something breaks, mark the run as failed and create a new official run after fixing the issue.

## Output Requirements

Each generated response must save:

- experiment run ID
- scenario ID
- category
- input type
- turn number
- user message
- expected behavior
- assistant response
- technique
- KB size
- latency
- input tokens
- output tokens
- total tokens
- retrieved context for RAG
- error, if any

Token counts should come from the OpenAI Responses API `usage` object. `total tokens` should represent the reported total for the interaction.
