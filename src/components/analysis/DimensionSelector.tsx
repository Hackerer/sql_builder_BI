/**
 * DimensionSelector Component
 * Multi-select dimension chips with compatibility validation
 */

import React from 'react';
import { Layers, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Dimension } from '../../types';

export interface DimensionSelectorProps {
    dimensions: Dimension[];
    selectedDims: string[];
    onToggle: (dimId: string) => void;
    isDimDisabled: (dimId: string) => boolean;
    getIncompatibleReason: (dimId: string) => string;
}

export function DimensionSelector({
    dimensions,
    selectedDims,
    onToggle,
    isDimDisabled,
    getIncompatibleReason,
}: DimensionSelectorProps) {
    // Group dimensions by their group
    const groupedDims = dimensions.reduce((acc, dim) => {
        if (!acc[dim.group]) acc[dim.group] = [];
        acc[dim.group].push(dim);
        return acc;
    }, {} as Record<string, Dimension[]>);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Layers size={16} className="text-primary" />
                <span>维度选择</span>
                <span className="text-xs text-muted-foreground">
                    (已选 {selectedDims.length})
                </span>
            </div>

            <div className="space-y-2">
                {Object.entries(groupedDims).map(([group, dims]) => (
                    <div key={group} className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground w-12 shrink-0">
                            {group}
                        </span>
                        {dims.map(dim => {
                            const isSelected = selectedDims.includes(dim.id);
                            const isDisabled = isDimDisabled(dim.id);
                            const reason = getIncompatibleReason(dim.id);

                            return (
                                <button
                                    key={dim.id}
                                    onClick={() => !isDisabled && onToggle(dim.id)}
                                    disabled={isDisabled}
                                    title={reason || dim.description}
                                    className={cn(
                                        "tag-selectable",
                                        isSelected && "tag-active",
                                        isDisabled && "tag-disabled"
                                    )}
                                >
                                    {dim.name}
                                    {isDisabled && (
                                        <AlertCircle size={10} className="ml-1 inline" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
