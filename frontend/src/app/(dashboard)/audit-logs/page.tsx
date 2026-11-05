'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogApi } from '@/services/endpoints';
import { IAuditLog } from '@hrms/shared';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { ShieldAlert, User, Clock, Terminal } from 'lucide-react';

export default function AuditLogsPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [selectedLog, setSelectedLog] = React.useState<IAuditLog | null>(null);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs', page, search],
    queryFn: async () => {
      return auditLogApi.list({
        page,
        limit: 15,
        search: search || undefined,
      });
    },
  });

  const columns: Column<IAuditLog>[] = [
    {
      header: 'Timestamp',
      cell: (log) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(log.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'User',
      cell: (log) => (
        <div>
          <span className="font-semibold text-xs text-foreground block">{log.userEmail}</span>
          <span className="text-[10px] text-muted-foreground block">{log.userRole}</span>
        </div>
      ),
    },
    {
      header: 'Action',
      cell: (log) => (
        <Badge variant={log.action.includes('DELETE') ? 'destructive' : 'secondary'}>
          {log.action}
        </Badge>
      ),
    },
    {
      header: 'Entity',
      cell: (log) => <span className="text-xs font-medium text-foreground">{log.entity}</span>,
    },
    {
      header: 'Details',
      cell: (log) => (
        <span className="text-xs text-muted-foreground truncate max-w-sm block">{log.details}</span>
      ),
    },
    {
      header: 'Diff',
      cell: (log) =>
        log.diff ? (
          <button
            onClick={() => setSelectedLog(log)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Inspect
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Audit Trail"
        description="Immutable record of user operations, state modifications, employee lifecycle changes, and security events."
      />

      <DataTable
        columns={columns}
        data={logsData?.data || []}
        keyExtractor={(l) => l._id}
        isLoading={isLoading}
        searchPlaceholder="Search audit events by user, details, or entity..."
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        page={page}
        totalPages={logsData?.meta?.totalPages || 1}
        onPageChange={setPage}
        renderMobileCard={(log) => (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">{log.userEmail}</span>
              <Badge variant={log.action.includes('DELETE') ? 'destructive' : 'secondary'}>
                {log.action}
              </Badge>
            </div>
            <p className="text-muted-foreground leading-relaxed">{log.details}</p>
            <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
              <span>{new Date(log.createdAt).toLocaleString()}</span>
              {log.diff && (
                <button
                  onClick={() => setSelectedLog(log)}
                  className="font-semibold text-primary hover:underline"
                >
                  Inspect Changes
                </button>
              )}
            </div>
          </div>
        )}
      />

      {/* Inspect Diff Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Details"
        description={`Event ID: ${selectedLog?._id} • ${selectedLog?.action} on ${selectedLog?.entity}`}
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-lg bg-muted/40 space-y-1">
            <p className="font-semibold text-foreground">Action Summary:</p>
            <p className="text-muted-foreground">{selectedLog?.details}</p>
            <p className="text-[11px] text-muted-foreground pt-1">
              Triggered by: {selectedLog?.userEmail} ({selectedLog?.userRole}) • IP:{' '}
              {selectedLog?.ipAddress}
            </p>
          </div>

          {selectedLog?.diff?.before && (
            <div className="space-y-1">
              <span className="font-bold text-destructive">Previous State (Before):</span>
              <pre className="p-3 rounded-lg bg-black/80 text-rose-300 overflow-x-auto text-[11px] max-h-48">
                {JSON.stringify(selectedLog.diff.before, null, 2)}
              </pre>
            </div>
          )}

          {selectedLog?.diff?.after && (
            <div className="space-y-1">
              <span className="font-bold text-emerald-500">Updated State (After):</span>
              <pre className="p-3 rounded-lg bg-black/80 text-emerald-300 overflow-x-auto text-[11px] max-h-48">
                {JSON.stringify(selectedLog.diff.after, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
