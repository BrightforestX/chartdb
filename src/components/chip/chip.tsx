import React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chipVariants } from './chip-variants';

export interface ChipProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof chipVariants> {
    onRemove?: () => void;
    removable?: boolean;
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
    (
        {
            className,
            variant = 'default',
            size = 'default',
            onRemove,
            removable = false,
            children,
            ...props
        },
        ref
    ) => (
        <div
            ref={ref}
            className={cn(chipVariants({ variant, size }), className)}
            {...props}
        >
            <span className="inline-flex items-center gap-1">{children}</span>
            {(removable || onRemove) && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove?.();
                    }}
                    className="ml-0.5 inline-flex shrink-0 rounded-full p-0.5 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                    aria-label="Remove"
                >
                    <X className="size-3" />
                </button>
            )}
        </div>
    )
);
Chip.displayName = 'Chip';

export { Chip };
