# State Management Guidelines

## Overview
ChartDB uses a combination of React Context, custom hooks, and IndexedDB (via Dexie) for state management. Follow these guidelines for consistent state handling.

## State Management Architecture

### Levels of State

1. **Local Component State** - UI state specific to a component
2. **Shared Context State** - State shared across related components
3. **URL State** - State synchronized with URL (routing)
4. **Persistent State** - State stored in IndexedDB (Dexie)
5. **Server State** - Data fetched from external APIs

## Local Component State

Use `useState` for local UI state:

```typescript
// ✅ Good - Local UI state
export const Accordion: React.FC<Props> = ({ items }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    return (
        // Component implementation
    );
};

// ✅ Good - Form state
export const LoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    return (
        // Form implementation
    );
};
```

## Context for Shared State

### Creating Context

```typescript
// ✅ Good - Typed context
import { createContext, useContext, useState } from 'react';
import type { Diagram } from '@/lib/domain/diagram';

interface DiagramContextValue {
    diagram: Diagram | null;
    isLoading: boolean;
    error: Error | null;
    updateDiagram: (updates: Partial<Diagram>) => Promise<void>;
    deleteDiagram: () => Promise<void>;
}

const DiagramContext = createContext<DiagramContextValue | null>(null);

// ✅ Good - Provider component
export const DiagramProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [diagram, setDiagram] = useState<Diagram | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const updateDiagram = async (updates: Partial<Diagram>) => {
        if (!diagram) return;

        try {
            const updated = { ...diagram, ...updates };
            await db.diagrams.put(updated);
            setDiagram(updated);
        } catch (err) {
            setError(err as Error);
        }
    };

    const deleteDiagram = async () => {
        if (!diagram) return;

        try {
            await db.diagrams.delete(diagram.id);
            setDiagram(null);
        } catch (err) {
            setError(err as Error);
        }
    };

    const value: DiagramContextValue = {
        diagram,
        isLoading,
        error,
        updateDiagram,
        deleteDiagram,
    };

    return (
        <DiagramContext.Provider value={value}>
            {children}
        </DiagramContext.Provider>
    );
};

// ✅ Good - Custom hook for consuming context
export function useDiagram(): DiagramContextValue {
    const context = useContext(DiagramContext);
    if (!context) {
        throw new Error('useDiagram must be used within DiagramProvider');
    }
    return context;
}
```

### Context Best Practices

```typescript
// ✅ Good - Split contexts by concern
<ThemeProvider>
    <AuthProvider>
        <DiagramProvider>
            <App />
        </DiagramProvider>
    </AuthProvider>
</ThemeProvider>

// ❌ Bad - One giant context for everything
<GlobalStateProvider> {/* Contains all app state */}

// ✅ Good - Memoize context value
export const DiagramProvider: React.FC<Props> = ({ children }) => {
    const [diagram, setDiagram] = useState<Diagram | null>(null);

    const value = useMemo(
        () => ({
            diagram,
            setDiagram,
            // other values
        }),
        [diagram]
    );

    return (
        <DiagramContext.Provider value={value}>
            {children}
        </DiagramContext.Provider>
    );
};
```

## Custom Hooks

### State Logic Hooks

```typescript
// ✅ Good - Custom hook for complex state logic
export function useTableSelection(tables: Table[]) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const selectTable = useCallback((id: string) => {
        setSelectedIds((prev) => new Set(prev).add(id));
    }, []);

    const deselectTable = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    const toggleTable = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const selectAll = useCallback(() => {
        setSelectedIds(new Set(tables.map((t) => t.id)));
    }, [tables]);

    const deselectAll = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const selectedTables = useMemo(
        () => tables.filter((t) => selectedIds.has(t.id)),
        [tables, selectedIds]
    );

    return {
        selectedIds,
        selectedTables,
        selectTable,
        deselectTable,
        toggleTable,
        selectAll,
        deselectAll,
    };
}
```

### Data Fetching Hooks

