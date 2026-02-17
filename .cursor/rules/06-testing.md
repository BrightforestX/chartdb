# Testing Standards

## Overview
ChartDB uses Vitest as the test runner with React Testing Library for component tests. Follow these guidelines for comprehensive, maintainable tests.

## Testing Framework

- **Test Runner**: Vitest
- **Component Testing**: React Testing Library (@testing-library/react)
- **User Interaction**: @testing-library/user-event
- **DOM Assertions**: @testing-library/jest-dom
- **Test Environment**: happy-dom

## Test File Organization

### File Naming and Location

```
src/
├── components/
│   └── button/
│       ├── button.tsx
│       └── button.test.tsx              # Colocated test
├── lib/
│   └── domain/
│       ├── table.ts
│       └── table.test.ts                # Colocated test
└── pages/
    └── editor-page/
        ├── editor-page.tsx
        └── __tests__/                   # Test folder for complex components
            ├── editor-page.test.tsx
            └── canvas.test.tsx
```

### Naming Convention

- Test files: `*.test.ts` or `*.test.tsx`
- Test folders: `__tests__/`
- Colocate tests with the code they test

## Test Structure

### Basic Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
    it('renders with children', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('calls onClick when clicked', async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();

        render(<Button onClick={onClick}>Click me</Button>);

        await user.click(screen.getByRole('button'));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('applies variant classes correctly', () => {
        render(<Button variant="secondary">Button</Button>);
        const button = screen.getByRole('button');

        expect(button).toHaveClass('bg-secondary');
    });

    it('is disabled when disabled prop is true', () => {
        render(<Button disabled>Click me</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });
});
```

## Component Testing

### Rendering Components

```typescript
import { render, screen } from '@testing-library/react';

// ✅ Good - Basic render
it('renders component', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
});

// ✅ Good - With props
it('renders with props', () => {
    render(<MyComponent title="Test" count={5} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
});

// ✅ Good - With wrapper (context, router, etc.)
function renderWithProviders(ui: React.ReactElement) {
    return render(
        <ThemeProvider>
            <Router>
                {ui}
            </Router>
        </ThemeProvider>
    );
}

it('renders with providers', () => {
    renderWithProviders(<MyComponent />);
    // assertions
});
```

### Querying Elements

Use queries in this order of preference:

1. **Accessible queries** (preferred)
   - `getByRole`
   - `getByLabelText`
   - `getByPlaceholderText`
   - `getByText`

2. **Semantic queries**
   - `getByAltText`
   - `getByTitle`

3. **Test IDs** (last resort)
   - `getByTestId`

```typescript
// ✅ Good - Accessible queries
it('finds elements accessibly', () => {
    render(<LoginForm />);

    // By role
    const button = screen.getByRole('button', { name: /submit/i });

    // By label
    const emailInput = screen.getByLabelText(/email/i);

    // By placeholder
    const searchInput = screen.getByPlaceholderText(/search/i);

    // By text
    const heading = screen.getByText(/welcome/i);
});

// ⚠️ Acceptable - Test ID when no accessible query works
it('uses test id as fallback', () => {
    render(<ComplexComponent />);
    const element = screen.getByTestId('complex-element');
});

// ❌ Bad - Using test IDs when accessible queries work
it('should not use test ids unnecessarily', () => {
    render(<Button>Submit</Button>);
    const button = screen.getByTestId('submit-button'); // Bad!
});
```

### User Interactions

Always use `@testing-library/user-event` for interactions:

```typescript
import userEvent from '@testing-library/user-event';

// ✅ Good - User event
it('handles user interactions', async () => {
    const user = userEvent.setup();

    render(<Form />);

    // Typing
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');

    // Clicking
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Selecting
    await user.selectOptions(screen.getByLabelText(/country/i), 'USA');

    // Keyboard
    await user.keyboard('{Enter}');
    await user.keyboard('{Tab}');
});

// ❌ Bad - fireEvent (use userEvent instead)
import { fireEvent } from '@testing-library/react';

it('should use userEvent', () => {
    render(<Button />);
    fireEvent.click(screen.getByRole('button')); // Bad!
});
```

### Async Testing

```typescript
import { waitFor, screen } from '@testing-library/react';

// ✅ Good - waitFor for async updates
it('loads data asynchronously', async () => {
    render(<DataComponent />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
        expect(screen.getByText(/data loaded/i)).toBeInTheDocument();
    });
});

// ✅ Good - findBy queries (combines getBy + waitFor)
it('finds elements after async update', async () => {
    render(<DataComponent />);

    const data = await screen.findByText(/data loaded/i);
    expect(data).toBeInTheDocument();
});

// ✅ Good - Testing async functions
it('handles async operations', async () => {
    const result = await fetchData();
    expect(result).toEqual(expectedData);
});
```

### Mocking

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ✅ Good - Mock functions
it('calls callback with arguments', () => {
    const callback = vi.fn();
    const component = render(<Button onClick={callback} />);

    fireEvent.click(component.getByRole('button'));

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(expect.any(Object));
});

// ✅ Good - Mock modules
vi.mock('@/lib/database', () => ({
    db: {
        diagrams: {
            get: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

// ✅ Good - Mock timers
it('handles delayed actions', async () => {
    vi.useFakeTimers();

    render(<DelayedComponent />);

    vi.advanceTimersByTime(1000);

    expect(screen.getByText(/updated/i)).toBeInTheDocument();

    vi.useRealTimers();
});

// ✅ Good - Mock API calls
beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({ data: 'mocked' }),
    });
});
```

## Unit Testing

### Pure Functions

