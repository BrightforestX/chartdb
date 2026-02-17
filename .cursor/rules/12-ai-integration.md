# AI Integration Guidelines

## Overview
ChartDB uses the Vercel AI SDK with OpenAI for AI-powered features like SQL generation, diagram descriptions, and schema suggestions. Follow these guidelines for AI integration.

## AI SDK Setup

ChartDB uses:
- **@ai-sdk/openai**: OpenAI provider for Vercel AI SDK
- **ai**: Vercel AI SDK core
- Environment configuration for API keys and endpoints

## Configuration

### Environment Variables

```typescript
// ✅ Good - Environment configuration
export const AI_CONFIG = {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    endpoint: import.meta.env.VITE_OPENAI_API_ENDPOINT || 'https://api.openai.com/v1',
    model: import.meta.env.VITE_LLM_MODEL_NAME || 'gpt-4',
    enabled: Boolean(import.meta.env.VITE_OPENAI_API_KEY),
};

// ✅ Good - Check if AI is available
export function isAIEnabled(): boolean {
    return AI_CONFIG.enabled;
}
```

## Using AI SDK

### Text Generation

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

// ✅ Good - Generate SQL from description
export async function generateSQL(
    description: string,
    databaseType: DatabaseType
): Promise<string> {
    if (!isAIEnabled()) {
        throw new Error('AI features are not enabled');
    }

    try {
        const { text } = await generateText({
            model: openai(AI_CONFIG.model),
            system: `You are a ${databaseType} SQL expert. Generate valid SQL DDL statements.`,
            prompt: `Create SQL tables for: ${description}`,
            temperature: 0.3, // Lower temperature for more consistent output
        });

        return text;
    } catch (error) {
        console.error('AI generation failed:', error);
        throw new Error('Failed to generate SQL');
    }
}
```

### Streaming Responses

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

// ✅ Good - Stream AI responses
export async function streamDiagramDescription(
    diagram: Diagram,
    onChunk: (text: string) => void
): Promise<void> {
    const prompt = createDiagramPrompt(diagram);

    const { textStream } = await streamText({
        model: openai(AI_CONFIG.model),
        prompt,
        temperature: 0.7,
    });

    for await (const chunk of textStream) {
        onChunk(chunk);
    }
}

// ✅ Good - React component with streaming
export const AIDescription: React.FC<{ diagram: Diagram }> = ({ diagram }) => {
    const [description, setDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setDescription('');

        try {
            await streamDiagramDescription(diagram, (chunk) => {
                setDescription((prev) => prev + chunk);
            });
        } catch (error) {
            toast.error('Failed to generate description');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div>
            <button onClick={handleGenerate} disabled={isGenerating}>
                Generate Description
            </button>
            <p>{description}</p>
        </div>
    );
};
```

### Structured Output

```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// ✅ Good - Generate structured data
const TableSchema = z.object({
    name: z.string(),
    fields: z.array(z.object({
        name: z.string(),
        type: z.string(),
        nullable: z.boolean(),
        primaryKey: z.boolean(),
    })),
});

export async function generateTableSchema(
    description: string
): Promise<z.infer<typeof TableSchema>> {
    const { object } = await generateObject({
        model: openai(AI_CONFIG.model),
        schema: TableSchema,
        prompt: `Generate a database table schema for: ${description}`,
    });

    return object;
}
```

## Prompt Engineering

### System Prompts

```typescript
// ✅ Good - Specific system prompts
export const SYSTEM_PROMPTS = {
    sqlGeneration: (databaseType: DatabaseType) => `
You are an expert ${databaseType} database designer.
Generate valid SQL DDL statements following these rules:
- Use proper ${databaseType} syntax
- Include appropriate data types
- Add primary keys and foreign keys
- Use NOT NULL where appropriate
- Include meaningful constraints
- Output only SQL, no explanations
`,

    schemaAnalysis: `
You are a database schema analyzer.
Analyze the provided schema and provide:
- Overview of the database structure
- Identified patterns and relationships
- Potential optimization suggestions
- Data modeling best practices applied
`,

    diagramDescription: `
You are a technical writer specializing in database documentation.
Provide clear, concise descriptions of database schemas suitable for:
- Developer documentation
- Technical specifications
- Team communication
Use professional language and focus on structure and relationships.
`,
};
```

