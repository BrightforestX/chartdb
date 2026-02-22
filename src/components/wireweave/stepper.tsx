import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface StepperStep {
    id: string;
    label: string;
    description?: string;
}

export interface StepperProps {
    steps: StepperStep[];
    currentStep: number;
    onStepClick?: (index: number) => void;
    className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
    steps,
    currentStep,
    onStepClick,
    className,
}) => (
    <nav
        aria-label="Progress"
        className={cn('flex items-center justify-between', className)}
    >
        {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isClickable = onStepClick && (isCompleted || isCurrent);

            return (
                <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center">
                        <button
                            type="button"
                            onClick={() => isClickable && onStepClick(index)}
                            disabled={!isClickable}
                            className={cn(
                                'flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                isCompleted &&
                                    'border-primary bg-primary text-primary-foreground',
                                isCurrent &&
                                    'border-primary bg-primary text-primary-foreground',
                                !isCompleted &&
                                    !isCurrent &&
                                    'border-muted-foreground/30 bg-background',
                                isClickable &&
                                    'cursor-pointer hover:opacity-90',
                                !isClickable && 'cursor-default'
                            )}
                            aria-current={isCurrent ? 'step' : undefined}
                        >
                            {isCompleted ? (
                                <Check className="size-5" />
                            ) : (
                                <span className="text-sm font-medium">
                                    {index + 1}
                                </span>
                            )}
                        </button>
                        <span
                            className={cn(
                                'mt-2 text-xs font-medium',
                                isCurrent
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                            )}
                        >
                            {step.label}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div
                            className={cn(
                                'mx-2 h-0.5 flex-1 min-w-[24px]',
                                isCompleted ? 'bg-primary' : 'bg-muted'
                            )}
                            aria-hidden
                        />
                    )}
                </React.Fragment>
            );
        })}
    </nav>
);
