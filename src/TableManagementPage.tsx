/**
 * Table Management Page
 * Parse DDL and convert table fields to metrics and dimensions
 * Phase 2: Added Table List View as entry point
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
    ArrowLeft, Save, Database, Table2, Upload, FileText, Code, Eye, EyeOff,
    Check, X, Plus, ChevronDown, ChevronRight, AlertCircle, CheckCircle,
    BarChart3, Hash, Layers, Settings2, RefreshCcw, Copy, Download,
    HelpCircle, Sparkles, ArrowRight, Edit3, Trash2, Clock, Search, MoreHorizontal
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { parseTableDefinition, SAMPLE_DESC_OUTPUT, SAMPLE_CREATE_TABLE } from './lib/tableParser';
import type { ParsedField, TableDefinition, FieldClassification } from './types/table';
import type { Metric, Dimension } from './types';

// Mock imported tables for list view (in real app, this would be persisted)
interface ImportedTable {
    id: string;
    tableName: string;
    database?: string;
    comment?: string;
    metricsCount: number;
    dimensionsCount: number;
    importedAt: string;
    updatedAt: string;
    status: 'draft' | 'imported' | 'published';
    fields: ParsedField[];
}

// Initial mock data for imported tables
const INITIAL_IMPORTED_TABLES: ImportedTable[] = [
    {
        id: 'tbl_1',
        tableName: 'dws_order_day',
        database: 'dws',
        comment: '订单日汇总表',
        metricsCount: 8,
        dimensionsCount: 5,
        importedAt: '2025-01-05 14:30:00',
        updatedAt: '2025-01-07 09:15:00',
        status: 'published',
        fields: []
    },
    {
        id: 'tbl_2',
        tableName: 'dws_user_behavior',
        database: 'dws',
        comment: '用户行为汇总表',
        metricsCount: 12,
        dimensionsCount: 6,
        importedAt: '2025-01-04 10:20:00',
        updatedAt: '2025-01-06 16:45:00',
        status: 'published',
        fields: []
    },
    {
        id: 'tbl_3',
        tableName: 'ads_supply_chain_report',
        database: 'ads',
        comment: '供应链报表',
        metricsCount: 6,
        dimensionsCount: 4,
        importedAt: '2025-01-06 08:00:00',
        updatedAt: '2025-01-06 08:00:00',
        status: 'draft',
        fields: []
    }
];

interface TableManagementPageProps {
    onBack: () => void;
    onImportMetrics: (metrics: Metric[]) => void;
    onImportDimensions: (dimensions: Dimension[]) => void;
    existingMetricIds: string[];
    existingDimensionIds: string[];
    embedded?: boolean;  // When true, hide the page header (used in unified config page)
}

// Classification button component
function ClassificationSwitch({
    value,
    onChange,
    disabled
}: {
    value: FieldClassification;
    onChange: (v: FieldClassification) => void;
    disabled?: boolean;
}) {
    return (
        <div className={cn(
            "inline-flex items-center p-0.5 bg-muted/50 rounded-lg",
            disabled && "opacity-50 pointer-events-none"
        )}>
            <button
                onClick={() => onChange('dimension')}
                className={cn(
                    "px-2 py-1 text-xs font-medium rounded transition-all",
                    value === 'dimension'
                        ? "bg-purple-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                维度
            </button>
            <button
                onClick={() => onChange('metric')}
                className={cn(
                    "px-2 py-1 text-xs font-medium rounded transition-all",
                    value === 'metric'
                        ? "bg-blue-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                指标
            </button>
            <button
                onClick={() => onChange('hidden')}
                className={cn(
                    "px-2 py-1 text-xs font-medium rounded transition-all",
                    value === 'hidden'
                        ? "bg-gray-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                隐藏
            </button>
        </div>
    );
}

// Default values
const DEFAULT_GROUPS = ['订单', '用户', '效率', '时长', '体验', '车辆', '财务', '转化', '供应链'];
const DEFAULT_BUSINESS_OWNERS = [
    '张明 (履约PM)', '李娜 (用户增长PM)', '王强 (体验PM)', '刘洋 (供应链PM)',
    '陈静 (营销PM)', '赵伟 (财务PM)', '周芳 (运营PM)', '吴磊 (战略PM)'
];
const DEFAULT_DATA_OWNERS = [
    '孙浩 (履约数据)', '钱丽 (用户数据)', '郑凯 (体验数据)', '冯雪 (供应链数据)',
    '蒋涛 (营销数据)', '沈婷 (财务数据)', '韩冰 (运营数据)', '杨帆 (平台数据)'
];

export default function TableManagementPage({
    onBack,
    onImportMetrics,
    onImportDimensions,
    existingMetricIds,
    existingDimensionIds,
    embedded = false
}: TableManagementPageProps) {
    // View state: list (default) or wizard
    const [viewMode, setViewMode] = useState<'list' | 'wizard'>('list');
    const [editingTableId, setEditingTableId] = useState<string | null>(null);

    // Imported tables state
    const [importedTables, setImportedTables] = useState<ImportedTable[]>(INITIAL_IMPORTED_TABLES);
    const [searchTerm, setSearchTerm] = useState('');

    // Step state (for wizard)
    const [currentStep, setCurrentStep] = useState<'input' | 'configure' | 'confirm'>('input');

    // DDL input state
    const [ddlInput, setDdlInput] = useState('');
    const [parseError, setParseError] = useState<string | null>(null);

    // Parsed fields state
    const [tableName, setTableName] = useState('');
    const [tableComment, setTableComment] = useState('');
    const [fields, setFields] = useState<ParsedField[]>([]);

    // Import config state
    const [defaultGroup, setDefaultGroup] = useState('订单');
    const [defaultBusinessOwner, setDefaultBusinessOwner] = useState('');
    const [defaultDataOwner, setDefaultDataOwner] = useState('');
    const [autoLinkDimensions, setAutoLinkDimensions] = useState(true);

    // Parse DDL
    const handleParse = useCallback(() => {
        if (!ddlInput.trim()) {
            setParseError('请输入 DESC 输出或 CREATE TABLE 语句');
            return;
        }

        const result = parseTableDefinition(ddlInput);

        if (!result.success) {
            setParseError(result.errors?.join(', ') || '解析失败');
            return;
        }

        setTableName(result.tableName || 'unknown_table');
        setTableComment(result.tableComment || '');
        setFields(result.fields || []);
        setParseError(null);
        setCurrentStep('configure');
    }, [ddlInput]);

    // Update field classification
    const updateFieldClassification = useCallback((id: string, classification: FieldClassification) => {
        setFields(prev => prev.map(f =>
            f.id === id ? { ...f, classification } : f
        ));
    }, []);

    // Update field display name
    const updateFieldDisplayName = useCallback((id: string, displayName: string) => {
        setFields(prev => prev.map(f =>
            f.id === id ? { ...f, displayName } : f
        ));
    }, []);

    // Update field aggregation
    const updateFieldAggr = useCallback((id: string, aggr: string) => {
        setFields(prev => prev.map(f =>
            f.id === id ? { ...f, suggestedAggr: aggr } : f
        ));
    }, []);

    // Batch set all visible to metric/dimension
    const batchSetClassification = useCallback((classification: FieldClassification) => {
        setFields(prev => prev.map(f =>
            f.classification !== 'hidden' ? { ...f, classification } : f
        ));
    }, []);

    // Computed metrics and dimensions
    const metricFields = useMemo(() =>
        fields.filter(f => f.classification === 'metric'),
        [fields]
    );

    const dimensionFields = useMemo(() =>
        fields.filter(f => f.classification === 'dimension'),
        [fields]
    );

    // Check for conflicts
    const conflictingMetrics = useMemo(() =>
        metricFields.filter(f => existingMetricIds.includes(f.fieldName)),
        [metricFields, existingMetricIds]
    );

    const conflictingDimensions = useMemo(() =>
        dimensionFields.filter(f => existingDimensionIds.includes(f.fieldName)),
        [dimensionFields, existingDimensionIds]
    );

    // Handle import
    const handleImport = useCallback(() => {
        // Convert to metrics
        const newMetrics: Metric[] = metricFields.map(f => ({
            id: f.fieldName,
            name: f.displayName || f.comment || f.fieldName,
            group: defaultGroup,
            tags: [],
            compatibleDims: autoLinkDimensions
                ? dimensionFields.map(d => d.fieldName)
                : ['dt'],
            description: f.comment,
            businessOwner: defaultBusinessOwner,
            dataOwner: defaultDataOwner,
            metricType: 'atomic' as const,
            sourceTable: tableName,
            sourceField: f.fieldName,
            displayFormat: {
                decimals: f.dataTypeCategory === 'numeric' && f.fieldName.includes('rate') ? 2 : 0,
                isPercentage: f.fieldName.includes('rate') || f.fieldName.includes('pct'),
                useThousandSeparator: true,
            },
            updateFrequency: 'T+1',
            aggr: f.suggestedAggr || 'SUM',
            unit: f.fieldName.includes('rate') ? '%' : '单',
            dataSource: 'platform' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }));

        // Convert to dimensions
        const newDimensions: Dimension[] = dimensionFields.map(f => ({
            id: f.fieldName,
            name: f.displayName || f.comment || f.fieldName,
            group: f.isPartition ? '时间' : '业务',
            description: f.comment,
            isEnumerable: !f.isPartition, // Non-partition fields are typically enumerable
            enumValues: [],
            dataType: f.dataTypeCategory === 'numeric' ? 'number' as const :
                f.dataTypeCategory === 'datetime' ? 'date' as const :
                    f.dataTypeCategory === 'boolean' ? 'boolean' as const : 'string' as const,
            sourceTable: tableName,
            sourceField: f.fieldName,
            status: 'draft' as const,
            businessOwner: defaultBusinessOwner,
            dataOwner: defaultDataOwner,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }));

        onImportMetrics(newMetrics);
        onImportDimensions(newDimensions);

        // Show success and go back
        onBack();
    }, [metricFields, dimensionFields, tableName, defaultGroup, defaultBusinessOwner, defaultDataOwner, autoLinkDimensions, onImportMetrics, onImportDimensions, onBack]);

    // Load sample
    const loadSample = (type: 'desc' | 'create') => {
        setDdlInput(type === 'desc' ? SAMPLE_DESC_OUTPUT : SAMPLE_CREATE_TABLE);
        setParseError(null);
    };

    // Filtered tables for search
    const filteredTables = useMemo(() => {
        if (!searchTerm) return importedTables;
        const term = searchTerm.toLowerCase();
        return importedTables.filter(t =>
            t.tableName.toLowerCase().includes(term) ||
            t.comment?.toLowerCase().includes(term) ||
            t.database?.toLowerCase().includes(term)
        );
    }, [importedTables, searchTerm]);

    // Handle starting the wizard for a new table
    const handleAddNewTable = () => {
        setViewMode('wizard');
        setCurrentStep('input');
        setDdlInput('');
        setFields([]);
        setTableName('');
        setEditingTableId(null);
    };

    // Handle editing an existing table
    const handleEditTable = (tableId: string) => {
        const table = importedTables.find(t => t.id === tableId);
        if (table && table.fields.length > 0) {
            setEditingTableId(tableId);
            setTableName(table.tableName);
            setTableComment(table.comment || '');
            setFields(table.fields);
            setViewMode('wizard');
            setCurrentStep('configure');
        }
    };

    // Handle deleting a table
    const handleDeleteTable = (tableId: string) => {
        if (window.confirm('确定要删除此表模型吗？关联的指标和维度不会被删除。')) {
            setImportedTables(prev => prev.filter(t => t.id !== tableId));
        }
    };

    // Handle returning to list from wizard
    const handleBackToList = () => {
        setViewMode('list');
        setCurrentStep('input');
        setDdlInput('');
        setFields([]);
        setEditingTableId(null);
    };

    // --- LIST VIEW ---
    if (viewMode === 'list') {
        return (
            <div className="min-h-screen bg-[#f5f7fa] flex flex-col">
                {/* Header - hidden in embedded mode */}
                {!embedded && (
                    <header className="border-b border-border bg-card shadow-sm sticky top-0 z-30">
                        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/10 rounded-lg">
                                        <Table2 className="text-green-600" size={20} />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold">表模型管理</h1>
                                        <p className="text-xs text-muted-foreground">
                                            管理 {importedTables.length} 个表模型 · 解析物理表结构，一键生成指标与维度
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleAddNewTable}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                <Plus size={18} />
                                导入新表
                            </button>
                        </div>
                    </header>
                )}

                {/* Main Content - Table List */}
                <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="relative w-80">
                            <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="搜索表名或备注..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-muted-foreground">
                                共 {filteredTables.length} 个表模型
                            </div>
                            {/* Show "Add New Table" button in embedded mode */}
                            {embedded && (
                                <button
                                    onClick={handleAddNewTable}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                                >
                                    <Plus size={18} />
                                    导入新表
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table List */}
                    {filteredTables.length > 0 ? (
                        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 text-left">表名</th>
                                        <th className="px-4 py-4 text-left">备注</th>
                                        <th className="px-4 py-4 text-center">指标数</th>
                                        <th className="px-4 py-4 text-center">维度数</th>
                                        <th className="px-4 py-4 text-center">状态</th>
                                        <th className="px-4 py-4 text-left">导入时间</th>
                                        <th className="px-4 py-4 text-left">更新时间</th>
                                        <th className="px-4 py-4 text-center w-24">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredTables.map(table => (
                                        <tr key={table.id} className="hover:bg-muted/20 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-green-500/10 rounded-lg">
                                                        <Database size={16} className="text-green-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-mono font-bold text-foreground">
                                                            {table.database && <span className="text-muted-foreground">{table.database}.</span>}
                                                            {table.tableName}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-muted-foreground">
                                                {table.comment || '-'}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="px-2 py-1 bg-blue-500/10 text-blue-600 rounded text-xs font-medium">
                                                    {table.metricsCount}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="px-2 py-1 bg-purple-500/10 text-purple-600 rounded text-xs font-medium">
                                                    {table.dimensionsCount}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={cn(
                                                    "px-2 py-1 rounded text-xs font-medium",
                                                    table.status === 'published' && "bg-green-500/10 text-green-600",
                                                    table.status === 'draft' && "bg-amber-500/10 text-amber-600",
                                                    table.status === 'imported' && "bg-blue-500/10 text-blue-600"
                                                )}>
                                                    {table.status === 'published' ? '已发布' :
                                                        table.status === 'draft' ? '草稿' : '已导入'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-muted-foreground text-xs">
                                                {table.importedAt}
                                            </td>
                                            <td className="px-4 py-4 text-muted-foreground text-xs">
                                                {table.updatedAt}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditTable(table.id)}
                                                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                                        title="编辑映射"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTable(table.id)}
                                                        className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"
                                                        title="删除"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-card border border-border rounded-xl p-16 text-center">
                            <Database size={48} className="mx-auto mb-4 text-muted-foreground/30" />
                            <h3 className="text-lg font-bold mb-2">暂无表模型</h3>
                            <p className="text-muted-foreground mb-6">
                                导入物理表的DDL结构，自动生成指标和维度定义
                            </p>
                            <button
                                onClick={handleAddNewTable}
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
                            >
                                <Plus size={18} />
                                导入第一个表
                            </button>
                        </div>
                    )}

                    {/* Quick Guide */}
                    <div className="mt-8 grid grid-cols-3 gap-6">
                        <div className="bg-card border border-border rounded-xl p-6">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4">
                                <Database size={20} />
                            </div>
                            <h3 className="font-bold mb-2">步骤一：导入表结构</h3>
                            <p className="text-sm text-muted-foreground">
                                粘贴 <code className="px-1.5 py-0.5 bg-muted rounded text-xs">DESC</code> 输出或 <code className="px-1.5 py-0.5 bg-muted rounded text-xs">CREATE TABLE</code> 语句
                            </p>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-6">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center mb-4">
                                <Layers size={20} />
                            </div>
                            <h3 className="font-bold mb-2">步骤二：配置字段映射</h3>
                            <p className="text-sm text-muted-foreground">
                                智能识别字段类型，手动调整<span className="text-purple-600 font-medium">维度</span>和<span className="text-blue-600 font-medium">指标</span>归类
                            </p>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-6">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center mb-4">
                                <CheckCircle size={20} />
                            </div>
                            <h3 className="font-bold mb-2">步骤三：一键导入</h3>
                            <p className="text-sm text-muted-foreground">
                                确认后自动生成指标与维度元数据，并建立关联关系
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // --- WIZARD VIEW ---
    return (
        <div className="min-h-screen bg-[#f5f7fa] flex flex-col">
            {/* Header - hidden in embedded mode */}
            {!embedded && (
                <header className="border-b border-border bg-card shadow-sm sticky top-0 z-30">
                    <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={handleBackToList} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <Table2 className="text-green-600" size={20} />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold">
                                        {editingTableId ? '编辑表映射' : '导入新表'}
                                    </h1>
                                    <p className="text-xs text-muted-foreground">
                                        解析物理表结构，一键生成指标与维度
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step indicator */}
                        <div className="flex items-center gap-2">
                            {[
                                { id: 'input', label: '粘贴DDL', icon: FileText },
                                { id: 'configure', label: '配置映射', icon: Settings2 },
                                { id: 'confirm', label: '确认导入', icon: Check },
                            ].map((step, idx) => (
                                <React.Fragment key={step.id}>
                                    {idx > 0 && <ChevronRight size={16} className="text-muted-foreground" />}
                                    <div className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                                        currentStep === step.id
                                            ? "bg-primary text-primary-foreground"
                                            : (currentStep === 'confirm' && step.id !== 'confirm') ||
                                                (currentStep === 'configure' && step.id === 'input')
                                                ? "bg-green-100 text-green-700"
                                                : "bg-muted text-muted-foreground"
                                    )}>
                                        {((currentStep === 'confirm' && step.id !== 'confirm') ||
                                            (currentStep === 'configure' && step.id === 'input'))
                                            ? <CheckCircle size={14} />
                                            : <step.icon size={14} />
                                        }
                                        {step.label}
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </header>
            )}

            {/* Main Content */}
            <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full">
                <AnimatePresence mode="wait">
                    {currentStep === 'input' && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            {/* Input Section */}
                            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-border bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold flex items-center gap-2">
                                                <Code size={18} className="text-primary" />
                                                粘贴表结构
                                            </h2>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                支持 DESC table_name 输出或 CREATE TABLE 语句
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => loadSample('desc')}
                                                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                            >
                                                加载示例 (DESC)
                                            </button>
                                            <button
                                                onClick={() => loadSample('create')}
                                                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                            >
                                                加载示例 (CREATE)
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="relative">
                                        <textarea
                                            value={ddlInput}
                                            onChange={(e) => setDdlInput(e.target.value)}
                                            placeholder={`粘贴 DESC table_name 的输出结果，或 CREATE TABLE 语句...

示例格式：
col_name                data_type    comment
dt                      STRING       日期分区
city_id                 BIGINT       城市ID
order_cnt               BIGINT       订单量
...`}
                                            rows={16}
                                            className="w-full px-4 py-3 bg-slate-900 text-green-400 font-mono text-sm rounded-xl border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-slate-500"
                                        />

                                        {ddlInput && (
                                            <button
                                                onClick={() => setDdlInput('')}
                                                className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {parseError && (
                                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                                            <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-red-600">解析失败</p>
                                                <p className="text-sm text-red-500/80 mt-0.5">{parseError}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <HelpCircle size={14} />
                                        <span>支持 Hive/Spark/MySQL/PostgreSQL 等常见 DDL 格式</span>
                                    </div>
                                    <button
                                        onClick={handleParse}
                                        disabled={!ddlInput.trim()}
                                        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold disabled:opacity-50 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                    >
                                        <Sparkles size={16} />
                                        智能解析
                                    </button>
                                </div>
                            </div>

                            {/* Guide Section */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-card border border-border rounded-xl p-6">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4">
                                        <Database size={20} />
                                    </div>
                                    <h3 className="font-bold mb-2">步骤一：获取表结构</h3>
                                    <p className="text-sm text-muted-foreground">
                                        在数据平台执行 <code className="px-1.5 py-0.5 bg-muted rounded text-xs">DESC table_name</code> 或获取建表语句
                                    </p>
                                </div>

                                <div className="bg-card border border-border rounded-xl p-6">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center mb-4">
                                        <Layers size={20} />
                                    </div>
                                    <h3 className="font-bold mb-2">步骤二：配置字段映射</h3>
                                    <p className="text-sm text-muted-foreground">
                                        为每个字段选择类型：<span className="text-purple-600 font-medium">维度</span>、<span className="text-blue-600 font-medium">指标</span> 或隐藏
                                    </p>
                                </div>

                                <div className="bg-card border border-border rounded-xl p-6">
                                    <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center mb-4">
                                        <CheckCircle size={20} />
                                    </div>
                                    <h3 className="font-bold mb-2">步骤三：一键导入</h3>
                                    <p className="text-sm text-muted-foreground">
                                        确认配置后自动生成指标与维度，并建立关联关系
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 'configure' && (
                        <motion.div
                            key="configure"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            {/* Table Info */}
                            <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-green-500/10 rounded-lg">
                                        <Table2 className="text-green-600" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-mono font-bold text-lg">{tableName}</p>
                                        <p className="text-sm text-muted-foreground">{tableComment || `${fields.length} 个字段`}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 font-medium">
                                            {metricFields.length} 指标
                                        </span>
                                        <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-600 font-medium">
                                            {dimensionFields.length} 维度
                                        </span>
                                        <span className="px-2 py-1 rounded bg-gray-500/10 text-gray-600 font-medium">
                                            {fields.filter(f => f.classification === 'hidden').length} 隐藏
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setCurrentStep('input')}
                                        className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <RefreshCcw size={14} />
                                        重新解析
                                    </button>
                                </div>
                            </div>

                            {/* Quick actions */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>批量操作：</span>
                                    <button
                                        onClick={() => batchSetClassification('metric')}
                                        className="px-2 py-1 hover:bg-blue-500/10 hover:text-blue-600 rounded transition-colors"
                                    >
                                        全部设为指标
                                    </button>
                                    <button
                                        onClick={() => batchSetClassification('dimension')}
                                        className="px-2 py-1 hover:bg-purple-500/10 hover:text-purple-600 rounded transition-colors"
                                    >
                                        全部设为维度
                                    </button>
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={autoLinkDimensions}
                                            onChange={(e) => setAutoLinkDimensions(e.target.checked)}
                                            className="w-4 h-4 rounded border-border text-primary"
                                        />
                                        <span>自动关联同表维度</span>
                                    </label>
                                </div>
                            </div>

                            {/* Field Configuration Table */}
                            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm table-fixed">
                                        <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
                                            <tr>
                                                <th className="px-4 py-3 text-left w-[180px] min-w-[150px] sticky left-0 bg-muted/50 z-10">字段名 (Code)</th>
                                                <th className="px-4 py-3 text-left w-[160px] min-w-[120px]">显示名称</th>
                                                <th className="px-4 py-3 text-left w-[100px] min-w-[80px]">数据类型</th>
                                                <th className="px-4 py-3 text-left w-[140px] min-w-[120px]">字段分类</th>
                                                <th className="px-4 py-3 text-left w-[130px] min-w-[100px]">聚合方式</th>
                                                <th className="px-4 py-3 text-left flex-1 min-w-[150px]">描述/注释</th>
                                                <th className="px-4 py-3 text-center w-[70px] min-w-[60px]">分区</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {fields.map((field) => (
                                                <tr
                                                    key={field.id}
                                                    className={cn(
                                                        "hover:bg-muted/20 transition-colors",
                                                        field.classification === 'hidden' && "opacity-50"
                                                    )}
                                                >
                                                    <td className="px-4 py-3 sticky left-0 bg-card z-10">
                                                        <div className="flex items-center gap-2">
                                                            {field.classification === 'metric' && (
                                                                <BarChart3 size={14} className="text-blue-500 shrink-0" />
                                                            )}
                                                            {field.classification === 'dimension' && (
                                                                <Hash size={14} className="text-purple-500 shrink-0" />
                                                            )}
                                                            {field.classification === 'hidden' && (
                                                                <EyeOff size={14} className="text-gray-400 shrink-0" />
                                                            )}
                                                            <code className="font-mono font-bold text-foreground/80">
                                                                {field.fieldName}
                                                            </code>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={field.displayName}
                                                            onChange={(e) => updateFieldDisplayName(field.id, e.target.value)}
                                                            className="w-full px-2 py-1.5 bg-muted/30 border border-transparent hover:border-border focus:border-primary focus:bg-background rounded text-sm transition-colors outline-none"
                                                            disabled={field.classification === 'hidden'}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={cn(
                                                            "px-2 py-1 rounded text-xs font-mono",
                                                            field.dataTypeCategory === 'numeric' && "bg-blue-500/10 text-blue-600",
                                                            field.dataTypeCategory === 'string' && "bg-green-500/10 text-green-600",
                                                            field.dataTypeCategory === 'datetime' && "bg-orange-500/10 text-orange-600",
                                                            field.dataTypeCategory === 'boolean' && "bg-purple-500/10 text-purple-600",
                                                            field.dataTypeCategory === 'complex' && "bg-gray-500/10 text-gray-600"
                                                        )}>
                                                            {field.dataType}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <ClassificationSwitch
                                                            value={field.classification}
                                                            onChange={(v) => updateFieldClassification(field.id, v)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {field.classification === 'metric' ? (
                                                            <select
                                                                value={field.suggestedAggr || 'SUM'}
                                                                onChange={(e) => updateFieldAggr(field.id, e.target.value)}
                                                                className="px-2 py-1.5 bg-muted/30 border border-transparent hover:border-border focus:border-primary focus:bg-background rounded text-xs font-mono transition-colors outline-none"
                                                            >
                                                                <option value="SUM">SUM</option>
                                                                <option value="AVG">AVG</option>
                                                                <option value="COUNT">COUNT</option>
                                                                <option value="COUNT_DISTINCT">COUNT_DISTINCT</option>
                                                                <option value="MAX">MAX</option>
                                                                <option value="MIN">MIN</option>
                                                            </select>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate" title={field.comment}>
                                                        {field.comment || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {field.isPartition && (
                                                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded text-xs font-medium">
                                                                分区
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Import Config */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <Settings2 size={16} className="text-primary" />
                                    导入配置
                                </h3>

                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">默认分组</label>
                                        <select
                                            value={defaultGroup}
                                            onChange={(e) => setDefaultGroup(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm focus:border-primary outline-none transition-colors"
                                        >
                                            {DEFAULT_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">业务负责人</label>
                                        <select
                                            value={defaultBusinessOwner}
                                            onChange={(e) => setDefaultBusinessOwner(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm focus:border-primary outline-none transition-colors"
                                        >
                                            <option value="">请选择</option>
                                            {DEFAULT_BUSINESS_OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">数据负责人</label>
                                        <select
                                            value={defaultDataOwner}
                                            onChange={(e) => setDefaultDataOwner(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm focus:border-primary outline-none transition-colors"
                                        >
                                            <option value="">请选择</option>
                                            {DEFAULT_DATA_OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => setCurrentStep('input')}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <ArrowLeft size={16} />
                                    返回上一步
                                </button>

                                <button
                                    onClick={() => setCurrentStep('confirm')}
                                    disabled={metricFields.length === 0 && dimensionFields.length === 0}
                                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold disabled:opacity-50 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                >
                                    下一步：确认导入
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 'confirm' && (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            {/* Summary */}
                            <div className="grid grid-cols-2 gap-6">
                                {/* Metrics Preview */}
                                <div className="bg-card border border-border rounded-xl overflow-hidden">
                                    <div className="px-4 py-3 border-b border-border bg-blue-500/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 size={16} className="text-blue-500" />
                                            <span className="font-bold">将导入的指标</span>
                                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded text-xs font-medium">
                                                {metricFields.length} 个
                                            </span>
                                        </div>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {metricFields.length > 0 ? (
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/30 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Code</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">名称</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">聚合</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {metricFields.map(f => (
                                                        <tr key={f.id} className={cn(
                                                            existingMetricIds.includes(f.fieldName) && "bg-amber-500/5"
                                                        )}>
                                                            <td className="px-4 py-2">
                                                                <div className="flex items-center gap-2">
                                                                    <code className="font-mono text-xs">{f.fieldName}</code>
                                                                    {existingMetricIds.includes(f.fieldName) && (
                                                                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded text-[10px] font-medium">
                                                                            已存在
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2 text-foreground/80">{f.displayName}</td>
                                                            <td className="px-4 py-2">
                                                                <code className="text-xs text-muted-foreground">{f.suggestedAggr}</code>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="p-8 text-center text-muted-foreground">
                                                <BarChart3 size={32} className="mx-auto mb-2 opacity-30" />
                                                <p className="text-sm">没有标记为指标的字段</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Dimensions Preview */}
                                <div className="bg-card border border-border rounded-xl overflow-hidden">
                                    <div className="px-4 py-3 border-b border-border bg-purple-500/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Hash size={16} className="text-purple-500" />
                                            <span className="font-bold">将导入的维度</span>
                                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded text-xs font-medium">
                                                {dimensionFields.length} 个
                                            </span>
                                        </div>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {dimensionFields.length > 0 ? (
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/30 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Code</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">名称</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">类型</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {dimensionFields.map(f => (
                                                        <tr key={f.id} className={cn(
                                                            existingDimensionIds.includes(f.fieldName) && "bg-amber-500/5"
                                                        )}>
                                                            <td className="px-4 py-2">
                                                                <div className="flex items-center gap-2">
                                                                    <code className="font-mono text-xs">{f.fieldName}</code>
                                                                    {f.isPartition && (
                                                                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded text-[10px] font-medium">
                                                                            分区
                                                                        </span>
                                                                    )}
                                                                    {existingDimensionIds.includes(f.fieldName) && (
                                                                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded text-[10px] font-medium">
                                                                            已存在
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2 text-foreground/80">{f.displayName}</td>
                                                            <td className="px-4 py-2">
                                                                <code className="text-xs text-muted-foreground">{f.dataType}</code>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="p-8 text-center text-muted-foreground">
                                                <Hash size={32} className="mx-auto mb-2 opacity-30" />
                                                <p className="text-sm">没有标记为维度的字段</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Relationship Info */}
                            {autoLinkDimensions && metricFields.length > 0 && dimensionFields.length > 0 && (
                                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
                                    <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-green-700">智能关联规则</p>
                                        <p className="text-sm text-green-600/80 mt-0.5">
                                            导入后，{metricFields.length} 个指标将自动关联表内的 {dimensionFields.length} 个维度，
                                            支持按 {dimensionFields.map(d => d.displayName).slice(0, 3).join('、')}{dimensionFields.length > 3 ? '...' : ''} 分组分析
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Conflicts warning */}
                            {(conflictingMetrics.length > 0 || conflictingDimensions.length > 0) && (
                                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                                    <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-700">存在重复定义</p>
                                        <p className="text-sm text-amber-600/80 mt-0.5">
                                            {conflictingMetrics.length > 0 && (
                                                <span>指标 {conflictingMetrics.map(m => m.fieldName).join(', ')} 已存在，将跳过导入。</span>
                                            )}
                                            {conflictingDimensions.length > 0 && (
                                                <span>维度 {conflictingDimensions.map(d => d.fieldName).join(', ')} 已存在，将跳过导入。</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-between items-center pt-4">
                                <button
                                    onClick={() => setCurrentStep('configure')}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <ArrowLeft size={16} />
                                    返回修改
                                </button>

                                <button
                                    onClick={handleImport}
                                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                >
                                    <Check size={18} />
                                    确认导入
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
