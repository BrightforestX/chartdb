# Project Architecture Rules

## Overview
ChartDB follows a modular architecture with clear separation of concerns between UI components, business logic, and data layers.

## Directory Structure

### Core Directories
```
src/
├── components/          # Reusable UI components (Radix-based)
├── pages/              # Page-level components with routing
├── dialogs/            # Modal dialogs and overlays
├── lib/                # Business logic and utilities
│   ├── domain/         # Domain models and business rules
│   ├── data/           # Data access and parsing
│   └── utils/          # Utility functions
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── i18n/               # Internationalization
├── assets/             # Static assets
└── templates-data/     # Template diagrams
```

## File Naming Conventions

### Components
- **File names**: kebab-case (e.g., `button.tsx`, `alert-dialog.tsx`)
- **Component names**: PascalCase (e.g., `Button`, `AlertDialog`)
- **Test files**: `*.test.tsx` (e.g., `button.test.tsx`)
- **Style files**: Same name as component (e.g., `button.module.css`)

### Utilities and Hooks
- **Utility files**: kebab-case (e.g., `export-import-utils.ts`)
- **Hook files**: kebab-case with `use-` prefix (e.g., `use-sidebar.tsx`)
- **Type files**: kebab-case (e.g., `types.ts`)

### Constants
- **File names**: kebab-case (e.g., `database-constants.ts`)
- **Export names**: SCREAMING_SNAKE_CASE for constants, PascalCase for enums

## Component Organization

### UI Components (`src/components/`)
- Should be generic and reusable
- Must not contain business logic
- Should accept all necessary data via props
- May use context for theme/configuration only
- Example structure:
  ```
  button/
  ├── button.tsx              # Main component
  ├── button-variants.tsx      # CVA variants
  ├── button.test.tsx         # Tests
  └── index.ts                # Barrel export (optional)
  ```

### Page Components (`src/pages/`)
- Coordinate between UI components and business logic
- Handle routing and URL state
- Manage page-level state
- Connect to context providers
- Example: `editor-page/`, `diagram-page/`, `import-page/`

### Dialog Components (`src/dialogs/`)
- Self-contained modal interactions
- Include their own state management
- Should be lazy-loaded when possible
- Example: `export-sql-dialog/`, `import-database-dialog/`

## Business Logic Layer (`src/lib/`)

### Domain Layer (`src/lib/domain/`)
- Pure TypeScript domain models
- Business rules and validations
- No framework dependencies
- Example: table models, relationship models, diagram models

### Data Layer (`src/lib/data/`)
- SQL parsing and generation
- Database dialect handling
- Import/export logic
- Schema transformations
- Organized by concern: `sql-import/`, `sql-export/`, `dbml/`

### Utilities (`src/lib/utils/`)
- Pure utility functions
- No side effects
- Well-typed with generics
- Example: `cn()` for className merging

## Module Boundaries

### Import Rules
1. **Components can import:**
   - Other components (same or lower level)
   - Hooks
   - Utils
   - Types
   - Context (for consumption)

2. **Pages can import:**
   - Components
   - Dialogs
   - Hooks
   - Context
   - Lib (domain, data, utils)

3. **Lib can import:**
   - Other lib modules
   - External libraries only
   - NO React or UI framework code

4. **Context can import:**
   - Hooks
   - Lib
   - Types

### Forbidden Patterns
- ❌ Circular dependencies between modules
- ❌ Business logic in component files
- ❌ Direct DOM manipulation (use refs)
- ❌ Importing from parent directories with `../../..` (use path aliases)

## Path Aliases

Always use `@/` alias for imports from `src/`:
```typescript
// ✅ Good
import { Button } from '@/components/button/button';
import { cn } from '@/lib/utils';

// ❌ Bad
import { Button } from '../../../components/button/button';
import { cn } from '../../lib/utils';
```

## Code Organization Principles

### 1. Single Responsibility
Each file should have one primary purpose:
- One component per file
- One hook per file (with related helpers)
- Related utilities can be grouped

### 2. Colocation
Keep related files close:
- Component variants with components
- Component tests with components
- Type definitions with their implementations (when specific)

### 3. Layers and Dependencies
Follow the dependency flow:
```
UI Layer (components, pages, dialogs)
    ↓
Logic Layer (hooks, context)
    ↓
Domain Layer (lib/domain)
    ↓
Data Layer (lib/data)
    ↓
Utility Layer (lib/utils)
```

### 4. Feature Folders
For complex features, use feature folders:
```
editor-page/
├── canvas/
│   ├── canvas.tsx
│   ├── canvas-node/
│   ├── canvas-edge/
│   └── hooks/
├── sidebar/
└── toolbar/
```

## Database Dialect Support

When adding support for new database types:
1. Add dialect to `src/lib/databases.ts`
2. Create importer in `src/lib/data/sql-import/dialect-importers/`
3. Create exporter in `src/lib/data/sql-export/dialect-exporters/`
4. Add tests for import/export
5. Update documentation

## Best Practices

### Do's
- ✅ Use functional components with hooks
- ✅ Separate business logic into custom hooks
- ✅ Keep components small and focused
- ✅ Use TypeScript strict mode
- ✅ Colocate tests with code
- ✅ Use barrel exports sparingly (only for complex modules)

### Don'ts
- ❌ Don't create "mega components" with multiple responsibilities
- ❌ Don't mix UI and business logic in the same file
- ❌ Don't create deep component hierarchies (prefer composition)
- ❌ Don't use default exports (prefer named exports)
- ❌ Don't create circular dependencies

## Performance Considerations

- Lazy load dialogs and large pages
- Split vendor chunks appropriately
- Use React.memo for expensive components
- Colocate critical code paths
- Monitor bundle size with rollup-plugin-visualizer

## Examples

### Good Component Structure
```typescript
// src/components/data-table/data-table.tsx
import React from 'react';
import type { Column } from './types';
import { cn } from '@/lib/utils';

export interface DataTableProps {
    columns: Column[];
    data: unknown[];
    className?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
    columns,
    data,
    className,
}) => {
    // Implementation
    return <div className={cn('data-table', className)}>...</div>;
};
```

### Good Page Structure
```typescript
// src/pages/diagram-page/diagram-page.tsx
import React from 'react';
import { useDiagram } from '@/hooks/use-diagram';
import { Canvas } from './canvas/canvas';
import { Sidebar } from './sidebar/sidebar';

export const DiagramPage: React.FC = () => {
    const { diagram, updateDiagram } = useDiagram();

    return (
        <div className="diagram-page">
            <Sidebar diagram={diagram} />
            <Canvas diagram={diagram} onUpdate={updateDiagram} />
        </div>
    );
};
```

### Good Domain Model
```typescript
// src/lib/domain/table.ts
export interface Table {
    id: string;
    name: string;
    schema?: string;
    fields: Field[];
}

export function createTable(name: string): Table {
    return {
        id: nanoid(),
        name,
        fields: [],
    };
}
```
