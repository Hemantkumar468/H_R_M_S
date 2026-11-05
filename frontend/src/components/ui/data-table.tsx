'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { EmptyState } from './empty-state';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  renderMobileCard?: (item: T) => React.ReactNode;
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (newPage: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  renderMobileCard,
  isLoading,
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  page = 1,
  totalPages = 1,
  onPageChange,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display at this time.',
}: DataTableProps<T>) {
  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Search Header */}
      {onSearchChange && (
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 sm:h-12 w-full animate-pulse rounded-lg bg-muted/60" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          {/* Mobile View: Card List (< 640px) */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {data.map((item) => (
              <div
                key={keyExtractor(item)}
                className="rounded-xl border bg-card p-4 shadow-sm space-y-2 hover:border-primary/40 transition-colors"
              >
                {renderMobileCard ? (
                  renderMobileCard(item)
                ) : (
                  <div className="space-y-2">
                    {columns.map((col, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-medium text-muted-foreground">{col.header}:</span>
                        <span>
                          {col.cell
                            ? col.cell(item)
                            : col.accessorKey
                              ? String(item[col.accessorKey] ?? '')
                              : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop View: Table (>= 640px) */}
          <div className="hidden sm:block rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="border-b bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    {columns.map((col, idx) => (
                      <th key={idx} className={`px-4 py-3.5 ${col.className || ''}`}>
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((item) => (
                    <tr key={keyExtractor(item)} className="hover:bg-muted/30 transition-colors">
                      {columns.map((col, idx) => (
                        <td key={idx} className={`px-4 py-3.5 align-middle ${col.className || ''}`}>
                          {col.cell
                            ? col.cell(item)
                            : col.accessorKey
                              ? String(item[col.accessorKey] ?? '')
                              : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between pt-2 px-1 text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
