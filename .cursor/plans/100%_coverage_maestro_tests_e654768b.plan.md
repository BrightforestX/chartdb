# 100% Test Coverage Plan for ChartDB

## Current Status
- Overall Coverage: 5.1%
- Files with 0% coverage: 532
- Target: 100% coverage

## Priority Areas

### Phase 1: Core Business Logic (lib/domain)
- [x] lib/domain/diff/* (area-diff, note-diff, field-diff, index-diff, relationship-diff, table-diff, diff.ts) - COMPLETED
- [ ] lib/domain/diagram-filter/* (filter.ts, diagram-filter.ts)
- [ ] lib/domain utility files (graph.ts, databases.ts)
- [ ] lib/utils/* (utils.ts, area-utils.ts)

### Phase 2: Data Layer
- [ ] lib/data/import-metadata/* (all import metadata utilities)
- [ ] lib/data/metadata-types/* (column-info, table-info, etc.)
- [ ] lib/data/metadata-scripts/* (database scripts)

### Phase 3: Hooks
- [ ] hooks/* (all custom hooks)

### Phase 4: Context Providers
- [ ] context/* (all context providers)

### Phase 5: Components & UI
- [ ] components/canvas/* (canvas components)
- [ ] components/side-panel/* (sidebar components)
- [ ] dialogs/* (all dialog components)
- [ ] pages/* (page components)

### Phase 6: Templates & Data
- [ ] templates-data/* (template definitions)
- [ ] i18n/* (i18n configuration)

## Test Strategy
1. Unit tests for pure functions and utilities
2. Integration tests for business logic
3. Component tests with React Testing Library
4. Mock external dependencies (APIs, storage, etc.)

## Notes
- Focus on critical paths first
- Ensure tests are meaningful, not just for coverage
- Use vitest and @testing-library/react
