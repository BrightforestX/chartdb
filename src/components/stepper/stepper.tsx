import React from 'react';
import { cn } from '@/lib/utils';

export interface StepperStep {
    id: string;
    label: string;
    description?: string;
}

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
    steps: StepperStep[];
    currentStep: number;
    orientation?: 'horizontal' | 'vertical';
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
    (
        { steps, currentStep, orientation = 'horizontal', className, ...props },
        ref
    ) => (
        <div
            ref={ref}
            className={cn(
                'flex w-full',
                orientation === 'vertical' && 'flex-col',
                orientation === 'horizontal' && 'flex-row items-start',
                className
            )}
            role="list"
            aria-label="Progress"
            {...props}
        >
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isLast = index === steps.length - 1;

                return (
                    <React.Fragment key={step.id}>
                        <div
                            className={cn(
                                'flex items-center',
                                orientation === 'vertical' && 'flex-row',
                                orientation === 'horizontal' && 'flex-col'
                            )}
                            role="listitem"
                        >
                            <div className="flex items-center">
                                <div
                                    className={cn(
                                        'flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                                        isCompleted &&
                                            'border-primary bg-primary text-primary-foreground',
                                        isCurrent &&
                                            'border-primary bg-background text-primary ring-2 ring-primary/20',
                                        !isCompleted &&
                                            !isCurrent &&
                                            'border-muted-foreground/30 bg-muted/50 text-muted-foreground'
                                    )}
                                    aria-current={
                                        isCurrent ? 'step' : undefined
                                    }
                                >
                                    {isCompleted ? (
                                        <svg
                                            className="size-5"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                            aria-hidden
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                            </div>
                            <div
                                className={cn(
                                    'mt-2',
                                    orientation === 'horizontal' &&
                                        'text-center'
                                )}
                            >
                                <p
                                    className={cn(
                                        'text-sm font-medium',
                                        isCurrent && 'text-foreground',
                                        isCompleted && 'text-muted-foreground',
                                        !isCurrent &&
                                            !isCompleted &&
                                            'text-muted-foreground'
                                    )}
                                >
                                    {step.label}
                                </p>
                                {step.description && (
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {step.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        {!isLast && (
                            <div
                                className={cn(
                                    'shrink-0',
                                    orientation === 'horizontal' &&
                                        'mx-2 h-0.5 w-4 self-[2.25rem] bg-muted',
                                    orientation === 'vertical' &&
                                        'my-2 ml-4 h-4 w-0.5 self-start bg-muted'
                                )}
                                aria-hidden
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    )
);
Stepper.displayName = 'Stepper';

export { Stepper };
