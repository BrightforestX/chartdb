import type { DataTypeData } from './data-types';

export const firestoreDataTypes: readonly DataTypeData[] = [
    // Primitive Types
    { name: 'string', id: 'string', usageLevel: 1 },
    { name: 'number', id: 'number', usageLevel: 1 },
    { name: 'boolean', id: 'boolean', usageLevel: 1 },
    { name: 'null', id: 'null', usageLevel: 2 },

    // Complex Types
    { name: 'map', id: 'map', usageLevel: 1 },
    { name: 'array', id: 'array', usageLevel: 1 },

    // Special Types
    { name: 'timestamp', id: 'timestamp', usageLevel: 1 },
    { name: 'geopoint', id: 'geopoint', usageLevel: 2 },
    { name: 'reference', id: 'reference', usageLevel: 1 },
    { name: 'bytes', id: 'bytes', usageLevel: 2 },
] as const;
