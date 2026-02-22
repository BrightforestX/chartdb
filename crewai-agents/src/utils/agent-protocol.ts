/**
 * Standardized agent communication protocol
 */

export interface AgentMessage<T = unknown> {
    id: string;
    type: 'request' | 'response' | 'event' | 'notification';
    sender: string;
    recipient?: string;
    payload: T;
    timestamp: number;
    correlationId?: string;
}

export interface AgentRequest<T = unknown> {
    operation: string;
    parameters: T;
    requestId: string;
}

export interface AgentResponse<T = unknown> {
    requestId: string;
    success: boolean;
    result?: T;
    error?: string;
}

export interface AgentEvent {
    eventType: string;
    data: unknown;
}

export type MessageHandler<T = unknown> = (message: AgentMessage<T>) => Promise<void> | void;

export class AgentCommunicationBus {
    private handlers: Map<string, MessageHandler[]> = new Map();
    private messageLog: AgentMessage[] = [];
    private maxLogSize: number;

    constructor(maxLogSize: number = 1000) {
        this.maxLogSize = maxLogSize;
    }

    send<T>(message: Omit<AgentMessage<T>, 'id' | 'timestamp'>): void {
        const fullMessage: AgentMessage<T> = {
            ...message,
            id: this.generateMessageId(),
            timestamp: Date.now(),
        };

        this.logMessage(fullMessage);
        this.dispatch(fullMessage);
    }

    subscribe(recipient: string, handler: MessageHandler): void {
        if (!this.handlers.has(recipient)) {
            this.handlers.set(recipient, []);
        }
        this.handlers.get(recipient)!.push(handler);
    }

    unsubscribe(recipient: string, handler: MessageHandler): void {
        const handlers = this.handlers.get(recipient);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    private dispatch(message: AgentMessage): void {
        const recipients = message.recipient
            ? [message.recipient]
            : Array.from(this.handlers.keys());

        for (const recipient of recipients) {
            const handlers = this.handlers.get(recipient);
            if (handlers) {
                for (const handler of handlers) {
                    try {
                        handler(message);
                    } catch (error) {
                        console.error(
                            `Error in message handler for ${recipient}:`,
                            error
                        );
                    }
                }
            }
        }
    }

    private logMessage(message: AgentMessage): void {
        this.messageLog.push(message);
        
        if (this.messageLog.length > this.maxLogSize) {
            this.messageLog.shift();
        }
    }

    getMessageLog(count?: number): AgentMessage[] {
        if (count) {
            return this.messageLog.slice(-count);
        }
        return [...this.messageLog];
    }

    getMessagesByAgent(agentName: string): AgentMessage[] {
        return this.messageLog.filter(
            m => m.sender === agentName || m.recipient === agentName
        );
    }

    clearLog(): void {
        this.messageLog = [];
    }

    private generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

export function createRequest<T>(
    operation: string,
    parameters: T
): AgentRequest<T> {
    return {
        operation,
        parameters,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
}

export function createResponse<T>(
    requestId: string,
    success: boolean,
    result?: T,
    error?: string
): AgentResponse<T> {
    return {
        requestId,
        success,
        result,
        error,
    };
}

export function createEvent(eventType: string, data: unknown): AgentEvent {
    return {
        eventType,
        data,
    };
}
