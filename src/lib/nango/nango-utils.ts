import type Nango from '@nangohq/frontend';

/**
 * Database connection configuration for Nango integrations
 */
export interface NangoDatabaseConnection {
    providerConfigKey: string;
    connectionId: string;
    databaseType: string;
    connectionParams?: Record<string, unknown>;
}

/**
 * Supported database providers for Nango integration
 */
export const NANGO_DATABASE_PROVIDERS = {
    POSTGRESQL: 'postgresql',
    MYSQL: 'mysql',
    SURREALDB: 'surrealdb',
    FIRESTORE: 'firestore',
    MONGODB: 'mongodb',
} as const;

/**
 * Get database connection using Nango authentication
 */
export const getNangoDatabaseConnection = async (
    nango: Nango,
    connectionId: string
): Promise<NangoDatabaseConnection | null> => {
    try {
        const connection = await nango.getConnection(connectionId);

        if (!connection) {
            return null;
        }

        return {
            providerConfigKey: connection.provider_config_key,
            connectionId: connection.connection_id,
            databaseType: connection.provider_config_key,
            connectionParams: connection.connection_config,
        };
    } catch (error) {
        console.error('Failed to get Nango database connection:', error);
        return null;
    }
};

/**
 * Test database connection through Nango
 */
export const testNangoDatabaseConnection = async (
    nango: Nango,
    connectionId: string
): Promise<boolean> => {
    try {
        const connection = await getNangoDatabaseConnection(
            nango,
            connectionId
        );
        return connection !== null;
    } catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
};

/**
 * Get all active Nango database connections
 * Note: This would require implementing a backend endpoint
 * that lists connections for the current user.
 * The nango parameter would be used to fetch connections from the API.
 */
export const listNangoDatabaseConnections = async (): Promise<
    NangoDatabaseConnection[]
> => {
    try {
        // For now, return empty array as this is a frontend-only implementation
        return [];
    } catch (error) {
        console.error('Failed to list Nango connections:', error);
        return [];
    }
};

/**
 * Format connection display name
 */
export const formatConnectionDisplayName = (
    connection: NangoDatabaseConnection
): string => {
    return `${connection.databaseType} - ${connection.connectionId}`;
};

/**
 * Check if a database type is supported by Nango integration
 */
export const isSupportedNangoDatabaseType = (databaseType: string): boolean => {
    return Object.values(NANGO_DATABASE_PROVIDERS).includes(
        databaseType as (typeof NANGO_DATABASE_PROVIDERS)[keyof typeof NANGO_DATABASE_PROVIDERS]
    );
};
