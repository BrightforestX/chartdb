import { describe, expect, it, vi } from 'vitest';
import {
    databaseTypeToLabelMap,
    databaseLogoMap,
    databaseDarkLogoMap,
    getDatabaseLogo,
    databaseSecondaryLogoMap,
} from '../databases';
import { DatabaseType } from '../domain/database-type';
import type { EffectiveTheme } from '../types';

// Mock the image imports
vi.mock('@/assets/mysql_logo.png', () => ({ default: 'mysql_logo.png' }));
vi.mock('@/assets/mysql_logo_dark.png', () => ({
    default: 'mysql_logo_dark.png',
}));
vi.mock('@/assets/postgresql_logo.png', () => ({
    default: 'postgresql_logo.png',
}));
vi.mock('@/assets/postgresql_logo_dark.png', () => ({
    default: 'postgresql_logo_dark.png',
}));
vi.mock('@/assets/mariadb_logo.png', () => ({
    default: 'mariadb_logo.png',
}));
vi.mock('@/assets/mariadb_logo_dark.png', () => ({
    default: 'mariadb_logo_dark.png',
}));
vi.mock('@/assets/sqlite_logo.png', () => ({ default: 'sqlite_logo.png' }));
vi.mock('@/assets/sqlite_logo_dark.png', () => ({
    default: 'sqlite_logo_dark.png',
}));
vi.mock('@/assets/sql_server_logo.png', () => ({
    default: 'sql_server_logo.png',
}));
vi.mock('@/assets/sql_server_logo_dark.png', () => ({
    default: 'sql_server_logo_dark.png',
}));
vi.mock('@/assets/mysql_logo_2.png', () => ({
    default: 'mysql_logo_2.png',
}));
vi.mock('@/assets/postgresql_logo_2.png', () => ({
    default: 'postgresql_logo_2.png',
}));
vi.mock('@/assets/mariadb_logo_2.png', () => ({
    default: 'mariadb_logo_2.png',
}));
vi.mock('@/assets/sqlite_logo_2.png', () => ({
    default: 'sqlite_logo_2.png',
}));
vi.mock('@/assets/sql_server_logo_2.png', () => ({
    default: 'sql_server_logo_2.png',
}));
vi.mock('@/assets/general_db_logo_2.png', () => ({
    default: 'general_db_logo_2.png',
}));
vi.mock('@/assets/clickhouse_logo.png', () => ({
    default: 'clickhouse_logo.png',
}));
vi.mock('@/assets/clickhouse_logo_dark.png', () => ({
    default: 'clickhouse_logo_dark.png',
}));
vi.mock('@/assets/clickhouse_logo_2.png', () => ({
    default: 'clickhouse_logo_2.png',
}));
vi.mock('@/assets/cockroachdb_logo.png', () => ({
    default: 'cockroachdb_logo.png',
}));
vi.mock('@/assets/cockroachdb_logo_dark.png', () => ({
    default: 'cockroachdb_logo_dark.png',
}));
vi.mock('@/assets/cockroachdb_logo_2.png', () => ({
    default: 'cockroachdb_logo_2.png',
}));
vi.mock('@/assets/oracle_logo.png', () => ({ default: 'oracle_logo.png' }));
vi.mock('@/assets/oracle_logo_dark.png', () => ({
    default: 'oracle_logo_dark.png',
}));
vi.mock('@/assets/oracle_logo_2.png', () => ({
    default: 'oracle_logo_2.png',
}));

