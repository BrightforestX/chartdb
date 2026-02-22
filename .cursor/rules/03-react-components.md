# React Component Guidelines

## Overview
ChartDB uses React 18 with functional components and hooks. Components should be composable, type-safe, and follow consistent patterns.

## Component Structure

### Basic Component Template

```typescript
import React from 'react';
import type { ComponentType } from './types';
import { cn } from '@/lib/utils';

export interface ComponentNameProps {
    children?: React.ReactNode;
    className?: string;
    // Other props
}

export const ComponentName: React.FC<ComponentNameProps> = ({
    children,
    className,
    ...props
}) => {
    return (
        <div className={cn('component-name', className)}>
            {children}
        </div>
    );
};
```

### ForwardRef Component Template

Use for components that need ref forwarding (especially form controls):

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = 'text', error, ...props }, ref) => {
        return (
            <div>
                <input
                    type={type}
                    className={cn('input', error && 'input-error', className)}
                    ref={ref}
                    {...props}
                />
                {error && <span className="error-message">{error}</span>}
            </div>
        );
    }
);
Input.displayName = 'Input';
```

**Always set displayName for forwardRef components** - required for debugging and React DevTools.

## Component Composition with Radix UI

ChartDB heavily uses Radix UI primitives. Follow these patterns:

### Composing Radix Components

```typescript
import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

// Root component
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

// Styled sub-component
export const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay" />
        <DialogPrimitive.Content
            ref={ref}
            className={cn('dialog-content', className)}
            {...props}
        >
            {children}
        </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;
```

### Usage Pattern

```typescript
// ✅ Good - Composed usage
<Dialog>
    <DialogTrigger asChild>
        <Button>Open Dialog</Button>
    </DialogTrigger>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Title</DialogTitle>
        </DialogHeader>
        {/* Content */}
    </DialogContent>
</Dialog>
```

## Component Variants with CVA

Use `class-variance-authority` for component variants:

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva('button-base', {
    variants: {
        variant: {
            default: 'bg-primary text-white',
            secondary: 'bg-secondary text-white',
            outline: 'border border-primary text-primary',
            ghost: 'hover:bg-accent',
        },
        size: {
            sm: 'h-8 px-3 text-sm',
            md: 'h-10 px-4 text-base',
            lg: 'h-12 px-6 text-lg',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'md',
    },
});

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';
```

## Props Patterns

### Extending HTML Attributes

```typescript
// ✅ Good - Extend appropriate HTML element
export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
}

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

export interface DivProps extends React.HTMLAttributes<HTMLDivElement> {
    // Custom props
}
```

### Children Props

```typescript
// ✅ Good - React.ReactNode for any renderable content
interface CardProps {
    children: React.ReactNode;
}

// ✅ Good - Render prop pattern
interface ListProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
}

// ✅ Good - Function as children
interface ToggleProps {
    children: (isOpen: boolean) => React.ReactNode;
}
```

### AsChild Pattern (Radix Pattern)

Allow polymorphic components using Radix's Slot:

```typescript
import { Slot } from '@radix-ui/react-slot';

interface ButtonProps {
    asChild?: boolean;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    asChild = false,
    children,
    ...props
}) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp {...props}>{children}</Comp>;
};

// Usage
<Button asChild>
    <a href="/dashboard">Go to Dashboard</a>
</Button>
```

## State Management in Components

### Local State

```typescript
// ✅ Good - Local state for UI concerns
export const Accordion: React.FC<AccordionProps> = ({ items }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div>
            {items.map((item, index) => (
                <AccordionItem
                    key={item.id}
                    isOpen={openIndex === index}
                    onToggle={() =>
                        setOpenIndex(openIndex === index ? null : index)
                    }
                >
                    {item.content}
                </AccordionItem>
            ))}
        </div>
    );
};
```

### Controlled vs Uncontrolled

Support both patterns when appropriate:

```typescript
// ✅ Good - Support both controlled and uncontrolled
export interface InputProps {
    value?: string; // Controlled
    defaultValue?: string; // Uncontrolled
    onChange?: (value: string) => void;
}

export const Input: React.FC<InputProps> = ({
    value: controlledValue,
    defaultValue,
    onChange,
}) => {
    const [internalValue, setInternalValue] = useState(defaultValue ?? '');

    // Use controlled value if provided, otherwise use internal state
    const value = controlledValue ?? internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (controlledValue === undefined) {
            setInternalValue(newValue);
        }
        onChange?.(newValue);
    };

    return <input value={value} onChange={handleChange} />;
};
```

## Component Composition Patterns

### Compound Components

