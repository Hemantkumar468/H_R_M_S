'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi, departmentApi, designationApi } from '@/services/endpoints';
import { IEmployee, EmployeeStatus, Gender, UserRole } from '@hrms/shared';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input, Label } from '@/components/ui/input';
import { useAuth } from '@/store/auth-context';
import { UserPlus, ArrowRight, Mail, Phone, Building } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const NewEmployeeSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid corporate email required'),
  phone: z.string().min(10, 'Valid 10-digit phone required'),
  dateOfBirth: z.string().min(1, 'DOB is required'),
  gender: z.nativeEnum(Gender),
  departmentId: z.string().min(1, 'Department is required'),
  designationId: z.string().min(1, 'Designation is required'),
  role: z.nativeEnum(UserRole).default(UserRole.EMPLOYEE),
  joiningDate: z.string().min(1, 'Joining date is required'),
  status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.PROBATION),
});

type NewEmployeeFormData = z.infer<typeof NewEmployeeSchema>;

export default function EmployeesPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // Fetch departments & designations for create form
  const { data: departments } = useQuery({
    queryKey: ['departments', 'all'],
    queryFn: async () => (await departmentApi.list({ limit: 50 })).data || [],
  });

  const { data: designations } = useQuery({
    queryKey: ['designations', 'all'],
    queryFn: async () => (await designationApi.list({ limit: 50 })).data || [],
  });

  // Fetch employees list
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees', page, search, statusFilter],
    queryFn: async () => {
      return employeeApi.list({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewEmployeeFormData>({
    resolver: zodResolver(NewEmployeeSchema),
    defaultValues: {
      gender: Gender.MALE,
      role: UserRole.EMPLOYEE,
      status: EmployeeStatus.PROBATION,
      joiningDate: new Date().toISOString().split('T')[0],
      dateOfBirth: '1995-01-01',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: NewEmployeeFormData) => {
      return employeeApi.create(data);
    },
    onSuccess: () => {
      toast.success('Employee onboarded successfully with system credentials!');
      setIsCreateOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create employee');
    },
  });

  const columns: Column<IEmployee>[] = [
    {
      header: 'Employee',
      cell: (emp) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
            {emp.firstName[0]}
            {emp.lastName[0]}
          </div>
          <div>
            <Link
              href={`/employees/${emp._id}`}
              className="font-semibold text-foreground hover:underline block"
            >
              {emp.firstName} {emp.lastName}
            </Link>
            <span className="text-xs text-muted-foreground block">{emp.employeeId}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      cell: (emp) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>{emp.email}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{emp.phone}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Department / Role',
      cell: (emp) => (
        <div className="text-xs">
          <span className="font-medium text-foreground block">
            {(emp.departmentId as any)?.name || 'N/A'}
          </span>
          <span className="text-muted-foreground block">
            {(emp.designationId as any)?.name || emp.role}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (emp) => <StatusBadge status={emp.status} />,
    },
    {
      header: 'Actions',
      cell: (emp) => (
        <Link
          href={`/employees/${emp._id}`}
          className="inline-flex items-center text-xs font-semibold text-primary hover:underline gap-1"
        >
          View Profile <ArrowRight className="h-3 w-3" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory"
        description="Manage workforce records, profiles, documents, and employment statuses."
        action={
          hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN) && (
            <Button onClick={() => setIsCreateOpen(true)} className="h-11 sm:h-10">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          )
        }
      />

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">Status:</span>
        {[
          '',
          EmployeeStatus.ACTIVE,
          EmployeeStatus.PROBATION,
          EmployeeStatus.NOTICE,
          EmployeeStatus.EXITED,
        ].map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === status
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {status ? status.replace(/_/g, ' ') : 'All'}
          </button>
        ))}
      </div>

      {/* Responsive DataTable */}
      <DataTable
        columns={columns}
        data={employeesData?.data || []}
        keyExtractor={(emp) => emp._id}
        isLoading={isLoading}
        searchPlaceholder="Search employees by name, email, or ID..."
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        page={page}
        totalPages={employeesData?.meta?.totalPages || 1}
        onPageChange={setPage}
        renderMobileCard={(emp) => (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                  {emp.firstName[0]}
                  {emp.lastName[0]}
                </div>
                <div>
                  <Link
                    href={`/employees/${emp._id}`}
                    className="font-semibold text-foreground hover:underline block"
                  >
                    {emp.firstName} {emp.lastName}
                  </Link>
                  <span className="text-xs text-muted-foreground block">{emp.employeeId}</span>
                </div>
              </div>
              <StatusBadge status={emp.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t">
              <div className="flex items-center gap-1.5 truncate">
                <Building className="h-3.5 w-3.5" />
                <span className="truncate">{(emp.departmentId as any)?.name || 'General'}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{emp.email}</span>
              </div>
            </div>

            <Link
              href={`/employees/${emp._id}`}
              className="flex items-center justify-center h-10 w-full rounded-lg bg-muted/60 hover:bg-muted text-xs font-medium text-foreground gap-1 transition-colors"
            >
              View Full Profile <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      />

      {/* Add Employee Responsive Modal / Bottom Sheet */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Employee"
        description="Onboard a new employee. A corporate login account will be automatically generated."
      >
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName" required>
                First Name
              </Label>
              <Input id="firstName" error={errors.firstName?.message} {...register('firstName')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName" required>
                Last Name
              </Label>
              <Input id="lastName" error={errors.lastName?.message} {...register('lastName')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input id="email" type="email" error={errors.email?.message} {...register('email')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" required>
                Phone Number
              </Label>
              <Input id="phone" error={errors.phone?.message} {...register('phone')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="dateOfBirth" required>
                Date of Birth
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                error={errors.dateOfBirth?.message}
                {...register('dateOfBirth')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gender" required>
                Gender
              </Label>
              <select
                id="gender"
                className="flex h-11 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('gender')}
              >
                <option value={Gender.MALE}>Male</option>
                <option value={Gender.FEMALE}>Female</option>
                <option value={Gender.OTHER}>Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="role" required>
                Access Role
              </Label>
              <select
                id="role"
                className="flex h-11 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('role')}
              >
                <option value={UserRole.EMPLOYEE}>Employee</option>
                <option value={UserRole.MANAGER}>Manager</option>
                <option value={UserRole.HR_ADMIN}>HR Admin</option>
                <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="departmentId" required>
                Department
              </Label>
              <select
                id="departmentId"
                className="flex h-11 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('departmentId')}
              >
                <option value="">Select Department</option>
                {departments?.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <p className="text-xs text-destructive">{errors.departmentId.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="designationId" required>
                Designation
              </Label>
              <select
                id="designationId"
                className="flex h-11 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('designationId')}
              >
                <option value="">Select Designation</option>
                {designations?.map((des) => (
                  <option key={des._id} value={des._id}>
                    {des.name} ({des.code})
                  </option>
                ))}
              </select>
              {errors.designationId && (
                <p className="text-xs text-destructive">{errors.designationId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="joiningDate" required>
                Joining Date
              </Label>
              <Input
                id="joiningDate"
                type="date"
                error={errors.joiningDate?.message}
                {...register('joiningDate')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="status" required>
                Employment Status
              </Label>
              <select
                id="status"
                className="flex h-11 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('status')}
              >
                <option value={EmployeeStatus.PROBATION}>Probation</option>
                <option value={EmployeeStatus.ACTIVE}>Active</option>
                <option value={EmployeeStatus.NOTICE}>Notice Period</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Onboard Employee
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
