/**
 * Header Component
 * Top navigation bar with breadcrumb and actions
 */

import React from 'react';
import { ChevronRight, Settings, Moon, Sun } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface HeaderProps {
    breadcrumb?: string[];
    isDarkMode?: boolean;
    onToggleDarkMode?: () => void;
    onOpenConfig?: () => void;
}

export function Header({
    breadcrumb = ['首页', '自助BI分析'],
    isDarkMode = false,
    onToggleDarkMode,
    onOpenConfig,
}: HeaderProps) {
    return (
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-background/50 backdrop-blur-md z-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
                {breadcrumb.map((item, idx) => (
                    <React.Fragment key={item}>
                        {idx > 0 && <ChevronRight size={14} className="text-muted-foreground" />}
                        <span className={cn(
                            "text-sm",
                            idx === breadcrumb.length - 1
                                ? "font-medium text-foreground"
                                : "text-muted-foreground"
                        )}>
                            {item}
                        </span>
                    </React.Fragment>
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {/* Config Button */}
                {onOpenConfig && (
                    <button
                        onClick={onOpenConfig}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary/80 rounded-full transition-all"
                        title="指标配置"
                    >
                        <Settings size={20} />
                    </button>
                )}

                {/* Dark Mode Toggle */}
                {onToggleDarkMode && (
                    <button
                        onClick={onToggleDarkMode}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary/80 rounded-full transition-all"
                        title={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                )}
            </div>
        </header>
    );
}
