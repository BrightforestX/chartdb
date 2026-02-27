# TypeScript Guidelines

## Overview
ChartDB uses TypeScript in strict mode to ensure type safety and catch errors at compile time. Follow these guidelines to maintain consistent, type-safe code.

## TypeScript Configuration

The project uses strict TypeScript settings:
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true
}
```

All code must pass these strict checks.

## Type vs Interface

### Use Interface for:
- Component props
- Object shapes that may be extended
- Public APIs
- React component interfaces

```typescript
// ✅ Good - Component props
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
}

// ✅ Good - Extendable object shapes
export interface Table {
    id: string;
    name: string;
    fields: Field[];
}
```

### Use Type for:
- Union types
- Intersection types
- Mapped types
- Function signatures
- Type aliases for primitives

```typescript
// ✅ Good - Union types
export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite' | 'mssql';

// ✅ Good - Intersection types
export type TableWithMetadata = Table & { createdAt: Date; updatedAt: Date };

// ✅ Good - Mapped types
export type Partial<T> = { [P in keyof T]?: T[P] };

// ✅ Good - Function signatures
export type UpdateFunction = (id: string, data: Partial<Table>) => void;
```

## Type Imports

**Always use type imports for types and interfaces** (enforced by ESLint):

```typescript
// ✅ Good - Type import
import type { FC } from 'react';
import type { Table, Field } from '@/lib/domain/table';

// ✅ Good - Mixed import
import { useState } from 'react';
import type { FC } from 'react';

// ❌ Bad - Regular import for types
import { FC } from 'react';
import { Table, Field } from '@/lib/domain/table';
```

## Generic Types

### React Component Generics

Use generics for flexible, reusable components:

```typescript
// ✅ Good - Generic component
export interface DataTableProps<TData> {
    data: TData[];
    columns: Column<TData>[];
    onRowClick?: (row: TData) => void;
}

export function DataTable<TData>({
    data,
    columns,
    onRowClick,
}: DataTableProps<TData>) {
    // Implementation
}
```

### Function Generics

```typescript
// ✅ Good - Generic utility function
export function groupBy<T, K extends keyof T>(
    items: T[],
    key: K
): Record<string, T[]> {
    return items.reduce((acc, item) => {
        const group = String(item[key]);
        acc[group] = acc[group] || [];
        acc[group].push(item);
        return acc;
    }, {} as Record<string, T[]>);
}
```

## React Component Types

### Functional Components

```typescript
// ✅ Good - Function declaration with explicit return type
export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
    return <button {...props}>{children}</button>;
};

// ✅ Also good - Without FC (more flexible)
export function Button({ children, ...props }: ButtonProps): JSX.Element {
    return <button {...props}>{children}</button>;
}
```

### ForwardRef Components

```typescript
// ✅ Good - Properly typed forwardRef
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn('input', className)}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = 'Input';
```

### Component Props with Children

```typescript
// ✅ Good - Explicit children type
export interface CardProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
}

// ✅ Good - Extending HTML attributes
export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
}
```

## Hooks Typing

### useState

```typescript
// ✅ Good - Explicit type
const [count, setCount] = useState<number>(0);

// ✅ Good - Type inference for simple cases
const [isOpen, setIsOpen] = useState(false);

// ✅ Good - Complex state with type
interface FormState {
    name: string;
    email: string;
}
const [form, setForm] = useState<FormState>({ name: '', email: '' });

// ✅ Good - Nullable state
const [user, setUser] = useState<User | null>(null);
```

### useRef

```typescript
// ✅ Good - DOM ref
const inputRef = useRef<HTMLInputElement>(null);

// ✅ Good - Mutable ref
const countRef = useRef<number>(0);

// ✅ Good - Callback ref
const setRef = (node: HTMLDivElement | null) => {
    if (node) {
        // Do something with node
    }
};
```

### Custom Hooks

```typescript
// ✅ Good - Typed custom hook
export function useDiagram(diagramId: string): {
    diagram: Diagram | null;
    loading: boolean;
    error: Error | null;
    updateDiagram: (updates: Partial<Diagram>) => Promise<void>;
} {
    const [diagram, setDiagram] = useState<Diagram | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Implementation

    return { diagram, loading, error, updateDiagram };
}
```

## Async/Promise Types

```typescript
// ✅ Good - Promise return type
export async function fetchDiagram(id: string): Promise<Diagram> {
    const response = await fetch(`/api/diagrams/${id}`);
    return response.json();
}

