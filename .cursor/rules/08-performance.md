# Performance Guidelines

## Overview
ChartDB handles complex diagrams with many tables and relationships. Follow these performance optimization guidelines to ensure smooth user experience.

## React Performance Optimization

### React.memo

Use `React.memo` to prevent unnecessary re-renders of components:

```typescript
// ✅ Good - Memo for expensive list items
export const TableNode = React.memo<TableNodeProps>(({ table, onUpdate }) => {
    // Expensive rendering logic
    return (
        <div className="table-node">
            {/* Complex table rendering */}
        </div>
    );
});
TableNode.displayName = 'TableNode';

// ✅ Good - Custom comparison for complex props
export const DiagramCanvas = React.memo<DiagramCanvasProps>(
    ({ tables, relationships }) => {
        return (
            <div>
                {/* Render diagram */}
            </div>
        );
    },
    (prevProps, nextProps) => {
        // Only re-render if tables or relationships changed
        return (
            prevProps.tables.length === nextProps.tables.length &&
            prevProps.relationships.length === nextProps.relationships.length
        );
    }
);

// ❌ Bad - Memoizing everything
export const SimpleText = React.memo(() => <span>Hello</span>); // Unnecessary!
```

### useMemo

Use `useMemo` for expensive computations:

```typescript
// ✅ Good - Memoize expensive calculations
export const DiagramStats: React.FC<Props> = ({ tables, relationships }) => {
    const stats = useMemo(() => {
        return {
            tableCount: tables.length,
            fieldCount: tables.reduce((sum, t) => sum + t.fields.length, 0),
            relationshipCount: relationships.length,
            // Expensive calculation
            averageFieldsPerTable: tables.length > 0 
                ? tables.reduce((sum, t) => sum + t.fields.length, 0) / tables.length 
                : 0,
        };
    }, [tables, relationships]);

    return <div>{/* Display stats */}</div>;
};

// ❌ Bad - Memoizing simple values
const count = useMemo(() => items.length, [items]); // Just use items.length directly!

// ❌ Bad - Wrong dependencies
const filtered = useMemo(
    () => items.filter(item => item.type === filter),
    [items] // Missing 'filter' dependency!
);
```

### useCallback

Use `useCallback` to memoize functions passed as props:

```typescript
// ✅ Good - Callback for child component
export const TableList: React.FC<Props> = ({ tables }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleSelect = useCallback((id: string) => {
        setSelectedId(id);
        // Other logic
    }, []); // No dependencies, stable function

    return (
        <div>
            {tables.map((table) => (
                <TableRow 
                    key={table.id} 
                    table={table} 
                    onSelect={handleSelect} // Stable reference
                />
            ))}
        </div>
    );
};

// ✅ Good - Callback with dependencies
const handleUpdate = useCallback(
    (id: string, updates: Partial<Table>) => {
        updateTable(id, updates);
        logUpdate(id);
    },
    [updateTable] // Include function dependencies
);

// ❌ Bad - Unnecessary callback
const onClick = useCallback(() => {
    console.log('clicked');
}, []); // Just use inline function for simple handlers
```

### Virtual Lists

Use virtualization for long lists:

```typescript
// ✅ Good - Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

export const TableList: React.FC<Props> = ({ tables }) => {
    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
        <div style={style}>
            <TableRow table={tables[index]} />
        </div>
    );

    return (
        <List
            height={600}
            itemCount={tables.length}
            itemSize={60}
            width="100%"
        >
            {Row}
        </List>
    );
};

// ❌ Bad - Rendering thousands of items
{tables.map(table => <TableRow key={table.id} table={table} />)} // Slow for 1000+ items!
```

## Code Splitting

### Lazy Loading Components

```typescript
// ✅ Good - Lazy load dialogs
const ExportDialog = React.lazy(() => import('@/dialogs/export-dialog'));
const ImportDialog = React.lazy(() => import('@/dialogs/import-dialog'));
const SettingsDialog = React.lazy(() => import('@/dialogs/settings-dialog'));

export const App: React.FC = () => {
    return (
        <Suspense fallback={<Spinner />}>
            <ExportDialog />
            <ImportDialog />
            <SettingsDialog />
        </Suspense>
    );
};

// ✅ Good - Route-based code splitting
const DiagramPage = React.lazy(() => import('@/pages/diagram-page'));
const EditorPage = React.lazy(() => import('@/pages/editor-page'));
const TemplatesPage = React.lazy(() => import('@/pages/templates-page'));
```

### Dynamic Imports

