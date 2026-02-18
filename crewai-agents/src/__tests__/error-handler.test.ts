/**
 * Tests for error handler utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    CircuitBreaker,
    retryWithBackoff,
    AgentError,
    CircuitBreakerError,
} from '../utils/error-handler.js';

describe('Error Handler', () => {
    describe('CircuitBreaker', () => {
        let breaker: CircuitBreaker;

        beforeEach(() => {
            breaker = new CircuitBreaker('Test Agent', {
                failureThreshold: 3,
                resetTimeout: 1000,
            });
        });

        it('should start in closed state', () => {
            expect(breaker.getState()).toBe('closed');
        });

        it('should open after threshold failures', async () => {
            const failingOp = async () => {
                throw new Error('Test failure');
            };

            for (let i = 0; i < 3; i++) {
                try {
                    await breaker.execute(failingOp);
                } catch (e) {
                }
            }

            expect(breaker.getState()).toBe('open');
        });

        it('should throw CircuitBreakerError when open', async () => {
            const failingOp = async () => {
                throw new Error('Test failure');
            };

            for (let i = 0; i < 3; i++) {
                try {
                    await breaker.execute(failingOp);
                } catch (e) {
                }
            }

            await expect(breaker.execute(async () => 'success')).rejects.toThrow(
                CircuitBreakerError
            );
        });

        it('should transition to half-open after reset timeout', async () => {
            const failingOp = async () => {
                throw new Error('Test failure');
            };

            for (let i = 0; i < 3; i++) {
                try {
                    await breaker.execute(failingOp);
                } catch (e) {
                }
            }

            await new Promise(resolve => setTimeout(resolve, 1100));

            const successOp = async () => 'success';
            const result = await breaker.execute(successOp);

            expect(result).toBe('success');
            expect(breaker.getState()).toBe('closed');
        });

        it('should reset on successful execution in half-open state', async () => {
            const failingOp = async () => {
                throw new Error('Test failure');
            };

            for (let i = 0; i < 3; i++) {
                try {
                    await breaker.execute(failingOp);
                } catch (e) {
                }
            }

            await new Promise(resolve => setTimeout(resolve, 1100));

            await breaker.execute(async () => 'success');

            expect(breaker.getState()).toBe('closed');
        });
    });

    describe('retryWithBackoff', () => {
        it('should succeed on first try', async () => {
            const successOp = async () => 'success';

            const result = await retryWithBackoff(
                successOp,
                {
                    maxRetries: 3,
                    initialDelay: 100,
                    maxDelay: 1000,
                    backoffMultiplier: 2,
                },
                { agentName: 'Test Agent', operation: 'test' }
            );

            expect(result).toBe('success');
        });

        it('should retry on transient failures', async () => {
            let attempts = 0;
            const retryableOp = async () => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Temporary failure');
                }
                return 'success';
            };

            const result = await retryWithBackoff(
                retryableOp,
                {
                    maxRetries: 3,
                    initialDelay: 10,
                    maxDelay: 100,
                    backoffMultiplier: 2,
                },
                { agentName: 'Test Agent', operation: 'test' }
            );

            expect(result).toBe('success');
            expect(attempts).toBe(3);
        });

        it('should fail after max retries', async () => {
            const failingOp = async () => {
                throw new Error('Permanent failure');
            };

            await expect(
                retryWithBackoff(
                    failingOp,
                    {
                        maxRetries: 2,
                        initialDelay: 10,
                        maxDelay: 100,
                        backoffMultiplier: 2,
                    },
                    { agentName: 'Test Agent', operation: 'test' }
                )
            ).rejects.toThrow(AgentError);
        });

        it('should not retry non-retryable errors', async () => {
            let attempts = 0;
            const nonRetryableOp = async () => {
                attempts++;
                throw new AgentError(
                    'Non-retryable error',
                    'Test Agent',
                    'test',
                    undefined,
                    false
                );
            };

            await expect(
                retryWithBackoff(
                    nonRetryableOp,
                    {
                        maxRetries: 3,
                        initialDelay: 10,
                        maxDelay: 100,
                        backoffMultiplier: 2,
                    },
                    { agentName: 'Test Agent', operation: 'test' }
                )
            ).rejects.toThrow(AgentError);

            expect(attempts).toBe(1);
        });
    });

    describe('AgentError', () => {
        it('should contain agent context', () => {
            const error = new AgentError(
                'Test error',
                'Schema Analyzer',
                'analyze',
                new Error('Original error'),
                true
            );

            expect(error.agentName).toBe('Schema Analyzer');
            expect(error.operation).toBe('analyze');
            expect(error.retryable).toBe(true);
            expect(error.cause).toBeDefined();
        });
    });
});
