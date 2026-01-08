/**
 * Unified Configuration Page
 * Single entry point for managing Metrics, Dimensions, and Tables with tab navigation
 */

import React, { useState } from 'react';
import {
    ArrowLeft, BarChart3, Hash, Table2, Settings2
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import MetricConfigPage from './MetricConfigPage';
import DimensionManagementPage from './DimensionManagementPage';
import TableManagementPage from './TableManagementPage';
import type { Metric, Dimension } from './types';

type ConfigTab = 'metrics' | 'dimensions' | 'tables';

interface UnifiedConfigPageProps {
    onBack: () => void;
    // Metrics
    metrics: Metric[];
    onUpdateMetrics: (metrics: Metric[]) => void;
    // Dimensions
    dimensions: Dimension[];
    onUpdateDimensions: (dimensions: Dimension[]) => void;
    // Tables
    onImportMetrics: (metrics: Metric[]) => void;
    onImportDimensions: (dimensions: Dimension[]) => void;
    existingMetricIds: string[];
    existingDimensionIds: string[];
}

const TABS: { id: ConfigTab; label: string; icon: React.ElementType; description: string; color: string }[] = [
    {
        id: 'tables',
        label: '表模型管理',
        icon: Table2,
        description: '导入物理表结构',
        color: 'text-green-600 bg-green-500/10'
    },
    {
        id: 'metrics',
        label: '指标管理',
        icon: BarChart3,
        description: '定义和配置业务指标',
        color: 'text-blue-600 bg-blue-500/10'
    },
    {
        id: 'dimensions',
        label: '维度管理',
        icon: Hash,
        description: '管理分析维度属性',
        color: 'text-purple-600 bg-purple-500/10'
    },
];

export default function UnifiedConfigPage({
    onBack,
    metrics,
    onUpdateMetrics,
    dimensions,
    onUpdateDimensions,
    onImportMetrics,
    onImportDimensions,
    existingMetricIds,
    existingDimensionIds,
}: UnifiedConfigPageProps) {
    const [activeTab, setActiveTab] = useState<ConfigTab>('tables');

    // Render empty placeholder when switching - the actual pages handle their own layout
    const renderNoHeader = () => null;

    return (
        <div className="min-h-screen bg-[#f5f7fa] flex flex-col">
            {/* Unified Header with Tabs */}
            <header className="border-b border-border bg-card shadow-sm sticky top-0 z-40">
                <div className="max-w-[1800px] mx-auto px-6">
                    {/* Top section */}
                    <div className="h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Settings2 className="text-primary" size={20} />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold">语义层配置</h1>
                                    <p className="text-xs text-muted-foreground">
                                        管理指标、维度和表模型
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats summary */}
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-lg">
                                <BarChart3 size={14} className="text-blue-600" />
                                <span className="text-blue-600 font-medium">{metrics.length} 指标</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 rounded-lg">
                                <Hash size={14} className="text-purple-600" />
                                <span className="text-purple-600 font-medium">{dimensions.length} 维度</span>
                            </div>
                        </div>
                    </div>

                    {/* Tab navigation */}
                    <div className="flex items-center gap-1 -mb-px">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all",
                                    activeTab === tab.id
                                        ? "border-primary text-primary bg-primary/5"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Tab Content */}
            <main className="flex-1">
                <AnimatePresence mode="wait">
                    {activeTab === 'tables' && (
                        <motion.div
                            key="tables"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <TableManagementPage
                                onBack={() => {}} // Hide back button in embedded mode
                                onImportMetrics={onImportMetrics}
                                onImportDimensions={onImportDimensions}
                                existingMetricIds={existingMetricIds}
                                existingDimensionIds={existingDimensionIds}
                                embedded={true}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'metrics' && (
                        <motion.div
                            key="metrics"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <MetricConfigPage
                                metrics={metrics}
                                onUpdateMetrics={onUpdateMetrics}
                                onBack={() => {}} // Hide back button in embedded mode
                                embedded={true}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'dimensions' && (
                        <motion.div
                            key="dimensions"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <DimensionManagementPage
                                dimensions={dimensions}
                                onUpdateDimensions={onUpdateDimensions}
                                onBack={() => {}} // Hide back button in embedded mode
                                embedded={true}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
