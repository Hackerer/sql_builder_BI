/**
 * Dimension Type Definitions
 */

/**
 * Dimension interface - represents a single dimension definition
 */
export interface Dimension {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Dimension group (e.g., '时间', '地域', '业务') */
    group: string;
    /** Business description */
    description: string;
    /** Whether this is a core dimension */
    isCore: boolean;
}

/**
 * Dimension value options for each dimension
 */
export type DimensionValues = Record<string, string[]>;
