"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/ui/AppShell";
import {
  compactText,
  formatDateTime,
  formatTechnique,
  readApiData,
} from "@/app/ui/api";
import type {
  ExperimentResultRow,
  ExperimentRunSummary,
  ResultsPayload,
  Technique,
} from "@/app/ui/types";

const CATEGORY_OPTIONS = [
  "general_inquiry",
  "service_question",
  "appointment_booking",
  "rescheduling_cancellation",
  "ambiguous_query",
];
const INPUT_TYPE_OPTIONS = ["clean", "noisy_taglish"];
const LIMIT = 100;

type ResultFilters = {
  experimentRunId: string;
  technique: "" | Technique;
  kbSize: "" | "30" | "100" | "300";
  scenarioCategory: string;
  inputType: string;
  scenarioId: string;
  hasError: "" | "true" | "false";
};

const defaultFilters: ResultFilters = {
  experimentRunId: "",
  technique: "",
  kbSize: "",
  scenarioCategory: "",
  inputType: "",
  scenarioId: "",
  hasError: "",
};

function buildResultQuery(filters: ResultFilters, offset?: number): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  if (offset != null) {
    params.set("limit", String(LIMIT));
    params.set("offset", String(offset));
  }

  return params.toString();
}

function prettyJson(value: unknown): string {
  if (value == null) {
    return "No retrieved context.";
  }

  return JSON.stringify(value, null, 2);
}

function tokenSummary(row: ExperimentResultRow): string {
  if (row.totalTokens == null) {
    return "Not logged";
  }

  return `${row.totalTokens} total`;
}

