'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/services/endpoints';
import { IAttendance, RegularizationStatus, UserRole } from '@hrms/shared';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Input, Label } from '@/components/ui/input';
import { useAuth } from '@/store/auth-context';
import {
  Clock,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  FileEdit,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AttendancePage() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<'my' | 'approvals'>('my');

  // Regularize modal state
  const [selectedRecord, setSelectedRecord] = React.useState<IAttendance | null>(null);
  const [reqCheckIn, setReqCheckIn] = React.useState('');
  const [reqCheckOut, setReqCheckOut] = React.useState('');
  const [regReason, setRegReason] = React.useState('');

  // Manager Approval modal state
  const [selectedPendingReg, setSelectedPendingReg] = React.useState<IAttendance | null>(null);
  const [managerComment, setManagerComment] = React.useState('');

  // 1. Fetch Today Status
  const { data: todayStatus } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: async () => (await attendanceApi.getTodayStatus()).data,
  });

  // 2. Fetch My Monthly Attendance
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { data: myRecords, isLoading: isMyLoading } = useQuery({
    queryKey: ['attendance', 'my', currentMonth, currentYear],
    queryFn: async () =>
      (await attendanceApi.getMyAttendance(currentMonth, currentYear)).data || [],
  });

  // 3. Fetch Pending Regularizations for Managers / Admins
  const { data: pendingRegs, isLoading: isPendingLoading } = useQuery({
    queryKey: ['attendance', 'regularizations', 'pending'],
    queryFn: async () => (await attendanceApi.listPendingRegularizations()).data || [],
    enabled: hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER),
  });

  // Check In Mutation
  const checkInMutation = useMutation({
    mutationFn: async () => attendanceApi.checkIn({ locationName: 'Office Web Portal' }),
    onSuccess: () => {
      toast.success('Checked in successfully!');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Check-in failed');
    },
  });

  // Check Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => attendanceApi.checkOut({ locationName: 'Office Web Portal' }),
    onSuccess: () => {
      toast.success('Checked out successfully!');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Check-out failed');
    },
  });

  // Request Regularization Mutation
  const regularizeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRecord) return;
      return attendanceApi.requestRegularization({
        attendanceId: selectedRecord._id,
        requestedCheckIn: reqCheckIn,
        requestedCheckOut: reqCheckOut,
        reason: regReason,
      });
    },
    onSuccess: () => {
      toast.success('Regularization request sent to manager for approval!');
      setSelectedRecord(null);
      setReqCheckIn('');
      setReqCheckOut('');
      setRegReason('');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit regularization');
    },
  });

  // Resolve Regularization Mutation
  const resolveMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: RegularizationStatus.APPROVED | RegularizationStatus.REJECTED;
    }) => {
      return attendanceApi.resolveRegularization(id, {
        status,
        managerComment,
      });
    },
    onSuccess: (_, vars) => {
      toast.success(`Regularization request ${vars.status.toLowerCase()}!`);
      setSelectedPendingReg(null);
      setManagerComment('');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Action failed');
    },
  });

  // Columns for My Attendance
  const myColumns: Column<IAttendance>[] = [
    {
      header: 'Date',
      accessorKey: 'date',
    },
    {
      header: 'Check In',
      cell: (r) =>
        r.checkIn
          ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '—',
    },
    {
      header: 'Check Out',
      cell: (r) =>
        r.checkOut
          ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '—',
    },
    {
      header: 'Hours',
      cell: (r) => (r.workingHours ? `${r.workingHours} hrs` : '—'),
    },
    {
      header: 'Status',
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Regularization',
      cell: (r) =>
        r.regularizationStatus !== RegularizationStatus.NONE ? (
          <StatusBadge status={r.regularizationStatus} />
        ) : (
          <button
            onClick={() => {
              setSelectedRecord(r);
              setReqCheckIn(`${r.date}T09:30`);
              setReqCheckOut(`${r.date}T18:30`);
            }}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <FileEdit className="h-3 w-3" /> Request
          </button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance & Time Tracking"
        description="Daily check-in, working hours calculation, and attendance regularization requests."
      />

      {/* Today's Punch Widget Card */}
      <Card className="border bg-gradient-to-r from-primary/10 via-background to-background">
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary block">
              Today:{' '}
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {todayStatus?.status && <StatusBadge status={todayStatus.status} />}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayStatus?.checkIn
                ? `Clocked in at ${new Date(todayStatus.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'You have not checked in for today yet.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!todayStatus?.checkIn ? (
              <Button
                onClick={() => checkInMutation.mutate()}
                isLoading={checkInMutation.isPending}
                size="lg"
                className="w-full sm:w-auto shadow-md"
              >
                <Clock className="h-4 w-4 mr-2" />
                Clock In
              </Button>
            ) : !todayStatus?.checkOut ? (
              <Button
                variant="outline"
                onClick={() => checkOutMutation.mutate()}
                isLoading={checkOutMutation.isPending}
                size="lg"
                className="w-full sm:w-auto border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <Clock className="h-4 w-4 mr-2" />
                Clock Out
              </Button>
            ) : (
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                Day Complete ({todayStatus.workingHours} hours worked)
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs: My Attendance vs Manager Approvals */}
      <div className="flex border-b space-x-4">
        <button
          onClick={() => setActiveTab('my')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'my'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CalendarCheck className="h-4 w-4" />
          My Attendance ({myRecords?.length || 0})
        </button>

        {hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER) && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'approvals'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Manager Approvals ({pendingRegs?.length || 0})
          </button>
        )}
      </div>

      {/* Tab 1: My Attendance */}
      {activeTab === 'my' && (
        <DataTable
          columns={myColumns}
          data={myRecords || []}
          keyExtractor={(r) => r._id}
          isLoading={isMyLoading}
          renderMobileCard={(r) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground">{r.date}</span>
                <StatusBadge status={r.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="block text-[11px]">Check In:</span>
                  <span className="font-medium text-foreground">
                    {r.checkIn
                      ? new Date(r.checkIn).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px]">Check Out:</span>
                  <span className="font-medium text-foreground">
                    {r.checkOut
                      ? new Date(r.checkOut).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <span>
                  Working Hours:{' '}
                  <span className="font-semibold text-foreground">{r.workingHours || 0} hrs</span>
                </span>
                {r.regularizationStatus !== RegularizationStatus.NONE ? (
                  <StatusBadge status={r.regularizationStatus} />
                ) : (
                  <button
                    onClick={() => {
                      setSelectedRecord(r);
                      setReqCheckIn(`${r.date}T09:30`);
                      setReqCheckOut(`${r.date}T18:30`);
                    }}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <FileEdit className="h-3 w-3" /> Regularize
                  </button>
                )}
              </div>
            </div>
          )}
        />
      )}

      {/* Tab 2: Manager Regularization Approvals */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {!pendingRegs || pendingRegs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-xs sm:text-sm text-muted-foreground">
                No pending regularization requests waiting for your approval.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRegs.map((reg) => (
                <Card key={reg._id} className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold">
                          {(reg.employeeId as any)?.firstName} {(reg.employeeId as any)?.lastName}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Emp ID: {(reg.employeeId as any)?.employeeId} • Date: {reg.date}
                        </CardDescription>
                      </div>
                      <StatusBadge status={reg.regularizationStatus} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                      <p className="font-semibold text-foreground">Reason for Regularization:</p>
                      <p className="text-muted-foreground italic">
                        &ldquo;{reg.regularizationReason}&rdquo;
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      <div>
                        <span>Requested In:</span>
                        <p className="font-semibold text-foreground">
                          {reg.requestedCheckIn
                            ? new Date(reg.requestedCheckIn).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '09:30 AM'}
                        </p>
                      </div>
                      <div>
                        <span>Requested Out:</span>
                        <p className="font-semibold text-foreground">
                          {reg.requestedCheckOut
                            ? new Date(reg.requestedCheckOut).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '06:30 PM'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() =>
                          resolveMutation.mutate({
                            id: reg._id,
                            status: RegularizationStatus.APPROVED,
                          })
                        }
                        isLoading={resolveMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() =>
                          resolveMutation.mutate({
                            id: reg._id,
                            status: RegularizationStatus.REJECTED,
                          })
                        }
                        isLoading={resolveMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1.5" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Regularize Modal / Bottom Sheet */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Request Attendance Regularization"
        description={`Submit time correction request for ${selectedRecord?.date}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="reqIn" required>
                Requested Clock-In
              </Label>
              <Input
                id="reqIn"
                type="datetime-local"
                value={reqCheckIn}
                onChange={(e) => setReqCheckIn(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reqOut" required>
                Requested Clock-Out
              </Label>
              <Input
                id="reqOut"
                type="datetime-local"
                value={reqCheckOut}
                onChange={(e) => setReqCheckOut(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="regReason" required>
              Reason for Regularization
            </Label>
            <Input
              id="regReason"
              placeholder="e.g. Biometric scanner issue, outdoor client meeting"
              value={regReason}
              onChange={(e) => setRegReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setSelectedRecord(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => regularizeMutation.mutate()}
              isLoading={regularizeMutation.isPending}
              disabled={!regReason || !reqCheckIn || !reqCheckOut}
            >
              Submit to Manager
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
