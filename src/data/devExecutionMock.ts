// ---------- Types ----------
export type AgentStatus = "waiting" | "running" | "done" | "error";
export type RequirementStatus = "waiting" | "running" | "done" | "testing" | "review" | "accepted" | "rejected";

export interface Agent {
  id: string;
  name: string;
  icon: string;
  progress: number;
  status: AgentStatus;
  currentFile: string;
  dependsOn?: string;
}

export type TestItemStatus = "pending" | "running" | "passed" | "failed";

export interface TestItem {
  id: string;
  name: string;
  status: TestItemStatus;
  duration?: number;
}

export interface TestResult {
  tests: TestItem[];
  retryCount: number;
  isRetrying: boolean;
}

export interface Submitter {
  name: string;
  avatar: string; // initials or emoji
  color: string;  // tailwind bg class token
}

export const mockSubmitters: Submitter[] = [
  { name: "吴承霖", avatar: "吴", color: "bg-blue-500" },
  { name: "邱翔", avatar: "邱", color: "bg-emerald-500" },
  { name: "李泽龙", avatar: "李", color: "bg-violet-500" },
  { name: "张东杰", avatar: "张", color: "bg-orange-500" },
];

export interface Requirement {
  id: string;
  title: string;
  status: RequirementStatus;
  agents: Agent[];
  rejectReason?: string;
  previewPath?: string;
  testResult?: TestResult;
  submitter: Submitter;
  submittedAt: Date;
}

export interface LogEntry {
  time: string;
  reqId: string;
  agentName: string;
  message: string;
}

// ---------- Test case templates per agent icon ----------
const testTemplatesByIcon: Record<string, string[]> = {
  code: ["{title} 核心逻辑验证", "{title} 边界条件测试", "{title} 异常处理测试"],
  test: ["{title} 测试覆盖率检查"],
  review: ["{title} 代码规范检查"],
  api: ["{title} 接口响应验证", "{title} 接口错误处理", "{title} 参数校验测试"],
  db: ["{title} 数据模型验证", "{title} 迁移脚本测试"],
  ui: ["{title} 组件渲染测试", "{title} 交互行为测试", "{title} 响应式布局测试"],
};

export const generateTestsForRequirement = (req: { id: string; title: string; agents: { icon: string }[] }): TestItem[] => {
  const tests: TestItem[] = [];
  const usedNames = new Set<string>();
  const shortTitle = req.title.slice(0, 6);
  
  for (const agent of req.agents) {
    const templates = testTemplatesByIcon[agent.icon] || ["{title} 功能验证"];
    for (const tpl of templates) {
      const name = tpl.replace("{title}", shortTitle);
      if (!usedNames.has(name)) {
        usedNames.add(name);
        tests.push({ id: `${req.id}-t${tests.length}`, name, status: "pending" });
      }
    }
  }
  // Cap at 3-6 tests
  return tests.slice(0, Math.min(6, Math.max(3, tests.length)));
};

