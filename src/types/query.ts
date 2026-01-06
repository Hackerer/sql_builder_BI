/**
 * Query Type Definitions
 */

/**
 * Query filter - represents a single filter condition
 */
export interface QueryFilter {
    /** Unique identifier */
    id: string;
    /** Dimension ID to filter on */
    dimId: string;
    /** Filter operator */
    operator: 'IN' | 'NOT_IN';
    /** Filter values */
    values: string[];
}

/**
 * Query state - represents the current query configuration
 */
export interface QueryState {
    /** Selected dimension IDs */
    dims: string[];
    /** Selected metric IDs */
    metrics: string[];
    /** Active filters */
    filters: QueryFilter[];
}

/**
 * Date range state
 */
export interface DateRangeState {
    startDate: Date;
    endDate: Date;
    preset: string;
}

/**
 * Comparison mode type
 */
export type ComparisonMode = 'dod' | 'wow' | 'mom' | 'yoy' | null;

/**
 * Advanced Comparison Type
 */
export type ComparisonType = 'none' | 'period' | 'day' | 'week' | 'month';

/**
 * Time granularity type
 */
export type TimeGranularity = 'hour' | 'day' | 'week' | 'month';

/**
 * Chart type
 */
export type ChartType = 'area' | 'bar' | 'line';

/**
 * Table view mode
 */
export type TableViewMode = 'summary' | 'detail';
