import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
    ArrowLeft, Save, Search, Tag, Layers, RotateCcw, Check, ChevronDown,
    Database, Filter, Download, Upload, Edit3, CheckSquare, Square, Minus,
    User, X, Plus, RefreshCcw, Cloud, FileSpreadsheet, Trash2, Copy,
    AlertCircle, CheckCircle, Clock, Info, Code, Hash, Percent, Table2,
    ChevronRight, Settings2, Eye, MoreHorizontal
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Metric as MetricType, MetricDisplayFormat, MetricDataSourceMode, SyncStatus, FormulaConfig, FormulaType, FormulaExpression, FormulaTerm, AggregationFunction } from './types';

// Re-export for compatibility
export type Metric = MetricType;

interface MetricConfigPageProps {
    metrics: Metric[];
    onUpdateMetrics: (newMetrics: Metric[]) => void;
    onBack: () => void;
}

// Constants
const GROUPS = ['订单', '用户', '效率', '时长', '体验', '车辆', '财务', '转化', '供应链'];
const AVAILABLE_TAGS = [
    'core', 'secondary', 'realtime', 'T+1', 'DWS', 'ADS', 'DWD',
    'supply_chain', 'financial', 'experience', 'kpi', 'derived',
    'rate', 'duration', 'user', 'vehicle'
];
const BUSINESS_OWNERS = [
    '张明 (履约PM)', '李娜 (用户增长PM)', '王强 (体验PM)', '刘洋 (供应链PM)',
    '陈静 (营销PM)', '赵伟 (财务PM)', '周芳 (运营PM)', '吴磊 (战略PM)'
];
const DATA_OWNERS = [
    '孙浩 (履约数据)', '钱丽 (用户数据)', '郑凯 (体验数据)', '冯雪 (供应链数据)',
    '蒋涛 (营销数据)', '沈婷 (财务数据)', '韩冰 (运营数据)', '杨帆 (平台数据)'
];
const AGGREGATION_TYPES = ['SUM', 'AVG', 'COUNT', 'COUNT_DISTINCT', 'MAX', 'MIN', 'CALC'];

// Aggregation functions for formula builder
const AGGREGATION_FUNCTIONS: { value: AggregationFunction; label: string; description: string }[] = [
    { value: 'SUM', label: 'SUM', description: '求和' },
    { value: 'AVG', label: 'AVG', description: '平均值' },
    { value: 'COUNT', label: 'COUNT', description: '计数' },
    { value: 'COUNT_DISTINCT', label: 'COUNT_DISTINCT', description: '去重计数' },
    { value: 'MAX', label: 'MAX', description: '最大值' },
    { value: 'MIN', label: 'MIN', description: '最小值' },
    { value: 'BITMAPUIN', label: 'BITMAPUIN', description: '位图用户去重' },
    { value: 'BITMAP_COUNT', label: 'BITMAP_COUNT', description: '位图计数' },
    { value: 'PERCENTILE', label: 'PERCENTILE', description: '百分位数' },
];

// Formula types for calculated metrics (weighted_avg removed per requirement)
const FORMULA_TYPES: { value: FormulaType; label: string; description: string; example: string }[] = [
    { value: 'simple', label: '简单聚合', description: '单一聚合函数', example: 'SUM([指标])' },
    { value: 'ratio', label: '比率类型', description: '分子除以分母', example: 'SUM([A]) / SUM([B])' },
    { value: 'growth', label: '增长率', description: '环比/同比增长', example: '(当期-上期)/上期*100' },
    { value: 'difference', label: '差值类型', description: '两个指标相减', example: 'SUM([A]) - SUM([B])' },
    { value: 'custom', label: '自定义公式', description: '自由组合复杂公式', example: '自定义表达式' },
];
const AVAILABLE_DIMENSIONS = [
    { id: 'dt', name: '日期' },
    { id: 'city', name: '城市' },
    { id: 'supplier', name: '供应商' },
    { id: 'product_type', name: '服务产品类型' },
    { id: 'service_type', name: '服务类型' },
    { id: 'jkc_type', name: 'JKC内外部' },
    { id: 'cancel_type', name: '取消类型' },
    { id: 'cancel_stage', name: '取消阶段' },
    { id: 'vehicle_usage', name: '车辆用途' },
    { id: 'asset_type', name: '资产性质' },
];

// Default empty metric with reasonable defaults
const createEmptyMetric = (): Metric => ({
    id: '',
    name: '',
    group: '订单',
    subGroup: '',
    tags: [],
    compatibleDims: ['dt', 'city'],  // Default to common dimensions
    description: '',
    businessOwner: BUSINESS_OWNERS[0],  // Default to first owner
    dataOwner: DATA_OWNERS[0],  // Default to first data owner
    metricType: 'atomic',
    formula: '',
    sourceTable: '',
    sourceField: '',
    displayFormat: {
        decimals: 0,  // Default to integer display for most metrics
        isPercentage: false,
        useThousandSeparator: true,
    },
    updateFrequency: 'T+1',
    aggr: 'SUM',
    unit: '单',
    dataSource: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
});

// Create empty formula term
const createEmptyTerm = (): FormulaTerm => ({
    id: crypto.randomUUID(),
    aggregation: 'SUM',
    metricId: '',
    coefficient: 1,
});

// Create empty formula expression
const createEmptyExpression = (): FormulaExpression => ({
    terms: [createEmptyTerm()],
    operators: [],
});

// Create default formula config
const createDefaultFormulaConfig = (type: FormulaType = 'ratio'): FormulaConfig => ({
    type,
    numerator: createEmptyExpression(),
    denominator: type === 'ratio' || type === 'growth' ? createEmptyExpression() : undefined,
    multiplier: type === 'growth' ? 100 : undefined,
});

// Generate SQL formula from config
const generateFormulaFromConfig = (config: FormulaConfig, atomicMetrics: Metric[]): string => {
    const getMetricName = (id: string) => {
        const metric = atomicMetrics.find(m => m.id === id);
        return metric ? metric.name : id;
    };

    const expressionToString = (expr: FormulaExpression): string => {
        if (!expr.terms || expr.terms.length === 0) return '';

        let result = '';
        expr.terms.forEach((term, index) => {
            const coef = term.coefficient && term.coefficient !== 1 ? `${term.coefficient} * ` : '';
            const termStr = `${term.aggregation}([${getMetricName(term.metricId)}])`;

            if (index === 0) {
                result = `${coef}${termStr}`;
            } else {
                const op = expr.operators[index - 1] || '+';
                result += ` ${op} ${coef}${termStr}`;
            }
        });

        return expr.terms.length > 1 ? `(${result})` : result;
    };

    const numerator = expressionToString(config.numerator);

    if (config.type === 'simple') {
        return numerator;
    }

    if (config.denominator) {
        const denominator = expressionToString(config.denominator);
        const multiplier = config.multiplier ? ` * ${config.multiplier}` : '';
        return `${numerator} / ${denominator}${multiplier}`;
    }

    return numerator;
};

