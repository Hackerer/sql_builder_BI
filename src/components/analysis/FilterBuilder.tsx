/**
 * FilterBuilder Component
 * Dynamic filter builder with IN/NOT IN operators
 */

import React from 'react';
import { Filter, Plus, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import type { QueryFilter, Dimension } from '../../types';
import { DIMENSION_VALUES } from '../../data';

export interface FilterBuilderProps {
    filters: QueryFilter[];
    onAddFilter: (filter: QueryFilter) => void;
    onRemoveFilter: (filterId: string) => void;
    dimensions: Dimension[];
    getDimName: (dimId: string) => string;
    // Filter builder state
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    newFilterDim: string;
    onNewFilterDimChange: (dim: string) => void;
    newFilterOperator: 'IN' | 'NOT_IN';
    onNewFilterOperatorChange: (op: 'IN' | 'NOT_IN') => void;
    newFilterValues: string[];
    onToggleFilterValue: (value: string) => void;
    onResetBuilder: () => void;
}

export function FilterBuilder({
    filters,
    onAddFilter,
    onRemoveFilter,
    dimensions,
    getDimName,
    isOpen,
    onOpenChange,
    newFilterDim,
    onNewFilterDimChange,
    newFilterOperator,
    onNewFilterOperatorChange,
    newFilterValues,
    onToggleFilterValue,
    onResetBuilder,
}: FilterBuilderProps) {
    const handleAddFilter = () => {
        if (!newFilterDim || newFilterValues.length === 0) return;
        onAddFilter({
            id: `filter_${Date.now()}`,
            dimId: newFilterDim,
            operator: newFilterOperator,
            values: newFilterValues
        });
        onResetBuilder();
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Filter size={16} className="text-primary" />
                    <span>筛选条件</span>
                </div>
                <button
                    onClick={() => onOpenChange(!isOpen)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                    <Plus size={12} />
                    添加筛选
                </button>
            </div>

            {/* Active Filters */}
            {filters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {filters.map(filter => (
                        <motion.div
                            key={filter.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-lg text-sm"
                        >
                            <span className="font-medium">{getDimName(filter.dimId)}</span>
                            <span className="text-muted-foreground">
                                {filter.operator === 'IN' ? '包含' : '不包含'}
                            </span>
                            <span className="text-primary">{filter.values.join(', ')}</span>
                            <button
                                onClick={() => onRemoveFilter(filter.id)}
                                className="ml-1 p-0.5 hover:bg-destructive/10 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Filter Builder Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-4">
                            {/* Dimension Select */}
                            <div>
                                <label className="text-xs text-muted-foreground mb-2 block">选择维度</label>
                                <div className="flex flex-wrap gap-2">
                                    {dimensions.filter(d => d.id !== 'dt').map(dim => (
                                        <button
                                            key={dim.id}
                                            onClick={() => onNewFilterDimChange(dim.id)}
                                            className={cn(
                                                "px-3 py-1.5 text-xs rounded-lg border transition-all",
                                                newFilterDim === dim.id
                                                    ? "bg-primary/10 border-primary text-primary"
                                                    : "bg-background border-border hover:border-primary/50"
                                            )}
                                        >
                                            {dim.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Operator Select */}
                            {newFilterDim && (
                                <div>
                                    <label className="text-xs text-muted-foreground mb-2 block">筛选类型</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onNewFilterOperatorChange('IN')}
                                            className={cn(
                                                "px-3 py-1.5 text-xs rounded-lg border transition-all",
                                                newFilterOperator === 'IN'
                                                    ? "bg-primary/10 border-primary text-primary"
                                                    : "bg-background border-border"
                                            )}
                                        >
                                            包含 (IN)
                                        </button>
                                        <button
                                            onClick={() => onNewFilterOperatorChange('NOT_IN')}
                                            className={cn(
                                                "px-3 py-1.5 text-xs rounded-lg border transition-all",
                                                newFilterOperator === 'NOT_IN'
                                                    ? "bg-primary/10 border-primary text-primary"
                                                    : "bg-background border-border"
                                            )}
                                        >
                                            不包含 (NOT IN)
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Value Select */}
                            {newFilterDim && DIMENSION_VALUES[newFilterDim] && (
                                <div>
                                    <label className="text-xs text-muted-foreground mb-2 block">选择值</label>
                                    <div className="flex flex-wrap gap-2">
                                        {DIMENSION_VALUES[newFilterDim].map(value => (
                                            <button
                                                key={value}
                                                onClick={() => onToggleFilterValue(value)}
                                                className={cn(
                                                    "px-3 py-1.5 text-xs rounded-lg border transition-all flex items-center gap-1",
                                                    newFilterValues.includes(value)
                                                        ? "bg-primary/10 border-primary text-primary"
                                                        : "bg-background border-border hover:border-primary/50"
                                                )}
                                            >
                                                {newFilterValues.includes(value) && <Check size={12} />}
                                                {value}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={onResetBuilder}
                                    className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleAddFilter}
                                    disabled={!newFilterDim || newFilterValues.length === 0}
                                    className="px-4 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg disabled:opacity-50 transition-all"
                                >
                                    添加筛选
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
