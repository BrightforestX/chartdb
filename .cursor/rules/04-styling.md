# Styling and CSS Guidelines

## Overview
ChartDB uses TailwindCSS for styling with a custom configuration. Follow these guidelines for consistent, maintainable styling.

## TailwindCSS Configuration

The project uses a custom Tailwind configuration located in `tailwind.config.js` with:
- Custom color palette
- Extended spacing scale
- Custom animations
- Dark mode support

## The `cn()` Utility

Always use the `cn()` utility from `@/lib/utils` for className merging:

```typescript
import { cn } from '@/lib/utils';

// ✅ Good - Conditional classes with cn()
<div className={cn(
    'base-class',
    isActive && 'active-class',
    error && 'error-class',
    className
)}>

// ✅ Good - Merge prop className
export const Button: React.FC<ButtonProps> = ({ className, ...props }) => {
    return (
        <button className={cn('btn-base', className)} {...props}>
            {/* content */}
        </button>
    );
};

// ❌ Bad - String concatenation
<div className={`base-class ${isActive ? 'active-class' : ''} ${className}`}>

// ❌ Bad - Not accepting className prop
export const Button: React.FC<ButtonProps> = (props) => {
    return <button className="btn-base" {...props}>;
};
```

## Component Styling Patterns

### Base Classes

Always provide base classes and allow override via className prop:

```typescript
// ✅ Good - Base classes + className prop
export const Card: React.FC<CardProps> = ({ className, children }) => {
    return (
        <div className={cn(
            'rounded-lg border bg-card text-card-foreground shadow-sm',
            className
        )}>
            {children}
        </div>
    );
};

// Usage - can extend or override
<Card className="hover:shadow-lg transition-shadow" />
```

### Variant Classes with CVA

Use class-variance-authority for variants:

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
    // Base classes
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground hover:bg-primary/90',
                destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-md px-3',
                lg: 'h-11 rounded-md px-8',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
```

## Tailwind Class Ordering

Follow this order for Tailwind classes (enforced by eslint-plugin-tailwindcss):

1. Layout (display, position, top, right, etc.)
2. Sizing (width, height, padding, margin)
3. Typography (font, text, leading, tracking)
4. Visual (background, border, shadow, opacity)
5. Misc (cursor, pointer-events, etc.)

```typescript
// ✅ Good - Logical ordering
<div className={cn(
    'flex items-center justify-between',  // Layout
    'w-full h-12 px-4 py-2',              // Sizing
    'text-sm font-medium',                 // Typography
    'bg-primary text-white rounded-md',    // Visual
    'hover:bg-primary/90 transition-colors' // Interactions
)} />
```

## Responsive Design

Use Tailwind's responsive prefixes:

```typescript
// ✅ Good - Mobile-first responsive design
<div className={cn(
    'flex flex-col',           // Mobile: stack
    'md:flex-row',             // Tablet: horizontal
    'lg:gap-8',                // Desktop: larger gap
    'xl:max-w-7xl'             // XL: constrain width
)} />

// ✅ Good - Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold" />

// ✅ Good - Responsive visibility
<div className="hidden md:block" />
<div className="block md:hidden" />
```

## Dark Mode

ChartDB supports dark mode. Use appropriate classes:

```typescript
// ✅ Good - Dark mode support
<div className={cn(
    'bg-white text-gray-900',
    'dark:bg-gray-900 dark:text-gray-100'
)} />

// ✅ Good - Use semantic color tokens
<div className="bg-background text-foreground" />
<div className="bg-card text-card-foreground" />
<div className="bg-primary text-primary-foreground" />

// ❌ Bad - Hard-coded colors without dark mode
<div className="bg-white text-black" />
```

## Semantic Color Tokens

Use semantic color tokens from the theme:

```typescript
// ✅ Good - Semantic tokens
bg-background       // Main background
bg-foreground       // Main text
bg-card            // Card background
bg-card-foreground // Card text
bg-primary         // Primary actions
bg-secondary       // Secondary actions
bg-muted           // Muted backgrounds
bg-accent          // Accent backgrounds
bg-destructive     // Destructive actions
bg-border          // Borders
bg-input           // Input fields
bg-ring            // Focus rings

// ❌ Bad - Direct color values
bg-blue-500
bg-gray-900
```

## CSS Modules

Use CSS modules for complex, component-specific styles:

```typescript
// component.module.css
.container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}

.complexAnimation {
    animation: slide-in 0.3s ease-out;
}

