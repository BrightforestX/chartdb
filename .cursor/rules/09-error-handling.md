# Error Handling Guidelines

## Overview
Robust error handling is critical for ChartDB. Follow these guidelines to handle errors gracefully and provide good user experience.

## Error Types

### Classification

```typescript
// ✅ Good - Define error types
export class ValidationError extends Error {
    constructor(message: string, public field?: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class DatabaseError extends Error {
    constructor(message: string, public code?: string) {
        super(message);
        this.name = 'DatabaseError';
    }
}

export class NetworkError extends Error {
    constructor(message: string, public statusCode?: number) {
        super(message);
        this.name = 'NetworkError';
    }
}
```

## Try-Catch Blocks

### Async Functions

```typescript
// ✅ Good - Proper error handling
export async function saveDiagram(diagram: Diagram): Promise<void> {
    try {
        await db.diagrams.put(diagram);
        toast.success('Diagram saved successfully');
    } catch (error) {
        console.error('Failed to save diagram:', error);
        toast.error('Failed to save diagram. Please try again.');
        throw error; // Re-throw if caller needs to handle
    }
}

// ✅ Good - Handle specific errors differently
export async function loadDiagram(id: string): Promise<Diagram> {
    try {
        const diagram = await db.diagrams.get(id);
        if (!diagram) {
            throw new Error(`Diagram not found: ${id}`);
        }
        return diagram;
    } catch (error) {
        if (error instanceof Dexie.DatabaseClosedError) {
            // Reopen database
            await db.open();
            return loadDiagram(id); // Retry
        }
        throw error;
    }
}
```

### Error Type Checking

```typescript
// ✅ Good - Type-safe error handling
try {
    await someOperation();
} catch (error) {
    if (error instanceof ValidationError) {
        toast.error(`Validation failed: ${error.field}`);
    } else if (error instanceof NetworkError) {
        toast.error(`Network error: ${error.statusCode}`);
    } else if (error instanceof Error) {
        toast.error(error.message);
    } else {
        toast.error('An unknown error occurred');
    }
}

// ✅ Good - Type guard for errors
function isValidationError(error: unknown): error is ValidationError {
    return error instanceof ValidationError;
}
```

## React Error Boundaries

### Error Boundary Component

```typescript
// ✅ Good - Error boundary
import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: (error: Error) => React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('Error caught by boundary:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback(this.state.error!);
            }

            return (
                <div className="error-boundary">
                    <h2>Something went wrong</h2>
                    <details>
                        <summary>Error details</summary>
                        <pre>{this.state.error?.message}</pre>
                    </details>
                    <button onClick={() => this.setState({ hasError: false })}>
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// Usage
<ErrorBoundary fallback={(error) => <ErrorFallback error={error} />}>
    <DiagramCanvas />
</ErrorBoundary>
```

## Validation with Zod

### Schema Validation

```typescript
import { z } from 'zod';

// ✅ Good - Define schemas
export const TableSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1, 'Table name is required'),
    schema: z.string().optional(),
    fields: z.array(FieldSchema),
});

export const DiagramSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    databaseType: z.enum(['postgresql', 'mysql', 'sqlite', 'mssql']),
    tables: z.array(TableSchema),
    createdAt: z.date(),
    updatedAt: z.date(),
});

// ✅ Good - Validate data
export function validateDiagram(data: unknown): Diagram {
    try {
        return DiagramSchema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
            throw new ValidationError(messages.join(', '));
        }
        throw error;
    }
}

// ✅ Good - Safe parsing
export function parseDiagram(data: unknown): Diagram | null {
    const result = DiagramSchema.safeParse(data);
    if (result.success) {
        return result.data;
    }
    console.error('Validation failed:', result.error);
    return null;
}
```

### Form Validation

```typescript
// ✅ Good - Form with validation
export const CreateDiagramForm: React.FC = () => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrors({});

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name') as string,
            databaseType: formData.get('databaseType') as string,
        };

        try {
            const validated = DiagramSchema.parse({
                ...data,
                id: nanoid(),
                tables: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await createDiagram(validated);
            toast.success('Diagram created');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Record<string, string> = {};
                error.errors.forEach(err => {
                    const field = err.path[0] as string;
                    fieldErrors[field] = err.message;
                });
                setErrors(fieldErrors);
            } else {
                toast.error('Failed to create diagram');
            }
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Input
                name="name"
                label="Diagram Name"
                error={errors.name}
            />
            {/* Other fields */}
        </form>
    );
};
```

## Toast Notifications

### Using Toast for User Feedback

```typescript
import { toast } from '@/components/toast';

// ✅ Good - Success message
export async function saveDiagram(diagram: Diagram): Promise<void> {
    try {
        await db.diagrams.put(diagram);
        toast.success('Diagram saved successfully');
    } catch (error) {
        toast.error('Failed to save diagram');
        throw error;
    }
}

// ✅ Good - Error with details
try {
    await importDiagram(file);
    toast.success('Diagram imported successfully');
} catch (error) {
    toast.error('Failed to import diagram', {
        description: error instanceof Error ? error.message : 'Unknown error',
    });
}

// ✅ Good - Loading state
const toastId = toast.loading('Importing diagram...');
try {
    await importDiagram(file);
    toast.success('Imported successfully', { id: toastId });
} catch (error) {
    toast.error('Import failed', { id: toastId });
}
```

