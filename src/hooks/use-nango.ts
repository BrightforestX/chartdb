import { NANGO_ENABLED } from '@/lib/env';

/**
 * Hook for Nango OAuth/sync integration.
 * Use when connecting to databases via Nango (e.g. Supabase, Firebase, etc.)
 */
export function useNango() {
    return {
        isEnabled: NANGO_ENABLED,
        /** Integration ID for database connections - extend as needed */
        integrationIds: {
            postgresql: 'postgresql',
            mysql: 'mysql',
            firestore: 'firestore',
            surrealdb: 'surrealdb',
        } as const,
    };
}
