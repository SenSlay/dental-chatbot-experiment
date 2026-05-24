# Evaluation Guide

Status: Evaluation is performed in Google Sheets, then imported into the app for analysis.

The experiment runner should be completed before evaluation UI is built.

## Purpose

This guide defines the rubric for evaluating generated assistant responses after pilot and official experiment runs.

The thesis methodology calls for rubric-based evaluation of:

- factual accuracy
- hallucination presence
- context retention in multi-turn conversations
- robustness across clean and noisy inputs

## Evaluation Workflow

Official experiment outputs should be evaluated by two independent evaluators using the same rubric.

If evaluators disagree, they should review the response jointly and record a consensus result.

Pilot runs may be evaluated informally for debugging, but pilot evaluations should not be mixed with official results.

Evaluation should be performed on the single completed official run selected as the final analysis run. Failed, incomplete, or superseded official runs should be preserved but excluded from thesis analysis.

Export the final analysis run to CSV and evaluate responses in Google Sheets or another spreadsheet tool. After scoring is complete, export the evaluated sheet back to CSV and import it into the app's Analysis page.

The exported CSV provides the raw generated responses and metadata needed for the thesis Results and Discussion chapters. Evaluators should add these exact scoring columns:

```txt
evaluator1AccuracyScore
evaluator1Hallucination
evaluator1ContextRetentionScore
evaluator1Notes
evaluator2AccuracyScore
evaluator2Hallucination
evaluator2ContextRetentionScore
evaluator2Notes
consensusAccuracyScore
consensusHallucination
consensusContextRetentionScore
consensusNotes
```

Evaluators should score independently in their own columns first. If their scores conflict, they should review the row together and record the agreed final values in the consensus columns.

After scoring, import the evaluated CSV into the Analysis page. The app uses the consensus columns to aggregate results by technique, KB size, scenario category, input type, and single-turn/multi-turn structure. These aggregates should be used to discuss factual accuracy, hallucination rate, token usage, latency, scalability, robustness, and contextual consistency.

## Evaluation Fields

Each generated assistant response should be evaluated using:

```txt
evaluator1AccuracyScore: 0 | 1 | 2
evaluator1Hallucination: true | false
evaluator1ContextRetentionScore: 0 | 1 | 2 | blank
evaluator1Notes
evaluator2AccuracyScore: 0 | 1 | 2
evaluator2Hallucination: true | false
evaluator2ContextRetentionScore: 0 | 1 | 2 | blank
evaluator2Notes
consensusAccuracyScore: 0 | 1 | 2
consensusHallucination: true | false
consensusContextRetentionScore: 0 | 1 | 2 | blank
consensusNotes
```

## Accuracy Score

`2` means fully correct.

The response directly answers the user's query, is consistent with the KB and conversation context, and does not omit important information.

`1` means partially correct.

The response is relevant but incomplete, vague, or missing important details.

`0` means incorrect.

The response is wrong, contradicts the KB, fails to answer the query, or misleads the user.

## Hallucination

`true` means the response includes unsupported information not found in the KB or conversation context.

Examples:

- invented price
- invented schedule
- invented policy
- invented service
- invented dentist availability

`false` means the response is grounded in the KB/conversation or appropriately asks for clarification.

## Context Retention Score

Use this mainly for multi-turn scenarios.

`2` means fully retained.

The response correctly uses prior information from the conversation.

`1` means partially retained.

The response remembers some prior context but misses an important detail.

`0` means not retained.

The response ignores or contradicts prior conversation context.

`null` means the score does not apply.

Use `null` for single-turn responses or responses where context retention does not apply.

## Derived Metrics

Accuracy percentage:

```txt
(total accuracy score / maximum possible accuracy score) x 100
```

Hallucination rate:

```txt
(responses with hallucination / total responses) x 100
```

Robustness drop:

```txt
accuracy_clean - accuracy_noisy
```

Scalability should be analyzed by comparing accuracy, hallucination rate, latency, and token usage across KB sizes 30, 100, and 300.