```typescript
// ✅ Good - Hook for data fetching
export function useDiagrams() {
    const [diagrams, setDiagrams] = useState<Diagram[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchDiagrams() {
            try {
                setIsLoading(true);
                const data = await db.diagrams.toArray();
                if (!cancelled) {
                    setDiagrams(data);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err as Error);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        fetchDiagrams();

        return () => {
            cancelled = true;
        };
    }, []);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await db.diagrams.toArray();
            setDiagrams(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { diagrams, isLoading, error, refetch };
}
```

## IndexedDB with Dexie

### Database Schema

```typescript
// ✅ Good - Dexie database definition
import Dexie, { type Table } from 'dexie';
import type { Diagram, Template } from './types';

export class ChartDBDatabase extends Dexie {
    diagrams!: Table<Diagram, string>;
    templates!: Table<Template, string>;

    constructor() {
        super('chartdb');

        this.version(1).stores({
            diagrams: 'id, name, createdAt, updatedAt',
            templates: 'id, name, category',
        });

        this.version(2)
            .stores({
                diagrams: 'id, name, createdAt, updatedAt, databaseType',
            })
            .upgrade((trans) => {
                // Migration logic
                return trans
                    .table('diagrams')
                    .toCollection()
                    .modify((diagram) => {
                        diagram.databaseType = 'postgresql';
                    });
            });
    }
}

export const db = new ChartDBDatabase();
```

### CRUD Operations

```typescript
// ✅ Good - Create
export async function createDiagram(diagram: Diagram): Promise<void> {
    await db.diagrams.add(diagram);
}

// ✅ Good - Read
export async function getDiagram(id: string): Promise<Diagram | undefined> {
    return await db.diagrams.get(id);
}

// ✅ Good - Update
export async function updateDiagram(
    id: string,
    updates: Partial<Diagram>
): Promise<void> {
    await db.diagrams.update(id, updates);
}

// ✅ Good - Delete
export async function deleteDiagram(id: string): Promise<void> {
    await db.diagrams.delete(id);
}

// ✅ Good - Query
export async function searchDiagrams(query: string): Promise<Diagram[]> {
    return await db.diagrams
        .filter((diagram) =>
            diagram.name.toLowerCase().includes(query.toLowerCase())
        )
        .toArray();
}
```

### Dexie with Hooks

```typescript
// ✅ Good - Live queries with useLiveQuery
import { useLiveQuery } from 'dexie-react-hooks';

export function useDiagrams() {
    const diagrams = useLiveQuery(() => db.diagrams.toArray(), []);

    return { diagrams: diagrams ?? [], isLoading: !diagrams };
}

// ✅ Good - Filtered live query
export function useDiagramsByType(databaseType: string) {
    const diagrams = useLiveQuery(
        () => db.diagrams.where({ databaseType }).toArray(),
        [databaseType]
    );

    return { diagrams: diagrams ?? [], isLoading: !diagrams };
}
```

## URL State

Use React Router for URL state:

```typescript
import { useSearchParams, useParams } from 'react-router-dom';

// ✅ Good - URL parameters
export function DiagramPage() {
    const { diagramId } = useParams<{ diagramId: string }>();

    return <Diagram id={diagramId} />;
}

// ✅ Good - Query parameters
export function DiagramList() {
    const [searchParams, setSearchParams] = useSearchParams();

    const filter = searchParams.get('filter') ?? 'all';
    const sort = searchParams.get('sort') ?? 'name';

    const updateFilter = (newFilter: string) => {
        setSearchParams({ filter: newFilter, sort });
    };

    return <List filter={filter} sort={sort} onFilterChange={updateFilter} />;
}
```

## Reducer Pattern for Complex State

Use `useReducer` for complex state logic:

