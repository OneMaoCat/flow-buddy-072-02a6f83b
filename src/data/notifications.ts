export type NotificationType =
  | "dev_complete"      // 开发完成
  | "review_requested"  // 收到审查邀请
  | "review_approved"   // 审查通过
  | "review_rejected"   // 审查被打回
  | "deployed";         // 已发布到测试环境

export type NotificationPriority = "action" | "result" | "publish";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  /** Who triggered this notification */
  actor: string;
  /** Conversation id to navigate to */
  conversationId?: string;
  /** Task card id to select */
  taskId?: string;
  timestamp: number;
  read: boolean;
  /** Whether user action is required */
  actionRequired: boolean;
  /** CTA button label */
  actionLabel: string;
  /** One-line context summary */
  contextSummary?: string;
}

const now = Date.now();

export const getNotificationPriority = (type: NotificationType): NotificationPriority => {
  switch (type) {
    case "review_requested":
    case "review_rejected":
      return "action";
    case "deployed":
      return "publish";
    default:
      return "result";
  }
};

export const getActionLabel = (type: NotificationType): string => {
  switch (type) {
    case "review_requested": return "去审查";
    case "review_rejected": return "查看意见";
    case "deployed": return "查看预览";
    case "dev_complete": return "查看详情";
    case "review_approved": return "查看详情";
  }
};

export const buildMockNotifications = (): AppNotification[] => [
  {
    id: "notif-1",
    type: "review_requested",
    title: "邀请你审查代码",
    description: "支付模块重构 — 微信支付接入",
    actor: "吴承霖",
    conversationId: "conv-1",
    taskId: "task-2",
    timestamp: now - 5 * 60_000,
    read: false,
    actionRequired: true,
    actionLabel: "去审查",
    contextSummary: "AI 已完成后端接入与回调逻辑，等待你确认实现是否符合预期",
  },
  {
    id: "notif-2",
    type: "dev_complete",
    title: "开发已完成",
    description: "用户登录页面优化",
    actor: "DeepFlow AI",
    conversationId: "conv-1",
    taskId: "task-1",
    timestamp: now - 30 * 60_000,
    read: false,
    actionRequired: false,
    actionLabel: "查看详情",
    contextSummary: "已优化表单交互与错误提示逻辑，建议验收登录流程",
  },
  {
    id: "notif-6",
    type: "review_rejected",
    title: "审查需要修改",
    description: "支付模块重构 — 微信支付接入",
    actor: "李泽龙",
    conversationId: "conv-1",
    taskId: "task-2",
    timestamp: now - 1 * 3600_000,
    read: false,
    actionRequired: true,
    actionLabel: "查看意见",
    contextSummary: "回调签名验证缺少异常兜底，建议增加超时重试机制",
  },
  {
    id: "notif-3",
    type: "review_approved",
    title: "审查已通过",
    description: "首页 Banner 组件更新",
    actor: "李娟娟",
    conversationId: "conv-2",
    taskId: "task-3",
    timestamp: now - 2 * 3600_000,
    read: true,
    actionRequired: false,
    actionLabel: "查看详情",
    contextSummary: "代码质量符合标准，已批准合并",
  },
  {
    id: "notif-7",
    type: "deployed",
    title: "已发布到测试环境",
    description: "首页 Banner 组件更新",
    actor: "系统",
    conversationId: "conv-2",
    taskId: "task-3",
    timestamp: now - 2.5 * 3600_000,
    read: true,
    actionRequired: false,
    actionLabel: "查看预览",
    contextSummary: "测试环境已生成，可预览页面效果并继续验收",
  },
  {
    id: "notif-4",
    type: "deployed",
    title: "已发布到测试环境",
    description: "订单列表分页功能",
    actor: "李泽龙",
    conversationId: "conv-2",
    taskId: "task-4",
    timestamp: now - 5 * 3600_000,
    read: true,
    actionRequired: false,
    actionLabel: "查看预览",
    contextSummary: "分页逻辑已上线测试环境，默认每页 20 条",
  },
  {
    id: "notif-8",
    type: "dev_complete",
    title: "开发已完成",
    description: "订单列表分页功能",
    actor: "DeepFlow AI",
    conversationId: "conv-2",
    taskId: "task-4",
    timestamp: now - 6 * 3600_000,
    read: true,
    actionRequired: false,
    actionLabel: "查看详情",
    contextSummary: "已实现前后端分页，支持跳页与每页条数切换",
  },
  {
    id: "notif-5",
    type: "review_rejected",
    title: "审查需要修改",
    description: "搜索功能性能优化",
    actor: "沈楚城",
    conversationId: "conv-1",
    timestamp: now - 26 * 3600_000,
    read: true,
    actionRequired: true,
    actionLabel: "查看意见",
    contextSummary: "审查未通过，建议补充异常兜底与缓存策略说明",
  },
  {
    id: "notif-9",
    type: "review_approved",
    title: "审查已通过",
    description: "搜索功能性能优化",
    actor: "张东杰",
    conversationId: "conv-1",
    timestamp: now - 28 * 3600_000,
    read: true,
    actionRequired: false,
    actionLabel: "查看详情",
  },
];

export const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "dev_complete": return "🛠️";
    case "review_requested": return "👀";
    case "review_approved": return "✅";
    case "review_rejected": return "🔄";
    case "deployed": return "🚀";
  }
};

export const formatTimeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
};

export type TimeGroup = "today" | "yesterday" | "earlier";

export const getTimeGroup = (ts: number): TimeGroup => {
  const now = new Date();
  const date = new Date(ts);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400_000;
  if (ts >= todayStart) return "today";
  if (ts >= yesterdayStart) return "yesterday";
  return "earlier";
};

export const timeGroupLabels: Record<TimeGroup, string> = {
  today: "今天",
  yesterday: "昨天",
  earlier: "更早",
};
