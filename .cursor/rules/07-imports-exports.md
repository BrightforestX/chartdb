# Import/Export Conventions

## Overview
Consistent import and export patterns improve code readability and maintainability. Follow these conventions throughout the ChartDB codebase.

## Import Organization

### Import Order

Organize imports in this order (enforced by ESLint):

1. External libraries (React, third-party packages)
2. Type imports from external libraries
3. Internal absolute imports (@/)
4. Type imports from internal modules
5. Relative imports
6. Type imports from relative paths
7. CSS/Style imports

```typescript
// ✅ Good - Properly ordered imports
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import * as Dialog from '@radix-ui/react-dialog';

// 2. Type imports from external
import type { FC } from 'react';
import type { VariantProps } from 'class-variance-authority';

// 3. Internal absolute imports
import { Button } from '@/components/button/button';
import { cn } from '@/lib/utils';
import { db } from '@/lib/database';

// 4. Type imports from internal
import type { Diagram } from '@/lib/domain/diagram';
import type { Table } from '@/lib/domain/table';

// 5. Relative imports
import { TableRow } from './table-row';
import { useTableSelection } from './use-table-selection';

// 6. Type imports from relative
import type { TableRowProps } from './table-row';

// 7. Style imports
import styles from './component.module.css';
```

## Type Imports

**Always use `import type` for types and interfaces** (enforced by ESLint):

```typescript
// ✅ Good - Type imports
import type { FC, ReactNode } from 'react';
import type { Diagram, Table } from '@/lib/domain';

// ❌ Bad - Regular import for types
import { FC, ReactNode } from 'react';
import { Diagram, Table } from '@/lib/domain';
```

### Mixed Imports

When importing both values and types from the same module:

```typescript
// ✅ Good - Separate imports
import { useState } from 'react';
import type { FC } from 'react';

// ✅ Also acceptable - Inline type import
import { useState, type FC } from 'react';
```

## Path Aliases

**Always use the `@/` alias** for imports from `src/`:

```typescript
// ✅ Good - Path alias
import { Button } from '@/components/button/button';
import { cn } from '@/lib/utils';
import type { Diagram } from '@/lib/domain/diagram';

// ❌ Bad - Relative imports to src
import { Button } from '../../../components/button/button';
import { cn } from '../../lib/utils';
```

### When to Use Relative Imports

Use relative imports only for files in the same directory or subdirectories:

```typescript
// ✅ Good - Same directory
import { TableRow } from './table-row';
import { useTableSelection } from './hooks/use-table-selection';

// ✅ Good - Subdirectory
import { CanvasNode } from './canvas/canvas-node';

// ❌ Bad - Going up directories (use @ alias instead)
import { Button } from '../../components/button/button';
```

## Export Patterns

### Named Exports (Preferred)

Use named exports for all modules:

```typescript
// ✅ Good - Named exports
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (props, ref) => {
        // Implementation
    }
);

export interface ButtonProps {
    // Props definition
}

export const buttonVariants = cva(/* ... */);

// Usage
import { Button, buttonVariants } from '@/components/button/button';
```

### Default Exports (Avoid)

Avoid default exports as they make refactoring harder:

```typescript
// ❌ Bad - Default export
export default function Button(props: ButtonProps) {
    // Implementation
}

// Problems with default exports:
// - Can be imported with any name
// - Harder to search for in codebase
// - Don't work well with tree-shaking
```

### Re-exporting (Barrel Exports)

Use barrel exports sparingly, only for complex modules:

```typescript
// ✅ Good - Barrel export for related components
// @/components/dialog/index.ts
export { Dialog, DialogTrigger, DialogContent } from './dialog';
export { DialogHeader, DialogTitle } from './dialog-header';
export { DialogFooter } from './dialog-footer';
export type { DialogProps } from './dialog';

// Usage
import { Dialog, DialogTrigger, DialogContent } from '@/components/dialog';

// ⚠️ Use cautiously - Can slow down development HMR
// Don't create barrel exports for every directory
```

### When to Use Barrel Exports

```typescript
// ✅ Good - Compound components (Radix-style)
// components/accordion/index.ts
export {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from './accordion';

// ✅ Good - Related domain models
// lib/domain/index.ts
export type { Diagram } from './diagram';
export type { Table } from './table';
export type { Field } from './field';
export type { Relationship } from './relationship';

// ❌ Bad - Every single file
// components/index.ts (DON'T DO THIS)
export * from './button/button';
export * from './input/input';
export * from './card/card';
// ... (causes slow HMR and unclear dependencies)
```

## Import Grouping

Group related imports together:

```typescript
// ✅ Good - Grouped imports
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { FC, ReactNode, MouseEvent } from 'react';

import { Button, Input, Card } from '@/components';
import { cn } from '@/lib/utils';
import { db } from '@/lib/database';

import type { Diagram } from '@/lib/domain/diagram';
import type { Table, Field } from '@/lib/domain/table';
```

## Namespace Imports

Use namespace imports for Radix UI primitives:

