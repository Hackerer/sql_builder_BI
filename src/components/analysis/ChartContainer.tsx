/**
 * ChartContainer Component
 * Chart display with type switching (area, bar, line)
 */

import React from 'react';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ChartType } from '../../types';

// ChartSeries type definition (previously from hooks)
export interface ChartSeries {
    key: string;
    name: string;
    color: string;
}

export interface ChartContainerProps {
    data: any[];
    series: ChartSeries[];
    chartType: ChartType;
    onChartTypeChange: (type: ChartType) => void;
    isLoading?: boolean;
    title?: string;
}

const CHART_TYPE_ICONS = {
    area: TrendingUp,
    bar: BarChart3,
    line: PieChart,
};

export function ChartContainer({
    data,
    series,
    chartType,
    onChartTypeChange,
    isLoading = false,
    title = '数据趋势',
}: ChartContainerProps) {
    const renderChart = () => {
        if (data.length === 0 || series.length === 0) {
            return (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                    暂无数据，请执行查询
                </div>
            );
        }

        const commonProps = {
            data,
            margin: { top: 10, right: 30, left: 0, bottom: 0 },
        };

        switch (chartType) {
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            {series.map((s, idx) => (
                                <linearGradient key={s.key} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="dt" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                            }}
                        />
                        <Legend />
                        {series.map((s, idx) => (
                            <Area
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.name}
                                stroke={s.color}
                                fill={`url(#gradient-${idx})`}
                                strokeWidth={2}
                            />
                        ))}
                    </AreaChart>
                );

            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="dt" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                            }}
                        />
                        <Legend />
                        {series.map(s => (
                            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} />
                        ))}
                    </BarChart>
                );

            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="dt" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                            }}
                        />
                        <Legend />
                        {series.map(s => (
                            <Line
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.name}
                                stroke={s.color}
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                        ))}
                    </LineChart>
                );
        }
    };

    return (
        <div className="glass-card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>

                {/* Chart Type Switcher */}
                <div className="flex bg-muted/50 rounded-lg p-0.5">
                    {(['area', 'bar', 'line'] as ChartType[]).map(type => {
                        const Icon = CHART_TYPE_ICONS[type];
                        return (
                            <button
                                key={type}
                                onClick={() => onChartTypeChange(type)}
                                className={cn(
                                    "p-2 rounded-md transition-all",
                                    chartType === type
                                        ? "bg-background text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon size={16} />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Chart */}
            <div className="h-80">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        {renderChart()}
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