```typescript
// ✅ Good - Conditional feature loading
async function loadAdvancedEditor() {
    if (userHasPremium) {
        const { AdvancedEditor } = await import('@/components/advanced-editor');
        return AdvancedEditor;
    }
    return BasicEditor;
}

// ✅ Good - Load database-specific importers
async function loadImporter(databaseType: DatabaseType) {
    const module = await import(`@/lib/importers/${databaseType}`);
    return module.default;
}
```

## Bundle Optimization

### Tree Shaking

```typescript
// ✅ Good - Import only what you need
import { map, filter } from 'lodash-es';

// ❌ Bad - Imports entire library
import _ from 'lodash';

// ✅ Good - Specific imports
import Button from '@mui/material/Button';

// ❌ Bad - Imports all components
import { Button } from '@mui/material';
```

### Avoid Expensive Libraries

```typescript
// ✅ Good - Use date-fns (lightweight, tree-shakeable)
import { format, parseISO } from 'date-fns';

// ❌ Bad - moment.js is large and not tree-shakeable
import moment from 'moment';
```

## Asset Optimization

### Image Optimization

```typescript
// ✅ Good - Lazy load images
<img 
    src={imageUrl} 
    loading="lazy" 
    alt="Description"
/>

// ✅ Good - Use appropriate image formats
// Use WebP for photos, SVG for icons
<img src="logo.svg" alt="Logo" />
<img src="photo.webp" alt="Photo" />

// ✅ Good - Responsive images
<img 
    srcSet="image-320w.jpg 320w, image-640w.jpg 640w, image-1280w.jpg 1280w"
    sizes="(max-width: 640px) 100vw, 640px"
    src="image-640w.jpg"
    alt="Responsive"
/>
```

### Font Loading

```typescript
// ✅ Good - Preload critical fonts
<link
    rel="preload"
    href="/fonts/inter.woff2"
    as="font"
    type="font/woff2"
    crossOrigin="anonymous"
/>

// ✅ Good - Use font-display: swap
@font-face {
    font-family: 'Inter';
    src: url('/fonts/inter.woff2') format('woff2');
    font-display: swap;
}
```

## Data Handling

### Pagination

```typescript
// ✅ Good - Paginate large datasets
export function usePaginatedTables(pageSize: number = 50) {
    const [page, setPage] = useState(0);
    const [allTables, setAllTables] = useState<Table[]>([]);

    const paginatedTables = useMemo(() => {
        const start = page * pageSize;
        return allTables.slice(start, start + pageSize);
    }, [allTables, page, pageSize]);

    return {
        tables: paginatedTables,
        page,
        setPage,
        hasMore: (page + 1) * pageSize < allTables.length,
    };
}
```

### Debouncing and Throttling

```typescript
// ✅ Good - Debounce search input
import { useDebouncedCallback } from 'use-debounce';

export const SearchInput: React.FC = () => {
    const [query, setQuery] = useState('');

    const debouncedSearch = useDebouncedCallback(
        (value: string) => {
            // Perform search
            performSearch(value);
        },
        500 // Wait 500ms after user stops typing
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        debouncedSearch(value);
    };

    return <input value={query} onChange={handleChange} />;
};

// ✅ Good - Throttle scroll/resize handlers
import { useThrottledCallback } from 'use-debounce';

const handleScroll = useThrottledCallback(
    () => {
        // Handle scroll
    },
    100 // Call at most once per 100ms
);
```

## IndexedDB Performance

### Efficient Queries

```typescript
// ✅ Good - Use indexes for queries
export class ChartDBDatabase extends Dexie {
    constructor() {
        super('chartdb');
        this.version(1).stores({
            diagrams: 'id, name, createdAt, databaseType', // Index these fields
        });
    }
}

// ✅ Good - Query with index
const mysqlDiagrams = await db.diagrams
    .where('databaseType')
    .equals('mysql')
    .toArray();

// ❌ Bad - Filter without index (slower)
const mysqlDiagrams = await db.diagrams
    .toArray()
    .then(all => all.filter(d => d.databaseType === 'mysql'));
```

### Batch Operations

```typescript
// ✅ Good - Bulk operations
await db.diagrams.bulkPut(diagrams);
await db.diagrams.bulkDelete(ids);

// ❌ Bad - Individual operations in loop
for (const diagram of diagrams) {
    await db.diagrams.put(diagram); // Slow!
}
```

## Rendering Performance

### Avoid Inline Object/Array Creation

