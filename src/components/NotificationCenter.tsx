import { useState } from "react";
import { Bell, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType, TimeGroup } from "@/data/notifications";
import {
  getNotificationIcon,
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

/** Group key for aggregation: prefer taskId, fallback conversationId */
const getAggKey = (n: AppNotification) => n.taskId || n.conversationId || n.id;

interface AggGroup {
  key: string;
  latest: AppNotification;
  history: AppNotification[];
}

const aggregate = (list: AppNotification[]): AggGroup[] => {
  const map = new Map<string, AppNotification[]>();
  for (const n of list) {
    const k = getAggKey(n);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(n);
  }
  const groups: AggGroup[] = [];
  for (const [key, items] of map) {
    const sorted = [...items].sort((a, b) => b.timestamp - a.timestamp);
    groups.push({ key, latest: sorted[0], history: sorted.slice(1) });
  }
  return groups.sort((a, b) => b.latest.timestamp - a.latest.timestamp);
};

const priorityColors: Record<string, { bar: string; iconBg: string }> = {
  action: { bar: "bg-orange-500", iconBg: "bg-orange-100 dark:bg-orange-900/30" },
  result: { bar: "bg-transparent", iconBg: "bg-secondary" },
  publish: { bar: "bg-transparent", iconBg: "bg-green-100 dark:bg-green-900/30" },
};

const NotificationCenter = ({
  notifications,
  onClickNotification,
  onMarkAllRead,
  onClose,
}: NotificationCenterProps) => {
  const [filter, setFilter] = useState<FilterValue>("action_required");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const unreadCount = notifications.filter((n) => !n.read).length;
  const actionCount = notifications.filter((n) => n.actionRequired).length;

  // Filter
  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    if (filter === "action_required") return n.actionRequired;
    return n.type === filter;
  });

  // Sort: action_required first in "all" view
  const sorted =
    filter === "all"
      ? [...filtered].sort((a, b) => {
          if (a.actionRequired !== b.actionRequired) return a.actionRequired ? -1 : 1;
          return b.timestamp - a.timestamp;
        })
      : [...filtered].sort((a, b) => b.timestamp - a.timestamp);

  // Aggregate
  const aggGroups = aggregate(sorted);

  // Time grouping
  const timeGrouped = new Map<TimeGroup, AggGroup[]>();
  for (const g of aggGroups) {
    const tg = getTimeGroup(g.latest.timestamp);
    if (!timeGrouped.has(tg)) timeGrouped.set(tg, []);
    timeGrouped.get(tg)!.push(g);
  }
  const timeGroupOrder: TimeGroup[] = ["today", "yesterday", "earlier"];

  const toggleExpand = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getFilterCount = (f: FilterValue) => {
    if (f === "all") return notifications.length;
    if (f === "unread") return unreadCount;
    if (f === "action_required") return actionCount;
    return notifications.filter((n) => n.type === f).length;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Filter bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border overflow-x-auto scrollbar-hide">
        {typeFilters.map((f) => {
          const count = getFilterCount(f.value);
          const isActionTab = f.value === "action_required";
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                filter === f.value
                  ? isActionTab
                    ? "bg-orange-500 text-white"
                    : "bg-primary text-primary-foreground"
                  : isActionTab && count > 0
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-200"
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
        {aggGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 py-16">
            <Bell size={32} className="opacity-30" />
            <p className="text-sm">
              {filter === "unread"
                ? "没有未读通知"
                : filter === "action_required"
                ? "没有需要处理的事项 🎉"
                : "暂无通知"}
            </p>
          </div>
        ) : (
          <div>
            {timeGroupOrder.map((tg) => {
              const groups = timeGrouped.get(tg);
              if (!groups || groups.length === 0) return null;
              return (
                <div key={tg}>
                  {/* Time group header */}
                  <div className="px-6 py-2 bg-muted/50 border-b border-border">
                    <span className="text-xs font-medium text-muted-foreground">
                      {timeGroupLabels[tg]}
                    </span>
                  </div>
                  {/* Groups */}
                  <div className="divide-y divide-border">
                    {groups.map((group) => (
                      <NotifGroup
                        key={group.key}
                        group={group}
                        expanded={expandedGroups.has(group.key)}
                        onToggle={() => toggleExpand(group.key)}
                        onClickNotification={onClickNotification}
                      />
                    ))}
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

/* ── Single notification card ── */

const NotifCard = ({
  notif,
  onClickNotification,
  compact = false,
}: {
  notif: AppNotification;
  onClickNotification: (n: AppNotification) => void;
  compact?: boolean;
}) => {
  const priority = getNotificationPriority(notif.type);
  const colors = priorityColors[priority];

  return (
    <div
      className={cn(
        "w-full flex items-start gap-3 text-left transition-colors hover:bg-secondary/50 relative",
        compact ? "px-6 pl-12 py-2.5" : "px-6 py-4",
        !notif.read && "bg-primary/[0.03]"
      )}
    >
      {/* Priority bar */}
      {priority === "action" && (
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r bg-orange-500" />
      )}

      {/* Icon */}
      {!compact && (
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg",
            colors.iconBg
          )}
        >
          {getNotificationIcon(notif.type)}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              compact ? "text-xs" : "text-sm",
              !notif.read ? "font-semibold text-foreground" : "text-foreground"
            )}
          >
            {notif.title}
          </span>
          {!notif.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
        </div>
        <p className={cn("text-muted-foreground mt-0.5 truncate", compact ? "text-xs" : "text-sm")}>
          {notif.description}
        </p>
        {/* Context summary */}
        {notif.contextSummary && !compact && (
          <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
            {notif.contextSummary}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-muted-foreground">{notif.actor}</span>
          <span className="text-xs text-muted-foreground/50">·</span>
          <span className="text-xs text-muted-foreground/70">
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
          "shrink-0 self-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
          priority === "action"
            ? "bg-orange-500 text-white hover:bg-orange-600"
            : priority === "publish"
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-secondary text-foreground hover:bg-secondary/80"
        )}
      >
        {notif.actionLabel}
      </button>
    </div>
  );
};

/* ── Aggregated group ── */

const NotifGroup = ({
  group,
  expanded,
  onToggle,
  onClickNotification,
}: {
  group: AggGroup;
  expanded: boolean;
  onToggle: () => void;
  onClickNotification: (n: AppNotification) => void;
}) => {
  const hasHistory = group.history.length > 0;

  return (
    <div>
      <NotifCard notif={group.latest} onClickNotification={onClickNotification} />
      {hasHistory && (
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-1.5 px-6 pb-2 -mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span>
            还有 {group.history.length} 条相关通知
          </span>
        </button>
      )}
      {hasHistory && expanded && (
        <div className="border-t border-border/50">
          {group.history.map((n) => (
            <NotifCard key={n.id} notif={n} onClickNotification={onClickNotification} compact />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