// ✅ Good - Async function with error handling
export async function saveDiagram(
    diagram: Diagram
): Promise<{ success: boolean; error?: string }> {
    try {
        await db.diagrams.put(diagram);
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
```

## Type Assertions

### Use Type Assertions Sparingly

```typescript
// ✅ Good - Type assertion when necessary
const data = JSON.parse(jsonString) as Diagram;

// ✅ Good - Type guard instead of assertion
function isDiagram(value: unknown): value is Diagram {
    return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'tables' in value
    );
}

if (isDiagram(data)) {
    // TypeScript knows data is Diagram here
}

// ❌ Bad - Unnecessary assertion
const result = calculateTotal(items) as number; // calculateTotal already returns number
```

### As Const

```typescript
// ✅ Good - Readonly values
export const DATABASE_TYPES = [
    'postgresql',
    'mysql',
    'sqlite',
    'mssql',
] as const;
export type DatabaseType = (typeof DATABASE_TYPES)[number];

// ✅ Good - Readonly object
export const COLORS = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
} as const;
```

## Utility Types

Use TypeScript utility types effectively:

```typescript
// ✅ Good - Partial for updates
export function updateTable(id: string, updates: Partial<Table>): void {
    // Implementation
}

// ✅ Good - Pick for subset
export type TableMetadata = Pick<Table, 'id' | 'name' | 'schema'>;

// ✅ Good - Omit for exclusion
export type NewTable = Omit<Table, 'id'>;

// ✅ Good - Record for maps
export type TableMap = Record<string, Table>;

// ✅ Good - Required for all required
export type CompleteConfig = Required<Config>;

// ✅ Good - Readonly for immutable
export type ImmutableTable = Readonly<Table>;
```

## Discriminated Unions

```typescript
// ✅ Good - Discriminated union for different states
export type ApiState<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: Error };

// Usage
function handleState<T>(state: ApiState<T>): void {
    switch (state.status) {
        case 'idle':
            // No data or error
            break;
        case 'loading':
            // Show loading
            break;
        case 'success':
            // Access state.data (type-safe)
            console.log(state.data);
            break;
        case 'error':
            // Access state.error (type-safe)
            console.error(state.error);
            break;
    }
}
```

## Avoid 'any'

```typescript
// ❌ Bad - Using any
function processData(data: any): any {
    return data.map((item: any) => item.value);
}

// ✅ Good - Proper typing
function processData<T extends { value: unknown }>(data: T[]): unknown[] {
    return data.map((item) => item.value);
}

// ✅ Good - Unknown for truly unknown types
function parseJson(jsonString: string): unknown {
    return JSON.parse(jsonString);
}

// Then use type guards to narrow
function isUser(value: unknown): value is User {
    return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'name' in value
    );
}
```

## Type Guards

```typescript
// ✅ Good - Type guard for narrowing
export function isTable(value: unknown): value is Table {
    return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        typeof (value as Table).id === 'string' &&
        'name' in value &&
        typeof (value as Table).name === 'string'
    );
}

// ✅ Good - Type guard for null checking
export function isNotNull<T>(value: T | null): value is T {
    return value !== null;
}

// Usage
const tables: (Table | null)[] = [...];
const validTables = tables.filter(isNotNull); // Type: Table[]
```

## Enum vs Union Types

Prefer union types over enums:

```typescript
// ✅ Preferred - Union type
export type Status = 'pending' | 'active' | 'completed';

// ⚠️ Acceptable - Enum (only if needed for iteration)
export enum Status {
    Pending = 'pending',
    Active = 'active',
    Completed = 'completed',
}
```

## Function Overloads

```typescript
// ✅ Good - Function overloads for different signatures
export function createElement(tag: 'table'): HTMLTableElement;
export function createElement(tag: 'div'): HTMLDivElement;
export function createElement(tag: string): HTMLElement;
export function createElement(tag: string): HTMLElement {
    return document.createElement(tag);
}
```

## Type-Safe Event Handlers

```typescript
// ✅ Good - Typed event handlers
export interface FormProps {
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

// ✅ Good - Custom event types
export type TableSelectEvent = {
    tableId: string;
    timestamp: number;
};

export interface CanvasProps {
    onTableSelect: (event: TableSelectEvent) => void;
}
```

## Best Practices Summary

### Do's
- ✅ Use strict TypeScript mode
- ✅ Use type imports for types and interfaces
- ✅ Prefer interfaces for object shapes
- ✅ Prefer type for unions and intersections
- ✅ Use generics for reusable logic
- ✅ Use type guards instead of assertions
- ✅ Use utility types (Partial, Pick, Omit, etc.)
- ✅ Use discriminated unions for complex states
- ✅ Type all function parameters and return values

### Don'ts
- ❌ Don't use 'any' (use 'unknown' if truly unknown)
- ❌ Don't disable TypeScript checks
- ❌ Don't use type assertions unnecessarily
- ❌ Don't create overly complex types
- ❌ Don't use enums unless necessary
- ❌ Don't ignore TypeScript errors
- ❌ Don't use non-null assertion (!) unless absolutely certain
