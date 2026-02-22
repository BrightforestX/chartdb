/**
 * API Route handlers
 */

import { diagramController } from '../controllers/diagram-controller';
import { webhookController } from '../controllers/webhook-controller';
import { validateApiKey, rateLimiter, ApiAuthError } from '../middleware/auth';
import type { ApiResponse } from '../types';

export interface ApiRequest {
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: any;
    params?: Record<string, string>;
    query?: Record<string, string>;
}

export interface ApiHandler {
    (request: ApiRequest): Promise<ApiResponse>;
}

/**
 * Middleware wrapper for authentication and rate limiting
 */
function withAuth(handler: ApiHandler): ApiHandler {
    return async (request: ApiRequest) => {
        try {
            // Validate authentication
            const auth = validateApiKey(request.headers.authorization);
            
            if (!auth.isAuthenticated) {
                return {
                    success: false,
                    error: 'Authentication required',
                };
            }

            // Check rate limiting
            const identifier = auth.apiKey || 'anonymous';
            if (rateLimiter.isRateLimited(identifier)) {
                return {
                    success: false,
                    error: 'Rate limit exceeded',
                };
            }

            // Execute handler
            return await handler(request);
        } catch (error) {
            if (error instanceof ApiAuthError) {
                return {
                    success: false,
                    error: error.message,
                };
            }
            throw error;
        }
    };
}

/**
 * API Route definitions
 */
export const apiRoutes = {
    // Diagram routes
    'GET /api/diagrams': withAuth(async () => {
        return await diagramController.listDiagrams();
    }),

    'GET /api/diagrams/:id': withAuth(async (request) => {
        const id = request.params?.id;
        if (!id) {
            return { success: false, error: 'Diagram ID required' };
        }
        return await diagramController.getDiagram(id);
    }),

    'POST /api/diagrams': withAuth(async (request) => {
        return await diagramController.createDiagram(request.body);
    }),

    'PUT /api/diagrams/:id': withAuth(async (request) => {
        const id = request.params?.id;
        if (!id) {
            return { success: false, error: 'Diagram ID required' };
        }
        return await diagramController.updateDiagram(id, request.body);
    }),

    'DELETE /api/diagrams/:id': withAuth(async (request) => {
        const id = request.params?.id;
        if (!id) {
            return { success: false, error: 'Diagram ID required' };
        }
        return await diagramController.deleteDiagram(id);
    }),

    'POST /api/diagrams/:id/tables': withAuth(async (request) => {
        const id = request.params?.id;
        if (!id) {
            return { success: false, error: 'Diagram ID required' };
        }
        const result = await diagramController.addTable(id, request.body);
        
        // Trigger webhook
        if (result.success && result.data) {
            await webhookController.triggerWebhooks('table.added', {
                diagramId: id,
                table: result.data,
            });
        }
        
        return result;
    }),

    'POST /api/diagrams/:id/relationships': withAuth(async (request) => {
        const id = request.params?.id;
        if (!id) {
            return { success: false, error: 'Diagram ID required' };
        }
        const result = await diagramController.addRelationship(
            id,
            request.body
        );
        
        // Trigger webhook
        if (result.success && result.data) {
            await webhookController.triggerWebhooks('relationship.added', {
                diagramId: id,
                relationship: result.data,
            });
        }
        
        return result;
    }),

    'GET /api/diagrams/:id/export/:format': withAuth(async (request) => {
        const id = request.params?.id;
        const format = request.params?.format as 'json' | 'sql' | 'dbml';
        
        if (!id || !format) {
            return {
                success: false,
                error: 'Diagram ID and format required',
            };
        }
        
        return await diagramController.exportDiagram(id, format);
    }),

    // Webhook routes
    'GET /api/webhooks': withAuth(async () => {
        return await webhookController.listWebhooks();
    }),

    'GET /api/webhooks/:id': withAuth(async (request) => {
        const id = request.params?.id;
        if (!id) {
            return { success: false, error: 'Webhook ID required' };
        }
        return await webhookController.getWebhook(id);
    }),

    'POST /api/webhooks': withAuth(async (request) => {
        return await webhookController.createWebhook(request.body);
    }),

    'PUT /api/webhooks/:id': withAuth(async (request) => {
        const id = request.params?.id;
        if (!id) {
            return { success: false, error: 'Webhook ID required' };
        }
        return await webhookController.updateWebhook(id, request.body);
    }),

    'DELETE /api/webhooks/:id': withAuth(async (request) => {
        const id = request.params?.id;
        if (!id) {
            return { success: false, error: 'Webhook ID required' };
        }
        return await webhookController.deleteWebhook(id);
    }),

    // Health check
    'GET /api/health': async () => {
        return {
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '0.1.0',
            },
        };
    },
};

/**
 * Route matcher utility
 */
export function matchRoute(method: string, path: string): string | null {
    const routeKey = `${method} ${path}`;
    
    // Exact match
    if (apiRoutes[routeKey as keyof typeof apiRoutes]) {
        return routeKey;
    }

    // Pattern match (supports :param syntax)
    for (const route in apiRoutes) {
        const pattern = route.split(' ')[1];
        const regex = new RegExp(
            '^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$'
        );
        
        if (route.startsWith(method) && regex.test(path)) {
            return route;
        }
    }

    return null;
}

/**
 * Extract route parameters
 */
export function extractParams(
    route: string,
    path: string
): Record<string, string> {
    const routePath = route.split(' ')[1];
    const routeParts = routePath.split('/');
    const pathParts = path.split('/');
    const params: Record<string, string> = {};

    for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
            const paramName = routeParts[i].slice(1);
            params[paramName] = pathParts[i];
        }
    }

    return params;
}
