import { useState, useRef, useEffect, useCallback } from "react";
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
  const [collapsedTimeGroups, setCollapsedTimeGroups] = useState<Set<TimeGroup>>(new Set());
  const [animKey, setAnimKey] = useState(0);

  // Tab indicator
  const filterBarRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    if (activeTabRef.current && filterBarRef.current) {
      const bar = filterBarRef.current.getBoundingClientRect();
      const tab = activeTabRef.current.getBoundingClientRect();
      setIndicatorStyle({
        left: tab.left - bar.left + filterBarRef.current.scrollLeft,
        width: tab.width,
      });
    }
  }, []);

  useEffect(() => {
    updateIndicator();
  }, [filter, updateIndicator]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const actionCount = notifications.filter((n) => n.actionRequired).length;

  // Filter
  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    if (filter === "action_required") return n.actionRequired;
    return n.type === filter;
  });

  // Sort
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
      {/* Filter bar with sliding indicator */}
      <div className="relative border-b border-border">
        <div
          ref={filterBarRef}
          className="flex items-center gap-1 px-4 py-2 overflow-x-auto scrollbar-hide"
        >
          {typeFilters.map((f) => {
            const count = getFilterCount(f.value);
            const isActive = filter === f.value;
            const isActionTab = f.value === "action_required";
            return (
              <button
                key={f.value}
                ref={isActive ? activeTabRef : undefined}
                onClick={() => handleFilterChange(f.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200",
                  isActive
                    ? isActionTab
                      ? "bg-orange-500 text-white shadow-sm shadow-orange-500/25"
                      : "bg-primary text-primary-foreground shadow-sm"
                    : isActionTab && count > 0
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50"
                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {f.label}
                {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>
        {/* Sliding underline indicator */}
        <div
          className="absolute bottom-0 h-0.5 bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto">
        {aggGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 py-16 animate-scale-in">
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
          <div key={animKey}>
            {timeGroupOrder.map((tg) => {
              const groups = timeGrouped.get(tg);
              if (!groups || groups.length === 0) return null;
              const isCollapsed = collapsedTimeGroups.has(tg);
              return (
                <div key={tg}>
                  {/* Time group header — clickable to fold */}
                  <button
                    onClick={() => toggleTimeGroup(tg)}
                    className="w-full flex items-center gap-1.5 px-6 py-2 bg-muted/50 border-b border-border hover:bg-muted/80 transition-colors cursor-pointer"
                  >
                    <ChevronRight
                      size={12}
                      className={cn(
                        "text-muted-foreground transition-transform duration-200",
                        !isCollapsed && "rotate-90"
                      )}
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      {timeGroupLabels[tg]}
                    </span>
                    <span className="text-xs text-muted-foreground/50">({groups.length})</span>
                  </button>
                  {/* Collapsible group content */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-out",
                      isCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
                    )}
                  >
                    <div className="divide-y divide-border">
                      {groups.map((group, idx) => (
                        <div
                          key={group.key}
                          className="animate-fade-in"
                          style={{ animationDelay: `${idx * 40}ms`, animationFillMode: "backwards" }}
                        >
                          <NotifGroup
                            group={group}
                            expanded={expandedGroups.has(group.key)}
                            onToggle={() => toggleExpand(group.key)}
                            onClickNotification={onClickNotification}
                          />
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
      onClick={() => onClickNotification(notif)}
      className={cn(
        "w-full flex items-start gap-3 text-left relative cursor-pointer group",
        "transition-all duration-200 ease-out",
        "hover:bg-accent/60 hover:shadow-sm",
        "active:scale-[0.995] active:bg-accent",
        compact ? "px-6 pl-12 py-2.5" : "px-6 py-4",
        !notif.read && "bg-primary/[0.03]"
      )}
    >
      {/* Priority / unread bar */}
      {priority === "action" ? (
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r bg-orange-500" />
      ) : !notif.read ? (
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r bg-primary/40" />
      ) : null}

      {/* Icon */}
      {!compact && (
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg",
            "transition-transform duration-200 group-hover:scale-110",
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
          {!notif.read && (
            <span className="w-2 h-2 rounded-full bg-primary shrink-0 transition-transform duration-300" />
          )}
        </div>
        <p className={cn("text-muted-foreground mt-0.5 truncate", compact ? "text-xs" : "text-sm")}>
          {notif.description}
        </p>
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
          "shrink-0 self-center px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap",
          "transition-all duration-200",
          "opacity-80 group-hover:opacity-100",
          priority === "action"
            ? "bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-500/20"
            : priority === "publish"
            ? "bg-green-600 text-white hover:bg-green-700 shadow-sm shadow-green-600/20"
            : "bg-secondary text-foreground hover:bg-accent"
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
          <ChevronRight
            size={12}
            className={cn(
              "transition-transform duration-200",
              expanded && "rotate-90"
            )}
          />
          <span>还有 {group.history.length} 条相关通知</span>
        </button>
      )}
      {hasHistory && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="border-t border-border/50">
            {group.history.map((n, idx) => (
              <div
                key={n.id}
                style={{ animationDelay: `${idx * 30}ms`, animationFillMode: "backwards" }}
                className={expanded ? "animate-fade-in" : ""}
              >
                <NotifCard notif={n} onClickNotification={onClickNotification} compact />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
