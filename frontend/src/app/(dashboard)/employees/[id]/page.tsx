'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  employeeApi,
  payrollApi,
  departmentApi,
  designationApi,
  leaveApi,
} from '@/services/endpoints';
import {
  IEmployee,
  EmployeeStatus,
  Gender,
  UserRole,
  ISalaryStructure,
  SalaryStructureDto,
  ILeaveRequest,
  ILeaveBalance,
  LeaveStatus,
} from '@hrms/shared';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input, Label } from '@/components/ui/input';
import { useAuth } from '@/store/auth-context';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  FileText,
  Upload,
  Trash2,
  Download,
  CreditCard,
  UserCheck,
  Edit,
  ShieldAlert,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = React.useState<
    'overview' | 'bank' | 'documents' | 'salary' | 'leaves'
  >('overview');
  const [isStatusModalOpen, setIsStatusModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = React.useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = React.useState(false);

  // 1. Fetch Employee Details
  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => (await employeeApi.getById(id)).data,
  });

  // 2. Fetch Departments & Designations for edit form
  const { data: departments } = useQuery({
    queryKey: ['departments', 'all'],
    queryFn: async () => (await departmentApi.list({ limit: 50 })).data || [],
  });

  const { data: designations } = useQuery({
    queryKey: ['designations', 'all'],
    queryFn: async () => (await designationApi.list({ limit: 50 })).data || [],
  });

  // 3. Fetch Salary Structure
  const { data: salaryStructure } = useQuery({
    queryKey: ['salary-structure', id],
    queryFn: async () => {
      try {
        const res = await payrollApi.getStructure(id);
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
  });

  // 4. Fetch Employee Leaves & Balances
  const { data: employeeLeaves, isLoading: isLeavesLoading } = useQuery({
    queryKey: ['employee-leaves', id],
    queryFn: async () => (await leaveApi.getByEmployeeId(id)).data || [],
  });

  const { data: employeeBalances } = useQuery({
    queryKey: ['employee-balances', id],
    queryFn: async () => (await leaveApi.getBalancesByEmployeeId(id)).data || [],
  });

  // --- Status Update Mutation ---
  const [newStatus, setNewStatus] = React.useState<EmployeeStatus>(EmployeeStatus.ACTIVE);
  const [statusRemarks, setStatusRemarks] = React.useState('');

  const statusMutation = useMutation({
    mutationFn: async () => {
      return employeeApi.updateStatus(id, { status: newStatus, remarks: statusRemarks });
    },
    onSuccess: () => {
      toast.success('Employment status updated!');
      setIsStatusModalOpen(false);
      setStatusRemarks('');
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Status update failed');
    },
  });

  // --- Document Upload Mutation ---
  const [docName, setDocName] = React.useState('');
  const [docType, setDocType] = React.useState('ID Proof');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const uploadDocMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Please select a file');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', docName);
      formData.append('documentType', docType);
      return employeeApi.uploadDocument(id, formData);
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully!');
      setIsUploadDocOpen(false);
      setDocName('');
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Document upload failed');
    },
  });

  // --- Document Delete Mutation ---
  const deleteDocMutation = useMutation({
    mutationFn: async (docId: string) => {
      return employeeApi.deleteDocument(id, docId);
    },
    onSuccess: () => {
      toast.success('Document removed');
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
  });

  // --- Salary Structure Mutation ---
  const [salaryForm, setSalaryForm] = React.useState<SalaryStructureDto>({
    employeeId: id,
    basic: 30000,
    hra: 15000,
    conveyance: 1600,
    specialAllowance: 5000,
    medicalAllowance: 1250,
    pfApplicable: true,
    pfEmployeePercent: 12,
    pfEmployerPercent: 12,
    esiApplicable: false,
    esiEmployeePercent: 0.75,
    esiEmployerPercent: 3.25,
    professionalTax: 200,
    monthlyTds: 0,
  });

  React.useEffect(() => {
    if (salaryStructure) {
      setSalaryForm({
        employeeId: id,
        basic: salaryStructure.basic,
        hra: salaryStructure.hra,
        conveyance: salaryStructure.conveyance,
        specialAllowance: salaryStructure.specialAllowance,
        medicalAllowance: salaryStructure.medicalAllowance,
        pfApplicable: salaryStructure.pfApplicable,
        pfEmployeePercent: salaryStructure.pfEmployeePercent,
        pfEmployerPercent: salaryStructure.pfEmployerPercent,
        esiApplicable: salaryStructure.esiApplicable,
        esiEmployeePercent: salaryStructure.esiEmployeePercent,
        esiEmployerPercent: salaryStructure.esiEmployerPercent,
        professionalTax: salaryStructure.professionalTax,
        monthlyTds: salaryStructure.monthlyTds,
      });
    }
  }, [salaryStructure, id]);

  const salaryMutation = useMutation({
    mutationFn: async () => {
      return payrollApi.upsertStructure(id, salaryForm);
    },
    onSuccess: () => {
      toast.success('Salary structure configured!');
      setIsSalaryModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['salary-structure', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update salary');
    },
  });

  if (isLoading || !employee) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        <div className="h-44 w-full bg-muted animate-pulse rounded-2xl" />
      </div>
    );
  }

  const deptName = (employee.departmentId as any)?.name || 'N/A';
  const desigName = (employee.designationId as any)?.name || 'N/A';

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div>
        <button
          onClick={() => router.push('/employees')}
          className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Employee Directory
        </button>
      </div>

      {/* Profile Header Card */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 bg-gradient-to-r from-primary/10 via-background to-background">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-2xl shadow-md">
                {employee.firstName[0]}
                {employee.lastName[0]}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {employee.firstName} {employee.lastName}
                  </h1>
                  <StatusBadge status={employee.status} />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{employee.employeeId}</span> •{' '}
                  {desigName} • {deptName}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {employee.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {employee.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions (Change Status, Edit) */}
            {hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN) && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewStatus(employee.status);
                    setIsStatusModalOpen(true);
                  }}
                >
                  <UserCheck className="h-4 w-4 mr-1.5" />
                  Change Status
                </Button>
                <Button variant="default" size="sm" onClick={() => setIsEditModalOpen(true)}>
                  <Edit className="h-4 w-4 mr-1.5" />
                  Edit Profile
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t overflow-x-auto bg-muted/20 px-2 sm:px-4">
          {[
            { id: 'overview', label: 'Overview & Job' },
            { id: 'bank', label: 'Bank & Statutory' },
            { id: 'documents', label: `Documents (${employee.documents?.length || 0})` },
            { id: 'salary', label: 'Salary & Payroll' },
            { id: 'leaves', label: `Leaves & Quotas (${employeeLeaves?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Tab 1: Overview & Job */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 py-1.5 border-b">
                <span className="text-muted-foreground">Full Name:</span>
                <span className="font-medium text-foreground">
                  {employee.firstName} {employee.lastName}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1.5 border-b">
                <span className="text-muted-foreground">Date of Birth:</span>
                <span className="font-medium text-foreground">{employee.dateOfBirth}</span>
              </div>
              <div className="grid grid-cols-2 py-1.5 border-b">
                <span className="text-muted-foreground">Gender:</span>
                <span className="font-medium text-foreground">{employee.gender}</span>
              </div>
              <div className="grid grid-cols-2 py-1.5 border-b">
                <span className="text-muted-foreground">Blood Group:</span>
                <span className="font-medium text-foreground">
                  {employee.bloodGroup || 'Not specified'}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1.5">
                <span className="text-muted-foreground">Residential Address:</span>
                <span className="font-medium text-foreground">
                  {employee.address || 'Not specified'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Job & Hierarchy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 py-1.5 border-b">
                <span className="text-muted-foreground">Employee ID:</span>
                <span className="font-semibold text-primary">{employee.employeeId}</span>
              </div>
              <div className="grid grid-cols-2 py-1.5 border-b">
                <span className="text-muted-foreground">Department:</span>
                <span className="font-medium text-foreground">{deptName}</span>
              </div>
              <div className="grid grid-cols-2 py-1.5 border-b">
                <span className="text-muted-foreground">Designation:</span>
                <span className="font-medium text-foreground">{desigName}</span>
              </div>
              <div className="grid grid-cols-2 py-1.5 border-b">
                <span className="text-muted-foreground">Joining Date:</span>
                <span className="font-medium text-foreground">{employee.joiningDate}</span>
              </div>
              <div className="grid grid-cols-2 py-1.5 border-b">
                <span className="text-muted-foreground">Employment Status:</span>
                <span>
                  <StatusBadge status={employee.status} />
                </span>
              </div>
              <div className="grid grid-cols-2 py-1.5">
                <span className="text-muted-foreground">Reporting Manager:</span>
                <span className="font-medium text-foreground">
                  {(employee.reportingManagerId as any)?.firstName
                    ? `${(employee.reportingManagerId as any).firstName} ${(employee.reportingManagerId as any).lastName}`
                    : 'None / Executive'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Bank & Statutory */}
      {activeTab === 'bank' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bank Account Details</CardTitle>
              <CardDescription>Salary disbursement bank account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 py-1.5 border-b">
                <span className="text-muted-foreground">Account Holder:</span>
                <span className="font-medium text-foreground">
                  {employee.bankDetails?.accountHolderName ||
                    `${employee.firstName} ${employee.lastName}`}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1.5 border-b">
                <span className="text-muted-foreground">Bank Name:</span>
                <span className="font-medium text-foreground">
                  {employee.bankDetails?.bankName || 'HDFC Bank'}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1.5 border-b">
                <span className="text-muted-foreground">Account Number:</span>
                <span className="font-semibold text-foreground">
                  {employee.bankDetails?.accountNumber || '••••••••1234'}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1.5">
                <span className="text-muted-foreground">IFSC Code:</span>
                <span className="font-medium text-foreground">
                  {employee.bankDetails?.ifscCode || 'HDFC0001234'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Indian Statutory Numbers</CardTitle>
              <CardDescription>PF, ESI, PAN and UAN compliance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 py-1.5 border-b">
                <span className="text-muted-foreground">PAN Number:</span>
                <span className="font-semibold text-foreground">
                  {employee.bankDetails?.panNumber || 'ABCDE1234F'}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1.5 border-b">
                <span className="text-muted-foreground">Universal Account (UAN):</span>
                <span className="font-medium text-foreground">
                  {employee.bankDetails?.uanNumber || '100987654321'}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1.5">
                <span className="text-muted-foreground">Provident Fund (PF):</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Enrolled (12%)
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Documents (Multer Upload) */}
      {activeTab === 'documents' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Employee Documents</CardTitle>
              <CardDescription>
                ID verification proofs, educational certificates, and employment contracts
              </CardDescription>
            </div>
            {hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN) && (
              <Button size="sm" onClick={() => setIsUploadDocOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!employee.documents || employee.documents.length === 0 ? (
              <div className="py-8 text-center text-xs sm:text-sm text-muted-foreground">
                No documents uploaded yet for this employee.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {employee.documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="flex flex-col justify-between p-4 rounded-xl border bg-card/60 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground truncate max-w-[150px]">
                            {doc.name}
                          </p>
                          <span className="text-[11px] text-muted-foreground block">
                            {doc.documentType}
                          </span>
                        </div>
                      </div>
                      {hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN) && (
                        <button
                          onClick={() => deleteDocMutation.mutate(doc._id!)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
                      <span>
                        {doc.uploadedAt
                          ? new Date(doc.uploadedAt).toLocaleDateString()
                          : 'Uploaded'}
                      </span>
                      <a
                        href={`http://localhost:5000${doc.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <Download className="h-3.5 w-3.5" /> View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Salary Structure & Payroll */}
      {activeTab === 'salary' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Salary Structure (CTC Breakdown)</CardTitle>
                <CardDescription>
                  Indian PF, ESI, Professional Tax & TDS configuration
                </CardDescription>
              </div>
              {hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN) && (
                <Button size="sm" onClick={() => setIsSalaryModalOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Configure Structure
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {salaryStructure ? (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl border bg-muted/20">
                      <span className="text-xs text-muted-foreground block">
                        Monthly Gross Salary
                      </span>
                      <span className="text-xl sm:text-2xl font-bold text-foreground">
                        INR {salaryStructure.grossSalary?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl border bg-muted/20">
                      <span className="text-xs text-muted-foreground block">
                        Monthly Total Deductions
                      </span>
                      <span className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">
                        INR {salaryStructure.totalDeductions?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/30">
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 block font-medium">
                        Net Monthly Take-Home Pay
                      </span>
                      <span className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                        INR {salaryStructure.netSalary?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>

                  {/* Earnings vs Deductions Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Earnings */}
                    <div className="p-4 rounded-xl border space-y-2 text-xs">
                      <h4 className="font-semibold text-sm pb-1 border-b text-primary">
                        Earnings Components
                      </h4>
                      <div className="flex justify-between py-1 border-b">
                        <span>Basic Salary:</span>
                        <span className="font-semibold">INR {salaryStructure.basic}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span>House Rent Allowance (HRA):</span>
                        <span className="font-semibold">INR {salaryStructure.hra}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span>Conveyance Allowance:</span>
                        <span className="font-semibold">INR {salaryStructure.conveyance}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span>Special Allowance:</span>
                        <span className="font-semibold">
                          INR {salaryStructure.specialAllowance}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Medical Allowance:</span>
                        <span className="font-semibold">
                          INR {salaryStructure.medicalAllowance}
                        </span>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="p-4 rounded-xl border space-y-2 text-xs">
                      <h4 className="font-semibold text-sm pb-1 border-b text-rose-500">
                        Statutory Deductions
                      </h4>
                      <div className="flex justify-between py-1 border-b">
                        <span>Provident Fund (PF - {salaryStructure.pfEmployeePercent}%):</span>
                        <span className="font-semibold">
                          INR{' '}
                          {salaryStructure.pfApplicable
                            ? Math.round(
                                (salaryStructure.basic * salaryStructure.pfEmployeePercent) / 100,
                              )
                            : 0}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span>ESI (0.75%):</span>
                        <span className="font-semibold">
                          INR{' '}
                          {salaryStructure.esiApplicable
                            ? Math.round(
                                (salaryStructure.grossSalary * salaryStructure.esiEmployeePercent) /
                                  100,
                              )
                            : 0}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span>Professional Tax (PT):</span>
                        <span className="font-semibold">INR {salaryStructure.professionalTax}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Monthly TDS (Income Tax):</span>
                        <span className="font-semibold">INR {salaryStructure.monthlyTds}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No salary structure configured yet. Tap &apos;Configure Structure&apos; above.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 5: Leave Quotas & History */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          {/* Leave Balances Grid */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3">
              Annual Leave Quotas & Balances
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {employeeBalances?.map((b) => (
                <div
                  key={b.leaveTypeId}
                  className="p-3.5 rounded-xl border bg-card space-y-1 shadow-2xs"
                >
                  <span className="text-[11px] font-semibold text-muted-foreground block truncate">
                    {b.leaveTypeName}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl sm:text-2xl font-black text-foreground">
                      {b.available}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      / {b.totalAllocated}d
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                    <span>
                      Used: <strong className="text-foreground">{b.used}</strong>
                    </span>
                    {b.pending > 0 && (
                      <span className="text-amber-500 font-bold">{b.pending} pend.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leave History List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leave Applications & History</CardTitle>
              <CardDescription>All leave requests submitted by this employee</CardDescription>
            </CardHeader>
            <CardContent>
              {!employeeLeaves || employeeLeaves.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No leave records found for this employee.
                </div>
              ) : (
                <div className="space-y-3">
                  {employeeLeaves.map((l) => (
                    <div
                      key={l._id}
                      className="p-4 rounded-xl border bg-muted/20 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground">
                          {(l.leaveTypeId as any)?.name || 'General Leave'}
                        </span>
                        <StatusBadge status={l.status} />
                      </div>
                      <div className="text-muted-foreground flex flex-wrap items-center gap-2">
                        <span>
                          Period:{' '}
                          <strong>
                            {l.startDate} to {l.endDate}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          <strong>{l.daysCount}</strong> working day(s)
                        </span>
                      </div>
                      <p className="text-muted-foreground italic bg-background/60 p-2 rounded-lg border">
                        Reason: &ldquo;{l.reason}&rdquo;
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal 1: Status Change Bottom Sheet */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Employment Status"
        description="Change employee lifecycle status (Active, Probation, Notice, Exited)"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="statusSelect">Select New Status</Label>
            <select
              id="statusSelect"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as EmployeeStatus)}
              className="flex h-11 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value={EmployeeStatus.ACTIVE}>ACTIVE</option>
              <option value={EmployeeStatus.PROBATION}>PROBATION</option>
              <option value={EmployeeStatus.NOTICE}>NOTICE PERIOD</option>
              <option value={EmployeeStatus.EXITED}>EXITED</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="statusRemarks">Audit Remarks / Justification</Label>
            <Input
              id="statusRemarks"
              placeholder="e.g. Completed probation review successfully"
              value={statusRemarks}
              onChange={(e) => setStatusRemarks(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => statusMutation.mutate()} isLoading={statusMutation.isPending}>
              Confirm Status Change
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 2: Document Upload Modal */}
      <Modal
        isOpen={isUploadDocOpen}
        onClose={() => setIsUploadDocOpen(false)}
        title="Upload Employee Document"
        description="Attach PDF, scan, or certificate to this employee record."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="docName" required>
              Document Title
            </Label>
            <Input
              id="docName"
              placeholder="e.g. Aadhaar Card / Degree Certificate"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="docType" required>
              Document Category
            </Label>
            <select
              id="docType"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="flex h-11 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="ID Proof">Government ID Proof (PAN / Aadhaar / Passport)</option>
              <option value="Degree Certificate">Educational / Degree Certificate</option>
              <option value="Offer Letter">Offer Letter / Employment Agreement</option>
              <option value="Relieving Letter">Relieving Letter / Experience</option>
              <option value="Other">Other Certificate</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fileInput" required>
              Choose File (PDF, DOCX, PNG, JPG - max 5MB)
            </Label>
            <input
              id="fileInput"
              type="file"
              onChange={(e) => {
                if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
              }}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-xs file:border-0 file:bg-primary file:text-primary-foreground file:rounded-md file:px-2 file:py-1 file:mr-2 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsUploadDocOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => uploadDocMutation.mutate()}
              isLoading={uploadDocMutation.isPending}
              disabled={!selectedFile || !docName}
            >
              Upload Document
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 3: Salary Structure Config Modal */}
      <Modal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        title="Configure Salary Structure"
        description="Set up earnings and Indian statutory deduction rules."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Basic Salary (INR)</Label>
              <Input
                type="number"
                value={salaryForm.basic}
                onChange={(e) => setSalaryForm({ ...salaryForm, basic: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label>HRA (INR)</Label>
              <Input
                type="number"
                value={salaryForm.hra}
                onChange={(e) => setSalaryForm({ ...salaryForm, hra: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Conveyance</Label>
              <Input
                type="number"
                value={salaryForm.conveyance}
                onChange={(e) =>
                  setSalaryForm({ ...salaryForm, conveyance: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Special Allow.</Label>
              <Input
                type="number"
                value={salaryForm.specialAllowance}
                onChange={(e) =>
                  setSalaryForm({ ...salaryForm, specialAllowance: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Medical</Label>
              <Input
                type="number"
                value={salaryForm.medicalAllowance}
                onChange={(e) =>
                  setSalaryForm({ ...salaryForm, medicalAllowance: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="pt-2 border-t">
            <h4 className="text-xs font-bold text-foreground mb-2">
              Statutory Deductions (Indian Context)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pfApp"
                  checked={salaryForm.pfApplicable}
                  onChange={(e) => setSalaryForm({ ...salaryForm, pfApplicable: e.target.checked })}
                  className="h-4 w-4 rounded border-input text-primary"
                />
                <Label htmlFor="pfApp">PF (12% of Basic)</Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="esiApp"
                  checked={salaryForm.esiApplicable}
                  onChange={(e) =>
                    setSalaryForm({ ...salaryForm, esiApplicable: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-input text-primary"
                />
                <Label htmlFor="esiApp">ESI (0.75% of Gross)</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="space-y-1">
                <Label>Professional Tax (PT)</Label>
                <Input
                  type="number"
                  value={salaryForm.professionalTax}
                  onChange={(e) =>
                    setSalaryForm({ ...salaryForm, professionalTax: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Monthly TDS (Tax)</Label>
                <Input
                  type="number"
                  value={salaryForm.monthlyTds}
                  onChange={(e) =>
                    setSalaryForm({ ...salaryForm, monthlyTds: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsSalaryModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => salaryMutation.mutate()} isLoading={salaryMutation.isPending}>
              Save Structure
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
