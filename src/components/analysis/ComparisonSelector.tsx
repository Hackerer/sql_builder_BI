import React from 'react';
import { GitCompare, ChevronDown, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ComparisonType, TimeGranularity } from '../../types';
import { getValidComparisonTypes, getComparisonLabel, calculateAdvancedComparisonRange } from '../../lib/comparison';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, isWithinInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ComparisonSelectorProps {
    granularity: TimeGranularity;
    comparisonType: ComparisonType;
    onTypeChange: (type: ComparisonType) => void;
    dateRange: { startDate: Date; endDate: Date };
}

/** Dual Calendar Component for comparison date display */
function ComparisonCalendar({ comparisonDateRange }: { comparisonDateRange: { startDate: Date; endDate: Date } | null }) {
    const baseDate = comparisonDateRange?.startDate || new Date();
    const [leftMonth, setLeftMonth] = React.useState(startOfMonth(baseDate));
    const rightMonth = addMonths(leftMonth, 1);

    React.useEffect(() => {
        if (comparisonDateRange) {
            setLeftMonth(startOfMonth(comparisonDateRange.startDate));
        }
    }, [comparisonDateRange]);

    const navigateMonth = (direction: 'prev' | 'next') => {
        setLeftMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    };

    const renderMonth = (monthDate: Date) => {
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const startDayOfWeek = getDay(monthStart);
        const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

        const isInRange = (day: Date) => {
            if (!comparisonDateRange) return false;
            return isWithinInterval(day, { start: comparisonDateRange.startDate, end: comparisonDateRange.endDate });
        };

        const isStart = (day: Date) => comparisonDateRange && isSameDay(day, comparisonDateRange.startDate);
        const isEnd = (day: Date) => comparisonDateRange && isSameDay(day, comparisonDateRange.endDate);

        return (
            <div className="w-56">
                <div className="text-center font-medium text-sm mb-3">
                    {format(monthDate, 'yyyy年 M月', { locale: zhCN })}
                </div>
                <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-muted-foreground mb-2">
                    {['一', '二', '三', '四', '五', '六', '日'].map(d => (
                        <div key={d} className="py-1">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: adjustedStartDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-7" />
                    ))}
                    {days.map(day => (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                "h-7 w-7 flex items-center justify-center text-xs transition-colors",
                                isInRange(day) && "bg-amber-100 dark:bg-amber-900/30",
                                isStart(day) && "bg-amber-500 text-white rounded-l-full",
                                isEnd(day) && "bg-amber-500 text-white rounded-r-full",
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
        <div className="flex gap-4">
            <div className="flex items-start gap-1">
                <button
                    onClick={() => navigateMonth('prev')}
                    className="p-1 hover:bg-muted rounded transition-colors mt-0.5"
                >
                    <ChevronLeft size={14} />
                </button>
                {renderMonth(leftMonth)}
            </div>
            <div className="flex items-start gap-1">
                {renderMonth(rightMonth)}
                <button
                    onClick={() => navigateMonth('next')}
                    className="p-1 hover:bg-muted rounded transition-colors mt-0.5"
                >
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}

const ComparisonSelector: React.FC<ComparisonSelectorProps> = ({
    granularity,
    comparisonType,
    onTypeChange,
    dateRange
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Close on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const validTypes = getValidComparisonTypes(granularity);
    const activeLabel = comparisonType === 'none' ? '对比' : getComparisonLabel(comparisonType, granularity);
    const shortLabel = activeLabel.split(' (')[0];

    // Calculate comparison date range for display
    const comparisonDateRange = comparisonType !== 'none'
        ? calculateAdvancedComparisonRange(dateRange, granularity, comparisonType)
        : null;

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all border shadow-sm",
                    comparisonType !== 'none'
                        ? "bg-card border-amber-500/30 text-amber-600 hover:border-amber-500/50"
                        : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
            >
                <Calendar size={16} className={comparisonType !== 'none' ? "text-amber-500" : ""} />
                <span>{shortLabel}</span>
                <ChevronDown size={14} className={cn("transition-transform opacity-60", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-popover border border-border rounded-2xl shadow-xl z-50 flex overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Left sidebar - Comparison presets */}
                    <div className="w-28 border-r border-border p-2 bg-muted/30">
                        <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5 mb-1">
                            对比类型
                        </div>
                        {/* None Option */}
                        <button
                            onClick={() => {
                                onTypeChange('none');
                            }}
                            className={cn(
                                "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                                comparisonType === 'none'
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-foreground hover:bg-muted"
                            )}
                        >
                            无对比
                        </button>

                        <div className="h-px bg-border my-1.5" />

                        {/* Valid Options */}
                        {validTypes.filter(t => t !== 'none').map(type => {
                            const fullLabel = getComparisonLabel(type, granularity);
                            const label = fullLabel.split(' (')[0];
                            const isActive = comparisonType === type;

                            return (
                                <button
                                    key={type}
                                    onClick={() => {
                                        onTypeChange(type);
                                    }}
                                    className={cn(
                                        "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                                        isActive
                                            ? "bg-amber-500/10 text-amber-700 font-medium"
                                            : "text-foreground hover:bg-muted"
                                    )}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right area - Calendar view */}
                    <div className="p-4">
                        {/* Date inputs */}
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="text"
                                readOnly
                                value={comparisonDateRange ? format(comparisonDateRange.startDate, 'yyyy-MM-dd') : ''}
                                className="w-28 px-2 py-1.5 border border-border rounded-lg text-sm bg-muted/50 text-center"
                                placeholder="开始日期"
                            />
                            <span className="text-muted-foreground">→</span>
                            <input
                                type="text"
                                readOnly
                                value={comparisonDateRange ? format(comparisonDateRange.endDate, 'yyyy-MM-dd') : ''}
                                className="w-28 px-2 py-1.5 border border-border rounded-lg text-sm bg-muted/50 text-center"
                                placeholder="结束日期"
                            />
                        </div>

                        {/* Dual Calendar Display */}
                        <ComparisonCalendar comparisonDateRange={comparisonDateRange} />

                        {/* Action buttons */}
                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                            >
                                确定
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComparisonSelector;
