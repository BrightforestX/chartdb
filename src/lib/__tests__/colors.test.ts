import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
    colorOptions,
    randomColor,
    viewColor,
    materializedViewColor,
    defaultTableColor,
    defaultAreaColor,
} from '../colors';

describe('colors', () => {
    describe('colorOptions', () => {
        it('should have exactly 12 color options', () => {
            expect(colorOptions).toHaveLength(12);
        });

        it('should have all valid hex color codes', () => {
            colorOptions.forEach((color) => {
                expect(color).toMatch(/^#[0-9a-f]{6}$/i);
            });
        });

        it('should not have duplicate colors', () => {
            const uniqueColors = new Set(colorOptions);
            expect(uniqueColors.size).toBe(colorOptions.length);
        });

        it('should contain expected colors', () => {
            expect(colorOptions).toContain('#ff6363');
            expect(colorOptions).toContain('#8eb7ff');
            expect(colorOptions).toContain('#4dee8a');
        });
    });

    describe('randomColor', () => {
        let mathRandomSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            mathRandomSpy = vi.spyOn(Math, 'random');
        });

        afterEach(() => {
            mathRandomSpy.mockRestore();
        });

        it('should return a color from colorOptions', () => {
            const color = randomColor();
            expect(colorOptions).toContain(color);
        });

        it('should return first color when random is 0', () => {
            mathRandomSpy.mockReturnValue(0);
            const color = randomColor();
            expect(color).toBe(colorOptions[0]);
        });

        it('should return last color when random is close to 1', () => {
            mathRandomSpy.mockReturnValue(0.9999);
            const color = randomColor();
            expect(color).toBe(colorOptions[colorOptions.length - 1]);
        });

        it('should return middle color when random is 0.5', () => {
            mathRandomSpy.mockReturnValue(0.5);
            const color = randomColor();
            const expectedIndex = Math.floor(0.5 * colorOptions.length);
            expect(color).toBe(colorOptions[expectedIndex]);
        });

        it('should return different colors on multiple calls (probabilistic)', () => {
            mathRandomSpy.mockRestore(); // Use real Math.random for this test
            const colors = new Set<string>();
            for (let i = 0; i < 50; i++) {
                colors.add(randomColor());
            }
            // With 50 calls and 12 colors, we should get at least 2 different colors
            expect(colors.size).toBeGreaterThanOrEqual(2);
        });
    });

    describe('color constants', () => {
        it('should have valid viewColor', () => {
            expect(viewColor).toBe('#b0b0b0');
            expect(viewColor).toMatch(/^#[0-9a-f]{6}$/i);
        });

        it('should have valid materializedViewColor', () => {
            expect(materializedViewColor).toBe('#7d7d7d');
            expect(materializedViewColor).toMatch(/^#[0-9a-f]{6}$/i);
        });

        it('should have valid defaultTableColor', () => {
            expect(defaultTableColor).toBe('#8eb7ff');
            expect(defaultTableColor).toMatch(/^#[0-9a-f]{6}$/i);
        });

        it('should have valid defaultAreaColor', () => {
            expect(defaultAreaColor).toBe('#b067e9');
            expect(defaultAreaColor).toMatch(/^#[0-9a-f]{6}$/i);
        });

        it('should have defaultTableColor in colorOptions', () => {
            expect(colorOptions).toContain(defaultTableColor);
        });

        it('should have defaultAreaColor in colorOptions', () => {
            expect(colorOptions).toContain(defaultAreaColor);
        });

        it('should have materializedViewColor darker than viewColor', () => {
            const viewColorValue = parseInt(viewColor.substring(1), 16);
            const materializedViewColorValue = parseInt(
                materializedViewColor.substring(1),
                16
            );
            expect(materializedViewColorValue).toBeLessThan(viewColorValue);
        });
    });
});
