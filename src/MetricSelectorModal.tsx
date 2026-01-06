import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    X, Search, Star, ChevronRight, ChevronDown, Check,
    ShoppingCart, DollarSign, Users, Truck, TrendingUp,
    Layers, Clock, Filter, Trash2, ArrowRight, Tag
} from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';

// --- Interfaces ---

interface Metric {
    id: string;
    name: string;
    group: string;
    subGroup?: string;
    tags: string[];
    compatibleDims: string[];
    description: string;
    owner: string;
    updateFrequency: string;
    isStarred?: boolean;
    aggr: string;
    unit: string;
    compatibleGranularities?: string[]; // e.g. ['hour', 'day', 'week', 'month']
}

interface TreeNode {
    id: string;
    name: string;
    type: 'category' | 'subcategory';
    icon?: React.ComponentType<{ size?: number; className?: string }>;
    bgClass?: string;
    textClass?: string;
    children?: TreeNode[];
    count?: number;
    fullPath?: string; // e.g. "Order_Realtime"
}

interface MetricSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    metrics: Metric[];
    selectedMetrics: string[];
    onConfirm: (selectedIds: string[]) => void;
    availableMetrics?: string[];
    dimensions?: { id: string, name: string }[];
}

// --- Constants ---

const LABEL_GROUPS = [
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

// --- Main Component ---

export default function MetricSelectorModal({
    isOpen,
    onClose,
    metrics,
    selectedMetrics: initialSelected,
    onConfirm,
    availableMetrics,
    dimensions
}: MetricSelectorModalProps) {
    // --- State ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(metrics.map(m => m.group)));
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // "group" or "group_subgroup"

    // Filters: { "priority": ["core"], "source": [] }
    const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
    const [openFilterGroup, setOpenFilterGroup] = useState<string | null>(null);

    const parentRef = useRef<HTMLDivElement>(null);

    // Sync selectedIds with props when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedIds(initialSelected);
        }
    }, [isOpen, initialSelected]);

    // --- Data Processing ---

    // 1. Build Tree Data (Only down to SubGroup)
    const treeData: TreeNode[] = useMemo(() => {
        const grouped: Record<string, Record<string, number>> = {};

        metrics.forEach(m => {
            if (!grouped[m.group]) grouped[m.group] = {};
            const sub = m.subGroup || '其他';
            grouped[m.group][sub] = (grouped[m.group][sub] || 0) + 1;
        });

        const iconMap: Record<string, any> = {
            '订单': ShoppingCart, '财务': DollarSign, '用户': Users,
            '供应链': Truck, '转化': TrendingUp, '体验': Clock
        };

        return Object.entries(grouped).map(([groupName, subGroups]) => ({
            id: groupName,
            name: `${groupName}域`,
            type: 'category',
            icon: iconMap[groupName] || Layers,
            count: Object.values(subGroups).reduce((a, b) => a + b, 0),
            children: Object.entries(subGroups).map(([subName, count]) => ({
                id: `${groupName}_${subName}`,
                name: subName,
                type: 'subcategory',
                count: count,
                fullPath: `${groupName}|${subName}`
            }))
        }));
    }, [metrics]);

    // 2. Fuse Search
    const fuse = useMemo(() => new Fuse(metrics, {
        keys: ['name', 'description', 'tags', 'id'],
        threshold: 0.3
    }), [metrics]);

    // 3. Filter Logic
    const filteredMetrics = useMemo(() => {
        let result = metrics;

        // Tree Filter
        if (selectedCategory) {
            const [group, sub] = selectedCategory.split('|');
            result = result.filter(m => m.group === group && (!sub || m.subGroup === sub || (sub === '其他' && !m.subGroup)));
        }

        // Search Filter
        if (searchTerm) {
            result = fuse.search(searchTerm).map(r => r.item);
        }

        // Tag Filters
        Object.entries(activeFilters).forEach(([groupId, selectedOptions]) => {
            if (selectedOptions.length === 0) return;
            result = result.filter(m => {
                // Special case for 'source' if it matches group or tags
                if (groupId === 'source') {
                    return selectedOptions.some(opt => m.tags.includes(opt) || m.group === opt);
                }
                return selectedOptions.some(opt => m.tags.includes(opt) || m.updateFrequency === opt || (opt === 'realtime' && m.tags.includes('realtime')));
            });
        });

        return result;
    }, [metrics, searchTerm, selectedCategory, activeFilters, fuse]);

    // --- Virtualizer ---
    const virtualizer = useVirtualizer({
        count: filteredMetrics.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 92,
        overscan: 5
    });

    // --- Handlers ---

    const getDimName = (id: string) => dimensions?.find(d => d.id === id)?.name || id;

    const toggleNode = (nodeId: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
            return next;
        });
    };

    const handleCategorySelect = (node: TreeNode) => {
        if (node.type === 'category') {
            // If selecting a category, we filter by just the group
            // We use a pipe delimiter format for internal state: "Group|SubGroup" or just "Group"
            setSelectedCategory(node.id);
            // Also ensure it's expanded
            setExpandedNodes(prev => new Set(prev).add(node.id));
        } else {
            setSelectedCategory(node.fullPath || null);
        }
    };

    const toggleMetric = (id: string) => {
        if (availableMetrics && !availableMetrics.includes(id)) return;
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleFilter = (groupId: string, optionId: string) => {
        setActiveFilters(prev => {
            const current = prev[groupId] || [];
            const next = current.includes(optionId)
                ? current.filter(c => c !== optionId)
                : [...current, optionId];
            return { ...prev, [groupId]: next };
        });
    };

    // --- Render Helpers ---

    // Fixed: Changed from nested Component to render function to avoid React re-mounting issues
    const renderTreeNode = (node: TreeNode, level: number = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);

        let isSelected = false;
        if (node.type === 'category') {
            isSelected = selectedCategory === node.id;
        } else {
            isSelected = selectedCategory === node.fullPath;
        }

        return (
            <div key={node.id} className="mb-0.5">
                <button
                    onClick={() => {
                        handleCategorySelect(node);
                        if (hasChildren && !isExpanded) toggleNode(node.id);
                        else if (hasChildren && isExpanded && node.type === 'category' && selectedCategory === node.id) toggleNode(node.id);
                    }}
                    className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm transition-all rounded-lg relative overflow-hidden group",
                        isSelected
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                    style={{ paddingLeft: `${level * 16 + 12}px` }}
                >
                    {isSelected && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-primary rounded-r-full" />
                    )}

                    {hasChildren ? (
                        <div
                            className="p-0.5 rounded-sm hover:bg-black/5 transition-colors z-10"
                            onClick={(e) => {
                                e.stopPropagation(); // Only toggle expand, don't select
                                toggleNode(node.id);
                            }}
                        >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                    ) : <span className="w-4.5 h-4" />} {/* Spacer */}

                    {node.icon && <node.icon size={16} className={cn("shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />}
                    <span className="flex-1 text-left truncate">{node.name}</span>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded-full bg-muted", isSelected && "bg-primary/20 text-primary")}>
                        {node.count}
                    </span>
                </button>

                <AnimatePresence>
                    {isExpanded && hasChildren && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            {node.children!.map(child => renderTreeNode(child, level + 1))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 15 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                        className="relative w-[95vw] h-[90vh] max-w-[1400px] bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border/50"
                    >
                        {/* --- Header --- */}
                        <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border/40 bg-background/95 backdrop-blur z-20">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Layers className="text-primary" size={18} />
                                </div>
                                <h2 className="text-lg font-bold text-foreground tracking-tight">选择指标</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground mr-2">
                                    已选 <span className="font-bold text-primary text-base">{selectedIds.length}</span> 项
                                </span>
                                <div className="h-4 w-px bg-border/60" />
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="text-sm text-muted-foreground hover:text-red-500 transition-colors px-2 py-1"
                                >
                                    清空
                                </button>
                                <button
                                    onClick={() => { onConfirm(selectedIds); onClose(); }}
                                    className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    <Check size={16} /> 确认选择
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-all hover:rotate-90"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* --- Main Body --- */}
                        <div className="flex-1 flex overflow-hidden bg-muted/10">

                            {/* 1. Left Sidebar: Categories */}
                            <aside className="w-[240px] flex flex-col border-r border-border/40 bg-card z-10">
                                <div className="p-4">
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                                        指标分类
                                    </h3>
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => setSelectedCategory(null)}
                                            className={cn(
                                                "w-full flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all rounded-lg mb-2",
                                                selectedCategory === null
                                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                    : "bg-secondary/50 text-foreground hover:bg-secondary"
                                            )}
                                        >
                                            <Layers size={16} />
                                            全部指标
                                            <span className="ml-auto bg-white/20 px-1.5 py-0.5 rounded text-xs">{metrics.length}</span>
                                        </button>
                                    </div>
                                    <div className="h-px bg-border/50 my-2" />
                                    <div className="overflow-y-auto custom-scrollbar h-[calc(100vh-300px)]">
                                        {treeData.map(node => renderTreeNode(node))}
                                    </div>
                                </div>
                            </aside>

                            {/* 2. Center: Discovery & List */}
                            <main className="flex-1 flex flex-col relative min-w-0 bg-background/50">
                                {/* Search & Filters Header */}
                                <div className="p-4 pb-2 z-10 sticky top-0 bg-background/95 backdrop-blur border-b border-border/40 space-y-3">
                                    {/* Search Bar */}
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-2.5 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                        <input
                                            type="text"
                                            placeholder="搜索指标名称、描述、ID..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 hover:bg-secondary/50 focus:bg-background border border-border/50 focus:border-primary/50 rounded-xl outline-none transition-all shadow-sm focus:shadow-md focus:ring-4 focus:ring-primary/10"
                                        />
                                    </div>

                                    {/* Active Filters Bar */}
                                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                                        <Filter size={14} className="text-muted-foreground shrink-0 mr-1" />
                                        {LABEL_GROUPS.map(group => {
                                            const activeCount = activeFilters[group.id]?.length || 0;
                                            const isActive = activeCount > 0;
                                            return (
                                                <div key={group.id} className="relative shrink-0">
                                                    <button
                                                        onClick={() => setOpenFilterGroup(openFilterGroup === group.id ? null : group.id)}
                                                        className={cn(
                                                            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
                                                            isActive
                                                                ? "bg-primary/5 border-primary/30 text-primary"
                                                                : "bg-white border-border hover:border-primary/30 text-muted-foreground hover:text-foreground"
                                                        )}
                                                    >
                                                        {group.name}
                                                        {isActive && <span className="flex items-center justify-center w-4 h-4 bg-primary text-white rounded-full text-[9px]">{activeCount}</span>}
                                                        <ChevronDown size={10} className={cn("transition-transform", openFilterGroup === group.id && "rotate-180")} />
                                                    </button>

                                                    {/* Popover */}
                                                    <AnimatePresence>
                                                        {openFilterGroup === group.id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                                className="absolute top-full left-0 mt-2 w-48 bg-white border border-border rounded-xl shadow-xl p-2 z-50 flex flex-col gap-1"
                                                            >
                                                                {group.options.map(opt => {
                                                                    const isSelected = activeFilters[group.id]?.includes(opt.id);
                                                                    return (
                                                                        <button
                                                                            key={opt.id}
                                                                            onClick={() => toggleFilter(group.id, opt.id)}
                                                                            className={cn(
                                                                                "flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-xs transition-colors",
                                                                                isSelected ? "bg-primary/5 text-primary" : "hover:bg-muted text-foreground"
                                                                            )}
                                                                        >
                                                                            <span className="flex items-center gap-2">
                                                                                <span className={cn("w-2 h-2 rounded-full", opt.color.split(' ')[1])} />
                                                                                {opt.name}
                                                                            </span>
                                                                            {isSelected && <Check size={12} />}
                                                                        </button>
                                                                    )
                                                                })}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                        {Object.values(activeFilters).flat().length > 0 && (
                                            <button
                                                onClick={() => setActiveFilters({})}
                                                className="text-xs text-muted-foreground hover:text-primary ml-auto flex items-center gap-1"
                                            >
                                                <X size={12} /> 清除
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Virtual List */}
                                <div className="flex-1 overflow-hidden relative">
                                    <div ref={parentRef} className="h-full overflow-y-auto custom-scrollbar">
                                        <div
                                            style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
                                        >
                                            {virtualizer.getVirtualItems().map(virtualRow => {
                                                const metric = filteredMetrics[virtualRow.index];
                                                const isSelected = selectedIds.includes(metric.id);
                                                const isDisabled = availableMetrics && !availableMetrics.includes(metric.id);

                                                return (
                                                    <div
                                                        key={virtualRow.key}
                                                        className={cn(
                                                            "absolute left-0 w-full px-4 py-1.5 box-border",
                                                        )}
                                                        style={{
                                                            top: 0,
                                                            transform: `translateY(${virtualRow.start}px)`,
                                                            height: `${virtualRow.size}px`
                                                        }}
                                                    >
                                                        <div
                                                            onClick={() => !isDisabled && toggleMetric(metric.id)}
                                                            className={cn(
                                                                "h-full w-full rounded-xl border transition-all cursor-pointer grid relative overflow-hidden",
                                                                "grid-cols-[40px_1fr_140px]",
                                                                isSelected
                                                                    ? "bg-primary/5 border-primary/40 shadow-sm"
                                                                    : "bg-white border-border/60 hover:border-primary/30 hover:shadow-md hover:bg-white",
                                                                isDisabled && "opacity-50 grayscale cursor-not-allowed bg-muted/30"
                                                            )}
                                                        >
                                                            {/* Col 1: Checkbox */}
                                                            <div className="flex items-center justify-center border-r border-dashed border-border/30 bg-muted/5">
                                                                <div className={cn(
                                                                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                                                    isSelected ? "bg-primary border-primary" : "border-muted-foreground/30 bg-white"
                                                                )}>
                                                                    {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                                                </div>
                                                            </div>

                                                            {/* Col 2: Main Info */}
                                                            <div className="flex flex-col justify-center px-3 py-2 min-w-0">
                                                                {/* Row 1: Name + Star + Metric Type Badge */}
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className={cn("text-sm font-bold truncate", isSelected ? "text-primary" : "text-foreground")}>
                                                                        {metric.name}
                                                                    </span>
                                                                    {metric.isStarred && <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />}
                                                                    {/* Metric Type Badge */}
                                                                    <span className={cn(
                                                                        "text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0",
                                                                        metric.metricType === 'calculated' || metric.aggr === 'CALC'
                                                                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                                                                            : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                                                    )}>
                                                                        {metric.metricType === 'calculated' || metric.aggr === 'CALC' ? '计算' : '原子'}
                                                                    </span>
                                                                    <span className="text-[9px] px-1 rounded bg-secondary text-secondary-foreground border border-border">{metric.aggr}</span>
                                                                </div>
                                                                {/* Row 2: Description */}
                                                                <p className="text-[11px] text-muted-foreground truncate pr-4 mb-1">
                                                                    {metric.description || "暂无描述"}
                                                                </p>
                                                                {/* Row 3: Colorful Labels */}
                                                                <div className="flex items-center gap-1 flex-wrap">
                                                                    {(metric.labels || []).map((label, idx) => {
                                                                        const colorMap: Record<string, string> = {
                                                                            blue: 'bg-blue-100 text-blue-700 border-blue-200',
                                                                            green: 'bg-green-100 text-green-700 border-green-200',
                                                                            orange: 'bg-orange-100 text-orange-700 border-orange-200',
                                                                            purple: 'bg-purple-100 text-purple-700 border-purple-200',
                                                                            red: 'bg-red-100 text-red-700 border-red-200',
                                                                            cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
                                                                            pink: 'bg-pink-100 text-pink-700 border-pink-200',
                                                                            gray: 'bg-gray-100 text-gray-700 border-gray-200',
                                                                        };
                                                                        return (
                                                                            <span
                                                                                key={idx}
                                                                                className={cn(
                                                                                    "text-[9px] px-1.5 py-0.5 rounded-full border font-medium",
                                                                                    colorMap[label.color] || colorMap.gray
                                                                                )}
                                                                            >
                                                                                {label.text}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                    {/* Granularity badges */}
                                                                    {(metric.compatibleGranularities || ['day']).slice(0, 4).map(g => (
                                                                        <span key={g} className="text-[8px] text-muted-foreground/70 px-1 border border-border/50 rounded bg-muted/30">
                                                                            {g === 'hour' ? '时' : g === 'day' ? '日' : g === 'week' ? '周' : '月'}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Col 3: Meta Info - Redesigned */}
                                                            <div className="flex flex-col justify-center items-end px-3 py-2 bg-muted/5 border-l border-dashed border-border/30 text-[10px] text-muted-foreground gap-1">
                                                                {/* Contact Person */}
                                                                <div className="flex items-center gap-1.5" title="业务对接人">
                                                                    <span className="text-[9px] text-muted-foreground/60">对接人:</span>
                                                                    <span className="font-medium text-foreground/80">{metric.contactPerson || '未设置'}</span>
                                                                </div>
                                                                {/* Update Frequency & Unit */}
                                                                <div className="flex items-center gap-2 opacity-80">
                                                                    <span className="flex items-center gap-1"><Clock size={10} /> {metric.updateFrequency}</span>
                                                                    <span className="flex items-center gap-1"><Tag size={10} /> {metric.unit}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Bottom Status Bar */}
                                    <div className="h-8 border-t border-border/50 bg-white/50 backdrop-blur text-[10px] text-muted-foreground flex items-center justify-between px-4">
                                        <span>共 {filteredMetrics.length} 个指标</span>
                                        {selectedCategory && <span>筛选: {selectedCategory.replace('|', ' > ')}</span>}
                                    </div>
                                </div>
                            </main>

                            {/* 3. Right Sidebar: Selection Cart */}
                            <aside className="w-[260px] flex flex-col border-l border-border/40 bg-white shadow-xl z-20">
                                <div className="p-4 border-b border-border/40 bg-muted/10">
                                    <h3 className="text-xs font-bold text-foreground">
                                        已选列表
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        已选择 {selectedIds.length} 个指标，准备添加
                                    </p>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 bg-muted/5">
                                    <AnimatePresence initial={false}>
                                        {selectedIds.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-48 text-center opacity-40 mt-10">
                                                <ShoppingCart size={32} className="mb-2" />
                                                <p className="text-xs">暂无选择</p>
                                            </div>
                                        ) : (
                                            selectedIds.map(id => {
                                                const metric = metrics.find(m => m.id === id);
                                                if (!metric) return null;
                                                return (
                                                    <motion.div
                                                        key={id}
                                                        layout
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 20 }}
                                                        className="group relative flex items-start gap-2 p-2.5 bg-white border border-border/60 hover:border-primary/40 rounded-lg shadow-sm transition-all"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-xs font-bold text-foreground truncate">{metric.name}</p>
                                                                <span className="text-[9px] px-1 rounded bg-secondary text-secondary-foreground">{metric.aggr}</span>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{metric.group} / {metric.subGroup || '其他'}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => toggleMetric(id)}
                                                            className="absolute -top-1.5 -right-1.5 bg-white border border-border shadow-sm p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:text-red-500 hover:border-red-200 transition-all scale-75 group-hover:scale-100"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                    </AnimatePresence>
                                </div>
                                {/* Footer Actions */}
                                <div className="p-3 border-t border-border/40 bg-muted/10">
                                    <button
                                        onClick={() => { onConfirm(selectedIds); onClose(); }}
                                        disabled={selectedIds.length === 0}
                                        className="w-full btn-primary py-2 text-xs flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        确认添加 <ArrowRight size={12} />
                                    </button>
                                </div>
                            </aside>

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
