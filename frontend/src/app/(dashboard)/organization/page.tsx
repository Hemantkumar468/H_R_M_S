'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentApi, designationApi } from '@/services/endpoints';
import { IDepartment, IDesignation, UserRole } from '@hrms/shared';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input, Label } from '@/components/ui/input';
import { useAuth } from '@/store/auth-context';
import { Building2, Award, Plus, Trash2, Edit, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function OrganizationPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<'departments' | 'designations'>('departments');

  // Modals
  const [isDeptModalOpen, setIsDeptModalOpen] = React.useState(false);
  const [deptForm, setDeptForm] = React.useState({ name: '', code: '', description: '' });

  const [isDesigModalOpen, setIsDesigModalOpen] = React.useState(false);
  const [desigForm, setDesigForm] = React.useState({
    name: '',
    code: '',
    departmentId: '',
    level: 1,
    description: '',
  });

  // Queries
  const { data: departments, isLoading: isDeptLoading } = useQuery({
    queryKey: ['departments', 'list'],
    queryFn: async () => (await departmentApi.list({ limit: 100 })).data || [],
  });

  const { data: designations, isLoading: isDesigLoading } = useQuery({
    queryKey: ['designations', 'list'],
    queryFn: async () => (await designationApi.list({ limit: 100 })).data || [],
  });

  // Mutations
  const createDeptMutation = useMutation({
    mutationFn: async () => departmentApi.create(deptForm),
    onSuccess: () => {
      toast.success('Department created!');
      setIsDeptModalOpen(false);
      setDeptForm({ name: '', code: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create department');
    },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: async (id: string) => departmentApi.delete(id),
    onSuccess: () => {
      toast.success('Department deleted');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Cannot delete department');
    },
  });

  const createDesigMutation = useMutation({
    mutationFn: async () => designationApi.create(desigForm),
    onSuccess: () => {
      toast.success('Designation created!');
      setIsDesigModalOpen(false);
      setDesigForm({ name: '', code: '', departmentId: '', level: 1, description: '' });
      queryClient.invalidateQueries({ queryKey: ['designations'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create designation');
    },
  });

  const deleteDesigMutation = useMutation({
    mutationFn: async (id: string) => designationApi.delete(id),
    onSuccess: () => {
      toast.success('Designation deleted');
      queryClient.invalidateQueries({ queryKey: ['designations'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Cannot delete designation');
    },
  });

  // Department Columns
  const deptColumns: Column<IDepartment>[] = [
    {
      header: 'Department',
      cell: (d) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="font-semibold text-foreground block">{d.name}</span>
            <span className="text-xs text-muted-foreground block">
              {d.description || 'No description'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Code',
      cell: (d) => <Badge variant="outline">{d.code}</Badge>,
    },
    {
      header: 'Headcount',
      cell: (d) => (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5 text-primary" /> {d.employeeCount || 0} staff
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (d) => (
        <div className="flex items-center gap-2">
          {hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN) && (
            <button
              onClick={() => deleteDeptMutation.mutate(d._id)}
              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
              title="Delete department"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // Designation Columns
  const desigColumns: Column<IDesignation>[] = [
    {
      header: 'Designation',
      cell: (d) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="font-semibold text-foreground block">{d.name}</span>
            <span className="text-xs text-muted-foreground block">{d.code}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Department',
      cell: (d) => (
        <span className="text-xs font-medium text-foreground">
          {(d.departmentId as any)?.name || 'General'}
        </span>
      ),
    },
    {
      header: 'Hierarchy Level',
      cell: (d) => <Badge variant="secondary">Level {d.level}</Badge>,
    },
    {
      header: 'Headcount',
      cell: (d) => (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5 text-primary" /> {d.employeeCount || 0}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (d) => (
        <div className="flex items-center gap-2">
          {hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN) && (
            <button
              onClick={() => deleteDesigMutation.mutate(d._id)}
              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
              title="Delete designation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Hierarchy"
        description="Configure corporate departments, functional designations, and organizational tiers."
        action={
          hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN) && (
            <div className="flex items-center gap-2">
              {activeTab === 'departments' ? (
                <Button onClick={() => setIsDeptModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              ) : (
                <Button onClick={() => setIsDesigModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Designation
                </Button>
              )}
            </div>
          )
        }
      />

      {/* Tabs */}
      <div className="flex border-b space-x-4">
        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'departments'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Departments ({departments?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('designations')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'designations'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Award className="h-4 w-4" />
          Designations ({designations?.length || 0})
        </button>
      </div>

      {/* Department Tab */}
      {activeTab === 'departments' && (
        <DataTable
          columns={deptColumns}
          data={departments || []}
          keyExtractor={(d) => d._id}
          isLoading={isDeptLoading}
          renderMobileCard={(d) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-bold text-foreground text-sm">{d.name}</span>
                </div>
                <Badge variant="outline">{d.code}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {d.description || 'No description provided'}
              </p>
              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <span className="text-muted-foreground">{d.employeeCount || 0} staff members</span>
                {hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN) && (
                  <button
                    onClick={() => deleteDeptMutation.mutate(d._id)}
                    className="text-destructive font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
        />
      )}

      {/* Designation Tab */}
      {activeTab === 'designations' && (
        <DataTable
          columns={desigColumns}
          data={designations || []}
          keyExtractor={(d) => d._id}
          isLoading={isDesigLoading}
          renderMobileCard={(d) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-500" />
                  <span className="font-bold text-foreground text-sm">{d.name}</span>
                </div>
                <Badge variant="secondary">Level {d.level}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Dept: {(d.departmentId as any)?.name || 'General'}</span>
                <span>Code: {d.code}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <span className="text-muted-foreground">
                  {d.employeeCount || 0} active employees
                </span>
                {hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN) && (
                  <button
                    onClick={() => deleteDesigMutation.mutate(d._id)}
                    className="text-destructive font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
        />
      )}

      {/* Add Department Modal */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Add Department"
        description="Create a new functional department"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="deptName" required>
              Department Name
            </Label>
            <Input
              id="deptName"
              placeholder="e.g. Engineering / Human Resources"
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="deptCode" required>
              Department Code
            </Label>
            <Input
              id="deptCode"
              placeholder="e.g. ENG, HR, FIN"
              value={deptForm.code}
              onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="deptDesc">Description</Label>
            <Input
              id="deptDesc"
              placeholder="Department purpose"
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createDeptMutation.mutate()}
              isLoading={createDeptMutation.isPending}
              disabled={!deptForm.name || !deptForm.code}
            >
              Create Department
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Designation Modal */}
      <Modal
        isOpen={isDesigModalOpen}
        onClose={() => setIsDesigModalOpen(false)}
        title="Add Designation"
        description="Create a new role title linked to a department"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="desigName" required>
              Designation Title
            </Label>
            <Input
              id="desigName"
              placeholder="e.g. Senior Software Engineer"
              value={desigForm.name}
              onChange={(e) => setDesigForm({ ...desigForm, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="desigCode" required>
                Code
              </Label>
              <Input
                id="desigCode"
                placeholder="e.g. SSE"
                value={desigForm.code}
                onChange={(e) => setDesigForm({ ...desigForm, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="desigLevel" required>
                Hierarchy Level
              </Label>
              <Input
                id="desigLevel"
                type="number"
                min={1}
                max={10}
                value={desigForm.level}
                onChange={(e) => setDesigForm({ ...desigForm, level: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="desigDept" required>
              Department
            </Label>
            <select
              id="desigDept"
              value={desigForm.departmentId}
              onChange={(e) => setDesigForm({ ...desigForm, departmentId: e.target.value })}
              className="flex h-11 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select Department</option>
              {departments?.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsDesigModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createDesigMutation.mutate()}
              isLoading={createDesigMutation.isPending}
              disabled={!desigForm.name || !desigForm.code || !desigForm.departmentId}
            >
              Create Designation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
