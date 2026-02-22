import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/card/card';
import { cn } from '@/lib/utils';

export interface FlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Optional step number or badge */
    step?: number;
    /** Whether this step is active */
    active?: boolean;
    /** Whether this step is completed */
    completed?: boolean;
}

const FlowCard = React.forwardRef<HTMLDivElement, FlowCardProps>(
    ({ className, active, completed, children, ...props }, ref) => (
        <Card
            ref={ref}
            className={cn(
                'transition-all duration-200',
                active && 'ring-2 ring-primary ring-offset-2',
                completed && 'border-primary/30 bg-primary/5',
                className
            )}
            {...props}
        >
            {children}
        </Card>
    )
);
FlowCard.displayName = 'FlowCard';

const FlowCardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { step?: number }
>(({ className, ...props }, ref) => (
    <CardHeader
        ref={ref}
        className={cn('flex flex-row items-center gap-2', className)}
        {...props}
    />
));
FlowCardHeader.displayName = 'FlowCardHeader';

export {
    FlowCard,
    FlowCardHeader,
    CardContent as FlowCardContent,
    CardTitle as FlowCardTitle,
    CardDescription as FlowCardDescription,
    CardFooter as FlowCardFooter,
};
