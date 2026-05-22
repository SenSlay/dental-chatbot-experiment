# Project Structure

This project is a local thesis experiment runner built with Next.js App Router, TypeScript, Prisma, PostgreSQL, and the OpenAI API.

This is the proposed file structure for the app.

```txt
dental-chatbot-experiment/
├─ AGENTS.md
├─ README.md
├─ .env.example
├─ package.json
├─ tsconfig.json
├─ next.config.ts
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ data/
│  ├─ kb/
│  │  ├─ kb_30.json
│  │  ├─ kb_100.json
│  │  └─ kb_300.json
│  ├─ scenarios/
│  │  └─ scenarios.json
│  └─ embeddings/
├─ docs/
│  ├─ PROJECT_SPEC.md
│  ├─ PROJECT_STRUCTURE.md
│  ├─ DATA_SCHEMA.md
│  ├─ EXPERIMENT_PROTOCOL.md
│  ├─ IMPLEMENTATION_PLAN.md
│  └─ EVALUATION_GUIDE.md
├─ src/
│  ├─ app/
│  │  ├─ page.tsx
│  │  ├─ experiments/
│  │  │  └─ page.tsx
│  │  ├─ results/
│  │  │  └─ page.tsx
│  │  └─ api/
│  │     ├─ experiments/
│  │     │  ├─ run/
│  │     │  │  └─ route.ts
│  │     │  └─ route.ts
│  │     ├─ results/
│  │     │  └─ route.ts
│  │     └─ export/
│  │        └─ route.ts
│  ├─ components/
│  │  ├─ ExperimentControls.tsx
│  │  ├─ ResultsTable.tsx
│  │  └─ RunStatus.tsx
│  ├─ lib/
│  │  ├─ prisma.ts
│  │  ├─ config/
│  │  │  └─ experiment.ts
│  │  ├─ data/
│  │  │  ├─ loadKb.ts
│  │  │  ├─ loadScenarios.ts
│  │  │  └─ validateDataset.ts
│  │  ├─ kb/
│  │  │  ├─ flattenKb.ts
│  │  │  └─ formatKbForPrompt.ts
│  │  ├─ openai/
│  │  │  ├─ client.ts
│  │  │  └─ usage.ts
│  │  ├─ engines/
│  │  │  ├─ promptEngineeringEngine.ts
│  │  │  └─ ragEngine.ts
│  │  ├─ rag/
│  │  │  ├─ embedKb.ts
│  │  │  ├─ cosineSimilarity.ts
│  │  │  └─ retrieveTopK.ts
│  │  ├─ experiment/
│  │  │  ├─ runExperiment.ts
│  │  │  ├─ runScenario.ts
│  │  │  └─ logResult.ts
│  │  └─ export/
│  │     └─ resultsToCsv.ts
│  └─ types/
│     ├─ kb.ts
│     ├─ scenario.ts
│     └─ experiment.ts
```
