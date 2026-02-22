import React from 'react';
import { cn } from '@/lib/utils';

export interface BottomNavItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
}

export interface BottomNavProps {
    items: BottomNavItem[];
    activeId?: string;
    className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
    items,
    activeId,
    className,
}) => (
    <nav
        className={cn(
            'flex items-center justify-around gap-1 border-t bg-background px-2 py-2',
            className
        )}
        role="navigation"
    >
        {items.map((item) => {
            const isActive = item.id === activeId;

            return (
                <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    className={cn(
                        'flex flex-col items-center gap-1 rounded-lg px-4 py-2 text-xs font-medium transition-colors',
                        isActive
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </button>
            );
        })}
    </nav>
);
