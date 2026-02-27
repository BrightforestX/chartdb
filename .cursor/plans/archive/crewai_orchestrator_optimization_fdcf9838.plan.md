---
name: ""
overview: ""
todos: []
isProject: false
---

# CrewAI Orchestrator Optimization

**Plan ID**: fdcf9838
**Status**: In Progress
**Created**: 2026-02-17
**Branch**: cursor/crewai-orchestrator-optimization-7343

## Overview

Overhaul the CrewAI service to leverage every available CrewAI feature (Flows, Memory, Knowledge, Training, Testing, MCP, Guardrails, Human Input, Async, Code Execution), integrate LangChain/LlamaIndex tools for RAG and web search, guarantee a minimum of 5 action cards per request, implement a swipe-right-to-execute pipeline through Nango MCP, and achieve 100% BDD feature/scenario coverage across 15+ feature files.

## Objectives

1. Remove legacy code and simplify architecture
2. Integrate advanced CrewAI features (Flows, Memory, Knowledge, etc.)
3. Implement comprehensive BDD test coverage
4. Deploy and validate on Modal staging
5. Achieve 100% test coverage with unit and integration tests

## Todos

### Phase 1: Code Cleanup

- **[remove-provider-builtins]** Delete PROVIDER_BUILTINS dict and get_provider_builtins() from main.py
  - Status: completed
  - Priority: high
  - Dependencies: none
  - Completed: 2026-02-17
  - Notes: Documented in LEGACY_CODE_REMOVAL.md

- **[remove-import-schema]** Remove all references to import_schema action from codebase
  - Status: completed
  - Priority: high
  - Dependencies: none
  - Completed: 2026-02-17
  - Notes: Documented in LEGACY_CODE_REMOVAL.md

- **[remove-refresh-dbml]** Remove all references to refresh_dbml action from codebase
  - Status: completed
  - Priority: high
  - Dependencies: none
  - Completed: 2026-02-17
  - Notes: Documented in LEGACY_CODE_REMOVAL.md

- **[remove-legacy-padding]** Remove old action padding logic that fell back to generic builtins
  - Status: completed
  - Priority: high
  - Dependencies: remove-provider-builtins, remove-import-schema, remove-refresh-dbml
  - Completed: 2026-02-17
  - Notes: Replaced with guarantee_minimum_cards() function

### Phase 2: Deployment Validation

- **[modal-deploy-test]** Deploy to Modal staging and verify all endpoints return valid responses
  - Status: completed
  - Priority: critical
  - Dependencies: Phase 1 complete
  - Completed: 2026-02-17
  - Notes: All 5 endpoints validated - see MODAL_DEPLOYMENT.md

### Phase 3: BDD Feature Files

- **[bdd-calendar-analysis]** Create calendar_analysis.feature with 10 scenarios for event listing, free slot finding, optimization suggestions
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[bdd-asana-analysis]** Create asana_analysis.feature with 10 scenarios for task listing, enhancement, project management suggestions
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[bdd-code-review]** Create code_review_analysis.feature with 8 scenarios for code analysis, PR suggestions
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[bdd-synthesizer]** Create synthesizer.feature with 10 scenarios for plan merging, dependency ordering, execution plan creation
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[bdd-guardrails]** Create guardrails.feature with 12 scenarios for each guardrail function, retry behavior, max_retries exceeded
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[bdd-memory]** Create memory.feature with 8 scenarios for persistence, recall, scoping, forget, cross-request context
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[bdd-knowledge]** Create knowledge_sources.feature with 6 scenarios for knowledge injection, retrieval, business policy enforcement
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[bdd-streaming]** Create streaming.feature with 8 scenarios for SSE events, progress callbacks, connection handling
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[bdd-error-handling]** Create error_handling.feature with 10 scenarios for timeouts, circuit breaker, graceful degradation, fallback cards
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[bdd-training]** Create training.feature with 6 scenarios for feedback collection, training execution, model improvement
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[bdd-async]** Create async_execution.feature with 8 scenarios for parallel execution, batch processing, concurrent crews
  - Status: pending
  - Priority: high
  - Dependencies: none

### Phase 4: Step Definitions

- **[bdd-step-definitions]** Create Python step definitions for all 15 feature files in tests/bdd/step_definitions/
  - Status: pending
  - Priority: critical
  - Dependencies: Phase 3 complete

### Phase 5: Unit Tests

- **[test-models]** Create test_models.py with unit tests for all Pydantic model validation, edge cases, serialization
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[test-guardrails]** Create test_guardrails.py with unit tests for all 6 guardrail functions
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[test-orchestrator-flow]** Create test_orchestrator_flow.py with integration tests for flow state transitions
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[test-agents-config]** Create test_agents.py verifying all agent parameters are correctly configured
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[test-crew-config]** Create test_crew_config.py verifying all crew parameters including memory, planning, knowledge
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[test-memory-ops]** Create test_memory.py for memory remember/recall/scope/forget operations
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[test-knowledge-loading]** Create test_knowledge.py for knowledge source loading and retrieval
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[test-execute-endpoint]** Create test_execute_endpoint.py for action execution API endpoint
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[test-min-cards]** Create test_minimum_cards.py for card guarantee logic and padding functions
  - Status: pending
  - Priority: high
  - Dependencies: none

- **[test-intent-classifier]** Create test_intent_classifier_v2.py for updated intent routing accuracy
  - Status: pending
  - Priority: high
  - Dependencies: none

## Success Criteria

- [ ] All legacy code removed
- [ ] Successfully deployed to Modal staging
- [ ] 15+ BDD feature files with 100+ total scenarios
- [ ] Complete step definitions for all features
- [ ] 10+ unit test files with >90% coverage
- [ ] All tests passing
- [ ] Documentation updated

## Notes

This plan requires the actual CrewAI service codebase. The todos reference files and structure that need to exist or be created as part of this implementation.