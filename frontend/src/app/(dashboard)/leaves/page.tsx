'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi, holidayApi } from '@/services/endpoints';
import { ILeaveRequest, IHoliday, LeaveStatus, UserRole } from '@hrms/shared';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Input, Label } from '@/components/ui/input';
import { useAuth } from '@/store/auth-context';
import {
  CalendarDays,
  Plus,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Users,
  Building,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Info,
  CalendarCheck2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function LeavesPage() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<'my' | 'calendar' | 'holidays' | 'approvals'>(
    'my',
  );

  // Month navigation for Team Calendar
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = React.useState<number>(today.getMonth() + 1);
  const [calendarYear, setCalendarYear] = React.useState<number>(today.getFullYear());
  const [selectedCalendarDay, setSelectedCalendarDay] = React.useState<string | null>(null);

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = React.useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = React.useState(false);
  const [approvalModalData, setApprovalModalData] = React.useState<{
    leave: ILeaveRequest | null;
    action: LeaveStatus.APPROVED | LeaveStatus.REJECTED;
    note: string;
  } | null>(null);

  // Apply Form
  const [applyForm, setApplyForm] = React.useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Holiday Form
  const [holidayForm, setHolidayForm] = React.useState({
    title: '',
    date: '',
    description: '',
    isOptional: false,
  });

  // Queries
  const { data: leaveTypes } = useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => (await leaveApi.getTypes()).data || [],
  });

  const { data: balances } = useQuery({
    queryKey: ['leave-balances'],
    queryFn: async () => (await leaveApi.getMyBalances()).data || [],
  });

  const { data: myLeaves, isLoading: isMyLeavesLoading } = useQuery({
    queryKey: ['my-leaves'],
    queryFn: async () => (await leaveApi.getMyLeaves()).data || [],
  });

  const { data: teamCalendar, isLoading: isCalendarLoading } = useQuery({
    queryKey: ['team-calendar', calendarMonth, calendarYear],
    queryFn: async () => (await leaveApi.getTeamCalendar(calendarMonth, calendarYear)).data || [],
  });

  const { data: holidays, isLoading: isHolidaysLoading } = useQuery({
    queryKey: ['holidays-list', calendarYear],
    queryFn: async () => (await holidayApi.list(calendarYear)).data || [],
  });

  const { data: pendingLeaves, isLoading: isPendingLoading } = useQuery({
    queryKey: ['pending-leaves'],
    queryFn: async () => (await leaveApi.listPending()).data || [],
    enabled: hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER),
  });

  // Mutations
  const applyMutation = useMutation({
    mutationFn: async () => leaveApi.apply(applyForm),
    onSuccess: () => {
      toast.success('Leave application submitted to manager!');
      setIsApplyModalOpen(false);
      setApplyForm({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['my-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['team-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['pending-leaves'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit leave application');
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async () => {
      if (!approvalModalData?.leave) return;
      return leaveApi.resolve(approvalModalData.leave._id, {
        status: approvalModalData.action,
        managerComment: approvalModalData.note.trim() || undefined,
      });
    },
    onSuccess: (_, vars) => {
      toast.success(
        `Leave request ${approvalModalData?.action === LeaveStatus.APPROVED ? 'approved' : 'rejected'} successfully!`,
      );
      setApprovalModalData(null);
      queryClient.invalidateQueries({ queryKey: ['pending-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['team-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['my-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Resolution failed');
    },
  });

  const createHolidayMutation = useMutation({
    mutationFn: async () => holidayApi.create(holidayForm),
    onSuccess: () => {
      toast.success('Holiday added successfully!');
      setIsHolidayModalOpen(false);
      setHolidayForm({ title: '', date: '', description: '', isOptional: false });
      queryClient.invalidateQueries({ queryKey: ['holidays-list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create holiday');
    },
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: string) => holidayApi.delete(id),
    onSuccess: () => {
      toast.success('Holiday removed');
      queryClient.invalidateQueries({ queryKey: ['holidays-list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete holiday');
    },
  });

  // Calendar Helpers
  const handlePrevMonth = () => {
    if (calendarMonth === 1) {
      setCalendarMonth(12);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 12) {
      setCalendarMonth(1);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    setCalendarMonth(today.getMonth() + 1);
    setCalendarYear(today.getFullYear());
  };

  const monthName = new Date(calendarYear, calendarMonth - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  // Generate calendar grid days for current month
  const firstDayOfMonth = new Date(calendarYear, calendarMonth - 1, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate();

  // Map dates to leaves & holidays
  const holidaysMap = React.useMemo(() => {
    const map = new Map<string, IHoliday>();
    holidays?.forEach((h) => map.set(h.date, h));
    return map;
  }, [holidays]);

  const getLeavesForDate = (dateStr: string) => {
    if (!teamCalendar) return [];
    return teamCalendar.filter((l) => l.startDate <= dateStr && l.endDate >= dateStr);
  };

  // Columns for My Leaves
  const myColumns: Column<ILeaveRequest>[] = [
    {
      header: 'Leave Type',
      cell: (l) => (
        <span className="font-semibold text-foreground">
          {(l.leaveTypeId as any)?.name || 'General Leave'}
        </span>
      ),
    },
    {
      header: 'Duration',
      cell: (l) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {l.startDate} to {l.endDate} ({l.daysCount} days)
        </span>
      ),
    },
    {
      header: 'Reason',
      cell: (l) => (
        <span className="text-xs text-muted-foreground truncate max-w-xs block">{l.reason}</span>
      ),
    },
    {
      header: 'Status',
      cell: (l) => <StatusBadge status={l.status} />,
    },
    {
      header: 'Manager Note',
      cell: (l) =>
        l.managerComment ? (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-muted text-foreground italic border">
            <MessageSquare className="h-3 w-3 text-primary shrink-0" />
            &ldquo;{l.managerComment}&rdquo;
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaves & Holiday Calendar"
        description="Track annual leave quotas, apply for time off with automated holiday deduction, and view team calendar."
        action={
          <Button onClick={() => setIsApplyModalOpen(true)} className="h-11 px-5 shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Apply for Leave
          </Button>
        }
      />

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {balances?.map((b) => (
          <Card
            key={b.leaveTypeId}
            className="p-3.5 space-y-1 bg-card hover:border-primary/40 transition-colors shadow-2xs"
          >
            <span className="text-[11px] font-semibold text-muted-foreground block truncate">
              {b.leaveTypeName}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-foreground">{b.available}</span>
              <span className="text-[10px] text-muted-foreground font-medium">
                / {b.totalAllocated} days
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t">
              <span>
                Used: <strong className="text-foreground">{b.used}</strong>
              </span>
              {b.pending > 0 && <span className="text-amber-500 font-bold">{b.pending} pend.</span>}
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto space-x-4 no-scrollbar">
        {[
          { id: 'my', label: `My Applications (${myLeaves?.length || 0})` },
          { id: 'calendar', label: `Team Calendar (${teamCalendar?.length || 0})` },
          { id: 'holidays', label: `Holiday Calendar (${holidays?.length || 0})` },
          ...(hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
            ? [{ id: 'approvals', label: `Manager Approvals (${pendingLeaves?.length || 0})` }]
            : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors min-h-[44px] flex items-center ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: My Applications */}
      {activeTab === 'my' && (
        <DataTable
          columns={myColumns}
          data={myLeaves || []}
          keyExtractor={(l) => l._id}
          isLoading={isMyLeavesLoading}
          renderMobileCard={(l) => (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground">
                  {(l.leaveTypeId as any)?.name}
                </span>
                <StatusBadge status={l.status} />
              </div>
              <div className="text-muted-foreground flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>
                  {l.startDate} to {l.endDate}
                </span>{' '}
                • <span className="font-semibold text-foreground">{l.daysCount} working days</span>
              </div>
              <p className="text-muted-foreground italic bg-muted/30 p-2 rounded-lg">
                &ldquo;{l.reason}&rdquo;
              </p>
              {l.managerComment && (
                <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 space-y-0.5">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                    Manager Note:
                  </span>
                  <p className="text-foreground font-medium italic">
                    &ldquo;{l.managerComment}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}
        />
      )}

      {/* Tab 2: Team Leave Calendar (Month View) */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <Card className="shadow-2xs">
            <CardHeader className="p-4 sm:p-6 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarCheck2 className="h-5 w-5 text-primary" />
                    <span>Team Leave Calendar</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN)
                      ? 'Viewing company-wide employee absences for the month'
                      : 'Viewing your team members on approved or pending leaves'}
                  </CardDescription>
                </div>

                {/* Month Navigator */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevMonth}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-bold px-2 min-w-[130px] text-center">
                    {monthName}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextMonth}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCurrentMonth}
                    className="text-xs h-9"
                  >
                    Today
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-2 sm:p-4">
              {/* Day Headers (Sun-Sat) */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                  <div
                    key={d}
                    className={`text-[11px] font-bold py-1.5 rounded-lg ${
                      i === 0 ? 'text-destructive bg-destructive/10' : 'text-muted-foreground'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Empty cells before 1st of month */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="min-h-[70px] sm:min-h-[96px] rounded-xl bg-muted/10 opacity-30"
                  />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayOfWeek = (firstDayOfMonth + i) % 7;
                  const isSunday = dayOfWeek === 0;
                  const holiday = holidaysMap.get(dateStr);
                  const dayLeaves = getLeavesForDate(dateStr);
                  const isToday =
                    dayNum === today.getDate() &&
                    calendarMonth === today.getMonth() + 1 &&
                    calendarYear === today.getFullYear();

                  return (
                    <div
                      key={dateStr}
                      onClick={() => {
                        if (dayLeaves.length > 0 || holiday) {
                          setSelectedCalendarDay(dateStr);
                        }
                      }}
                      className={`min-h-[70px] sm:min-h-[96px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                        isToday
                          ? 'border-primary ring-1 ring-primary/40 bg-primary/5'
                          : isSunday
                            ? 'bg-muted/30 border-dashed'
                            : holiday
                              ? 'bg-purple-500/5 border-purple-500/30'
                              : 'bg-card hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center rounded-full ${
                            isToday
                              ? 'bg-primary text-primary-foreground'
                              : isSunday
                                ? 'text-destructive font-black'
                                : 'text-foreground'
                          }`}
                        >
                          {dayNum}
                        </span>
                        {holiday && (
                          <span
                            className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 truncate max-w-[70px]"
                            title={holiday.title}
                          >
                            {holiday.title}
                          </span>
                        )}
                      </div>

                      {/* Leaves Indicators */}
                      <div className="space-y-0.5 mt-1 overflow-hidden">
                        {holiday && (
                          <div className="sm:hidden text-[9px] font-bold text-purple-600 dark:text-purple-400 truncate">
                            {holiday.title}
                          </div>
                        )}
                        {dayLeaves.slice(0, 2).map((l) => (
                          <div
                            key={l._id}
                            className={`px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold truncate flex items-center justify-between ${
                              l.status === LeaveStatus.APPROVED
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            <span className="truncate">
                              {(l.employeeId as any)?.firstName || 'Staff'}
                            </span>
                          </div>
                        ))}
                        {dayLeaves.length > 2 && (
                          <span className="text-[9px] text-muted-foreground font-bold block text-center">
                            +{dayLeaves.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Holiday Calendar */}
      {activeTab === 'holidays' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-xs sm:text-sm text-foreground">
                  Statutory & Company Observed Holidays
                </p>
                <p className="text-xs text-muted-foreground">
                  Sundays and scheduled holidays are skipped automatically when computing leave
                  days.
                </p>
              </div>
            </div>

            {hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN) && (
              <Button
                size="sm"
                onClick={() => setIsHolidayModalOpen(true)}
                className="h-10 shrink-0"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Add Holiday
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {holidays?.map((h) => (
              <div
                key={h._id}
                className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-2xs text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold shrink-0">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{h.title}</p>
                    <p className="text-muted-foreground font-medium">{h.date}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {h.isOptional ? 'Optional / Restricted' : 'Mandatory Company Holiday'}
                    </span>
                  </div>
                </div>

                {hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN) && (
                  <button
                    onClick={() => deleteHolidayMutation.mutate(h._id)}
                    className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                    title="Delete holiday"
                    aria-label={`Delete holiday ${h.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Manager Approvals */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {!pendingLeaves || pendingLeaves.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-xs text-muted-foreground space-y-2">
                <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="font-bold text-sm text-foreground">All caught up!</p>
                <p>No leave requests currently waiting for your review.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingLeaves.map((leave) => (
                <Card key={leave._id} className="border shadow-2xs">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold">
                          {(leave.employeeId as any)?.firstName}{' '}
                          {(leave.employeeId as any)?.lastName}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {(leave.leaveTypeId as any)?.name} •{' '}
                          <span className="font-semibold text-foreground">
                            {leave.daysCount} working days
                          </span>
                        </CardDescription>
                      </div>
                      <StatusBadge status={leave.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-muted/40 space-y-1">
                      <p className="font-semibold text-foreground">Requested Period:</p>
                      <p className="text-muted-foreground">
                        {leave.startDate} to {leave.endDate}
                      </p>
                      <p className="font-semibold text-foreground pt-1">Reason:</p>
                      <p className="text-muted-foreground italic">&ldquo;{leave.reason}&rdquo;</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                        onClick={() =>
                          setApprovalModalData({
                            leave,
                            action: LeaveStatus.APPROVED,
                            note: '',
                          })
                        }
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 h-11"
                        onClick={() =>
                          setApprovalModalData({
                            leave,
                            action: LeaveStatus.REJECTED,
                            note: '',
                          })
                        }
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

      {/* Day Details Modal (when clicked on a calendar cell) */}
      <Modal
        isOpen={!!selectedCalendarDay}
        onClose={() => setSelectedCalendarDay(null)}
        title={selectedCalendarDay ? `Scheduled Absences: ${selectedCalendarDay}` : ''}
        description="Employees on leave and scheduled holidays on this date"
      >
        {selectedCalendarDay && (
          <div className="space-y-4">
            {holidaysMap.get(selectedCalendarDay) && (
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  🎉 Company Holiday: {holidaysMap.get(selectedCalendarDay)?.title}
                </span>
              </div>
            )}

            {getLeavesForDate(selectedCalendarDay).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No team members on leave on this date.
              </p>
            ) : (
              <div className="space-y-2">
                {getLeavesForDate(selectedCalendarDay).map((l) => (
                  <div
                    key={l._id}
                    className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-foreground">
                        {(l.employeeId as any)?.firstName} {(l.employeeId as any)?.lastName}
                      </p>
                      <p className="text-muted-foreground">
                        {(l.leaveTypeId as any)?.name} • {l.startDate} to {l.endDate}
                      </p>
                      <p className="text-[11px] text-muted-foreground italic mt-0.5">
                        &ldquo;{l.reason}&rdquo;
                      </p>
                    </div>
                    <StatusBadge status={l.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approval / Rejection with Optional Note Modal */}
      <Modal
        isOpen={!!approvalModalData}
        onClose={() => setApprovalModalData(null)}
        title={
          approvalModalData?.action === LeaveStatus.APPROVED
            ? 'Approve Leave Request'
            : 'Reject Leave Request'
        }
        description={`Resolve leave request for ${(approvalModalData?.leave?.employeeId as any)?.firstName || 'employee'}`}
      >
        {approvalModalData?.leave && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-muted/40 space-y-1 text-xs">
              <p className="font-semibold text-foreground">Leave Details:</p>
              <p className="text-muted-foreground">
                Period: {approvalModalData.leave.startDate} to {approvalModalData.leave.endDate} (
                {approvalModalData.leave.daysCount} working days)
              </p>
              <p className="text-muted-foreground italic">
                Reason: &ldquo;{approvalModalData.leave.reason}&rdquo;
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="managerNote">Manager Note / Feedback (Optional)</Label>
              <Input
                id="managerNote"
                placeholder="e.g. Approved, please hand over emergency support"
                value={approvalModalData.note}
                onChange={(e) =>
                  setApprovalModalData({
                    ...approvalModalData,
                    note: e.target.value,
                  })
                }
              />
              <p className="text-[11px] text-muted-foreground">
                This note will be visible to the employee in their leave history and notification.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" className="h-11" onClick={() => setApprovalModalData(null)}>
                Cancel
              </Button>
              <Button
                className={`h-11 ${
                  approvalModalData.action === LeaveStatus.APPROVED
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-destructive hover:bg-destructive/90 text-white'
                }`}
                onClick={() => resolveMutation.mutate()}
                isLoading={resolveMutation.isPending}
              >
                {approvalModalData.action === LeaveStatus.APPROVED
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Apply Leave Modal / Bottom Sheet */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Leave"
        description="Submit a time-off application. Sundays and holidays are automatically excluded."
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs flex items-start gap-2">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              Working days will be calculated automatically. Official company holidays and Sundays
              will not be deducted from your leave balance.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="leaveType" required>
              Leave Type
            </Label>
            <select
              id="leaveType"
              value={applyForm.leaveTypeId}
              onChange={(e) => setApplyForm({ ...applyForm, leaveTypeId: e.target.value })}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select Leave Type</option>
              {leaveTypes?.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.daysPerYear} days/yr)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="startDate" required>
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={applyForm.startDate}
                onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate" required>
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={applyForm.endDate}
                onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="reason" required>
              Reason for Leave
            </Label>
            <Input
              id="reason"
              placeholder="e.g. Attending family wedding, medical checkup"
              value={applyForm.reason}
              onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" className="h-11" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="h-11 px-5"
              onClick={() => applyMutation.mutate()}
              isLoading={applyMutation.isPending}
              disabled={
                !applyForm.leaveTypeId ||
                !applyForm.startDate ||
                !applyForm.endDate ||
                !applyForm.reason
              }
            >
              Submit Application
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Holiday Modal */}
      <Modal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        title="Add Company Holiday"
        description="Schedule an official company holiday (excluded from leave deductions)"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="holidayTitle" required>
              Holiday Name
            </Label>
            <Input
              id="holidayTitle"
              placeholder="e.g. Diwali / Republic Day"
              value={holidayForm.title}
              onChange={(e) => setHolidayForm({ ...holidayForm, title: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="holidayDate" required>
              Date
            </Label>
            <Input
              id="holidayDate"
              type="date"
              value={holidayForm.date}
              onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isOptional"
              checked={holidayForm.isOptional}
              onChange={(e) => setHolidayForm({ ...holidayForm, isOptional: e.target.checked })}
              className="h-4 w-4 rounded border-input text-primary"
            />
            <Label htmlFor="isOptional">Optional / Restricted Holiday</Label>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" className="h-11" onClick={() => setIsHolidayModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="h-11 px-5"
              onClick={() => createHolidayMutation.mutate()}
              isLoading={createHolidayMutation.isPending}
              disabled={!holidayForm.title || !holidayForm.date}
            >
              Add Holiday
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
