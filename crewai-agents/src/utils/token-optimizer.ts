/**
 * Token Usage Optimizer
 * Reduce API costs and improve latency through token optimization
 */

export interface TokenStats {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
}

export interface OptimizationConfig {
    maxPromptTokens?: number;
    compressionLevel?: 'none' | 'low' | 'medium' | 'high';
    enableStreaming?: boolean;
    modelSelection?: 'auto' | 'fast' | 'balanced' | 'accurate';
}

/**
 * Estimate token count for text (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Compress prompt by removing unnecessary whitespace and redundancy
 */
export function compressPrompt(prompt: string, level: 'low' | 'medium' | 'high' = 'medium'): string {
    let compressed = prompt;

    switch (level) {
        case 'low':
            compressed = compressed.replace(/\s+/g, ' ');
            compressed = compressed.trim();
            break;

        case 'medium':
            compressed = compressed.replace(/\s+/g, ' ');
            compressed = compressed.trim();
            compressed = compressed.replace(/,\s+/g, ',');
            compressed = compressed.replace(/:\s+/g, ':');
            break;

        case 'high':
            compressed = compressed.replace(/\s+/g, ' ');
            compressed = compressed.trim();
            compressed = compressed.replace(/,\s+/g, ',');
            compressed = compressed.replace(/:\s+/g, ':');
            compressed = compressed.replace(/\.\s+/g, '. ');
            compressed = compressed.replace(/\n+/g, '\n');
            break;
    }

    return compressed;
}

/**
 * Truncate text to fit within token limit
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
    const estimatedTokens = estimateTokens(text);
    
    if (estimatedTokens <= maxTokens) {
        return text;
    }

    const ratio = maxTokens / estimatedTokens;
    const targetLength = Math.floor(text.length * ratio * 0.95);
    
    return text.substring(0, targetLength) + '...';
}

/**
 * Summarize long content to reduce tokens
 */
export function summarizeContent(content: any, maxLength: number = 500): string {
    const json = typeof content === 'string' ? content : JSON.stringify(content);
    
    if (json.length <= maxLength) {
        return json;
    }

    if (typeof content === 'object' && content !== null) {
        if (Array.isArray(content)) {
            return `[Array with ${content.length} items: ${JSON.stringify(content.slice(0, 3))}...]`;
        }

        const keys = Object.keys(content);
        const summary: any = {};
        
        let currentLength = 0;
        for (const key of keys) {
            const value = content[key];
            const valueStr = JSON.stringify(value);
            
            if (currentLength + valueStr.length < maxLength) {
                summary[key] = value;
                currentLength += valueStr.length;
            } else {
                summary[key] = Array.isArray(value) 
                    ? `[${value.length} items]`
                    : typeof value === 'object'
                    ? '{...}'
                    : String(value).substring(0, 20) + '...';
                break;
            }
        }
        
        return JSON.stringify(summary);
    }

    return json.substring(0, maxLength) + '...';
}

/**
 * Select optimal model based on task complexity
 */
export function selectOptimalModel(
    taskType: 'generation' | 'analysis' | 'optimization' | 'validation',
    complexity: 'low' | 'medium' | 'high'
): string {
    const modelMap = {
        generation: {
            low: 'gpt-3.5-turbo',
            medium: 'gpt-4',
            high: 'gpt-4-turbo',
        },
        analysis: {
            low: 'gpt-3.5-turbo',
            medium: 'gpt-3.5-turbo-16k',
            high: 'gpt-4',
        },
        optimization: {
            low: 'gpt-3.5-turbo',
            medium: 'gpt-4',
            high: 'gpt-4-turbo',
        },
        validation: {
            low: 'gpt-3.5-turbo',
            medium: 'gpt-3.5-turbo',
            high: 'gpt-4',
        },
    };

    return modelMap[taskType][complexity];
}

/**
 * Optimize prompt for better token efficiency
 */
export function optimizePrompt(
    prompt: string,
    config: OptimizationConfig = {}
): { optimized: string; tokensSaved: number } {
    const originalTokens = estimateTokens(prompt);
    let optimized = prompt;

    const compressionLevel = config.compressionLevel || 'medium';
    if (compressionLevel !== 'none') {
        optimized = compressPrompt(optimized, compressionLevel);
    }

    if (config.maxPromptTokens) {
        optimized = truncateToTokenLimit(optimized, config.maxPromptTokens);
    }

    const finalTokens = estimateTokens(optimized);
    const tokensSaved = originalTokens - finalTokens;

    return { optimized, tokensSaved };
}

/**
 * Calculate estimated cost based on token usage
 */
export function calculateCost(
    promptTokens: number,
    completionTokens: number,
    model: string = 'gpt-3.5-turbo'
): number {
    const pricing: Record<string, { input: number; output: number }> = {
        'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
        'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },
        'gpt-4': { input: 0.03, output: 0.06 },
        'gpt-4-turbo': { input: 0.01, output: 0.03 },
        'gpt-4o': { input: 0.005, output: 0.015 },
    };

    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
    
    const inputCost = (promptTokens / 1000) * modelPricing.input;
    const outputCost = (completionTokens / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
}

/**
 * Token usage tracker
 */
export class TokenTracker {
    private usage: TokenStats[] = [];

    track(stats: TokenStats): void {
        this.usage.push(stats);
    }

    getTotalUsage(): TokenStats {
        return this.usage.reduce(
            (acc, curr) => ({
                promptTokens: acc.promptTokens + curr.promptTokens,
                completionTokens: acc.completionTokens + curr.completionTokens,
                totalTokens: acc.totalTokens + curr.totalTokens,
                estimatedCost: acc.estimatedCost + curr.estimatedCost,
            }),
            { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 }
        );
    }

    getAverageUsage(): TokenStats {
        const total = this.getTotalUsage();
        const count = this.usage.length || 1;
        
        return {
            promptTokens: Math.round(total.promptTokens / count),
            completionTokens: Math.round(total.completionTokens / count),
            totalTokens: Math.round(total.totalTokens / count),
            estimatedCost: total.estimatedCost / count,
        };
    }

    clear(): void {
        this.usage = [];
    }

    getHistory(): TokenStats[] {
        return [...this.usage];
    }
}

/**
 * Create a token tracker instance
 */
export function createTokenTracker(): TokenTracker {
    return new TokenTracker();
}
