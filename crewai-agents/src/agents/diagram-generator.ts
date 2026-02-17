/**
 * Diagram Generator Agent
 * Generates optimal database diagrams from descriptions
 */

import type { Diagram } from './schema-analyzer.js';
import type { DiagramLayout, TablePosition } from '../types.js';
import { nanoid } from 'nanoid';

export interface GenerateDiagramRequest {
    description: string;
    databaseType: string;
    name?: string;
}

export class DiagramGeneratorAgent {
    name = 'Diagram Generator';
    role = 'Database Design Specialist';
    goal = 'Generate well-structured database diagrams from natural language descriptions';

    async generate(request: GenerateDiagramRequest): Promise<Diagram> {
        // Parse the description to extract entities and relationships
        const entities = this.extractEntities(request.description);
        const relationships = this.inferRelationships(entities, request.description);

        // Generate tables
        const tables = entities.map((entity, index) => ({
            id: nanoid(),
            name: entity.name,
            fields: [
                {
                    id: nanoid(),
                    name: 'id',
                    type: this.getPrimaryKeyType(request.databaseType),
                    primaryKey: true,
                    nullable: false,
                },
                ...entity.attributes.map(attr => ({
                    id: nanoid(),
                    name: attr.name,
                    type: attr.type,
                    nullable: attr.nullable ?? true,
                    unique: attr.unique ?? false,
                })),
                {
                    id: nanoid(),
                    name: 'created_at',
                    type: this.getTimestampType(request.databaseType),
                    nullable: false,
                },
                {
                    id: nanoid(),
                    name: 'updated_at',
                    type: this.getTimestampType(request.databaseType),
                    nullable: false,
                },
            ],
        }));

        // Generate relationships
        const dbRelationships = relationships.map(rel => {
            const sourceTable = tables.find(t => t.name === rel.from);
            const targetTable = tables.find(t => t.name === rel.to);

            if (!sourceTable || !targetTable) {
                throw new Error(`Invalid relationship: ${rel.from} -> ${rel.to}`);
            }

            // Add foreign key field if it doesn't exist
            const fkFieldName = `${targetTable.name.replace(/s$/, '')}_id`;
            let fkField = sourceTable.fields.find(f => f.name === fkFieldName);
            
            if (!fkField) {
                fkField = {
                    id: nanoid(),
                    name: fkFieldName,
                    type: this.getForeignKeyType(request.databaseType),
                    nullable: rel.type === 'one_to_one' ? false : true,
                };
                sourceTable.fields.splice(sourceTable.fields.length - 2, 0, fkField);
            }

            const targetPkField = targetTable.fields.find(f => f.primaryKey);

            return {
                id: nanoid(),
                sourceTableId: sourceTable.id,
                targetTableId: targetTable.id,
                sourceFieldId: fkField.id,
                targetFieldId: targetPkField!.id,
                type: rel.type,
            };
        });

        return {
            id: nanoid(),
            name: request.name || 'Generated Diagram',
            databaseType: request.databaseType,
            tables,
            relationships: dbRelationships,
        };
    }

    async optimizeLayout(diagram: Diagram): Promise<DiagramLayout> {
        // Simple force-directed layout algorithm
        const positions: TablePosition[] = [];
        const spacing = 300;
        const cols = Math.ceil(Math.sqrt(diagram.tables.length));

        diagram.tables.forEach((table, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            
            positions.push({
                tableId: table.id,
                x: col * spacing + 50,
                y: row * spacing + 50,
            });
        });

        // Group related tables into areas
        const areas = this.identifyAreas(diagram);

        return {
            tables: positions,
            areas,
        };
    }