// Formula Term Editor Component
interface FormulaTermEditorProps {
    term: FormulaTerm;
    onChange: (term: FormulaTerm) => void;
    onRemove: () => void;
    atomicMetrics: Metric[];
    canRemove: boolean;
}

function FormulaTermEditor({ term, onChange, onRemove, atomicMetrics, canRemove }: FormulaTermEditorProps) {
    return (
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border group">
            {/* Aggregation Function */}
            <select
                value={term.aggregation}
                onChange={(e) => onChange({ ...term, aggregation: e.target.value as AggregationFunction })}
                className="px-2 py-1.5 bg-background border border-border rounded text-sm font-mono min-w-[140px]"
            >
                {AGGREGATION_FUNCTIONS.map(agg => (
                    <option key={agg.value} value={agg.value}>
                        {agg.label} ({agg.description})
                    </option>
                ))}
            </select>

            <span className="text-muted-foreground">(</span>

            {/* Metric Selector */}
            <select
                value={term.metricId}
                onChange={(e) => onChange({ ...term, metricId: e.target.value })}
                className="flex-1 px-2 py-1.5 bg-background border border-border rounded text-sm min-w-[180px]"
            >
                <option value="">选择指标字段...</option>
                {atomicMetrics.map(m => (
                    <option key={m.id} value={m.id}>[{m.name}]</option>
                ))}
            </select>

            <span className="text-muted-foreground">)</span>

            {/* Coefficient (optional) */}
            <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">×</span>
                <input
                    type="number"
                    value={term.coefficient ?? 1}
                    onChange={(e) => onChange({ ...term, coefficient: parseFloat(e.target.value) || 1 })}
                    className="w-16 px-2 py-1.5 bg-background border border-border rounded text-sm text-center"
                    step="0.1"
                />
            </div>

            {/* Remove Button */}
            {canRemove && (
                <button
                    onClick={onRemove}
                    className="p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
}

// Formula Expression Editor Component
interface FormulaExpressionEditorProps {
    expression: FormulaExpression;
    onChange: (expr: FormulaExpression) => void;
    atomicMetrics: Metric[];
    label: string;
    icon: React.ReactNode;
    colorClass: string;
}

function FormulaExpressionEditor({ expression, onChange, atomicMetrics, label, icon, colorClass }: FormulaExpressionEditorProps) {
    const addTerm = () => {
        onChange({
            terms: [...expression.terms, createEmptyTerm()],
            operators: [...expression.operators, '+'],
        });
    };

    const updateTerm = (index: number, term: FormulaTerm) => {
        const newTerms = [...expression.terms];
        newTerms[index] = term;
        onChange({ ...expression, terms: newTerms });
    };

    const removeTerm = (index: number) => {
        const newTerms = expression.terms.filter((_, i) => i !== index);
        const newOperators = expression.operators.filter((_, i) => i !== index - 1 && i !== index);
        onChange({ terms: newTerms, operators: newOperators });
    };

    const updateOperator = (index: number, op: '+' | '-') => {
        const newOperators = [...expression.operators];
        newOperators[index] = op;
        onChange({ ...expression, operators: newOperators });
    };

    return (
        <div className={cn("p-4 rounded-xl border-2", colorClass)}>
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <span className="font-medium text-sm">{label}</span>
            </div>

            <div className="space-y-2">
                {expression.terms.map((term, index) => (
                    <div key={term.id}>
                        {index > 0 && (
                            <div className="flex items-center gap-2 my-2 ml-4">
                                <select
                                    value={expression.operators[index - 1] || '+'}
                                    onChange={(e) => updateOperator(index - 1, e.target.value as '+' | '-')}
                                    className="px-3 py-1 bg-background border border-border rounded text-sm font-bold"
                                >
                                    <option value="+">+</option>
                                    <option value="-">-</option>
                                </select>
                            </div>
                        )}
                        <FormulaTermEditor
                            term={term}
                            onChange={(t) => updateTerm(index, t)}
                            onRemove={() => removeTerm(index)}
                            atomicMetrics={atomicMetrics}
                            canRemove={expression.terms.length > 1}
                        />
                    </div>
                ))}
            </div>

            <button
                onClick={addTerm}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1"
            >
                <Plus size={14} /> 添加项
            </button>
        </div>
    );
}

// Formula Builder Component
interface FormulaBuilderProps {
    formulaConfig: FormulaConfig | undefined;
    onChange: (config: FormulaConfig) => void;
    atomicMetrics: Metric[];
    legacyFormula?: string;
    onLegacyFormulaChange?: (formula: string) => void;
}

function FormulaBuilder({ formulaConfig, onChange, atomicMetrics, legacyFormula, onLegacyFormulaChange }: FormulaBuilderProps) {
    const [mode, setMode] = useState<'visual' | 'raw'>('visual');
    const config = formulaConfig || createDefaultFormulaConfig();

    const generatedFormula = useMemo(() => {
        return generateFormulaFromConfig(config, atomicMetrics);
    }, [config, atomicMetrics]);

    const handleTypeChange = (type: FormulaType) => {
        const newConfig = createDefaultFormulaConfig(type);
        // Preserve existing numerator if possible
        if (config.numerator.terms.length > 0 && config.numerator.terms[0].metricId) {
            newConfig.numerator = config.numerator;
        }
        onChange(newConfig);
    };

    return (
        <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                    <button
                        onClick={() => setMode('visual')}
                        className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                            mode === 'visual' ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
                        )}
                    >
                        <Layers size={14} /> 可视化配置
                    </button>
                    <button
                        onClick={() => setMode('raw')}
                        className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                            mode === 'raw' ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
                        )}
                    >
                        <Code size={14} /> 原始公式
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {mode === 'visual' ? (
                    <motion.div
                        key="visual"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Formula Type Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">公式类型</label>
                            <div className="grid grid-cols-3 gap-2">
                                {FORMULA_TYPES.map(ft => (
                                    <button
                                        key={ft.value}
                                        onClick={() => handleTypeChange(ft.value)}
                                        className={cn(
                                            "p-3 rounded-lg border-2 text-left transition-all",
                                            config.type === ft.value
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-muted-foreground"
                                        )}
                                    >
                                        <p className="text-sm font-medium">{ft.label}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{ft.description}</p>
                                        <p className="text-xs font-mono text-primary/70 mt-1">{ft.example}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Numerator */}
                        <FormulaExpressionEditor
                            expression={config.numerator}
                            onChange={(expr) => onChange({ ...config, numerator: expr })}
                            atomicMetrics={atomicMetrics}
                            label={config.type === 'simple' ? '聚合表达式' : '分子 (Numerator)'}
                            icon={<div className="w-6 h-6 rounded bg-blue-500/20 text-blue-600 flex items-center justify-center text-xs font-bold">N</div>}
                            colorClass="border-blue-200 bg-blue-50/50"
                        />

                        {/* Denominator (for ratio, growth) */}
                        {(config.type === 'ratio' || config.type === 'growth') && config.denominator && (
                            <>
                                <div className="flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl font-light text-muted-foreground">
                                        ÷
                                    </div>
                                </div>
                                <FormulaExpressionEditor
                                    expression={config.denominator}
                                    onChange={(expr) => onChange({ ...config, denominator: expr })}
                                    atomicMetrics={atomicMetrics}
                                    label="分母 (Denominator)"
                                    icon={<div className="w-6 h-6 rounded bg-orange-500/20 text-orange-600 flex items-center justify-center text-xs font-bold">D</div>}
                                    colorClass="border-orange-200 bg-orange-50/50"
                                />
                            </>
                        )}

                        {/* Multiplier */}
                        {(config.type === 'growth' || config.type === 'ratio') && (
                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                <span className="text-sm font-medium">最终乘数：</span>
                                <span className="text-2xl font-light text-muted-foreground">×</span>
                                <input
                                    type="number"
                                    value={config.multiplier ?? ''}
                                    onChange={(e) => onChange({ ...config, multiplier: parseFloat(e.target.value) || undefined })}
                                    placeholder="例如 100 (转百分比)"
                                    className="w-32 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                                />
                                <span className="text-xs text-muted-foreground">（留空则不乘）</span>
                            </div>
                        )}

                        {/* Generated Formula Preview */}
                        <div className="p-4 bg-slate-900 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-400">生成的SQL公式</span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(generatedFormula)}
                                    className="p-1 text-slate-400 hover:text-white transition-colors"
                                    title="复制公式"
                                >
                                    <Copy size={14} />
                                </button>
                            </div>
                            <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap break-all">
                                {generatedFormula || '请选择指标字段...'}
                            </pre>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="raw"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div>
                            <label className="block text-sm font-medium mb-1.5">原始公式表达式</label>
                            <textarea
                                value={legacyFormula || generatedFormula}
                                onChange={(e) => onLegacyFormulaChange?.(e.target.value)}
                                placeholder="例如: SUM([营收额_实际支付金额_元]) / SUM([支付单量])"
                                rows={4}
                                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono resize-none"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                支持的函数: SUM, AVG, COUNT, COUNT_DISTINCT, MAX, MIN, BITMAPUIN, BITMAP_COUNT, PERCENTILE
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Batch Edit Field Types
type BatchEditField = 'businessOwner' | 'dataOwner' | 'group' | 'tags' | 'updateFrequency' | 'displayFormat';

interface BatchEditState {
    isOpen: boolean;
    field: BatchEditField | null;
    value: string | string[] | MetricDisplayFormat;
}

// Metric Editor Modal Component
interface MetricEditorProps {
    metric: Metric | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (metric: Metric) => void;
    existingIds: string[];
    existingNames: string[];
    atomicMetrics: Metric[];
}

function MetricEditor({ metric, isOpen, onClose, onSave, existingIds, existingNames, atomicMetrics }: MetricEditorProps) {
    const [editingMetric, setEditingMetric] = useState<Metric>(metric || createEmptyMetric());
    const [activeSection, setActiveSection] = useState<'basic' | 'source' | 'format'>('basic');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const isNew = !metric;

    React.useEffect(() => {
        if (metric) {
            setEditingMetric(metric);
        } else {
            setEditingMetric(createEmptyMetric());
        }
        setErrors({});
        setActiveSection('basic');
    }, [metric, isOpen]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!editingMetric.id.trim()) {
            newErrors.id = '指标字段名不能为空';
        } else if (isNew && existingIds.includes(editingMetric.id)) {
            newErrors.id = '指标字段名已存在';
        } else if (!/^[a-z][a-z0-9_]*$/.test(editingMetric.id)) {
            newErrors.id = '字段名需以小写字母开头，只能包含小写字母、数字和下划线';
        }

        if (!editingMetric.name.trim()) {
            newErrors.name = '指标名称不能为空';
        } else if (isNew && existingNames.includes(editingMetric.name.trim())) {
            newErrors.name = '指标名称已存在，请使用唯一的名称';
        } else if (!isNew && metric?.name !== editingMetric.name.trim() && existingNames.includes(editingMetric.name.trim())) {
            newErrors.name = '指标名称已存在，请使用唯一的名称';
        }

        if (!editingMetric.businessOwner) {
            newErrors.businessOwner = '请选择业务负责人';
        }

        if (!editingMetric.dataOwner) {
            newErrors.dataOwner = '请选择数据负责人';
        }

        if (editingMetric.metricType === 'calculated' && !editingMetric.formula?.trim() && !editingMetric.formulaConfig) {
            newErrors.formula = '计算指标必须配置计算公式';
        }

        if (editingMetric.compatibleDims.length === 0) {
            newErrors.compatibleDims = '至少选择一个支持的维度';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            onSave({
                ...editingMetric,
                updatedAt: new Date().toISOString(),
            });
        }
    };

    const updateField = <K extends keyof Metric>(field: K, value: Metric[K]) => {
        setEditingMetric(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const updateDisplayFormat = (key: keyof MetricDisplayFormat, value: any) => {
        setEditingMetric(prev => ({
            ...prev,
            displayFormat: { ...prev.displayFormat, [key]: value }
        }));
    };

    const toggleDimension = (dimId: string) => {
        const dims = editingMetric.compatibleDims;
        if (dims.includes(dimId)) {
            updateField('compatibleDims', dims.filter(d => d !== dimId));
        } else {
            updateField('compatibleDims', [...dims, dimId]);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                    "bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col",
                    editingMetric.metricType === 'calculated' ? "w-[1000px]" : "w-[800px]"
                )}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-lg",
                            editingMetric.metricType === 'calculated'
                                ? "bg-purple-500/10 text-purple-600"
                                : "bg-blue-500/10 text-blue-600"
                        )}>
                            {editingMetric.metricType === 'calculated' ? <Code size={20} /> : <Database size={20} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">
                                {isNew ? '新建指标' : '编辑指标'}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {editingMetric.metricType === 'calculated' ? '计算指标' : '原子指标'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Section Tabs */}
                <div className="px-6 pt-4 flex gap-1 border-b border-border">
                    {[
                        { id: 'basic', label: '基础信息', icon: Info },
                        { id: 'source', label: '数据来源', icon: Table2 },
                        { id: 'format', label: '展示格式', icon: Settings2 },
                    ].map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id as typeof activeSection)}
                            className={cn(
                                "px-4 py-2.5 text-sm font-medium rounded-t-lg flex items-center gap-2 transition-all border-b-2 -mb-[2px]",
                                activeSection === section.id
                                    ? "bg-background border-primary text-primary"
                                    : "text-muted-foreground hover:text-foreground border-transparent"
                            )}
                        >
                            <section.icon size={16} />
                            {section.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        {activeSection === 'basic' && (
                            <motion.div
                                key="basic"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-6"
                            >
                                {/* Metric Type Toggle */}
                                <div>
                                    <label className="block text-sm font-medium mb-3">指标类型</label>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => updateField('metricType', 'atomic')}
                                            className={cn(
                                                "flex-1 p-4 rounded-xl border-2 transition-all",
                                                editingMetric.metricType === 'atomic'
                                                    ? "border-blue-500 bg-blue-500/5"
                                                    : "border-border hover:border-muted-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg",
                                                    editingMetric.metricType === 'atomic'
                                                        ? "bg-blue-500/20 text-blue-600"
                                                        : "bg-muted text-muted-foreground"
                                                )}>
                                                    <Database size={20} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-medium">原子指标</p>
                                                    <p className="text-xs text-muted-foreground">直接从数据表字段获取</p>
                                                </div>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => updateField('metricType', 'calculated')}
                                            className={cn(
                                                "flex-1 p-4 rounded-xl border-2 transition-all",
                                                editingMetric.metricType === 'calculated'
                                                    ? "border-purple-500 bg-purple-500/5"
                                                    : "border-border hover:border-muted-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg",
                                                    editingMetric.metricType === 'calculated'
                                                        ? "bg-purple-500/20 text-purple-600"
                                                        : "bg-muted text-muted-foreground"
                                                )}>
                                                    <Code size={20} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-medium">计算指标</p>
                                                    <p className="text-xs text-muted-foreground">通过公式计算得出</p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Basic Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">
                                            指标字段名 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editingMetric.id}
                                            onChange={(e) => updateField('id', e.target.value.toLowerCase())}
                                            disabled={!isNew}
                                            placeholder="例如: order_cnt"
                                            className={cn(
                                                "w-full px-3 py-2.5 bg-background border rounded-lg text-sm font-mono",
                                                errors.id ? "border-red-500" : "border-border",
                                                !isNew && "opacity-60 cursor-not-allowed"
                                            )}
                                        />
                                        {errors.id && <p className="text-xs text-red-500 mt-1">{errors.id}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">
                                            指标名称 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editingMetric.name}
                                            onChange={(e) => updateField('name', e.target.value)}
                                            placeholder="例如: 订单量"
                                            className={cn(
                                                "w-full px-3 py-2.5 bg-background border rounded-lg text-sm",
                                                errors.name ? "border-red-500" : "border-border"
                                            )}
                                        />
                                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">分组</label>
                                        <select
                                            value={editingMetric.group}
                                            onChange={(e) => updateField('group', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
                                        >
                                            {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">子分组</label>
                                        <input
                                            type="text"
                                            value={editingMetric.subGroup || ''}
                                            onChange={(e) => updateField('subGroup', e.target.value)}
                                            placeholder="例如: 订单漏斗"
                                            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">
                                            业务负责人 <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={editingMetric.businessOwner}
                                            onChange={(e) => updateField('businessOwner', e.target.value)}
                                            className={cn(
                                                "w-full px-3 py-2.5 bg-background border rounded-lg text-sm",
                                                errors.businessOwner ? "border-red-500" : "border-border"
                                            )}
                                        >
                                            <option value="">请选择</option>
                                            {BUSINESS_OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                        {errors.businessOwner && <p className="text-xs text-red-500 mt-1">{errors.businessOwner}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">
                                            数据负责人 <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={editingMetric.dataOwner}
                                            onChange={(e) => updateField('dataOwner', e.target.value)}
                                            className={cn(
                                                "w-full px-3 py-2.5 bg-background border rounded-lg text-sm",
                                                errors.dataOwner ? "border-red-500" : "border-border"
                                            )}
                                        >
                                            <option value="">请选择</option>
                                            {DATA_OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                        {errors.dataOwner && <p className="text-xs text-red-500 mt-1">{errors.dataOwner}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5">业务口径描述</label>
                                    <textarea
                                        value={editingMetric.description}
                                        onChange={(e) => updateField('description', e.target.value)}
                                        placeholder="描述该指标的业务含义和计算逻辑..."
                                        rows={3}
                                        className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm resize-none"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {activeSection === 'source' && (
                            <motion.div
                                key="source"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-6"
                            >
                                {editingMetric.metricType === 'atomic' ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1.5">数据表模型</label>
                                                <input
                                                    type="text"
                                                    value={editingMetric.sourceTable || ''}
                                                    onChange={(e) => updateField('sourceTable', e.target.value)}
                                                    placeholder="例如: dws_order_day"
                                                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1.5">表字段名</label>
                                                <input
                                                    type="text"
                                                    value={editingMetric.sourceField || ''}
                                                    onChange={(e) => updateField('sourceField', e.target.value)}
                                                    placeholder="例如: order_cnt"
                                                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1.5">聚合方式</label>
                                                <select
                                                    value={editingMetric.aggr}
                                                    onChange={(e) => updateField('aggr', e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
                                                >
                                                    {AGGREGATION_TYPES.filter(a => a !== 'CALC').map(a => (
                                                        <option key={a} value={a}>{a}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1.5">更新频率</label>
                                                <select
                                                    value={editingMetric.updateFrequency}
                                                    onChange={(e) => updateField('updateFrequency', e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
                                                >
                                                    <option value="实时">实时</option>
                                                    <option value="T+1">T+1</option>
                                                    <option value="T+2">T+2</option>
                                                    <option value="周">周</option>
                                                    <option value="月">月</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Visual Formula Builder */}
                                        <FormulaBuilder
                                            formulaConfig={editingMetric.formulaConfig}
                                            onChange={(config) => {
                                                setEditingMetric(prev => ({
                                                    ...prev,
                                                    formulaConfig: config,
                                                    formula: generateFormulaFromConfig(config, atomicMetrics),
                                                }));
                                            }}
                                            atomicMetrics={atomicMetrics}
                                            legacyFormula={editingMetric.formula}
                                            onLegacyFormulaChange={(formula) => updateField('formula', formula)}
                                        />
                                        {errors.formula && <p className="text-xs text-red-500 mt-1">{errors.formula}</p>}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1.5">更新频率</label>
                                                <select
                                                    value={editingMetric.updateFrequency}
                                                    onChange={(e) => updateField('updateFrequency', e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
                                                >
                                                    <option value="实时">实时</option>
                                                    <option value="T+1">T+1</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1.5">聚合标识</label>
                                                <div className="px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm font-mono text-muted-foreground">
                                                    CALC (计算指标)
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-medium mb-3">
                                        支持的维度 <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {AVAILABLE_DIMENSIONS.map(dim => (
                                            <button
                                                key={dim.id}
                                                onClick={() => toggleDimension(dim.id)}
                                                className={cn(
                                                    "px-3 py-2 rounded-lg text-sm border transition-all text-left",
                                                    editingMetric.compatibleDims.includes(dim.id)
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-border hover:border-muted-foreground"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {editingMetric.compatibleDims.includes(dim.id) ? (
                                                        <CheckSquare size={14} />
                                                    ) : (
                                                        <Square size={14} className="text-muted-foreground" />
                                                    )}
                                                    <span>{dim.name}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    {errors.compatibleDims && <p className="text-xs text-red-500 mt-2">{errors.compatibleDims}</p>}
                                </div>
                            </motion.div>
                        )}

                        {activeSection === 'format' && (
                            <motion.div
                                key="format"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">单位</label>
                                        <input
                                            type="text"
                                            value={editingMetric.unit}
                                            onChange={(e) => updateField('unit', e.target.value)}
                                            placeholder="例如: 单、%、秒"
                                            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">小数位数</label>
                                        <select
                                            value={editingMetric.displayFormat?.decimals ?? 2}
                                            onChange={(e) => updateDisplayFormat('decimals', parseInt(e.target.value))}
                                            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
                                        >
                                            {[0, 1, 2, 3, 4, 5, 6].map(n => (
                                                <option key={n} value={n}>{n} 位小数</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium">显示选项</label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={editingMetric.displayFormat?.isPercentage ?? false}
                                                onChange={(e) => updateDisplayFormat('isPercentage', e.target.checked)}
                                                className="w-4 h-4 rounded border-border text-primary"
                                            />
                                            <div className="flex items-center gap-2">
                                                <Percent size={16} className="text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">百分比格式</p>
                                                    <p className="text-xs text-muted-foreground">数值乘以100并添加%符号</p>
                                                </div>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={editingMetric.displayFormat?.useThousandSeparator ?? true}
                                                onChange={(e) => updateDisplayFormat('useThousandSeparator', e.target.checked)}
                                                className="w-4 h-4 rounded border-border text-primary"
                                            />
                                            <div className="flex items-center gap-2">
                                                <Hash size={16} className="text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">千位分隔符</p>
                                                    <p className="text-xs text-muted-foreground">例如: 1,234,567</p>
                                                </div>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={editingMetric.displayFormat?.abbreviate ?? false}
                                                onChange={(e) => updateDisplayFormat('abbreviate', e.target.checked)}
                                                className="w-4 h-4 rounded border-border text-primary"
                                            />
                                            <div>
                                                <p className="text-sm font-medium">大数缩写</p>
                                                <p className="text-xs text-muted-foreground">例如: 1.2k, 3.5M, 2.1B</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">前缀</label>
                                        <input
                                            type="text"
                                            value={editingMetric.displayFormat?.prefix || ''}
                                            onChange={(e) => updateDisplayFormat('prefix', e.target.value)}
                                            placeholder="例如: ¥"
                                            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">后缀</label>
                                        <input
                                            type="text"
                                            value={editingMetric.displayFormat?.suffix || ''}
                                            onChange={(e) => updateDisplayFormat('suffix', e.target.value)}
                                            placeholder="例如: 元"
                                            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="p-4 bg-muted/30 rounded-xl border border-border">
                                    <label className="block text-xs text-muted-foreground mb-2">格式预览</label>
                                    <div className="text-2xl font-bold">
                                        {(() => {
                                            let value = 12345.6789;
                                            const fmt = editingMetric.displayFormat || {};
                                            if (fmt.isPercentage) value = value * 100;
                                            let str = value.toFixed(fmt.decimals ?? 2);
                                            if (fmt.useThousandSeparator) {
                                                const parts = str.split('.');
                                                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                                                str = parts.join('.');
                                            }
                                            return `${fmt.prefix || ''}${str}${fmt.isPercentage ? '%' : ''}${fmt.suffix || ''}`;
                                        })()}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex justify-between items-center bg-muted/30">
                    <div className="text-xs text-muted-foreground">
                        {isNew ? '创建新指标' : `最后更新: ${new Date(editingMetric.updatedAt || '').toLocaleString('zh-CN')}`}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                            <Check size={16} />
                            {isNew ? '创建指标' : '保存更改'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Main Component
export default function MetricConfigPage({ metrics, onUpdateMetrics, onBack }: MetricConfigPageProps) {
    // Data source mode
    const [dataSourceMode, setDataSourceMode] = useState<MetricDataSourceMode>('excel');
    const [syncStatus, setSyncStatus] = useState<SyncStatus>({
        lastSyncTime: '2025-01-07 10:30:00',
        status: 'success',
        syncedCount: 156,
    });

    // Core state
    const [localMetrics, setLocalMetrics] = useState<Metric[]>(JSON.parse(JSON.stringify(metrics)));
    const [searchTerm, setSearchTerm] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'atomic' | 'calculated'>('all');

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Batch edit state
    const [batchEdit, setBatchEdit] = useState<BatchEditState>({
        isOpen: false,
        field: null,
        value: ''
    });

    // Filter state
    const [filterGroup, setFilterGroup] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    // Editor state
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingMetric, setEditingMetric] = useState<Metric | null>(null);

    // File input ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Computed values
    const filteredMetrics = useMemo(() => {
        return localMetrics.filter(m => {
            const matchesSearch =
                m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.description.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesGroup = !filterGroup || m.group === filterGroup;
            const matchesTab = activeTab === 'all' ||
                (activeTab === 'atomic' && m.metricType !== 'calculated') ||
                (activeTab === 'calculated' && m.metricType === 'calculated');

            return matchesSearch && matchesGroup && matchesTab;
        });
    }, [localMetrics, searchTerm, activeTab, filterGroup]);

    const atomicCount = localMetrics.filter(m => m.metricType !== 'calculated').length;
    const calculatedCount = localMetrics.filter(m => m.metricType === 'calculated').length;

    const isAllSelected = filteredMetrics.length > 0 && filteredMetrics.every(m => selectedIds.has(m.id));
    const isSomeSelected = filteredMetrics.some(m => selectedIds.has(m.id));

    const uniqueGroups = useMemo(() => [...new Set(localMetrics.map(m => m.group))], [localMetrics]);

    // Handlers
    const handleSelectAll = useCallback(() => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredMetrics.map(m => m.id)));
        }
    }, [isAllSelected, filteredMetrics]);

    const handleSelectOne = useCallback((id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const handleCreateMetric = () => {
        setEditingMetric(null);
        setEditorOpen(true);
    };

    const handleEditMetric = (metric: Metric) => {
        setEditingMetric(metric);
        setEditorOpen(true);
    };

    const handleSaveMetric = (metric: Metric) => {
        setLocalMetrics(prev => {
            const existingIndex = prev.findIndex(m => m.id === metric.id);
            if (existingIndex >= 0) {
                const newMetrics = [...prev];
                newMetrics[existingIndex] = metric;
                return newMetrics;
            } else {
                return [...prev, metric];
            }
        });
        setHasUnsavedChanges(true);
        setEditorOpen(false);
    };

    const handleDeleteSelected = () => {
        if (selectedIds.size === 0) return;
        if (window.confirm(`确定要删除选中的 ${selectedIds.size} 个指标吗？`)) {
            setLocalMetrics(prev => prev.filter(m => !selectedIds.has(m.id)));
            setSelectedIds(new Set());
            setHasUnsavedChanges(true);
        }
    };

    const handleBatchEdit = useCallback((field: BatchEditField) => {
        setBatchEdit({
            isOpen: true,
            field,
            value: field === 'tags' ? [] : field === 'displayFormat' ? { decimals: 2, isPercentage: false, useThousandSeparator: true } : ''
        });
    }, []);

    const applyBatchEdit = useCallback(() => {
        if (!batchEdit.field || selectedIds.size === 0) return;

        setLocalMetrics(prev => prev.map(m => {
            if (selectedIds.has(m.id)) {
                if (batchEdit.field === 'tags' && Array.isArray(batchEdit.value)) {
                    const newTags = [...new Set([...m.tags, ...batchEdit.value])];
                    return { ...m, tags: newTags };
                }
                if (batchEdit.field === 'displayFormat' && typeof batchEdit.value === 'object' && !Array.isArray(batchEdit.value)) {
                    return { ...m, displayFormat: { ...m.displayFormat, ...batchEdit.value } };
                }
                return { ...m, [batchEdit.field!]: batchEdit.value };
            }
            return m;
        }));

        setHasUnsavedChanges(true);
        setBatchEdit({ isOpen: false, field: null, value: '' });
        setSelectedIds(new Set());
    }, [batchEdit, selectedIds]);

    const saveChanges = useCallback(() => {
        onUpdateMetrics(localMetrics);
        setHasUnsavedChanges(false);
    }, [localMetrics, onUpdateMetrics]);

    const resetChanges = useCallback(() => {
        if (window.confirm('确定要放弃所有未保存的更改吗？')) {
            setLocalMetrics(JSON.parse(JSON.stringify(metrics)));
            setHasUnsavedChanges(false);
            setSelectedIds(new Set());
        }
    }, [metrics]);

    const handleSync = () => {
        setSyncStatus((prev: SyncStatus) => ({ ...prev, status: 'syncing' as const }));
        // Simulate sync
        setTimeout(() => {
            setSyncStatus({
                lastSyncTime: new Date().toLocaleString('zh-CN'),
                status: 'success',
                syncedCount: 158,
            });
        }, 2000);
    };

    const handleDownloadTemplate = () => {
        // Create CSV template
        const headers = [
            '指标字段名', '指标名称', '分组', '子分组', '指标类型', '计算公式',
            '数据表模型', '聚合方式', '单位', '支持维度', '业务负责人', '数据负责人',
            '更新频率', '业务描述', '小数位数', '是否百分比'
        ];
        const exampleRow = [
            'order_cnt', '订单量', '订单', '订单漏斗', 'atomic', '',
            'dws_order_day', 'SUM', '单', 'dt,city,service_type', '履约产品组', '履约数据团队',
            'T+1', '统计周期内的订单数量', '0', 'FALSE'
        ];
        const csv = [headers.join(','), exampleRow.join(',')].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = '指标模板.csv';
        link.click();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            // Simple CSV parsing (in production, use a proper CSV parser)
            const lines = text.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                alert('文件格式错误或没有数据');
                return;
            }

            const newMetrics: Metric[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                if (values.length >= 12 && values[0]) {
                    newMetrics.push({
                        id: values[0],
                        name: values[1],
                        group: values[2] || '订单',
                        subGroup: values[3],
                        metricType: values[4] === 'calculated' ? 'calculated' : 'atomic',
                        formula: values[5],
                        sourceTable: values[6],
                        aggr: values[7] || 'SUM',
                        unit: values[8] || '单',
                        compatibleDims: (values[9] || 'dt').split(',').map(d => d.trim()),
                        businessOwner: values[10] || '',
                        dataOwner: values[11] || '',
                        updateFrequency: values[12] || 'T+1',
                        description: values[13] || '',
                        displayFormat: {
                            decimals: parseInt(values[14]) || 2,
                            isPercentage: values[15]?.toLowerCase() === 'true',
                        },
                        tags: [],
                        dataSource: 'manual',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    });
                }
            }

            if (newMetrics.length > 0) {
                setLocalMetrics(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const toAdd = newMetrics.filter(m => !existingIds.has(m.id));
                    const toUpdate = newMetrics.filter(m => existingIds.has(m.id));

                    let updated = [...prev];
                    toUpdate.forEach(metric => {
                        const idx = updated.findIndex(m => m.id === metric.id);
                        if (idx >= 0) updated[idx] = { ...updated[idx], ...metric };
                    });

                    return [...updated, ...toAdd];
                });
                setHasUnsavedChanges(true);
                alert(`成功导入 ${newMetrics.length} 个指标`);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b border-border bg-card shadow-sm sticky top-0 z-30">
                <div className="max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Database className="text-primary" size={20} />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">指标元数据管理</h1>
                                <p className="text-xs text-muted-foreground">
                                    管理 {localMetrics.length} 个指标
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {hasUnsavedChanges && (
                            <span className="text-xs text-amber-500 font-medium animate-pulse flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                有未保存的更改
                            </span>
                        )}
                        <button
                            onClick={resetChanges}
                            disabled={!hasUnsavedChanges}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <RotateCcw size={16} /> 放弃
                        </button>
                        <button
                            onClick={saveChanges}
                            disabled={!hasUnsavedChanges}
                            className="px-5 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg disabled:opacity-50 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                            <Save size={16} /> 保存
                        </button>
                    </div>
                </div>
            </header>

            {/* Data Source Mode Tabs */}
            <div className="border-b border-border bg-card">
                <div className="max-w-[1800px] mx-auto px-6">
                    <div className="flex">
                        <button
                            onClick={() => setDataSourceMode('platform')}
                            className={cn(
                                "px-6 py-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2",
                                dataSourceMode === 'platform'
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Cloud size={18} />
                            平台同步
                            <span className="px-2 py-0.5 bg-muted rounded text-xs">长期方案</span>
                        </button>
                        <button
                            onClick={() => setDataSourceMode('excel')}
                            className={cn(
                                "px-6 py-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2",
                                dataSourceMode === 'excel'
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <FileSpreadsheet size={18} />
                            Excel上传
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">当前使用</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Batch Action Bar */}
            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="sticky top-16 z-20 bg-primary text-primary-foreground shadow-lg"
                    >
                        <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="font-medium">已选择 {selectedIds.size} 个指标</span>
                                <button onClick={() => setSelectedIds(new Set())} className="text-sm underline opacity-80 hover:opacity-100">
                                    取消选择
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm opacity-80 mr-2">批量操作:</span>
                                <button onClick={() => handleBatchEdit('businessOwner')} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
                                    <User size={14} /> 业务负责人
                                </button>
                                <button onClick={() => handleBatchEdit('dataOwner')} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
                                    <Database size={14} /> 数据负责人
                                </button>
                                <button onClick={() => handleBatchEdit('group')} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
                                    <Layers size={14} /> 分组
                                </button>
                                <button onClick={() => handleBatchEdit('displayFormat')} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
                                    <Settings2 size={14} /> 设置格式
                                </button>
                                <div className="w-px h-6 bg-white/30 mx-1" />
                                <button onClick={handleDeleteSelected} className="px-3 py-1.5 bg-red-500/30 hover:bg-red-500/50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
                                    <Trash2 size={14} /> 删除
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 p-6 max-w-[1800px] mx-auto w-full">
                <AnimatePresence mode="wait">
                    {dataSourceMode === 'platform' ? (
                        /* Platform Sync Mode */
                        <motion.div
                            key="platform"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="bg-card border border-border rounded-2xl p-8 text-center">
                                <div className="max-w-md mx-auto space-y-6">
                                    <div className={cn(
                                        "w-20 h-20 rounded-2xl flex items-center justify-center mx-auto",
                                        syncStatus.status === 'success' ? "bg-green-500/10" :
                                            syncStatus.status === 'syncing' ? "bg-blue-500/10" :
                                                syncStatus.status === 'failed' ? "bg-red-500/10" : "bg-muted"
                                    )}>
                                        {syncStatus.status === 'syncing' ? (
                                            <RefreshCcw size={32} className="text-blue-500 animate-spin" />
                                        ) : syncStatus.status === 'success' ? (
                                            <CheckCircle size={32} className="text-green-500" />
                                        ) : syncStatus.status === 'failed' ? (
                                            <AlertCircle size={32} className="text-red-500" />
                                        ) : (
                                            <Cloud size={32} className="text-muted-foreground" />
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold mb-2">集团指标服务平台同步</h3>
                                        <p className="text-muted-foreground">
                                            自动从集团统一指标平台同步指标元数据，确保数据一致性
                                        </p>
                                    </div>

                                    <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">同步状态</span>
                                            <span className={cn(
                                                "font-medium",
                                                syncStatus.status === 'success' ? "text-green-600" :
                                                    syncStatus.status === 'syncing' ? "text-blue-600" :
                                                        syncStatus.status === 'failed' ? "text-red-600" : ""
                                            )}>
                                                {syncStatus.status === 'syncing' ? '同步中...' :
                                                    syncStatus.status === 'success' ? '同步成功' :
                                                        syncStatus.status === 'failed' ? '同步失败' : '未同步'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">最后同步时间</span>
                                            <span>{syncStatus.lastSyncTime}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">同步指标数</span>
                                            <span>{syncStatus.syncedCount} 个</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSync}
                                        disabled={syncStatus.status === 'syncing'}
                                        className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-50 transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
                                    >
                                        <RefreshCcw size={18} className={syncStatus.status === 'syncing' ? 'animate-spin' : ''} />
                                        {syncStatus.status === 'syncing' ? '同步中...' : '立即同步'}
                                    </button>

                                    <p className="text-xs text-muted-foreground">
                                        注：平台同步功能正在对接中，敬请期待
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* Excel Upload Mode */
                        <motion.div
                            key="excel"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Toolbar */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                                    <button
                                        onClick={() => setActiveTab('all')}
                                        className={cn(
                                            "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                            activeTab === 'all' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        全部 ({localMetrics.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('atomic')}
                                        className={cn(
                                            "px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                                            activeTab === 'atomic' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Database size={14} />
                                        原子指标 ({atomicCount})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('calculated')}
                                        className={cn(
                                            "px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                                            activeTab === 'calculated' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Code size={14} />
                                        计算指标 ({calculatedCount})
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="relative w-72">
                                        <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="搜索指标..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>

                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={cn(
                                            "px-3 py-2 border rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                                            showFilters ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                                        )}
                                    >
                                        <Filter size={16} />
                                        筛选
                                    </button>

                                    <div className="w-px h-8 bg-border" />

                                    <button
                                        onClick={handleDownloadTemplate}
                                        className="px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
                                    >
                                        <Download size={16} />
                                        下载模板
                                    </button>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv,.xlsx,.xls"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
                                    >
                                        <Upload size={16} />
                                        上传Excel
                                    </button>

                                    <button
                                        onClick={handleCreateMetric}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        新建指标
                                    </button>
                                </div>
                            </div>

                            {/* Filter Panel */}
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 bg-muted/30 rounded-lg border border-border flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm text-muted-foreground">分组:</label>
                                                <select
                                                    value={filterGroup}
                                                    onChange={(e) => setFilterGroup(e.target.value)}
                                                    className="px-3 py-1.5 bg-background border border-border rounded-md text-sm"
                                                >
                                                    <option value="">全部</option>
                                                    {uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                                </select>
                                            </div>
                                            {filterGroup && (
                                                <button onClick={() => setFilterGroup('')} className="text-sm text-primary hover:underline">
                                                    清除筛选
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Table */}
                            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                            <tr>
                                                <th className="px-4 py-4 w-12">
                                                    <button onClick={handleSelectAll} className="p-1 hover:bg-muted rounded transition-colors">
                                                        {isAllSelected ? <CheckSquare size={18} className="text-primary" /> :
                                                            isSomeSelected ? <Minus size={18} className="text-primary" /> :
                                                                <Square size={18} />}
                                                    </button>
                                                </th>
                                                <th className="px-4 py-4 w-32 min-w-[120px]">指标 Code</th>
                                                <th className="px-4 py-4 w-36 min-w-[100px]">指标名称</th>
                                                <th className="px-4 py-4 w-24">类型</th>
                                                <th className="px-4 py-4 w-28">分组</th>
                                                <th className="px-4 py-4 min-w-[180px]">指标口径</th>
                                                <th className="px-4 py-4 w-44">数据来源 (表.字段)</th>
                                                <th className="px-4 py-4 w-28">业务负责人</th>
                                                <th className="px-4 py-4 w-28">数据负责人</th>
                                                <th className="px-4 py-4 w-20">格式</th>
                                                <th className="px-4 py-4 w-16">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredMetrics.map(metric => {
                                                const isSelected = selectedIds.has(metric.id);
                                                return (
                                                    <tr key={metric.id} className={cn("hover:bg-muted/20 transition-colors", isSelected && "bg-primary/5")}>
                                                        <td className="px-4 py-4">
                                                            <button onClick={() => handleSelectOne(metric.id)} className="p-1 hover:bg-muted rounded transition-colors">
                                                                {isSelected ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} className="text-muted-foreground" />}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm font-bold font-mono text-foreground/80">{metric.id}</div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="font-medium">{metric.name}</div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className={cn(
                                                                "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                                                                metric.metricType === 'calculated'
                                                                    ? "bg-purple-500/10 text-purple-600"
                                                                    : "bg-blue-500/10 text-blue-600"
                                                            )}>
                                                                {metric.metricType === 'calculated' ? <Code size={12} /> : <Database size={12} />}
                                                                {metric.metricType === 'calculated' ? '计算' : '原子'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm">{metric.group}</div>
                                                            {metric.subGroup && <div className="text-xs text-muted-foreground">{metric.subGroup}</div>}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={metric.description}>
                                                                {metric.description || <span className="text-muted-foreground/50 italic">未填写</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            {metric.metricType === 'calculated' ? (
                                                                <span className="text-xs font-mono text-purple-600 truncate block max-w-[160px]" title={metric.formula}>
                                                                    {metric.formula || '-'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs font-mono text-muted-foreground">
                                                                    {metric.sourceTable && metric.sourceField ? (
                                                                        <span title={`${metric.sourceTable}.${metric.sourceField}`}>
                                                                            <span className="text-foreground/70">{metric.sourceTable}</span>
                                                                            <span className="text-primary">.</span>
                                                                            <span className="text-blue-600">{metric.sourceField}</span>
                                                                        </span>
                                                                    ) : metric.sourceTable ? (
                                                                        metric.sourceTable
                                                                    ) : '-'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 text-xs">{metric.businessOwner || <span className="text-muted-foreground">-</span>}</td>
                                                        <td className="px-4 py-4 text-xs">{metric.dataOwner || <span className="text-muted-foreground">-</span>}</td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                {metric.displayFormat?.isPercentage && <Percent size={12} />}
                                                                <span>{metric.displayFormat?.decimals ?? 2}位</span>
                                                                <span>{metric.unit}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <button
                                                                onClick={() => handleEditMetric(metric)}
                                                                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                                            >
                                                                <Edit3 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {filteredMetrics.length === 0 && (
                                    <div className="py-16 text-center text-muted-foreground">
                                        <FileSpreadsheet size={48} className="mx-auto mb-4 opacity-30" />
                                        <p className="mb-4">没有找到匹配的指标</p>
                                        <button onClick={handleCreateMetric} className="text-primary hover:underline">
                                            创建新指标
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Metric Editor Modal */}
            <AnimatePresence>
                {editorOpen && (
                    <MetricEditor
                        metric={editingMetric}
                        isOpen={editorOpen}
                        onClose={() => setEditorOpen(false)}
                        onSave={handleSaveMetric}
                        existingIds={localMetrics.map(m => m.id)}
                        existingNames={localMetrics.map(m => m.name)}
                        atomicMetrics={localMetrics.filter(m => m.metricType !== 'calculated')}
                    />
                )}
            </AnimatePresence>

            {/* Batch Edit Modal */}
            <AnimatePresence>
                {batchEdit.isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={() => setBatchEdit({ isOpen: false, field: null, value: '' })}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-xl shadow-2xl w-[480px] overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                                <h3 className="font-bold text-lg">
                                    批量编辑 - {
                                        batchEdit.field === 'businessOwner' ? '业务负责人' :
                                            batchEdit.field === 'dataOwner' ? '数据负责人' :
                                                batchEdit.field === 'group' ? '分组' : ''
                                    }
                                </h3>
                                <button onClick={() => setBatchEdit({ isOpen: false, field: null, value: '' })} className="p-1 hover:bg-muted rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    将为选中的 <span className="font-bold text-foreground">{selectedIds.size}</span> 个指标批量设置
                                </p>

                                {batchEdit.field === 'businessOwner' && (
                                    <select
                                        value={batchEdit.value as string}
                                        onChange={(e) => setBatchEdit(prev => ({ ...prev, value: e.target.value }))}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:border-primary outline-none"
                                    >
                                        <option value="">选择业务负责人</option>
                                        {BUSINESS_OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                )}

                                {batchEdit.field === 'dataOwner' && (
                                    <select
                                        value={batchEdit.value as string}
                                        onChange={(e) => setBatchEdit(prev => ({ ...prev, value: e.target.value }))}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:border-primary outline-none"
                                    >
                                        <option value="">选择数据负责人</option>
                                        {DATA_OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                )}

                                {
                                    batchEdit.field === 'group' ? (
                                        <select
                                            value={batchEdit.value as string}
                                            onChange={(e) => setBatchEdit(prev => ({ ...prev, value: e.target.value }))}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:border-primary outline-none"
                                        >
                                            <option value="">选择分组</option>
                                            {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    ) : null
                                }

                                {batchEdit.field === 'displayFormat' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1.5">小数位数</label>
                                                <select
                                                    value={(batchEdit.value as MetricDisplayFormat).decimals ?? 2}
                                                    onChange={(e) => setBatchEdit(prev => ({
                                                        ...prev,
                                                        value: { ...(prev.value as MetricDisplayFormat), decimals: parseInt(e.target.value) }
                                                    }))}
                                                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
                                                >
                                                    {[0, 1, 2, 3, 4, 5, 6].map(n => (
                                                        <option key={n} value={n}>{n} 位小数</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={(batchEdit.value as MetricDisplayFormat).isPercentage ?? false}
                                                    onChange={(e) => setBatchEdit(prev => ({
                                                        ...prev,
                                                        value: { ...(prev.value as MetricDisplayFormat), isPercentage: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 rounded border-border text-primary"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Percent size={16} className="text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">百分比格式</p>
                                                        <p className="text-xs text-muted-foreground">数值乘以100并添加%符号</p>
                                                    </div>
                                                </div>
                                            </label>

                                            <label className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={(batchEdit.value as MetricDisplayFormat).useThousandSeparator ?? true}
                                                    onChange={(e) => setBatchEdit(prev => ({
                                                        ...prev,
                                                        value: { ...(prev.value as MetricDisplayFormat), useThousandSeparator: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 rounded border-border text-primary"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Hash size={16} className="text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">千位分隔符</p>
                                                        <p className="text-xs text-muted-foreground">例如: 1,234,567</p>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Preview */}
                                        <div className="p-4 bg-muted/30 rounded-xl border border-border">
                                            <label className="block text-xs text-muted-foreground mb-2">格式预览</label>
                                            <div className="text-2xl font-bold">
                                                {(() => {
                                                    let value = 12345.6789;
                                                    const fmt = batchEdit.value as MetricDisplayFormat;
                                                    if (fmt.isPercentage) value = value * 100;
                                                    let str = value.toFixed(fmt.decimals ?? 2);
                                                    if (fmt.useThousandSeparator) {
                                                        const parts = str.split('.');
                                                        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                                                        str = parts.join('.');
                                                    }
                                                    return `${fmt.prefix || ''}${str}${fmt.isPercentage ? '%' : ''}${fmt.suffix || ''}`;
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
                                <button
                                    onClick={() => setBatchEdit({ isOpen: false, field: null, value: '' })}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={applyBatchEdit}
                                    disabled={!batchEdit.value}
                                    className="px-6 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg disabled:opacity-50 transition-all flex items-center gap-2"
                                >
                                    <Check size={16} /> 应用更改
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
