/**
 * DateRangePicker Component
 * Date range selection with presets and comparison modes
 */

import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, isWithinInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import type { DateRangeState, ComparisonMode } from '../../types';
import { DATE_PRESETS } from '../../data';

/** Comparison Calendar Component - Dual month calendar view */
function ComparisonCalendar({ comparisonDateRange }: { comparisonDateRange: { startDate: Date; endDate: Date } | null }) {
    const baseDate = comparisonDateRange?.startDate || new Date();
    const [leftMonth, setLeftMonth] = useState(startOfMonth(baseDate));
    const rightMonth = addMonths(leftMonth, 1);

    const navigateMonth = (direction: 'prev' | 'next') => {
        setLeftMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    };

    const renderMonth = (monthDate: Date) => {
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const startDayOfWeek = getDay(monthStart); // 0 = Sunday

        // Adjust for Monday start (Chinese calendar)
        const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

        const isInRange = (day: Date) => {
            if (!comparisonDateRange) return false;
            return isWithinInterval(day, { start: comparisonDateRange.startDate, end: comparisonDateRange.endDate });
        };

        const isStart = (day: Date) => comparisonDateRange && isSameDay(day, comparisonDateRange.startDate);
        const isEnd = (day: Date) => comparisonDateRange && isSameDay(day, comparisonDateRange.endDate);

        return (
            <div className="w-64">
                <div className="text-center font-medium text-sm mb-3">
                    {format(monthDate, 'yyyy年 M月', { locale: zhCN })}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
                    {['一', '二', '三', '四', '五', '六', '日'].map(d => (
                        <div key={d} className="py-1">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for alignment */}
                    {Array.from({ length: adjustedStartDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-8" />
                    ))}
                    {days.map(day => (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                "h-8 w-8 flex items-center justify-center text-sm rounded-full transition-colors",
                                isInRange(day) && "bg-primary/20",
                                isStart(day) && "bg-primary text-primary-foreground rounded-l-full",
                                isEnd(day) && "bg-primary text-primary-foreground rounded-r-full",
                                !isInRange(day) && "hover:bg-muted cursor-pointer"
                            )}
                        >
                            {format(day, 'd')}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex gap-6">
            <div className="flex items-start gap-2">
                <button
                    onClick={() => navigateMonth('prev')}
                    className="p-1 hover:bg-muted rounded-lg transition-colors mt-0.5"
                >
                    <ChevronLeft size={16} />
                </button>
                {renderMonth(leftMonth)}
            </div>
            <div className="flex items-start gap-2">
                {renderMonth(rightMonth)}
                <button
                    onClick={() => navigateMonth('next')}
                    className="p-1 hover:bg-muted rounded-lg transition-colors mt-0.5"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

export interface DateRangePickerProps {
    dateRange: DateRangeState;
    onDateRangeChange: (range: DateRangeState) => void;
    showComparison: boolean;
    onShowComparisonChange: (show: boolean) => void;
    comparisonMode: ComparisonMode;
    onComparisonModeChange: (mode: 'dod' | 'wow' | 'mom' | 'yoy') => void;
    comparisonDateRange: { startDate: Date; endDate: Date } | null;
    formatDateRange: () => string;
    formatComparisonRange: () => string;
    applyDatePreset: (presetId: string) => void;
}

export function DateRangePicker({
    dateRange,
    showComparison,
    onShowComparisonChange,
    comparisonMode,
    onComparisonModeChange,
    comparisonDateRange,
    formatDateRange,
    formatComparisonRange,
    applyDatePreset,
}: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isComparisonOpen, setIsComparisonOpen] = useState(false);

    return (
        <div className="flex items-center gap-2">
            {/* Main Date Range Selector */}
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl hover:border-primary/50 transition-all shadow-sm"
                >
                    <Calendar size={16} className="text-primary" />
                    <span className="text-sm font-medium">{formatDateRange()}</span>
                    <ChevronDown size={14} className={cn(
                        "text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                    )} />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 mt-2 w-48 bg-popover border border-border rounded-xl shadow-lg p-2 z-50"
                        >
                            {DATE_PRESETS.map(preset => (
                                <button
                                    key={preset.id}
                                    onClick={() => {
                                        applyDatePreset(preset.id);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                                        dateRange.preset === preset.id
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "hover:bg-muted text-foreground"
                                    )}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Comparison Toggle & Picker */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => {
                        onShowComparisonChange(!showComparison);
                        if (!showComparison) setIsComparisonOpen(true);
                    }}
                    className={cn(
                        "px-3 py-2 rounded-xl text-sm font-medium transition-all border",
                        showComparison
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                    )}
                >
                    对比
                </button>

                {showComparison && (
                    <div className="relative">
                        <button
                            onClick={() => setIsComparisonOpen(!isComparisonOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl hover:border-primary/50 transition-all shadow-sm"
                        >
                            <Calendar size={16} className="text-orange-500" />
                            <span className="text-sm font-medium">
                                {comparisonMode === 'dod' ? '日环比' :
                                    comparisonMode === 'wow' ? '周环比' :
                                        comparisonMode === 'mom' ? '月同比' :
                                            comparisonMode === 'yoy' ? '年同比' : '选择对比'}
                            </span>
                            <ChevronDown size={14} className={cn(
                                "text-muted-foreground transition-transform",
                                isComparisonOpen && "rotate-180"
                            )} />
                        </button>

                        <AnimatePresence>
                            {isComparisonOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full left-0 mt-2 bg-popover border border-border rounded-2xl shadow-xl z-50 flex overflow-hidden"
                                >
                                    {/* Left sidebar - Comparison presets */}
                                    <div className="w-28 border-r border-border p-2 bg-muted/30">
                                        {[
                                            { id: 'dod', name: '日环比' },
                                            { id: 'wow', name: '周环比' },
                                            { id: 'mom', name: '月同比' },
                                            { id: 'yoy', name: '年同比' },
                                        ].map(option => (
                                            <button
                                                key={option.id}
                                                onClick={() => {
                                                    onComparisonModeChange(option.id as 'dod' | 'wow' | 'mom' | 'yoy');
                                                }}
                                                className={cn(
                                                    "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                                                    comparisonMode === option.id
                                                        ? "bg-primary/10 text-primary font-medium"
                                                        : "hover:bg-muted text-foreground"
                                                )}
                                            >
                                                {option.name}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Right area - Calendar view */}
                                    <div className="p-4">
                                        {/* Date inputs */}
                                        <div className="flex items-center gap-2 mb-4">
                                            <input
                                                type="text"
                                                readOnly
                                                value={comparisonDateRange ? format(comparisonDateRange.startDate, 'yyyy-MM-dd') : ''}
                                                className="w-32 px-3 py-2 border border-border rounded-lg text-sm bg-muted/50 text-center"
                                                placeholder="开始日期"
                                            />
                                            <span className="text-muted-foreground">→</span>
                                            <input
                                                type="text"
                                                readOnly
                                                value={comparisonDateRange ? format(comparisonDateRange.endDate, 'yyyy-MM-dd') : ''}
                                                className="w-32 px-3 py-2 border border-border rounded-lg text-sm bg-muted/50 text-center"
                                                placeholder="结束日期"
                                            />
                                        </div>

                                        {/* Dual Calendar Display */}
                                        <ComparisonCalendar comparisonDateRange={comparisonDateRange} />

                                        {/* Action buttons */}
                                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
                                            <button
                                                onClick={() => setIsComparisonOpen(false)}
                                                className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                                            >
                                                取消
                                            </button>
                                            <button
                                                onClick={() => setIsComparisonOpen(false)}
                                                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                                            >
                                                确定
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