export default function ResultsPage() {
  const [runs, setRuns] = useState<ExperimentRunSummary[]>([]);
  const [filters, setFilters] = useState<ResultFilters>(defaultFilters);
  const [offset, setOffset] = useState(0);
  const [results, setResults] = useState<ResultsPayload>({
    items: [],
    total: 0,
    limit: LIMIT,
    offset: 0,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resultQuery = useMemo(
    () => buildResultQuery(filters, offset),
    [filters, offset],
  );
  const exportHref = useMemo(() => {
    const query = buildResultQuery(filters);
    return query ? `/api/export?${query}` : "/api/export";
  }, [filters]);
  const canGoBack = offset > 0;
  const canGoForward = offset + LIMIT < results.total;

  async function loadRuns(): Promise<void> {
    try {
      const data = await readApiData<ExperimentRunSummary[]>(
        await fetch("/api/experiments"),
      );
      setRuns(data);
    } catch {
      setRuns([]);
    }
  }

  async function loadResults(): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const data = await readApiData<ResultsPayload>(
        await fetch(`/api/results?${resultQuery}`),
      );
      setResults(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load results.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRuns();
  }, []);

  useEffect(() => {
    void loadResults();
  }, [resultQuery]);

  function updateFilter<Key extends keyof ResultFilters>(
    key: Key,
    value: ResultFilters[Key],
  ): void {
    setFilters({ ...filters, [key]: value });
    setOffset(0);
    setExpandedId(null);
  }

  return (
    <AppShell>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Response Review</p>
          <h2>Results</h2>
          <p>
            Browse generated assistant responses, inspect expected behavior and
            RAG context, then export filtered rows for analysis.
          </p>
        </div>
        <a className="primary-link" href={exportHref}>
          Export CSV
        </a>
      </section>

      {error && <div className="notice notice-error">{error}</div>}

      <section className="panel">
        <div className="panel-heading">
          <h3>Filters</h3>
          <p>{results.total} response rows match the current filters.</p>
        </div>

        <div className="filter-grid">
          <label className="field">
            <span>Experiment run</span>
            <select
              value={filters.experimentRunId}
              onChange={(event) =>
                updateFilter("experimentRunId", event.target.value)
              }
            >
              <option value="">All runs</option>
              {runs.map((run) => (
                <option key={run.id} value={run.id}>
                  {run.name} ({run._count.results})
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Technique</span>
            <select
              value={filters.technique}
              onChange={(event) =>
                updateFilter("technique", event.target.value as ResultFilters["technique"])
              }
            >
              <option value="">All</option>
              <option value="PROMPT_ENGINEERING">Prompt Engineering</option>
              <option value="RAG">RAG</option>
            </select>
          </label>

          <label className="field">
            <span>KB size</span>
            <select
              value={filters.kbSize}
              onChange={(event) =>
                updateFilter("kbSize", event.target.value as ResultFilters["kbSize"])
              }
            >
              <option value="">All</option>
              <option value="30">30</option>
              <option value="100">100</option>
              <option value="300">300</option>
            </select>
          </label>

          <label className="field">
            <span>Category</span>
            <select
              value={filters.scenarioCategory}
              onChange={(event) =>
                updateFilter("scenarioCategory", event.target.value)
              }
            >
              <option value="">All</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Input type</span>
            <select
              value={filters.inputType}
              onChange={(event) => updateFilter("inputType", event.target.value)}
            >
              <option value="">All</option>
              {INPUT_TYPE_OPTIONS.map((inputType) => (
                <option key={inputType} value={inputType}>
                  {inputType}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Error</span>
            <select
              value={filters.hasError}
              onChange={(event) =>
                updateFilter(
                  "hasError",
                  event.target.value as ResultFilters["hasError"],
                )
              }
            >
              <option value="">All</option>
              <option value="true">Errors only</option>
              <option value="false">No errors</option>
            </select>
          </label>

          <label className="field">
            <span>Scenario ID</span>
            <input
              value={filters.scenarioId}
              onChange={(event) => updateFilter("scenarioId", event.target.value)}
              placeholder="scenario_001"
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading row-heading">
          <div>
            <h3>Generated Responses</h3>
            <p>
              Showing {results.items.length} rows from offset {offset}.
            </p>
          </div>
          <div className="pagination">
            <button
              className="secondary-button"
              disabled={!canGoBack}
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
            >
              Previous
            </button>
            <button
              className="secondary-button"
              disabled={!canGoForward}
              onClick={() => setOffset(offset + LIMIT)}
            >
              Next
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Run</th>
                <th>Scenario</th>
                <th>Technique</th>
                <th>Metrics</th>
                <th>Response</th>
                <th>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6}>Loading results...</td>
                </tr>
              ) : results.items.length === 0 ? (
                <tr>
                  <td colSpan={6}>No results found.</td>
                </tr>
              ) : (
                results.items.map((row) => (
                  <Fragment key={row.id}>
                    <tr>
                      <td>
                        <div className="stacked-cell">
                          <strong>{row.experimentRun.name}</strong>
                          <span>{row.experimentRun.runType}</span>
                          {row.experimentRun.isFinalAnalysis && (
                            <span className="badge tone-accent">Final</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="stacked-cell">
                          <strong>{row.scenarioId}</strong>
                          <span>{row.scenarioCategory}</span>
                          <span>
                            {row.inputType}, turn {row.turnNumber}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="stacked-cell">
                          <strong>{formatTechnique(row.technique)}</strong>
                          <span>{row.kbSize} KB entries</span>
                        </div>
                      </td>
                      <td>
                        <div className="stacked-cell">
                          <span>{row.latencyMs ?? "No"} ms</span>
                          <span>{tokenSummary(row)}</span>
                          {row.error && <span className="badge tone-danger">Error</span>}
                        </div>
                      </td>
                      <td>{compactText(row.assistantResponse)}</td>
                      <td>
                        <button
                          className="table-button"
                          onClick={() =>
                            setExpandedId(expandedId === row.id ? null : row.id)
                          }
                        >
                          {expandedId === row.id ? "Close" : "Open"}
                        </button>
                      </td>
                    </tr>
                    {expandedId === row.id && (
                      <tr className="detail-row">
                        <td colSpan={6}>
                          <div className="result-detail">
                            <div>
                              <h4>User Message</h4>
                              <p>{row.userMessage}</p>
                            </div>
                            <div>
                              <h4>Expected Behavior</h4>
                              <p>{row.expectedBehavior}</p>
                            </div>
                            <div>
                              <h4>Assistant Response</h4>
                              <p>{row.assistantResponse ?? "No response recorded."}</p>
                            </div>
                            {row.error && (
                              <div>
                                <h4>Error</h4>
                                <p>{row.error}</p>
                              </div>
                            )}
                            <div>
                              <h4>Retrieved Context</h4>
                              <pre>{prettyJson(row.retrievedContextJson)}</pre>
                            </div>
                            <div className="detail-meta">
                              Logged {formatDateTime(row.createdAt)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
