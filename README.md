# Dental Chatbot Experiment Runner

A local thesis experiment app for comparing Prompt Engineering and Retrieval-Augmented Generation in a dental clinic customer-service chatbot.

## Stack

- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma
- OpenAI API

## Main Features

- Load KB datasets
- Load scenario datasets
- Run Prompt Engineering experiments
- Run RAG experiments
- Run across KB sizes 30, 100, 300
- Log generated responses, latency, token usage, and retrieved context
- View and export results

## Setup

1. Install dependencies

```bash
npm install
```

2. Create `.env`

```bash
cp .env.example .env
```

3. Run Prisma migration

```bash
npx prisma migrate dev
```

4. Start dev server

```bash
npm run dev
```

---

## `.env.example`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dental_chatbot_experiment"

OPENAI_API_KEY=""

OPENAI_CHAT_MODEL="gpt-4o-mini"
OPENAI_EMBEDDING_MODEL="text-embedding-3-large"

RAG_TOP_K="5"
EXPERIMENT_TEMPERATURE="0"
EXPERIMENT_MAX_OUTPUT_TOKENS="500"
```
