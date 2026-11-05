import { z } from 'zod';
import { UserRole } from './roles';

export interface ApiResponseMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: ApiResponseMeta;
  errors?: Record<string, string[]> | string;
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  PROBATION = 'PROBATION',
  NOTICE = 'NOTICE',
  EXITED = 'EXITED',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  LATE = 'LATE',
  ON_LEAVE = 'ON_LEAVE',
  HOLIDAY = 'HOLIDAY',
  WEEK_OFF = 'WEEK_OFF',
}

export enum RegularizationStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum LeaveTypeEnum {
  CASUAL = 'CASUAL',
  SICK = 'SICK',
  EARNED = 'EARNED',
  MATERNITY = 'MATERNITY',
  PATERNITY = 'PATERNITY',
  UNPAID = 'UNPAID',
}

export enum PayrollStatus {
  DRAFT = 'DRAFT',
  PROCESSED = 'PROCESSED',
  PAID = 'PAID',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  STATUS_CHANGE = 'STATUS_CHANGE',
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  REGULARIZATION_REQUEST = 'REGULARIZATION_REQUEST',
  REGULARIZATION_APPROVE = 'REGULARIZATION_APPROVE',
  REGULARIZATION_REJECT = 'REGULARIZATION_REJECT',
  LEAVE_APPLY = 'LEAVE_APPLY',
  LEAVE_APPROVE = 'LEAVE_APPROVE',
  LEAVE_REJECT = 'LEAVE_REJECT',
  PAYROLL_RUN = 'PAYROLL_RUN',
}

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type PaginationQueryParams = z.input<typeof PaginationQuerySchema>;

export interface CurrentUserSession {
  userId: string;
  employeeId?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isFirstLogin: boolean;
  avatarUrl?: string;
}

// -------------------------------------------------------------
// Department Schemas & Types
// -------------------------------------------------------------
export const CreateDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  code: z.string().min(2, 'Department code must be at least 2 characters').toUpperCase(),
  description: z.string().optional(),
  headId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial();
export type CreateDepartmentDto = z.input<typeof CreateDepartmentSchema>;
export type UpdateDepartmentDto = z.input<typeof UpdateDepartmentSchema>;