## Async Error Handling

### Promise Error Handling

```typescript
// ✅ Good - Handle promise rejections
export async function fetchDiagrams(): Promise<Diagram[]> {
    try {
        const diagrams = await db.diagrams.toArray();
        return diagrams;
    } catch (error) {
        console.error('Failed to fetch diagrams:', error);
        return []; // Return empty array as fallback
    }
}

// ✅ Good - Promise.all error handling
export async function loadMultipleDiagrams(ids: string[]): Promise<Diagram[]> {
    const results = await Promise.allSettled(
        ids.map(id => db.diagrams.get(id))
    );

    return results
        .filter((result): result is PromiseFulfilledResult<Diagram> => 
            result.status === 'fulfilled' && result.value !== undefined
        )
        .map(result => result.value);
}
```

### Race Conditions

```typescript
// ✅ Good - Cancel stale requests
export function useSearch(query: string) {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        let cancelled = false;

        async function search() {
            try {
                setError(null);
                const data = await performSearch(query, controller.signal);
                if (!cancelled) {
                    setResults(data);
                }
            } catch (err) {
                if (!cancelled && err.name !== 'AbortError') {
                    setError(err as Error);
                }
            }
        }

        search();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [query]);

    return { results, error };
}
```

## Network Error Handling

### Fetch with Error Handling

```typescript
// ✅ Good - Comprehensive fetch error handling
export async function fetchData<T>(url: string): Promise<T> {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                throw new NetworkError('Resource not found', 404);
            } else if (response.status >= 500) {
                throw new NetworkError('Server error', response.status);
            } else {
                throw new NetworkError(`Request failed: ${response.statusText}`, response.status);
            }
        }

        return await response.json();
    } catch (error) {
        if (error instanceof NetworkError) {
            throw error;
        } else if (error instanceof TypeError) {
            // Network failure (no internet, CORS, etc.)
            throw new NetworkError('Network request failed. Please check your connection.');
        }
        throw error;
    }
}

// ✅ Good - Retry logic
export async function fetchWithRetry<T>(
    url: string,
    maxRetries: number = 3
): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fetchData<T>(url);
        } catch (error) {
            lastError = error as Error;
            if (i < maxRetries - 1) {
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
    }

    throw lastError;
}
```

## Database Error Handling

### Dexie Error Handling

```typescript
// ✅ Good - Handle Dexie errors
export async function addDiagram(diagram: Diagram): Promise<void> {
    try {
        await db.diagrams.add(diagram);
    } catch (error) {
        if (error instanceof Dexie.ConstraintError) {
            toast.error('A diagram with this ID already exists');
        } else if (error instanceof Dexie.QuotaExceededError) {
            toast.error('Storage quota exceeded. Please delete some diagrams.');
        } else if (error instanceof Dexie.DatabaseClosedError) {
            await db.open();
            return addDiagram(diagram); // Retry
        } else {
            toast.error('Failed to save diagram');
        }
        throw error;
    }
}
```

## Logging Errors

### Error Logging

```typescript
// ✅ Good - Structured error logging
export function logError(error: Error, context?: Record<string, unknown>): void {
    console.error('Error:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
    });

    // In production, send to error tracking service
    if (import.meta.env.PROD) {
        // sendToErrorTracking(error, context);
    }
}

// Usage
try {
    await riskyOperation();
} catch (error) {
    logError(error as Error, {
        operation: 'importDiagram',
        userId: user.id,
        diagramId: diagram.id,
    });
    throw error;
}
```

## User-Friendly Error Messages

### Error Message Guidelines

```typescript
// ✅ Good - User-friendly messages
export function getErrorMessage(error: unknown): string {
    if (error instanceof ValidationError) {
        return `Validation error: ${error.message}`;
    }

    if (error instanceof NetworkError) {
        if (error.statusCode === 404) {
            return 'The requested resource was not found';
        }
        if (error.statusCode && error.statusCode >= 500) {
            return 'Server error. Please try again later';
        }
        return 'Network error. Please check your connection';
    }

    if (error instanceof Dexie.QuotaExceededError) {
        return 'Storage is full. Please delete some diagrams to free up space';
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'An unexpected error occurred';
}

// Usage
try {
    await operation();
} catch (error) {
    toast.error(getErrorMessage(error));
}
```

## Best Practices Summary

### Do's
- ✅ Use typed errors (extend Error class)
- ✅ Catch errors at appropriate levels
- ✅ Provide user-friendly error messages
- ✅ Log errors with context
- ✅ Use error boundaries for React components
- ✅ Validate data with Zod schemas
- ✅ Handle specific error types differently
- ✅ Clean up on errors (abort requests, etc.)
- ✅ Show toast notifications for user feedback
- ✅ Retry transient failures
- ✅ Use Promise.allSettled for parallel operations
- ✅ Cancel stale async operations

### Don'ts
- ❌ Don't swallow errors silently
- ❌ Don't show technical error messages to users
- ❌ Don't catch errors without handling them
- ❌ Don't forget to clean up resources
- ❌ Don't use string errors (use Error objects)
- ❌ Don't ignore TypeScript error types
- ❌ Don't leave console.errors in production
- ❌ Don't retry non-transient errors
- ❌ Don't forget to validate user input
- ❌ Don't leak sensitive information in errors
