# 160 IQ Cursor Rules Implementation Plan

This plan outlines the creation of comprehensive, intelligent development rules for the ChartDB project to enhance code quality, consistency, and developer productivity when using Cursor AI.

## Status: Completed ✅

## Todos

### 1. [x] Create Project Architecture Rules
**File**: `.cursor/rules/01-architecture.md`
- Define component structure and organization patterns
- Document the lib/domain/data layer separation
- Specify file naming conventions
- Define module boundaries and dependencies

### 2. [x] Create TypeScript Guidelines
**File**: `.cursor/rules/02-typescript.md`
- Enforce strict TypeScript usage patterns
- Define type import conventions (@typescript-eslint/consistent-type-imports)
- Document interface vs type usage
- Specify generic type patterns for React components

### 3. [x] Create React Component Guidelines
**File**: `.cursor/rules/03-react-components.md`
- Define component structure patterns (forwardRef, displayName)
- Document prop interface conventions
- Specify component composition patterns with Radix UI
- Define variant patterns using class-variance-authority

### 4. [x] Create Styling and CSS Guidelines
**File**: `.cursor/rules/04-styling.md`
- Document TailwindCSS usage patterns
- Define cn() utility usage for className merging
- Specify CSS modules best practices
- Document responsive design patterns

### 5. [x] Create State Management Guidelines
**File**: `.cursor/rules/05-state-management.md`
- Document context usage patterns
- Define custom hooks conventions
- Specify state lifting strategies
- Document IndexedDB/Dexie patterns

### 6. [x] Create Testing Standards
**File**: `.cursor/rules/06-testing.md`
- Define Vitest testing patterns
- Specify test file locations and naming
- Document Testing Library best practices
- Define coverage expectations

### 7. [x] Create Import/Export Conventions
**File**: `.cursor/rules/07-imports-exports.md`
- Document import ordering standards
- Define barrel exports patterns
- Specify path alias usage (@/)
- Document module resolution patterns

### 8. [x] Create Performance Guidelines
**File**: `.cursor/rules/08-performance.md`
- Document React optimization patterns (memo, useMemo, useCallback)
- Specify lazy loading strategies
- Define code splitting best practices
- Document bundle size considerations

### 9. [x] Create Error Handling Guidelines
**File**: `.cursor/rules/09-error-handling.md`
- Define error boundary patterns
- Document toast notification usage
- Specify async error handling
- Define validation with Zod patterns

### 10. [x] Create Internationalization Guidelines
**File**: `.cursor/rules/10-i18n.md`
- Document i18next usage patterns
- Define translation key conventions
- Specify language detection strategies
- Document RTL support patterns

### 11. [x] Create Database Schema Guidelines
**File**: `.cursor/rules/11-database-schemas.md`
- Document SQL parsing patterns
- Define database type handling
- Specify dialect-specific implementations
- Document import/export patterns

### 12. [x] Create AI Integration Guidelines
**File**: `.cursor/rules/12-ai-integration.md`
- Document AI SDK usage patterns
- Define streaming patterns
- Specify prompt engineering best practices
- Document model configuration

### 13. [x] Create Main Cursor Rules File
**File**: `.cursor/rules/.cursorrules`
- Create comprehensive master rules file
- Reference all individual rule files
- Include project-specific AI instructions
- Document code generation preferences

### 14. [x] Create Accessibility Guidelines
**File**: `.cursor/rules/13-accessibility.md`
- Document ARIA patterns with Radix UI
- Define keyboard navigation standards
- Specify screen reader considerations
- Document focus management

### 15. [x] Create Git and PR Guidelines
**File**: `.cursor/rules/14-git-workflow.md`
- Define commit message conventions
- Specify PR description standards
- Document branch naming patterns
- Define code review checklist

## Context

ChartDB is a web-based database diagramming editor built with:
- React 18 + TypeScript
- Vite for build tooling
- Radix UI for component primitives
- TailwindCSS for styling
- ReactFlow for diagram rendering
- Monaco Editor for code editing
- i18next for internationalization
- Dexie for IndexedDB
- Vitest for testing
- AI SDK for LLM integration

The project follows a strict ESLint + Prettier configuration with specific rules for React, TypeScript, accessibility, and Tailwind CSS.

## Success Criteria

- All 15 rule files created with comprehensive guidelines
- Rules are specific to ChartDB's architecture and patterns
- Rules enhance AI-assisted development without being overly restrictive
- Documentation is clear, actionable, and includes examples
- Rules align with existing ESLint/Prettier configurations
- All todos marked as completed
