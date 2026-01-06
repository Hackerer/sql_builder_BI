/**
 * Dimensions Data Module
 * Contains dimension definitions and value options
 */

import type { Dimension, DimensionValues } from '../types';

/**
 * Metadata dimensions - 11 dimensions across 4 groups
 */
export const METADATA_DIMS: Dimension[] = [
    { id: 'dt', name: '日期', group: '时间', description: '统计日期', isCore: true },
    { id: 'city', name: '城市', group: '地域', description: '订单所属运营城市', isCore: true },
    { id: 'supplier', name: '供应商', group: '业务', description: '供应商名称', isCore: false },
    { id: 'product_type', name: '产品线', group: '业务', description: '业务产品线', isCore: false },
    { id: 'service_type', name: '服务类型', group: '业务', description: '服务类型', isCore: true },
    { id: 'jkc_type', name: 'JKC内外部', group: '业务', description: '内部/外部订单', isCore: true },
    { id: 'cancel_type', name: '取消类型', group: '订单', description: '取消原因分类', isCore: false },
    { id: 'cancel_stage', name: '取消阶段', group: '订单', description: '取消发生的阶段', isCore: false },
    { id: 'vehicle_usage', name: '车辆用途', group: '车辆', description: '车辆使用类型', isCore: false },
    { id: 'asset_type', name: '资产性质', group: '车辆', description: '资产归属类型', isCore: false },
];

/**
 * Dimension value options for each dimension
 */
export const DIMENSION_VALUES: DimensionValues = {
    city: ['北京市', '广州市', '宿迁市'],
    supplier: ['小马', '文远'],
    product_type: ['PL01', 'PL02'],
    service_type: ['快车', '专车', '轻享'],
    jkc_type: ['内部', '外部'],
    cancel_type: ['乘客取消', '司机取消', '系统取消'],
    cancel_stage: ['应答前', '接驾中', '上车后'],
    vehicle_usage: ['商业运营', '测试用车', '展示用车'],
    asset_type: ['自有资产', '租赁资产', '合作方资产'],
};

/**
 * Date presets for quick selection
 */
export const DATE_PRESETS = [
    { id: 'last7', name: '近7天', days: 7 },
    { id: 'last14', name: '近14天', days: 14 },
    { id: 'last30', name: '近30天', days: 30 },
    { id: 'last90', name: '近90天', days: 90 },
];

/**
 * Time granularity options
 */
export const TIME_GRANULARITIES = [
    { id: 'hour', name: '小时' },
    { id: 'day', name: '日' },
    { id: 'week', name: '周' },
    { id: 'month', name: '月' }
] as const;

/**
 * Chart color palette
 */
export const CHART_COLORS = [
    '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];
