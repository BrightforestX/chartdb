import { describe, expect, it } from 'vitest';
import {
    DATABASE_CAPABILITIES,
    getDatabaseCapabilities,
    databaseSupportsArrays,
    databaseTypesWithCommentSupport,
    supportsCustomTypes,
} from '../database-capabilities';
import { DatabaseType } from '../database-type';

describe('database-capabilities', () => {
    describe('DATABASE_CAPABILITIES', () => {
        it('should have capabilities for all database types', () => {
            const databaseTypes = Object.values(DatabaseType);
            databaseTypes.forEach((type) => {
                expect(DATABASE_CAPABILITIES).toHaveProperty(type);
                expect(DATABASE_CAPABILITIES[type]).toBeDefined();
            });
        });

        it('should have PostgreSQL with full capabilities', () => {
            const capabilities = DATABASE_CAPABILITIES[DatabaseType.POSTGRESQL];
            expect(capabilities.supportsArrays).toBe(true);
            expect(capabilities.supportsCustomTypes).toBe(true);
            expect(capabilities.supportsSchemas).toBe(true);
            expect(capabilities.supportsComments).toBe(true);
        });

        it('should have CockroachDB with most capabilities', () => {
            const capabilities =
                DATABASE_CAPABILITIES[DatabaseType.COCKROACHDB];
            expect(capabilities.supportsArrays).toBe(true);
            expect(capabilities.supportsSchemas).toBe(true);
            expect(capabilities.supportsComments).toBe(true);
        });

        it('should have MySQL with no special capabilities', () => {
            const capabilities = DATABASE_CAPABILITIES[DatabaseType.MYSQL];
            expect(Object.keys(capabilities)).toHaveLength(0);
        });

        it('should have MariaDB with no special capabilities', () => {
            const capabilities = DATABASE_CAPABILITIES[DatabaseType.MARIADB];
            expect(Object.keys(capabilities)).toHaveLength(0);
        });

        it('should have SQL Server with schema support', () => {
            const capabilities = DATABASE_CAPABILITIES[DatabaseType.SQL_SERVER];
            expect(capabilities.supportsSchemas).toBe(true);
        });

        it('should have SQLite with no special capabilities', () => {
            const capabilities = DATABASE_CAPABILITIES[DatabaseType.SQLITE];
            expect(Object.keys(capabilities)).toHaveLength(0);
        });

        it('should have ClickHouse with schema support', () => {
            const capabilities = DATABASE_CAPABILITIES[DatabaseType.CLICKHOUSE];
            expect(capabilities.supportsSchemas).toBe(true);
        });

        it('should have Oracle with schema and comment support', () => {
            const capabilities = DATABASE_CAPABILITIES[DatabaseType.ORACLE];
            expect(capabilities.supportsSchemas).toBe(true);
            expect(capabilities.supportsComments).toBe(true);
        });

        it('should have Generic with no special capabilities', () => {
            const capabilities = DATABASE_CAPABILITIES[DatabaseType.GENERIC];
            expect(Object.keys(capabilities)).toHaveLength(0);
        });
    });

    describe('getDatabaseCapabilities', () => {
        it('should return capabilities for PostgreSQL', () => {
            const capabilities = getDatabaseCapabilities(
                DatabaseType.POSTGRESQL
            );
            expect(capabilities).toBe(
                DATABASE_CAPABILITIES[DatabaseType.POSTGRESQL]
            );
        });

        it('should return capabilities for MySQL', () => {
            const capabilities = getDatabaseCapabilities(DatabaseType.MYSQL);
            expect(capabilities).toBe(
                DATABASE_CAPABILITIES[DatabaseType.MYSQL]
            );
        });

        it('should return capabilities for all database types', () => {
            const databaseTypes = Object.values(DatabaseType);
            databaseTypes.forEach((type) => {
                const capabilities = getDatabaseCapabilities(type);
                expect(capabilities).toBe(DATABASE_CAPABILITIES[type]);
            });
        });
    });

    describe('databaseSupportsArrays', () => {
        it('should return true for PostgreSQL', () => {
            expect(databaseSupportsArrays(DatabaseType.POSTGRESQL)).toBe(true);
        });

        it('should return true for CockroachDB', () => {
            expect(databaseSupportsArrays(DatabaseType.COCKROACHDB)).toBe(true);
        });

        it('should return false for MySQL', () => {
            expect(databaseSupportsArrays(DatabaseType.MYSQL)).toBe(false);
        });

        it('should return false for MariaDB', () => {
            expect(databaseSupportsArrays(DatabaseType.MARIADB)).toBe(false);
        });

        it('should return false for SQL Server', () => {
            expect(databaseSupportsArrays(DatabaseType.SQL_SERVER)).toBe(false);
        });

        it('should return false for SQLite', () => {
            expect(databaseSupportsArrays(DatabaseType.SQLITE)).toBe(false);
        });

        it('should return false for ClickHouse', () => {
            expect(databaseSupportsArrays(DatabaseType.CLICKHOUSE)).toBe(false);
        });

        it('should return false for Oracle', () => {
            expect(databaseSupportsArrays(DatabaseType.ORACLE)).toBe(false);
        });

        it('should return false for Generic', () => {
            expect(databaseSupportsArrays(DatabaseType.GENERIC)).toBe(false);
        });
    });

    describe('supportsCustomTypes', () => {
        it('should return true for PostgreSQL', () => {
            expect(supportsCustomTypes(DatabaseType.POSTGRESQL)).toBe(true);
        });

        it('should return false for MySQL', () => {
            expect(supportsCustomTypes(DatabaseType.MYSQL)).toBe(false);
        });

        it('should return false for MariaDB', () => {
            expect(supportsCustomTypes(DatabaseType.MARIADB)).toBe(false);
        });

        it('should return false for SQL Server', () => {
            expect(supportsCustomTypes(DatabaseType.SQL_SERVER)).toBe(false);
        });

        it('should return false for SQLite', () => {
            expect(supportsCustomTypes(DatabaseType.SQLITE)).toBe(false);
        });

        it('should return false for ClickHouse', () => {
            expect(supportsCustomTypes(DatabaseType.CLICKHOUSE)).toBe(false);
        });

        it('should return false for CockroachDB', () => {
            expect(supportsCustomTypes(DatabaseType.COCKROACHDB)).toBe(false);
        });

        it('should return false for Oracle', () => {
            expect(supportsCustomTypes(DatabaseType.ORACLE)).toBe(false);
        });

        it('should return false for Generic', () => {
            expect(supportsCustomTypes(DatabaseType.GENERIC)).toBe(false);
        });
    });

    describe('databaseTypesWithCommentSupport', () => {
        it('should be an array', () => {
            expect(Array.isArray(databaseTypesWithCommentSupport)).toBe(true);
        });

        it('should include PostgreSQL', () => {
            expect(databaseTypesWithCommentSupport).toContain(
                DatabaseType.POSTGRESQL
            );
        });

        it('should include CockroachDB', () => {
            expect(databaseTypesWithCommentSupport).toContain(
                DatabaseType.COCKROACHDB
            );
        });

        it('should include Oracle', () => {
            expect(databaseTypesWithCommentSupport).toContain(
                DatabaseType.ORACLE
            );
        });

        it('should not include MySQL', () => {
            expect(databaseTypesWithCommentSupport).not.toContain(
                DatabaseType.MYSQL
            );
        });

        it('should not include MariaDB', () => {
            expect(databaseTypesWithCommentSupport).not.toContain(
                DatabaseType.MARIADB
            );
        });

        it('should not include SQLite', () => {
            expect(databaseTypesWithCommentSupport).not.toContain(
                DatabaseType.SQLITE
            );
        });

        it('should not include ClickHouse', () => {
            expect(databaseTypesWithCommentSupport).not.toContain(
                DatabaseType.CLICKHOUSE
            );
        });

        it('should have exactly 3 database types', () => {
            expect(databaseTypesWithCommentSupport).toHaveLength(3);
        });
    });

    describe('capabilities consistency', () => {
        it('should have consistent supportsArrays flag', () => {
            const databaseTypes = Object.values(DatabaseType);
            databaseTypes.forEach((type) => {
                const capabilities = getDatabaseCapabilities(type);
                const fromFunction = databaseSupportsArrays(type);
                const expected = capabilities.supportsArrays ?? false;
                expect(fromFunction).toBe(expected);
            });
        });

        it('should have consistent supportsCustomTypes flag', () => {
            const databaseTypes = Object.values(DatabaseType);
            databaseTypes.forEach((type) => {
                const capabilities = getDatabaseCapabilities(type);
                const fromFunction = supportsCustomTypes(type);
                const expected = capabilities.supportsCustomTypes ?? false;
                expect(fromFunction).toBe(expected);
            });
        });

        it('should correctly identify all databases with comment support', () => {
            const databaseTypes = Object.values(DatabaseType);
            const expectedWithComments = databaseTypes.filter((type) => {
                const capabilities = getDatabaseCapabilities(type);
                return capabilities.supportsComments === true;
            });

            expect(databaseTypesWithCommentSupport.sort()).toEqual(
                expectedWithComments.sort()
            );
        });
    });
});