```typescript
// ✅ Good - Test pure functions
describe('groupBy', () => {
    it('groups items by key', () => {
        const items = [
            { type: 'A', value: 1 },
            { type: 'B', value: 2 },
            { type: 'A', value: 3 },
        ];

        const result = groupBy(items, 'type');

        expect(result).toEqual({
            A: [
                { type: 'A', value: 1 },
                { type: 'A', value: 3 },
            ],
            B: [{ type: 'B', value: 2 }],
        });
    });

    it('handles empty array', () => {
        expect(groupBy([], 'type')).toEqual({});
    });

    it('handles single item', () => {
        const items = [{ type: 'A', value: 1 }];
        expect(groupBy(items, 'type')).toEqual({
            A: [{ type: 'A', value: 1 }],
        });
    });
});
```

### Edge Cases

```typescript
// ✅ Good - Test edge cases
describe('calculatePercentage', () => {
    it('calculates percentage correctly', () => {
        expect(calculatePercentage(50, 200)).toBe(25);
    });

    it('handles zero denominator', () => {
        expect(calculatePercentage(50, 0)).toBe(0);
    });

    it('handles negative numbers', () => {
        expect(calculatePercentage(-50, 200)).toBe(-25);
    });

    it('handles decimals', () => {
        expect(calculatePercentage(33.33, 100)).toBeCloseTo(33.33, 2);
    });

    it('handles very large numbers', () => {
        expect(calculatePercentage(1e10, 1e11)).toBe(10);
    });
});
```

## Testing Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';

// ✅ Good - Test custom hooks
describe('useCounter', () => {
    it('increments counter', () => {
        const { result } = renderHook(() => useCounter(0));

        expect(result.current.count).toBe(0);

        act(() => {
            result.current.increment();
        });

        expect(result.current.count).toBe(1);
    });

    it('handles initial value', () => {
        const { result } = renderHook(() => useCounter(10));
        expect(result.current.count).toBe(10);
    });
});

// ✅ Good - Test hooks with async operations
describe('useDiagrams', () => {
    it('loads diagrams', async () => {
        const { result } = renderHook(() => useDiagrams());

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.diagrams).toHaveLength(2);
    });
});
```

## Testing Context

```typescript
// ✅ Good - Test context providers
describe('ThemeProvider', () => {
    it('provides theme context', () => {
        const TestComponent = () => {
            const { theme } = useTheme();
            return <div>{theme}</div>;
        };

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        expect(screen.getByText('light')).toBeInTheDocument();
    });

    it('allows theme toggling', async () => {
        const user = userEvent.setup();

        const TestComponent = () => {
            const { theme, toggleTheme } = useTheme();
            return (
                <>
                    <div>{theme}</div>
                    <button onClick={toggleTheme}>Toggle</button>
                </>
            );
        };

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        await user.click(screen.getByRole('button'));

        expect(screen.getByText('dark')).toBeInTheDocument();
    });
});
```

## Snapshot Testing

Use sparingly and purposefully:

```typescript
// ⚠️ Acceptable - For components with complex output
it('matches snapshot', () => {
    const { container } = render(<ComplexComponent data={mockData} />);
    expect(container.firstChild).toMatchSnapshot();
});

// ❌ Bad - Snapshot everything
it('renders', () => {
    const { container } = render(<Button>Click</Button>);
    expect(container).toMatchSnapshot(); // Too brittle!
});
```

## Test Coverage

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- button.test.tsx

# Run tests in UI mode
npm run test:ui
```

### Coverage Goals

- Aim for >80% coverage overall
- 100% coverage for critical business logic
- Focus on meaningful tests, not just coverage numbers

## Best Practices Summary

### Do's
- ✅ Colocate tests with code
- ✅ Use accessible queries (getByRole, getByLabelText)
- ✅ Use userEvent for interactions
- ✅ Test user behavior, not implementation
- ✅ Test edge cases and error states
- ✅ Use descriptive test names
- ✅ Keep tests focused and simple
- ✅ Mock external dependencies
- ✅ Clean up after tests (timers, subscriptions)
- ✅ Use waitFor for async updates

### Don'ts
- ❌ Don't test implementation details
- ❌ Don't use fireEvent (use userEvent)
- ❌ Don't overuse test IDs
- ❌ Don't snapshot everything
- ❌ Don't write brittle tests
- ❌ Don't test third-party libraries
- ❌ Don't forget to test error states
- ❌ Don't ignore accessibility in tests
- ❌ Don't write overly complex test setup
- ❌ Don't aim for 100% coverage at the expense of quality

## Test Examples

### Complete Component Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from './search-input';

describe('SearchInput', () => {
    it('renders with placeholder', () => {
        render(<SearchInput placeholder="Search..." />);
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('calls onChange when typing', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();

        render(<SearchInput onChange={onChange} />);

        const input = screen.getByRole('textbox');
        await user.type(input, 'test query');

        expect(onChange).toHaveBeenCalledTimes(10); // Once per character
        expect(onChange).toHaveBeenLastCalledWith('test query');
    });

    it('shows clear button when value is present', async () => {
        const user = userEvent.setup();

        render(<SearchInput value="test" onChange={vi.fn()} />);

        expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('clears input when clear button is clicked', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();

        render(<SearchInput value="test" onChange={onChange} />);

        await user.click(screen.getByRole('button', { name: /clear/i }));

        expect(onChange).toHaveBeenCalledWith('');
    });

    it('is accessible', () => {
        render(<SearchInput label="Search diagrams" />);

        const input = screen.getByLabelText('Search diagrams');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAccessibleName();
    });
});
```
