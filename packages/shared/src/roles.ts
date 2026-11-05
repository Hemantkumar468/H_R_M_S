export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  HR_ADMIN = 'HR_ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum Permission {
  // Employee Management
  EMPLOYEE_CREATE = 'employee:create',
  EMPLOYEE_READ = 'employee:read',
  EMPLOYEE_UPDATE = 'employee:update',
  EMPLOYEE_DELETE = 'employee:delete',

  // Organization Management
  ORG_MANAGE = 'org:manage',
  ORG_READ = 'org:read',

  // Attendance
  ATTENDANCE_CHECKIN = 'attendance:checkin',
  ATTENDANCE_READ_OWN = 'attendance:read_own',
  ATTENDANCE_READ_TEAM = 'attendance:read_team',
  ATTENDANCE_READ_ALL = 'attendance:read_all',
  ATTENDANCE_MANAGE = 'attendance:manage',
  ATTENDANCE_REGULARIZE = 'attendance:regularize',

  // Leave
  LEAVE_APPLY = 'leave:apply',
  LEAVE_READ_OWN = 'leave:read_own',
  LEAVE_READ_TEAM = 'leave:read_team',
  LEAVE_READ_ALL = 'leave:read_all',
  LEAVE_APPROVE = 'leave:approve',
  LEAVE_MANAGE_POLICY = 'leave:manage_policy',

  // Payroll
  PAYROLL_READ_OWN = 'payroll:read_own',
  PAYROLL_READ_ALL = 'payroll:read_all',
  PAYROLL_RUN = 'payroll:run',
  PAYROLL_MANAGE_STRUCTURE = 'payroll:manage_structure',

  // Recruitment
  RECRUITMENT_READ = 'recruitment:read',
  RECRUITMENT_MANAGE = 'recruitment:manage',

  // Performance
  PERFORMANCE_SUBMIT_SELF = 'performance:submit_self',
  PERFORMANCE_REVIEW_TEAM = 'performance:review_team',
  PERFORMANCE_MANAGE = 'performance:manage',

  // Helpdesk
  HELPDESK_CREATE = 'helpdesk:create',
  HELPDESK_MANAGE = 'helpdesk:manage',

  // Announcements
  ANNOUNCEMENT_READ = 'announcement:read',
  ANNOUNCEMENT_MANAGE = 'announcement:manage',

  // Reports
  REPORTS_VIEW = 'reports:view',
  REPORTS_EXPORT = 'reports:export',

  // Settings & Audit Logs
  SETTINGS_MANAGE = 'settings:manage',
  AUDIT_LOGS_VIEW = 'audit_logs:view',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.HR_ADMIN]: [
    Permission.EMPLOYEE_CREATE,
    Permission.EMPLOYEE_READ,
    Permission.EMPLOYEE_UPDATE,
    Permission.EMPLOYEE_DELETE,
    Permission.ORG_MANAGE,
    Permission.ORG_READ,
    Permission.ATTENDANCE_CHECKIN,
    Permission.ATTENDANCE_READ_OWN,
    Permission.ATTENDANCE_READ_TEAM,
    Permission.ATTENDANCE_READ_ALL,
    Permission.ATTENDANCE_MANAGE,
    Permission.ATTENDANCE_REGULARIZE,
    Permission.LEAVE_APPLY,
    Permission.LEAVE_READ_OWN,
    Permission.LEAVE_READ_TEAM,
    Permission.LEAVE_READ_ALL,
    Permission.LEAVE_APPROVE,
    Permission.LEAVE_MANAGE_POLICY,
    Permission.PAYROLL_READ_OWN,
    Permission.PAYROLL_READ_ALL,
    Permission.PAYROLL_RUN,
    Permission.PAYROLL_MANAGE_STRUCTURE,
    Permission.RECRUITMENT_READ,
    Permission.RECRUITMENT_MANAGE,
    Permission.PERFORMANCE_SUBMIT_SELF,
    Permission.PERFORMANCE_REVIEW_TEAM,
    Permission.PERFORMANCE_MANAGE,
    Permission.HELPDESK_CREATE,
    Permission.HELPDESK_MANAGE,
    Permission.ANNOUNCEMENT_READ,
    Permission.ANNOUNCEMENT_MANAGE,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT,
    Permission.SETTINGS_MANAGE,
    Permission.AUDIT_LOGS_VIEW,
  ],
  [UserRole.MANAGER]: [
    Permission.EMPLOYEE_READ,
    Permission.ORG_READ,
    Permission.ATTENDANCE_CHECKIN,
    Permission.ATTENDANCE_READ_OWN,
    Permission.ATTENDANCE_READ_TEAM,
    Permission.ATTENDANCE_REGULARIZE,
    Permission.LEAVE_APPLY,
    Permission.LEAVE_READ_OWN,
    Permission.LEAVE_READ_TEAM,
    Permission.LEAVE_APPROVE,
    Permission.PAYROLL_READ_OWN,
    Permission.RECRUITMENT_READ,
    Permission.PERFORMANCE_SUBMIT_SELF,
    Permission.PERFORMANCE_REVIEW_TEAM,
    Permission.HELPDESK_CREATE,
    Permission.ANNOUNCEMENT_READ,
    Permission.REPORTS_VIEW,
  ],
  [UserRole.EMPLOYEE]: [
    Permission.ORG_READ,
    Permission.ATTENDANCE_CHECKIN,
    Permission.ATTENDANCE_READ_OWN,
    Permission.ATTENDANCE_REGULARIZE,
    Permission.LEAVE_APPLY,
    Permission.LEAVE_READ_OWN,
    Permission.PAYROLL_READ_OWN,
    Permission.PERFORMANCE_SUBMIT_SELF,
    Permission.HELPDESK_CREATE,
    Permission.ANNOUNCEMENT_READ,
  ],
};
