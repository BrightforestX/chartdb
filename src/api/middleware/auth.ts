/**
 * Authentication middleware for API requests
 */

export interface AuthContext {
    apiKey?: string;
    userId?: string;
    isAuthenticated: boolean;
}

export class ApiAuthError extends Error {
    constructor(message: string, public statusCode: number = 401) {
        super(message);
        this.name = 'ApiAuthError';
    }
}

/**
 * Validate API key from request headers
 */
export function validateApiKey(authHeader?: string): AuthContext {
    if (!authHeader) {
        return { isAuthenticated: false };
    }

    // Expected format: "Bearer <api_key>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new ApiAuthError('Invalid authorization header format');
    }

    const apiKey = parts[1];
    
    // In production, validate against stored API keys
    // For now, we'll accept any non-empty key
    if (!apiKey || apiKey.length < 10) {
        throw new ApiAuthError('Invalid API key');
    }

    return {
        apiKey,
        isAuthenticated: true,
        userId: 'default-user', // Would be looked up from database
    };
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
    private requests: Map<string, number[]> = new Map();
    
    constructor(
        private maxRequests: number = 100,
        private windowMs: number = 60000 // 1 minute
    ) {}

    isRateLimited(identifier: string): boolean {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        
        // Get existing requests for this identifier
        let requests = this.requests.get(identifier) || [];
        
        // Filter out old requests
        requests = requests.filter(time => time > windowStart);
        
        // Check if rate limit exceeded
        if (requests.length >= this.maxRequests) {
            return true;
        }
        
        // Add current request
        requests.push(now);
        this.requests.set(identifier, requests);
        
        return false;
    }

    getRemainingRequests(identifier: string): number {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        const requests = (this.requests.get(identifier) || [])
            .filter(time => time > windowStart);
        
        return Math.max(0, this.maxRequests - requests.length);
    }
}

export const rateLimiter = new RateLimiter();
