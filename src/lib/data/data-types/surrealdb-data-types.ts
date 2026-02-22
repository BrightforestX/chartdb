import type { DataTypeData } from './data-types';

export const surrealdbDataTypes: readonly DataTypeData[] = [
    // Primitive Types
    { name: 'any', id: 'any', usageLevel: 2 },
    { name: 'null', id: 'null', usageLevel: 2 },
    { name: 'none', id: 'none', usageLevel: 2 },

    // Boolean Type
    { name: 'bool', id: 'bool', usageLevel: 1 },

    // Number Types
    { name: 'int', id: 'int', usageLevel: 1 },
    { name: 'float', id: 'float', usageLevel: 1 },
    { name: 'decimal', id: 'decimal', usageLevel: 1 },
    { name: 'number', id: 'number', usageLevel: 1 },

    // String Types
    {
        name: 'string',
        id: 'string',
        usageLevel: 1,
    },
    { name: 'uuid', id: 'uuid', usageLevel: 1 },

    // DateTime Types
    { name: 'datetime', id: 'datetime', usageLevel: 1 },
    { name: 'duration', id: 'duration', usageLevel: 2 },

    // Geometry Types
    { name: 'geometry', id: 'geometry', usageLevel: 2 },
    { name: 'point', id: 'point', usageLevel: 2 },
    { name: 'line', id: 'line', usageLevel: 2 },
    { name: 'polygon', id: 'polygon', usageLevel: 2 },
    { name: 'multipoint', id: 'multipoint', usageLevel: 2 },
    { name: 'multiline', id: 'multiline', usageLevel: 2 },
    { name: 'multipolygon', id: 'multipolygon', usageLevel: 2 },
    { name: 'collection', id: 'collection', usageLevel: 2 },

    // Complex Types
    { name: 'array', id: 'array', usageLevel: 1 },
    { name: 'object', id: 'object', usageLevel: 1 },
    { name: 'record', id: 'record', usageLevel: 1 },
    { name: 'option', id: 'option', usageLevel: 2 },
    { name: 'set', id: 'set', usageLevel: 2 },

    // Special Types
    { name: 'bytes', id: 'bytes', usageLevel: 2 },
] as const;
