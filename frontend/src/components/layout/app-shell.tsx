'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { NotificationCenter } from './notification-center';
import { useAuth } from '@/store/auth-context';
import { Building2, CreditCard, ShieldAlert, LogOut, Moon, Sun, X, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { UserRole } from '@hrms/shared';
import { Badge } from '@/components/ui/badge';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { user, logout, hasRole } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  // Close mobile drawer on route change
  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar (>= 1024px) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 pb-20 lg:pb-0">
        {/* Mobile Header (< 1024px) */}
        <header className="lg:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow">
              H
            </div>
            <span className="font-bold text-sm tracking-tight">HRMS Enterprise</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <NotificationCenter />
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {user && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                {user.firstName[0]}
              </div>
            )}
          </div>
        </header>

        {/* Desktop Top Bar (>= 1024px) */}
        <header className="hidden lg:flex h-16 items-center justify-between border-b bg-card/60 backdrop-blur px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">
              Enterprise HRMS Workspace
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationCenter />
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                  {user.firstName[0]}
                  {user.lastName?.[0]}
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-xs font-semibold leading-none">
                    {user.firstName} {user.lastName}
                  </p>
                  <span className="text-[10px] text-muted-foreground leading-none">
                    {user.role}
                  </span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile Bottom Navigation (< 1024px) */}
      <MobileNav onOpenMenu={() => setIsMenuOpen(true)} />

      {/* Mobile Drawer (More menu) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />

          <div className="relative z-50 flex h-full w-4/5 max-w-xs flex-col bg-card border-l p-5 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b">
              <span className="font-bold text-base">More Modules</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile info in drawer */}
            {user && (
              <div className="py-4 border-b flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                  {user.firstName[0]}
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <Badge variant="secondary" className="mt-1 text-[10px]">
                    {user.role}
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex-1 py-4 space-y-1 overflow-y-auto">
              {hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER) && (
                <Link
                  href="/organization"
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium hover:bg-muted"
                >
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <span>Organization Structure</span>
                </Link>
              )}

              <Link
                href="/payroll"
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium hover:bg-muted"
              >
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <span>Payroll & Payslips</span>
              </Link>

              {hasRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN) && (
                <Link
                  href="/audit-logs"
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium hover:bg-muted"
                >
                  <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                  <span>Audit Logs</span>
                </Link>
              )}
            </div>

            <div className="pt-4 border-t">
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 px-3 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
