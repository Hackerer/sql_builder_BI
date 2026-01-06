/**
 * Metrics Data Module
 * Contains initial metrics definitions and label groups
 */

import type { Metric, LabelGroup } from '../types';

/**
 * Initial metrics data - 17 metrics across 6 domains
 */
export const INITIAL_METRICS: Metric[] = [
    // 订单主题
    {
        id: 'call_qty',
        name: '呼单量',
        group: '订单',
        subGroup: '订单漏斗',
        unit: '单',
        aggr: 'SUM',
        tags: ['core', 'realtime'],
        compatibleDims: ['dt', 'city', 'service_type', 'jkc_type'],
        compatibleGranularities: ['hour', 'day', 'week', 'month'],
        description: '用户点击立即呼叫后，后端生成订单的订单数',
        owner: '履约数据团队',
        contactPerson: '张三',
        metricType: 'atomic',
        labels: [
            { text: 'KPI', color: 'blue' },
            { text: '日报', color: 'green' },
        ],
        updateFrequency: '实时',
        isStarred: true
    },
    {
        id: 'resp_qty',
        name: '应答单量',
        group: '订单',
        subGroup: '订单漏斗',
        unit: '单',
        aggr: 'SUM',
        tags: ['core', 'realtime'],
        compatibleDims: ['dt', 'city', 'supplier', 'product_type', 'service_type', 'jkc_type'],
        compatibleGranularities: ['hour', 'day', 'week', 'month'],
        description: '用户呼单后，有车应答的订单数',
        owner: '履约数据团队',
        contactPerson: '李四',
        metricType: 'atomic',
        labels: [
            { text: 'KPI', color: 'blue' },
            { text: '周报', color: 'purple' },
        ],
        updateFrequency: '实时',
        isStarred: true
    },
    {
        id: 'pickup_qty',
        name: '接驾单量',
        group: '订单',
        subGroup: '订单漏斗',
        unit: '单',
        aggr: 'SUM',
        tags: ['core', 'realtime'],
        compatibleDims: ['dt', 'city', 'supplier', 'product_type', 'service_type', 'jkc_type'],
        compatibleGranularities: ['hour', 'day', 'week', 'month'],
        description: '到达上车点（完成接驾）的订单数',
        owner: '履约数据团队',
        contactPerson: '王五',
        metricType: 'atomic',
        labels: [
            { text: '体验', color: 'orange' },
        ],
        updateFrequency: '实时',
        isStarred: false
    },
    {
        id: 'board_qty',
        name: '上车单量',
        group: '订单',
        subGroup: '订单漏斗',
        unit: '单',
        aggr: 'SUM',
        tags: ['core', 'realtime'],
        compatibleDims: ['dt', 'city', 'supplier', 'product_type', 'service_type', 'jkc_type'],
        compatibleGranularities: ['hour', 'day', 'week', 'month'],
        description: '车门解锁成功的订单数',
        owner: '履约数据团队',
        contactPerson: '赵六',
        metricType: 'atomic',
        labels: [],
        updateFrequency: '实时',
        isStarred: false
    },
    {
        id: 'depart_qty',
        name: '启程单量',
        group: '订单',
        subGroup: '订单漏斗',
        unit: '单',
        aggr: 'SUM',
        tags: ['core', 'realtime'],
        compatibleDims: ['dt', 'city', 'supplier', 'product_type', 'service_type', 'jkc_type'],
        compatibleGranularities: ['hour', 'day', 'week', 'month'],
        description: '开始送驾的订单数',
        owner: '履约数据团队',
        updateFrequency: '实时',
        isStarred: false
    },
    {
        id: 'comp_qty',
        name: '完单量',
        group: '订单',
        subGroup: '订单漏斗',
        unit: '单',
        aggr: 'SUM',
        tags: ['core', 'realtime'],
        compatibleDims: ['dt', 'city', 'supplier', 'product_type', 'service_type', 'jkc_type'],
        compatibleGranularities: ['hour', 'day', 'week', 'month'],
        description: '行程结束的订单量',
        owner: '履约数据团队',
        updateFrequency: '实时',
        isStarred: true
    },
    {
        id: 'pay_qty',
        name: '支付单量',
        group: '订单',
        subGroup: '订单漏斗',
        unit: '单',
        aggr: 'SUM',
        tags: ['core', 'realtime'],
        compatibleDims: ['dt', 'city', 'supplier', 'product_type', 'service_type', 'jkc_type'],
        compatibleGranularities: ['hour', 'day', 'week', 'month'],
        description: '支付完成的订单量',
        owner: '履约数据团队',
        updateFrequency: '实时',
        isStarred: false
    },
    {
        id: 'cancel_qty',
        name: '取消量',
        group: '订单',
        subGroup: '订单取消',
        unit: '单',
        aggr: 'SUM',
        tags: ['core', 'realtime'],
        compatibleDims: ['dt', 'city', 'supplier', 'product_type', 'service_type', 'jkc_type', 'cancel_type', 'cancel_stage'],
        compatibleGranularities: ['hour', 'day', 'week', 'month'],
        description: '取消的订单量',
        owner: '履约数据团队',
        updateFrequency: '实时',
        isStarred: false
    },
    // 用户主题
    {
        id: 'call_user_cnt',
        name: '呼单用户数',
        group: '用户',
        subGroup: '用户漏斗',
        unit: '人',
        aggr: 'COUNT_DISTINCT',
        tags: ['core', 'user'],
        compatibleDims: ['dt', 'city', 'service_type', 'jkc_type'],
        compatibleGranularities: ['day', 'week', 'month'],
        description: '点击呼单的用户数（去重）',
        owner: '用户数据团队',
        updateFrequency: '实时',
        isStarred: true
    },
    {
        id: 'comp_user_cnt',
        name: '完单用户数',
        group: '用户',
        subGroup: '用户漏斗',
        unit: '人',
        aggr: 'COUNT_DISTINCT',
        tags: ['core', 'user'],
        compatibleDims: ['dt', 'city', 'supplier', 'product_type', 'service_type', 'jkc_type'],
        compatibleGranularities: ['day', 'week', 'month'],
        description: '行程结束的订单对应的用户数（去重）',
        owner: '用户数据团队',
        updateFrequency: '实时',
        isStarred: true
    },
    // 效率主题
    {
        id: 'resp_rate',
        name: '应答率',
        group: '效率',
        subGroup: '核心转化',
        unit: '%',
        aggr: 'CALC',
        tags: ['secondary', 'rate'],
        compatibleDims: ['dt', 'city', 'service_type', 'jkc_type'],
        compatibleGranularities: ['hour', 'day', 'week', 'month'],
        description: '应答单量与呼单量的比值',
        owner: '履约数据团队',
        updateFrequency: '实时',
        isStarred: true
    },
    {
        id: 'pickup_rate',
        name: '接驾率',
        group: '效率',
        subGroup: '核心转化',
        unit: '%',
        aggr: 'CALC',
        tags: ['secondary', 'rate'],
        compatibleDims: ['dt', 'city', 'supplier', 'product_type', 'service_type', 'jkc_type'],
        compatibleGranularities: ['hour', 'day', 'week', 'month'],
        description: '接驾单量与应答单量的比值',
        owner: '履约数据团队',
        updateFrequency: '实时',
        isStarred: false
    },
    {
        id: 'comp_rate',
        name: '呼单完单率',
        group: '效率',
        subGroup: '核心转化',
        unit: '%',
        aggr: 'CALC',
        tags: ['secondary', 'rate'],
        compatibleDims: ['dt', 'city', 'service_type', 'jkc_type'],
        compatibleGranularities: ['hour', 'day', 'week', 'month'],
        description: '完单量与呼单量的比值',
        owner: '履约数据团队',
        updateFrequency: '实时',
        isStarred: true
    },
    // 时长主题
    {
        id: 'avg_resp_time',
        name: '应答时长',
        group: '时长',
        subGroup: '时效体验',
        unit: '秒',
        aggr: 'AVG',
        tags: ['secondary', 'duration'],
        compatibleDims: ['dt', 'city', 'service_type', 'jkc_type'],
        compatibleGranularities: ['hour', 'day', 'week', 'month'],
        description: '应答时间 - 呼单时间（范围：有车应答的订单）',
        owner: '体验数据团队',
        updateFrequency: '实时',
        isStarred: false
    },
    {
        id: 'avg_pickup_time',
        name: '实际接驾时长',
        group: '时长',
        subGroup: '时效体验',
        unit: '秒',
        aggr: 'AVG',
        tags: ['secondary', 'duration'],
        compatibleDims: ['dt', 'city', 'supplier', 'product_type', 'service_type', 'jkc_type'],
        compatibleGranularities: ['hour', 'day', 'week', 'month'],
        description: 'T到达 - T应答（范围：接驾完成的订单）',
        owner: '体验数据团队',
        updateFrequency: '实时',
        isStarred: false
    },
    {
        id: 'extreme_good_rate',
        name: '极致体验率',
        group: '时长',
        subGroup: '体验指标',
        unit: '%',
        aggr: 'CALC',
        tags: ['secondary', 'experience'],
        compatibleDims: ['dt', 'city', 'supplier', 'product_type', 'service_type', 'jkc_type'],
        compatibleGranularities: ['day', 'week', 'month'],
        description: '极致体验订单占比',
        owner: '体验数据团队',
        updateFrequency: 'T+1',
        isStarred: false
    },
    // 车辆主题
    {
        id: 'vehicle_cnt',
        name: '上线车辆数',
        group: '车辆',
        subGroup: '车辆运营',
        unit: '辆',
        aggr: 'COUNT_DISTINCT',
        tags: ['secondary', 'vehicle'],
        compatibleDims: ['dt', 'city', 'supplier', 'product_type', 'vehicle_usage', 'asset_type'],
        compatibleGranularities: ['day', 'week', 'month'],
        description: '当日至少上线1小时的车辆数',
        owner: '供应链数据团队',
        updateFrequency: 'T+1',
        isStarred: false
    },
    {
        id: 'vehicle_online_hours',
        name: '上线时长',
        group: '车辆',
        subGroup: '车辆运营',
        unit: '小时',
        aggr: 'SUM',
        tags: ['secondary', 'vehicle'],
        compatibleDims: ['dt', 'city', 'supplier', 'product_type', 'vehicle_usage', 'asset_type'],
        compatibleGranularities: ['day', 'week', 'month'],
        description: '车辆上线运营时长',
        owner: '供应链数据团队',
        updateFrequency: 'T+1',
        isStarred: false
    }
];

