import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    createGraph,
    addVertex,
    addEdge,
    getNeighbors,
    removeVertex,
    removeEdge,
} from '../graph';

describe('graph', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    describe('createGraph', () => {
        it('should create an empty graph', () => {
            const graph = createGraph<string>();

            expect(graph.graph.size).toBe(0);
            expect(graph.lastUpdated).toBeDefined();
        });

        it('should set lastUpdated timestamp', () => {
            const now = Date.now();
            vi.setSystemTime(now);

            const graph = createGraph<string>();

            expect(graph.lastUpdated).toBe(now);
        });

        it('should work with different types', () => {
            const stringGraph = createGraph<string>();
            const numberGraph = createGraph<number>();
            const objectGraph = createGraph<{ id: string }>();

            expect(stringGraph.graph).toBeInstanceOf(Map);
            expect(numberGraph.graph).toBeInstanceOf(Map);
            expect(objectGraph.graph).toBeInstanceOf(Map);
        });
    });

    describe('addVertex', () => {
        it('should add a vertex to the graph', () => {
            let graph = createGraph<string>();
            graph = addVertex(graph, 'A');

            expect(graph.graph.has('A')).toBe(true);
            expect(graph.graph.get('A')).toEqual([]);
        });

        it('should not duplicate vertices', () => {
            let graph = createGraph<string>();
            graph = addVertex(graph, 'A');
            graph = addVertex(graph, 'A');

            expect(graph.graph.size).toBe(1);
        });

        it('should update lastUpdated timestamp', () => {
            const initialTime = 1000;
            const updateTime = 2000;

            vi.setSystemTime(initialTime);
            let graph = createGraph<string>();

            vi.setSystemTime(updateTime);
            graph = addVertex(graph, 'A');

            expect(graph.lastUpdated).toBe(updateTime);
        });

        it('should add multiple vertices', () => {
            let graph = createGraph<string>();
            graph = addVertex(graph, 'A');
            graph = addVertex(graph, 'B');
            graph = addVertex(graph, 'C');

            expect(graph.graph.size).toBe(3);
            expect(graph.graph.has('A')).toBe(true);
            expect(graph.graph.has('B')).toBe(true);
            expect(graph.graph.has('C')).toBe(true);
        });
    });

    describe('addEdge', () => {
        it('should add an edge between two vertices', () => {
            let graph = createGraph<string>();
            graph = addEdge(graph, 'A', 'B');

            expect(graph.graph.get('A')).toContain('B');
            expect(graph.graph.get('B')).toContain('A');
        });

        it('should create vertices if they do not exist', () => {
            let graph = createGraph<string>();
            graph = addEdge(graph, 'A', 'B');

            expect(graph.graph.has('A')).toBe(true);
            expect(graph.graph.has('B')).toBe(true);
        });

        it('should not duplicate edges', () => {
            let graph = createGraph<string>();
            graph = addEdge(graph, 'A', 'B');
            graph = addEdge(graph, 'A', 'B');

            expect(graph.graph.get('A')?.length).toBe(1);
            expect(graph.graph.get('B')?.length).toBe(1);
        });

        it('should update lastUpdated timestamp', () => {
            const initialTime = 1000;
            const updateTime = 2000;

            vi.setSystemTime(initialTime);
            let graph = createGraph<string>();

            vi.setSystemTime(updateTime);
            graph = addEdge(graph, 'A', 'B');

            expect(graph.lastUpdated).toBe(updateTime);
        });

        it('should create undirected edges', () => {
            let graph = createGraph<string>();
            graph = addEdge(graph, 'A', 'B');
            graph = addEdge(graph, 'B', 'C');

            expect(graph.graph.get('A')).toContain('B');
            expect(graph.graph.get('B')).toContain('A');
            expect(graph.graph.get('B')).toContain('C');
            expect(graph.graph.get('C')).toContain('B');
        });
    });

    describe('getNeighbors', () => {
        it('should return neighbors of a vertex', () => {
            let graph = createGraph<string>();
            graph = addEdge(graph, 'A', 'B');
            graph = addEdge(graph, 'A', 'C');

            const neighbors = getNeighbors(graph, 'A');

            expect(neighbors).toEqual(expect.arrayContaining(['B', 'C']));
            expect(neighbors?.length).toBe(2);
        });

        it('should return empty array for vertex with no neighbors', () => {
            let graph = createGraph<string>();
            graph = addVertex(graph, 'A');

            const neighbors = getNeighbors(graph, 'A');

            expect(neighbors).toEqual([]);
        });

        it('should return undefined for non-existent vertex', () => {
            const graph = createGraph<string>();

            const neighbors = getNeighbors(graph, 'A');

            expect(neighbors).toBeUndefined();
        });
    });

    describe('removeVertex', () => {
        it('should remove a vertex from the graph', () => {
            let graph = createGraph<string>();
            graph = addVertex(graph, 'A');
            graph = addVertex(graph, 'B');
            graph = removeVertex(graph, 'A');

            expect(graph.graph.has('A')).toBe(false);
            expect(graph.graph.has('B')).toBe(true);
        });

        it('should remove all edges connected to the vertex', () => {
            let graph = createGraph<string>();
            graph = addEdge(graph, 'A', 'B');
            graph = addEdge(graph, 'A', 'C');
            graph = removeVertex(graph, 'A');

            expect(graph.graph.get('B')).not.toContain('A');
            expect(graph.graph.get('C')).not.toContain('A');
        });

        it('should update lastUpdated timestamp', () => {
            const initialTime = 1000;
            const updateTime = 2000;

            vi.setSystemTime(initialTime);
            let graph = createGraph<string>();
            graph = addVertex(graph, 'A');

            vi.setSystemTime(updateTime);
            graph = removeVertex(graph, 'A');

            expect(graph.lastUpdated).toBe(updateTime);
        });

        it('should handle removing non-existent vertex', () => {
            let graph = createGraph<string>();
            graph = addVertex(graph, 'A');

            expect(() => {
                graph = removeVertex(graph, 'B');
            }).not.toThrow();

            expect(graph.graph.has('A')).toBe(true);
        });
    });

    describe('removeEdge', () => {
        it('should remove an edge between two vertices', () => {
            let graph = createGraph<string>();
            graph = addEdge(graph, 'A', 'B');
            graph = removeEdge(graph, 'A', 'B');

            expect(graph.graph.get('A')).not.toContain('B');
            expect(graph.graph.get('B')).not.toContain('A');
        });

        it('should keep vertices after removing edge', () => {
            let graph = createGraph<string>();
            graph = addEdge(graph, 'A', 'B');
            graph = removeEdge(graph, 'A', 'B');

            expect(graph.graph.has('A')).toBe(true);
            expect(graph.graph.has('B')).toBe(true);
            expect(graph.graph.get('A')).toEqual([]);
            expect(graph.graph.get('B')).toEqual([]);
        });

        it('should update lastUpdated timestamp', () => {
            const initialTime = 1000;
            const updateTime = 2000;

            vi.setSystemTime(initialTime);
            let graph = createGraph<string>();
            graph = addEdge(graph, 'A', 'B');

            vi.setSystemTime(updateTime);
            graph = removeEdge(graph, 'A', 'B');

            expect(graph.lastUpdated).toBe(updateTime);
        });

        it('should not affect other edges', () => {
            let graph = createGraph<string>();
            graph = addEdge(graph, 'A', 'B');
            graph = addEdge(graph, 'A', 'C');
            graph = removeEdge(graph, 'A', 'B');

            expect(graph.graph.get('A')).toContain('C');
            expect(graph.graph.get('A')).not.toContain('B');
        });

        it('should handle removing non-existent edge', () => {
            let graph = createGraph<string>();
            graph = addEdge(graph, 'A', 'B');

            expect(() => {
                graph = removeEdge(graph, 'A', 'C');
            }).not.toThrow();

            expect(graph.graph.get('A')).toContain('B');
        });
    });

    describe('graph operations integration', () => {
        it('should handle complex graph manipulations', () => {
            let graph = createGraph<string>();

            // Add vertices and edges
            graph = addEdge(graph, 'A', 'B');
            graph = addEdge(graph, 'B', 'C');
            graph = addEdge(graph, 'C', 'D');
            graph = addEdge(graph, 'A', 'D');

            expect(graph.graph.size).toBe(4);

            // Remove a vertex
            graph = removeVertex(graph, 'B');
            expect(graph.graph.size).toBe(3);
            expect(getNeighbors(graph, 'A')).not.toContain('B');
            expect(getNeighbors(graph, 'C')).not.toContain('B');

            // Remove an edge
            graph = removeEdge(graph, 'A', 'D');
            expect(getNeighbors(graph, 'A')).not.toContain('D');
            expect(getNeighbors(graph, 'D')).not.toContain('A');

            // Add back some connections
            graph = addEdge(graph, 'A', 'C');
            expect(getNeighbors(graph, 'A')).toContain('C');
            expect(getNeighbors(graph, 'C')).toContain('A');
        });

        it('should work with numeric vertices', () => {
            let graph = createGraph<number>();
            graph = addEdge(graph, 1, 2);
            graph = addEdge(graph, 2, 3);
            graph = addEdge(graph, 3, 4);

            expect(getNeighbors(graph, 2)).toEqual(
                expect.arrayContaining([1, 3])
            );

            graph = removeVertex(graph, 2);
            expect(graph.graph.has(2)).toBe(false);
            expect(getNeighbors(graph, 1)).not.toContain(2);
            expect(getNeighbors(graph, 3)).not.toContain(2);
        });
    });
});
