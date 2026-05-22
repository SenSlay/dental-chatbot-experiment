CREATE UNIQUE INDEX "ExperimentRun_single_final_analysis_idx"
ON "ExperimentRun" ("isFinalAnalysis")
WHERE "isFinalAnalysis" = true;
