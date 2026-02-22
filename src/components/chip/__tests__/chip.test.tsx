import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chip } from '@/components/chip/chip';

describe('Chip', () => {
    it('renders chip content', () => {
        render(<Chip>Tag</Chip>);
        expect(screen.getByText('Tag')).toBeInTheDocument();
    });

    it('calls onRemove when remove button is clicked', async () => {
        const onRemove = vi.fn();
        render(
            <Chip onRemove={onRemove} removable>
                Tag
            </Chip>
        );
        await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
        expect(onRemove).toHaveBeenCalled();
    });
});
