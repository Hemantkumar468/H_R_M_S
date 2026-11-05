'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  ShieldAlert,
  LogOut,
  Moon,
  Sun,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/store/auth-context';
import { useTheme } from 'next-themes';
import { UserRole } from '@hrms/shared';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();
  const { theme, setTheme } = useTheme();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
      name: 'Employees',
      href: '/employees',
      icon: Users,
      show: true,
    },
    {
      name: 'Organization',
      href: '/organization',
      icon: Building2,
      show: hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER),
    },
    { name: 'Attendance', href: '/attendance', icon: CalendarCheck, show: true },
    { name: 'Leaves & Holidays', href: '/leaves', icon: CalendarDays, show: true },
    {
      name: 'Payroll',
      href: '/payroll',
      icon: CreditCard,
      show: true,
    },
    {
      name: 'Audit Logs',
      href: '/audit-logs',
      icon: ShieldAlert,
      show: hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
    },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-6 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow">
          H
        </div>
        <div>
          <span className="font-bold text-base tracking-tight block">HRMS Enterprise</span>
          <span className="text-[11px] text-muted-foreground block -mt-0.5">
            Workforce Core ERP
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation
          .filter((item) => item.show !== false)
          .map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
      </nav>

      {/* User Session Footer */}
      <div className="p-3 border-t bg-muted/20 space-y-3">
        {user && (
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold text-xs">
                {user.firstName[0]}
                {user.lastName?.[0]}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold truncate">
                  {user.firstName} {user.lastName}
                </p>
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 mt-0.5">
                  {user.role}
                </Badge>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        )}

        <button
          onClick={logout}
          className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