    private extractEntities(description: string): Array<{
        name: string;
        attributes: Array<{
            name: string;
            type: string;
            nullable?: boolean;
            unique?: boolean;
        }>;
    }> {
        // Simple entity extraction (in production, this would use NLP/LLM)
        const entities = [];

        // Common patterns to detect entities
        const patterns = [
            /(?:table|entity|model) (?:called |named )?(\w+)/gi,
            /(\w+) (?:has|contains|stores) /gi,
        ];

        const foundEntities = new Set<string>();

        for (const pattern of patterns) {
            const matches = description.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    foundEntities.add(match[1].toLowerCase());
                }
            }
        }

        // Common entity names if none found
        if (foundEntities.size === 0) {
            if (description.includes('user')) foundEntities.add('users');
            if (description.includes('product')) foundEntities.add('products');
            if (description.includes('order')) foundEntities.add('orders');
        }

        for (const entityName of foundEntities) {
            entities.push({
                name: entityName,
                attributes: this.inferAttributes(entityName, description),
            });
        }

        return entities;
    }

    private inferAttributes(entityName: string, description: string): Array<{
        name: string;
        type: string;
        nullable?: boolean;
        unique?: boolean;
    }> {
        const attributes = [];

        // Common attributes based on entity type
        if (entityName === 'users') {
            attributes.push(
                { name: 'email', type: 'VARCHAR(255)', unique: true, nullable: false },
                { name: 'name', type: 'VARCHAR(100)', nullable: false },
                { name: 'password_hash', type: 'VARCHAR(255)', nullable: false }
            );
        } else if (entityName === 'products') {
            attributes.push(
                { name: 'name', type: 'VARCHAR(200)', nullable: false },
                { name: 'description', type: 'TEXT', nullable: true },
                { name: 'price', type: 'DECIMAL(10,2)', nullable: false },
                { name: 'stock', type: 'INTEGER', nullable: false }
            );
        } else if (entityName === 'orders') {
            attributes.push(
                { name: 'order_number', type: 'VARCHAR(50)', unique: true, nullable: false },
                { name: 'status', type: 'VARCHAR(50)', nullable: false },
                { name: 'total', type: 'DECIMAL(10,2)', nullable: false }
            );
        } else {
            // Default attributes
            attributes.push(
                { name: 'name', type: 'VARCHAR(100)', nullable: false },
                { name: 'description', type: 'TEXT', nullable: true }
            );
        }

        return attributes;
    }

    private inferRelationships(
        entities: Array<{ name: string }>,
        description: string
    ): Array<{
        from: string;
        to: string;
        type: 'one_to_one' | 'one_to_many' | 'many_to_one' | 'many_to_many';
    }> {
        const relationships = [];

        // Common relationship patterns
        if (entities.some(e => e.name === 'users') && entities.some(e => e.name === 'orders')) {
            relationships.push({
                from: 'orders',
                to: 'users',
                type: 'many_to_one' as const,
            });
        }

        if (entities.some(e => e.name === 'orders') && entities.some(e => e.name === 'products')) {
            relationships.push({
                from: 'orders',
                to: 'products',
                type: 'many_to_many' as const,
            });
        }

        return relationships;
    }

    private identifyAreas(diagram: Diagram): Array<{
        name: string;
        tables: string[];
        x: number;
        y: number;
        width: number;
        height: number;
    }> {
        // Group tables by common prefixes or relationships
        const areas = [];

        // Simple grouping by table name prefix
        const prefixGroups = new Map<string, string[]>();
        
        for (const table of diagram.tables) {
            const prefix = table.name.split('_')[0];
            if (!prefixGroups.has(prefix)) {
                prefixGroups.set(prefix, []);
            }
            prefixGroups.get(prefix)!.push(table.id);
        }

        // Create areas for groups with multiple tables
        let areaX = 0;
        for (const [prefix, tableIds] of prefixGroups) {
            if (tableIds.length > 1) {
                areas.push({
                    name: prefix.charAt(0).toUpperCase() + prefix.slice(1),
                    tables: tableIds,
                    x: areaX,
                    y: 0,
                    width: 400,
                    height: 300,
                });
                areaX += 450;
            }
        }

        return areas;
    }

    private getPrimaryKeyType(databaseType: string): string {
        switch (databaseType.toLowerCase()) {
            case 'postgresql':
                return 'SERIAL';
            case 'mysql':
            case 'mariadb':
                return 'INT AUTO_INCREMENT';
            case 'sql_server':
                return 'INT IDENTITY(1,1)';
            case 'sqlite':
                return 'INTEGER';
            default:
                return 'INTEGER';
        }
    }

    private getForeignKeyType(databaseType: string): string {
        return 'INTEGER';
    }

    private getTimestampType(databaseType: string): string {
        switch (databaseType.toLowerCase()) {
            case 'postgresql':
                return 'TIMESTAMP WITH TIME ZONE';
            case 'mysql':
            case 'mariadb':
                return 'TIMESTAMP';
            case 'sql_server':
                return 'DATETIME2';
            case 'sqlite':
                return 'TEXT';
            default:
                return 'TIMESTAMP';
        }
    }
}
