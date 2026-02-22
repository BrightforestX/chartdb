import React from 'react';
import { cn } from '@/lib/utils';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
    size?: 'sm' | 'md';
}

const chipVariants = {
    default: 'bg-primary text-primary-foreground border-transparent',
    secondary: 'bg-secondary text-secondary-foreground border-transparent',
    outline: 'border border-input bg-transparent',
    destructive:
        'bg-destructive text-destructive-foreground border-transparent',
};

const chipSizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
};

export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
    ({ className, variant = 'default', size = 'md', ...props }, ref) => (
        <span
            ref={ref}
            className={cn(
                'inline-flex items-center rounded-full border font-medium transition-colors',
                chipVariants[variant],
                chipSizes[size],
                className
            )}
            {...props}
        />
    )
);
Chip.displayName = 'Chip';