```typescript
// ✅ Good - Reducer for complex state
type State = {
    diagram: Diagram;
    selectedTables: Set<string>;
    clipboard: Table | null;
    history: Diagram[];
    historyIndex: number;
};

type Action =
    | { type: 'UPDATE_DIAGRAM'; payload: Partial<Diagram> }
    | { type: 'SELECT_TABLE'; payload: string }
    | { type: 'DESELECT_TABLE'; payload: string }
    | { type: 'COPY_TABLE'; payload: Table }
    | { type: 'PASTE_TABLE' }
    | { type: 'UNDO' }
    | { type: 'REDO' };

function diagramReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'UPDATE_DIAGRAM':
            return {
                ...state,
                diagram: { ...state.diagram, ...action.payload },
                history: [...state.history.slice(0, state.historyIndex + 1), state.diagram],
                historyIndex: state.historyIndex + 1,
            };

        case 'SELECT_TABLE':
            return {
                ...state,
                selectedTables: new Set(state.selectedTables).add(action.payload),
            };

        case 'UNDO':
            if (state.historyIndex > 0) {
                return {
                    ...state,
                    diagram: state.history[state.historyIndex - 1],
                    historyIndex: state.historyIndex - 1,
                };
            }
            return state;

        // ... other cases

        default:
            return state;
    }
}

export function useDiagramEditor(initialDiagram: Diagram) {
    const [state, dispatch] = useReducer(diagramReducer, {
        diagram: initialDiagram,
        selectedTables: new Set(),
        clipboard: null,
        history: [initialDiagram],
        historyIndex: 0,
    });

    return { state, dispatch };
}
```

## Optimistic Updates

```typescript
// ✅ Good - Optimistic update pattern
export function useUpdateTable() {
    const [optimisticTable, setOptimisticTable] = useState<Table | null>(null);

    const updateTable = async (id: string, updates: Partial<Table>) => {
        // Get current table
        const currentTable = await db.tables.get(id);
        if (!currentTable) return;

        // Optimistically update UI
        const optimistic = { ...currentTable, ...updates };
        setOptimisticTable(optimistic);

        try {
            // Persist to database
            await db.tables.update(id, updates);
            setOptimisticTable(null);
        } catch (error) {
            // Revert on error
            setOptimisticTable(null);
            throw error;
        }
    };

    return { updateTable, optimisticTable };
}
```

## State Synchronization

```typescript
// ✅ Good - Sync state between tabs/windows
export function useDiagramSync(diagramId: string) {
    const [diagram, setDiagram] = useState<Diagram | null>(null);

    useEffect(() => {
        // Listen for changes from other tabs
        const channel = new BroadcastChannel('diagram-sync');

        channel.onmessage = (event) => {
            if (event.data.diagramId === diagramId) {
                setDiagram(event.data.diagram);
            }
        };

        return () => {
            channel.close();
        };
    }, [diagramId]);

    const updateDiagram = async (updates: Partial<Diagram>) => {
        const updated = { ...diagram, ...updates };
        await db.diagrams.update(diagramId, updates);
        setDiagram(updated);

        // Broadcast to other tabs
        const channel = new BroadcastChannel('diagram-sync');
        channel.postMessage({ diagramId, diagram: updated });
        channel.close();
    };

    return { diagram, updateDiagram };
}
```

## Best Practices Summary

### Do's
- ✅ Keep state as local as possible
- ✅ Use context for shared state across related components
- ✅ Split contexts by concern
- ✅ Memoize context values
- ✅ Use custom hooks to encapsulate state logic
- ✅ Use Dexie for persistent storage
- ✅ Use useReducer for complex state transitions
- ✅ Implement optimistic updates for better UX
- ✅ Clean up subscriptions in useEffect
- ✅ Handle loading and error states

### Don'ts
- ❌ Don't put all state in context
- ❌ Don't create context without proper typing
- ❌ Don't forget to cancel async operations
- ❌ Don't mutate state directly
- ❌ Don't forget Dexie migrations for schema changes
- ❌ Don't use localStorage for large data (use IndexedDB)
- ❌ Don't create unnecessary re-renders
- ❌ Don't ignore race conditions in async updates
- ❌ Don't use global variables for state
- ❌ Don't forget to handle errors in data fetching
