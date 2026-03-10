# Client Project: Experimental AI Chat Application with Local Model Integration

<div align="left">
  <i>React · Vite · Docker · Bun · Elysia · pgAdmin · Ollama · Postgres</i>
</div>

## Required Disclaimer

This prototype was built as part of a client-student partnership through Codesmith's Future Code program. It explores solutions to a real-world case study provided by an external partner. # This work does not represent employment or contracting with the partner. All intellectual property belongs to the partner. This is a time-boxed MVP and not a production system.

## Table of Contents
- [Overview](#overview)
- [Why This Exists](#why-this-exists)
- [Architecture Summary](#architecture-summary)
- [Documentation](#documentation)

## Overview

This is my fork of OSP1-ClientProject. The original project can be found at: [https://github.com/kevinortiz43/Customer-support-AI-powered-product](https://github.com/kevinortiz43/Customer-support-AI-powered-product)

I architected the offline/local AI branch feature (backend), drove the project's cache-aside strategy, and orchestrated its OS-agnostic ETL pipeline for dynamically seeding the PostgreSQL database.

The goal was building a responsive AI chatbot using only free, open-source models running locally. Free models aren't as powerful as paid ones. Many of them on HuggingFace have no inference providers available so can only be run if downloaded directly. The question was: how useful could they be?

### Model Architecture

The offline AI setup uses 2 models:

- **Model 1**: Text-to-SQL model for query translation
- **Model 2**: Dual-purpose model
  - Generates human-friendly responses from returned results
  - Evaluates result quality

### Performance Optimization

This setup includes a preloading script for seamless model switching. Both models warm up when the application starts. If they load during a user request, the delay could be up to 11,873% longer (comparing 299 ms vs. 35.80 seconds).

## Why This Exists

- **Local inference**: No external API dependencies
- **Open source model comparison**: Evaluate performance of freely available models
- **GPU acceleration**: Optional GPU support (see docker-compose.yml)
- **Model preloading**: Optional script to pre-load both models
- **Hot-swappable models**: Switch models at runtime without restart

## Architecture Summary

### High-Level Patterns

- **Cache-aside pattern**: Optimize for frequent queries
- **Query routing**: Keyword text search vs AI path
- **Text-to-SQL model**: Natural language to database queries
- **Response generation model**: SQL results to human-readable text
- **LLM-as-Judge**: Automated quality evaluation
- **Non-blocking evaluation**: Async result scoring
- **Dynamic database seeding**: Automated ETL pipeline

### AI Implementation

The offline AI system uses a **compound-AI architecture**:
- **Text-to-SQL model** (7B): Translates natural language to PostgreSQL queries
- **Response model** (7B): Formats raw results into conversational answers
- **Judge model**: Asynchronously evaluates SQL quality without blocking users

**Request Flow**:
1. **Cache check**: Exact-match caching (5-minute TTL)
2. **Complexity routing**: Simple queries use keyword search; complex queries trigger SQL generation
3. **Response generation**: Results formatted into natural language
4. **Non-blocking evaluation**: SQL quality scored and logged asynchronously

> See [AI Architecture Deep Dive](ai-architecture.md) for flow diagrams and component details.

#### Prototype Status & Production Considerations

This system was built in under two weeks to **demonstrate architectural patterns**, not to be production-ready. Below is an honest assessment of where it stands and what a production version would require:

| Layer | Current Implementation | What Production Would Add |
|-------|------------------------|---------------------------|
| **Models** | Model 1 handles SQL generation, Model 2 handles response formatting & evaluation | Specialized fine-tuned models for each task with higher accuracy |
| **Security** | Basic SQL execution with SELECT-only enforcement | AI gateway with prompt injection detection, SQL injection prevention |
| **Validation** | LLM-as-Judge (asynchronous) with result count verification | Human-in-the-loop validation + semantic correctness metrics |
| **Caching** | Dual-layer: exact query match + keyword-based result caching (5-min TTL) | Semantic caching (cache by meaning) + partial result caching |
| **Data Privacy** | Full result visibility with SELECT-only restriction | PII redaction, row-level security, output guardrails |
| **Post-processing** | Regex-based SQL cleaning to handle model hallucinations | Fine-tuning reduces need for post-processing |
| **Scalability** | In-memory cache, single-node, rule-based routing | Distributed cache (Redis), horizontal scaling

**What Works Now**:
- Complete end-to-end pipeline from query to response
- Model specialization (separate models for SQL, dual-purpose model for response & evaluation)
- Non-blocking evaluation preserves user experience
- Local-first ensures data privacy and no API costs

**What I'd Explore Next**:
### What I'd Explore Next

| Priority | Direction | Why It Matters |
|----------|-----------|----------------|
| **Immediate** | Fine-tuning on real queries | Replace generic models with versions trained on actual usage patterns for higher accuracy |
| **Immediate** | Human-in-the-loop validation | Flag low-confidence SQL for human review; use corrections to continuously improve |
| **Near-term** | Semantic caching | Cache based on query meaning rather than exact text to improve hit rates at scale |
| **Near-term** | Agentic AI patterns | Evolve from single-turn SQL generation to agents that self-correct, ask questions, and handle multi-step queries |
| **Ongoing** | PII awareness & guardrails | Add detection/redaction of sensitive information; prevent prompt injection |
| **Ongoing** | Scalability | Distributed caching, horizontal scaling |

> **Note**: I'm currently learning about AI patterns.

### Dynamic Database Seeding

The PostgreSQL database can be dynamically seeded from raw Relay-like JSON files. Run `bun run setup` to execute the OS-agnostic ETL pipeline:

1. **Extract**: Parse ALL JSON files from `src/server/data/`
2. **Transform**: Convert JSON to CSV format
3. **Load**: Import data into PostgreSQL
4. **Generate**: Create TypeScript schemas from database types

**Requirements**: Input JSON must be relatively flat and follow consistent structure.

## Documentation

- [Setup Guide](setup.md) - Comprehensive setup guide
- [AI Architecture Deep Dive](ai-architecture.md) -Detailed AI flow documentation
- [GPU + Model Notes](gpu-model-notes.md) - Model specifications and VRAM requirements