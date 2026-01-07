/**
 * Table Management Type Definitions
 * For parsing and managing physical table structures
 */

/**
 * Field type mapping for common SQL types
 */
export type SQLDataType =
    | 'STRING'
    | 'VARCHAR'
    | 'CHAR'
    | 'INT'
    | 'BIGINT'
    | 'SMALLINT'
    | 'TINYINT'
    | 'DOUBLE'
    | 'FLOAT'
    | 'DECIMAL'
    | 'DATE'
    | 'DATETIME'
    | 'TIMESTAMP'
    | 'BOOLEAN'
    | 'ARRAY'
    | 'MAP'
    | 'STRUCT';

/**
 * Field classification for semantic layer
 */
export type FieldClassification = 'dimension' | 'metric' | 'hidden';

/**
 * Parsed field from DESC or CREATE TABLE statement
 */
export interface ParsedField {
    /** Unique ID for this field */
    id: string;
    /** Field name from table */
    fieldName: string;
    /** SQL data type */
    dataType: string;
    /** Normalized data type category */
    dataTypeCategory: 'string' | 'numeric' | 'datetime' | 'boolean' | 'complex';
    /** Field comment/description from table */
    comment: string;
    /** Whether field is nullable */
    nullable: boolean;
    /** Whether field is a partition column */
    isPartition: boolean;
    /** Field classification for semantic layer */
    classification: FieldClassification;
    /** Display name (editable, defaults to comment or fieldName) */
    displayName: string;
    /** Suggested aggregation function for metrics */
    suggestedAggr?: string;
}

/**
 * Table definition with all parsed fields
 */
export interface TableDefinition {
    /** Unique ID */
    id: string;
    /** Physical table name */
    tableName: string;
    /** Database/schema name */
    database?: string;
    /** Table comment/description */
    comment?: string;
    /** Table type (e.g., 'MANAGED', 'EXTERNAL') */
    tableType?: string;
    /** All parsed fields */
    fields: ParsedField[];
    /** Raw DDL statement */
    rawDDL?: string;
    /** Import timestamp */
    importedAt: string;
    /** Last updated timestamp */
    updatedAt: string;
    /** Import status */
    status: 'draft' | 'imported' | 'published';
}

/**
 * Result of parsing a DESC or CREATE TABLE statement
 */
export interface ParseResult {
    success: boolean;
    tableName?: string;
    database?: string;
    fields?: ParsedField[];
    tableComment?: string;
    errors?: string[];
}

/**
 * Import configuration for table-to-metric/dimension conversion
 */
export interface ImportConfig {
    /** Source table definition */
    tableId: string;
    /** Fields to import as metrics */
    metricFields: string[];
    /** Fields to import as dimensions */
    dimensionFields: string[];
    /** Auto-link metrics to dimensions from same table */
    autoLinkDimensions: boolean;
    /** Default metric group */
    defaultGroup: string;
    /** Default business owner */
    defaultBusinessOwner: string;
    /** Default data owner */
    defaultDataOwner: string;
}

/**
 * Table import history entry
 */
export interface ImportHistoryEntry {
    id: string;
    tableId: string;
    tableName: string;
    importedAt: string;
    metricsImported: number;
    dimensionsImported: number;
    importedBy?: string;
}
