/**
 * MCP Resources for ChartDB diagrams
 */

import type { DiagramStorage } from '../types.js';

export interface DiagramResource {
    uri: string;
    name: string;
    mimeType: string;
    description?: string;
}

export function getDiagramResources(storage: DiagramStorage): DiagramResource[] {
    const diagrams = storage.listDiagrams();
    return diagrams.map((diagram) => ({
        uri: `diagram://${diagram.id}`,
        name: diagram.name,
        mimeType: 'application/json',
        description: `${diagram.databaseType} diagram with ${diagram.tables.length} tables`,
    }));
}

export function getDiagramContent(
    storage: DiagramStorage,
    uri: string
): string {
    const match = uri.match(/^diagram:\/\/(.+)$/);
    if (!match) {
        throw new Error('Invalid diagram URI');
    }

    const diagramId = match[1];
    const diagram = storage.getDiagram(diagramId);

    if (!diagram) {
        throw new Error(`Diagram not found: ${diagramId}`);
    }

    return JSON.stringify(diagram, null, 2);
}

export function listDiagramsResource(storage: DiagramStorage): string {
    const diagrams = storage.listDiagrams();
    return JSON.stringify(
        diagrams.map((d) => ({
            id: d.id,
            name: d.name,
            databaseType: d.databaseType,
            tableCount: d.tables.length,
            relationshipCount: d.relationships.length,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
        })),
        null,
        2
    );
}
