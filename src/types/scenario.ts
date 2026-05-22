export const SCENARIO_CATEGORIES = [
  "general_inquiry",
  "service_question",
  "appointment_booking",
  "rescheduling_cancellation",
  "ambiguous_query",
] as const;

export const SCENARIO_INPUT_TYPES = ["clean", "noisy_taglish"] as const;

export type ScenarioCategory = (typeof SCENARIO_CATEGORIES)[number];

export type ScenarioInputType = (typeof SCENARIO_INPUT_TYPES)[number];

export type ScenarioTurn = {
  turn: number;
  userMessage: string;
  expectedBehavior: string;
};

export type Scenario = {
  id: string;
  category: ScenarioCategory;
  inputType: ScenarioInputType;
  isMultiTurn: boolean;
  turns: ScenarioTurn[];
};
