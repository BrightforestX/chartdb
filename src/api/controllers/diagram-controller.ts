/**
 * Diagram API Controller
 */

import type { Diagram, DBTable, DBRelationship } from '@/lib/domain';
import type { ApiResponse } from '../types';
import { nanoid } from 'nanoid';

// In-memory storage for demo purposes
// In production, this would use a proper database
class DiagramStore {
    private diagrams = new Map<string, Diagram>();

    save(diagram: Diagram): void {
        this.diagrams.set(diagram.id, diagram);
    }

    get(id: string): Diagram | undefined {
        return this.diagrams.get(id);
    }

    list(): Diagram[] {
        return Array.from(this.diagrams.values());
    }

    delete(id: string): boolean {
        return this.diagrams.delete(id);
    }

    update(id: string, updates: Partial<Diagram>): Diagram | undefined {
        const diagram = this.get(id);
        if (!diagram) return undefined;

        const updated = {
            ...diagram,
            ...updates,
            updatedAt: new Date(),
        };
        
        this.save(updated);
        return updated;
    }
}

export const diagramStore = new DiagramStore();

export class DiagramController {
    async listDiagrams(): Promise<ApiResponse<Diagram[]>> {
        const diagrams = diagramStore.list();
        return {
            success: true,
            data: diagrams,
        };
    }

    async getDiagram(id: string): Promise<ApiResponse<Diagram>> {
        const diagram = diagramStore.get(id);
        
        if (!diagram) {
            return {
                success: false,
                error: 'Diagram not found',
            };
        }

        return {
            success: true,
            data: diagram,
        };
    }

    async createDiagram(data: {
        name: string;
        databaseType: string;
    }): Promise<ApiResponse<Diagram>> {
        const diagram: Diagram = {
            id: nanoid(),
            name: data.name,
            databaseType: data.databaseType as any,
            tables: [],
            relationships: [],
            areas: [],
            notes: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        diagramStore.save(diagram);

        return {
            success: true,
            data: diagram,
            message: 'Diagram created successfully',
        };
    }

    async updateDiagram(
        id: string,
        updates: Partial<Diagram>
    ): Promise<ApiResponse<Diagram>> {
        const updated = diagramStore.update(id, updates);

        if (!updated) {
            return {
                success: false,
                error: 'Diagram not found',
            };
        }

        return {
            success: true,
            data: updated,
            message: 'Diagram updated successfully',
        };
    }

    async deleteDiagram(id: string): Promise<ApiResponse<void>> {
        const deleted = diagramStore.delete(id);

        if (!deleted) {
            return {
                success: false,
                error: 'Diagram not found',
            };
        }

        return {
            success: true,
            message: 'Diagram deleted successfully',
        };
    }

    async addTable(
        diagramId: string,
        tableData: Omit<DBTable, 'id'>
    ): Promise<ApiResponse<DBTable>> {
        const diagram = diagramStore.get(diagramId);

        if (!diagram) {
            return {
                success: false,
                error: 'Diagram not found',
            };
        }

        const table: DBTable = {
            ...tableData,
            id: nanoid(),
        } as DBTable;

        diagram.tables = [...(diagram.tables || []), table];
        diagramStore.save(diagram);

        return {
            success: true,
            data: table,
            message: 'Table added successfully',
        };
    }

    async addRelationship(
        diagramId: string,
        relationshipData: Omit<DBRelationship, 'id'>
    ): Promise<ApiResponse<DBRelationship>> {
        const diagram = diagramStore.get(diagramId);

        if (!diagram) {
            return {
                success: false,
                error: 'Diagram not found',
            };
        }

        const relationship: DBRelationship = {
            ...relationshipData,
            id: nanoid(),
        } as DBRelationship;

        diagram.relationships = [
            ...(diagram.relationships || []),
            relationship,
        ];
        diagramStore.save(diagram);

        return {
            success: true,
            data: relationship,
            message: 'Relationship added successfully',
        };
    }

    async exportDiagram(
        id: string,
        format: 'json' | 'sql' | 'dbml'
    ): Promise<ApiResponse<string>> {
        const diagram = diagramStore.get(id);

        if (!diagram) {
            return {
                success: false,
                error: 'Diagram not found',
            };
        }

        let exported: string;

        switch (format) {
            case 'json':
                exported = JSON.stringify(diagram, null, 2);
                break;
            case 'sql':
                exported = this.generateSQL(diagram);
                break;
            case 'dbml':
                exported = this.generateDBML(diagram);
                break;
            default:
                return {
                    success: false,
                    error: 'Invalid export format',
                };
        }

        return {
            success: true,
            data: exported,
        };
    }

    private generateSQL(diagram: Diagram): string {
        let sql = `-- Database: ${diagram.name}\n`;
        sql += `-- Type: ${diagram.databaseType}\n\n`;

        for (const table of diagram.tables || []) {
            sql += `CREATE TABLE ${table.name} (\n`;
            const fieldDefs = (table.fields || []).map((field) => {
                let def = `  ${field.name} ${field.type}`;
                if (field.primaryKey) def += ' PRIMARY KEY';
                if (field.unique) def += ' UNIQUE';
                if (!field.nullable) def += ' NOT NULL';
                return def;
            });
            sql += fieldDefs.join(',\n');
            sql += '\n);\n\n';
        }

        return sql;
    }

    private generateDBML(diagram: Diagram): string {
        let dbml = `// Database: ${diagram.name}\n\n`;

        for (const table of diagram.tables || []) {
            dbml += `Table ${table.name} {\n`;
            for (const field of table.fields || []) {
                dbml += `  ${field.name} ${field.type}`;
                const attrs = [];
                if (field.primaryKey) attrs.push('pk');
                if (field.unique) attrs.push('unique');
                if (attrs.length > 0) {
                    dbml += ` [${attrs.join(', ')}]`;
                }
                dbml += '\n';
            }
            dbml += '}\n\n';
        }

        return dbml;
    }
}

export const diagramController = new DiagramController();
