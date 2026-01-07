/**
 * Metric Type Definitions
 * Single source of truth for all metric-related types
 */

import type { ComponentType } from 'react';

/**
 * Aggregation function types for calculated metrics
 * These are used in SQL to ensure correct weighted calculations
 */
export type AggregationFunction =
    | 'SUM'           // 求和
    | 'AVG'           // 平均值
    | 'COUNT'         // 计数
    | 'COUNT_DISTINCT'// 去重计数
    | 'MAX'           // 最大值
    | 'MIN'           // 最小值
    | 'BITMAPUIN'     // 位图用户去重（用于UV计算）
    | 'BITMAP_COUNT'  // 位图计数
    | 'PERCENTILE';   // 百分位数

/**
 * A single term in a formula expression
 * e.g., SUM([order_amount]) or COUNT_DISTINCT([user_id])
 */
export interface FormulaTerm {
    /** Unique ID for this term */
    id: string;
    /** The aggregation function to apply */
    aggregation: AggregationFunction;
    /** The metric field ID to aggregate */
    metricId: string;
    /** Optional coefficient (multiplier) */
    coefficient?: number;
}

/**
 * An expression part that combines terms with operators
 */
export interface FormulaExpression {
    /** Terms in this expression (connected by + or -) */
    terms: FormulaTerm[];
    /** Operators between terms: '+' or '-' */
    operators: ('+' | '-')[];
}

/**
 * Formula configuration type for calculated metrics
 */
export type FormulaType =
    | 'simple'      // 简单聚合: SUM([metric])
    | 'ratio'       // 比率类型: SUM([A]) / SUM([B])
    | 'growth'      // 增长率: (SUM([当期]) - SUM([上期])) / SUM([上期]) * 100
    | 'difference'  // 差值: SUM([A]) - SUM([B])
    | 'weighted_avg'// 加权平均: SUM([值*权重]) / SUM([权重])
    | 'custom';     // 自定义复合公式

/**
 * Structured formula configuration for calculated metrics
 * This enables visual configuration and generates correct SQL
 */
export interface FormulaConfig {
    /** Formula type determines the calculation pattern */
    type: FormulaType;
    /** Numerator expression (分子) */
    numerator: FormulaExpression;
    /** Denominator expression (分母) - for ratio/growth types */
    denominator?: FormulaExpression;
    /** Final multiplier (e.g., 100 for percentage) */
    multiplier?: number;
    /** Generated SQL formula string */
    generatedFormula?: string;
}

/**
 * Display format configuration for metrics
 */
export interface MetricDisplayFormat {
    /** Number of decimal places (0-6) */
    decimals?: number;
    /** Display as percentage (multiply by 100 and add %) */
    isPercentage?: boolean;
    /** Prefix string (e.g., '¥', '$') */
    prefix?: string;
    /** Suffix string (e.g., '元', 'k') */
    suffix?: string;
    /** Use thousand separator */
    useThousandSeparator?: boolean;
    /** Abbreviate large numbers (e.g., 1.2k, 3.5M) */
    abbreviate?: boolean;
}

/**
 * Metric interface - represents a single metric definition
 */
export interface Metric {
    /** Unique identifier / field name */
    id: string;
    /** Display name */
    name: string;
    /** Primary group/category (e.g., '订单', '用户', '效率') */
    group: string;
    /** Secondary grouping (e.g., '订单漏斗', '用户漏斗') */
    subGroup?: string;
    /** Tags for filtering (e.g., 'core', 'realtime', 'DWS') */
    tags: string[];
    /** Compatible dimension IDs */
    compatibleDims: string[];
    /** Compatible time granularities */
    compatibleGranularities?: string[]; // e.g. ['hour', 'day', 'week', 'month']
    /** Business description */
    description: string;
    /** Business owner (业务负责人) */
    businessOwner: string;
    /** Data owner (数据负责人) */
    dataOwner: string;
    /** @deprecated Use businessOwner instead */
    owner?: string;
    /** Business contact person (业务对接人) */
    contactPerson?: string;
    /** Metric type: 'atomic' (原子指标) or 'calculated' (计算指标) */
    metricType?: 'atomic' | 'calculated';
    /** Structured formula configuration for calculated metrics */
    formulaConfig?: FormulaConfig;
    /** Raw formula string (legacy or for display) */
    formula?: string;
    /** Source table/model name (e.g., 'dws_order_day') */
    sourceTable?: string;
    /** Source field name in the table */
    sourceField?: string;
    /** Display format configuration */
    displayFormat?: MetricDisplayFormat;
    /** Colorful labels for display */
    labels?: MetricLabel[];
    /** Update frequency (e.g., '实时', 'T+1') */
    updateFrequency: string;
    /** Whether metric is starred/favorited */
    isStarred?: boolean;
    /** Aggregation type (e.g., 'SUM', 'AVG', 'COUNT_DISTINCT') */
    aggr: string;
    /** Display unit (e.g., '单', '%', '秒') */
    unit: string;
    /** Custom display name (overrides name) */
    displayName?: string;
    /** Data source: 'platform' (平台同步) or 'manual' (手动上传) */
    dataSource?: 'platform' | 'manual';
    /** Created timestamp */
    createdAt?: string;
    /** Updated timestamp */
    updatedAt?: string;
}

/**
 * Colorful label for metrics
 */
export interface MetricLabel {
    /** Label text */
    text: string;
    /** Color variant: 'blue', 'green', 'orange', 'purple', 'red', 'cyan', 'pink' */
    color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'cyan' | 'pink' | 'gray';
}

/**
 * TreeNode interface - for metric category tree navigation
 */
export interface TreeNode {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Node type - category or subcategory */
    type: 'category' | 'subcategory';
    /** Icon component for the node */
    icon?: ComponentType<{ size?: number; className?: string }>;
    /** Background color class */
    bgClass?: string;
    /** Text color class */
    textClass?: string;
    /** Child nodes */
    children?: TreeNode[];
    /** Count of metrics in this category */
    count?: number;
    /** Full path for filtering (e.g., "订单|订单漏斗") */
    fullPath?: string;
}

/**
 * Label group for filtering metrics
 */
export interface LabelGroup {
    id: string;
    name: string;
    options: LabelOption[];
}

/**
 * Label option within a label group
 */
export interface LabelOption {
    id: string;
    name: string;
    color: string;
}

/**
 * Data source mode for metric management
 */
export type MetricDataSourceMode = 'platform' | 'excel';

/**
 * Sync status for platform mode
 */
export interface SyncStatus {
    lastSyncTime: string;
    status: 'success' | 'failed' | 'syncing' | 'never';
    syncedCount: number;
    errorMessage?: string;
}
