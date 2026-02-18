/**
 * Tests for agent communication protocol
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    AgentCommunicationBus,
    createRequest,
    createResponse,
    createEvent,
} from '../utils/agent-protocol.js';

describe('AgentCommunicationBus', () => {
    let bus: AgentCommunicationBus;

    beforeEach(() => {
        bus = new AgentCommunicationBus();
    });

    describe('Message Sending', () => {
        it('should send messages', () => {
            const handler = vi.fn();
            bus.subscribe('agent1', handler);

            bus.send({
                type: 'request',
                sender: 'orchestrator',
                recipient: 'agent1',
                payload: { test: 'data' },
            });

            expect(handler).toHaveBeenCalled();
        });

        it('should generate message IDs', () => {
            const messages: any[] = [];
            const handler = (msg: any) => { messages.push(msg); };
            
            bus.subscribe('agent1', handler);
            
            bus.send({
                type: 'request',
                sender: 'orchestrator',
                recipient: 'agent1',
                payload: {},
            });

            expect(messages[0].id).toBeDefined();
            expect(typeof messages[0].id).toBe('string');
        });

        it('should add timestamps', () => {
            const messages: any[] = [];
            const handler = (msg: any) => { messages.push(msg); };
            
            bus.subscribe('agent1', handler);
            
            bus.send({
                type: 'request',
                sender: 'orchestrator',
                recipient: 'agent1',
                payload: {},
            });

            expect(messages[0].timestamp).toBeDefined();
            expect(typeof messages[0].timestamp).toBe('number');
        });
    });

    describe('Message Handling', () => {
        it('should deliver messages to subscribers', () => {
            const handler = vi.fn();
            bus.subscribe('agent1', handler);

            bus.send({
                type: 'event',
                sender: 'orchestrator',
                recipient: 'agent1',
                payload: createEvent('test', { data: 'value' }),
            });

            expect(handler).toHaveBeenCalledOnce();
        });

        it('should support multiple handlers for same recipient', () => {
            const handler1 = vi.fn();
            const handler2 = vi.fn();
            
            bus.subscribe('agent1', handler1);
            bus.subscribe('agent1', handler2);

            bus.send({
                type: 'event',
                sender: 'orchestrator',
                recipient: 'agent1',
                payload: {},
            });

            expect(handler1).toHaveBeenCalled();
            expect(handler2).toHaveBeenCalled();
        });

        it('should broadcast when no recipient specified', () => {
            const handler1 = vi.fn();
            const handler2 = vi.fn();
            
            bus.subscribe('agent1', handler1);
            bus.subscribe('agent2', handler2);

            bus.send({
                type: 'event',
                sender: 'orchestrator',
                payload: {},
            });

            expect(handler1).toHaveBeenCalled();
            expect(handler2).toHaveBeenCalled();
        });

        it('should handle handler errors gracefully', () => {
            const failingHandler = vi.fn(() => {
                throw new Error('Handler error');
            });
            const successHandler = vi.fn();
            
            bus.subscribe('agent1', failingHandler);
            bus.subscribe('agent1', successHandler);

            expect(() => {
                bus.send({
                    type: 'event',
                    sender: 'orchestrator',
                    recipient: 'agent1',
                    payload: {},
                });
            }).not.toThrow();

            expect(failingHandler).toHaveBeenCalled();
            expect(successHandler).toHaveBeenCalled();
        });
    });

    describe('Subscription Management', () => {
        it('should unsubscribe handlers', () => {
            const handler = vi.fn();
            
            bus.subscribe('agent1', handler);
            bus.unsubscribe('agent1', handler);

            bus.send({
                type: 'event',
                sender: 'orchestrator',
                recipient: 'agent1',
                payload: {},
            });

            expect(handler).not.toHaveBeenCalled();
        });

        it('should handle unsubscribing non-existent handlers', () => {
            const handler = vi.fn();
            
            expect(() => {
                bus.unsubscribe('agent1', handler);
            }).not.toThrow();
        });
    });

    describe('Message Log', () => {
        it('should log all messages', () => {
            bus.send({
                type: 'event',
                sender: 'orchestrator',
                payload: {},
            });

            bus.send({
                type: 'request',
                sender: 'agent1',
                payload: {},
            });

            const log = bus.getMessageLog();
            expect(log.length).toBe(2);
        });

        it('should limit log size', () => {
            const smallBus = new AgentCommunicationBus(5);

            for (let i = 0; i < 10; i++) {
                smallBus.send({
                    type: 'event',
                    sender: 'orchestrator',
                    payload: { index: i },
                });
            }

            const log = smallBus.getMessageLog();
            expect(log.length).toBe(5);
        });

        it('should retrieve recent messages', () => {
            for (let i = 0; i < 10; i++) {
                bus.send({
                    type: 'event',
                    sender: 'orchestrator',
                    payload: { index: i },
                });
            }

            const recent = bus.getMessageLog(3);
            expect(recent.length).toBe(3);
        });

        it('should filter messages by agent', () => {
            bus.send({
                type: 'event',
                sender: 'agent1',
                payload: {},
            });

            bus.send({
                type: 'event',
                sender: 'agent2',
                payload: {},
            });

            bus.send({
                type: 'event',
                sender: 'agent1',
                recipient: 'orchestrator',
                payload: {},
            });

            const agent1Messages = bus.getMessagesByAgent('agent1');
            expect(agent1Messages.length).toBe(2);
        });

        it('should clear message log', () => {
            bus.send({
                type: 'event',
                sender: 'orchestrator',
                payload: {},
            });

            bus.clearLog();

            const log = bus.getMessageLog();
            expect(log.length).toBe(0);
        });
    });
});

describe('Protocol Helpers', () => {
    describe('createRequest', () => {
        it('should create request with ID', () => {
            const request = createRequest('analyze', { diagram: 'test' });

            expect(request.operation).toBe('analyze');
            expect(request.parameters).toEqual({ diagram: 'test' });
            expect(request.requestId).toBeDefined();
            expect(request.requestId).toMatch(/^req_/);
        });

        it('should generate unique request IDs', () => {
            const req1 = createRequest('op1', {});
            const req2 = createRequest('op2', {});

            expect(req1.requestId).not.toBe(req2.requestId);
        });
    });

    describe('createResponse', () => {
        it('should create success response', () => {
            const response = createResponse('req_123', true, { result: 'data' });

            expect(response.requestId).toBe('req_123');
            expect(response.success).toBe(true);
            expect(response.result).toEqual({ result: 'data' });
            expect(response.error).toBeUndefined();
        });

        it('should create error response', () => {
            const response = createResponse('req_123', false, undefined, 'Error message');

            expect(response.requestId).toBe('req_123');
            expect(response.success).toBe(false);
            expect(response.error).toBe('Error message');
        });
    });

    describe('createEvent', () => {
        it('should create event with data', () => {
            const event = createEvent('schema_updated', { schemaId: '123' });

            expect(event.eventType).toBe('schema_updated');
            expect(event.data).toEqual({ schemaId: '123' });
        });
    });
});
