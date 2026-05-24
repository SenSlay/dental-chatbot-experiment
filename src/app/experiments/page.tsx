"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/ui/AppShell";
import {
  formatDateTime,
  formatStatus,
  formatTechnique,
  readApiData,
} from "@/app/ui/api";
import type {
  ExperimentRunSummary,
  RunStatus,
  RunType,
  ScenarioSummary,
  Technique,
} from "@/app/ui/types";

const KB_SIZES = [30, 100, 300] as const;
const TECHNIQUES: Technique[] = ["PROMPT_ENGINEERING", "RAG"];
const RUN_STATUSES: RunStatus[] = ["PENDING", "RUNNING", "COMPLETED", "FAILED"];
const SCENARIO_CATEGORIES = [
  "general_inquiry",
  "service_question",
  "appointment_booking",
  "rescheduling_cancellation",
  "ambiguous_query",
];
const SCENARIO_INPUT_TYPES = ["clean", "noisy_taglish"];

type RunFilters = {
  runType: "" | RunType;
  status: "" | RunStatus;
  isFinalAnalysis: "" | "true" | "false";
};

type RunForm = {
  name: string;
  runType: RunType;
  kbSizes: number[];
  techniques: Technique[];
  scenarioIds: string[];
  notes: string;
};

type ScenarioPickerFilters = {
  category: string;
  inputType: string;
  structure: "" | "single" | "multi";
  search: string;
};

const defaultForm: RunForm = {
  name: "",
  runType: "PILOT",
  kbSizes: [30],
  techniques: ["PROMPT_ENGINEERING"],
  scenarioIds: ["scenario_001"],
  notes: "",
};

const defaultScenarioFilters: ScenarioPickerFilters = {
  category: "",
  inputType: "",
  structure: "",
  search: "",
};

function buildRunFilterQuery(filters: RunFilters): string {
  const params = new URLSearchParams();

  if (filters.runType) {
    params.set("runType", filters.runType);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.isFinalAnalysis) {
    params.set("isFinalAnalysis", filters.isFinalAnalysis);
  }

  return params.toString();
}

function toggleArrayValue<T>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function statusTone(status: RunStatus): string {
  if (status === "COMPLETED") {
    return "tone-success";
  }

  if (status === "FAILED") {
    return "tone-danger";
  }

  if (status === "RUNNING") {
    return "tone-info";
  }

  return "tone-neutral";
}

function scenarioStructureLabel(scenario: ScenarioSummary): string {
  return scenario.isMultiTurn
    ? `Multi-turn (${scenario.turnCount} turns)`
    : "Single-turn";
}

