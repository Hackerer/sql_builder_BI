/**
 * PageContainer Component
 * Main layout wrapper for pages
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
    return (
        <div className={cn(
            "flex-1 flex flex-col overflow-hidden relative",
            className
        )}>
            {children}
        </div>
    );
}
