'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollApi } from '@/services/endpoints';
import { IPayrollItem, UserRole } from '@hrms/shared';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Input, Label } from '@/components/ui/input';
import { useAuth } from '@/store/auth-context';
import {
  CreditCard,
  Play,
  Download,
  FileText,
  DollarSign,
  TrendingDown,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PayrollPage() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = React.useState(currentMonth);
  const [selectedYear, setSelectedYear] = React.useState(currentYear);
  const [isRunModalOpen, setIsRunModalOpen] = React.useState(false);

  const [runMonth, setRunMonth] = React.useState(currentMonth);
  const [runYear, setRunYear] = React.useState(currentYear);

  // Queries
  const { data: monthlyRecords, isLoading: isRecordsLoading } = useQuery({
    queryKey: ['payroll', 'monthly', selectedMonth, selectedYear],
    queryFn: async () => (await payrollApi.listMonthly(selectedMonth, selectedYear)).data || [],
    enabled: hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
  });

  const { data: myPayslips, isLoading: isMyLoading } = useQuery({
    queryKey: ['payroll', 'my'],
    queryFn: async () => (await payrollApi.getMyPayslips()).data || [],
  });

  // Run Monthly Payroll Mutation
  const runPayrollMutation = useMutation({
    mutationFn: async () => {
      return payrollApi.runPayroll({ month: runMonth, year: runYear });
    },
    onSuccess: (res) => {
      toast.success(
        `Payroll generated successfully for ${res.data?.totalEmployeesProcessed} employees! Payslips ready.`,
      );
      setIsRunModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Payroll execution failed');
    },
  });

  const totalGross = monthlyRecords?.reduce((sum, r) => sum + r.earnings.grossEarnings, 0) || 0;
  const totalDeductions =
    monthlyRecords?.reduce((sum, r) => sum + r.deductions.totalDeductions, 0) || 0;
  const totalNet = monthlyRecords?.reduce((sum, r) => sum + r.netSalary, 0) || 0;

  const records = hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN) ? monthlyRecords : myPayslips;

  const columns: Column<IPayrollItem>[] = [
    {
      header: 'Employee',
      cell: (p) => (
        <div>
          <span className="font-semibold text-foreground block">
            {(p.employeeId as any)?.firstName} {(p.employeeId as any)?.lastName}
          </span>
          <span className="text-xs text-muted-foreground block">
            {(p.employeeId as any)?.employeeId}
          </span>
        </div>
      ),
    },
    {
      header: 'Pay Period',
      cell: (p) => (
        <span className="font-medium text-xs">
          {p.month}/{p.year}
        </span>
      ),
    },
    {
      header: 'Days Worked',
      cell: (p) => (
        <span className="text-xs text-muted-foreground">
          {p.payableDays} / {p.totalWorkingDays} days
        </span>
      ),
    },
    {
      header: 'Gross Earnings',
      cell: (p) => (
        <span className="text-xs font-semibold">
          INR {p.earnings.grossEarnings?.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Deductions (PF/ESI/TDS)',
      cell: (p) => (
        <span className="text-xs font-semibold text-rose-500">
          -INR {p.deductions.totalDeductions?.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Net Take-Home',
      cell: (p) => (
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
          INR {p.netSalary?.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (p) => <StatusBadge status={p.status} />,
    },
    {
      header: 'Payslip PDF',
      cell: (p) => (
        <a
          href={payrollApi.getPayslipDownloadUrl(p._id)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary font-semibold text-xs hover:bg-primary/20 transition-colors"
        >
          <Download className="h-3.5 w-3.5" /> PDF
        </a>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll & Payslip Management"
        description="Statutory deductions (Indian PF, ESI, Professional Tax, TDS) and automated PDF payslip generation."
        action={
          hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN) && (
            <Button onClick={() => setIsRunModalOpen(true)}>
              <Play className="h-4 w-4 mr-2" />
              Execute Monthly Payroll
            </Button>
          )
        }
      />

      {/* Admin KPI Summary */}
      {hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Disbursed Gross</span>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-black text-foreground mt-1">
              INR {totalGross.toLocaleString()}
            </p>
          </Card>

          <Card className="p-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Statutory Deductions (PF/ESI/Tax)
              </span>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </div>
            <p className="text-2xl font-black text-rose-500 mt-1">
              INR {totalDeductions.toLocaleString()}
            </p>
          </Card>

          <Card className="p-4 bg-emerald-500/10 border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                Net Salary Payout
              </span>
              <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
              INR {totalNet.toLocaleString()}
            </p>
          </Card>
        </div>
      )}

      {/* Period Filter for Admins */}
      {hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN) && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground">Viewing Period:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs font-medium"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={m}>
                Month {m}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs font-medium"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={records || []}
        keyExtractor={(p) => p._id}
        isLoading={
          hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN) ? isRecordsLoading : isMyLoading
        }
        renderMobileCard={(p) => (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-foreground">
                  {(p.employeeId as any)?.firstName} {(p.employeeId as any)?.lastName}
                </span>
                <span className="text-xs text-muted-foreground block">
                  Period: {p.month}/{p.year}
                </span>
              </div>
              <StatusBadge status={p.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y">
              <div>
                <span className="text-muted-foreground block text-[11px]">Gross Earnings:</span>
                <span className="font-semibold text-foreground">
                  INR {p.earnings.grossEarnings}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Deductions:</span>
                <span className="font-semibold text-rose-500">
                  -INR {p.deductions.totalDeductions}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-[11px] text-muted-foreground block">Net Pay:</span>
                <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                  INR {p.netSalary}
                </span>
              </div>
              <a
                href={payrollApi.getPayslipDownloadUrl(p._id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-sm"
              >
                <Download className="h-3.5 w-3.5" /> Download PDF
              </a>
            </div>
          </div>
        )}
      />

      {/* Execute Payroll Modal */}
      <Modal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        title="Execute Monthly Payroll Run"
        description="Calculate salary structures, prorate attendance, apply Indian statutory deductions, and generate PDF payslips for all active employees."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Month (1-12)</Label>
              <select
                value={runMonth}
                onChange={(e) => setRunMonth(Number(e.target.value))}
                className="flex h-11 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    Month {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <Input
                type="number"
                value={runYear}
                onChange={(e) => setRunYear(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-400 text-xs leading-relaxed">
            Executing this run will automatically compile attendance records, verify paid leaves,
            apply standard Provident Fund (12%) and ESI (0.75%), calculate TDS, and create signed
            PDF payslips.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsRunModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => runPayrollMutation.mutate()}
              isLoading={runPayrollMutation.isPending}
            >
              Start Payroll Processing
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
