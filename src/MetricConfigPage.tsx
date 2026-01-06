import React, { useState, useMemo } from 'react';
import {
    ArrowLeft, Save, Search, Settings, Tag,
    Layers, Database, RotateCcw, Check
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion } from 'framer-motion';

// Defined in App.tsx but redefining interface here for simplicity or should export it
export interface Metric {
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
    compatibleGranularities?: string[];
    // Configurable fields
    displayName?: string;
}

interface MetricConfigPageProps {
    metrics: Metric[];
    onUpdateMetrics: (newMetrics: Metric[]) => void;
    onBack: () => void;
}

const GROUPS = ['订单', '财务', '转化', '体验', '供应链', '用户'];
const AVAILABLE_TAGS = [
    'core', 'secondary',
    'realtime', 'T+1',
    'DWS', 'ADS', 'DWD',
    'supply_chain', 'financial', 'experience', 'kpi', 'derived'
];

export default function MetricConfigPage({ metrics, onUpdateMetrics, onBack }: MetricConfigPageProps) {
    const [localMetrics, setLocalMetrics] = useState<Metric[]>(JSON.parse(JSON.stringify(metrics)));
    const [searchTerm, setSearchTerm] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'modified'>('all');

    const filteredMetrics = useMemo(() => {
        return localMetrics.filter(m => {
            const matchesSearch =
                m.name.includes(searchTerm) ||
                m.id.includes(searchTerm) ||
                m.description.includes(searchTerm);

            if (activeTab === 'modified') {
                const original = metrics.find(om => om.id === m.id);
                const isModified = JSON.stringify(original) !== JSON.stringify(m);
                return matchesSearch && isModified;
            }

            return matchesSearch;
        });
    }, [localMetrics, searchTerm, activeTab, metrics]);

    const handleUpdate = (id: string, field: keyof Metric, value: any) => {
        setLocalMetrics(prev => prev.map(m => {
            if (m.id === id) {
                return { ...m, [field]: value };
            }
            return m;
        }));
        setHasUnsavedChanges(true);
    };

    const handleToggleTag = (id: string, tag: string) => {
        setLocalMetrics(prev => prev.map(m => {
            if (m.id === id) {
                const newTags = m.tags.includes(tag)
                    ? m.tags.filter(t => t !== tag)
                    : [...m.tags, tag];
                return { ...m, tags: newTags };
            }
            return m;
        }));
        setHasUnsavedChanges(true);
    };

    const saveChanges = () => {
        onUpdateMetrics(localMetrics);
        setHasUnsavedChanges(false);
        // Optional: Show success toast
    };

    const resetChanges = () => {
        if (window.confirm('确定要放弃所有未保存的更改吗？')) {
            setLocalMetrics(JSON.parse(JSON.stringify(metrics)));
            setHasUnsavedChanges(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b border-border bg-card shadow-sm sticky top-0 z-10">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-2">
                            <Settings className="text-primary" />
                            <h1 className="text-lg font-bold">指标元数据配置</h1>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                同步源: DataCenter (Last Sync: 10 mins ago)
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {hasUnsavedChanges && (
                            <span className="text-xs text-amber-500 font-medium animate-pulse">
                                有未保存的更改
                            </span>
                        )}
                        <button
                            onClick={resetChanges}
                            disabled={!hasUnsavedChanges}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <RotateCcw size={16} /> 放弃更改
                        </button>
                        <button
                            onClick={saveChanges}
                            disabled={!hasUnsavedChanges}
                            className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg disabled:opacity-50 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                            <Save size={16} /> 保存配置
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full">
                {/* Toolbar */}
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={cn(
                                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                activeTab === 'all' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            全部指标 ({localMetrics.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('modified')}
                            className={cn(
                                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                activeTab === 'modified' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            已修改
                        </button>
                    </div>

                    <div className="relative w-96">
                        <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="搜索指标ID、名称、描述..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="px-6 py-4 w-48">指标标识</th>
                                    <th className="px-6 py-4 w-64">名称配置</th>
                                    <th className="px-6 py-4 w-48">分类管理</th>
                                    <th className="px-6 py-4">业务标签</th>
                                    <th className="px-6 py-4 w-64">业务口径描述</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredMetrics.map(metric => (
                                    <tr key={metric.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{metric.id}</div>
                                            <div className="text-xs text-muted-foreground mt-1">Owner: {metric.owner}</div>
                                        </td>

                                        <td className="px-6 py-4 space-y-2">
                                            <div>
                                                <label className="text-[10px] text-muted-foreground block mb-0.5">原始名称</label>
                                                <div className="text-xs opacity-70">{metric.name}</div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-primary font-medium block mb-0.5">展示名称</label>
                                                <input
                                                    type="text"
                                                    value={metric.displayName || metric.name}
                                                    onChange={(e) => handleUpdate(metric.id, 'displayName', e.target.value)}
                                                    className="w-full px-2 py-1 bg-background border border-border rounded text-sm focus:border-primary outline-none"
                                                />
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Layers size={14} className="text-muted-foreground" />
                                                <select
                                                    value={metric.group}
                                                    onChange={(e) => handleUpdate(metric.id, 'group', e.target.value)}
                                                    className="bg-transparent border-b border-border hover:border-primary focus:border-primary outline-none cursor-pointer py-0.5"
                                                >
                                                    {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                                                </select>
                                            </div>
                                            <input
                                                type="text"
                                                value={metric.subGroup || ''}
                                                onChange={(e) => handleUpdate(metric.id, 'subGroup', e.target.value)}
                                                placeholder="输入子分类..."
                                                className="w-full px-2 py-1 bg-muted/30 border-none rounded text-xs focus:ring-1 focus:ring-primary outline-none"
                                            />
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {metric.tags.map(tag => (
                                                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/20">
                                                        {tag}
                                                        <button onClick={() => handleToggleTag(metric.id, tag)} className="hover:bg-primary/20 rounded-full p-0.5">
                                                            <X size={10} strokeWidth={3} className="lucide-x" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="relative group">
                                                <button className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 border border-dashed border-border px-2 py-0.5 rounded hover:border-primary transition-colors">
                                                    <Tag size={12} /> 添加标签
                                                </button>
                                                {/* Simple Dropdown for adding tags */}
                                                <div className="hidden group-hover:block absolute top-full left-0 mt-1 w-48 bg-popover border border-border shadow-lg rounded-lg p-2 z-50">
                                                    <div className="grid grid-cols-2 gap-1">
                                                        {AVAILABLE_TAGS.filter(t => !metric.tags.includes(t)).map(tag => (
                                                            <button
                                                                key={tag}
                                                                onClick={() => handleToggleTag(metric.id, tag)}
                                                                className="text-left text-xs px-2 py-1.5 hover:bg-muted rounded text-popover-foreground"
                                                            >
                                                                {tag}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <textarea
                                                value={metric.description}
                                                onChange={(e) => handleUpdate(metric.id, 'description', e.target.value)}
                                                className="w-full h-20 px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Helper icon component since lucid-react X might be ambiguous with X variable
const X = ({ size = 24, className, ...props }: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("lucide lucide-x", className)}
        {...props}
    >
        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
);
