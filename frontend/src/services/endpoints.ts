import { apiClient } from './api';
import {
  ApiResponse,
  ApiResponseMeta,
  CurrentUserSession,
  IEmployee,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  UpdateEmployeeStatusDto,
  IDepartment,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  IDesignation,
  CreateDesignationDto,
  UpdateDesignationDto,
  IAttendance,
  CheckInDto,
  RegularizeAttendanceDto,
  ApproveRejectRegularizationDto,
  ILeaveRequest,
  ILeaveBalance,
  ApplyLeaveDto,
  ApproveRejectLeaveDto,
  IHoliday,
  CreateHolidayDto,
  ISalaryStructure,
  SalaryStructureDto,
  RunPayrollDto,
  IPayrollItem,
  IAuditLog,
  PaginationQueryParams,
  INotification,
  NotificationFeedResponse,
} from '@hrms/shared';

// Auth API
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post<
      ApiResponse<{ user: CurrentUserSession; accessToken: string }>
    >('/auth/login', credentials);
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get<ApiResponse<CurrentUserSession>>('/auth/me');
    return res.data;
  },
  logout: async () => {
    const res = await apiClient.post<ApiResponse>('/auth/logout');
    return res.data;
  },
};

// Department API
export const departmentApi = {
  list: async (params?: PaginationQueryParams) => {
    const res = await apiClient.get<ApiResponse<IDepartment[]>>('/departments', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<IDepartment>>(`/departments/${id}`);
    return res.data;
  },
  create: async (data: CreateDepartmentDto) => {
    const res = await apiClient.post<ApiResponse<IDepartment>>('/departments', data);
    return res.data;
  },
  update: async (id: string, data: UpdateDepartmentDto) => {
    const res = await apiClient.patch<ApiResponse<IDepartment>>(`/departments/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete<ApiResponse>(`/departments/${id}`);
    return res.data;
  },
};

// Designation API
export const designationApi = {
  list: async (params?: PaginationQueryParams & { departmentId?: string }) => {
    const res = await apiClient.get<ApiResponse<IDesignation[]>>('/designations', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<IDesignation>>(`/designations/${id}`);
    return res.data;
  },
  create: async (data: CreateDesignationDto) => {
    const res = await apiClient.post<ApiResponse<IDesignation>>('/designations', data);
    return res.data;
  },
  update: async (id: string, data: UpdateDesignationDto) => {
    const res = await apiClient.patch<ApiResponse<IDesignation>>(`/designations/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete<ApiResponse>(`/designations/${id}`);
    return res.data;
  },
};

// Employee API
export const employeeApi = {
  list: async (
    params?: PaginationQueryParams & {
      departmentId?: string;
      designationId?: string;
      status?: string;
    },
  ) => {
    const res = await apiClient.get<ApiResponse<IEmployee[]>>('/employees', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<IEmployee>>(`/employees/${id}`);
    return res.data;
  },
  create: async (data: CreateEmployeeDto) => {
    const res = await apiClient.post<ApiResponse<IEmployee>>('/employees', data);
    return res.data;
  },
  update: async (id: string, data: UpdateEmployeeDto) => {
    const res = await apiClient.patch<ApiResponse<IEmployee>>(`/employees/${id}`, data);
    return res.data;
  },
  updateStatus: async (id: string, data: UpdateEmployeeStatusDto) => {
    const res = await apiClient.patch<ApiResponse<IEmployee>>(`/employees/${id}/status`, data);
    return res.data;
  },
  uploadDocument: async (id: string, formData: FormData) => {
    const res = await apiClient.post<ApiResponse<IEmployee>>(
      `/employees/${id}/documents`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return res.data;
  },
  deleteDocument: async (id: string, documentId: string) => {
    const res = await apiClient.delete<ApiResponse<IEmployee>>(
      `/employees/${id}/documents/${documentId}`,
    );
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete<ApiResponse>(`/employees/${id}`);
    return res.data;
  },
};

// Attendance API
export const attendanceApi = {
  checkIn: async (data: CheckInDto) => {
    const res = await apiClient.post<ApiResponse<IAttendance>>('/attendance/check-in', data);
    return res.data;
  },
  checkOut: async (data: CheckInDto) => {
    const res = await apiClient.post<ApiResponse<IAttendance>>('/attendance/check-out', data);
    return res.data;
  },
  getTodayStatus: async () => {
    const res = await apiClient.get<ApiResponse<IAttendance | null>>('/attendance/today');
    return res.data;
  },
  getMyAttendance: async (month?: number, year?: number) => {
    const res = await apiClient.get<ApiResponse<IAttendance[]>>('/attendance/my', {
      params: { month, year },
    });
    return res.data;
  },
  getTeamAttendance: async (date?: string) => {
    const res = await apiClient.get<ApiResponse<IAttendance[]>>('/attendance/team', {
      params: { date },
    });
    return res.data;
  },
  requestRegularization: async (data: RegularizeAttendanceDto) => {
    const res = await apiClient.post<ApiResponse<IAttendance>>('/attendance/regularize', data);
    return res.data;
  },
  listPendingRegularizations: async () => {
    const res = await apiClient.get<ApiResponse<IAttendance[]>>(
      '/attendance/regularizations/pending',
    );
    return res.data;
  },
  resolveRegularization: async (id: string, data: ApproveRejectRegularizationDto) => {
    const res = await apiClient.patch<ApiResponse<IAttendance>>(
      `/attendance/regularizations/${id}/resolve`,
      data,
    );
    return res.data;
  },
};

// Leave API
export const leaveApi = {
  getTypes: async () => {
    const res =
      await apiClient.get<
        ApiResponse<Array<{ _id: string; name: string; code: string; daysPerYear: number }>>
      >('/leaves/types');
    return res.data;
  },
  apply: async (data: ApplyLeaveDto) => {
    const res = await apiClient.post<ApiResponse<ILeaveRequest>>('/leaves/apply', data);
    return res.data;
  },
  getMyLeaves: async () => {
    const res = await apiClient.get<ApiResponse<ILeaveRequest[]>>('/leaves/my');
    return res.data;
  },
  getMyBalances: async () => {
    const res = await apiClient.get<ApiResponse<ILeaveBalance[]>>('/leaves/balances');
    return res.data;
  },
  getByEmployeeId: async (employeeId: string) => {
    const res = await apiClient.get<ApiResponse<ILeaveRequest[]>>(`/leaves/employee/${employeeId}`);
    return res.data;
  },
  getBalancesByEmployeeId: async (employeeId: string) => {
    const res = await apiClient.get<ApiResponse<ILeaveBalance[]>>(
      `/leaves/employee/${employeeId}/balances`,
    );
    return res.data;
  },
  getTeamCalendar: async (month?: number, year?: number) => {
    const res = await apiClient.get<ApiResponse<ILeaveRequest[]>>('/leaves/calendar', {
      params: { month, year },
    });
    return res.data;
  },
  listPending: async () => {
    const res = await apiClient.get<ApiResponse<ILeaveRequest[]>>('/leaves/pending');
    return res.data;
  },
  resolve: async (id: string, data: ApproveRejectLeaveDto) => {
    const res = await apiClient.patch<ApiResponse<ILeaveRequest>>(`/leaves/${id}/resolve`, data);
    return res.data;
  },
};

// Holiday API
export const holidayApi = {
  list: async (year?: number) => {
    const res = await apiClient.get<ApiResponse<IHoliday[]>>('/holidays', {
      params: { year },
    });
    return res.data;
  },
  create: async (data: CreateHolidayDto) => {
    const res = await apiClient.post<ApiResponse<IHoliday>>('/holidays', data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete<ApiResponse>(`/holidays/${id}`);
    return res.data;
  },
};

// Payroll API
export const payrollApi = {
  getStructure: async (employeeId: string) => {
    const res = await apiClient.get<ApiResponse<ISalaryStructure>>(
      `/payroll/structure/${employeeId}`,
    );
    return res.data;
  },
  upsertStructure: async (employeeId: string, data: SalaryStructureDto) => {
    const res = await apiClient.post<ApiResponse<ISalaryStructure>>(
      `/payroll/structure/${employeeId}`,
      data,
    );
    return res.data;
  },
  runPayroll: async (data: RunPayrollDto) => {
    const res = await apiClient.post<
      ApiResponse<{
        month: number;
        year: number;
        totalEmployeesProcessed: number;
        totalGross: number;
        totalDeductions: number;
        totalNet: number;
      }>
    >('/payroll/run', data);
    return res.data;
  },
  listMonthly: async (month?: number, year?: number) => {
    const res = await apiClient.get<ApiResponse<IPayrollItem[]>>('/payroll/monthly', {
      params: { month, year },
    });
    return res.data;
  },
  getMyPayslips: async () => {
    const res = await apiClient.get<ApiResponse<IPayrollItem[]>>('/payroll/my-payslips');
    return res.data;
  },
  getPayslipDownloadUrl: (id: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
    return `${baseUrl}/payroll/payslips/${id}/download`;
  },
};

// Audit Log API
export const auditLogApi = {
  list: async (params?: PaginationQueryParams & { action?: string; entity?: string }) => {
    const res = await apiClient.get<ApiResponse<IAuditLog[]>>('/audit-logs', { params });
    return res.data;
  },
};

// Notification API
export const notificationApi = {
  list: async (limit = 30) => {
    const res = await apiClient.get<ApiResponse<NotificationFeedResponse>>('/notifications', {
      params: { limit },
    });
    return res.data;
  },
  markRead: async (id: string) => {
    const res = await apiClient.patch<ApiResponse<INotification>>(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await apiClient.patch<ApiResponse>('/notifications/read-all');
    return res.data;
  },
};
