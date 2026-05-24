"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { AppShell } from "@/app/ui/AppShell";
import {
  aggregateRowsToCsv,
  analyzeEvaluatedCsv,
  comparisonRowsToCsv,
} from "@/lib/analysis/evaluatedCsv";
import type {
  AggregateRow,
  AnalysisResult,
  ComparisonRow,
} from "@/lib/analysis/evaluatedCsv";

function formatMetric(value: number | null, suffix = ""): string {
  if (value == null) {
    return "N/A";
  }

  return `${value}${suffix}`;
}

function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function groupRowsByTable<T extends { table: string }>(rows: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  rows.forEach((row) => {
    grouped.set(row.table, [...(grouped.get(row.table) ?? []), row]);
  });

  return grouped;
}

function AggregateTable({ rows }: { rows: AggregateRow[] }) {
  const groupedRows = useMemo(() => groupRowsByTable(rows), [rows]);

  return (
    <>
      {[...groupedRows.entries()].map(([tableName, tableRows]) => (
        <section key={tableName} className="analysis-table-section">
          <h3>{tableName}</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Rows</th>
                  <th>Accuracy</th>
                  <th>Hallucination</th>
                  <th>Context</th>
                  <th>Latency</th>
                  <th>Tokens</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={`${row.table}-${row.group}`}>
                    <td>{row.group}</td>
                    <td>{row.responseCount}</td>
                    <td>
                      <div className="stacked-cell">
                        <strong>{formatMetric(row.accuracyPercent, "%")}</strong>
                        <span>Avg {formatMetric(row.averageAccuracyScore)}</span>
                      </div>
                    </td>
                    <td>{formatMetric(row.hallucinationRate, "%")}</td>
                    <td>
                      <div className="stacked-cell">
                        <strong>{formatMetric(row.contextRetentionPercent, "%")}</strong>
                        <span>
                          Avg {formatMetric(row.averageContextRetentionScore)}
                        </span>
                      </div>
                    </td>
                    <td>{formatMetric(row.averageLatencyMs, " ms")}</td>
                    <td>
                      <div className="stacked-cell">
                        <strong>{formatMetric(row.averageTotalTokens)}</strong>
                        <span>
                          In {formatMetric(row.averageInputTokens)} / Out{" "}
                          {formatMetric(row.averageOutputTokens)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}

function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  const groupedRows = useMemo(() => groupRowsByTable(rows), [rows]);

  return (
    <>
      {[...groupedRows.entries()].map(([tableName, tableRows]) => (
        <section key={tableName} className="analysis-table-section">
          <h3>{tableName}</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Accuracy Difference</th>
                  <th>Hallucination Difference</th>
                  <th>Latency Difference</th>
                  <th>Token Difference</th>
                  <th>Counts</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={`${row.table}-${row.group}`}>
                    <td>{row.group}</td>
                    <td>
                      <div className="stacked-cell">
                        <strong>{formatMetric(row.accuracyDifference, " pts")}</strong>
                        <span>
                          PE {formatMetric(row.promptEngineeringAccuracyPercent, "%")} /
                          RAG {formatMetric(row.ragAccuracyPercent, "%")}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="stacked-cell">
                        <strong>
                          {formatMetric(row.hallucinationRateDifference, " pts")}
                        </strong>
                        <span>
                          PE{" "}
                          {formatMetric(
                            row.promptEngineeringHallucinationRate,
                            "%",
                          )}{" "}
                          / RAG {formatMetric(row.ragHallucinationRate, "%")}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="stacked-cell">
                        <strong>{formatMetric(row.latencyDifferenceMs, " ms")}</strong>
                        <span>
                          PE {formatMetric(row.promptEngineeringAverageLatencyMs)} /
                          RAG {formatMetric(row.ragAverageLatencyMs)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="stacked-cell">
                        <strong>{formatMetric(row.totalTokensDifference)}</strong>
                        <span>
                          PE{" "}
                          {formatMetric(row.promptEngineeringAverageTotalTokens)} /
                          RAG {formatMetric(row.ragAverageTotalTokens)}
                        </span>
                      </div>
                    </td>
                    <td>
                      PE {row.promptEngineeringCount} / RAG {row.ragCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}

export default function AnalysisPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    setError(null);

    try {
      const text = await file.text();
      setAnalysis(analyzeEvaluatedCsv(text));
    } catch (readError) {
      setAnalysis(null);
      setError(
        readError instanceof Error
          ? readError.message
          : "Failed to read evaluated CSV.",
      );
    }
  }

  const canExport =
    analysis != null &&
    analysis.errors.length === 0 &&
    analysis.invalidScoreCount === 0;
  const overall = analysis?.aggregateRows.find((row) => row.table === "Overall");

  return (
    <AppShell>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Evaluated CSV Import</p>
          <h2>Analysis</h2>
          <p>
            Import the scored Google Sheets CSV, review consensus-based
            aggregates, and export summary tables for thesis analysis.
          </p>
        </div>
      </section>

      <section className="panel analysis-upload">
        <div>
          <h3>Upload Evaluated CSV</h3>
          <p>
            Analysis uses consensus columns as the official scores. Evaluator 1
            and evaluator 2 columns are checked only to support the evaluation
            process.
          </p>
        </div>
        <label className="file-input">
          <input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
          <span>{fileName ?? "Choose evaluated CSV"}</span>
        </label>
      </section>

      {error && <div className="notice notice-error">{error}</div>}

      {analysis && (
        <>
          <section className="analysis-grid">
            <div className="summary-card">
              <span>Rows</span>
              <strong>{analysis.rowCount}</strong>
            </div>
            <div className="summary-card">
              <span>Valid scored rows</span>
              <strong>{analysis.scoredRowCount}</strong>
            </div>
            <div className="summary-card">
              <span>Invalid or missing scores</span>
              <strong>{analysis.invalidScoreCount}</strong>
            </div>
            <div className="summary-card">
              <span>Overall accuracy</span>
              <strong>{formatMetric(overall?.accuracyPercent ?? null, "%")}</strong>
            </div>
            <div className="summary-card">
              <span>Hallucination rate</span>
              <strong>{formatMetric(overall?.hallucinationRate ?? null, "%")}</strong>
            </div>
            <div className="summary-card">
              <span>Average total tokens</span>
              <strong>{formatMetric(overall?.averageTotalTokens ?? null)}</strong>
            </div>
          </section>

          {analysis.errors.length > 0 && (
            <section className="notice notice-error">
              <strong>Import errors</strong>
              <ul>
                {analysis.errors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {analysis.warnings.length > 0 && (
            <section className="notice notice-warning">
              <strong>Warnings</strong>
              <ul>
                {analysis.warnings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {analysis.errors.length === 0 && analysis.invalidScoreCount > 0 && (
            <section className="notice notice-error">
              <strong>Export disabled</strong>
              <p>
                Some rows are missing or have invalid consensus scores. Fix the
                evaluated CSV and import it again before exporting thesis
                summaries.
              </p>
            </section>
          )}

          <section className="panel">
            <div className="panel-heading row-heading">
              <div>
                <h3>Aggregate Tables</h3>
                <p>
                  These tables use consensus scores and include automatic
                  latency/token metrics from the original run export.
                </p>
              </div>
              <div className="table-actions">
                <button
                  className="secondary-button"
                  disabled={!canExport}
                  onClick={() =>
                    downloadCsv(
                      "analysis-aggregates.csv",
                      aggregateRowsToCsv(analysis.aggregateRows),
                    )
                  }
                >
                  Export Aggregate CSV
                </button>
                <button
                  className="secondary-button"
                  disabled={!canExport}
                  onClick={() =>
                    downloadCsv(
                      "analysis-technique-comparison.csv",
                      comparisonRowsToCsv(analysis.comparisonRows),
                    )
                  }
                >
                  Export Comparison CSV
                </button>
              </div>
            </div>

            {analysis.aggregateRows.length === 0 ? (
              <p className="empty-state">No valid scored rows to analyze.</p>
            ) : (
              <AggregateTable rows={analysis.aggregateRows} />
            )}
          </section>

          <section className="panel">
            <div className="panel-heading">
              <h3>PE vs RAG Comparison</h3>
              <p>
                Differences are calculated as RAG minus Prompt Engineering. For
                hallucination, lower is better.
              </p>
            </div>
            {analysis.comparisonRows.length === 0 ? (
              <p className="empty-state">
                No matching Prompt Engineering and RAG groups found.
              </p>
            ) : (
              <ComparisonTable rows={analysis.comparisonRows} />
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
