# Maestro Full Coverage Plan

## Objective
Increase test coverage for critical ChartDB utilities, hooks, and business logic functions to ensure code quality and prevent regressions.

## Status Legend
- [ ] Pending
- [x] Completed
- [~] In Progress

## Phase 1: Core Utilities Testing

### 1.1 Clone Utilities
- [ ] Create tests for `src/lib/clone.ts`
  - Test `cloneTable` function with various table configurations
  - Test `cloneDiagram` function with complete diagrams
  - Test ID generation and mapping
  - Test error cases (missing IDs)

### 1.2 Color Utilities
- [ ] Create tests for `src/lib/colors.ts`
  - Test `randomColor` function
  - Test color constants
  - Verify color options array

### 1.3 Database Utilities
- [ ] Create tests for `src/lib/databases.ts`
  - Test database configuration functions
  - Test database type utilities

## Phase 2: Critical Hooks Testing

### 2.1 Debounce Hooks
- [ ] Create tests for `src/hooks/use-debounce.ts`
  - Test debounce functionality with various delays
  - Test cleanup on unmount
  - Test multiple rapid calls

### 2.2 History Management
- [ ] Create tests for `src/hooks/use-history.ts`
  - Test undo/redo functionality
  - Test history stack management

### 2.3 Storage Hooks
- [ ] Create tests for `src/hooks/use-storage.ts`
  - Test local storage integration
  - Test persistence
  - Test error handling

## Phase 3: Data Type Utilities

### 3.1 ClickHouse Data Types
- [ ] Create tests for `src/lib/data/data-types/clickhouse-data-types.ts`
  - Test data type mappings
  - Test validation functions

### 3.2 MySQL Data Types
- [ ] Create tests for MySQL data type utilities
  - Test type conversions
  - Test default values

## Phase 4: Validators Testing

### 4.1 SQL Validators
- [ ] Create tests for `src/lib/data/sql-import/validators/mysql-validator.ts`
  - Test SQL syntax validation
  - Test error reporting
  
- [ ] Create tests for validator utilities
  - Test common validation patterns
  - Test edge cases

## Phase 5: Domain Models

### 5.1 Database Capabilities
- [ ] Create tests for `src/lib/domain/database-capabilities.ts`
  - Test capability detection
  - Test feature flags per database type

### 5.2 Config Domain
- [ ] Create tests for `src/lib/domain/config.ts`
  - Test configuration management
  - Test default values

## Notes
- Focus on business logic and pure functions first
- UI components can be tested in a later phase
- Aim for at least 80% coverage on utility functions
- All tests should follow existing patterns in the codebase
