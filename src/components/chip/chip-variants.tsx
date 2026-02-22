import { cva } from 'class-variance-authority';

export const chipVariants = cva(
    'inline-flex items-center rounded-full border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default:
                    'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
                secondary:
                    'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
                outline:
                    'border-input bg-background hover:bg-accent hover:text-accent-foreground',
                destructive:
                    'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
            },
            size: {
                default: 'px-2.5 py-0.5 text-xs',
                sm: 'px-2 py-0.5 text-[10px]',
                lg: 'px-3 py-1 text-sm',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);
