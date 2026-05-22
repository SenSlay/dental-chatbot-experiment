# Project Spec

## Project Name

Dental Chatbot Experiment Runner

## Purpose

This app runs controlled experiments for a thesis comparing Prompt Engineering and Retrieval-Augmented Generation (RAG) for AI-based customer service in Philippine dental clinics.

The app should generate and log chatbot responses across different experimental conditions.

## Core Research Question

How do Prompt Engineering and RAG compare in terms of response accuracy, hallucination rate, scalability, computational efficiency, and contextual consistency in a multilingual dental clinic customer-service chatbot system?

## Core Experiment Conditions

The app must support:

### Techniques

- Prompt Engineering
- Retrieval-Augmented Generation

### Knowledge Base Sizes

- 30 entries
- 100 entries
- 300 entries

### Scenario Input Types

- clean
- noisy_taglish

### Scenario Structures

- single-turn
- multi-turn

### Scenario Count

- 60 fixed scenarios for official experiment runs

## Core Features

### Dataset Loading

Load:

- data/kb/kb_30.json
- data/kb/kb_100.json
- data/kb/kb_300.json
- data/scenarios/scenarios.json

### Experiment Runner

The runner should allow:

- run all techniques
- run selected technique only
- run all KB sizes
- run selected KB size only
- run all scenarios
- run selected scenario only, for debugging

Official runs should validate that the scenario file contains exactly 60 scenarios.

### Prompt Engineering Engine

Uses the full selected KB in the prompt.

### RAG Engine

Uses embeddings and cosine similarity to retrieve the top 5 relevant KB entries before generating the response.

### Logging

Every generated assistant response should be saved to the database with metadata.

### Results Page

The app should provide a page to:

- view experiment runs
- view generated responses
- filter by technique
- filter by KB size
- filter by scenario category
- filter by input type
- export results to CSV

## Non-Goals

This app should not include:

- user authentication
- real patient data
- real appointment booking
- live clinic integrations
- deployment requirements
- payment features
- production-grade customer support UI

## Development Priority

1. Dataset loading
2. Prompt Engineering engine
3. RAG engine
4. Experiment runner
5. Database logging
6. Results table
7. CSV export
8. Evaluation UI later
