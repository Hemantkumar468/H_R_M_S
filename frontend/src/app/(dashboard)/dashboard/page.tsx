'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/store/auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, employeeApi, leaveApi, holidayApi } from '@/services/endpoints';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import {
  Users,
  CalendarCheck,
  CalendarDays,
  FileCheck2,
  Clock,
  ArrowRight,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Fetch Today's Attendance Status
  const { data: todayAttendance, isLoading: isAttLoading } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: async () => {
      const res = await attendanceApi.getTodayStatus();
      return res.data;
    },
  });

  // 2. Fetch Employee Count
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'summary'],
    queryFn: async () => {
      const res = await employeeApi.list({ limit: 1 });
      return res.meta;
    },
  });

  // 3. Fetch Pending Approvals
  const { data: pendingLeaves } = useQuery({
    queryKey: ['leaves', 'pending'],
    queryFn: async () => {
      const res = await leaveApi.listPending();
      return res.data || [];
    },
  });

  const { data: pendingRegularizations } = useQuery({
    queryKey: ['regularizations', 'pending'],
    queryFn: async () => {
      const res = await attendanceApi.listPendingRegularizations();
      return res.data || [];
    },
  });

  // 4. Fetch Holidays
  const { data: holidays } = useQuery({
    queryKey: ['holidays', 'upcoming'],
    queryFn: async () => {
      const res = await holidayApi.list();
      return res.data || [];
    },
  });

  // Mutations for Check-In / Check-Out
  const checkInMutation = useMutation({
    mutationFn: async () => {
      return attendanceApi.checkIn({ locationName: 'Web Portal / Mobile' });
    },
    onSuccess: () => {
      toast.success('Successfully checked in!');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Check-in failed');
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      return attendanceApi.checkOut({ locationName: 'Web Portal / Mobile' });
    },
    onSuccess: () => {
      toast.success('Successfully checked out! Working hours recorded.');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Check-out failed');
    },
  });

  const totalPending = (pendingLeaves?.length || 0) + (pendingRegularizations?.length || 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Good day, {user?.firstName} 👋
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Role: <span className="font-semibold text-foreground">{user?.role}</span> • Welcome to
            your HRMS overview
          </p>
        </div>

        {/* Quick Check-In / Check-Out Action */}
        <div className="flex items-center gap-3">
          {!todayAttendance?.checkIn ? (
            <Button
              onClick={() => checkInMutation.mutate()}
              isLoading={checkInMutation.isPending}
              className="w-full sm:w-auto h-12 px-6 shadow-md"
            >
              <Clock className="h-4 w-4 mr-2" />
              Check In Today
            </Button>
          ) : !todayAttendance?.checkOut ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="text-right hidden sm:block">
                <span className="text-[11px] text-muted-foreground block">In since</span>
                <span className="text-xs font-bold text-foreground">
                  {new Date(todayAttendance.checkIn).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => checkOutMutation.mutate()}
                isLoading={checkOutMutation.isPending}
                className="w-full sm:w-auto h-12 px-6 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <Clock className="h-4 w-4 mr-2" />
                Check Out Now
              </Button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <CalendarCheck className="h-4 w-4" />
              <span>Completed ({todayAttendance.workingHours} hrs)</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Employees */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Headcount
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{employeesData?.total || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Active workforce</p>
          </CardContent>
        </Card>

        {/* Today's Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Attendance</CardTitle>
            <CalendarCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {todayAttendance?.status ? (
                <StatusBadge status={todayAttendance.status} />
              ) : (
                'Pending'
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {todayAttendance?.checkIn
                ? `In at ${new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Not checked in yet'}
            </p>
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pending Approvals
            </CardTitle>
            <FileCheck2 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
              {totalPending}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {pendingLeaves?.length || 0} leaves, {pendingRegularizations?.length || 0}{' '}
              regularizations
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Holidays */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Company Holidays
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{holidays?.length || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Scheduled for this year</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Pending Approvals & Upcoming Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals Widget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Pending Approvals</CardTitle>
              <CardDescription>Leaves and regularizations waiting for review</CardDescription>
            </div>
            <Link
              href="/leaves"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Review all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {totalPending === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-6">
                All requests are up to date! No pending approvals.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingLeaves?.slice(0, 3).map((leave) => (
                  <div
                    key={leave._id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {(leave.employeeId as any)?.firstName} {(leave.employeeId as any)?.lastName}
                      </p>
                      <p className="text-muted-foreground">
                        Leave: {leave.startDate} to {leave.endDate} ({leave.daysCount} days)
                      </p>
                    </div>
                    <StatusBadge status={leave.status} />
                  </div>
                ))}

                {pendingRegularizations?.slice(0, 3).map((reg) => (
                  <div
                    key={reg._id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {(reg.employeeId as any)?.firstName} {(reg.employeeId as any)?.lastName}
                      </p>
                      <p className="text-muted-foreground">Regularize date: {reg.date}</p>
                    </div>
                    <StatusBadge status={reg.regularizationStatus} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Holidays Widget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Upcoming Holidays</CardTitle>
              <CardDescription>Paid national & festival holidays</CardDescription>
            </div>
            <Link
              href="/leaves"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View calendar <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {holidays?.slice(0, 5).map((holiday) => (
              <div
                key={holiday._id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                    {new Date(holiday.date).getDate()}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{holiday.title}</p>
                    <p className="text-muted-foreground">{holiday.date}</p>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {holiday.isOptional ? 'Optional' : 'Mandatory'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