### Prompt Templates

```typescript
// ✅ Good - Reusable prompt templates
export function createSQLGenerationPrompt(
    description: string,
    databaseType: DatabaseType,
    existingTables?: Table[]
): string {
    let prompt = `Generate ${databaseType} SQL DDL statements for:\n${description}\n\n`;

    if (existingTables && existingTables.length > 0) {
        prompt += 'Existing tables:\n';
        existingTables.forEach(table => {
            prompt += `- ${table.name} (${table.fields.map(f => f.name).join(', ')})\n`;
        });
        prompt += '\nEnsure compatibility with existing schema.\n';
    }

    prompt += '\nOutput only valid SQL statements, no explanations.';
    return prompt;
}

export function createDiagramPrompt(diagram: Diagram): string {
    return `
Describe this database schema:

Database: ${diagram.databaseType}
Tables: ${diagram.tables.length}

${diagram.tables.map(table => `
Table: ${table.name}
Fields:
${table.fields.map(f => `  - ${f.name}: ${f.type}${f.primaryKey ? ' [PK]' : ''}${!f.nullable ? ' [NOT NULL]' : ''}`).join('\n')}
`).join('\n')}

Relationships: ${diagram.relationships.length}
${diagram.relationships.map(rel => {
    const source = diagram.tables.find(t => t.id === rel.sourceTableId);
    const target = diagram.tables.find(t => t.id === rel.targetTableId);
    return `  - ${source?.name} → ${target?.name}`;
}).join('\n')}

Provide a comprehensive description of this database schema, including purpose, structure, and relationships.
`;
}
```

## Error Handling

### AI Request Errors

```typescript
// ✅ Good - Handle AI errors gracefully
export async function generateWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2
): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            // Don't retry on auth errors
            if (error.message?.includes('authentication') || 
                error.message?.includes('API key')) {
                throw error;
            }

            // Don't retry on quota errors
            if (error.message?.includes('quota') || 
                error.message?.includes('rate limit')) {
                throw new Error('AI service quota exceeded. Please try again later.');
            }

            // Retry on network/temporary errors
            if (i < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
                continue;
            }
        }
    }

    throw lastError || new Error('AI generation failed');
}

// Usage
try {
    const result = await generateWithRetry(() => generateSQL(description, 'postgresql'));
} catch (error) {
    toast.error(getErrorMessage(error));
}
```

## Caching AI Results

```typescript
// ✅ Good - Cache AI responses
interface CacheEntry {
    result: string;
    timestamp: number;
    expiresIn: number; // milliseconds
}

class AICache {
    private cache = new Map<string, CacheEntry>();

    private getCacheKey(prompt: string, model: string): string {
        return `${model}:${prompt}`;
    }

    get(prompt: string, model: string): string | null {
        const key = this.getCacheKey(prompt, model);
        const entry = this.cache.get(key);

        if (!entry) return null;

        const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return entry.result;
    }

    set(prompt: string, model: string, result: string, expiresIn: number = 3600000): void {
        const key = this.getCacheKey(prompt, model);
        this.cache.set(key, {
            result,
            timestamp: Date.now(),
            expiresIn,
        });
    }
}

export const aiCache = new AICache();

// ✅ Good - Use cache
export async function generateSQLWithCache(
    description: string,
    databaseType: DatabaseType
): Promise<string> {
    const cached = aiCache.get(description, AI_CONFIG.model);
    if (cached) {
        return cached;
    }

    const result = await generateSQL(description, databaseType);
    aiCache.set(description, AI_CONFIG.model, result);
    return result;
}
```

## Token Management

```typescript
// ✅ Good - Estimate tokens (rough approximation)
export function estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
}

// ✅ Good - Truncate context if too long
export function truncateContext(
    context: string,
    maxTokens: number = 4000
): string {
    const tokens = estimateTokens(context);
    
    if (tokens <= maxTokens) {
        return context;
    }

    // Rough truncation (4 chars per token)
    const maxChars = maxTokens * 4;
    return context.slice(0, maxChars) + '...';
}
```

## UI Integration

### AI Feature Toggle