/**
 * Label groups for metric filtering
 */
export const LABEL_GROUPS: LabelGroup[] = [
    {
        id: 'priority',
        name: '核心指标',
        options: [
            { id: 'core', name: '核心', color: 'text-blue-600 bg-blue-50 border-blue-200' },
            { id: 'secondary', name: '次要', color: 'text-gray-600 bg-gray-50 border-gray-200' },
        ]
    },
    {
        id: 'source',
        name: '数据层级',
        options: [
            { id: 'DWS', name: 'DWS', color: 'text-green-600 bg-green-50 border-green-200' },
            { id: 'ADS', name: 'ADS', color: 'text-amber-600 bg-amber-50 border-amber-200' },
            { id: 'DWD', name: 'DWD', color: 'text-purple-600 bg-purple-50 border-purple-200' },
        ]
    },
    {
        id: 'frequency',
        name: '更新频率',
        options: [
            { id: 'realtime', name: '实时', color: 'text-orange-600 bg-orange-50 border-orange-200' },
            { id: 'T+1', name: 'T+1', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
        ]
    }
];

/**
 * Available tags for metric configuration
 */
export const AVAILABLE_TAGS = [
    'core', 'secondary',
    'realtime', 'T+1',
    'DWS', 'ADS', 'DWD',
    'supply_chain', 'financial', 'experience', 'kpi', 'derived',
    'user', 'rate', 'duration', 'vehicle'
];

/**
 * Metric groups for category selection
 */
export const METRIC_GROUPS = ['订单', '用户', '效率', '时长', '车辆'];
