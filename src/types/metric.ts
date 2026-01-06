/**
 * Metric Type Definitions
 * Single source of truth for all metric-related types
 */

import type { ComponentType } from 'react';

/**
 * Metric interface - represents a single metric definition
 */
export interface Metric {
    /** Unique identifier */
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
    /** Owner team/person (deprecated, use contactPerson) */
    owner: string;
    /** Business contact person (业务对接人) */
    contactPerson?: string;
    /** Metric type: 'atomic' (原子指标) or 'calculated' (计算指标) */
    metricType?: 'atomic' | 'calculated';
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
