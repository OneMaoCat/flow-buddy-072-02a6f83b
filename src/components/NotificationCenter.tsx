import { useState } from "react";
import { ArrowLeft, CheckCheck, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/data/notifications";
import { getNotificationIcon, formatTimeAgo } from "@/data/notifications";

const typeFilters: { label: string; value: NotificationType | "all" | "unread" }[] = [
  { label: "全部", value: "all" },
  { label: "未读", value: "unread" },
  { label: "开发完成", value: "dev_complete" },
  { label: "审查邀请", value: "review_requested" },
  { label: "审查通过", value: "review_approved" },
  { label: "需要修改", value: "review_rejected" },
  { label: "已发布", value: "deployed" },
];

interface NotificationCenterProps {
  notifications: AppNotification[];
  onClickNotification: (notif: AppNotification) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

const NotificationCenter = ({
  notifications,
  onClickNotification,
  onMarkAllRead,
  onClose,
}: NotificationCenterProps) => {
  const [filter, setFilter] = useState<NotificationType | "all" | "unread">("all");
  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-foreground" />
            <h1 className="text-lg font-semibold text-foreground">消息中心</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <CheckCheck size={14} />
            全部已读
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1.5 px-6 py-3 border-b border-border overflow-x-auto scrollbar-hide">
        {typeFilters.map((f) => {
          const count =
            f.value === "all"
              ? notifications.length
              : f.value === "unread"
              ? unreadCount
              : notifications.filter((n) => n.type === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              )}
            >
              {f.label}
              {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 py-16">
            <Bell size={32} className="opacity-30" />
            <p className="text-sm">{filter === "unread" ? "没有未读通知" : "暂无通知"}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((notif) => (
              <button
                key={notif.id}
                onClick={() => onClickNotification(notif)}
                className={cn(
                  "w-full flex items-start gap-4 px-6 py-4 text-left transition-colors hover:bg-secondary/50",
                  !notif.read && "bg-primary/[0.03]"
                )}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 text-lg">
                  {getNotificationIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm", !notif.read ? "font-semibold text-foreground" : "text-foreground")}>
                      {notif.title}
                    </span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">{notif.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-muted-foreground">{notif.actor}</span>
                    <span className="text-xs text-muted-foreground/50">·</span>
                    <span className="text-xs text-muted-foreground/70">{formatTimeAgo(notif.timestamp)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
