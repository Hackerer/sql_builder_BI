/**
 * Sidebar Component
 * Left navigation sidebar with theme domains
 */

import React from 'react';
import { Zap, LayoutDashboard, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SidebarProps {
    activeIndex?: number;
    onNavigate?: (index: number) => void;
    userName?: string;
    userRole?: string;
}

const NAV_ITEMS = [
    '履约主题域',
    '车辆主题域',
    '营销主题域',
    '资产主题域'
];

export function Sidebar({
    activeIndex = 0,
    onNavigate,
    userName = 'Alex Chen',
    userRole = 'Senior Analyst'
}: SidebarProps) {
    return (
        <aside className="w-60 glass-nav flex flex-col z-20 transition-all duration-300 border-r border-border">
            {/* Logo */}
            <div className="p-6">
                <div className="flex items-center gap-2 text-primary">
                    <Zap size={24} className="fill-primary" />
                    <span className="font-bold text-lg tracking-tight">萤火分析平台</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
                {NAV_ITEMS.map((item, idx) => (
                    <button
                        key={item}
                        onClick={() => onNavigate?.(idx)}
                        className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                            idx === activeIndex
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <LayoutDashboard size={16} />
                            {item}
                        </div>
                        {idx === activeIndex && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>
                ))}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-border mt-auto">
                <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/20 border border-border">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        {userName.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold truncate">{userName}</p>
                        <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">
                            {userRole}
                        </p>
                    </div>
                    <button className="text-muted-foreground hover:text-destructive transition-colors">
                        <LogOut size={14} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
