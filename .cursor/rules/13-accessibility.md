# Accessibility Guidelines

## Overview
ChartDB is committed to being accessible to all users. Follow these guidelines to ensure the application meets WCAG 2.1 Level AA standards.

## Semantic HTML

### Use Proper HTML Elements

```typescript
// ✅ Good - Semantic HTML
<button onClick={handleClick}>Submit</button>
<nav>
    <ul>
        <li><a href="/diagrams">Diagrams</a></li>
    </ul>
</nav>

// ❌ Bad - Div as button
<div onClick={handleClick}>Submit</div> // Not keyboard accessible!

// ❌ Bad - Span as link
<span onClick={handleNavigate}>Go to page</span>
```

### Headings Hierarchy

```typescript
// ✅ Good - Logical heading hierarchy
<h1>ChartDB</h1>
<section>
    <h2>My Diagrams</h2>
    <article>
        <h3>Database Design</h3>
    </article>
</section>

// ❌ Bad - Skipping levels
<h1>ChartDB</h1>
<h4>My Diagrams</h4> // Skipped h2 and h3
```

## ARIA Attributes

### ARIA Labels

```typescript
// ✅ Good - Descriptive aria-label
<button aria-label="Delete diagram">
    <TrashIcon />
</button>

// ✅ Good - aria-labelledby for complex labels
<div>
    <h2 id="diagram-title">Database Schema</h2>
    <div aria-labelledby="diagram-title">
        {/* Diagram content */}
    </div>
</div>

// ❌ Bad - Icon without label
<button>
    <TrashIcon />
</button> // Screen reader: "button"
```

### ARIA Roles

Radix UI components already have proper roles, but when creating custom components:

```typescript
// ✅ Good - Explicit roles for custom components
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
    <h2 id="dialog-title">Export Diagram</h2>
    {/* Dialog content */}
</div>

// ✅ Good - Combobox pattern
<div role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
    <input
        type="text"
        aria-autocomplete="list"
        aria-controls="suggestions-list"
    />
    <ul id="suggestions-list" role="listbox">
        {suggestions.map(item => (
            <li key={item.id} role="option">{item.name}</li>
        ))}
    </ul>
</div>
```

### ARIA States

```typescript
// ✅ Good - Communicate state changes
<button
    aria-pressed={isActive}
    aria-expanded={isOpen}
    aria-disabled={isDisabled}
>
    Toggle
</button>

// ✅ Good - Loading state
<div
    aria-busy={isLoading}
    aria-live="polite"
>
    {isLoading ? 'Loading...' : content}
</div>

// ✅ Good - Required field
<input
    type="text"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? 'error-message' : undefined}
/>
{hasError && <span id="error-message">{errorMessage}</span>}
```

## Keyboard Navigation

### Focus Management

```typescript
// ✅ Good - Visible focus styles
<button className={cn(
    'px-4 py-2',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
)}>
    Click me
</button>

// ✅ Good - Focus trap in dialogs
import { useFocusTrap } from '@/hooks/use-focus-trap';

export const Dialog: React.FC<Props> = ({ isOpen, children }) => {
    const ref = useFocusTrap(isOpen);

    return (
        <div ref={ref} role="dialog" aria-modal="true">
            {children}
        </div>
    );
};
```

### Tab Order

```typescript
// ✅ Good - Logical tab order
<form>
    <input name="name" tabIndex={0} />
    <input name="email" tabIndex={0} />
    <button type="submit" tabIndex={0}>Submit</button>
</form>

// ❌ Bad - Arbitrary tabIndex
<div tabIndex={5}>Content</div>
<div tabIndex={1}>Other</div>
<div tabIndex={3}>More</div>

// ✅ Good - Remove from tab order when appropriate
<div tabIndex={-1}>Programmatically focusable, not in tab order</div>
```

### Keyboard Shortcuts

