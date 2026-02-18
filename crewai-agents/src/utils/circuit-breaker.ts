/**
 * Circuit Breaker Pattern for resilient API calls
 */

export enum CircuitState {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
    failureThreshold: number;
    resetTimeout: number;
    halfOpenMaxAttempts: number;
}

export interface CircuitBreakerStats {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime: number | null;
    totalRequests: number;
}

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount: number = 0;
    private successCount: number = 0;
    private lastFailureTime: number | null = null;
    private halfOpenAttempts: number = 0;
    private totalRequests: number = 0;

    constructor(private config: CircuitBreakerConfig) {}

    /**
     * Execute a function with circuit breaker protection
     */
    async execute<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
        this.totalRequests++;

        if (this.state === CircuitState.OPEN) {
            const now = Date.now();
            if (this.lastFailureTime && now - this.lastFailureTime >= this.config.resetTimeout) {
                console.log('🔄 Circuit breaker transitioning to HALF_OPEN');
                this.state = CircuitState.HALF_OPEN;
                this.halfOpenAttempts = 0;
            } else {
                console.log('⚠️  Circuit breaker is OPEN, using fallback');
                if (fallback) {
                    return fallback();
                }
                throw new Error('Circuit breaker is OPEN');
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            
            if (fallback) {
                console.log('⚠️  Request failed, using fallback');
                return fallback();
            }
            
            throw error;
        }
    }

    /**
     * Handle successful request
     */
    private onSuccess(): void {
        this.successCount++;
        
        if (this.state === CircuitState.HALF_OPEN) {
            console.log('✅ Circuit breaker transitioning to CLOSED');
            this.state = CircuitState.CLOSED;
            this.failureCount = 0;
            this.halfOpenAttempts = 0;
        } else if (this.state === CircuitState.CLOSED) {
            this.failureCount = 0;
        }
    }

    /**
     * Handle failed request
     */
    private onFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.state === CircuitState.HALF_OPEN) {
            console.log('❌ Circuit breaker transitioning to OPEN');
            this.state = CircuitState.OPEN;
        } else if (this.state === CircuitState.CLOSED && this.failureCount >= this.config.failureThreshold) {
            console.log(`❌ Circuit breaker OPEN after ${this.failureCount} failures`);
            this.state = CircuitState.OPEN;
        }
    }

    /**
     * Get current state
     */
    getState(): CircuitState {
        return this.state;
    }

    /**
     * Get statistics
     */
    getStats(): CircuitBreakerStats {
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime,
            totalRequests: this.totalRequests,
        };
    }

    /**
     * Reset circuit breaker
     */
    reset(): void {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.halfOpenAttempts = 0;
    }

    /**
     * Force state change (for testing)
     */
    forceState(state: CircuitState): void {
        this.state = state;
    }
}

/**
 * Create a circuit breaker with default configuration
 */
export function createCircuitBreaker(config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    const defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        resetTimeout: 60000,
        halfOpenMaxAttempts: 3,
    };

    return new CircuitBreaker({ ...defaultConfig, ...config });
}
