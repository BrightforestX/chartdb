/**
 * Tests for performance monitoring
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceMonitor } from '../utils/performance-monitor.js';

describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
        monitor = new PerformanceMonitor();
    });

    describe('Metric Recording', () => {
        it('should record metrics', () => {
            monitor.recordMetric({
                operationName: 'analyze',
                agentName: 'Schema Analyzer',
                duration: 100,
                timestamp: Date.now(),
                success: true,
                cached: false,
            });

            const stats = monitor.getStats();
            expect(stats.totalOperations).toBe(1);
        });

        it('should track successful operations', () => {
            monitor.recordMetric({
                operationName: 'analyze',
                agentName: 'Schema Analyzer',
                duration: 100,
                timestamp: Date.now(),
                success: true,
                cached: false,
            });

            monitor.recordMetric({
                operationName: 'optimize',
                agentName: 'Schema Optimizer',
                duration: 150,
                timestamp: Date.now(),
                success: false,
                cached: false,
            });

            const stats = monitor.getStats();
            expect(stats.successfulOperations).toBe(1);
            expect(stats.failedOperations).toBe(1);
        });

        it('should track cache hits', () => {
            monitor.recordMetric({
                operationName: 'analyze',
                agentName: 'Schema Analyzer',
                duration: 100,
                timestamp: Date.now(),
                success: true,
                cached: false,
            });

            monitor.recordMetric({
                operationName: 'analyze',
                agentName: 'Schema Analyzer',
                duration: 0,
                timestamp: Date.now(),
                success: true,
                cached: true,
            });

            const stats = monitor.getStats();
            expect(stats.cacheHitRate).toBe(0.5);
        });
    });

    describe('Statistics', () => {
        beforeEach(() => {
            monitor.recordMetric({
                operationName: 'analyze',
                agentName: 'Schema Analyzer',
                duration: 100,
                timestamp: Date.now(),
                success: true,
                cached: false,
            });

            monitor.recordMetric({
                operationName: 'optimize',
                agentName: 'Schema Optimizer',
                duration: 200,
                timestamp: Date.now(),
                success: true,
                cached: false,
            });

            monitor.recordMetric({
                operationName: 'analyze',
                agentName: 'Schema Analyzer',
                duration: 150,
                timestamp: Date.now(),
                success: true,
                cached: false,
            });
        });

        it('should calculate average duration', () => {
            const stats = monitor.getStats();
            expect(stats.averageDuration).toBe(150);
        });

        it('should calculate min and max duration', () => {
            const stats = monitor.getStats();
            expect(stats.minDuration).toBe(100);
            expect(stats.maxDuration).toBe(200);
        });

        it('should calculate percentiles', () => {
            const stats = monitor.getStats();
            expect(stats.p50Duration).toBeDefined();
            expect(stats.p95Duration).toBeDefined();
            expect(stats.p99Duration).toBeDefined();
        });

        it('should filter stats by agent', () => {
            const analyzerStats = monitor.getStats('Schema Analyzer');
            expect(analyzerStats.totalOperations).toBe(2);
            expect(analyzerStats.averageDuration).toBe(125);
        });

        it('should filter stats by operation', () => {
            const analyzeStats = monitor.getStats(undefined, 'analyze');
            expect(analyzeStats.totalOperations).toBe(2);
        });
    });

    describe('Aggregations', () => {
        beforeEach(() => {
            monitor.recordMetric({
                operationName: 'analyze',
                agentName: 'Schema Analyzer',
                duration: 100,
                timestamp: Date.now(),
                success: true,
                cached: false,
            });

            monitor.recordMetric({
                operationName: 'optimize',
                agentName: 'Schema Optimizer',
                duration: 200,
                timestamp: Date.now(),
                success: true,
                cached: false,
            });
        });

        it('should group metrics by agent', () => {
            const byAgent = monitor.getMetricsByAgent();
            
            expect(byAgent['Schema Analyzer']).toBeDefined();
            expect(byAgent['Schema Optimizer']).toBeDefined();
            expect(byAgent['Schema Analyzer'].totalOperations).toBe(1);
        });

        it('should group metrics by operation', () => {
            const byOperation = monitor.getMetricsByOperation();
            
            expect(byOperation['analyze']).toBeDefined();
            expect(byOperation['optimize']).toBeDefined();
            expect(byOperation['analyze'].totalOperations).toBe(1);
        });
    });

    describe('Recent Metrics', () => {
        it('should return recent metrics', () => {
            for (let i = 0; i < 15; i++) {
                monitor.recordMetric({
                    operationName: 'test',
                    agentName: 'Test Agent',
                    duration: i * 10,
                    timestamp: Date.now(),
                    success: true,
                    cached: false,
                });
            }

            const recent = monitor.getRecentMetrics(5);
            expect(recent.length).toBe(5);
            expect(recent[recent.length - 1].duration).toBe(140);
        });
    });

    describe('Track Method', () => {
        it('should track operation execution', async () => {
            const operation = async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                return 'success';
            };

            const result = await monitor.track('testOp', 'Test Agent', operation);
            
            expect(result).toBe('success');
            
            const stats = monitor.getStats();
            expect(stats.totalOperations).toBe(1);
            expect(stats.successfulOperations).toBe(1);
        });

        it('should track failed operations', async () => {
            const operation = async () => {
                throw new Error('Test failure');
            };

            await expect(
                monitor.track('testOp', 'Test Agent', operation)
            ).rejects.toThrow('Test failure');
            
            const stats = monitor.getStats();
            expect(stats.totalOperations).toBe(1);
            expect(stats.failedOperations).toBe(1);
        });
    });

    describe('Report Generation', () => {
        it('should generate performance report', () => {
            monitor.recordMetric({
                operationName: 'analyze',
                agentName: 'Schema Analyzer',
                duration: 100,
                timestamp: Date.now(),
                success: true,
                cached: false,
            });

            const report = monitor.generateReport();
            
            expect(report).toContain('Performance Report');
            expect(report).toContain('Overall Statistics');
            expect(report).toContain('Schema Analyzer');
        });
    });

    describe('Clear Operations', () => {
        it('should clear all metrics', () => {
            monitor.recordMetric({
                operationName: 'analyze',
                agentName: 'Schema Analyzer',
                duration: 100,
                timestamp: Date.now(),
                success: true,
                cached: false,
            });

            monitor.clearMetrics();
            
            const stats = monitor.getStats();
            expect(stats.totalOperations).toBe(0);
        });
    });
});
