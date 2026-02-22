import { describe, it, expect } from 'vitest';
import {
    databaseTypeToLabelMap,
    databaseLogoMap,
    databaseDarkLogoMap,
    databaseSecondaryLogoMap,
    getDatabaseLogo,
} from '../databases';
import { DatabaseType } from '../domain/database-type';
import type { EffectiveTheme } from '../types';

describe('databases', () => {
    describe('databaseTypeToLabelMap', () => {
        it('should have labels for all database types', () => {
            const databaseTypes = Object.values(DatabaseType);

            databaseTypes.forEach((type) => {
                expect(databaseTypeToLabelMap[type]).toBeDefined();
                expect(typeof databaseTypeToLabelMap[type]).toBe('string');
                expect(databaseTypeToLabelMap[type].length).toBeGreaterThan(0);
            });
        });

        it('should have correct labels', () => {
            expect(databaseTypeToLabelMap[DatabaseType.GENERIC]).toBe(
                'Generic'
            );
            expect(databaseTypeToLabelMap[DatabaseType.POSTGRESQL]).toBe(
                'PostgreSQL'
            );
            expect(databaseTypeToLabelMap[DatabaseType.MYSQL]).toBe('MySQL');
            expect(databaseTypeToLabelMap[DatabaseType.SQL_SERVER]).toBe(
                'SQL Server'
            );
            expect(databaseTypeToLabelMap[DatabaseType.MARIADB]).toBe(
                'MariaDB'
            );
            expect(databaseTypeToLabelMap[DatabaseType.SQLITE]).toBe('SQLite');
            expect(databaseTypeToLabelMap[DatabaseType.CLICKHOUSE]).toBe(
                'ClickHouse'
            );
            expect(databaseTypeToLabelMap[DatabaseType.COCKROACHDB]).toBe(
                'CockroachDB'
            );
            expect(databaseTypeToLabelMap[DatabaseType.ORACLE]).toBe('Oracle');
        });
    });

    describe('databaseLogoMap', () => {
        it('should have logos for all database types', () => {
            const databaseTypes = Object.values(DatabaseType);

            databaseTypes.forEach((type) => {
                expect(databaseLogoMap).toHaveProperty(type);
            });
        });

        it('should have string values for all logos', () => {
            const databaseTypes = Object.values(DatabaseType);

            databaseTypes.forEach((type) => {
                expect(typeof databaseLogoMap[type]).toBe('string');
            });
        });

        it('should have empty string for GENERIC type', () => {
            expect(databaseLogoMap[DatabaseType.GENERIC]).toBe('');
        });

        it('should have non-empty strings for specific database types', () => {
            const specificTypes = [
                DatabaseType.MYSQL,
                DatabaseType.POSTGRESQL,
                DatabaseType.SQL_SERVER,
                DatabaseType.MARIADB,
                DatabaseType.SQLITE,
                DatabaseType.CLICKHOUSE,
                DatabaseType.COCKROACHDB,
                DatabaseType.ORACLE,
            ];

            specificTypes.forEach((type) => {
                expect(databaseLogoMap[type].length).toBeGreaterThan(0);
            });
        });
    });

    describe('databaseDarkLogoMap', () => {
        it('should have dark logos for all database types', () => {
            const databaseTypes = Object.values(DatabaseType);

            databaseTypes.forEach((type) => {
                expect(databaseDarkLogoMap).toHaveProperty(type);
            });
        });

        it('should have string values for all dark logos', () => {
            const databaseTypes = Object.values(DatabaseType);

            databaseTypes.forEach((type) => {
                expect(typeof databaseDarkLogoMap[type]).toBe('string');
            });
        });

        it('should have empty string for GENERIC type', () => {
            expect(databaseDarkLogoMap[DatabaseType.GENERIC]).toBe('');
        });
    });

    describe('databaseSecondaryLogoMap', () => {
        it('should have secondary logos for all database types', () => {
            const databaseTypes = Object.values(DatabaseType);

            databaseTypes.forEach((type) => {
                expect(databaseSecondaryLogoMap).toHaveProperty(type);
            });
        });

        it('should have non-empty strings for all secondary logos', () => {
            const databaseTypes = Object.values(DatabaseType);

            databaseTypes.forEach((type) => {
                expect(typeof databaseSecondaryLogoMap[type]).toBe('string');
                expect(databaseSecondaryLogoMap[type].length).toBeGreaterThan(
                    0
                );
            });
        });

        it('should have logo for GENERIC type', () => {
            expect(
                databaseSecondaryLogoMap[DatabaseType.GENERIC].length
            ).toBeGreaterThan(0);
        });
    });

    describe('getDatabaseLogo', () => {
        it('should return light logo for light theme', () => {
            const theme: EffectiveTheme = 'light';
            const logo = getDatabaseLogo(DatabaseType.MYSQL, theme);

            expect(logo).toBe(databaseLogoMap[DatabaseType.MYSQL]);
        });

        it('should return dark logo for dark theme', () => {
            const theme: EffectiveTheme = 'dark';
            const logo = getDatabaseLogo(DatabaseType.MYSQL, theme);

            expect(logo).toBe(databaseDarkLogoMap[DatabaseType.MYSQL]);
        });

        it('should work for all database types with light theme', () => {
            const theme: EffectiveTheme = 'light';
            const databaseTypes = Object.values(DatabaseType);

            databaseTypes.forEach((type) => {
                const logo = getDatabaseLogo(type, theme);
                expect(logo).toBe(databaseLogoMap[type]);
            });
        });

        it('should work for all database types with dark theme', () => {
            const theme: EffectiveTheme = 'dark';
            const databaseTypes = Object.values(DatabaseType);

            databaseTypes.forEach((type) => {
                const logo = getDatabaseLogo(type, theme);
                expect(logo).toBe(databaseDarkLogoMap[type]);
            });
        });

        it('should handle system theme treated as light', () => {
            // System theme is not explicitly handled, so it defaults to light
            const theme = 'system' as EffectiveTheme;
            const logo = getDatabaseLogo(DatabaseType.POSTGRESQL, theme);

            expect(logo).toBe(databaseLogoMap[DatabaseType.POSTGRESQL]);
        });
    });
});
