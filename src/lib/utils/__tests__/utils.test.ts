import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    cn,
    emptyFn,
    generateId,
    getOperatingSystem,
    deepCopy,
    debounce,
    removeDups,
    decodeBase64ToUtf8,
    waitFor,
    sha256,
    mergeRefs,
} from '../utils';

describe('utils', () => {
    describe('cn', () => {
        it('should merge class names', () => {
            const result = cn('foo', 'bar');
            expect(result).toContain('foo');
            expect(result).toContain('bar');
        });

        it('should handle conditional classes', () => {
            const showBar = false;
            const showBaz = true;
            const result = cn('foo', showBar && 'bar', showBaz && 'baz');
            expect(result).toContain('foo');
            expect(result).toContain('baz');
            expect(result).not.toContain('bar');
        });

        it('should merge tailwind classes correctly', () => {
            const result = cn('px-2 py-1', 'px-4');
            // Should prefer the later px-4 over px-2
            expect(result).toContain('px-4');
            expect(result).toContain('py-1');
        });
    });

    describe('emptyFn', () => {
        it('should return undefined', () => {
            expect(emptyFn()).toBeUndefined();
        });
    });

    describe('generateId', () => {
        it('should generate a string', () => {
            const id = generateId();
            expect(typeof id).toBe('string');
        });

        it('should generate unique IDs', () => {
            const id1 = generateId();
            const id2 = generateId();
            expect(id1).not.toBe(id2);
        });

        it('should generate IDs of expected length', () => {
            const id = generateId();
            expect(id.length).toBe(25);
        });
    });

    describe('getOperatingSystem', () => {
        const originalNavigator = window.navigator;

        beforeEach(() => {
            // Mock navigator
            Object.defineProperty(window, 'navigator', {
                writable: true,
                configurable: true,
                value: { userAgent: '' },
            });
        });

        afterEach(() => {
            // Restore original navigator
            Object.defineProperty(window, 'navigator', {
                writable: true,
                configurable: true,
                value: originalNavigator,
            });
        });

        it('should detect Mac OS', () => {
            Object.defineProperty(window.navigator, 'userAgent', {
                writable: true,
                value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            });

            expect(getOperatingSystem()).toBe('mac');
        });

        it('should detect Windows', () => {
            Object.defineProperty(window.navigator, 'userAgent', {
                writable: true,
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            });

            expect(getOperatingSystem()).toBe('windows');
        });

        it('should return unknown for other OS', () => {
            Object.defineProperty(window.navigator, 'userAgent', {
                writable: true,
                value: 'Mozilla/5.0 (X11; Linux x86_64)',
            });

            expect(getOperatingSystem()).toBe('unknown');
        });
    });

    describe('deepCopy', () => {
        it('should create a deep copy of an object', () => {
            const original = { a: 1, b: { c: 2 } };
            const copy = deepCopy(original);

            expect(copy).toEqual(original);
            expect(copy).not.toBe(original);
            expect(copy.b).not.toBe(original.b);
        });

        it('should work with arrays', () => {
            const original = [1, 2, { a: 3 }];
            const copy = deepCopy(original);

            expect(copy).toEqual(original);
            expect(copy).not.toBe(original);
            expect(copy[2]).not.toBe(original[2]);
        });

        it('should work with nested structures', () => {
            const original = {
                a: [1, 2, 3],
                b: { c: { d: 4 } },
            };
            const copy = deepCopy(original);

            expect(copy).toEqual(original);
            expect(copy.a).not.toBe(original.a);
            expect(copy.b.c).not.toBe(original.b.c);
        });
    });

    describe('debounce', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should delay function execution', () => {
            const fn = vi.fn();
            const debouncedFn = debounce(fn, 100);

            debouncedFn();
            expect(fn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(100);
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should reset timer on multiple calls', () => {
            const fn = vi.fn();
            const debouncedFn = debounce(fn, 100);

            debouncedFn();
            vi.advanceTimersByTime(50);
            debouncedFn();
            vi.advanceTimersByTime(50);

            expect(fn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(50);
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should pass arguments to debounced function', () => {
            const fn = vi.fn();
            const debouncedFn = debounce(fn, 100);

            debouncedFn('arg1', 'arg2');
            vi.advanceTimersByTime(100);

            expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
        });
    });

    describe('removeDups', () => {
        it('should remove duplicate primitives', () => {
            const result = removeDups([1, 2, 2, 3, 3, 3]);
            expect(result).toEqual([1, 2, 3]);
        });

        it('should remove duplicate strings', () => {
            const result = removeDups(['a', 'b', 'a', 'c']);
            expect(result).toEqual(['a', 'b', 'c']);
        });

        it('should handle empty arrays', () => {
            const result = removeDups([]);
            expect(result).toEqual([]);
        });

        it('should handle arrays without duplicates', () => {
            const result = removeDups([1, 2, 3]);
            expect(result).toEqual([1, 2, 3]);
        });
    });

    describe('decodeBase64ToUtf8', () => {
        it('should decode base64 to UTF-8', () => {
            // "Hello" in base64
            const base64 = btoa('Hello');
            const result = decodeBase64ToUtf8(base64);
            expect(result).toBe('Hello');
        });

        it('should handle special characters', () => {
            const text = 'Hello, 世界! 🌍';
            const base64 = btoa(unescape(encodeURIComponent(text)));
            const result = decodeBase64ToUtf8(base64);
            expect(result).toBe(text);
        });
    });

    describe('waitFor', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should resolve after specified time', async () => {
            const promise = waitFor(1000);

            let resolved = false;
            promise.then(() => {
                resolved = true;
            });

            expect(resolved).toBe(false);

            await vi.advanceTimersByTimeAsync(1000);

            expect(resolved).toBe(true);
        });

        it('should work with different timeouts', async () => {
            const promise1 = waitFor(100);
            const promise2 = waitFor(200);

            let resolved1 = false;
            let resolved2 = false;

            promise1.then(() => {
                resolved1 = true;
            });
            promise2.then(() => {
                resolved2 = true;
            });

            await vi.advanceTimersByTimeAsync(100);
            expect(resolved1).toBe(true);
            expect(resolved2).toBe(false);

            await vi.advanceTimersByTimeAsync(100);
            expect(resolved2).toBe(true);
        });
    });

    describe('sha256', () => {
        it('should generate SHA-256 hash', async () => {
            const hash = await sha256('hello');
            expect(hash).toBe(
                '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
            );
        });

        it('should generate different hashes for different inputs', async () => {
            const hash1 = await sha256('hello');
            const hash2 = await sha256('world');

            expect(hash1).not.toBe(hash2);
        });

        it('should generate consistent hashes', async () => {
            const hash1 = await sha256('test');
            const hash2 = await sha256('test');

            expect(hash1).toBe(hash2);
        });
    });

    describe('mergeRefs', () => {
        it('should return null for no refs', () => {
            const result = mergeRefs();
            expect(result).toBeNull();
        });

        it('should return single ref as-is', () => {
            const ref = vi.fn();
            const result = mergeRefs(ref);
            expect(result).toBe(ref);
        });

        it('should merge callback refs', () => {
            const ref1 = vi.fn();
            const ref2 = vi.fn();
            const mergedRef = mergeRefs(ref1, ref2);

            const element = document.createElement('div');
            if (typeof mergedRef === 'function') {
                mergedRef(element);
            }

            expect(ref1).toHaveBeenCalledWith(element);
            expect(ref2).toHaveBeenCalledWith(element);
        });

        it('should merge object refs', () => {
            const ref1 = { current: null };
            const ref2 = { current: null };
            const mergedRef = mergeRefs(ref1, ref2);

            const element = document.createElement('div');
            if (typeof mergedRef === 'function') {
                mergedRef(element);
            }

            expect(ref1.current).toBe(element);
            expect(ref2.current).toBe(element);
        });

        it('should handle mix of callback and object refs', () => {
            const callbackRef = vi.fn();
            const objectRef = { current: null };
            const mergedRef = mergeRefs(callbackRef, objectRef);

            const element = document.createElement('div');
            if (typeof mergedRef === 'function') {
                mergedRef(element);
            }

            expect(callbackRef).toHaveBeenCalledWith(element);
            expect(objectRef.current).toBe(element);
        });

        it('should filter out undefined refs', () => {
            const ref = vi.fn();
            const mergedRef = mergeRefs(undefined, ref, undefined);

            expect(mergedRef).toBe(ref);
        });
    });
});
