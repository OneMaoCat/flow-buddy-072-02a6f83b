// ---------- Types ----------
export type AgentStatus = "waiting" | "running" | "done" | "error";
export type RequirementStatus = "waiting" | "running" | "done" | "testing" | "review" | "accepted" | "rejected" | "blocked";

export type SubStatus =
  | "需求解析" | "方案生成" | "编码中" | "修复中"
  | "单元测试" | "集成测试" | "回归测试"
  | "等待确认" | "等待预览" | "等待发布";

export type RiskLevel = "low" | "medium" | "high";
export type TaskType = "frontend" | "backend" | "database" | "api" | "deploy" | "docs";
export type BlockType = "clarify" | "design" | "dependency" | "conflict" | "permission" | "test_failure";

export interface BlockOption {
  label: string;
  description?: string;
}

export interface BlockInfo {
  type: BlockType;
  reason: string;
  question?: string;
  options?: BlockOption[];
  conflictFiles?: string[];
  missingItems?: string[];
  failedTests?: string[];
  permissionAction?: string;
}

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
  avatar: string;
  color: string;
}

export interface SourceContext {
  userPrompt: string;
  aiSummary: string;
  aiReasoning: string;
}

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
  // New fields
  subStatus?: SubStatus;
  riskLevel: RiskLevel;
  taskType: TaskType;
  blockReason?: string;
  blockInfo?: BlockInfo;
  sourceContext: SourceContext;
  groupId: string;
  changedFiles?: number;
  linesAdded?: number;
  linesRemoved?: number;
}

export interface RequirementGroup {
  id: string;
  name: string;
  sourceDescription: string;
  aiSummary: string;
  requirements: string[]; // requirement ids
  submitter: Submitter;
  submittedAt: Date;
}

export interface LogEntry {
  time: string;
  reqId: string;
  agentName: string;
  message: string;
}

export const mockSubmitters: Submitter[] = [
  { name: "李泽龙", avatar: "李", color: "bg-violet-500" },
  { name: "李娟娟", avatar: "李", color: "bg-emerald-500" },
  { name: "沈楚城", avatar: "沈", color: "bg-orange-500" },
];

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
  return tests.slice(0, Math.min(6, Math.max(3, tests.length)));
};

// ---------- Derive taskType from agents ----------
const deriveTaskType = (agents: { icon: string }[]): TaskType => {
  const icons = agents.map(a => a.icon);
  if (icons.includes("db")) return "database";
  if (icons.includes("api")) return "api";
  if (icons.includes("ui") && !icons.includes("code")) return "frontend";
  if (icons.includes("code") && !icons.includes("ui")) return "backend";
  return "frontend";
};

// ---------- Derive riskLevel ----------
const deriveRiskLevel = (agents: { icon: string }[]): RiskLevel => {
  if (agents.length >= 4) return "high";
  if (agents.length >= 3) return "medium";
  return "low";
};

// ---------- Source context templates ----------
const sourceContextTemplates: Record<string, { userPrompt: string; aiSummary: string; aiReasoning: string }> = {
  "用户模块": {
    userPrompt: "帮我把用户相关的功能都做一遍，包括登录注册、个人中心、权限这些",
    aiSummary: "用户系统全链路开发：涵盖认证、个人中心、权限管理、第三方登录等 8 个子任务",
    aiReasoning: "用户模块是系统基础设施，拆分为独立的认证、UI、权限子任务以降低耦合度，优先完成登录验证作为其他功能的前置依赖",
  },
  "支付模块": {
    userPrompt: "需要接入支付功能，支持下单、退款、发票，还要有优惠券",
    aiSummary: "支付系统完整集成：包含支付接入、订单管理、退款流程、发票生成、优惠券系统等 6 个子任务",
    aiReasoning: "支付模块涉及资金安全，拆分为独立子任务并增加安全审查 Agent。优惠券系统需要独立数据模型，因此单独拆出",
  },
  "通知模块": {
    userPrompt: "做一个完整的消息通知系统，站内通知、邮件、推送都要支持",
    aiSummary: "多渠道通知系统：涵盖站内通知、邮件服务、推送集成、偏好设置、已读同步等 5 个子任务",
    aiReasoning: "通知系统按渠道拆分（站内/邮件/推送），每个渠道独立开发和测试。偏好设置作为统一入口单独处理",
  },
  "报表模块": {
    userPrompt: "需要数据看板和报表功能，支持实时监控和数据导出",
    aiSummary: "数据分析与报表系统：包含仪表盘、CSV导出、实时监控、定时报表、行为分析等 6 个子任务",
    aiReasoning: "报表模块按数据流向拆分：采集（埋点）→ 聚合（数据处理）→ 展示（图表）→ 导出（CSV/报表），确保数据管道完整",
  },
  "系统模块": {
    userPrompt: "把系统的基础架构完善一下，包括设置、日志、文件管理、i18n、主题、性能监控、安全这些",
    aiSummary: "系统基础设施完善：涵盖设置页面、审计日志、文件管理、国际化、主题、性能监控等 12 个子任务",
    aiReasoning: "系统模块任务较多但相互独立，可高度并行执行。CI/CD 和安全扫描作为质量保障放在最后",
  },
};

