import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/data/notifications";
import { getNotificationIcon, formatTimeAgo } from "@/data/notifications";

interface SidebarNotificationListProps {
  notifications: AppNotification[];
  onClickNotification: (notif: AppNotification) => void;
  onMarkAllRead: () => void;
}

const SidebarNotificationList = ({
  notifications,
  onClickNotification,
  onMarkAllRead,
}: SidebarNotificationListProps) => {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="flex flex-col gap-1">
      {/* Filter bar */}
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex gap-1">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-2 py-0.5 rounded text-[11px] transition-colors",
              filter === "all" ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            全部
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={cn(
              "px-2 py-0.5 rounded text-[11px] transition-colors",
              filter === "unread" ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            未读{unreadCount > 0 && ` (${unreadCount})`}
          </button>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-[10px] text-primary hover:underline"
          >
            全部已读
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex flex-col gap-0.5 max-h-[320px] overflow-y-auto scrollbar-hide">
        {filtered.length === 0 && (
          <p className="text-[11px] text-muted-foreground px-2 py-3 text-center">
            {filter === "unread" ? "没有未读通知" : "暂无通知"}
          </p>
        )}
        {filtered.map((notif) => (
          <button
            key={notif.id}
            onClick={() => onClickNotification(notif)}
            className={cn(
              "w-full flex items-start gap-2 px-2 py-2 rounded-md text-left transition-colors",
              notif.read
                ? "text-muted-foreground hover:bg-secondary/50"
                : "text-foreground bg-primary/5 hover:bg-primary/10"
            )}
          >
            <span className="text-sm shrink-0 mt-0.5">{getNotificationIcon(notif.type)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={cn("text-[11px] truncate", !notif.read && "font-medium")}>
                  {notif.actor} · {notif.title}
                </span>
                {!notif.read && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{notif.description}</p>
              <span className="text-[10px] text-muted-foreground/70">{formatTimeAgo(notif.timestamp)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SidebarNotificationList;