```typescript
// ✅ Good - Compound component pattern
interface CardContextValue {
    variant: 'default' | 'outlined';
}

const CardContext = React.createContext<CardContextValue | null>(null);

export const Card: React.FC<CardProps> = ({ variant = 'default', children }) => {
    return (
        <CardContext.Provider value={{ variant }}>
            <div className={cn('card', `card-${variant}`)}>{children}</div>
        </CardContext.Provider>
    );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children }) => {
    return <div className="card-header">{children}</div>;
};

export const CardContent: React.FC<CardContentProps> = ({ children }) => {
    const context = React.useContext(CardContext);
    return <div className="card-content">{children}</div>;
};

// Usage
<Card variant="outlined">
    <CardHeader>Title</CardHeader>
    <CardContent>Content</CardContent>
</Card>
```

### Higher-Order Components (Use Sparingly)

Prefer hooks over HOCs, but when needed:

```typescript
// ✅ Acceptable - HOC for common functionality
export function withLoading<P extends object>(
    Component: React.ComponentType<P>
): React.FC<P & { isLoading?: boolean }> {
    return ({ isLoading, ...props }: P & { isLoading?: boolean }) => {
        if (isLoading) {
            return <Spinner />;
        }
        return <Component {...(props as P)} />;
    };
}
```

## Event Handlers

### Naming Convention

```typescript
// ✅ Good - Use 'on' prefix for event handlers
interface ButtonProps {
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    onHover?: () => void;
    onFocus?: (event: React.FocusEvent) => void;
}

// ✅ Good - Use 'handle' prefix for handler implementations
export const MyComponent: React.FC = () => {
    const handleClick = (event: React.MouseEvent) => {
        // Handle click
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        // Handle submit
    };

    return <button onClick={handleClick}>Click</button>;
};
```

### Prevent Default and Stop Propagation

```typescript
// ✅ Good - Explicit event handling
const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // Handle submit
};

// ✅ Good - Context menu prevention
const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    // Show custom context menu
};
```

## Conditional Rendering

```typescript
// ✅ Good - Boolean conditions
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}

// ✅ Good - Ternary for either/or
{isLoading ? <Spinner /> : <Content />}

// ✅ Good - Early returns
export const Component: React.FC<Props> = ({ data }) => {
    if (!data) {
        return <EmptyState />;
    }

    if (data.length === 0) {
        return <NoResults />;
    }

    return <DataList data={data} />;
};

// ❌ Bad - Inline ternaries with complex JSX
{isLoading ? (
    <div>
        <Spinner />
        <Text>Loading...</Text>
    </div>
) : error ? (
    <div>
        <Icon name="error" />
        <Text>{error.message}</Text>
    </div>
) : (
    <div>
        {/* Complex content */}
    </div>
)}
```

## Lists and Keys

```typescript
// ✅ Good - Stable, unique keys
{tables.map((table) => (
    <TableRow key={table.id} table={table} />
))}

// ✅ Good - Composite keys when no ID
{items.map((item, index) => (
    <Item key={`${item.name}-${index}`} item={item} />
))}

// ❌ Bad - Index as key (only if list never reorders/filters)
{items.map((item, index) => (
    <Item key={index} item={item} />
))}
```

## Performance Optimization

### React.memo

```typescript
// ✅ Good - Memo for expensive components
export const TableRow = React.memo<TableRowProps>(({ table, onSelect }) => {
    return (
        <div onClick={() => onSelect(table.id)}>
            {table.name}
        </div>
    );
});
TableRow.displayName = 'TableRow';

// ✅ Good - Custom comparison function
export const ExpensiveList = React.memo<ListProps>(
    ({ items, renderItem }) => {
        return <>{items.map(renderItem)}</>;
    },
    (prevProps, nextProps) => {
        return prevProps.items.length === nextProps.items.length;
    }
);
```

### useMemo and useCallback

See performance guidelines for detailed usage.

## Error Boundaries

```typescript
// ✅ Good - Error boundary component
interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
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
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className="error-boundary">
                        <h2>Something went wrong</h2>
                        <pre>{this.state.error?.message}</pre>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}
```

## Best Practices Summary

### Do's
- ✅ Use functional components with hooks
- ✅ Set displayName for forwardRef components
- ✅ Use CVA for component variants
- ✅ Extend HTML attributes for native elements
- ✅ Use React.memo for expensive components
- ✅ Compose Radix UI primitives properly
- ✅ Support asChild pattern for flexibility
- ✅ Use compound components for related UI
- ✅ Handle events properly (preventDefault, stopPropagation)
- ✅ Use stable keys for lists

### Don'ts
- ❌ Don't use class components (except error boundaries)
- ❌ Don't create deeply nested component hierarchies
- ❌ Don't put business logic in components
- ❌ Don't use index as key unless list is static
- ❌ Don't overuse React.memo (profile first)
- ❌ Don't create anonymous components in render
- ❌ Don't forget to clean up effects
- ❌ Don't mutate props
- ❌ Don't use inline function definitions for event handlers in lists
