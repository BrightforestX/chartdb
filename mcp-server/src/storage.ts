/**
 * In-memory storage for diagrams
 * In production, this would connect to a real database
 */

import type { Diagram, DiagramStorage } from './types.js';

export class InMemoryDiagramStorage implements DiagramStorage {
    diagrams: Map<string, Diagram> = new Map();

    saveDiagram(diagram: Diagram): void {
        this.diagrams.set(diagram.id, {
            ...diagram,
            updatedAt: new Date().toISOString(),
        });
    }

    getDiagram(id: string): Diagram | undefined {
        return this.diagrams.get(id);
    }

    listDiagrams(): Diagram[] {
        return Array.from(this.diagrams.values());
    }

    deleteDiagram(id: string): boolean {
        return this.diagrams.delete(id);
    }

    clear(): void {
        this.diagrams.clear();
    }
}

export const storage = new InMemoryDiagramStorage();
