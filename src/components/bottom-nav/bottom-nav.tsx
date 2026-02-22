import React from 'react';
import { cn } from '@/lib/utils';

export interface BottomNavItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    href?: string;
    onClick?: () => void;
    active?: boolean;
}

export interface BottomNavProps extends React.HTMLAttributes<HTMLElement> {
    items: BottomNavItem[];
}

const BottomNav = React.forwardRef<HTMLElement, BottomNavProps>(
    ({ items, className, ...props }, ref) => (
        <nav
            ref={ref}
            role="navigation"
            aria-label="Bottom navigation"
            className={cn(
                'fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-background/95 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden',
                className
            )}
            {...props}
        >
            {items.map((item) => {
                const content = (
                    <>
                        {item.icon && (
                            <span className="flex shrink-0" aria-hidden>
                                {item.icon}
                            </span>
                        )}
                        <span className="text-xs font-medium">
                            {item.label}
                        </span>
                    </>
                );

                const baseClasses =
                    'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

                const activeClasses = item.active
                    ? 'bg-accent text-accent-foreground'
                    : '';

                if (item.href) {
                    return (
                        <a
                            key={item.id}
                            href={item.href}
                            className={cn(baseClasses, activeClasses)}
                            aria-current={item.active ? 'page' : undefined}
                        >
                            {content}
                        </a>
                    );
                }

                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={item.onClick}
                        className={cn(baseClasses, activeClasses)}
                        aria-current={item.active ? 'page' : undefined}
                    >
                        {content}
                    </button>
                );
            })}
        </nav>
    )
);
BottomNav.displayName = 'BottomNav';

export { BottomNav };
