export type NotificationType =
  | "dev_complete"      // 开发完成
  | "review_requested"  // 收到审查邀请
  | "review_approved"   // 审查通过
  | "review_rejected"   // 审查被打回
  | "deployed";         // 已发布到测试环境

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
}

const now = Date.now();

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
  },
  {
    id: "notif-3",
    type: "review_approved",
    title: "审查已通过",
    description: "首页 Banner 组件更新",
    actor: "邱翔",
    conversationId: "conv-2",
    taskId: "task-3",
    timestamp: now - 2 * 3600_000,
    read: true,
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
  },
  {
    id: "notif-5",
    type: "review_rejected",
    title: "审查需要修改",
    description: "搜索功能性能优化",
    actor: "张东杰",
    conversationId: "conv-1",
    timestamp: now - 8 * 3600_000,
    read: true,
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