function shuffleScenarioIds(scenarios: ScenarioSummary[], count: number): string[] {
  return scenarios
    .map((scenario) => ({ id: scenario.id, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, count)
    .map((scenario) => scenario.id)
    .sort();
}

export default function ExperimentsPage() {
  const [runs, setRuns] = useState<ExperimentRunSummary[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [filters, setFilters] = useState<RunFilters>({
    runType: "",
    status: "",
    isFinalAnalysis: "",
  });
  const [scenarioFilters, setScenarioFilters] = useState<ScenarioPickerFilters>(
    defaultScenarioFilters,
  );
  const [form, setForm] = useState<RunForm>(defaultForm);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runQuery = useMemo(() => buildRunFilterQuery(filters), [filters]);
  const officialMode = form.runType === "OFFICIAL";
  const filteredScenarios = useMemo(() => {
    const search = scenarioFilters.search.trim().toLowerCase();

    return scenarios.filter((scenario) => {
      if (scenarioFilters.category && scenario.category !== scenarioFilters.category) {
        return false;
      }

      if (scenarioFilters.inputType && scenario.inputType !== scenarioFilters.inputType) {
        return false;
      }

      if (scenarioFilters.structure === "single" && scenario.isMultiTurn) {
        return false;
      }

      if (scenarioFilters.structure === "multi" && !scenario.isMultiTurn) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        scenario.id.toLowerCase().includes(search) ||
        scenario.firstUserMessage.toLowerCase().includes(search)
      );
    });
  }, [scenarioFilters, scenarios]);

  async function loadRuns(options: { clearError?: boolean } = {}): Promise<void> {
    setIsLoadingRuns(true);

    if (options.clearError ?? true) {
      setError(null);
    }

    try {
      const path = runQuery ? `/api/experiments?${runQuery}` : "/api/experiments";
      const data = await readApiData<ExperimentRunSummary[]>(await fetch(path));
      setRuns(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load runs.");
    } finally {
      setIsLoadingRuns(false);
    }
  }

  useEffect(() => {
    void loadRuns();
  }, [runQuery]);

  useEffect(() => {
    async function loadScenarios(): Promise<void> {
      setIsLoadingScenarios(true);

      try {
        const data = await readApiData<ScenarioSummary[]>(
          await fetch("/api/scenarios"),
        );
        setScenarios(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load scenarios.",
        );
      } finally {
        setIsLoadingScenarios(false);
      }
    }

    void loadScenarios();
  }, []);

  function setScenarioSelection(scenarioIds: string[]): void {
    setForm({ ...form, scenarioIds });
  }

  function toggleScenarioSelection(scenarioId: string): void {
    setScenarioSelection(toggleArrayValue(form.scenarioIds, scenarioId).sort());
  }

  function pickRandomScenarios(count: number): void {
    const candidates = filteredScenarios.length > 0 ? filteredScenarios : scenarios;
    setScenarioSelection(shuffleScenarioIds(candidates, count));
  }

  async function submitRun(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!form.name.trim()) {
      setError("Run name is required.");
      return;
    }

    if (!officialMode && form.kbSizes.length === 0) {
      setError("Select at least one KB size for a pilot run.");
      return;
    }

    if (!officialMode && form.techniques.length === 0) {
      setError("Select at least one technique for a pilot run.");
      return;
    }

    if (!officialMode && form.scenarioIds.length === 0) {
      setError("Select at least one scenario for a pilot run.");
      return;
    }

    const body =
      form.runType === "OFFICIAL"
        ? {
            name: form.name.trim(),
            runType: form.runType,
            notes: form.notes.trim() || null,
          }
        : {
            name: form.name.trim(),
            runType: form.runType,
            kbSizes: form.kbSizes,
            techniques: form.techniques,
            scenarioIds: form.scenarioIds,
            notes: form.notes.trim() || null,
          };

    setIsSubmitting(true);

    try {
      const result = await readApiData<{
        experimentRunId: string;
        status: RunStatus;
        generatedResponses: number;
      }>(
        await fetch("/api/experiments/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      );

      setMessage(
        `Run ${result.experimentRunId} finished with ${formatStatus(
          result.status,
        )} status and ${result.generatedResponses} generated responses.`,
      );
      setForm(defaultForm);
      await loadRuns();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to start run.",
      );
      await loadRuns({ clearError: false });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function markFinalAnalysis(experimentRunId: string): Promise<void> {
    setError(null);
    setMessage(null);

    try {
      await readApiData<ExperimentRunSummary>(
        await fetch("/api/experiments/final-analysis", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ experimentRunId }),
        }),
      );
      setMessage("Final analysis run updated.");
      await loadRuns();
    } catch (markError) {
      setError(
        markError instanceof Error
          ? markError.message
          : "Failed to mark final analysis run.",
      );
    }
  }

  return (
    <AppShell>
      <section className="page-heading">
        <div>
          <h2>Experiments</h2>
          <p>
            Start controlled pilot runs, review run history, and choose the
            completed official run used for final thesis analysis.
          </p>
        </div>
        <button className="secondary-button" onClick={() => void loadRuns()}>
          Refresh
        </button>
      </section>

      {(message || error) && (
        <div className={error ? "notice notice-error" : "notice notice-success"}>
          {error ?? message}
        </div>
      )}

      <section className="split-layout">
        <form className="panel run-form" onSubmit={(event) => void submitRun(event)}>
          <div className="panel-heading">
            <h3>Start Run</h3>
            <p>Pilot runs are best for demos and checks. Official runs stay fixed.</p>
          </div>

          <label className="field">
            <span>Run name</span>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Pilot: one scenario smoke test"
            />
          </label>

          <div className="field">
            <span>Run type</span>
            <div className="segmented-control">
              {(["PILOT", "OFFICIAL"] as RunType[]).map((runType) => (
                <button
                  key={runType}
                  type="button"
                  className={form.runType === runType ? "selected" : ""}
                  onClick={() => setForm({ ...form, runType })}
                >
                  {formatStatus(runType)}
                </button>
              ))}
            </div>
          </div>

          <fieldset className="choice-group" disabled={officialMode}>
            <legend>KB sizes</legend>
            {KB_SIZES.map((kbSize) => (
              <label key={kbSize} className="check-row">
                <input
                  type="checkbox"
                  checked={officialMode || form.kbSizes.includes(kbSize)}
                  onChange={() =>
                    setForm({
                      ...form,
                      kbSizes: toggleArrayValue(form.kbSizes, kbSize),
                    })
                  }
                />
                <span>{kbSize} entries</span>
              </label>
            ))}
          </fieldset>

          <fieldset className="choice-group" disabled={officialMode}>
            <legend>Techniques</legend>
            {TECHNIQUES.map((technique) => (
              <label key={technique} className="check-row">
                <input
                  type="checkbox"
                  checked={officialMode || form.techniques.includes(technique)}
                  onChange={() =>
                    setForm({
                      ...form,
                      techniques: toggleArrayValue(form.techniques, technique),
                    })
                  }
                />
                <span>{formatTechnique(technique)}</span>
              </label>
            ))}
          </fieldset>

          {!officialMode && (
            <section className="scenario-picker">
              <div className="picker-heading">
                <div>
                  <h4>Scenarios</h4>
                  <p>
                    {form.scenarioIds.length} selected from {scenarios.length}
                  </p>
                </div>
                <button
                  type="button"
                  className="table-button"
                  onClick={() => setScenarioFilters(defaultScenarioFilters)}
                >
                  Reset filters
                </button>
              </div>

              <div className="scenario-filter-grid">
                <label className="field">
                  <span>Category</span>
                  <select
                    value={scenarioFilters.category}
                    onChange={(event) =>
                      setScenarioFilters({
                        ...scenarioFilters,
                        category: event.target.value,
                      })
                    }
                  >
                    <option value="">All</option>
                    {SCENARIO_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Input</span>
                  <select
                    value={scenarioFilters.inputType}
                    onChange={(event) =>
                      setScenarioFilters({
                        ...scenarioFilters,
                        inputType: event.target.value,
                      })
                    }
                  >
                    <option value="">All</option>
                    {SCENARIO_INPUT_TYPES.map((inputType) => (
                      <option key={inputType} value={inputType}>
                        {inputType}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Type</span>
                  <select
                    value={scenarioFilters.structure}
                    onChange={(event) =>
                      setScenarioFilters({
                        ...scenarioFilters,
                        structure: event.target
                          .value as ScenarioPickerFilters["structure"],
                      })
                    }
                  >
                    <option value="">All</option>
                    <option value="single">Single-turn</option>
                    <option value="multi">Multi-turn</option>
                  </select>
                </label>

                <label className="field search-field">
                  <span>Search</span>
                  <input
                    value={scenarioFilters.search}
                    onChange={(event) =>
                      setScenarioFilters({
                        ...scenarioFilters,
                        search: event.target.value,
                      })
                    }
                    placeholder="scenario_001 or opening hours"
                  />
                </label>
              </div>

              <div className="picker-actions">
                <button
                  type="button"
                  className="table-button"
                  disabled={isLoadingScenarios || filteredScenarios.length === 0}
                  onClick={() => pickRandomScenarios(1)}
                >
                  Pick 1 random
                </button>
                <button
                  type="button"
                  className="table-button"
                  disabled={isLoadingScenarios || filteredScenarios.length === 0}
                  onClick={() => pickRandomScenarios(5)}
                >
                  Pick 5 random
                </button>
                <button
                  type="button"
                  className="table-button"
                  disabled={isLoadingScenarios || filteredScenarios.length === 0}
                  onClick={() => pickRandomScenarios(10)}
                >
                  Pick 10 random
                </button>
                <button
                  type="button"
                  className="table-button"
                  disabled={isLoadingScenarios || scenarios.length === 0}
                  onClick={() => setScenarioSelection(scenarios.map((item) => item.id))}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="table-button"
                  onClick={() => setScenarioSelection([])}
                >
                  Clear
                </button>
              </div>

              <div className="selected-scenarios" aria-label="Selected scenarios">
                {form.scenarioIds.length === 0 ? (
                  <span>No scenarios selected</span>
                ) : (
                  form.scenarioIds.map((scenarioId) => (
                    <span key={scenarioId} className="badge tone-accent">
                      {scenarioId}
                    </span>
                  ))
                )}
              </div>

              <div className="scenario-list">
                {isLoadingScenarios ? (
                  <div className="scenario-empty">Loading scenarios...</div>
                ) : filteredScenarios.length === 0 ? (
                  <div className="scenario-empty">No scenarios match the filters.</div>
                ) : (
                  filteredScenarios.map((scenario) => (
                    <label key={scenario.id} className="scenario-row">
                      <input
                        type="checkbox"
                        checked={form.scenarioIds.includes(scenario.id)}
                        onChange={() => toggleScenarioSelection(scenario.id)}
                      />
                      <span>
                        <strong>{scenario.id}</strong>
                        <small>
                          {scenario.category} / {scenario.inputType} /{" "}
                          {scenarioStructureLabel(scenario)}
                        </small>
                        <em>{scenario.firstUserMessage}</em>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </section>
          )}

          <label className="field">
            <span>Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Purpose, setup, or reminder for this run"
              rows={3}
            />
          </label>

          {officialMode && (
            <div className="quiet-box">
              Official mode uses all KB sizes, both techniques, and all 60
              scenarios for 504 generated assistant responses.
            </div>
          )}

          <button className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Running..." : "Start Experiment Run"}
          </button>
        </form>

        <section className="panel">
          <div className="panel-heading">
            <h3>Run History</h3>
            <p>Newest runs first. Mark only completed official runs as final.</p>
          </div>

          <div className="filter-grid compact">
            <label className="field">
              <span>Run type</span>
              <select
                value={filters.runType}
                onChange={(event) =>
                  setFilters({ ...filters, runType: event.target.value as RunFilters["runType"] })
                }
              >
                <option value="">All</option>
                <option value="PILOT">Pilot</option>
                <option value="OFFICIAL">Official</option>
              </select>
            </label>

            <label className="field">
              <span>Status</span>
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters({ ...filters, status: event.target.value as RunFilters["status"] })
                }
              >
                <option value="">All</option>
                {RUN_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Final</span>
              <select
                value={filters.isFinalAnalysis}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    isFinalAnalysis: event.target
                      .value as RunFilters["isFinalAnalysis"],
                  })
                }
              >
                <option value="">All</option>
                <option value="true">Final only</option>
                <option value="false">Not final</option>
              </select>
            </label>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Status</th>
                  <th>Results</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingRuns ? (
                  <tr>
                    <td colSpan={5}>Loading runs...</td>
                  </tr>
                ) : runs.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No experiment runs found.</td>
                  </tr>
                ) : (
                  runs.map((run) => (
                    <tr key={run.id}>
                      <td>
                        <div className="stacked-cell">
                          <strong>{run.name}</strong>
                          <span>{run.id}</span>
                          <span>{formatStatus(run.runType)}</span>
                          {run.isFinalAnalysis && (
                            <span className="badge tone-accent">Final analysis</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${statusTone(run.status)}`}>
                          {formatStatus(run.status)}
                        </span>
                      </td>
                      <td>{run._count.results}</td>
                      <td>{formatDateTime(run.createdAt)}</td>
                      <td>
                        <div className="table-actions">
                          <a
                            className="table-button"
                            href={`/api/export?experimentRunId=${encodeURIComponent(
                              run.id,
                            )}`}
                          >
                            Export CSV
                          </a>
                          <button
                            className="table-button"
                            disabled={
                              run.runType !== "OFFICIAL" ||
                              run.status !== "COMPLETED" ||
                              run.isFinalAnalysis
                            }
                            onClick={() => void markFinalAnalysis(run.id)}
                          >
                            Mark final
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </AppShell>
  );
}