// ---------- Templates for generating requirements ----------
const categories: { prefix: string; items: { title: string; previewPath?: string; agents: Omit<Agent, "id" | "progress" | "status">[] }[] }[] = [
  {
    prefix: "用户模块",
    items: [
      { title: "用户登录表单验证修复", previewPath: "/preview/login-form", agents: [{ name: "代码生成", icon: "code", currentFile: "LoginForm.tsx" }, { name: "测试编写", icon: "test", currentFile: "login.test.ts" }, { name: "代码审查", icon: "review", currentFile: "review" }] },
      { title: "创建用户认证 API", previewPath: "/preview/auth-api", agents: [{ name: "Schema 设计", icon: "db", currentFile: "users.sql" }, { name: "API 开发", icon: "api", currentFile: "auth/login" }, { name: "接口测试", icon: "test", currentFile: "auth.test.ts" }] },
      { title: "用户个人中心页面", previewPath: "/preview/profile", agents: [{ name: "UI 开发", icon: "ui", currentFile: "Profile.tsx" }, { name: "逻辑开发", icon: "code", currentFile: "useProfile.ts" }, { name: "测试编写", icon: "test", currentFile: "profile.test.ts" }] },
      { title: "密码重置功能", previewPath: "/preview/reset-password", agents: [{ name: "API 开发", icon: "api", currentFile: "reset-password" }, { name: "邮件模板", icon: "ui", currentFile: "ResetEmail.tsx" }, { name: "测试编写", icon: "test", currentFile: "reset.test.ts" }] },
      { title: "用户头像上传", previewPath: "/preview/avatar-upload", agents: [{ name: "存储接入", icon: "api", currentFile: "storage.ts" }, { name: "UI 组件", icon: "ui", currentFile: "AvatarUpload.tsx" }] },
      { title: "用户权限管理", previewPath: "/preview/rbac", agents: [{ name: "Schema 设计", icon: "db", currentFile: "roles.sql" }, { name: "权限中间件", icon: "code", currentFile: "rbac.ts" }, { name: "测试编写", icon: "test", currentFile: "rbac.test.ts" }, { name: "代码审查", icon: "review", currentFile: "review" }] },
      { title: "第三方登录集成", previewPath: "/preview/social-login", agents: [{ name: "OAuth 接入", icon: "api", currentFile: "oauth.ts" }, { name: "UI 按钮", icon: "ui", currentFile: "SocialLogin.tsx" }] },
      { title: "用户注销流程优化", agents: [{ name: "逻辑开发", icon: "code", currentFile: "logout.ts" }, { name: "测试编写", icon: "test", currentFile: "logout.test.ts" }] },
    ],
  },
  {
    prefix: "支付模块",
    items: [
      { title: "支付模块集成", previewPath: "/preview/payment-form", agents: [{ name: "支付接入", icon: "api", currentFile: "payment.ts" }, { name: "UI 组件", icon: "ui", currentFile: "PaymentForm.tsx" }, { name: "支付测试", icon: "test", currentFile: "payment.test.ts" }, { name: "安全审查", icon: "review", currentFile: "review" }] },
      { title: "订单列表页面", previewPath: "/preview/order-list", agents: [{ name: "UI 开发", icon: "ui", currentFile: "OrderList.tsx" }, { name: "API 对接", icon: "api", currentFile: "orders" }, { name: "测试编写", icon: "test", currentFile: "orders.test.ts" }] },
      { title: "退款处理流程", previewPath: "/preview/refund", agents: [{ name: "API 开发", icon: "api", currentFile: "refund" }, { name: "逻辑开发", icon: "code", currentFile: "refund.ts" }, { name: "测试编写", icon: "test", currentFile: "refund.test.ts" }] },
      { title: "发票生成功能", previewPath: "/preview/invoice", agents: [{ name: "PDF 生成", icon: "code", currentFile: "invoice.ts" }, { name: "模板设计", icon: "ui", currentFile: "InvoiceTemplate.tsx" }] },
      { title: "优惠券系统", previewPath: "/preview/coupon", agents: [{ name: "Schema 设计", icon: "db", currentFile: "coupons.sql" }, { name: "API 开发", icon: "api", currentFile: "coupons" }, { name: "UI 组件", icon: "ui", currentFile: "CouponInput.tsx" }] },
      { title: "支付回调处理", agents: [{ name: "Webhook 开发", icon: "api", currentFile: "webhook.ts" }, { name: "测试编写", icon: "test", currentFile: "webhook.test.ts" }] },
    ],
  },
  {
    prefix: "通知模块",
    items: [
      { title: "站内通知系统", previewPath: "/preview/notifications", agents: [{ name: "Schema 设计", icon: "db", currentFile: "notifications.sql" }, { name: "API 开发", icon: "api", currentFile: "notifications" }, { name: "UI 组件", icon: "ui", currentFile: "NotifBell.tsx" }] },
      { title: "邮件通知服务", previewPath: "/preview/email-template", agents: [{ name: "邮件接入", icon: "api", currentFile: "mailer.ts" }, { name: "模板设计", icon: "ui", currentFile: "EmailTemplate.tsx" }, { name: "测试编写", icon: "test", currentFile: "mailer.test.ts" }] },
      { title: "推送通知集成", agents: [{ name: "推送接入", icon: "api", currentFile: "push.ts" }, { name: "测试编写", icon: "test", currentFile: "push.test.ts" }] },
      { title: "通知偏好设置", previewPath: "/preview/notif-settings", agents: [{ name: "UI 开发", icon: "ui", currentFile: "NotifSettings.tsx" }, { name: "API 对接", icon: "api", currentFile: "preferences" }] },
      { title: "消息已读状态同步", agents: [{ name: "实时同步", icon: "code", currentFile: "realtime.ts" }, { name: "测试编写", icon: "test", currentFile: "realtime.test.ts" }] },
    ],
  },
  {
    prefix: "报表模块",
    items: [
      { title: "数据仪表盘", previewPath: "/preview/dashboard", agents: [{ name: "图表组件", icon: "ui", currentFile: "Dashboard.tsx" }, { name: "数据聚合", icon: "code", currentFile: "aggregate.ts" }, { name: "API 开发", icon: "api", currentFile: "analytics" }] },
      { title: "导出 CSV 功能", agents: [{ name: "导出逻辑", icon: "code", currentFile: "export.ts" }, { name: "测试编写", icon: "test", currentFile: "export.test.ts" }] },
      { title: "实时数据监控", previewPath: "/preview/live-monitor", agents: [{ name: "WebSocket 接入", icon: "api", currentFile: "ws.ts" }, { name: "图表组件", icon: "ui", currentFile: "LiveChart.tsx" }, { name: "测试编写", icon: "test", currentFile: "ws.test.ts" }] },
      { title: "报表定时任务", agents: [{ name: "调度器", icon: "code", currentFile: "scheduler.ts" }, { name: "API 开发", icon: "api", currentFile: "schedules" }, { name: "测试编写", icon: "test", currentFile: "scheduler.test.ts" }] },
      { title: "用户行为分析", previewPath: "/preview/analytics", agents: [{ name: "埋点采集", icon: "code", currentFile: "tracking.ts" }, { name: "分析面板", icon: "ui", currentFile: "Analytics.tsx" }] },
      { title: "日报周报自动生成", agents: [{ name: "模板引擎", icon: "code", currentFile: "report-gen.ts" }, { name: "UI 展示", icon: "ui", currentFile: "ReportView.tsx" }, { name: "测试编写", icon: "test", currentFile: "report.test.ts" }] },
    ],
  },
  {
    prefix: "系统模块",
    items: [
      { title: "系统设置页面", previewPath: "/preview/settings", agents: [{ name: "UI 开发", icon: "ui", currentFile: "Settings.tsx" }, { name: "API 对接", icon: "api", currentFile: "settings" }] },
      { title: "操作日志审计", agents: [{ name: "Schema 设计", icon: "db", currentFile: "audit_logs.sql" }, { name: "API 开发", icon: "api", currentFile: "audit" }, { name: "UI 组件", icon: "ui", currentFile: "AuditLog.tsx" }, { name: "测试编写", icon: "test", currentFile: "audit.test.ts" }] },
      { title: "文件管理系统", previewPath: "/preview/file-manager", agents: [{ name: "存储接入", icon: "api", currentFile: "file-storage.ts" }, { name: "UI 组件", icon: "ui", currentFile: "FileManager.tsx" }, { name: "测试编写", icon: "test", currentFile: "file.test.ts" }] },
      { title: "多语言国际化", agents: [{ name: "i18n 配置", icon: "code", currentFile: "i18n.ts" }, { name: "翻译文件", icon: "code", currentFile: "locales/zh.json" }, { name: "测试编写", icon: "test", currentFile: "i18n.test.ts" }] },
      { title: "暗色主题支持", previewPath: "/preview/theme", agents: [{ name: "主题系统", icon: "ui", currentFile: "theme.ts" }, { name: "组件适配", icon: "ui", currentFile: "ThemeProvider.tsx" }] },
      { title: "性能监控接入", agents: [{ name: "监控 SDK", icon: "code", currentFile: "monitor.ts" }, { name: "面板开发", icon: "ui", currentFile: "PerfPanel.tsx" }] },
      { title: "错误边界与降级", agents: [{ name: "ErrorBoundary", icon: "code", currentFile: "ErrorBoundary.tsx" }, { name: "降级 UI", icon: "ui", currentFile: "Fallback.tsx" }, { name: "测试编写", icon: "test", currentFile: "error.test.ts" }] },
      { title: "缓存策略优化", agents: [{ name: "缓存逻辑", icon: "code", currentFile: "cache.ts" }, { name: "测试编写", icon: "test", currentFile: "cache.test.ts" }] },
      { title: "API 限流与熔断", agents: [{ name: "中间件开发", icon: "code", currentFile: "rateLimit.ts" }, { name: "测试编写", icon: "test", currentFile: "rateLimit.test.ts" }, { name: "代码审查", icon: "review", currentFile: "review" }] },
      { title: "数据库索引优化", agents: [{ name: "SQL 分析", icon: "db", currentFile: "indexes.sql" }, { name: "性能测试", icon: "test", currentFile: "perf.test.ts" }] },
      { title: "CI/CD 流水线配置", agents: [{ name: "配置编写", icon: "code", currentFile: "pipeline.yml" }, { name: "测试编写", icon: "test", currentFile: "ci.test.ts" }] },
      { title: "安全扫描集成", agents: [{ name: "扫描配置", icon: "code", currentFile: "security.ts" }, { name: "报告展示", icon: "ui", currentFile: "SecurityReport.tsx" }] },
    ],
  },
];

