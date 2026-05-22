-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RunType" AS ENUM ('PILOT', 'OFFICIAL');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "Technique" AS ENUM ('PROMPT_ENGINEERING', 'RAG');

-- CreateTable
CREATE TABLE "ExperimentRun" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "runType" "RunType" NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'PENDING',
    "model" TEXT NOT NULL,
    "embeddingModel" TEXT NOT NULL,
    "ragTopK" INTEGER NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "maxOutputTokens" INTEGER NOT NULL,
    "scenarioFileVersion" TEXT,
    "notes" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperimentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentResult" (
    "id" TEXT NOT NULL,
    "experimentRunId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "scenarioCategory" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "isMultiTurn" BOOLEAN NOT NULL,
    "turnNumber" INTEGER NOT NULL,
    "userMessage" TEXT NOT NULL,
    "expectedBehavior" TEXT NOT NULL,
    "assistantResponse" TEXT,
    "technique" "Technique" NOT NULL,
    "kbSize" INTEGER NOT NULL,
    "latencyMs" INTEGER,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "retrievedContextJson" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExperimentResult_experimentRunId_idx" ON "ExperimentResult"("experimentRunId");

-- CreateIndex
CREATE INDEX "ExperimentResult_scenarioId_idx" ON "ExperimentResult"("scenarioId");

-- CreateIndex
CREATE INDEX "ExperimentResult_technique_kbSize_idx" ON "ExperimentResult"("technique", "kbSize");

-- CreateIndex
CREATE INDEX "ExperimentResult_scenarioCategory_inputType_idx" ON "ExperimentResult"("scenarioCategory", "inputType");

-- AddForeignKey
ALTER TABLE "ExperimentResult" ADD CONSTRAINT "ExperimentResult_experimentRunId_fkey" FOREIGN KEY ("experimentRunId") REFERENCES "ExperimentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
