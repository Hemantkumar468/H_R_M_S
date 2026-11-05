'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/services/endpoints';
import { INotification, NotificationType } from '@hrms/shared';
import {
  Bell,
  CheckCheck,
  CalendarDays,
  CheckCircle2,
  XCircle,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export function NotificationCenter() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close desktop dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const { data: feed } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationApi.list(30);
      return res.data;
    },
    refetchInterval: 30000, // Refetch every 30s
  });

  const unreadCount = feed?.unreadCount || 0;
  const notifications = feed?.notifications || [];

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => notificationApi.markAllRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (n: INotification) => {
    if (!n.isRead) {
      markReadMutation.mutate(n._id);
    }
    setIsOpen(false);
    if (n.link) {
      router.push(n.link);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.LEAVE_APPLIED:
        return <CalendarDays className="h-4 w-4 text-amber-500" />;
      case NotificationType.LEAVE_APPROVED:
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case NotificationType.LEAVE_REJECTED:
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button (44px touch target) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative flex h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-sm ring-2 ring-background animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Desktop Dropdown Popover (>= 1024px) */}
      {isOpen && (
        <div className="hidden lg:block absolute right-0 top-12 w-96 rounded-2xl border bg-card shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="font-medium text-foreground">All caught up!</p>
                <p>No new notifications right now.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 text-xs cursor-pointer transition-colors hover:bg-muted/60 flex items-start gap-3 ${
                    !n.isRead ? 'bg-primary/5 font-medium' : 'text-muted-foreground'
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border shadow-xs mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-foreground truncate">{n.title}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatTimestamp(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet (< 1024px) */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Bottom Sheet Drawer */}
          <div className="relative z-50 w-full max-h-[85vh] flex flex-col bg-card border-t rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle */}
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/30" />

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="min-h-[44px] px-2 text-xs font-bold text-primary flex items-center gap-1 active:opacity-70"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/60 p-2">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                  <Sparkles className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <p className="font-bold text-sm text-foreground">All caught up!</p>
                  <p>You have no pending notifications.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`min-h-[56px] p-3.5 rounded-xl cursor-pointer transition-colors active:bg-muted/80 flex items-start gap-3 my-1 ${
                      !n.isRead ? 'bg-primary/5 border border-primary/20' : 'bg-card'
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted border shadow-2xs mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-sm text-foreground truncate">{n.title}</p>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {formatTimestamp(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-normal">{n.message}</p>
                    </div>
                    {!n.isRead && (
                      <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 self-center" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
