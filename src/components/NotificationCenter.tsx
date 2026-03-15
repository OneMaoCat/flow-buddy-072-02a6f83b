import { useState } from "react";
import { Bell, ChevronRight, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType, TimeGroup } from "@/data/notifications";
import {
  formatTimeAgo,
  getNotificationPriority,
  getTimeGroup,
  timeGroupLabels,
} from "@/data/notifications";

type FilterValue = NotificationType | "all" | "unread" | "action_required";

const typeFilters: { label: string; value: FilterValue }[] = [
  { label: "需要处理", value: "action_required" },
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
  const [filter, setFilter] = useState<FilterValue>("action_required");
  const [collapsedTimeGroups, setCollapsedTimeGroups] = useState<Set<TimeGroup>>(new Set());
  const [animKey, setAnimKey] = useState(0);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const actionCount = notifications.filter((n) => n.actionRequired).length;

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    if (filter === "action_required") return n.actionRequired;
    return n.type === filter;
  });

  const sorted =
    filter === "all"
      ? [...filtered].sort((a, b) => {
          if (a.actionRequired !== b.actionRequired) return a.actionRequired ? -1 : 1;
          return b.timestamp - a.timestamp;
        })
      : [...filtered].sort((a, b) => b.timestamp - a.timestamp);

  const timeGrouped = new Map<TimeGroup, AppNotification[]>();
  for (const n of sorted) {
    const tg = getTimeGroup(n.timestamp);
    if (!timeGrouped.has(tg)) timeGrouped.set(tg, []);
    timeGrouped.get(tg)!.push(n);
  }
  const timeGroupOrder: TimeGroup[] = ["today", "yesterday", "earlier"];

  const toggleTimeGroup = (tg: TimeGroup) => {
    setCollapsedTimeGroups((prev) => {
      const next = new Set(prev);
      if (next.has(tg)) next.delete(tg);
      else next.add(tg);
      return next;
    });
  };

  const getFilterCount = (f: FilterValue) => {
    if (f === "all") return notifications.length;
    if (f === "unread") return unreadCount;
    if (f === "action_required") return actionCount;
    return notifications.filter((n) => n.type === f).length;
  };

  const handleFilterChange = (value: FilterValue) => {
    setFilter(value);
    setAnimKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Single header row: filters */}
      <div className="border-b border-border/60">
        <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto scrollbar-hide">
          <Bell size={14} className="text-foreground shrink-0 mr-1" />
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-foreground text-background text-[10px] font-semibold shrink-0 mr-1">
              {unreadCount}
            </span>
          )}
          {typeFilters.map((f) => {
            const count = getFilterCount(f.value);
            const isActive = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => handleFilterChange(f.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200",
                  isActive
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {f.label}
                {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
              </button>
            );
          })}
          {unreadCount > 0 && (
            <>
              <div className="flex-1" />
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap shrink-0"
              >
                <CheckCheck size={12} />
                全部已读
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 py-16 animate-scale-in">
            <Bell size={32} className="opacity-30" />
            <p className="text-sm">
              {filter === "unread"
                ? "没有未读通知"
                : filter === "action_required"
                ? "没有需要处理的事项"
                : "暂无通知"}
            </p>
          </div>
        ) : (
          <div key={animKey}>
            {timeGroupOrder.map((tg) => {
              const items = timeGrouped.get(tg);
              if (!items || items.length === 0) return null;
              const isCollapsed = collapsedTimeGroups.has(tg);
              return (
                <div key={tg}>
                  <button
                    onClick={() => toggleTimeGroup(tg)}
                    className="w-full flex items-center gap-1.5 px-5 py-1.5 bg-muted/40 border-b border-border/40 hover:bg-muted/60 transition-colors cursor-pointer"
                  >
                    <ChevronRight
                      size={11}
                      className={cn(
                        "text-muted-foreground/60 transition-transform duration-200",
                        !isCollapsed && "rotate-90"
                      )}
                    />
                    <span className="text-[11px] font-medium text-muted-foreground/70">
                      {timeGroupLabels[tg]}
                    </span>
                    <span className="text-[11px] text-muted-foreground/40">({items.length})</span>
                  </button>
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-out",
                      isCollapsed ? "max-h-0 opacity-0" : "max-h-[5000px] opacity-100"
                    )}
                  >
                    <div className="divide-y divide-border/40">
                      {items.map((notif, idx) => (
                        <div
                          key={notif.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${idx * 40}ms`, animationFillMode: "backwards" }}
                        >
                          <NotifCard notif={notif} onClickNotification={onClickNotification} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Single notification card (no icon) ── */

const NotifCard = ({
  notif,
  onClickNotification,
}: {
  notif: AppNotification;
  onClickNotification: (n: AppNotification) => void;
}) => {
  const priority = getNotificationPriority(notif.type);

  return (
    <div
      onClick={() => onClickNotification(notif)}
      className={cn(
        "w-full flex items-start gap-3 text-left relative cursor-pointer group",
        "transition-all duration-200 ease-out",
        "hover:bg-accent/60 hover:shadow-sm",
        "active:scale-[0.995] active:bg-accent",
        "px-5 py-3",
        !notif.read && "bg-foreground/[0.02]"
      )}
    >
      {/* Priority / unread bar */}
      {priority === "action" ? (
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r bg-foreground" />
      ) : !notif.read ? (
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r bg-foreground/30" />
      ) : null}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm",
              !notif.read ? "font-semibold text-foreground" : "text-foreground"
            )}
          >
            {notif.title}
          </span>
          {!notif.read && (
            <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 truncate">
          {notif.description}
        </p>
        {notif.contextSummary && (
          <p className="text-xs text-muted-foreground/60 mt-0.5 line-clamp-2">
            {notif.contextSummary}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{notif.actor}</span>
          <span className="text-xs text-muted-foreground/40">·</span>
          <span className="text-xs text-muted-foreground/60">
            {formatTimeAgo(notif.timestamp)}
          </span>
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClickNotification(notif);
        }}
        className={cn(
          "shrink-0 self-center px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap",
          "transition-all duration-200",
          "opacity-70 group-hover:opacity-100",
          priority === "action"
            ? "bg-foreground text-background hover:bg-foreground/90"
            : "bg-secondary text-foreground hover:bg-accent"
        )}
      >
        {notif.actionLabel}
      </button>
    </div>
  );
};

export default NotificationCenter;
