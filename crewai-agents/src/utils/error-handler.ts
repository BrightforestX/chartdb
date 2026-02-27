/**
 * Error handling utilities with retry logic and circuit breaker
 */

export interface RetryOptions {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
}

export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetTimeout: number;
}

export class AgentError extends Error {
    constructor(
        message: string,
        public agentName: string,
        public operation: string,
        public cause?: Error,
        public retryable: boolean = true
    ) {
        super(message);
        this.name = 'AgentError';
    }
}

export class CircuitBreakerError extends Error {
    constructor(
        message: string,
        public agentName: string
    ) {
        super(message);
        this.name = 'CircuitBreakerError';
    }
}

export class CircuitBreaker {
    private failureCount = 0;
    private lastFailureTime: number | null = null;
    private state: 'closed' | 'open' | 'half-open' = 'closed';

    constructor(
        private agentName: string,
        private options: CircuitBreakerOptions
    ) {}

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
            const now = Date.now();
            if (
                this.lastFailureTime &&
                now - this.lastFailureTime >= this.options.resetTimeout
            ) {
                this.state = 'half-open';
            } else {
                throw new CircuitBreakerError(
                    `Circuit breaker is open for ${this.agentName}. Failing fast.`,
                    this.agentName
                );
            }
        }

        try {
            const result = await operation();
            
            if (this.state === 'half-open') {
                this.reset();
            }
            
            return result;
        } catch (error) {
            this.recordFailure();
            throw error;
        }
    }

    private recordFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.options.failureThreshold) {
            this.state = 'open';
            console.warn(`⚠️ Circuit breaker opened for ${this.agentName}`);
        }
    }

    private reset(): void {
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.state = 'closed';
        console.log(`✅ Circuit breaker reset for ${this.agentName}`);
    }

    getState(): 'closed' | 'open' | 'half-open' {
        return this.state;
    }
}

export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: RetryOptions,
    errorContext: { agentName: string; operation: string }
): Promise<T> {
    let lastError: Error | null = null;
    let delay = options.initialDelay;

    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                console.log(
                    `  ↳ Retry attempt ${attempt}/${options.maxRetries} for ${errorContext.agentName}.${errorContext.operation} (delay: ${delay}ms)`
                );
                await sleep(delay);
                delay = Math.min(delay * options.backoffMultiplier, options.maxDelay);
            }

            return await operation();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt === options.maxRetries) {
                throw new AgentError(
                    `Failed after ${options.maxRetries} retries: ${lastError.message}`,
                    errorContext.agentName,
                    errorContext.operation,
                    lastError,
                    false
                );
            }

            if (!isRetryableError(error)) {
                throw new AgentError(
                    `Non-retryable error: ${lastError.message}`,
                    errorContext.agentName,
                    errorContext.operation,
                    lastError,
                    false
                );
            }
        }
    }

    throw lastError!;
}

function isRetryableError(error: unknown): boolean {
    if (error instanceof AgentError) {
        return error.retryable;
    }
    
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (
            message.includes('timeout') ||
            message.includes('network') ||
            message.includes('econnrefused') ||
            message.includes('temporary')
        );
    }
    
    return false;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