```typescript
// ✅ Good - Keyboard shortcuts with announcements
import { useHotkeys } from 'react-hotkeys-hook';

export const DiagramEditor: React.FC = () => {
    useHotkeys('ctrl+s, cmd+s', (e) => {
        e.preventDefault();
        saveDiagram();
        toast.success('Diagram saved');
    });

    useHotkeys('ctrl+z, cmd+z', (e) => {
        e.preventDefault();
        undo();
    });

    return (
        <div>
            {/* Editor */}
            <div className="sr-only" role="status" aria-live="polite">
                Press Ctrl+S to save, Ctrl+Z to undo
            </div>
        </div>
    );
};
```

## Screen Reader Support

### Visually Hidden Text

```typescript
// ✅ Good - Screen reader only text
<button>
    <TrashIcon />
    <span className="sr-only">Delete diagram</span>
</button>

// sr-only utility class:
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
}
```

### Live Regions

```typescript
// ✅ Good - Announce dynamic changes
export const SearchResults: React.FC<Props> = ({ results, isLoading }) => {
    return (
        <>
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {isLoading
                    ? 'Searching...'
                    : `Found ${results.length} results`}
            </div>
            <div>{/* Results display */}</div>
        </>
    );
};

// ✅ Good - Status messages
export const StatusAnnouncer: React.FC<{ message: string }> = ({ message }) => {
    return (
        <div role="status" aria-live="polite" className="sr-only">
            {message}
        </div>
    );
};
```

### Skip Links

```typescript
// ✅ Good - Skip to main content
export const Layout: React.FC = ({ children }) => {
    return (
        <>
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-background"
            >
                Skip to main content
            </a>
            <nav>{/* Navigation */}</nav>
            <main id="main-content" tabIndex={-1}>
                {children}
            </main>
        </>
    );
};
```

## Forms

### Labels

```typescript
// ✅ Good - Explicit labels
<label htmlFor="diagram-name">
    Diagram Name
</label>
<input id="diagram-name" type="text" />

// ✅ Good - Wrapping label
<label>
    Diagram Name
    <input type="text" />
</label>

// ❌ Bad - No label
<input placeholder="Diagram Name" /> // Placeholder is not a label!
```

### Error Messages

```typescript
// ✅ Good - Associated error messages
<div>
    <label htmlFor="email">Email</label>
    <input
        id="email"
        type="email"
        aria-invalid={hasError}
        aria-describedby={hasError ? 'email-error' : undefined}
    />
    {hasError && (
        <span id="email-error" role="alert">
            {errorMessage}
        </span>
    )}
</div>
```

### Field Groups

```typescript
// ✅ Good - Fieldset for related fields
<fieldset>
    <legend>Database Connection</legend>
    <label>
        Host
        <input type="text" name="host" />
    </label>
    <label>
        Port
        <input type="number" name="port" />
    </label>
</fieldset>
```

## Color and Contrast

### Sufficient Contrast

```typescript
// ✅ Good - High contrast text
<p className="text-foreground bg-background">
    High contrast text
</p>

// ✅ Good - Don't rely on color alone
<span className="text-destructive font-bold">
    ⚠️ Error: Invalid input
</span>

// ❌ Bad - Low contrast
<p className="text-gray-400 bg-gray-300">
    Hard to read
</p>

// ❌ Bad - Color only
<span className="text-red-500">Error</span> // No icon or text
```

### Focus Indicators

```typescript
// ✅ Good - Visible focus
<button className={cn(
    'transition-colors',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-ring',
    'focus-visible:ring-offset-2'
)}>
    Button
</button>

// ❌ Bad - Removed focus outline
<button className="outline-none">
    Button
</button> // No focus indicator!
```

## Images and Icons

### Alt Text

```typescript
// ✅ Good - Descriptive alt text
<img src="diagram.png" alt="E-commerce database schema with users, products, and orders tables" />

// ✅ Good - Empty alt for decorative images
<img src="decoration.png" alt="" role="presentation" />

// ✅ Good - Icons with labels
<button>
    <PlusIcon aria-hidden="true" />
    <span>Add Table</span>
</button>

// ❌ Bad - No alt text
<img src="diagram.png" />

// ❌ Bad - Generic alt text
<img src="diagram.png" alt="image" />
```

### Icon Buttons