export interface IDepartment {
  _id: string;
  name: string;
  code: string;
  description?: string;
  headId?: string | { _id: string; firstName: string; lastName: string; email: string };
  isActive: boolean;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Designation Schemas & Types
// -------------------------------------------------------------
export const CreateDesignationSchema = z.object({
  name: z.string().min(2, 'Designation name must be at least 2 characters'),
  code: z.string().min(2, 'Designation code must be at least 2 characters').toUpperCase(),
  departmentId: z.string().min(1, 'Department is required'),
  level: z.coerce.number().int().min(1).default(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const UpdateDesignationSchema = CreateDesignationSchema.partial();
export type CreateDesignationDto = z.input<typeof CreateDesignationSchema>;
export type UpdateDesignationDto = z.input<typeof UpdateDesignationSchema>;

export interface IDesignation {
  _id: string;
  name: string;
  code: string;
  departmentId: string | { _id: string; name: string; code: string };
  level: number;
  description?: string;
  isActive: boolean;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Employee Schemas & Types
// -------------------------------------------------------------
export const EmployeeDocumentSchema = z.object({
  name: z.string().min(1, 'Document title is required'),
  documentType: z.string().min(1, 'Document type is required'), // ID Proof, Degree, Offer Letter, etc.
  fileUrl: z.string().min(1, 'File URL is required'),
  uploadedAt: z.string().optional(),
});

export type EmployeeDocumentDto = z.infer<typeof EmployeeDocumentSchema>;

export const CreateEmployeeSchema = z.object({
  // Personal Details
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.nativeEnum(Gender),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),

  // Job Details
  departmentId: z.string().min(1, 'Department is required'),
  designationId: z.string().min(1, 'Designation is required'),
  role: z.nativeEnum(UserRole).default(UserRole.EMPLOYEE),
  reportingManagerId: z.string().optional().nullable(),
  joiningDate: z.string().min(1, 'Joining date is required'),
  status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.PROBATION),
  probationEndDate: z.string().optional().nullable(),

  // Bank & Statutory Details (Indian Context)
  bankDetails: z
    .object({
      accountHolderName: z.string().optional(),
      accountNumber: z.string().optional(),
      bankName: z.string().optional(),
      ifscCode: z.string().optional(),
      panNumber: z.string().optional(),
      uanNumber: z.string().optional(),
    })
    .optional(),

  // Emergency Contact
  emergencyContact: z
    .object({
      name: z.string().optional(),
      relationship: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();

export const UpdateEmployeeStatusSchema = z.object({
  status: z.nativeEnum(EmployeeStatus),
  remarks: z.string().optional(),
});

export type CreateEmployeeDto = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeDto = z.infer<typeof UpdateEmployeeSchema>;
export type UpdateEmployeeStatusDto = z.infer<typeof UpdateEmployeeStatusSchema>;

export interface IEmployeeDocument {
  _id?: string;
  name: string;
  documentType: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface IEmployee {
  _id: string;
  employeeId: string; // Auto-generated e.g. EMP001
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: string;
  address?: string;
  avatarUrl?: string;

  departmentId?: string | { _id: string; name: string; code: string };
  designationId?: string | { _id: string; name: string; code: string; level: number };
  role: UserRole;
  reportingManagerId?:
    string | { _id: string; firstName: string; lastName: string; employeeId: string };
  joiningDate: string;
  status: EmployeeStatus;
  probationEndDate?: string;

  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    panNumber?: string;
    uanNumber?: string;
  };

  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };

  documents?: IEmployeeDocument[];
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Attendance & Regularization
// -------------------------------------------------------------
export const CheckInSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationName: z.string().optional(),
});

export const RegularizeAttendanceSchema = z.object({
  attendanceId: z.string().min(1, 'Attendance record ID is required'),
  requestedCheckIn: z.string().min(1, 'Requested check-in time is required'),
  requestedCheckOut: z.string().min(1, 'Requested check-out time is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export const ApproveRejectRegularizationSchema = z.object({
  status: z.enum([RegularizationStatus.APPROVED, RegularizationStatus.REJECTED]),
  managerComment: z.string().optional(),
});

export type CheckInDto = z.infer<typeof CheckInSchema>;
export type RegularizeAttendanceDto = z.infer<typeof RegularizeAttendanceSchema>;
export type ApproveRejectRegularizationDto = z.infer<typeof ApproveRejectRegularizationSchema>;

export interface IAttendance {
  _id: string;
  employeeId: string | { _id: string; firstName: string; lastName: string; employeeId: string };
  date: string; // YYYY-MM-DD
  checkIn?: string;
  checkOut?: string;
  workingHours?: number;
  isLate?: boolean;
  isEarlyLeave?: boolean;
  overtimeHours?: number;
  status: AttendanceStatus;
  location?: {
    checkInLatitude?: number;
    checkInLongitude?: number;
    checkInLocation?: string;
    checkOutLatitude?: number;
    checkOutLongitude?: number;
    checkOutLocation?: string;
  };
  regularizationStatus: RegularizationStatus;
  regularizationReason?: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  regularizationManagerComment?: string;
  regularizationResolvedBy?: string | { _id: string; firstName: string; lastName: string };
  regularizationResolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Leave & Holidays
// -------------------------------------------------------------
export const CreateLeaveTypeSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.nativeEnum(LeaveTypeEnum),
  daysPerYear: z.coerce.number().min(0),
  carryForwardMax: z.coerce.number().min(0).default(0),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const ApplyLeaveSchema = z.object({
  leaveTypeId: z.string().min(1, 'Leave type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export const ApproveRejectLeaveSchema = z.object({
  status: z.enum([LeaveStatus.APPROVED, LeaveStatus.REJECTED]),
  managerComment: z.string().optional(),
});

export const CreateHolidaySchema = z.object({
  title: z.string().min(2, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
  isOptional: z.boolean().default(false),
});

export type CreateLeaveTypeDto = z.infer<typeof CreateLeaveTypeSchema>;
export type ApplyLeaveDto = z.infer<typeof ApplyLeaveSchema>;
export type ApproveRejectLeaveDto = z.infer<typeof ApproveRejectLeaveSchema>;
export type CreateHolidayDto = z.infer<typeof CreateHolidaySchema>;

export interface IHoliday {
  _id: string;
  title: string;
  date: string;
  description?: string;
  isOptional: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ILeaveRequest {
  _id: string;
  employeeId: string | { _id: string; firstName: string; lastName: string; employeeId: string };
  leaveTypeId: string | { _id: string; name: string; code: LeaveTypeEnum };
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  managerComment?: string;
  approvedBy?: string | { _id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface ILeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: LeaveTypeEnum;
  totalAllocated: number;
  used: number;
  pending: number;
  available: number;
}

// -------------------------------------------------------------
// Payroll (Indian Context: PF, ESI, TDS, PT)
// -------------------------------------------------------------
export const SalaryStructureSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  basic: z.coerce.number().min(0, 'Basic salary cannot be negative'),
  hra: z.coerce.number().min(0).default(0),
  conveyance: z.coerce.number().min(0).default(0),
  specialAllowance: z.coerce.number().min(0).default(0),
  medicalAllowance: z.coerce.number().min(0).default(0),

  // Deductions percentages and defaults
  pfApplicable: z.boolean().default(true),
  pfEmployeePercent: z.coerce.number().min(0).max(100).default(12), // standard 12%
  pfEmployerPercent: z.coerce.number().min(0).max(100).default(12),

  esiApplicable: z.boolean().default(false),
  esiEmployeePercent: z.coerce.number().min(0).max(100).default(0.75), // 0.75%
  esiEmployerPercent: z.coerce.number().min(0).max(100).default(3.25), // 3.25%

  professionalTax: z.coerce.number().min(0).default(200), // Standard Indian PT
  monthlyTds: z.coerce.number().min(0).default(0), // Tax Deducted at Source
});

export const RunPayrollSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2050),
});

export type SalaryStructureDto = z.infer<typeof SalaryStructureSchema>;
export type RunPayrollDto = z.infer<typeof RunPayrollSchema>;

export interface ISalaryStructure {
  _id: string;
  employeeId: string | { _id: string; firstName: string; lastName: string; employeeId: string };
  basic: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  medicalAllowance: number;
  grossSalary: number;

  pfApplicable: boolean;
  pfEmployeePercent: number;
  pfEmployerPercent: number;

  esiApplicable: boolean;
  esiEmployeePercent: number;
  esiEmployerPercent: number;

  professionalTax: number;
  monthlyTds: number;
  totalDeductions: number;
  netSalary: number;
  createdAt: string;
  updatedAt: string;
}

export interface IPayrollItem {
  _id: string;
  employeeId:
    | string
    | { _id: string; firstName: string; lastName: string; employeeId: string; bankDetails?: any };
  month: number;
  year: number;
  totalWorkingDays: number;
  presentDays: number;
  paidLeaves: number;
  payableDays: number;

  earnings: {
    basic: number;
    hra: number;
    conveyance: number;
    specialAllowance: number;
    medicalAllowance: number;
    grossEarnings: number;
  };

  deductions: {
    pfEmployee: number;
    pfEmployer: number;
    esiEmployee: number;
    esiEmployer: number;
    professionalTax: number;
    tds: number;
    totalDeductions: number;
  };

  netSalary: number;
  status: PayrollStatus;
  payslipGenerated: boolean;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Notifications
// -------------------------------------------------------------
export enum NotificationType {
  LEAVE_APPLIED = 'LEAVE_APPLIED',
  LEAVE_APPROVED = 'LEAVE_APPROVED',
  LEAVE_REJECTED = 'LEAVE_REJECTED',
  GENERAL = 'GENERAL',
}

export interface INotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationFeedResponse {
  notifications: INotification[];
  unreadCount: number;
}

export interface IAuditLog {
  _id: string;
  userId: string;
  userEmail: string;
  userRole: UserRole;
  action: AuditAction;
  entity: string; // e.g. 'EMPLOYEE', 'ATTENDANCE', 'PAYROLL', 'LEAVE'
  entityId?: string;
  details: string; // Human readable description
  diff?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
