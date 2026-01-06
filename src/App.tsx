import React, { useState, useMemo } from 'react';
import {
    BarChart3,
    Calendar,
    ChevronRight,
    Download,
    GitCompare,
    LayoutDashboard,
    LogOut,
    PieChart,
    RefreshCcw,
    RotateCcw,
    Search,
    Settings,
    Table as TableIcon,
    TrendingUp,
    Zap,
    AlertCircle,
    Info,
    Star,
    Plus,
    Bell,
    Sun,
    Moon,
    Filter,
    MoreHorizontal,
    Share2,
    Layers,
    X,
    ChevronDown,
    Clock
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    ResponsiveContainer,
    AreaChart as RechartsAreaChart,
    Area,
    BarChart as RechartsBarChart,
    Bar,
    Legend
} from 'recharts';
import { cn } from './lib/utils';
import { format, subDays, startOfWeek, endOfWeek, parseISO, startOfMonth, formatISO, subHours, subWeeks, subMonths, getWeekOfMonth } from 'date-fns';
import MetricSelectorModal from './MetricSelectorModal';
import MetricConfigPage from './MetricConfigPage';
import { MOCK_DATA } from './data/mockGenerator';
import {
    Metric as MetricType,
    QueryFilter,
    ComparisonType,
    TimeGranularity
} from './types';
import ComparisonSelector from './components/analysis/ComparisonSelector';
import {
    getValidComparisonTypes,
    getComparisonLabel,
    calculateAdvancedComparisonRange
} from './lib/comparison';

// --- Semantic Data Definitions (Based on Real Business Data) ---
const INITIAL_METRICS: MetricType[] = [
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
        description: '用户点击立即呼叫后，后端生成订单的订单数',
        owner: '履约数据团队',
        updateFrequency: '实时',
        isStarred: true,
        compatibleGranularities: ['hour', 'day', 'week', 'month']
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
        description: '用户呼单后，有车应答的订单数',
        owner: '履约数据团队',
        updateFrequency: '实时',
        isStarred: true,
        compatibleGranularities: ['hour', 'day', 'week', 'month']
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
        description: '到达上车点（完成接驾）的订单数',
        owner: '履约数据团队',
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
        description: '车门解锁成功的订单数',
        owner: '履约数据团队',
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
        description: '车辆抵达接驾点的实际接驾时长',
        owner: '体验数据团队',
        updateFrequency: '实时',
        isStarred: false
    },
    // 体验主题
    {
        id: 'cancel_rate',
        name: '取消率',
        group: '体验',
        subGroup: '用户体验',
        unit: '%',
        aggr: 'CALC',
        tags: ['secondary', 'rate'],
        compatibleDims: ['dt', 'city', 'service_type', 'jkc_type'],
        description: '取消订单量/呼单量',
        owner: '体验数据团队',
        updateFrequency: '实时',
        isStarred: false
    },
    {
        id: 'extreme_good_rate',
        name: '极致体验率',
        group: '体验',
        subGroup: '用户体验',
        unit: '%',
        aggr: 'CALC',
        tags: ['secondary', 'rate'],
        compatibleDims: ['dt', 'city', 'supplier', 'product_type', 'service_type', 'jkc_type'],
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
        description: '上线进入过商业状态的运营车辆数',
        owner: '供应链数据团队',
        updateFrequency: 'T+1',
        isStarred: false
    },
    {
        id: 'vehicle_online_hours',
        name: '车辆上线时长',
        group: '车辆',
        subGroup: '车辆运营',
        unit: '小时',
        aggr: 'SUM',
        tags: ['secondary', 'vehicle'],
        compatibleDims: ['dt', 'city', 'supplier', 'product_type', 'vehicle_usage', 'asset_type'],
        description: '车辆上线运营时长',
        owner: '供应链数据团队',
        updateFrequency: 'T+1',
        isStarred: false
    }
];

const METADATA_DIMS = [
    { id: 'dt', name: '日期', group: '时间', description: '统计日期', isCore: true },
    { id: 'city', name: '城市', group: '地域', description: '订单所属运营城市', isCore: true },
    { id: 'supplier', name: '供应商', group: '供应链', description: '供应商名称', isCore: false },
    { id: 'product_type', name: '服务产品类型', group: '业务', description: '五座/四座/三座商务车', isCore: false },
    { id: 'service_type', name: '服务类型', group: '业务', description: '普通出行/接送机/接送站', isCore: true },
    { id: 'jkc_type', name: 'JKC内外部', group: '业务', description: '内部员工/外部员工', isCore: false },
    { id: 'cancel_type', name: '取消类型', group: '业务', description: '取消原因分类', isCore: false },
    { id: 'cancel_stage', name: '取消阶段', group: '业务', description: '取消发生阶段', isCore: false },
    { id: 'vehicle_usage', name: '车辆用途', group: '车辆', description: '车辆用途类型', isCore: false },
    { id: 'asset_type', name: '资产性质', group: '车辆', description: '资产归属类型', isCore: false },
];


// --- Dimension Value Options (Based on Real Data) ---
const DIMENSION_VALUES: Record<string, string[]> = {
    city: ['北京市', '广州市', '宿迁市'],
    supplier: ['小马', '文远'],
    product_type: ['五座商务车', '四座商务车', '三座商务车'],
    service_type: ['普通出行', '接送机', '接送站'],
    jkc_type: ['内部员工', '外部员工'],
    cancel_type: ['用户取消', '司机取消', '系统取消'],
    cancel_stage: ['应答前', '接驾中', '上车后'],
    vehicle_usage: ['商业运营', '测试用车', '展示用车'],
    asset_type: ['自有资产', '租赁资产', '合作方资产'],
};

// --- Constants ---
const CHART_COLORS = [
    '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const TIME_GRANULARITIES = [
    { id: 'hour', name: '小时' },
    { id: 'day', name: '日' },
    { id: 'week', name: '周' },
    { id: 'month', name: '月' }
] as const;