```typescript
// ✅ Good - Namespace import for Radix
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import * as Tooltip from '@radix-ui/react-tooltip';

// Then use
<Dialog.Root>
    <Dialog.Trigger />
    <Dialog.Content />
</Dialog.Root>

// ✅ Also acceptable - Named imports for frequently used
import { Root as DialogRoot, Trigger as DialogTrigger } from '@radix-ui/react-dialog';
```

## Dynamic Imports

Use dynamic imports for code splitting:

```typescript
// ✅ Good - Lazy load dialogs
const ExportDialog = React.lazy(() => import('@/dialogs/export-dialog'));

// ✅ Good - Conditional imports
async function loadDatabaseImporter(type: DatabaseType) {
    switch (type) {
        case 'postgresql':
            return import('@/lib/data/importers/postgresql');
        case 'mysql':
            return import('@/lib/data/importers/mysql');
        default:
            throw new Error(`Unknown database type: ${type}`);
    }
}
```

## Side Effect Imports

```typescript
// ✅ Good - CSS imports
import '@/styles/globals.css';

// ✅ Good - Side effect for setup
import '@/lib/i18n/config';

// ⚠️ Document why side effect is needed
// This import initializes the database connection
import '@/lib/database/init';
```

## Circular Dependencies

Avoid circular dependencies:

```typescript
// ❌ Bad - Circular dependency
// file-a.ts
import { functionB } from './file-b';
export function functionA() { /* uses functionB */ }

// file-b.ts
import { functionA } from './file-a';
export function functionB() { /* uses functionA */ }

// ✅ Good - Extract shared code
// shared.ts
export function sharedFunction() { /* ... */ }

// file-a.ts
import { sharedFunction } from './shared';
export function functionA() { /* uses sharedFunction */ }

// file-b.ts
import { sharedFunction } from './shared';
export function functionB() { /* uses sharedFunction */ }
```

## Type-Only Files

For type-only files, use clear naming:

```typescript
// ✅ Good - types.ts for type definitions
// types.ts
export interface User {
    id: string;
    name: string;
}

export type UserRole = 'admin' | 'user' | 'guest';

// Import with type modifier
import type { User, UserRole } from './types';
```

## Constants and Enums

```typescript
// ✅ Good - constants.ts for constant values
// constants.ts
export const DATABASE_TYPES = [
    'postgresql',
    'mysql',
    'sqlite',
    'mssql',
] as const;

export const MAX_TABLES = 100;
export const DEFAULT_THEME = 'light';

// Import as regular (not type) imports
import { DATABASE_TYPES, MAX_TABLES } from './constants';
```

## Module Resolution

TypeScript uses `baseUrl` and `paths` for resolution:

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

This allows:
```typescript
import { Button } from '@/components/button/button';
// Resolves to: ./src/components/button/button.tsx
```

## Import from Package Subpaths

Be specific with package imports:

```typescript
// ✅ Good - Import from specific path
import { cva } from 'class-variance-authority';
import { nanoid } from 'nanoid';

// ⚠️ Sometimes necessary for better tree-shaking
import Button from '@mui/material/Button';

// ❌ Bad - Don't import everything
import * as _ from 'lodash'; // Use lodash-es or specific imports
```

## Best Practices Summary

### Do's
- ✅ Use `import type` for types and interfaces
- ✅ Use `@/` path alias for src imports
- ✅ Order imports consistently (external → internal → relative)
- ✅ Use named exports
- ✅ Group related imports together
- ✅ Use namespace imports for Radix UI
- ✅ Use dynamic imports for code splitting
- ✅ Keep imports organized and readable
- ✅ Use barrel exports for compound components
- ✅ Document side-effect imports

### Don'ts
- ❌ Don't use default exports
- ❌ Don't use relative imports for src files
- ❌ Don't mix values and types in imports (unless inline)
- ❌ Don't create circular dependencies
- ❌ Don't create barrel exports for everything
- ❌ Don't import entire libraries unnecessarily
- ❌ Don't use wildcard exports (export *)
- ❌ Don't forget to organize imports

## Examples

### Complete Import Section

```typescript
// External libraries
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { nanoid } from 'nanoid';

// Type imports from external
import type { FC } from 'react';

// Internal imports
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import { Card } from '@/components/card/card';
import { cn } from '@/lib/utils';
import { db } from '@/lib/database';
import { useDiagram } from '@/hooks/use-diagram';

// Type imports from internal
import type { Diagram } from '@/lib/domain/diagram';
import type { Table } from '@/lib/domain/table';

// Relative imports
import { TableRow } from './table-row';
import { useTableSelection } from './hooks';

// Type imports from relative
import type { TableRowProps } from './table-row';

// Styles
import styles from './component.module.css';
```

### Complete Export Section

```typescript
// Types first
export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
}

// Then constants/utilities
export const buttonVariants = cva(/* ... */);

// Then component
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (props, ref) => {
        // Implementation
        return <button ref={ref} {...props} />;
    }
);
Button.displayName = 'Button';
```