```typescript
// ❌ Bad - Creates new object on every render
<Component style={{ padding: 10 }} />
<Component items={[1, 2, 3]} />

// ✅ Good - Move outside or memoize
const style = { padding: 10 };
const items = [1, 2, 3];

<Component style={style} />
<Component items={items} />

// ✅ Good - Memoize if dynamic
const style = useMemo(() => ({ padding }), [padding]);
```

### Avoid Inline Functions in Lists

```typescript
// ❌ Bad - Creates new function for each item
{tables.map(table => (
    <TableRow 
        key={table.id}
        table={table}
        onClick={() => handleClick(table.id)} // New function every render!
    />
))}

// ✅ Good - Stable callback
const handleClick = useCallback((id: string) => {
    // Handle click
}, []);

{tables.map(table => (
    <TableRow 
        key={table.id}
        table={table}
        onClick={handleClick}
    />
))}
```

### Keys in Lists

```typescript
// ✅ Good - Stable, unique keys
{tables.map(table => (
    <TableRow key={table.id} table={table} />
))}

// ⚠️ Acceptable - Composite key if no ID
{items.map((item, index) => (
    <Item key={`${item.name}-${index}`} item={item} />
))}

// ❌ Bad - Index as key (if list can reorder)
{items.map((item, index) => (
    <Item key={index} item={item} />
))}
```

## CSS Performance

### Avoid Layout Thrashing

```typescript
// ❌ Bad - Causes layout thrashing
for (const el of elements) {
    const height = el.offsetHeight; // Read
    el.style.height = height + 10 + 'px'; // Write
}

// ✅ Good - Batch reads, then batch writes
const heights = elements.map(el => el.offsetHeight);
elements.forEach((el, i) => {
    el.style.height = heights[i] + 10 + 'px';
});
```

### Use CSS Transforms

```typescript
// ✅ Good - Transform (GPU accelerated)
<div className="translate-x-4 translate-y-2" />

// ❌ Bad - Position (causes reflow)
<div style={{ left: '16px', top: '8px' }} />
```

### Will-Change

```typescript
// ✅ Good - Hint browser about animations
<div className="will-change-transform transition-transform" />

// ⚠️ Don't overuse - only for elements that will actually change
```

## Network Performance

### Request Batching

```typescript
// ✅ Good - Batch API requests
async function batchFetchTables(ids: string[]): Promise<Table[]> {
    const response = await fetch('/api/tables', {
        method: 'POST',
        body: JSON.stringify({ ids }),
    });
    return response.json();
}

// ❌ Bad - Multiple individual requests
for (const id of ids) {
    await fetch(`/api/tables/${id}`);
}
```

### Request Cancellation

```typescript
// ✅ Good - Cancel stale requests
export function useSearch(query: string) {
    const [results, setResults] = useState([]);

    useEffect(() => {
        const controller = new AbortController();

        async function search() {
            try {
                const response = await fetch(`/api/search?q=${query}`, {
                    signal: controller.signal,
                });
                const data = await response.json();
                setResults(data);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error(error);
                }
            }
        }

        search();

        return () => {
            controller.abort(); // Cancel on cleanup
        };
    }, [query]);

    return results;
}
```

## Monitoring Performance

### Performance Profiling

```typescript
// ✅ Good - Profile expensive operations
console.time('diagram-render');
renderDiagram(data);
console.timeEnd('diagram-render');

// ✅ Good - Use React DevTools Profiler
<Profiler id="Canvas" onRender={onRenderCallback}>
    <Canvas />
</Profiler>
```

### Web Vitals

```typescript
// ✅ Good - Track Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## Best Practices Summary

### Do's
- ✅ Use React.memo for expensive components
- ✅ Use useMemo for expensive calculations
- ✅ Use useCallback for stable function references
- ✅ Implement virtual scrolling for long lists
- ✅ Lazy load routes and heavy components
- ✅ Use code splitting
- ✅ Optimize bundle size (tree shaking)
- ✅ Debounce/throttle expensive operations
- ✅ Use IndexedDB indexes
- ✅ Batch database operations
- ✅ Use stable keys in lists
- ✅ Profile performance regularly

### Don'ts
- ❌ Don't memoize everything (profile first)
- ❌ Don't create inline objects/arrays in render
- ❌ Don't use index as key in dynamic lists
- ❌ Don't import entire libraries
- ❌ Don't forget to clean up async operations
- ❌ Don't cause layout thrashing
- ❌ Don't render large lists without virtualization
- ❌ Don't make individual DB calls in loops
- ❌ Don't block the main thread
- ❌ Don't ignore bundle size
