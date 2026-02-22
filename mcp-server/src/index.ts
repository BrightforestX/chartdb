#!/usr/bin/env node

/**
 * ChartDB MCP Server
 * Exposes database diagram functionality via Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { storage } from './storage.js';
import {
    getDiagramResources,
    getDiagramContent,
    listDiagramsResource,
} from './resources/diagrams.js';
import {
    createDiagram,
    addTable,
    addRelationship,
    addArea,
    addNote,
    exportSQL,
    exportDBML,
} from './tools/diagram-tools.js';
import {
    PROMPT_TEMPLATES,
    generateDiagramPrompt,
    optimizeSchemaPrompt,
    explainDiagramPrompt,
    migrateDatabasePrompt,
    validateSchemaPrompt,
} from './prompts/schema-prompts.js';

const server = new Server(
    {
        name: 'chartdb-mcp-server',
        version: '0.1.0',
    },
    {
        capabilities: {
            resources: {},
            tools: {},
            prompts: {},
        },
    }
);

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const diagramResources = getDiagramResources(storage);
    return {
        resources: [
            {
                uri: 'diagrams://list',
                name: 'All Diagrams',
                mimeType: 'application/json',
                description: 'List of all available diagrams',
            },
            ...diagramResources,
        ],
    };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    if (uri === 'diagrams://list') {
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: listDiagramsResource(storage),
                },
            ],
        };
    }

    if (uri.startsWith('diagram://')) {
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: getDiagramContent(storage, uri),
                },
            ],
        };
    }

    throw new Error(`Unknown resource: ${uri}`);
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'create_diagram',
                description: 'Create a new database diagram',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Name of the diagram',
                        },
                        databaseType: {
                            type: 'string',
                            enum: [
                                'postgresql',
                                'mysql',
                                'sql_server',
                                'mariadb',
                                'sqlite',
                                'cockroachdb',
                                'clickhouse',
                            ],
                            description: 'Type of database',
                        },
                    },
                    required: ['name', 'databaseType'],
                },
            },
            {
                name: 'add_table',
                description: 'Add a table to a diagram',
                inputSchema: {
                    type: 'object',
                    properties: {
                        diagramId: {
                            type: 'string',
                            description: 'ID of the diagram',
                        },
                        name: {
                            type: 'string',
                            description: 'Name of the table',
                        },
                        schema: {
                            type: 'string',
                            description: 'Schema name (optional)',
                        },
                        fields: {
                            type: 'array',
                            description: 'Array of field definitions',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    type: { type: 'string' },
                                    primaryKey: { type: 'boolean' },
                                    unique: { type: 'boolean' },
                                    nullable: { type: 'boolean' },
                                    default: { type: 'string' },
                                    comment: { type: 'string' },
                                },
                                required: ['name', 'type'],
                            },
                        },
                        x: {
                            type: 'number',
                            description: 'X coordinate on canvas',
                        },
                        y: {
                            type: 'number',
                            description: 'Y coordinate on canvas',
                        },
                        color: {
                            type: 'string',
                            description: 'Color hex code',
                        },
                    },
                    required: ['diagramId', 'name', 'fields'],
                },
            },
            {
                name: 'add_relationship',
                description: 'Add a relationship between two tables',
                inputSchema: {
                    type: 'object',
                    properties: {
                        diagramId: {
                            type: 'string',
                            description: 'ID of the diagram',
                        },
                        sourceTableId: {
                            type: 'string',
                            description: 'ID of the source table',
                        },
                        targetTableId: {
                            type: 'string',
                            description: 'ID of the target table',
                        },
                        sourceFieldId: {
                            type: 'string',
                            description: 'ID of the source field',
                        },
                        targetFieldId: {
                            type: 'string',
                            description: 'ID of the target field',
                        },
                        type: {
                            type: 'string',
                            enum: [
                                'one_to_one',
                                'one_to_many',
                                'many_to_one',
                                'many_to_many',
                            ],
                            description: 'Type of relationship',
                        },
                        name: {
                            type: 'string',
                            description: 'Name of the relationship (optional)',
                        },
                    },
                    required: [
                        'diagramId',
                        'sourceTableId',
                        'targetTableId',
                        'sourceFieldId',
                        'targetFieldId',
                        'type',
                    ],
                },
            },
            {
                name: 'add_area',
                description: 'Add an area to group tables visually',
                inputSchema: {
                    type: 'object',
                    properties: {
                        diagramId: { type: 'string' },
                        name: { type: 'string' },
                        x: { type: 'number' },
                        y: { type: 'number' },
                        width: { type: 'number' },
                        height: { type: 'number' },
                        color: { type: 'string' },
                    },
                    required: ['diagramId', 'name', 'x', 'y', 'width', 'height'],
                },
            },
            {
                name: 'add_note',
                description: 'Add a note to the diagram',
                inputSchema: {
                    type: 'object',
                    properties: {
                        diagramId: { type: 'string' },
                        content: { type: 'string' },
                        x: { type: 'number' },
                        y: { type: 'number' },
                        width: { type: 'number' },
                        height: { type: 'number' },
                        color: { type: 'string' },
                    },
                    required: ['diagramId', 'content', 'x', 'y'],
                },
            },
            {
                name: 'export_sql',
                description: 'Export diagram as SQL DDL script',
                inputSchema: {
                    type: 'object',
                    properties: {
                        diagramId: {
                            type: 'string',
                            description: 'ID of the diagram to export',
                        },
                    },
                    required: ['diagramId'],
                },
            },
            {
                name: 'export_dbml',
                description: 'Export diagram as DBML',
                inputSchema: {
                    type: 'object',
                    properties: {
                        diagramId: {
                            type: 'string',
                            description: 'ID of the diagram to export',
                        },
                    },
                    required: ['diagramId'],
                },
            },
        ],
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case 'create_diagram': {
                const diagram = createDiagram(storage, args as any);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(diagram, null, 2),
                        },
                    ],
                };
            }

            case 'add_table': {
                const table = addTable(storage, args as any);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(table, null, 2),
                        },
                    ],
                };
            }

            case 'add_relationship': {
                const relationship = addRelationship(storage, args as any);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(relationship, null, 2),
                        },
                    ],
                };
            }

            case 'add_area': {
                const area = addArea(storage, args as any);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(area, null, 2),
                        },
                    ],
                };
            }

            case 'add_note': {
                const note = addNote(storage, args as any);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(note, null, 2),
                        },
                    ],
                };
            }

            case 'export_sql': {
                const sql = exportSQL(storage, args as any);
                return {
                    content: [
                        {
                            type: 'text',
                            text: sql,
                        },
                    ],
                };
            }

            case 'export_dbml': {
                const dbml = exportDBML(storage, args as any);
                return {
                    content: [
                        {
                            type: 'text',
                            text: dbml,
                        },
                    ],
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${errorMessage}`,
                },
            ],
            isError: true,
        };
    }
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: Object.values(PROMPT_TEMPLATES).map((template) => ({
            name: template.name,
            description: template.description,
            arguments: template.arguments,
        })),
    };
});

// Get prompt content
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
        case 'generate_diagram':
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: generateDiagramPrompt(args as any),
                        },
                    },
                ],
            };

        case 'optimize_schema':
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: optimizeSchemaPrompt(args as any),
                        },
                    },
                ],
            };

        case 'explain_diagram':
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: explainDiagramPrompt(args as any),
                        },
                    },
                ],
            };

        case 'migrate_database':
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: migrateDatabasePrompt(args as any),
                        },
                    },
                ],
            };

        case 'validate_schema':
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: validateSchemaPrompt(args as any),
                        },
                    },
                ],
            };

        default:
            throw new Error(`Unknown prompt: ${name}`);
    }
});

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('ChartDB MCP Server running on stdio');
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
