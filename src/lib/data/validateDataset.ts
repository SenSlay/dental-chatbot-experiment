import type {
  DentistProfileEntry,
  FaqEntry,
  KbSize,
  KnowledgeBase,
  OfferingEntry,
  PolicyEntry,
} from "@/types/kb";
import {
  SCENARIO_CATEGORIES,
  SCENARIO_INPUT_TYPES,
  type Scenario,
  type ScenarioCategory,
  type ScenarioInputType,
  type ScenarioTurn,
} from "@/types/scenario";

type ValidateKbOptions = {
  kbSize: KbSize;
  filePath: string;
};

type ValidateScenarioOptions = {
  filePath: string;
};

const KB_TOP_LEVEL_KEYS = [
  "faqs",
  "offerings",
  "policies",
  "dentistProfiles",
] as const;

const SCENARIO_REQUIRED_KEYS = [
  "id",
  "category",
  "inputType",
  "isMultiTurn",
  "turns",
] as const;

const SCENARIO_TURN_KEYS = [
  "expectedBehavior",
  "turn",
  "userMessage",
] as const;

const OFFICIAL_SCENARIO_COUNT = 60;

function fail(filePath: string, message: string): never {
  throw new Error(`[${filePath}] ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(
  entry: Record<string, unknown>,
  key: string,
  context: string,
  filePath: string,
): string {
  const value = entry[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    fail(filePath, `${context}: ${key} must be a non-empty string`);
  }

  return value;
}

function requireArray(
  data: Record<string, unknown>,
  key: (typeof KB_TOP_LEVEL_KEYS)[number],
  filePath: string,
): unknown[] {
  const value = data[key];

  if (!Array.isArray(value)) {
    fail(filePath, `${key} must be an array`);
  }

  return value;
}

function validateExactKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  context: string,
  filePath: string,
): void {
  const keys = Object.keys(value).sort();
  const expectedKeys = [...allowedKeys].sort();

  if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
    fail(filePath, `${context}: keys must be exactly ${allowedKeys.join(", ")}`);
  }
}

function validateFaq(
  value: unknown,
  index: number,
  filePath: string,
): FaqEntry {
  if (!isRecord(value)) {
    fail(filePath, `faqs[${index}]: entry must be an object`);
  }

  const id = requireString(value, "id", `faqs[${index}]`, filePath);
  const context = `faqs[${index}] ${id}`;

  return {
    id,
    question: requireString(value, "question", context, filePath),
    answer: requireString(value, "answer", context, filePath),
  };
}

function validateOffering(
  value: unknown,
  index: number,
  filePath: string,
): OfferingEntry {
  if (!isRecord(value)) {
    fail(filePath, `offerings[${index}]: entry must be an object`);
  }

  const id = requireString(value, "id", `offerings[${index}]`, filePath);
  const context = `offerings[${index}] ${id}`;
  const offeringType = requireString(value, "offeringType", context, filePath);

  if (offeringType !== "service" && offeringType !== "product") {
    fail(filePath, `${context}: offeringType must be service or product`);
  }

  const duration = value.duration;

  if (offeringType === "service") {
    if (typeof duration !== "string" || duration.trim().length === 0) {
      fail(filePath, `${context}: service duration must be a non-empty string`);
    }
  } else if (
    duration !== null &&
    (typeof duration !== "string" || duration.trim().length === 0)
  ) {
    fail(filePath, `${context}: product duration must be a non-empty string or null`);
  }

  return {
    id,
    offeringType,
    name: requireString(value, "name", context, filePath),
    price: requireString(value, "price", context, filePath),
    description: requireString(value, "description", context, filePath),
    duration,
  };
}

function validatePolicy(
  value: unknown,
  index: number,
  filePath: string,
): PolicyEntry {
  if (!isRecord(value)) {
    fail(filePath, `policies[${index}]: entry must be an object`);
  }

  const id = requireString(value, "id", `policies[${index}]`, filePath);
  const context = `policies[${index}] ${id}`;

  return {
    id,
    category: requireString(value, "category", context, filePath),
    title: requireString(value, "title", context, filePath),
    description: requireString(value, "description", context, filePath),
  };
}

function validateDentistProfile(
  value: unknown,
  index: number,
  filePath: string,
): DentistProfileEntry {
  if (!isRecord(value)) {
    fail(filePath, `dentistProfiles[${index}]: entry must be an object`);
  }

  const id = requireString(value, "id", `dentistProfiles[${index}]`, filePath);
  const context = `dentistProfiles[${index}] ${id}`;
  const aliases = value.aliases;

  if (
    !Array.isArray(aliases) ||
    aliases.some((alias) => typeof alias !== "string" || alias.trim().length === 0)
  ) {
    fail(filePath, `${context}: aliases must be an array of non-empty strings`);
  }

  return {
    id,
    name: requireString(value, "name", context, filePath),
    aliases,
    specialization: requireString(value, "specialization", context, filePath),
    bio: requireString(value, "bio", context, filePath),
  };
}

function validateUniqueIds(kb: KnowledgeBase, filePath: string): void {
  const seen = new Map<string, string>();
  const groups = [
    ["faqs", kb.faqs],
    ["offerings", kb.offerings],
    ["policies", kb.policies],
    ["dentistProfiles", kb.dentistProfiles],
  ] as const;

  for (const [group, entries] of groups) {
    entries.forEach((entry, index) => {
      const previous = seen.get(entry.id);

      if (previous) {
        fail(
          filePath,
          `${group}[${index}] ${entry.id}: duplicate id already used by ${previous}`,
        );
      }

      seen.set(entry.id, `${group}[${index}]`);
    });
  }
}

export function getKbEntryCount(kb: KnowledgeBase): number {
  return (
    kb.faqs.length +
    kb.offerings.length +
    kb.policies.length +
    kb.dentistProfiles.length
  );
}

export function validateKbDataset(
  data: unknown,
  options: ValidateKbOptions,
): KnowledgeBase {
  const { filePath, kbSize } = options;

  if (!isRecord(data)) {
    fail(filePath, "KB dataset must be a JSON object");
  }

  const keys = Object.keys(data).sort();

  if (JSON.stringify(keys) !== JSON.stringify([...KB_TOP_LEVEL_KEYS].sort())) {
    fail(
      filePath,
      `top-level keys must be exactly ${KB_TOP_LEVEL_KEYS.join(", ")}`,
    );
  }

  const kb: KnowledgeBase = {
    faqs: requireArray(data, "faqs", filePath).map((entry, index) =>
      validateFaq(entry, index, filePath),
    ),
    offerings: requireArray(data, "offerings", filePath).map((entry, index) =>
      validateOffering(entry, index, filePath),
    ),
    policies: requireArray(data, "policies", filePath).map((entry, index) =>
      validatePolicy(entry, index, filePath),
    ),
    dentistProfiles: requireArray(data, "dentistProfiles", filePath).map(
      (entry, index) => validateDentistProfile(entry, index, filePath),
    ),
  };

  const entryCount = getKbEntryCount(kb);

  if (entryCount !== kbSize) {
    fail(filePath, `expected ${kbSize} atomic entries, found ${entryCount}`);
  }

  validateUniqueIds(kb, filePath);

  return kb;
}

function validateScenarioCategory(
  value: string,
  context: string,
  filePath: string,
): ScenarioCategory {
  if (!SCENARIO_CATEGORIES.includes(value as ScenarioCategory)) {
    fail(
      filePath,
      `${context}: category must be one of ${SCENARIO_CATEGORIES.join(", ")}`,
    );
  }

  return value as ScenarioCategory;
}

function validateScenarioInputType(
  value: string,
  context: string,
  filePath: string,
): ScenarioInputType {
  if (!SCENARIO_INPUT_TYPES.includes(value as ScenarioInputType)) {
    fail(
      filePath,
      `${context}: inputType must be one of ${SCENARIO_INPUT_TYPES.join(", ")}`,
    );
  }

  return value as ScenarioInputType;
}

function validateScenarioTurn(
  value: unknown,
  index: number,
  scenarioContext: string,
  filePath: string,
): ScenarioTurn {
  const context = `${scenarioContext}.turns[${index}]`;

  if (!isRecord(value)) {
    fail(filePath, `${context}: turn must be an object`);
  }

  validateExactKeys(value, SCENARIO_TURN_KEYS, context, filePath);

  if (value.turn !== index + 1) {
    fail(filePath, `${context}: turn must be ${index + 1}`);
  }

  return {
    turn: value.turn,
    userMessage: requireString(value, "userMessage", context, filePath),
    expectedBehavior: requireString(
      value,
      "expectedBehavior",
      context,
      filePath,
    ),
  };
}

function validateScenario(
  value: unknown,
  index: number,
  filePath: string,
): Scenario {
  const baseContext = `scenarios[${index}]`;

  if (!isRecord(value)) {
    fail(filePath, `${baseContext}: scenario must be an object`);
  }

  validateExactKeys(value, SCENARIO_REQUIRED_KEYS, baseContext, filePath);

  const id = requireString(value, "id", baseContext, filePath);
  const context = `${baseContext} ${id}`;
  const category = validateScenarioCategory(
    requireString(value, "category", context, filePath),
    context,
    filePath,
  );
  const inputType = validateScenarioInputType(
    requireString(value, "inputType", context, filePath),
    context,
    filePath,
  );
  const isMultiTurn = value.isMultiTurn;
  const turns = value.turns;

  if (typeof isMultiTurn !== "boolean") {
    fail(filePath, `${context}: isMultiTurn must be a boolean`);
  }

  if (!Array.isArray(turns)) {
    fail(filePath, `${context}: turns must be an array`);
  }

  if (!isMultiTurn && turns.length !== 1) {
    fail(filePath, `${context}: single-turn scenarios must have exactly one turn`);
  }

  if (isMultiTurn && turns.length <= 1) {
    fail(filePath, `${context}: multi-turn scenarios must have more than one turn`);
  }

  return {
    id,
    category,
    inputType,
    isMultiTurn,
    turns: turns.map((turn, turnIndex) =>
      validateScenarioTurn(turn, turnIndex, context, filePath),
    ),
  };
}

function validateUniqueScenarioIds(scenarios: Scenario[], filePath: string): void {
  const seen = new Map<string, string>();

  scenarios.forEach((scenario, index) => {
    const previous = seen.get(scenario.id);

    if (previous) {
      fail(
        filePath,
        `scenarios[${index}] ${scenario.id}: duplicate id already used by ${previous}`,
      );
    }

    seen.set(scenario.id, `scenarios[${index}]`);
  });
}

export function getScenarioTurnCount(scenarios: Scenario[]): number {
  return scenarios.reduce((total, scenario) => total + scenario.turns.length, 0);
}

export function validateScenarioDataset(
  data: unknown,
  options: ValidateScenarioOptions,
): Scenario[] {
  const { filePath } = options;

  if (!Array.isArray(data)) {
    fail(filePath, "scenario dataset must be a JSON array");
  }

  if (data.length !== OFFICIAL_SCENARIO_COUNT) {
    fail(
      filePath,
      `expected ${OFFICIAL_SCENARIO_COUNT} scenarios, found ${data.length}`,
    );
  }

  const scenarios = data.map((scenario, index) =>
    validateScenario(scenario, index, filePath),
  );

  validateUniqueScenarioIds(scenarios, filePath);

  return scenarios;
}
