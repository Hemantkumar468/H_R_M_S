import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b',
        className,
      )}
    >
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
