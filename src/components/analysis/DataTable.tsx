/**
 * DataTable Component
 * Data display table with sorting and comparison indicators
 */

import React from 'react';
import { ArrowUp, ArrowDown, Table as TableIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { TableViewMode } from '../../types';

// TableColumn type definition (previously from hooks)
export interface TableColumn {
    key: string;
    header: string;
    type?: 'dimension' | 'metric' | 'comparison';
    align?: 'left' | 'right';
    description?: string;
}

export interface DataTableProps {
    data: any[];
    columns: TableColumn[];
    viewMode: TableViewMode;
    onViewModeChange: (mode: TableViewMode) => void;
    isLoading?: boolean;
}

export function DataTable({
    data,
    columns,
    viewMode,
    onViewModeChange,
    isLoading = false,
}: DataTableProps) {
    const formatValue = (value: any, column: TableColumn) => {
        if (value === null || value === undefined) return '-';

        if (column.type === 'comparison') {
            const numVal = parseFloat(value);
            const isPositive = numVal > 0;
            const isNegative = numVal < 0;
            return (
                <span className={cn(
                    "flex items-center justify-end gap-1",
                    isPositive && "text-green-600",
                    isNegative && "text-red-500"
                )}>
                    {isPositive && <ArrowUp size={12} />}
                    {isNegative && <ArrowDown size={12} />}
                    {Math.abs(numVal).toFixed(1)}%
                </span>
            );
        }

        if (typeof value === 'number') {
            return value.toLocaleString();
        }

        return value;
    };

    return (
        <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <TableIcon size={16} className="text-primary" />
                    <span className="text-sm font-semibold">数据明细</span>
                    <span className="text-xs text-muted-foreground">
                        ({data.length} 条记录)
                    </span>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-muted/50 rounded-lg p-0.5">
                    {(['summary', 'detail'] as TableViewMode[]).map(mode => (
                        <button
                            key={mode}
                            onClick={() => onViewModeChange(mode)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                viewMode === mode
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {mode === 'summary' ? '汇总' : '明细'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-96">
                {isLoading ? (
                    <div className="h-48 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                ) : data.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                        暂无数据
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0">
                            <tr>
                                {columns.map(col => (
                                    <th
                                        key={col.key}
                                        className={cn(
                                            "px-4 py-3 font-medium text-muted-foreground whitespace-nowrap",
                                            col.align === 'right' ? "text-right" : "text-left"
                                        )}
                                        title={col.description}
                                    >
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.slice(0, 50).map((row, idx) => (
                                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                    {columns.map(col => (
                                        <td
                                            key={col.key}
                                            className={cn(
                                                "px-4 py-3 whitespace-nowrap",
                                                col.align === 'right' ? "text-right" : "text-left",
                                                col.type === 'dimension' && "font-medium"
                                            )}
                                        >
                                            {formatValue(row[col.key], col)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer */}
            {data.length > 50 && (
                <div className="p-3 text-center text-xs text-muted-foreground border-t border-border">
                    显示前 50 条，共 {data.length} 条
                </div>
            )}
        </div>
    );
}
