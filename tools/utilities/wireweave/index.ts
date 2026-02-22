/**
 * Wireweave Test ID Spec
 * Standard data-testid values for Maestro E2E testing
 */
export const WIREWEAVE_TEST_IDS = {
    flow_card: 'flow-card',
    stepper: 'stepper',
    data_table: 'data-table',
    chip: 'chip',
    bottom_nav: 'bottom-nav',
} as const;

export type WireweaveTestId = keyof typeof WIREWEAVE_TEST_IDS;
