import React from 'react';
import { cn } from '@/lib/utils';

const FlowCard = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        variant?: 'default' | 'active' | 'completed';
    }
>(({ className, variant = 'default', ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'rounded-xl border bg-card text-card-foreground shadow transition-colors',
            variant === 'active' &&
                'border-primary ring-2 ring-primary/20 ring-offset-2',
            variant === 'completed' && 'border-muted-foreground/30 opacity-90',
            className
        )}
        data-variant={variant}
        {...props}
    />
));
FlowCard.displayName = 'FlowCard';

const FlowCardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-6', className)}
        {...props}
    />
));
FlowCardHeader.displayName = 'FlowCardHeader';

const FlowCardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn('font-semibold leading-none tracking-tight', className)}
        {...props}
    />
));
FlowCardTitle.displayName = 'FlowCardTitle';

const FlowCardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
    />
));
FlowCardDescription.displayName = 'FlowCardDescription';

const FlowCardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
FlowCardContent.displayName = 'FlowCardContent';

const FlowCardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('flex items-center p-6 pt-0', className)}
        {...props}
    />
));
FlowCardFooter.displayName = 'FlowCardFooter';

export {
    FlowCard,
    FlowCardHeader,
    FlowCardTitle,
    FlowCardDescription,
    FlowCardContent,
    FlowCardFooter,
};
