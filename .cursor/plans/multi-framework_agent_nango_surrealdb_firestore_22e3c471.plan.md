# Multi-Framework Agent: Nango, SurrealDB, Firestore Integration Plan

## Overview
Add support for SurrealDB and Firestore databases to ChartDB, along with Nango authentication integration for external APIs, and create a todos template example.

## Pending Todos

### Phase 5: Testing & Documentation (Optional Enhancements)
- [ ] Add unit tests for SurrealDB support
- [ ] Add unit tests for Firestore support
- [ ] Add integration tests for Nango authentication

## Completed Todos

### Phase 1: SurrealDB Support
- [x] Add SurrealDB as a supported database type in `src/lib/domain/database-type.ts`
- [x] Create SurrealDB data types definition in `src/lib/data/data-types/surrealdb-data-types.ts`
- [x] Update data type maps and compatibility
- [x] Add SurrealDB to database capabilities
- [x] Create SurrealDB template example

### Phase 2: Firestore Support
- [x] Add Firestore as a supported database type in `src/lib/domain/database-type.ts`
- [x] Create Firestore data types definition in `src/lib/data/data-types/firestore-data-types.ts`
- [x] Update data type maps and compatibility
- [x] Add Firestore to database capabilities
- [x] Create Firestore template example

### Phase 3: Nango Integration
- [x] Add Nango SDK dependency to package.json
- [x] Create Nango authentication context provider
- [x] Implement Nango connection management utilities
- [x] Add authentication UI components for Nango flows
- [x] Create Nango utility library for database connections
- [x] Create useNango custom hook

### Phase 4: Todos Template
- [x] Create todos database template with SurrealDB schema
- [x] Create todos database template with Firestore schema
- [x] Add todos examples to templates data
- [x] Register templates in templates-data.ts

### Phase 5: Documentation
- [x] Update documentation with new database support
- [x] Update README with Nango authentication details
- [x] Create comprehensive Nango integration guide
- [x] Add SurrealDB and Firestore to supported databases list
