import { subDays, subWeeks, subMonths, format, startOfWeek } from 'date-fns';
import { TimeGranularity, ComparisonType } from '../types';

/**
 * Get valid comparison types for a given granularity
 */
export const getValidComparisonTypes = (granularity: TimeGranularity): ComparisonType[] => {
    switch (granularity) {
        case 'hour':
            return ['period', 'day', 'week', 'month']; // vs prev hour, yesterday, last week, last month
        case 'day':
            return ['period', 'week', 'month']; // vs yesterday, last week, last month
        case 'week':
            return ['period', 'month']; // vs last week, last month (same week index)
        case 'month':
            return ['period']; // vs last month
        default:
            return ['none'];
    }
};

/**
 * Get display label for comparison type
 */
export const getComparisonLabel = (type: ComparisonType, granularity: TimeGranularity): string => {
    switch (type) {
        case 'period':
            switch (granularity) {
                case 'hour': return '环比 (上一小时)';
                case 'day': return '日环比 (昨日)';
                case 'week': return '周环比 (上周)';
                case 'month': return '月环比 (上月)';
                default: return '环比';
            }
        case 'day':
            return '日环比 (昨日同时间)';
        case 'week':
            return '周环比 (上周同时间)';
        case 'month':
            return '月环比 (上月同时间)';
        default:
            return '无对比';
    }
};

/**
 * Calculate comparison date range based on configuration
 */
export const calculateAdvancedComparisonRange = (
    currentRange: { startDate: Date; endDate: Date },
    granularity: TimeGranularity,
    type: ComparisonType
): { startDate: Date; endDate: Date } => {
    const { startDate, endDate } = currentRange;
    const duration = endDate.getTime() - startDate.getTime();

    switch (type) {
        case 'period':
            // Simple offset by duration (Standard Period-over-Period)
            // But usually for "Period", we want meaningful units
            // e.g. for Day view, we want Yesterday.
            // For range selection, we just shift by duration.
            // For standard granularity views, we use unit subtraction.
            if (granularity === 'hour') {
                return {
                    startDate: new Date(startDate.getTime() - (60 * 60 * 1000)),
                    endDate: new Date(endDate.getTime() - (60 * 60 * 1000))
                };
            }
            if (granularity === 'day') {
                return {
                    startDate: subDays(startDate, 1),
                    endDate: subDays(endDate, 1)
                };
            }
            if (granularity === 'week') {
                return {
                    startDate: subWeeks(startDate, 1),
                    endDate: subWeeks(endDate, 1)
                };
            }
            if (granularity === 'month') {
                return {
                    startDate: subMonths(startDate, 1),
                    endDate: subMonths(endDate, 1)
                };
            }
            // Fallback for custom range
            return {
                startDate: new Date(startDate.getTime() - duration),
                endDate: new Date(endDate.getTime() - duration)
            };

        case 'day':
            return {
                startDate: subDays(startDate, 1),
                endDate: subDays(endDate, 1)
            };

        case 'week':
            return {
                startDate: subWeeks(startDate, 1),
                endDate: subWeeks(endDate, 1)
            };

        case 'month':
            // Special handling for Granularity: Week vs Month (Week-over-Month by index)
            if (granularity === 'week') {
                // TODO: Implement advanced Week-index matching if needed
                // For now, simple subMonths w/ week alignment might be enough or just sub 4 weeks?
                // subMonths is safer for "Same Date Last Month"
                // But for "Same Week Last Month", it's tricky.
                // Let's use simple subMonths for now to avoid complexity crash.
                return {
                    startDate: subMonths(startDate, 1),
                    endDate: subMonths(endDate, 1)
                };
            }
            return {
                startDate: subMonths(startDate, 1),
                endDate: subMonths(endDate, 1)
            };

        default:
            return currentRange;
    }
};