describe('databases', () => {
    describe('databaseTypeToLabelMap', () => {
        it('should have labels for all database types', () => {
            const databaseTypes = Object.values(DatabaseType);
            databaseTypes.forEach((type) => {
                expect(databaseTypeToLabelMap[type]).toBeDefined();
                expect(typeof databaseTypeToLabelMap[type]).toBe('string');
            });
        });

        it('should have correct label for PostgreSQL', () => {
            expect(databaseTypeToLabelMap[DatabaseType.POSTGRESQL]).toBe(
                'PostgreSQL'
            );
        });

        it('should have correct label for MySQL', () => {
            expect(databaseTypeToLabelMap[DatabaseType.MYSQL]).toBe('MySQL');
        });

        it('should have correct label for SQL Server', () => {
            expect(databaseTypeToLabelMap[DatabaseType.SQL_SERVER]).toBe(
                'SQL Server'
            );
        });

        it('should have correct label for MariaDB', () => {
            expect(databaseTypeToLabelMap[DatabaseType.MARIADB]).toBe(
                'MariaDB'
            );
        });

        it('should have correct label for SQLite', () => {
            expect(databaseTypeToLabelMap[DatabaseType.SQLITE]).toBe('SQLite');
        });

        it('should have correct label for ClickHouse', () => {
            expect(databaseTypeToLabelMap[DatabaseType.CLICKHOUSE]).toBe(
                'ClickHouse'
            );
        });

        it('should have correct label for CockroachDB', () => {
            expect(databaseTypeToLabelMap[DatabaseType.COCKROACHDB]).toBe(
                'CockroachDB'
            );
        });

        it('should have correct label for Oracle', () => {
            expect(databaseTypeToLabelMap[DatabaseType.ORACLE]).toBe('Oracle');
        });

        it('should have correct label for Generic', () => {
            expect(databaseTypeToLabelMap[DatabaseType.GENERIC]).toBe(
                'Generic'
            );
        });
    });

    describe('databaseLogoMap', () => {
        it('should have logos for all database types', () => {
            const databaseTypes = Object.values(DatabaseType);
            databaseTypes.forEach((type) => {
                expect(databaseLogoMap).toHaveProperty(type);
            });
        });

        it('should have non-empty logo paths for major databases', () => {
            expect(databaseLogoMap[DatabaseType.POSTGRESQL]).toBeTruthy();
            expect(databaseLogoMap[DatabaseType.MYSQL]).toBeTruthy();
            expect(databaseLogoMap[DatabaseType.SQL_SERVER]).toBeTruthy();
            expect(databaseLogoMap[DatabaseType.MARIADB]).toBeTruthy();
            expect(databaseLogoMap[DatabaseType.SQLITE]).toBeTruthy();
        });

        it('should have empty logo path for generic database', () => {
            expect(databaseLogoMap[DatabaseType.GENERIC]).toBe('');
        });
    });

    describe('databaseDarkLogoMap', () => {
        it('should have dark logos for all database types', () => {
            const databaseTypes = Object.values(DatabaseType);
            databaseTypes.forEach((type) => {
                expect(databaseDarkLogoMap).toHaveProperty(type);
            });
        });

        it('should have non-empty dark logo paths for major databases', () => {
            expect(databaseDarkLogoMap[DatabaseType.POSTGRESQL]).toBeTruthy();
            expect(databaseDarkLogoMap[DatabaseType.MYSQL]).toBeTruthy();
            expect(databaseDarkLogoMap[DatabaseType.SQL_SERVER]).toBeTruthy();
            expect(databaseDarkLogoMap[DatabaseType.MARIADB]).toBeTruthy();
            expect(databaseDarkLogoMap[DatabaseType.SQLITE]).toBeTruthy();
        });

        it('should have empty dark logo path for generic database', () => {
            expect(databaseDarkLogoMap[DatabaseType.GENERIC]).toBe('');
        });

        it('should have different logos for light and dark themes', () => {
            expect(databaseLogoMap[DatabaseType.POSTGRESQL]).not.toBe(
                databaseDarkLogoMap[DatabaseType.POSTGRESQL]
            );
            expect(databaseLogoMap[DatabaseType.MYSQL]).not.toBe(
                databaseDarkLogoMap[DatabaseType.MYSQL]
            );
        });
    });

    describe('getDatabaseLogo', () => {
        it('should return dark logo when theme is dark', () => {
            const result = getDatabaseLogo(
                DatabaseType.POSTGRESQL,
                'dark' as EffectiveTheme
            );
            expect(result).toBe(databaseDarkLogoMap[DatabaseType.POSTGRESQL]);
        });

        it('should return light logo when theme is light', () => {
            const result = getDatabaseLogo(
                DatabaseType.POSTGRESQL,
                'light' as EffectiveTheme
            );
            expect(result).toBe(databaseLogoMap[DatabaseType.POSTGRESQL]);
        });

        it('should work for all database types with dark theme', () => {
            const databaseTypes = Object.values(DatabaseType);
            databaseTypes.forEach((type) => {
                const result = getDatabaseLogo(type, 'dark' as EffectiveTheme);
                expect(result).toBe(databaseDarkLogoMap[type]);
            });
        });

        it('should work for all database types with light theme', () => {
            const databaseTypes = Object.values(DatabaseType);
            databaseTypes.forEach((type) => {
                const result = getDatabaseLogo(type, 'light' as EffectiveTheme);
                expect(result).toBe(databaseLogoMap[type]);
            });
        });
    });

    describe('databaseSecondaryLogoMap', () => {
        it('should have secondary logos for all database types', () => {
            const databaseTypes = Object.values(DatabaseType);
            databaseTypes.forEach((type) => {
                expect(databaseSecondaryLogoMap).toHaveProperty(type);
                expect(databaseSecondaryLogoMap[type]).toBeDefined();
            });
        });

        it('should have non-empty secondary logo paths', () => {
            expect(
                databaseSecondaryLogoMap[DatabaseType.POSTGRESQL]
            ).toBeTruthy();
            expect(databaseSecondaryLogoMap[DatabaseType.MYSQL]).toBeTruthy();
            expect(
                databaseSecondaryLogoMap[DatabaseType.SQL_SERVER]
            ).toBeTruthy();
            expect(databaseSecondaryLogoMap[DatabaseType.MARIADB]).toBeTruthy();
            expect(databaseSecondaryLogoMap[DatabaseType.SQLITE]).toBeTruthy();
            expect(databaseSecondaryLogoMap[DatabaseType.GENERIC]).toBeTruthy();
        });

        it('should have different secondary logos than primary logos', () => {
            expect(databaseLogoMap[DatabaseType.POSTGRESQL]).not.toBe(
                databaseSecondaryLogoMap[DatabaseType.POSTGRESQL]
            );
            expect(databaseLogoMap[DatabaseType.MYSQL]).not.toBe(
                databaseSecondaryLogoMap[DatabaseType.MYSQL]
            );
        });
    });
});