// ---------- Block info templates for demo ----------
const mockBlockInfos: BlockInfo[] = [
  {
    type: "clarify",
    reason: "需求描述存在歧义",
    question: "「用户登录」是否需要支持手机号验证码登录？还是仅支持邮箱密码？",
    options: [
      { label: "仅邮箱密码", description: "传统邮箱 + 密码登录，实现成本低" },
      { label: "手机号 + 邮箱", description: "同时支持手机验证码和邮箱密码，覆盖面更广" },
      { label: "全渠道登录", description: "邮箱、手机号、微信、Google 等全部支持" },
    ],
  },
  {
    type: "design",
    reason: "需要确认 UI 交互方案",
    question: "表单验证错误提示应采用哪种展示方式？",
    options: [
      { label: "行内提示", description: "错误信息显示在输入框下方，实时反馈" },
      { label: "顶部汇总", description: "所有错误汇总在表单顶部，提交时一次性展示" },
      { label: "Toast 弹窗", description: "使用弹窗提示错误，不占用表单空间" },
    ],
  },
  {
    type: "dependency",
    reason: "等待外部资源就绪",
    question: "以下外部依赖尚未就绪，请确认后勾选：",
    missingItems: [
      "支付服务 API Key（生产环境）",
      "邮件服务 SMTP 配置",
      "OSS 存储 Bucket 权限",
    ],
  },
  {
    type: "conflict",
    reason: "代码合并存在冲突",
    question: "以下文件存在合并冲突，请选择保留策略：",
    conflictFiles: [
      "src/components/UserProfile.tsx",
      "src/hooks/useAuth.ts",
      "src/styles/globals.css",
    ],
  },
  {
    type: "permission",
    reason: "敏感操作需要人工确认",
    question: "AI 需要执行以下敏感操作，是否授权？",
    permissionAction: "删除 users 表中的 legacy_role 字段并迁移数据到 user_roles 表（影响 1,247 条记录）",
  },
  {
    type: "test_failure",
    reason: "测试持续失败，需人工介入",
    question: "以下测试用例在 3 次自动修复后仍然失败：",
    failedTests: [
      "用户登录表 核心逻辑验证 — 期望返回 JWT 但收到 null",
      "用户登录表 边界条件测试 — 超长密码场景未处理",
      "用户登录表 异常处理测试 — 网络断开时未触发重试",
    ],
  },
];

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

export const createInitialRequirements = (): { requirements: Requirement[]; groups: RequirementGroup[] } => {
  const reqs: Requirement[] = [];
  const groups: RequirementGroup[] = [];
  let reqIdx = 0;

  for (const cat of categories) {
    const groupId = `group-${cat.prefix}`;
    const groupReqIds: string[] = [];
    const groupSubmitter = mockSubmitters[groups.length % mockSubmitters.length];
    const ctx = sourceContextTemplates[cat.prefix] || {
      userPrompt: `请帮我完成${cat.prefix}相关的开发`,
      aiSummary: `${cat.prefix}全链路开发`,
      aiReasoning: `按功能模块拆分为独立子任务`,
    };

    for (const item of cat.items) {
      reqIdx++;
      const reqId = `req-${reqIdx}`;
      groupReqIds.push(reqId);
      const agents: Agent[] = item.agents.map((a, i) => ({
        ...a,
        id: `${reqId}-a${i}`,
        progress: 0,
        status: "waiting" as AgentStatus,
        dependsOn: i > 0 ? `${reqId}-a${i - 1}` : undefined,
      }));
      const submitter = mockSubmitters[reqIdx % mockSubmitters.length];
      const submittedAt = new Date(Date.now() - Math.floor(Math.random() * 3600_000 * 4));
      reqs.push({
        id: reqId,
        title: item.title,
        status: "waiting",
        agents,
        previewPath: item.previewPath,
        submitter,
        submittedAt,
        riskLevel: deriveRiskLevel(item.agents),
        taskType: deriveTaskType(item.agents),
        sourceContext: {
          userPrompt: ctx.userPrompt,
          aiSummary: ctx.aiSummary,
          aiReasoning: ctx.aiReasoning,
        },
        groupId,
        changedFiles: Math.floor(Math.random() * 8) + 2,
        linesAdded: Math.floor(Math.random() * 300) + 50,
        linesRemoved: Math.floor(Math.random() * 80) + 5,
      });
    }

    groups.push({
      id: groupId,
      name: cat.prefix,
      sourceDescription: ctx.userPrompt,
      aiSummary: ctx.aiSummary,
      requirements: groupReqIds,
      submitter: groupSubmitter,
      submittedAt: new Date(Date.now() - Math.floor(Math.random() * 3600_000 * 8)),
    });
  }

  // First 3 requirements: already reviewed
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

  // Add some blocked tasks for demo
  const blockCandidates = reqs.filter(r => r.status === "waiting").slice(0, 2);
  blockCandidates.forEach((r, i) => {
    r.status = "blocked";
    r.blockReason = blockReasons[i % blockReasons.length];
    r.subStatus = "等待确认";
  });

  // Start next 8 as running
  let started = 0;
  for (let i = 0; i < reqs.length && started < 8; i++) {
    if (reqs[i].status === "waiting") {
      reqs[i].status = "running";
      const first = reqs[i].agents.find(a => !a.dependsOn);
      if (first) first.status = "running";
      started++;
    }
  }

  return { requirements: reqs, groups };
};

// ---------- SubStatus derivation ----------
export const deriveSubStatus = (req: Requirement): SubStatus | undefined => {
  if (req.status === "blocked") return req.subStatus || "等待确认";
  if (req.status !== "running") return undefined;
  const runningAgent = req.agents.find(a => a.status === "running");
  if (!runningAgent) return "需求解析";
  const doneCount = req.agents.filter(a => a.status === "done").length;
  if (doneCount === 0 && runningAgent.progress < 30) return "需求解析";
  if (doneCount === 0 && runningAgent.progress < 60) return "方案生成";
  if (runningAgent.icon === "test") return "单元测试";
  if (runningAgent.icon === "review") return "编码中";
  if (req.rejectReason) return "修复中";
  return "编码中";
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
