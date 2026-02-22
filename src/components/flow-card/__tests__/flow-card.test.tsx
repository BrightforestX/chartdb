import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
    FlowCard,
    FlowCardHeader,
    FlowCardTitle,
    FlowCardContent,
} from '@/components/flow-card/flow-card';

describe('FlowCard', () => {
    it('renders with default variant', () => {
        render(
            <FlowCard>
                <FlowCardHeader>
                    <FlowCardTitle>Step 1</FlowCardTitle>
                </FlowCardHeader>
                <FlowCardContent>Content</FlowCardContent>
            </FlowCard>
        );
        expect(screen.getByText('Step 1')).toBeInTheDocument();
        expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders with active variant', () => {
        const { container } = render(
            <FlowCard variant="active">
                <FlowCardContent>Active step</FlowCardContent>
            </FlowCard>
        );
        expect(container.firstChild).toHaveAttribute('data-variant', 'active');
    });
});
