/**
 * TimeGranularitySelector Component
 * Select time granularity (hour, day, week, month)
 */

import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { TimeGranularity } from '../../types';
import { TIME_GRANULARITIES } from '../../data';

export interface TimeGranularitySelectorProps {
    value: TimeGranularity;
    onChange: (value: TimeGranularity) => void;
}

export function TimeGranularitySelector({
    value,
    onChange,
}: TimeGranularitySelectorProps) {
    return (
        <div className="flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" />
            <div className="flex bg-muted/50 rounded-lg p-0.5">
                {TIME_GRANULARITIES.map(g => (
                    <button
                        key={g.id}
                        onClick={() => onChange(g.id as TimeGranularity)}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                            value === g.id
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {g.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