```typescript
// ✅ Good - Icon button with label
<button aria-label="Close dialog">
    <XIcon aria-hidden="true" />
</button>

// ✅ Good - Tooltip for additional context
<TooltipProvider>
    <Tooltip>
        <TooltipTrigger asChild>
            <button aria-label="Delete">
                <TrashIcon aria-hidden="true" />
            </button>
        </TooltipTrigger>
        <TooltipContent>Delete this table</TooltipContent>
    </Tooltip>
</TooltipProvider>
```

## Interactive Elements

### Buttons vs Links

```typescript
// ✅ Good - Button for actions
<button onClick={saveDiagram}>Save</button>

// ✅ Good - Link for navigation
<a href="/diagrams">View Diagrams</a>

// ❌ Bad - Link that acts like button
<a href="#" onClick={saveDiagram}>Save</a>

// ❌ Bad - Button that acts like link
<button onClick={() => navigate('/diagrams')}>View Diagrams</button>
// Use Link component instead
```

### Disabled States

```typescript
// ✅ Good - Disabled with reason
<Tooltip>
    <TooltipTrigger asChild>
        <span>
            <button disabled={!hasChanges} aria-describedby="save-disabled-reason">
                Save
            </button>
        </span>
    </TooltipTrigger>
    <TooltipContent id="save-disabled-reason">
        No changes to save
    </TooltipContent>
</Tooltip>

// ✅ Good - Better than disabling
<button
    onClick={hasChanges ? handleSave : undefined}
    className={cn(!hasChanges && 'opacity-50 cursor-not-allowed')}
    aria-disabled={!hasChanges}
>
    Save
</button>
```

## Tables

### Accessible Data Tables

```typescript
// ✅ Good - Data table with proper markup
<table>
    <caption>Database Tables Overview</caption>
    <thead>
        <tr>
            <th scope="col">Table Name</th>
            <th scope="col">Fields</th>
            <th scope="col">Actions</th>
        </tr>
    </thead>
    <tbody>
        {tables.map(table => (
            <tr key={table.id}>
                <th scope="row">{table.name}</th>
                <td>{table.fields.length}</td>
                <td>
                    <button aria-label={`Edit ${table.name}`}>Edit</button>
                </td>
            </tr>
        ))}
    </tbody>
</table>
```

## Modals and Dialogs

### Dialog Pattern

Radix Dialog handles most accessibility, but ensure:

```typescript
// ✅ Good - Accessible dialog
<Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogTrigger asChild>
        <button>Open Dialog</button>
    </DialogTrigger>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Edit Diagram</DialogTitle>
            <DialogDescription>
                Make changes to your diagram here.
            </DialogDescription>
        </DialogHeader>
        {/* Content */}
        <DialogFooter>
            <button onClick={() => setIsOpen(false)}>Cancel</button>
            <button onClick={handleSave}>Save</button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

## Testing Accessibility

### Automated Testing

```typescript
// ✅ Good - Test accessibility
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
});
```

### Manual Testing

- Test with keyboard only (Tab, Enter, Escape, Arrow keys)
- Test with screen reader (NVDA, JAWS, VoiceOver)
- Test with browser zoom (up to 200%)
- Test with high contrast mode
- Test with color blindness simulators

## Best Practices Summary

### Do's
- ✅ Use semantic HTML elements
- ✅ Provide text alternatives for images
- ✅ Ensure keyboard accessibility
- ✅ Use proper ARIA attributes
- ✅ Maintain logical heading hierarchy
- ✅ Provide visible focus indicators
- ✅ Ensure sufficient color contrast (4.5:1 minimum)
- ✅ Label all form inputs
- ✅ Announce dynamic content changes
- ✅ Support screen readers
- ✅ Test with assistive technologies
- ✅ Provide skip links
- ✅ Use live regions for status updates

### Don'ts
- ❌ Don't use divs/spans as interactive elements
- ❌ Don't remove focus outlines
- ❌ Don't rely on color alone
- ❌ Don't use placeholders as labels
- ❌ Don't create keyboard traps
- ❌ Don't use positive tabIndex values
- ❌ Don't forget alt text
- ❌ Don't auto-play media
- ❌ Don't use low contrast text
- ❌ Don't make time-limited interactions
- ❌ Don't ignore ARIA patterns
- ❌ Don't nest interactive elements

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
