'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, description, children, className }: ModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal / Drawer Surface */}
      <div
        className={cn(
          'relative z-50 flex flex-col w-full max-h-[90vh] bg-background border border-border shadow-2xl transition-all',
          // Mobile: Bottom Sheet with rounded top corners
          'rounded-t-2xl sm:rounded-2xl',
          // Desktop: Centered dialog box
          'sm:max-w-lg md:max-w-xl lg:max-w-2xl sm:mx-4',
          className,
        )}
      >
        {/* Mobile Pull Indicator */}
        <div className="flex sm:hidden w-full items-center justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">{title}</h2>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