export const createInitialRequirements = (): Requirement[] => {
  const reqs: Requirement[] = [];
  let reqIdx = 0;

  for (const cat of categories) {
    for (const item of cat.items) {
      reqIdx++;
      const reqId = `req-${reqIdx}`;
      const agents: Agent[] = item.agents.map((a, i) => ({
        ...a,
        id: `${reqId}-a${i}`,
        progress: 0,
        status: "waiting" as AgentStatus,
        dependsOn: i > 0 ? `${reqId}-a${i - 1}` : undefined,
      }));
      reqs.push({
        id: reqId,
        title: item.title,
        status: "waiting",
        agents,
        previewPath: item.previewPath,
      });
    }
  }

  // First 3 requirements: already reviewed (all agents done, tests passed)
  const PRE_DONE = 3;
  for (let i = 0; i < PRE_DONE && i < reqs.length; i++) {
    reqs[i].status = "review";
    for (const agent of reqs[i].agents) {
      agent.status = "done";
      agent.progress = 100;
    }
    const tests = generateTestsForRequirement(reqs[i]).map(t => ({
      ...t,
      status: "passed" as TestItemStatus,
      duration: Math.floor(Math.random() * 300) + 50,
    }));
    reqs[i].testResult = { tests, retryCount: 0, isRetrying: false };
  }

  // Start next 8 as running
  for (let i = PRE_DONE; i < Math.min(PRE_DONE + 8, reqs.length); i++) {
    reqs[i].status = "running";
    const first = reqs[i].agents.find(a => !a.dependsOn);
    if (first) first.status = "running";
  }

  return reqs;
};

export const logTemplates: Record<string, string[]> = {
  running: [
    "开始处理 {file}",
    "正在分析 {file} 的代码结构",
    "生成代码中: {file}",
    "正在编写 {file}",
  ],
  done: [
    "✅ 完成 {file}",
    "✅ {file} 已生成并通过基础验证",
  ],
};

export const formatTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
};
