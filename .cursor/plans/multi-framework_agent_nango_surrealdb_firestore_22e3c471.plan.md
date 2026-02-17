# Multi-Framework Agent: Nango, SurrealDB, Firestore Integration Plan

## Overview
Add support for SurrealDB and Firestore databases to ChartDB, along with Nango authentication integration for external APIs, and create a todos template example.

## Pending Todos

### Phase 1: SurrealDB Support
- [ ] Add SurrealDB as a supported database type in `src/lib/domain/database-type.ts`
- [ ] Create SurrealDB data types definition in `src/lib/data/data-types/surrealdb-data-types.ts`
- [ ] Implement SurrealDB import query generation in database clients
- [ ] Add SurrealDB export capabilities
- [ ] Create SurrealDB template example

### Phase 2: Firestore Support
- [ ] Add Firestore as a supported database type in `src/lib/domain/database-type.ts`
- [ ] Create Firestore data types definition in `src/lib/data/data-types/firestore-data-types.ts`
- [ ] Implement Firestore schema import utilities
- [ ] Add Firestore export capabilities
- [ ] Create Firestore template example

### Phase 3: Nango Integration
- [ ] Add Nango SDK dependency to package.json
- [ ] Create Nango authentication context provider
- [ ] Implement Nango connection management utilities
- [ ] Add authentication UI components for Nango flows
- [ ] Integrate Nango with database connection flows

### Phase 4: Todos Template
- [ ] Create todos database template with SurrealDB schema
- [ ] Create todos database template with Firestore schema
- [ ] Add todos examples to templates data
- [ ] Update templates UI to include todos examples

### Phase 5: Testing & Documentation
- [ ] Add unit tests for SurrealDB support
- [ ] Add unit tests for Firestore support
- [ ] Add integration tests for Nango authentication
- [ ] Update documentation with new database support
- [ ] Update README with Nango authentication details

## Completed Todos
