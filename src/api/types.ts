/**
 * API Types for ChartDB REST API
 */

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface WebhookPayload {
    event: 'diagram.created' | 'diagram.updated' | 'diagram.deleted' | 'table.added' | 'relationship.added';
    timestamp: string;
    data: any;
}

export interface WebhookSubscription {
    id: string;
    url: string;
    events: string[];
    active: boolean;
    secret?: string;
    createdAt: string;
}

export interface ApiKey {
    id: string;
    key: string;
    name: string;
    createdAt: string;
    lastUsedAt?: string;
    expiresAt?: string;
}
