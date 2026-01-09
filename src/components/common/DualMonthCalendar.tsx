/**
 * DualMonthCalendar - Interactive calendar component for date range selection
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isWithinInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '../../lib/utils';

interface DualMonthCalendarProps {
    startDate: Date | null;
    endDate: Date | null;
    onDateClick: (date: Date) => void;
}

export function DualMonthCalendar({ startDate, endDate, onDateClick }: DualMonthCalendarProps) {
    const [leftMonth, setLeftMonth] = useState(startOfMonth(startDate || new Date()));
    const rightMonth = addMonths(leftMonth, 1);

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
            if (!startDate || !endDate) return false;
            return isWithinInterval(day, { start: startDate, end: endDate });
        };

        const isStart = (day: Date) => startDate && isSameDay(day, startDate);
        const isEnd = (day: Date) => endDate && isSameDay(day, endDate);

        return (
            <div className="flex-1">
                <div className="text-center font-medium text-sm mb-3">
                    {format(monthDate, 'yyyy年 M月', { locale: zhCN })}
                </div>
                <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground mb-2">
                    {['一', '二', '三', '四', '五', '六', '日'].map(d => (
                        <div key={d} className="h-8 flex items-center justify-center font-medium">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: adjustedStartDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-8" />
                    ))}
                    {days.map(day => (
                        <button
                            key={day.toISOString()}
                            type="button"
                            onClick={() => onDateClick(day)}
                            className={cn(
                                "h-8 flex items-center justify-center text-sm rounded-md transition-colors",
                                isInRange(day) && "bg-primary/10",
                                isStart(day) && "bg-primary text-primary-foreground font-bold",
                                isEnd(day) && "bg-primary text-primary-foreground font-bold",
                                !isInRange(day) && !isStart(day) && !isEnd(day) && "hover:bg-muted cursor-pointer"
                            )}
                        >
                            {format(day, 'd')}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex gap-4">
            <button
                type="button"
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-muted rounded transition-colors self-start mt-6"
            >
                <ChevronLeft size={16} />
            </button>
            {renderMonth(leftMonth)}
            {renderMonth(rightMonth)}
            <button
                type="button"
                onClick={() => navigateMonth('next')}
                className="p-1 hover:bg-muted rounded transition-colors self-start mt-6"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
}
