import { Prisma, RunStatus, RunType } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ListExperimentResultsFilters,
  ListExperimentRunsFilters,
} from "@/types/experiment";

type ExperimentDbClient = PrismaClient | Prisma.TransactionClient;

export const experimentResultWithRunInclude = {
  experimentRun: true,
} satisfies Prisma.ExperimentResultInclude;

export type ExperimentResultWithRun = Prisma.ExperimentResultGetPayload<{
  include: typeof experimentResultWithRunInclude;
}>;

function buildRunWhere(
  filters: ListExperimentRunsFilters,
): Prisma.ExperimentRunWhereInput {
  return {
    runType: filters.runType,
    status: filters.status,
    isFinalAnalysis: filters.isFinalAnalysis,
  };
}

function buildResultWhere(
  filters: ListExperimentResultsFilters,
): Prisma.ExperimentResultWhereInput {
  return {
    experimentRunId: filters.experimentRunId,
    technique: filters.technique,
    kbSize: filters.kbSize,
    scenarioCategory: filters.scenarioCategory,
    inputType: filters.inputType,
    scenarioId: filters.scenarioId,
    error:
      filters.hasError == null
        ? undefined
        : filters.hasError
          ? { not: null }
          : null,
  };
}

export async function listExperimentRuns(
  filters: ListExperimentRunsFilters = {},
  db: ExperimentDbClient = prisma,
) {
  return db.experimentRun.findMany({
    where: buildRunWhere(filters),
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { results: true },
      },
    },
  });
}

export async function listExperimentResults(
  filters: ListExperimentResultsFilters = {},
  db: ExperimentDbClient = prisma,
) {
  const where = buildResultWhere(filters);
  const [items, total] = await Promise.all([
    db.experimentResult.findMany({
      where,
      include: experimentResultWithRunInclude,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: filters.limit,
      skip: filters.offset,
    }),
    db.experimentResult.count({ where }),
  ]);

  return {
    items,
    total,
    limit: filters.limit ?? null,
    offset: filters.offset ?? null,
  };
}

export async function markFinalAnalysisRun(
  experimentRunId: string,
  db: PrismaClient = prisma,
) {
  return db.$transaction(async (tx) => {
    const run = await tx.experimentRun.findUnique({
      where: { id: experimentRunId },
    });

    if (!run) {
      throw new Error(`Experiment run not found: ${experimentRunId}`);
    }

    if (run.runType !== RunType.OFFICIAL || run.status !== RunStatus.COMPLETED) {
      throw new Error(
        "Final analysis run must be a completed official experiment run.",
      );
    }

    await tx.experimentRun.updateMany({
      where: { isFinalAnalysis: true },
      data: { isFinalAnalysis: false },
    });

    return tx.experimentRun.update({
      where: { id: experimentRunId },
      data: { isFinalAnalysis: true },
    });
  });
}
