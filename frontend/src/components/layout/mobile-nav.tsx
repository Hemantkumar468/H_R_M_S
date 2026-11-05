'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CalendarCheck, CalendarDays, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Attendance', href: '/attendance', icon: CalendarCheck },
    { name: 'Leaves', href: '/leaves', icon: CalendarDays },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-bottom">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== '/dashboard' && pathname?.startsWith(link.href));
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center h-full min-h-[44px] gap-1 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <link.icon className={cn('h-5 w-5', isActive && 'scale-110')} />
              <span>{link.name}</span>
            </Link>
          );
        })}

        {/* More / Menu Drawer trigger */}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center h-full min-h-[44px] gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
