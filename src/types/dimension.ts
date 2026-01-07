/**
 * Dimension Type Definitions
 * Enhanced for semantic layer management
 */

/**
 * Dimension data type
 */
export type DimensionDataType = 'string' | 'number' | 'date' | 'boolean';

/**
 * Dimension interface - represents a single dimension definition
 */
export interface Dimension {
    /** Unique identifier / code */
    id: string;
    /** Display name */
    name: string;
    /** Dimension group (e.g., '时间', '地域', '业务') */
    group: string;
    /** Business description */
    description: string;
    /** Whether this is a core dimension */
    isCore: boolean;
    /** Data type */
    dataType?: DimensionDataType;
    /** Source table name */
    sourceTable?: string;
    /** Source field name in the table */
    sourceField?: string;
    /** Related tables (cross-table dimension aggregation) */
    relatedTables?: string[];
    /** Status */
    status?: 'draft' | 'published' | 'deprecated';
    /** Business owner */
    businessOwner?: string;
    /** Data owner */
    dataOwner?: string;
    /** Created timestamp */
    createdAt?: string;
    /** Updated timestamp */
    updatedAt?: string;
    /** Tags for filtering */
    tags?: string[];
}

/**
 * Dimension value options for each dimension
 */
export type DimensionValues = Record<string, string[]>;

/**
 * Cross-table dimension aggregation info
 */
export interface DimensionAggregation {
    dimensionId: string;
    dimensionName: string;
    tables: {
        tableName: string;
        fieldName: string;
        dataType: string;
    }[];
}