@keyframes slide-in {
    from {
        transform: translateX(-100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

// component.tsx
import styles from './component.module.css';
import { cn } from '@/lib/utils';

export const Component: React.FC<Props> = ({ className }) => {
    return (
        <div className={cn(styles.container, className)}>
            <div className={styles.complexAnimation}>Content</div>
        </div>
    );
};
```

## Animations

### Tailwind Animations

```typescript
// ✅ Good - Built-in animations
<div className="animate-spin" />
<div className="animate-pulse" />
<div className="animate-bounce" />

// ✅ Good - Transition utilities
<button className="transition-colors duration-200 hover:bg-primary/90" />
<div className="transition-all duration-300 ease-in-out" />
```

### Custom Animations

Define in tailwind.config.js or use Motion library:

```typescript
import { motion } from 'motion';

// ✅ Good - Motion for complex animations
export const AnimatedCard: React.FC = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
        >
            {children}
        </motion.div>
    );
};
```

## Layout Patterns

### Flexbox

```typescript
// ✅ Good - Common flex patterns
<div className="flex items-center justify-between" />
<div className="flex flex-col gap-4" />
<div className="flex items-center space-x-2" />

// ✅ Good - Flex item control
<div className="flex">
    <aside className="flex-shrink-0 w-64" />
    <main className="flex-1" />
</div>
```

### Grid

```typescript
// ✅ Good - Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" />

// ✅ Good - Auto-fit grid
<div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4" />
```

### Container

```typescript
// ✅ Good - Container with max-width
<div className="container mx-auto px-4 max-w-7xl" />

// ✅ Good - Responsive padding
<div className="px-4 md:px-6 lg:px-8" />
```

## Focus States

Always provide visible focus states for accessibility:

```typescript
// ✅ Good - Visible focus state
<button className={cn(
    'px-4 py-2 rounded',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
)} />

// ✅ Good - Custom focus with Radix
<input className={cn(
    'px-3 py-2 border rounded',
    'focus:border-primary focus:ring-2 focus:ring-primary/20'
)} />
```

## Hover States

```typescript
// ✅ Good - Smooth hover transitions
<button className={cn(
    'bg-primary text-white',
    'hover:bg-primary/90',
    'transition-colors duration-200'
)} />

// ✅ Good - Group hover
<div className="group">
    <div className="group-hover:translate-x-1 transition-transform" />
</div>
```

## Spacing Scale

Use consistent spacing from Tailwind's scale:

```typescript
// ✅ Good - Consistent spacing
gap-1     // 0.25rem (4px)
gap-2     // 0.5rem (8px)
gap-4     // 1rem (16px)
gap-6     // 1.5rem (24px)
gap-8     // 2rem (32px)

// ✅ Good - Semantic spacing
<div className="space-y-4">       // Vertical spacing
<div className="space-x-2">       // Horizontal spacing
<div className="divide-y">        // Dividers
```

## Typography

```typescript
// ✅ Good - Typography scale
<h1 className="text-4xl font-bold tracking-tight" />
<h2 className="text-3xl font-semibold" />
<h3 className="text-2xl font-medium" />
<p className="text-base leading-7" />
<small className="text-sm text-muted-foreground" />

// ✅ Good - Text truncation
<p className="truncate" />                    // Single line
<p className="line-clamp-2" />                // Multiple lines
<p className="overflow-hidden text-ellipsis" />
```

## Borders and Shadows

```typescript
// ✅ Good - Consistent borders
<div className="border border-border rounded-md" />
<div className="border-2 border-primary" />
<div className="divide-y divide-border" />

// ✅ Good - Shadows
<div className="shadow-sm" />    // Subtle
<div className="shadow-md" />    // Medium
<div className="shadow-lg" />    // Large
<div className="shadow-xl" />    // Extra large
```

## Positioning

```typescript
// ✅ Good - Absolute positioning
<div className="relative">
    <div className="absolute top-2 right-2" />
</div>

// ✅ Good - Sticky positioning
<header className="sticky top-0 z-50 bg-background" />

// ✅ Good - Fixed positioning
<div className="fixed bottom-4 right-4 z-50" />
```

## Z-Index

Use consistent z-index values:

```typescript
z-0      // Base layer
z-10     // Dropdowns, popovers
z-20     // Sticky headers
z-30     // Modals
z-40     // Toasts
z-50     // Tooltips
```

## Performance Considerations

```typescript
// ✅ Good - Use will-change for animations
<div className="will-change-transform" />

// ✅ Good - Use transform instead of top/left
<div className="translate-x-4" />  // Better than left-4 for animations

// ❌ Bad - Overusing transitions
<div className="transition-all" />  // Animates everything (expensive)
```

## Best Practices Summary

### Do's
- ✅ Use cn() utility for className merging
- ✅ Always accept className prop in components
- ✅ Use CVA for component variants
- ✅ Use semantic color tokens
- ✅ Support dark mode
- ✅ Provide visible focus states
- ✅ Use Tailwind's responsive prefixes
- ✅ Follow mobile-first approach
- ✅ Use consistent spacing scale
- ✅ Use CSS modules for complex styles

### Don'ts
- ❌ Don't use string concatenation for classes
- ❌ Don't use hard-coded colors
- ❌ Don't forget dark mode styles
- ❌ Don't skip focus states
- ❌ Don't use arbitrary values excessively
- ❌ Don't use !important (let specificity work)
- ❌ Don't create overly specific selectors
- ❌ Don't use inline styles (except dynamic values)
