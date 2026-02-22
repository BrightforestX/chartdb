/**
 * Retry Logic with Exponential Backoff
 */

export interface RetryConfig {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    jitter: boolean;
    retryableErrors?: Array<new (...args: any[]) => Error>;
    onRetry?: (attempt: number, error: Error, nextDelay: number) => void;
}

export interface RetryResult<T> {
    success: boolean;
    result?: T;
    error?: Error;
    attempts: number;
    totalDuration: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG: RetryConfig = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitter: true,
};

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = Math.min(
        config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelayMs
    );

    if (config.jitter) {
        return delay * (0.5 + Math.random() * 0.5);
    }

    return delay;
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: Error, config: RetryConfig): boolean {
    if (!config.retryableErrors || config.retryableErrors.length === 0) {
        return true;
    }

    return config.retryableErrors.some(ErrorClass => error instanceof ErrorClass);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
): Promise<T> {
    const fullConfig: RetryConfig = { ...DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    
    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt < fullConfig.maxAttempts) {
        attempt++;

        try {
            const result = await fn();
            
            if (attempt > 1) {
                console.log(`✅ Retry succeeded on attempt ${attempt}`);
            }
            
            return result;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            lastError = err;

            if (!isRetryableError(err, fullConfig)) {
                console.log(`❌ Non-retryable error: ${err.message}`);
                throw err;
            }

            if (attempt >= fullConfig.maxAttempts) {
                console.log(`❌ Max retry attempts (${fullConfig.maxAttempts}) reached`);
                break;
            }

            const delay = calculateDelay(attempt, fullConfig);
            
            console.log(
                `⚠️  Attempt ${attempt}/${fullConfig.maxAttempts} failed: ${err.message}. ` +
                `Retrying in ${Math.round(delay)}ms...`
            );

            if (fullConfig.onRetry) {
                fullConfig.onRetry(attempt, err, delay);
            }

            await sleep(delay);
        }
    }

    throw lastError || new Error('Retry failed');
}

/**
 * Retry with detailed result information
 */
export async function retryWithResult<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let attempts = 0;

    try {
        const result = await retry(fn, {
            ...config,
            onRetry: (attempt, error, nextDelay) => {
                attempts = attempt;
                if (config.onRetry) {
                    config.onRetry(attempt, error, nextDelay);
                }
            },
        });

        return {
            success: true,
            result,
            attempts: attempts || 1,
            totalDuration: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
            attempts: config.maxAttempts || DEFAULT_CONFIG.maxAttempts,
            totalDuration: Date.now() - startTime,
        };
    }
}

/**
 * Create a retryable version of a function
 */
export function makeRetryable<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    config: Partial<RetryConfig> = {}
): (...args: TArgs) => Promise<TReturn> {
    return async (...args: TArgs) => {
        return retry(() => fn(...args), config);
    };
}

/**
 * Retry decorator for class methods
 */
export function Retryable(config: Partial<RetryConfig> = {}) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            return retry(() => originalMethod.apply(this, args), config);
        };

        return descriptor;
    };
}

/**
 * Batch retry - retry multiple operations with shared backoff
 */
export async function batchRetry<T>(
    operations: Array<() => Promise<T>>,
    config: Partial<RetryConfig> = {}
): Promise<Array<RetryResult<T>>> {
    const results: Array<RetryResult<T>> = [];

    for (const operation of operations) {
        const result = await retryWithResult(operation, config);
        results.push(result);

        if (!result.success && config.maxAttempts === 1) {
            break;
        }
    }

    return results;
}

/**
 * Retry with fallback
 */
export async function retryWithFallback<T>(
    fn: () => Promise<T>,
    fallback: () => T | Promise<T>,
    config: Partial<RetryConfig> = {}
): Promise<T> {
    try {
        return await retry(fn, config);
    } catch (error) {
        console.log('⚠️  All retries failed, using fallback');
        return await fallback();
    }
}

/**
 * Common error types for retry logic
 */
export class RetryableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RetryableError';
    }
}

export class NetworkError extends RetryableError {
    constructor(message: string = 'Network error occurred') {
        super(message);
        this.name = 'NetworkError';
    }
}

export class TimeoutError extends RetryableError {
    constructor(message: string = 'Operation timed out') {
        super(message);
        this.name = 'TimeoutError';
    }
}

export class RateLimitError extends RetryableError {
    constructor(message: string = 'Rate limit exceeded') {
        super(message);
        this.name = 'RateLimitError';
    }
}

/**
 * Create retry config for common scenarios
 */
export const RetryPresets = {
    /**
     * Fast retry for quick operations
     */
    fast: {
        maxAttempts: 3,
        initialDelayMs: 500,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
        jitter: true,
    } as RetryConfig,

    /**
     * Standard retry for most operations
     */
    standard: {
        maxAttempts: 5,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2,
        jitter: true,
    } as RetryConfig,

    /**
     * Aggressive retry for critical operations
     */
    aggressive: {
        maxAttempts: 10,
        initialDelayMs: 2000,
        maxDelayMs: 60000,
        backoffMultiplier: 2,
        jitter: true,
    } as RetryConfig,

    /**
     * Network-specific retry
     */
    network: {
        maxAttempts: 5,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2,
        jitter: true,
        retryableErrors: [NetworkError, TimeoutError],
    } as RetryConfig,

    /**
     * Rate limit handling
     */
    rateLimit: {
        maxAttempts: 3,
        initialDelayMs: 5000,
        maxDelayMs: 60000,
        backoffMultiplier: 3,
        jitter: false,
        retryableErrors: [RateLimitError],
    } as RetryConfig,
};
