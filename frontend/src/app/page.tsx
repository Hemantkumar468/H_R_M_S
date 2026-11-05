import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  CalendarCheck,
  CreditCard,
  Building2,
  FileCheck2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      title: 'Employee Profiles',
      desc: 'Complete 360° lifecycle from onboarding to exit with automated ID generation.',
      icon: Users,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40',
    },
    {
      title: 'Mobile Attendance',
      desc: 'One-tap geo-fenced check-in/out, shift tracking, and regularization workflow.',
      icon: CalendarCheck,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      title: 'Leave & Holidays',
      desc: 'Accrual policies, multi-tier approvals, team balance calendars and carry-forward.',
      icon: FileCheck2,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40',
    },
    {
      title: 'Automated Payroll',
      desc: 'Configurable salary structures, statutory tax deductions, and downloadable PDF payslips.',
      icon: CreditCard,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40',
    },
    {
      title: 'Enterprise Org Hierarchy',
      desc: 'Multi-branch locations, reporting managers, and visual organization tree.',
      icon: Building2,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40',
    },
    {
      title: 'Strict RBAC Security',
      desc: 'Super Admin, HR Admin, Manager & Employee roles with audited permissions.',
      icon: ShieldCheck,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile-Friendly Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
              H
            </div>
            <span className="font-bold text-lg tracking-tight">HRMS Enterprise</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="px-4 py-12 sm:py-20 lg:py-28 container text-center">
          <div className="mx-auto flex max-w-[800px] flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3 py-1 text-xs sm:text-sm font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>HRMS v1.0 • Enterprise Monorepo</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground">
              Mobile-First Human Resource Management
            </h1>

            <p className="max-w-[640px] text-muted-foreground text-sm sm:text-lg">
              High-performance ERP core designed for 360px mobile touchscreens up to desktop
              monitors. Engineered with Next.js, Express, TypeScript, and MongoDB.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                Access Portal
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="http://localhost:5000/api/v1/health"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-input bg-background px-6 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all"
              >
                Backend Health API
              </a>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="container px-4 py-8 sm:py-16">
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight">
              Enterprise Suite Modules
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Everything needed to operate workforce operations at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border bg-card p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`inline-flex p-3 rounded-lg ${item.color} mb-3`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 px-4 bg-muted/20">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} HRMS Enterprise Monorepo. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Next.js App Router</span>
            <span>•</span>
            <span>Express REST API</span>
            <span>•</span>
            <span>MongoDB Mongoose</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