export default function App() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [activeMode, setActiveMode] = useState('trend');
    const [currentView, setCurrentView] = useState<'analysis' | 'config'>('analysis');
    const [metricsMetadata, setMetricsMetadata] = useState<MetricType[]>(INITIAL_METRICS);

    // --- Date Range State ---
    const [dateRange, setDateRange] = useState<{
        startDate: Date;
        endDate: Date;
        preset: string;
    }>({
        startDate: subDays(new Date(), 7),
        endDate: new Date(),
        preset: 'last7'
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // --- Time Granularity State (must be before comparison handlers) ---
    const [timeGranularity, setTimeGranularity] = useState<'hour' | 'day' | 'week' | 'month'>('day');

    // --- Advanced Comparison State ---
    const [comparisonType, setComparisonType] = useState<ComparisonType>('none');
    const [showComparisonInChart, setShowComparisonInChart] = useState(true);
    const [showComparisonInTable, setShowComparisonInTable] = useState(true);

    // Calculated comparison date range (derived from type & current range)
    const [comparisonDateRange, setComparisonDateRange] = useState<{
        startDate: Date;
        endDate: Date;
    } | null>(null);

    // Date presets
    const DATE_PRESETS = [
        { id: 'last7', name: '近7天', days: 7 },
        { id: 'last14', name: '近14天', days: 14 },
        { id: 'last30', name: '近30天', days: 30 },
        { id: 'last90', name: '近90天', days: 90 },
    ];

    // Helper: Handle Compatibility when Granularity Changes (Smart Fallback)
    const handleGranularityChange = (g: TimeGranularity) => {
        setTimeGranularity(g);

        // Smart Fallback Logic for Comparison
        if (comparisonType !== 'none') {
            const validTypes = getValidComparisonTypes(g);
            if (!validTypes.includes(comparisonType)) {
                // If current type is invalid for new granularity
                // Try to find a fallback?
                // E.g., 'day' (DoD) is valid for Hour, but not Week.
                if (validTypes.includes('period')) {
                    handleComparisonTypeChange('period', g);
                } else {
                    handleComparisonTypeChange('none', g);
                }
            } else {
                // Type is still valid, but range needs recalculation (different logic?)
                handleComparisonTypeChange(comparisonType, g);
            }
        }
    };

    // Helper: Handle Comparison Type Change
    const handleComparisonTypeChange = (type: ComparisonType, granOverride?: TimeGranularity) => {
        setComparisonType(type);
        const gran = granOverride || timeGranularity;

        if (type === 'none') {
            setComparisonDateRange(null);
        } else {
            const range = calculateAdvancedComparisonRange(dateRange, gran, type);
            setComparisonDateRange(range);
        }
    };

    // Effect: Update comparison range when Date Range changes
    React.useEffect(() => {
        if (comparisonType !== 'none') {
            const range = calculateAdvancedComparisonRange(dateRange, timeGranularity, comparisonType);
            setComparisonDateRange(range);
        }
    }, [dateRange, timeGranularity]);

    // Apply date preset
    const applyDatePreset = (presetId: string) => {
        const preset = DATE_PRESETS.find(p => p.id === presetId);
        if (preset) {
            const newRange = {
                startDate: subDays(new Date(), preset.days),
                endDate: new Date(),
                preset: presetId
            };
            setDateRange(newRange);
            // Update comparison range if comparison is active
            if (comparisonType !== 'none') {
                const newComparisonRange = calculateAdvancedComparisonRange(newRange, timeGranularity, comparisonType);
                setComparisonDateRange(newComparisonRange);
            }
        }
    };

    // Format date for display
    const formatDateRange = () => {
        const preset = DATE_PRESETS.find(p => p.id === dateRange.preset);
        if (preset) return preset.name;
        return `${format(dateRange.startDate, 'yyyy-MM-dd')} 至 ${format(dateRange.endDate, 'yyyy-MM-dd')}`;
    };

    // --- Multi-dimensional Analysis State ---
    const [query, setQuery] = useState<{
        dims: string[];
        metrics: string[];
        filters: QueryFilter[];
    }>({
        dims: ['dt'],
        metrics: ['call_qty', 'resp_qty'],
        filters: []
    });

    // --- Metric Selection State (Pool vs Active) ---
    // selectedMetricPool: Metrics visible in the dashboard cards
    // query.metrics: Metrics actually used in the query (Active)
    const [selectedMetricPool, setSelectedMetricPool] = useState<string[]>(['call_qty', 'resp_qty']);

    const [showCompare, setShowCompare] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);


    // --- Filter Builder State ---
    const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
    const [newFilterDim, setNewFilterDim] = useState<string>('');
    const [newFilterOperator, setNewFilterOperator] = useState<'IN' | 'NOT_IN'>('IN');
    const [newFilterValues, setNewFilterValues] = useState<string[]>([]);

    // --- Hour Filter State (Advanced) ---
    const [isHourFilterOpen, setIsHourFilterOpen] = useState(false);
    const [hourFilter, setHourFilter] = useState<{
        mode: 'range' | 'select';
        ranges: { start: number; end: number }[];
        selectedHours: number[];
        enabled: boolean;
    }>({
        mode: 'range',
        ranges: [],
        selectedHours: [],
        enabled: false
    });

    // --- Chart & Table View State ---
    const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area');
    const [tableViewMode, setTableViewMode] = useState<'summary' | 'detail'>('detail');


    // --- Query Result State ---
    const [queryResult, setQueryResult] = useState<typeof MOCK_DATA>(MOCK_DATA);
    const [chartData, setChartData] = useState<any[]>([]);
    const [comparisonChartData, setComparisonChartData] = useState<any[]>([]);
    const [chartSeries, setChartSeries] = useState<any[]>([]);
    const [tableColumns, setTableColumns] = useState<{ key: string; header: string; type: 'dimension' | 'metric' | 'comparison' | 'rate'; align: 'left' | 'right'; description?: string }[]>([]);
    const [isQuerying, setIsQuerying] = useState(false);
    const [lastQueryInfo, setLastQueryInfo] = useState<string>('');

    // --- Visibility Control State ---
    const [seriesVisibility, setSeriesVisibility] = useState<Record<string, boolean>>({});
    const [showMoMInChart, setShowMoMInChart] = useState(false);
    const [showYoYInChart, setShowYoYInChart] = useState(false);

    // --- Table Display Control State ---
    const [showSummaryTable, setShowSummaryTable] = useState(true);
    const [showMoMColumn, setShowMoMColumn] = useState(false);
    const [showYoYColumn, setShowYoYColumn] = useState(false);

    // --- Helper: Get Cartesian Product of Dimension Values ---
    const getCartesianProduct = (data: typeof MOCK_DATA, dimensions: string[]): string[][] => {
        if (dimensions.length === 0) return [[]];

        const dimValueSets = dimensions.map(dim =>
            [...new Set(data.map(row => (row as any)[dim] as string))]
        );

        // Compute Cartesian product
        const cartesian = (arrays: string[][]): string[][] => {
            if (arrays.length === 0) return [[]];
            return arrays.reduce<string[][]>(
                (acc, arr) => acc.flatMap(combo => arr.map(val => [...combo, val])),
                [[]]
            );
        };

        return cartesian(dimValueSets);
    };

    // --- Reset Query Function ---
    const resetQuery = () => {
        // Reset Date Range (Default: Last 7 Days)
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        setDateRange({ startDate: start, endDate: end, preset: 'last7' });

        // Reset Granularity
        setTimeGranularity('day');

        // Reset Hour Filter
        setHourFilter({
            mode: 'range',
            ranges: [],
            selectedHours: [],
            enabled: false
        });

        // Reset Query Config
        setQuery({
            dims: ['dt', 'city'],
            metrics: ['call_qty'],
            filters: []
        });

        // Reset Metric Pool
        setSelectedMetricPool(['call_qty', 'resp_qty']);

        // Reset Comparison
        setComparisonType('none');
        setShowComparisonInChart(true);
        setShowComparisonInTable(true);
        setComparisonDateRange(null);
    };

    // --- Execute Query Function with Full Cartesian Product GROUP BY ---
    const executeQuery = () => {
        setIsQuerying(true);

        setTimeout(() => {
            // Helper: Check if an hour matches filter
            const isHourSelected = (h: number) => {
                if (!hourFilter.enabled) return true;
                if (hourFilter.mode === 'range') {
                    if (hourFilter.ranges.length === 0) return true;
                    return hourFilter.ranges.some(r => h >= r.start && h <= r.end);
                } else {
                    if (hourFilter.selectedHours.length === 0) return false;
                    return hourFilter.selectedHours.includes(h);
                }
            };

            // Step 1: Apply WHERE filters (Main Query)
            let filteredData = [...MOCK_DATA];

            // Step 1a: Filter by date range
            const startDateStr = format(dateRange.startDate, 'yyyy-MM-dd');
            const endDateStr = format(dateRange.endDate, 'yyyy-MM-dd');
            filteredData = filteredData.filter(row => {
                return row.dt >= startDateStr && row.dt <= endDateStr;
            });

            // Step 1b: Filter by hour (real filtering, not ratio scaling!)
            if (hourFilter.enabled) {
                filteredData = filteredData.filter(row => isHourSelected(row.hour));
            }

            // Step 1c: Apply dimension filters
            query.filters.forEach(filter => {
                const dimKey = filter.dimId;
                if (filter.operator === 'IN') {
                    filteredData = filteredData.filter(row =>
                        filter.values.includes((row as any)[dimKey])
                    );
                } else {
                    filteredData = filteredData.filter(row =>
                        !filter.values.includes((row as any)[dimKey])
                    );
                }
            });

            // Step 1d: Create Comparison Query (if comparison is active)
            let comparisonData: typeof MOCK_DATA = [];
            if (comparisonType !== 'none' && comparisonDateRange) {
                const compStartStr = format(comparisonDateRange.startDate, 'yyyy-MM-dd');
                const compEndStr = format(comparisonDateRange.endDate, 'yyyy-MM-dd');

                comparisonData = [...MOCK_DATA].filter(row => {
                    return row.dt >= compStartStr && row.dt <= compEndStr;
                });

                // Apply same hour filter
                if (hourFilter.enabled) {
                    comparisonData = comparisonData.filter(row => isHourSelected(row.hour));
                }

                // Apply same dimension filters
                query.filters.forEach(filter => {
                    const dimKey = filter.dimId;
                    if (filter.operator === 'IN') {
                        comparisonData = comparisonData.filter(row =>
                            filter.values.includes((row as any)[dimKey])
                        );
                    } else {
                        comparisonData = comparisonData.filter(row =>
                            !filter.values.includes((row as any)[dimKey])
                        );
                    }
                });
            }

            // Step 2: Get GROUP BY dimensions (excluding time)
            const groupByDims = query.dims.filter(d => d !== 'dt');
            const actualDimKeys = groupByDims;

            // Step 3: Compute Cartesian product of dimension values
            const cartesianCombos = getCartesianProduct(filteredData, actualDimKeys);

            // Step 4: Generate chart series
            const newChartSeries: any[] = [];

            if (cartesianCombos.length > 0 && cartesianCombos[0].length > 0) {
                // Generate series for each dimension combo × each metric
                cartesianCombos.forEach((combo, comboIdx) => {
                    const comboName = combo.join(' · ');
                    query.metrics.forEach((metricId, metricIdx) => {
                        const metric = metricsMetadata.find(m => m.id === metricId);
                        const metricName = metric?.name || metricId;
                        const seriesKey = `${combo.join('_')}_${metricId}`;

                        // Series name: "维度组合 - 指标名" when multiple metrics
                        const seriesName = query.metrics.length > 1
                            ? `${comboName || '合计'} - ${metricName}`
                            : comboName || '合计';

                        // Color: use combo color with metric variation
                        const baseColor = CHART_COLORS[comboIdx % CHART_COLORS.length];

                        newChartSeries.push({
                            key: seriesKey,
                            name: seriesName,
                            color: baseColor,
                            metricId: metricId,
                            comboIdx: comboIdx,
                            metricIdx: metricIdx
                        });
                    });
                });
            } else {
                // No dimension combinations - just metrics
                query.metrics.forEach((metricId, idx) => {
                    const metric = metricsMetadata.find(m => m.id === metricId);
                    newChartSeries.push({
                        key: metricId,
                        name: metric?.name || metricId,
                        color: CHART_COLORS[idx % CHART_COLORS.length],
                        metricId: metricId
                    });
                });
            }

            const limitedSeries = newChartSeries.slice(0, 20);
            const seriesLimited = newChartSeries.length > 20;

            // Step 5: Aggregate data based on Time Granularity
            let aggregatedChartData: any[] = [];
            let timeGroups: string[] = [];

            if (timeGranularity === 'hour') {
                // Hour: Aggregate by hour from real data
                const hourGroupedData = new Map<number, any[]>();
                const hourComparisonData = new Map<number, any[]>();

                filteredData.forEach(row => {
                    const h = row.hour;
                    if (!hourGroupedData.has(h)) hourGroupedData.set(h, []);
                    hourGroupedData.get(h)?.push(row);
                });

                comparisonData.forEach(row => {
                    const h = row.hour;
                    if (!hourComparisonData.has(h)) hourComparisonData.set(h, []);
                    hourComparisonData.get(h)?.push(row);
                });

                // Generate time groups for hours present in data
                timeGroups = Array.from(hourGroupedData.keys())
                    .sort((a, b) => a - b)
                    .map(h => `${h}点`);

                aggregatedChartData = timeGroups.map(hourStr => {
                    const hour = parseInt(hourStr);
                    const groupRows = hourGroupedData.get(hour) || [];
                    const compRows = hourComparisonData.get(hour) || [];
                    const row: any = {
                        dt: hourStr,
                        // For hour granularity, comparison uses same hour labels
                        comparisonDt: hourStr
                    };

                    if (cartesianCombos.length > 0 && cartesianCombos[0].length > 0) {
                        cartesianCombos.slice(0, 20).forEach(combo => {
                            // Aggregate main data for matching dimension combo
                            const matchingRows = groupRows.filter(r =>
                                actualDimKeys.every((dimKey, i) => (r as any)[dimKey] === combo[i])
                            );
                            const matchingCompRows = compRows.filter(r =>
                                actualDimKeys.every((dimKey, i) => (r as any)[dimKey] === combo[i])
                            );

                            // Aggregate ALL metrics for this combo
                            query.metrics.forEach(metricId => {
                                const seriesKey = `${combo.join('_')}_${metricId}`;
                                const sum = matchingRows.reduce((acc, r) => acc + ((r as any)[metricId] || 0), 0);
                                row[seriesKey] = sum;

                                // Aggregate Comparison Data
                                if (comparisonType !== 'none' && compRows.length > 0) {
                                    const compSum = matchingCompRows.reduce((acc, r) => acc + ((r as any)[metricId] || 0), 0);
                                    row[`${seriesKey}_comp`] = compSum;
                                    row[`${seriesKey}_rate`] = compSum > 0 ? ((sum - compSum) / compSum) * 100 : 0;
                                }
                            });
                        });
                    } else {
                        query.metrics.forEach(metricId => {
                            // Aggregate all rows for this hour
                            const sum = groupRows.reduce((acc, r) => acc + ((r as any)[metricId] || 0), 0);
                            row[metricId] = sum;

                            // Aggregate Comparison Data
                            if (comparisonType !== 'none' && compRows.length > 0) {
                                const compSum = compRows.reduce((acc, r) => acc + ((r as any)[metricId] || 0), 0);
                                row[`${metricId}_comp`] = compSum;
                                row[`${metricId}_rate`] = compSum > 0 ? ((sum - compSum) / compSum) * 100 : 0;
                            }
                        });
                    }
                    return row;
                });

            } else {
                // Day, Week, Month - aggregate from pre-filtered data (hours already filtered)
                const groupByTime = (dateStr: string) => {
                    if (timeGranularity === 'day') return dateStr;
                    const date = new Date(dateStr);
                    if (timeGranularity === 'week') {
                        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
                        return `${format(weekStart, 'MM-dd')}周`;
                    }
                    if (timeGranularity === 'month') {
                        return format(date, 'yyyy-MM');
                    }
                    return dateStr;
                };

                // Group main data
                const groupedData = new Map<string, any[]>();
                filteredData.forEach(row => {
                    const timeKey = groupByTime(row.dt);
                    if (!groupedData.has(timeKey)) groupedData.set(timeKey, []);
                    groupedData.get(timeKey)?.push(row);
                });

                // Group comparison data
                const groupedCompData = new Map<string, any[]>();
                comparisonData.forEach(row => {
                    const timeKey = groupByTime(row.dt);
                    if (!groupedCompData.has(timeKey)) groupedCompData.set(timeKey, []);
                    groupedCompData.get(timeKey)?.push(row);
                });

                // Create index mapping for comparison (main time[i] -> comp time[i])
                const compTimeGroups = Array.from(groupedCompData.keys()).sort();

                timeGroups = Array.from(groupedData.keys()).sort();
                aggregatedChartData = timeGroups.map((timeKey, idx) => {
                    const groupRows = groupedData.get(timeKey) || [];
                    const compTimeKey = compTimeGroups[idx]; // Same index mapping
                    const compRows = compTimeKey ? (groupedCompData.get(compTimeKey) || []) : [];
                    const row: any = {
                        dt: timeKey,
                        // Add comparison date for dual X-axis
                        comparisonDt: compTimeKey || ''
                    };

                    if (cartesianCombos.length > 0 && cartesianCombos[0].length > 0) {
                        cartesianCombos.slice(0, 20).forEach(combo => {
                            const matchingRows = groupRows.filter(r =>
                                actualDimKeys.every((dimKey, i) => (r as any)[dimKey] === combo[i])
                            );
                            const matchingCompRows = compRows.filter(r =>
                                actualDimKeys.every((dimKey, i) => (r as any)[dimKey] === combo[i])
                            );

                            // Aggregate ALL metrics for this combo
                            query.metrics.forEach(metricId => {
                                const sum = matchingRows.reduce((acc, r) => acc + ((r as any)[metricId] || 0), 0);
                                const seriesKey = `${combo.join('_')}_${metricId}`;
                                row[seriesKey] = sum;

                                // Real Comparison Data from comparisonData
                                if (comparisonType !== 'none' && compRows.length > 0) {
                                    const compSum = matchingCompRows.reduce((acc, r) => acc + ((r as any)[metricId] || 0), 0);
                                    row[`${seriesKey}_comp`] = compSum;
                                    row[`${seriesKey}_rate`] = compSum > 0 ? ((sum - compSum) / compSum) * 100 : 0;
                                }
                            });
                        });
                    } else {
                        query.metrics.forEach(metricId => {
                            const sum = groupRows.reduce((acc, r) => acc + ((r as any)[metricId] || 0), 0);
                            row[metricId] = sum;

                            // Real Comparison Data from comparisonData
                            if (comparisonType !== 'none' && compRows.length > 0) {
                                const compSum = compRows.reduce((acc, r) => acc + ((r as any)[metricId] || 0), 0);
                                row[`${metricId}_comp`] = compSum;
                                row[`${metricId}_rate`] = compSum > 0 ? ((sum - compSum) / compSum) * 100 : 0;
                            }
                        });
                    }
                    return row;
                });
            }

            // Update query result for table view to use aggregated data
            const displayData = aggregatedChartData;


            // Step 6: Generate dynamic table columns based on Granularity
            let timeHeader = '日期';
            if (timeGranularity === 'hour') timeHeader = '小时';
            if (timeGranularity === 'week') timeHeader = '周';
            if (timeGranularity === 'month') timeHeader = '月份';

            const newTableColumns: typeof tableColumns = [
                { key: 'dt', header: timeHeader, type: 'dimension', align: 'left' }
            ];

            // Add dimension columns
            groupByDims.forEach(dimId => {
                const dim = METADATA_DIMS.find(d => d.id === dimId);
                newTableColumns.push({
                    key: dimId,
                    header: dim?.name || dimId,
                    type: 'dimension',
                    align: 'left'
                });
            });

            // Add metric columns with comparison
            query.metrics.forEach(metricId => {
                const metric = metricsMetadata.find(m => m.id === metricId);
                newTableColumns.push({
                    key: metricId,
                    header: metric?.name || metricId,
                    type: 'metric',
                    align: 'right',
                    description: metric?.description
                });

                // Add Comparison Columns
                if (comparisonType !== 'none') {
                    const compLabel = getComparisonLabel(comparisonType, timeGranularity);

                    // Comparison Values
                    newTableColumns.push({
                        key: `${metricId}_comp`,
                        header: `${compLabel.split(' ')[0]}数值`,
                        type: 'metric',
                        align: 'right'
                    });

                    // Comparison Rate
                    newTableColumns.push({
                        key: `${metricId}_rate`,
                        header: `${compLabel.split(' ')[0]}`,
                        type: 'rate',
                        align: 'right'
                    });
                }
            });

            // This ensures table matches chart granularity
            setQueryResult(displayData as any);

            // Generate chart data
            const finalChartData = aggregatedChartData;

            setChartData(finalChartData);
            setChartSeries(limitedSeries);
            setTableColumns(newTableColumns);

            // Build Query Info String
            const metricNames = query.metrics.map(m =>
                metricsMetadata.find(metric => metric.id === m)?.name || m
            ).join('、');
            const dimNames = query.dims.map(d =>
                METADATA_DIMS.find(dim => dim.id === d)?.name || d
            ).join(' + ');

            let filterInfo = '';
            if (query.filters.length > 0) {
                filterInfo = ' | 筛选: ' + query.filters.length + '个条件';
            }
            if (hourFilter.enabled) {
                const hourText = hourFilter.mode === 'range'
                    ? hourFilter.ranges.map(r => `${r.start}-${r.end}点`).join(',')
                    : hourFilter.selectedHours.length + '个时段';
                filterInfo += ` | 小时: ${hourText}`;
            }

            const granularityName = TIME_GRANULARITIES.find(g => g.id === timeGranularity)?.name || timeGranularity;
            const info = `${format(dateRange.startDate, 'yyyy-MM-dd')} 至 ${format(dateRange.endDate, 'yyyy-MM-dd')} | 按${granularityName}统计 | 指标: ${metricNames} | 维度: ${dimNames || '无'}${filterInfo}`;

            setLastQueryInfo(info);
            setIsQuerying(false);
        }, 300);
    };



    // --- Semantic Validation Logic ---
    const isDimDisabled = (dimId: string): boolean => {
        if (query.metrics.length === 0) return false;
        // 如果当前已选的任何指标不支持该维度,则禁用
        return query.metrics.some(metricId => {
            const metric = metricsMetadata.find(m => m.id === metricId);
            return metric && !metric.compatibleDims.includes(dimId);
        });
    };

    const getDimIncompatibleReason = (dimId: string): string => {
        if (query.metrics.length === 0) return '';
        const incompatibleMetrics = query.metrics.filter(metricId => {
            const metric = metricsMetadata.find(m => m.id === metricId);
            return metric && !metric.compatibleDims.includes(dimId);
        });
        if (incompatibleMetrics.length === 0) return '';
        const metricNames = incompatibleMetrics
            .map(id => metricsMetadata.find(m => m.id === id)?.name)
            .join('、');
        return `指标"${metricNames}"不支持此维度`;
    };

    const isMetricDisabled = (metricId: string): boolean => {
        if (query.dims.length === 0) return false;
        const metric = metricsMetadata.find(m => m.id === metricId);
        if (!metric) return false;
        // 如果当前已选的任何维度不在该指标的兼容列表中,则禁用
        return query.dims.some(dimId => !metric.compatibleDims.includes(dimId));
    };

    const getIncompatibleReason = (metricId: string): string => {
        const metric = metricsMetadata.find(m => m.id === metricId);
        if (!metric) return '';
        const incompatibleDims = query.dims.filter(dimId => !metric.compatibleDims.includes(dimId));
        if (incompatibleDims.length === 0) return '';
        const dimNames = incompatibleDims.map(id => METADATA_DIMS.find(d => d.id === id)?.name).join('、');
        return `不支持维度: ${dimNames}`;
    };

    // --- Calculate Available Metrics ---
    const availableMetrics = useMemo(() => {
        if (query.dims.length === 0) return undefined;
        return metricsMetadata
            .filter(m => query.dims.every(dimId => m.compatibleDims.includes(dimId)))
            .map(m => m.id);
    }, [query.dims, metricsMetadata]);

    // --- Handlers ---
    const toggleDim = (id: string) => {
        if (isDimDisabled(id)) return;
        setQuery(prev => ({
            ...prev,
            dims: prev.dims.includes(id)
                ? prev.dims.filter(d => d !== id)
                : [...prev.dims, id]
        }));
    };

    // Toggle metric visibility (Active/Inactive in chart)
    const toggleMetricActive = (id: string) => {
        setQuery(prev => {
            if (prev.metrics.includes(id)) {
                return { ...prev, metrics: prev.metrics.filter(m => m !== id) };
            } else {
                return { ...prev, metrics: [...prev.metrics, id] };
            }
        });
    };

    // Remove metric from pool (Delete card)
    const removeMetricFromPool = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedMetricPool(prev => prev.filter(m => m !== id));
        // Also remove from active query if present
        setQuery(prev => ({ ...prev, metrics: prev.metrics.filter(m => m !== id) }));
    };

    // --- Filter Management ---
    const addFilter = () => {
        if (!newFilterDim || newFilterValues.length === 0) return;

        const newFilter: QueryFilter = {
            id: `filter_${Date.now()}`,
            dimId: newFilterDim,
            operator: newFilterOperator,
            values: newFilterValues
        };

        setQuery(prev => ({
            ...prev,
            filters: [...prev.filters, newFilter]
        }));

        resetFilterBuilder();
    };

    const removeFilter = (filterId: string) => {
        setQuery(prev => ({
            ...prev,
            filters: prev.filters.filter(f => f.id !== filterId)
        }));
    };

    const resetFilterBuilder = () => {
        setIsFilterBuilderOpen(false);
        setNewFilterDim('');
        setNewFilterOperator('IN');
        setNewFilterValues([]);
    };

    const toggleFilterValue = (value: string) => {
        setNewFilterValues(prev =>
            prev.includes(value)
                ? prev.filter(v => v !== value)
                : [...prev, value]
        );
    };

    // Get dimension name by ID
    const getDimName = (dimId: string) => METADATA_DIMS.find(d => d.id === dimId)?.name || dimId;

    // If config view is active
    if (currentView === 'config') {
        return (
            <MetricConfigPage
                metrics={metricsMetadata}
                onUpdateMetrics={setMetricsMetadata}
                onBack={() => setCurrentView('analysis')}
            />
        );
    }

    return (
        <div className={cn("flex h-screen bg-background text-foreground overflow-hidden font-sans", isDarkMode && "dark")}>
            <div className="flex w-full h-full bg-background transition-colors duration-300">

                {/* Sidebar */}
                <aside className="w-60 glass-nav flex flex-col z-20 transition-all duration-300 border-r border-border">
                    <div className="p-6">
                        <div className="flex items-center gap-2 text-primary">
                            <Zap size={24} className="fill-primary" />
                            <span className="font-bold text-lg tracking-tight">萤火分析平台</span>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 space-y-1">
                        {['履约主题域', '车辆主题域', '营销主题域', '资产主题域'].map((item, idx) => (
                            <button
                                key={item}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                                    idx === 0
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <LayoutDashboard size={16} />
                                    {item}
                                </div>
                                {idx === 0 && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                            </button>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-border mt-auto">
                        <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/20 border border-border">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">A</div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-bold truncate">Alex Chen</p>
                                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">Senior Analyst</p>
                            </div>
                            <button className="text-muted-foreground hover:text-destructive transition-colors">
                                <LogOut size={14} />
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Header */}
                    <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-background/50 backdrop-blur-md z-10">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">首页</span>
                            <ChevronRight size={14} className="text-muted-foreground" />
                            <span className="text-sm font-medium">自助BI分析</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setCurrentView('config')}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary/80 rounded-full transition-all"
                                title="指标配置"
                            >
                                <Settings size={20} />
                            </button>
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                title={isDarkMode ? "切换至浅色模式" : "切换至深色模式"}
                            >
                                {isDarkMode ? <RefreshCcw size={18} /> : <Moon size={18} />}
                            </button>
                            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors"><Search size={18} /></button>
                            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-full transition-all relative">
                                <Bell size={20} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
                            </button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {/* 1. Selector Area */}
                        <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                            <div className="grid grid-cols-12 gap-8">
                                {/* Dimensions */}
                                <div className="col-span-12 lg:col-span-5 space-y-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-base font-bold text-foreground">选择维度</label>
                                    </div>

                                    {/* Time Granularity - Single Select */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1 rounded bg-primary/10 text-primary"><Calendar size={14} /></div>
                                        <span className="text-sm font-bold text-foreground/80">统计周期</span>
                                        <span className="text-[11px] font-normal text-muted-foreground">(必选一项)</span>
                                    </div>
                                    <div className="inline-flex items-center bg-muted/30 p-1 rounded-xl border border-border">
                                        {TIME_GRANULARITIES.map(granularity => (
                                            <button
                                                key={granularity.id}
                                                onClick={() => handleGranularityChange(granularity.id)}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                                    timeGranularity === granularity.id
                                                        ? "bg-primary text-primary-foreground shadow-md"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                )}
                                            >
                                                {granularity.name}
                                            </button>

                                        ))}
                                    </div>

                                    {/* Other Dimensions - Multi Select */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1 rounded bg-secondary text-foreground/70"><Layers size={14} /></div>
                                            <span className="text-sm font-bold text-foreground/80">维度</span>
                                            <span className="text-[11px] font-normal text-muted-foreground">(支持多选)</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {METADATA_DIMS.filter(dim => dim.id !== 'dt').map(dim => {
                                                const disabled = isDimDisabled(dim.id);
                                                const incompatibleReason = disabled ? getDimIncompatibleReason(dim.id) : '';
                                                const enumValues = DIMENSION_VALUES[dim.id] || [];
                                                return (
                                                    <div key={dim.id} className="relative group">
                                                        <button
                                                            onClick={() => toggleDim(dim.id)}
                                                            disabled={disabled}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-lg text-sm border transition-all duration-200 flex items-center gap-2",
                                                                query.dims.includes(dim.id)
                                                                    ? "bg-primary text-primary-foreground border-primary shadow-md font-medium"
                                                                    : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
                                                                disabled && "opacity-40 cursor-not-allowed grayscale bg-muted"
                                                            )}
                                                        >
                                                            {dim.name}
                                                            {dim.isCore && !query.dims.includes(dim.id) && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" title="核心维度"></span>}
                                                        </button>
                                                        {/* Hover Tooltip */}
                                                        <div className="absolute left-0 top-full mt-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                                                            <div className="bg-popover border border-border rounded-xl shadow-2xl p-3 min-w-[220px] max-w-[300px]">
                                                                <div className="text-sm font-bold text-foreground mb-1">{dim.name}</div>
                                                                {dim.description && (
                                                                    <div className="text-xs text-muted-foreground mb-2">{dim.description}</div>
                                                                )}
                                                                {enumValues.length > 0 && (
                                                                    <div className="text-xs mb-2">
                                                                        <span className="text-muted-foreground">枚举值：</span>
                                                                        <span className="text-foreground">{enumValues.join('、')}</span>
                                                                    </div>
                                                                )}
                                                                {disabled && incompatibleReason && (
                                                                    <div className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded border border-destructive/20">
                                                                        ⚠️ {incompatibleReason}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="hidden lg:block w-px bg-border/50 mx-4"></div>

                                {/* Metrics */}
                                <div className="col-span-12 lg:col-span-6 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-base font-bold text-foreground">选择指标</label>
                                        <button
                                            onClick={() => setIsMetricModalOpen(true)}
                                            className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors flex items-center gap-1 font-medium"
                                        >
                                            <Plus size={12} /> 打开指标选择器
                                        </button>
                                    </div>

                                    {/* Selected Metrics Display - Tag Style */}
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMetricPool.map(metricId => {
                                            const metric = metricsMetadata.find(m => m.id === metricId);
                                            if (!metric) return null;
                                            const isActive = query.metrics.includes(metricId);
                                            const disabled = isMetricDisabled(metricId);
                                            const reason = disabled ? getIncompatibleReason(metricId) : '';

                                            return (
                                                <div key={metricId} className="relative group">
                                                    <button
                                                        onClick={() => !disabled && toggleMetricActive(metricId)}
                                                        disabled={disabled}
                                                        title={reason || metric.description}
                                                        className={cn(
                                                            "tag-selectable pr-7",
                                                            isActive && "tag-active",
                                                            disabled && "tag-disabled"
                                                        )}
                                                    >
                                                        {metric.displayName || metric.name}
                                                        {disabled && (
                                                            <AlertCircle size={10} className="ml-1 inline" />
                                                        )}
                                                    </button>
                                                    {/* Remove Button */}
                                                    <button
                                                        onClick={(e) => removeMetricFromPool(metricId, e)}
                                                        className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-muted/80 hover:bg-destructive/90 text-muted-foreground hover:text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                                                        title="移除指标"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                    {/* Hover Tooltip */}
                                                    <div className="absolute left-0 top-full mt-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                                                        <div className="bg-popover border border-border rounded-xl shadow-2xl p-4 min-w-[280px] max-w-[360px]">
                                                            <div className="text-sm font-bold text-foreground mb-2">{metric.displayName || metric.name}</div>
                                                            {metric.description && (
                                                                <div className="text-xs text-muted-foreground mb-3 pb-3 border-b border-border">{metric.description}</div>
                                                            )}
                                                            <div className="space-y-2 text-xs">
                                                                <div>
                                                                    <span className="text-muted-foreground">单位：</span>
                                                                    <span className="text-foreground">{metric.unit}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-muted-foreground">聚合方式：</span>
                                                                    <span className="text-foreground">{metric.aggr}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-muted-foreground">支持维度：</span>
                                                                    <span className="text-foreground">
                                                                        {metric.compatibleDims?.filter(d => d !== 'dt').map(d => METADATA_DIMS.find(dim => dim.id === d)?.name || d).join('、') || '全部'}
                                                                    </span>
                                                                </div>
                                                                {metric.owner && (
                                                                    <div>
                                                                        <span className="text-muted-foreground">负责人：</span>
                                                                        <span className="text-foreground">{metric.owner}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </section >


                        {/* Filter Conditions Section */}
                        <section className={cn("bg-card rounded-2xl border border-border shadow-sm", query.filters.length === 0 && !hourFilter.enabled && !isFilterBuilderOpen && !isHourFilterOpen ? "p-4" : "p-6")}>
                            <div className={cn("flex items-center justify-between", (query.filters.length > 0 || hourFilter.enabled || isFilterBuilderOpen || isHourFilterOpen) && "mb-4")}>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                        <Filter size={16} />
                                        筛选条件 (WHERE)
                                    </h3>
                                    {/* Hour Filter Display Tag */}
                                    {hourFilter.enabled && (
                                        <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-600 text-xs font-medium rounded-lg border border-purple-500/20">
                                            <Clock size={10} />
                                            {hourFilter.mode === 'range'
                                                ? hourFilter.ranges.map(r => `${r.start}-${r.end}时`).join(', ')
                                                : hourFilter.selectedHours.sort((a, b) => a - b).map(h => `${h}时`).join(', ')
                                            }
                                            <button
                                                onClick={() => {
                                                    setHourFilter(prev => ({ ...prev, enabled: false, ranges: [], selectedHours: [] }));
                                                    setIsHourFilterOpen(false);
                                                }}
                                                className="hover:text-destructive"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    )}
                                    {/* Dimension Filter Count Tag */}
                                    {query.filters.length > 0 && (
                                        <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-lg border border-primary/20">
                                            {query.filters.length} 个维度筛选
                                        </div>
                                    )}
                                    {/* Empty State */}
                                    {query.filters.length === 0 && !hourFilter.enabled && !isFilterBuilderOpen && !isHourFilterOpen && (
                                        <span className="text-xs text-muted-foreground italic">暂无筛选条件</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Date Range Button */}
                                    <div className="flex gap-2 items-center relative">
                                        <button
                                            onClick={() => setShowDatePicker(!showDatePicker)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors border border-primary/20"
                                        >
                                            <Calendar size={14} />
                                            {formatDateRange()}
                                            <ChevronDown size={12} className={cn("transition-transform", showDatePicker && "rotate-180")} />
                                        </button>
                                        {showDatePicker && (
                                            <div className="absolute top-full right-0 mt-2 z-50 bg-popover border border-border rounded-xl shadow-2xl p-4 min-w-[600px]">
                                                <div className="flex gap-6">
                                                    {/* Quick Presets */}
                                                    <div className="space-y-1 border-r border-border pr-4">
                                                        {DATE_PRESETS.map(preset => (
                                                            <button
                                                                key={preset.id}
                                                                onClick={() => {
                                                                    applyDatePreset(preset.id);
                                                                    setShowDatePicker(false);
                                                                }}
                                                                className={cn(
                                                                    "w-full px-4 py-2 text-left text-sm rounded-lg transition-colors",
                                                                    dateRange.preset === preset.id
                                                                        ? "bg-primary/10 text-primary font-medium"
                                                                        : "text-foreground hover:bg-muted"
                                                                )}
                                                            >
                                                                {preset.name}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Dual Calendar View */}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-4 px-2">
                                                            <input
                                                                type="text"
                                                                value={format(dateRange.startDate, 'yyyy-MM-dd')}
                                                                readOnly
                                                                className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-muted/30 text-foreground"
                                                            />
                                                            <span className="text-muted-foreground">→</span>
                                                            <input
                                                                type="text"
                                                                value={format(dateRange.endDate, 'yyyy-MM-dd')}
                                                                readOnly
                                                                className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-muted/30 text-foreground"
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            {/* Current Month Calendar */}
                                                            <div className="text-center">
                                                                <div className="font-medium text-sm mb-2">
                                                                    {format(dateRange.startDate, 'yyyy年 M月')}
                                                                </div>
                                                                <div className="grid grid-cols-7 gap-1 text-xs">
                                                                    {['一', '二', '三', '四', '五', '六', '日'].map(d => (
                                                                        <div key={d} className="h-8 flex items-center justify-center text-muted-foreground font-medium">{d}</div>
                                                                    ))}
                                                                    {Array.from({ length: 35 }, (_, i) => {
                                                                        const dayNum = i - 3;
                                                                        const isInRange = dayNum >= 1 && dayNum <= 31;
                                                                        const isSelected = dayNum >= 1 && dayNum <= 7;
                                                                        return (
                                                                            <div
                                                                                key={i}
                                                                                className={cn(
                                                                                    "h-8 flex items-center justify-center rounded-md cursor-pointer transition-colors",
                                                                                    !isInRange && "text-muted-foreground/30",
                                                                                    isInRange && "hover:bg-muted",
                                                                                    isSelected && isInRange && "bg-primary/10 text-primary"
                                                                                )}
                                                                            >
                                                                                {isInRange ? dayNum : ''}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {/* Next Month Calendar */}
                                                            <div className="text-center">
                                                                <div className="font-medium text-sm mb-2">
                                                                    {format(subDays(dateRange.endDate, -30), 'yyyy年 M月')}
                                                                </div>
                                                                <div className="grid grid-cols-7 gap-1 text-xs">
                                                                    {['一', '二', '三', '四', '五', '六', '日'].map(d => (
                                                                        <div key={d} className="h-8 flex items-center justify-center text-muted-foreground font-medium">{d}</div>
                                                                    ))}
                                                                    {Array.from({ length: 35 }, (_, i) => {
                                                                        const dayNum = i - 5;
                                                                        const isInRange = dayNum >= 1 && dayNum <= 28;
                                                                        return (
                                                                            <div
                                                                                key={i}
                                                                                className={cn(
                                                                                    "h-8 flex items-center justify-center rounded-md cursor-pointer transition-colors",
                                                                                    !isInRange && "text-muted-foreground/30",
                                                                                    isInRange && "hover:bg-muted"
                                                                                )}
                                                                            >
                                                                                {isInRange ? dayNum : ''}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
                                                            <button
                                                                onClick={() => setShowDatePicker(false)}
                                                                className="px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                                            >
                                                                取消
                                                            </button>
                                                            <button
                                                                onClick={() => setShowDatePicker(false)}
                                                                className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                                            >
                                                                确定
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Comparison Selector */}
                                    <ComparisonSelector
                                        granularity={timeGranularity}
                                        comparisonType={comparisonType}
                                        onTypeChange={(type) => handleComparisonTypeChange(type)}
                                        dateRange={dateRange}
                                    />

                                    <div className="w-px h-4 bg-border mx-1"></div>

                                    {/* Add Hour Filter Button */}
                                    <button
                                        onClick={() => setIsHourFilterOpen(!isHourFilterOpen)}
                                        className={cn(
                                            "text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium",
                                            isHourFilterOpen
                                                ? "bg-purple-500/20 text-purple-600 border border-purple-500/30"
                                                : "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20"
                                        )}
                                    >
                                        <Clock size={12} /> 小时筛选
                                    </button>
                                    {/* Add Dimension Filter Button */}
                                    <button
                                        onClick={() => setIsFilterBuilderOpen(!isFilterBuilderOpen)}
                                        className={cn(
                                            "text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium",
                                            isFilterBuilderOpen
                                                ? "bg-primary/20 text-primary border border-primary/30"
                                                : "bg-primary/10 text-primary hover:bg-primary/20"
                                        )}
                                    >
                                        <Plus size={12} /> 维度筛选
                                    </button>
                                    {/* Clear All Button */}
                                    {(query.filters.length > 0 || hourFilter.enabled) && (
                                        <button
                                            onClick={() => {
                                                setQuery(prev => ({ ...prev, filters: [] }));
                                                setHourFilter(prev => ({ ...prev, enabled: false, ranges: [], selectedHours: [] }));
                                                setIsHourFilterOpen(false);
                                                setIsFilterBuilderOpen(false);
                                            }}
                                            className="text-xs px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors flex items-center gap-1 font-medium"
                                        >
                                            <X size={12} /> 清除全部
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Existing Filters Display */}
                            {query.filters.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {query.filters.map(filter => (
                                        <div
                                            key={filter.id}
                                            className="flex items-center gap-2 px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm group"
                                        >
                                            <span className="font-medium text-foreground">{getDimName(filter.dimId)}</span>
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                                                filter.operator === 'IN'
                                                    ? "bg-green-500/10 text-green-600 border border-green-500/20"
                                                    : "bg-orange-500/10 text-orange-600 border border-orange-500/20"
                                            )}>
                                                {filter.operator === 'IN' ? 'IN' : 'NOT IN'}
                                            </span>
                                            <span className="text-muted-foreground">
                                                ({filter.values.join(', ')})
                                            </span>
                                            <button
                                                onClick={() => removeFilter(filter.id)}
                                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-destructive/10 rounded transition-all"
                                            >
                                                <X size={14} className="text-muted-foreground hover:text-destructive" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )
                            }

                            {/* Hour Filter Picker (Advanced) */}
                            {
                                isHourFilterOpen && (
                                    <div className="border border-dashed border-purple-500/30 rounded-xl p-4 bg-purple-500/5 space-y-4 mb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-medium text-foreground flex items-center gap-2">
                                                <Clock size={16} className="text-purple-500" />
                                                小时筛选
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Mode Toggle */}
                                                <div className="flex items-center bg-muted/50 p-0.5 rounded-lg">
                                                    <button
                                                        onClick={() => setHourFilter(prev => ({ ...prev, mode: 'range' }))}
                                                        className={cn(
                                                            "px-3 py-1 rounded-md text-xs font-medium transition-all",
                                                            hourFilter.mode === 'range' ? "bg-background shadow-sm text-purple-600" : "text-muted-foreground"
                                                        )}
                                                    >
                                                        时间段模式
                                                    </button>
                                                    <button
                                                        onClick={() => setHourFilter(prev => ({ ...prev, mode: 'select' }))}
                                                        className={cn(
                                                            "px-3 py-1 rounded-md text-xs font-medium transition-all",
                                                            hourFilter.mode === 'select' ? "bg-background shadow-sm text-purple-600" : "text-muted-foreground"
                                                        )}
                                                    >
                                                        点选模式
                                                    </button>
                                                </div>
                                                <button onClick={() => setIsHourFilterOpen(false)} className="p-1 hover:bg-muted rounded">
                                                    <X size={14} className="text-muted-foreground" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Range Mode */}
                                        {hourFilter.mode === 'range' && (
                                            <div className="space-y-3">
                                                {/* Quick Presets */}
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="text-xs text-muted-foreground">快捷选项:</span>
                                                    {[
                                                        { name: '工作时段', ranges: [{ start: 9, end: 12 }, { start: 14, end: 18 }] },
                                                        { name: '早高峰', ranges: [{ start: 7, end: 9 }] },
                                                        { name: '晚高峰', ranges: [{ start: 17, end: 19 }] },
                                                        { name: '夜间', ranges: [{ start: 22, end: 23 }, { start: 0, end: 5 }] },
                                                    ].map(preset => (
                                                        <button
                                                            key={preset.name}
                                                            onClick={() => setHourFilter(prev => ({ ...prev, ranges: [...prev.ranges, ...preset.ranges] }))}
                                                            className="px-2 py-1 text-xs bg-purple-500/10 text-purple-600 rounded hover:bg-purple-500/20 transition-colors"
                                                        >
                                                            {preset.name}
                                                        </button>
                                                    ))}
                                                </div>
                                                {/* Range List */}
                                                <div className="space-y-2">
                                                    {hourFilter.ranges.map((range, idx) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <select
                                                                value={range.start}
                                                                onChange={(e) => {
                                                                    const newRanges = [...hourFilter.ranges];
                                                                    newRanges[idx] = { ...newRanges[idx], start: Number(e.target.value) };
                                                                    setHourFilter(prev => ({ ...prev, ranges: newRanges }));
                                                                }}
                                                                className="px-2 py-1 bg-background border border-border rounded text-sm w-20"
                                                            >
                                                                {Array.from({ length: 24 }, (_, i) => (
                                                                    <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                                                                ))}
                                                            </select>
                                                            <span className="text-muted-foreground text-xs">至</span>
                                                            <select
                                                                value={range.end}
                                                                onChange={(e) => {
                                                                    const newRanges = [...hourFilter.ranges];
                                                                    newRanges[idx] = { ...newRanges[idx], end: Number(e.target.value) };
                                                                    setHourFilter(prev => ({ ...prev, ranges: newRanges }));
                                                                }}
                                                                className="px-2 py-1 bg-background border border-border rounded text-sm w-20"
                                                            >
                                                                {Array.from({ length: 24 }, (_, i) => (
                                                                    <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                onClick={() => {
                                                                    const newRanges = hourFilter.ranges.filter((_, i) => i !== idx);
                                                                    setHourFilter(prev => ({ ...prev, ranges: newRanges }));
                                                                }}
                                                                className="p-1 hover:bg-destructive/10 rounded"
                                                            >
                                                                <X size={12} className="text-muted-foreground hover:text-destructive" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => setHourFilter(prev => ({ ...prev, ranges: [...prev.ranges, { start: 9, end: 18 }] }))}
                                                        className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                                                    >
                                                        <Plus size={12} /> 添加时间段
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Select Mode - 24 Hour Grid */}
                                        {hourFilter.mode === 'select' && (
                                            <div className="space-y-3">
                                                <div className="text-xs text-muted-foreground">点击选择/取消小时（支持多选）:</div>
                                                <div className="grid grid-cols-12 gap-1">
                                                    {Array.from({ length: 24 }, (_, hour) => {
                                                        const isSelected = hourFilter.selectedHours.includes(hour);
                                                        return (
                                                            <button
                                                                key={hour}
                                                                onClick={() => {
                                                                    setHourFilter(prev => ({
                                                                        ...prev,
                                                                        selectedHours: isSelected
                                                                            ? prev.selectedHours.filter(h => h !== hour)
                                                                            : [...prev.selectedHours, hour]
                                                                    }));
                                                                }}
                                                                className={cn(
                                                                    "w-full py-2 text-xs font-medium rounded transition-all",
                                                                    isSelected
                                                                        ? "bg-purple-500 text-white"
                                                                        : "bg-background border border-border hover:border-purple-500/50"
                                                                )}
                                                            >
                                                                {hour.toString().padStart(2, '0')}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setHourFilter(prev => ({ ...prev, selectedHours: Array.from({ length: 24 }, (_, i) => i) }))}
                                                        className="text-xs text-purple-600 hover:text-purple-700"
                                                    >
                                                        全选
                                                    </button>
                                                    <button
                                                        onClick={() => setHourFilter(prev => ({ ...prev, selectedHours: [] }))}
                                                        className="text-xs text-muted-foreground hover:text-foreground"
                                                    >
                                                        清空
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-2 border-t border-border">
                                            <div className="text-xs text-muted-foreground">
                                                💡 小时筛选对所有粒度生效
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setHourFilter(prev => ({ ...prev, ranges: [], selectedHours: [] }))}
                                                    className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    清除
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const hasValidFilter = hourFilter.mode === 'range'
                                                            ? hourFilter.ranges.length > 0
                                                            : hourFilter.selectedHours.length > 0;
                                                        if (hasValidFilter) {
                                                            setHourFilter(prev => ({ ...prev, enabled: true }));
                                                            setIsHourFilterOpen(false);
                                                        }
                                                    }}
                                                    disabled={hourFilter.mode === 'range' ? hourFilter.ranges.length === 0 : hourFilter.selectedHours.length === 0}
                                                    className={cn(
                                                        "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                                        (hourFilter.mode === 'range' ? hourFilter.ranges.length > 0 : hourFilter.selectedHours.length > 0)
                                                            ? "bg-purple-500 text-white hover:bg-purple-600"
                                                            : "bg-muted text-muted-foreground cursor-not-allowed"
                                                    )}
                                                >
                                                    应用筛选
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }

                            {/* Filter Builder (Expanded) */}
                            {
                                isFilterBuilderOpen && (
                                    <div className="border border-dashed border-primary/30 rounded-xl p-4 bg-primary/5 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Step 1: Select Dimension */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground">1. 选择维度</label>
                                                <select
                                                    value={newFilterDim}
                                                    onChange={(e) => {
                                                        setNewFilterDim(e.target.value);
                                                        setNewFilterValues([]); // Reset values when dim changes
                                                    }}
                                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:border-primary outline-none"
                                                >
                                                    <option value="">请选择维度...</option>
                                                    {METADATA_DIMS.filter(d => d.id !== 'dt' && DIMENSION_VALUES[d.id]).map(dim => (
                                                        <option key={dim.id} value={dim.id}>{dim.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Step 2: Select Operator */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground">2. 选择操作符</label>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setNewFilterOperator('IN')}
                                                        className={cn(
                                                            "flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                                                            newFilterOperator === 'IN'
                                                                ? "bg-green-500/10 border-green-500/30 text-green-600"
                                                                : "bg-background border-border text-muted-foreground hover:border-green-500/30"
                                                        )}
                                                    >
                                                        IN (包含)
                                                    </button>
                                                    <button
                                                        onClick={() => setNewFilterOperator('NOT_IN')}
                                                        className={cn(
                                                            "flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                                                            newFilterOperator === 'NOT_IN'
                                                                ? "bg-orange-500/10 border-orange-500/30 text-orange-600"
                                                                : "bg-background border-border text-muted-foreground hover:border-orange-500/30"
                                                        )}
                                                    >
                                                        NOT IN (排除)
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Step 3: Select Values */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground">
                                                    3. 选择值 {newFilterValues.length > 0 && `(已选 ${newFilterValues.length})`}
                                                </label>
                                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-background border border-border rounded-lg">
                                                    {newFilterDim && DIMENSION_VALUES[newFilterDim]?.map(value => (
                                                        <button
                                                            key={value}
                                                            onClick={() => toggleFilterValue(value)}
                                                            className={cn(
                                                                "px-2 py-1 rounded text-xs border transition-all",
                                                                newFilterValues.includes(value)
                                                                    ? "bg-primary text-primary-foreground border-primary"
                                                                    : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary"
                                                            )}
                                                        >
                                                            {value}
                                                        </button>
                                                    ))}
                                                    {!newFilterDim && (
                                                        <span className="text-xs text-muted-foreground italic">请先选择维度</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                                            <button
                                                onClick={resetFilterBuilder}
                                                className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                                            >
                                                取消
                                            </button>
                                            <button
                                                onClick={addFilter}
                                                disabled={!newFilterDim || newFilterValues.length === 0}
                                                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                确认添加
                                            </button>
                                        </div>
                                    </div>
                                )
                            }
                        </section>

                        {/* Query Row: Info + Buttons */}
                        <div className="flex items-center justify-between gap-4">
                            {/* Query Info (Left) */}
                            {lastQueryInfo ? (
                                <div className="flex-1 min-w-0 bg-gradient-to-r from-primary/5 to-blue-500/5 border border-primary/20 rounded-xl px-4 py-2">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0"></div>
                                        <span className="text-sm text-muted-foreground break-words">{lastQueryInfo}</span>
                                        <span className="text-xs text-muted-foreground/60 ml-auto flex-shrink-0">最后查询时间: {new Date().toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ) : (
                                <div></div>
                            )}

                            {/* Query Buttons (Right) */}
                            <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-full border border-border/40 flex-shrink-0">
                                <button
                                    onClick={resetQuery}
                                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-full transition-all"
                                    title="重置所有筛选条件"
                                >
                                    <RotateCcw size={14} />
                                    <span>重置</span>
                                </button>
                                <div className="w-px h-4 bg-border/60"></div>
                                <button
                                    onClick={executeQuery}
                                    disabled={isQuerying}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-1.5 text-sm font-semibold text-white rounded-full transition-all duration-300 relative overflow-hidden group",
                                        isQuerying
                                            ? "bg-primary/80 cursor-wait"
                                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5"
                                    )}
                                >
                                    {isQuerying ? (
                                        <RefreshCcw size={16} className="animate-spin" />
                                    ) : (
                                        <Search size={16} className="group-hover:scale-110 transition-transform" />
                                    )}
                                    {isQuerying ? '查询中...' : '查询数据'}
                                </button>
                            </div>
                        </div>

                        {/* 2. Single Chart with Style Switcher */}
                        <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><TrendingUp size={20} /></div>
                                    <h3 className="text-base font-bold text-foreground">数据趋势</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Chart Type Switcher */}
                                    {comparisonType !== 'none' && (
                                        <div className="flex items-center gap-2 mr-2 border-r border-border pr-4">
                                            <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none">
                                                <div className="relative inline-flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={showComparisonInChart}
                                                        onChange={(e) => setShowComparisonInChart(e.target.checked)}
                                                    />
                                                    <div className="h-4 w-7 rounded-full bg-muted peer-checked:bg-primary transition-colors"></div>
                                                    <div className="absolute left-[2px] top-[2px] h-3 w-3 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-3"></div>
                                                </div>
                                                <span className="text-muted-foreground">显示对比</span>
                                            </label>
                                        </div>
                                    )}
                                    <div className="flex items-center bg-muted/50 p-1 rounded-lg">
                                        <button
                                            onClick={() => setChartType('area')}
                                            className={cn(
                                                "px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all",
                                                chartType === 'area' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <TrendingUp size={14} /> 面积图
                                        </button>
                                        <button
                                            onClick={() => setChartType('bar')}
                                            className={cn(
                                                "px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all",
                                                chartType === 'bar' ? "bg-background shadow-sm text-purple-500" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <BarChart3 size={14} /> 柱状图
                                        </button>
                                        <button
                                            onClick={() => setChartType('line')}
                                            className={cn(
                                                "px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all",
                                                chartType === 'line' ? "bg-background shadow-sm text-green-500" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <LineChart size={14} /> 折线图
                                        </button>
                                    </div>
                                    <button className="p-1.5 hover:bg-muted rounded text-muted-foreground"><Download size={16} /></button>
                                </div>
                            </div>



                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartType === 'area' ? (
                                        <RechartsAreaChart data={chartData.length > 0 ? chartData : queryResult}>
                                            <defs>
                                                {chartSeries.map((series, idx) => (
                                                    <linearGradient key={series.key} id={`color${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={series.color} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={series.color} stopOpacity={0} />
                                                    </linearGradient>
                                                ))}
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                            {/* Comparison X-Axis (Top) - Only show when comparison is active */}
                                            {comparisonType !== 'none' && showComparisonInChart && (
                                                <XAxis
                                                    xAxisId="comparison"
                                                    orientation="top"
                                                    dataKey="comparisonDt"
                                                    axisLine={{ stroke: '#d97706', strokeDasharray: '3 3' }}
                                                    tickLine={false}
                                                    tick={{ fontSize: 10, fill: '#d97706' }}
                                                />
                                            )}
                                            {/* Main X-Axis (Bottom) */}
                                            <XAxis xAxisId="main" dataKey="dt" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                            <ChartTooltip
                                                content={({ active, payload, label }) => {
                                                    if (!active || !payload || payload.length === 0) return null;
                                                    // Use dt from the row data for main period (not label which may come from comparison axis)
                                                    const mainPeriodDate = (payload[0] as any)?.payload?.dt || label;
                                                    return (
                                                        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[220px]">
                                                            <div className="text-xs text-muted-foreground mb-2 pb-2 border-b border-border">
                                                                <div className="font-medium text-foreground mb-1">当前周期: {mainPeriodDate}</div>
                                                                {comparisonType !== 'none' && comparisonDateRange && (
                                                                    <div className="font-medium text-amber-600/80 mb-1">
                                                                        对比周期: {getComparisonLabel(comparisonType, timeGranularity)}
                                                                    </div>
                                                                )}
                                                                {hourFilter.enabled && (
                                                                    <div className="flex items-center gap-1.5 text-[10px] bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded w-fit">
                                                                        <Clock size={10} />
                                                                        <span>筛选时段: {hourFilter.mode === 'range'
                                                                            ? hourFilter.ranges.map(r => `${r.start}-${r.end}点`).join(', ')
                                                                            : Array.from(hourFilter.selectedHours).sort((a, b) => a - b).map(h => `${h}点`).join(', ')}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {payload.filter((p: any) => !p.dataKey?.toString().endsWith('_comp')).map((entry: any, idx: number) => {
                                                                const compKey = `${entry.dataKey}_comp`;
                                                                const compPayload = payload.find((p: any) => p.dataKey === compKey);
                                                                const compValue = compPayload?.value as number || 0;
                                                                const currentValue = entry.value as number || 0;
                                                                const rate = compValue > 0 ? ((currentValue - compValue) / compValue * 100) : 0;

                                                                return (
                                                                    <div key={idx} className="flex items-center justify-between gap-4 py-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                                                            <span className="text-xs text-foreground">{entry.name}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                            <span className="font-mono font-medium">{currentValue.toLocaleString()}</span>
                                                                            {showComparisonInChart && comparisonType !== 'none' && compValue > 0 && (
                                                                                <>
                                                                                    <span className="text-muted-foreground/50">vs</span>
                                                                                    <span className="font-mono text-muted-foreground">{compValue.toLocaleString()}</span>
                                                                                    <span className={cn("font-medium", rate >= 0 ? "text-red-500" : "text-green-500")}>
                                                                                        {rate >= 0 ? '+' : ''}{rate.toFixed(1)}%
                                                                                    </span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                }}
                                            />
                                            {chartSeries.filter(s => seriesVisibility[s.key] !== false).map((series, idx) => (
                                                <React.Fragment key={series.key}>
                                                    <Area
                                                        type="monotone"
                                                        dataKey={series.key}
                                                        name={series.name}
                                                        stroke={series.color}
                                                        strokeWidth={2}
                                                        fillOpacity={1}
                                                        fill={`url(#color${idx})`}
                                                        xAxisId="main"
                                                    />
                                                    {showComparisonInChart && comparisonType !== 'none' && (
                                                        <Area
                                                            type="monotone"
                                                            dataKey={`${series.key}_comp`}
                                                            name={`${series.name} (对比)`}
                                                            stroke={series.color}
                                                            strokeWidth={2}
                                                            strokeDasharray="4 4"
                                                            strokeOpacity={0.6}
                                                            fill="none"
                                                            tooltipType="none"
                                                            isAnimationActive={false}
                                                            xAxisId="main"
                                                        />
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </RechartsAreaChart>
                                    ) : chartType === 'bar' ? (
                                        <RechartsBarChart data={chartData.length > 0 ? chartData : queryResult}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                            {/* Comparison X-Axis (Top) */}
                                            {comparisonType !== 'none' && showComparisonInChart && (
                                                <XAxis
                                                    xAxisId="comparison"
                                                    orientation="top"
                                                    dataKey="comparisonDt"
                                                    axisLine={{ stroke: '#d97706', strokeDasharray: '3 3' }}
                                                    tickLine={false}
                                                    tick={{ fontSize: 10, fill: '#d97706' }}
                                                />
                                            )}
                                            {/* Main X-Axis (Bottom) */}
                                            <XAxis xAxisId="main" dataKey="dt" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                            <ChartTooltip cursor={{ fill: 'hsl(var(--muted)/0.2)' }} contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                                            {chartSeries.filter(s => seriesVisibility[s.key] !== false).map(series => (
                                                <React.Fragment key={series.key}>
                                                    <Bar
                                                        dataKey={series.key}
                                                        name={series.name}
                                                        fill={series.color}
                                                        radius={[4, 4, 0, 0]}
                                                        xAxisId="main"
                                                    />
                                                    {showComparisonInChart && comparisonType !== 'none' && (
                                                        <Bar
                                                            dataKey={`${series.key}_comp`}
                                                            name={`${series.name} (对比)`}
                                                            fill={series.color}
                                                            radius={[4, 4, 0, 0]}
                                                            fillOpacity={0.3}
                                                            tooltipType="none"
                                                            isAnimationActive={false}
                                                            xAxisId="main"
                                                        />
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </RechartsBarChart>
                                    ) : (
                                        <LineChart data={chartData.length > 0 ? chartData : queryResult}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                            {/* Comparison X-Axis (Top) */}
                                            {comparisonType !== 'none' && showComparisonInChart && (
                                                <XAxis
                                                    xAxisId="comparison"
                                                    orientation="top"
                                                    dataKey="comparisonDt"
                                                    axisLine={{ stroke: '#d97706', strokeDasharray: '3 3' }}
                                                    tickLine={false}
                                                    tick={{ fontSize: 10, fill: '#d97706' }}
                                                />
                                            )}
                                            {/* Main X-Axis (Bottom) */}
                                            <XAxis xAxisId="main" dataKey="dt" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                            <ChartTooltip
                                                content={({ active, payload, label }) => {
                                                    if (!active || !payload || payload.length === 0) return null;
                                                    // Use dt from the row data for main period (not label which may come from comparison axis)
                                                    const mainPeriodDate = (payload[0] as any)?.payload?.dt || label;
                                                    return (
                                                        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[220px]">
                                                            <div className="text-xs text-muted-foreground mb-2 pb-2 border-b border-border">
                                                                <div className="font-medium text-foreground mb-1">当前周期: {mainPeriodDate}</div>
                                                                {comparisonType !== 'none' && comparisonDateRange && (
                                                                    <div className="font-medium text-amber-600/80 mb-1">
                                                                        对比周期: {getComparisonLabel(comparisonType, timeGranularity)}
                                                                    </div>
                                                                )}
                                                                {hourFilter.enabled && (
                                                                    <div className="flex items-center gap-1.5 text-[10px] bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded w-fit">
                                                                        <Clock size={10} />
                                                                        <span>筛选时段: {hourFilter.mode === 'range'
                                                                            ? hourFilter.ranges.map(r => `${r.start}-${r.end}点`).join(', ')
                                                                            : Array.from(hourFilter.selectedHours).sort((a, b) => a - b).map(h => `${h}点`).join(', ')}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {payload.filter((p: any) => !p.dataKey?.toString().endsWith('_comp')).map((entry: any, idx: number) => {
                                                                const compKey = `${entry.dataKey}_comp`;
                                                                const compPayload = payload.find((p: any) => p.dataKey === compKey);
                                                                const compValue = compPayload?.value as number || 0;
                                                                const currentValue = entry.value as number || 0;
                                                                const rate = compValue > 0 ? ((currentValue - compValue) / compValue * 100) : 0;

                                                                return (
                                                                    <div key={idx} className="flex items-center justify-between gap-4 py-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                                                            <span className="text-xs text-foreground">{entry.name}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                            <span className="font-mono font-medium">{currentValue.toLocaleString()}</span>
                                                                            {showComparisonInChart && comparisonType !== 'none' && compValue > 0 && (
                                                                                <>
                                                                                    <span className="text-muted-foreground/50">vs</span>
                                                                                    <span className="font-mono text-muted-foreground">{compValue.toLocaleString()}</span>
                                                                                    <span className={cn("font-medium", rate >= 0 ? "text-red-500" : "text-green-500")}>
                                                                                        {rate >= 0 ? '+' : ''}{rate.toFixed(1)}%
                                                                                    </span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                }}
                                            />
                                            {chartSeries.filter(s => seriesVisibility[s.key] !== false).map(series => (
                                                <React.Fragment key={series.key}>
                                                    <Line
                                                        type="monotone"
                                                        dataKey={series.key}
                                                        name={series.name}
                                                        stroke={series.color}
                                                        strokeWidth={2}
                                                        dot={false}
                                                        xAxisId="main"
                                                    />
                                                    {showComparisonInChart && comparisonType !== 'none' && (
                                                        <Line
                                                            type="monotone"
                                                            dataKey={`${series.key}_comp`}
                                                            name={`${series.name} (对比)`}
                                                            stroke={series.color}
                                                            strokeWidth={2}
                                                            strokeDasharray="4 4"
                                                            strokeOpacity={0.6}
                                                            dot={false}
                                                            tooltipType="none"
                                                            isAnimationActive={false}
                                                            xAxisId="main"
                                                        />
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </LineChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 space-y-3">
                                {chartSeries.length > 0 && (
                                    <div className="flex flex-wrap gap-3 justify-center">
                                        {chartSeries.map(series => {
                                            const isVisible = seriesVisibility[series.key] !== false;
                                            return (
                                                <button
                                                    key={series.key}
                                                    onClick={() => setSeriesVisibility(prev => ({
                                                        ...prev,
                                                        [series.key]: !isVisible
                                                    }))}
                                                    className={cn(
                                                        "flex items-center gap-2 px-2 py-1 rounded-md transition-all hover:bg-muted/50",
                                                        isVisible ? "opacity-100" : "opacity-40"
                                                    )}
                                                >
                                                    <div className="w-4 h-0.5" style={{ backgroundColor: series.color }}></div>
                                                    <span className="text-xs text-muted-foreground">{series.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 3. Data Table */}
                        <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                            {/* Table Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border">
                                <div className="flex items-center gap-4">
                                    <h3 className="font-bold text-foreground flex items-center gap-2">
                                        <TableIcon size={18} className="text-primary" />
                                        <span className="text-base font-bold text-foreground">数据明细</span>
                                    </h3>
                                </div>
                                {/* View Mode Toggle */}
                                <div className="flex items-center bg-muted/50 p-1 rounded-lg">
                                    <button
                                        onClick={() => setTableViewMode('detail')}
                                        className={cn(
                                            "px-3 py-1 rounded-md text-xs font-medium transition-all",
                                            tableViewMode === 'detail' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        明细
                                    </button>
                                    <button
                                        onClick={() => setTableViewMode('summary')}
                                        className={cn(
                                            "px-3 py-1 rounded-md text-xs font-medium transition-all",
                                            tableViewMode === 'summary' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        汇总
                                    </button>
                                </div>
                                {/* Column Display Options - Only show when comparison is active */}
                                {tableViewMode === 'detail' && comparisonType !== 'none' && (
                                    <div className="flex items-center gap-4 ml-4 border-l border-border pl-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={showComparisonInTable}
                                                onChange={(e) => setShowComparisonInTable(e.target.checked)}
                                                className="w-3.5 h-3.5 rounded border-border accent-amber-500"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                显示{getComparisonLabel(comparisonType, timeGranularity).split(' (')[0]}
                                            </span>
                                        </label>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 border-l border-border pl-4 ml-4">
                                    <span className="text-xs text-muted-foreground">共 {query.metrics.length} 个指标</span>
                                    <button className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-1">
                                        <Download size={14} /> 导出CSV
                                    </button>
                                </div>
                            </div>

                            {/* Summary Table */}
                            {tableViewMode === 'summary' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/30 text-xs text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-muted/30 z-10 border-b border-border">指标名称</th>
                                                <th className="px-4 py-3 text-center font-semibold border-b border-border">时间段内累计值(SUM)</th>
                                                <th className="px-4 py-3 text-center font-semibold border-b border-border">时间段内均值(AVG)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {query.metrics.map(metricId => {
                                                const metric = metricsMetadata.find(m => m.id === metricId);
                                                const values = chartData.map(row => Number(row[metricId]) || 0);
                                                const sum = values.reduce((a, b) => a + b, 0);
                                                const avg = values.length > 0 ? sum / values.length : 0;

                                                return (
                                                    <tr key={metricId} className="hover:bg-muted/20 transition-colors">
                                                        <td className="px-4 py-3 sticky left-0 bg-card z-10 font-medium">{metric?.name || metricId}</td>
                                                        <td className="px-4 py-3 text-right font-mono">{sum.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                        <td className="px-4 py-3 text-right font-mono">{avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Detail Table (Transposed: rows=metrics, cols=dates) */}
                            {tableViewMode === 'detail' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-muted/30 z-10">指标名称</th>
                                                {chartData.slice(0, 15).map((row, idx) => (
                                                    <th key={idx} className="px-3 py-3 text-right font-semibold whitespace-nowrap">
                                                        {row.dt}
                                                    </th>
                                                ))}
                                                {chartData.length > 15 && (
                                                    <th className="px-3 py-3 text-center font-semibold text-muted-foreground">...</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {query.metrics.map(metricId => {
                                                const metric = metricsMetadata.find(m => m.id === metricId);
                                                return (
                                                    <React.Fragment key={metricId}>
                                                        {/* Metric Value Row */}
                                                        <tr className="hover:bg-muted/20 transition-colors">
                                                            <td className="px-4 py-3 sticky left-0 bg-card z-10 font-medium">{metric?.name || metricId}</td>
                                                            {chartData.slice(0, 15).map((row, idx) => (
                                                                <td key={idx} className="px-3 py-3 text-right font-mono">
                                                                    {(Number(row[metricId]) || 0).toLocaleString()}
                                                                </td>
                                                            ))}
                                                            {chartData.length > 15 && <td className="px-3 py-3 text-center text-muted-foreground">...</td>}
                                                        </tr>

                                                        {/* Comparison Rows (controlled by main comparison selector) */}
                                                        {showComparisonInTable && comparisonType !== 'none' && (
                                                            <>
                                                                <tr className="bg-muted/5">
                                                                    <td className="px-4 py-2 sticky left-0 bg-muted/5 z-10 text-xs text-muted-foreground pl-8">
                                                                        {getComparisonLabel(comparisonType, timeGranularity).split(' (')[0]}数值
                                                                    </td>
                                                                    {chartData.slice(0, 15).map((row, idx) => (
                                                                        <td key={idx} className="px-3 py-2 text-right text-xs font-mono text-muted-foreground">
                                                                            {(Number((row as any)[`${metricId}_comp`]) || 0).toLocaleString()}
                                                                        </td>
                                                                    ))}
                                                                    {chartData.length > 15 && <td className="px-3 py-2 text-center text-muted-foreground text-xs">...</td>}
                                                                </tr>
                                                                <tr className="bg-muted/10">
                                                                    <td className="px-4 py-2 sticky left-0 bg-muted/10 z-10 text-xs text-muted-foreground pl-8">
                                                                        {getComparisonLabel(comparisonType, timeGranularity).split(' (')[0]}
                                                                    </td>
                                                                    {chartData.slice(0, 15).map((row, idx) => {
                                                                        const rate = (row as any)[`${metricId}_rate`] || 0;
                                                                        return (
                                                                            <td key={idx} className={cn("px-3 py-2 text-right text-xs", rate >= 0 ? "text-red-500" : "text-green-500")}>
                                                                                {rate >= 0 ? '+' : ''}{Number(rate).toFixed(1)}%
                                                                            </td>
                                                                        );
                                                                    })}
                                                                    {chartData.length > 15 && <td className="px-3 py-2 text-center text-muted-foreground text-xs">...</td>}
                                                                </tr>
                                                            </>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Table Footer */}
                            {tableViewMode === 'summary' && (
                                <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-center">
                                    <button
                                        onClick={() => setTableViewMode('detail')}
                                        className="text-xs text-primary hover:underline font-medium"
                                    >
                                        查看全部明细数据 →
                                    </button>
                                </div>
                            )}
                        </section>
                    </div >

                    <MetricSelectorModal
                        isOpen={isMetricModalOpen}
                        onClose={() => setIsMetricModalOpen(false)}
                        metrics={metricsMetadata}
                        selectedMetrics={selectedMetricPool}
                        onConfirm={(newMetrics) => {
                            // 1. Determine newly added metrics (that were not in the pool)
                            const addedMetrics = newMetrics.filter(m => !selectedMetricPool.includes(m));

                            // 2. Update Pool (UI Cards)
                            setSelectedMetricPool(newMetrics);

                            // 3. Update Active Query:
                            //    - Keep previously active metrics if they are still in the new pool
                            //    - Add newly added metrics to active selection (User Requirement: Default Selected)
                            setQuery(prev => {
                                const stillActive = prev.metrics.filter(m => newMetrics.includes(m));
                                return { ...prev, metrics: [...stillActive, ...addedMetrics] };
                            });

                            setIsMetricModalOpen(false);
                        }}
                        availableMetrics={availableMetrics}
                        dimensions={METADATA_DIMS}
                    />
                </main >
            </div >
        </div >
    );
}