```typescript
// ✅ Good - Conditionally render AI features
export const ExportDialog: React.FC = () => {
    const aiEnabled = isAIEnabled();

    return (
        <Dialog>
            {/* Normal export options */}
            
            {aiEnabled && (
                <div>
                    <h3>AI-Powered Export</h3>
                    <Button onClick={handleAIExport}>
                        Generate with AI
                    </Button>
                </div>
            )}
        </Dialog>
    );
};
```

### Loading States

```typescript
// ✅ Good - Show AI generation progress
export const AIGeneratedSQL: React.FC<Props> = ({ description }) => {
    const [sql, setSql] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState('');

    const handleGenerate = async () => {
        setIsGenerating(true);
        setProgress('Analyzing description...');

        try {
            setProgress('Generating SQL...');
            const result = await generateSQL(description, 'postgresql');
            
            setProgress('Validating syntax...');
            await validateSQL(result);
            
            setSql(result);
            toast.success('SQL generated successfully');
        } catch (error) {
            toast.error('Failed to generate SQL');
        } finally {
            setIsGenerating(false);
            setProgress('');
        }
    };

    return (
        <div>
            <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? progress : 'Generate SQL'}
            </Button>
            {sql && <CodeEditor value={sql} language="sql" />}
        </div>
    );
};
```

## Custom Models and Endpoints

```typescript
// ✅ Good - Support custom models
export async function generateWithCustomModel(
    prompt: string,
    config: {
        endpoint?: string;
        model?: string;
        apiKey?: string;
    }
): Promise<string> {
    const { text } = await generateText({
        model: openai(config.model || AI_CONFIG.model, {
            baseURL: config.endpoint || AI_CONFIG.endpoint,
            apiKey: config.apiKey || AI_CONFIG.apiKey,
        }),
        prompt,
    });

    return text;
}
```

## Best Practices Summary

### Do's
- ✅ Check if AI is enabled before using
- ✅ Use appropriate system prompts
- ✅ Handle errors gracefully
- ✅ Show loading states
- ✅ Cache responses when appropriate
- ✅ Use lower temperature for consistent output
- ✅ Validate AI-generated content
- ✅ Provide fallbacks when AI fails
- ✅ Use structured output for typed data
- ✅ Truncate long contexts
- ✅ Support custom endpoints and models
- ✅ Implement retry logic for transient errors

### Don'ts
- ❌ Don't expose API keys in frontend
- ❌ Don't trust AI output blindly
- ❌ Don't make AI features required
- ❌ Don't ignore rate limits
- ❌ Don't forget to handle streaming errors
- ❌ Don't send sensitive data to AI without consent
- ❌ Don't cache sensitive information
- ❌ Don't use high temperature for structured output
- ❌ Don't forget to sanitize AI-generated SQL
- ❌ Don't make long requests without timeouts

## Example: Complete AI Feature

```typescript
// ✅ Good - Complete AI-powered feature
export const AITableGenerator: React.FC = () => {
    const [description, setDescription] = useState('');
    const [generatedSQL, setGeneratedSQL] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const { t } = useTranslation();

    const handleGenerate = async () => {
        if (!description.trim()) {
            toast.error(t('validation.required'));
            return;
        }

        if (!isAIEnabled()) {
            toast.error(t('ai.notEnabled'));
            return;
        }

        setIsGenerating(true);
        setGeneratedSQL('');

        try {
            const sql = await generateWithRetry(() => 
                generateSQL(description, 'postgresql')
            );

            // Validate generated SQL
            await validateSQL(sql);

            setGeneratedSQL(sql);
            toast.success(t('ai.generateSuccess'));
        } catch (error) {
            console.error('AI generation failed:', error);
            toast.error(t('ai.generateError'));
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-4">
            <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('ai.descriptionPlaceholder')}
                disabled={isGenerating}
            />

            <Button
                onClick={handleGenerate}
                disabled={isGenerating || !description.trim()}
            >
                {isGenerating ? (
                    <>
                        <Spinner className="mr-2" />
                        {t('ai.generating')}
                    </>
                ) : (
                    t('ai.generate')
                )}
            </Button>

            {generatedSQL && (
                <CodeEditor
                    value={generatedSQL}
                    language="sql"
                    readOnly
                />
            )}
        </div>
    );
};
```
