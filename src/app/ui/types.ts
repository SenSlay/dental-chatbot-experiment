export type ApiData<T> = {
  data: T;
};

export type ApiError = {
  error: string;
};

export type RunType = "PILOT" | "OFFICIAL";
export type RunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
export type Technique = "PROMPT_ENGINEERING" | "RAG";

export type ExperimentRunSummary = {
  id: string;
  name: string;
  runType: RunType;
  status: RunStatus;
  model: string;
  embeddingModel: string;
  ragTopK: number;
  temperature: number;
  maxOutputTokens: number;
  notes: string | null;
  isFinalAnalysis: boolean;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    results: number;
  };
};

export type ExperimentResultRow = {
  id: string;
  experimentRunId: string;
  scenarioId: string;
  scenarioCategory: string;
  inputType: string;
  isMultiTurn: boolean;
  turnNumber: number;
  userMessage: string;
  expectedBehavior: string;
  assistantResponse: string | null;
  technique: Technique;
  kbSize: number;
  latencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  retrievedContextJson: unknown;
  error: string | null;
  createdAt: string;
  experimentRun: Omit<ExperimentRunSummary, "_count">;
};

export type ResultsPayload = {
  items: ExperimentResultRow[];
  total: number;
  limit: number | null;
  offset: number | null;
};

export type ScenarioSummary = {
  id: string;
  category: string;
  inputType: string;
  isMultiTurn: boolean;
  turnCount: number;
  firstUserMessage: string;
};
