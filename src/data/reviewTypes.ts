/* ─── AI Code Review Types ─── */

export interface ReviewComment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
  filePath?: string;
}

/** Legacy human reviewer — kept for type compat but no longer used in new flow */
export interface Reviewer {
  id: string;
  name: string;
  avatar?: string;
  status: "pending" | "approved" | "rejected";
}

/* ─── AI Model Reviewer ─── */

export interface AIModelReviewer {
  id: string;
  model: string;
  displayName: string;
  icon: string; // emoji
  status: "pending" | "reviewing" | "done";
  score?: number; // 0-100
  summary?: string;
  findings?: AIReviewFinding[];
}

export type FindingSeverity = "critical" | "warning" | "suggestion" | "praise";

export interface AIReviewFinding {
  id: string;
  severity: FindingSeverity;
  title: string;
  description: string;
  filePath?: string;
  lineRange?: string;
}

export interface ReviewInfo {
  reviewers: Reviewer[];
  comments: ReviewComment[];
  aiReviewers?: AIModelReviewer[];
  aiReviewStatus?: "pending" | "running" | "done";
  overallScore?: number;
}

/* ─── AI Models used for review ─── */

export const AI_REVIEW_MODELS: Omit<AIModelReviewer, "status" | "score" | "summary" | "findings">[] = [
  { id: "gpt5", model: "GPT-5", displayName: "GPT-5", icon: "🧠" },
  { id: "gemini", model: "Gemini 2.5 Pro", displayName: "Gemini 2.5 Pro", icon: "💎" },
  { id: "claude", model: "Claude Opus", displayName: "Claude Opus", icon: "🎭" },
];

/* ─── Legacy helpers (kept for compat) ─── */

export const TEAM_MEMBERS: Reviewer[] = [];

export const createDefaultReview = (): ReviewInfo => ({
  reviewers: [],
  comments: [],
  aiReviewers: AI_REVIEW_MODELS.map((m) => ({ ...m, status: "pending" as const })),
  aiReviewStatus: "pending",
});

export const isReviewApproved = (review: ReviewInfo): boolean => {
  if (review.aiReviewers && review.aiReviewers.length > 0) {
    return review.aiReviewStatus === "done" &&
      review.aiReviewers.every((r) => r.status === "done") &&
      (review.overallScore ?? 0) >= 70;
  }
  return review.reviewers.length > 0 && review.reviewers.every((r) => r.status === "approved");
};

/* ─── Mock AI Review Result Builder ─── */

export const buildMockAIReview = (): ReviewInfo => {
  const findings: Record<string, AIReviewFinding[]> = {
    gpt5: [
      { id: "f1", severity: "praise", title: "良好的错误处理", description: "邮箱校验使用了标准正则表达式，异常路径覆盖全面", filePath: "src/components/LoginForm.tsx" },
      { id: "f2", severity: "suggestion", title: "建议提取校验常量", description: "emailRegex 建议提取为全局常量或放入 validators.ts 中统一管理，便于复用", filePath: "src/components/LoginForm.tsx", lineRange: "L3-L4" },
      { id: "f3", severity: "warning", title: "密码强度判定阈值偏低", description: "当前仅要求 8 位+数字+字母，建议增加对特殊字符的可选支持", filePath: "src/components/LoginForm.tsx", lineRange: "L6" },
    ],
    gemini: [
      { id: "f4", severity: "praise", title: "测试覆盖率优秀", description: "10 个测试用例覆盖了正常与异常场景，覆盖率预估 > 90%", filePath: "src/components/LoginForm.test.ts" },
      { id: "f5", severity: "suggestion", title: "FormErrorTip 可增加无障碍属性", description: "建议添加 role='alert' 和 aria-live='polite' 以支持屏幕阅读器", filePath: "src/components/FormErrorTip.tsx", lineRange: "L6-L8" },
    ],
    claude: [
      { id: "f6", severity: "praise", title: "代码风格一致", description: "新增代码风格与项目现有规范保持一致，命名清晰" },
      { id: "f7", severity: "critical", title: "旧逻辑移除不完整", description: "LoginForm 中第 42 行仍残留 console.log 调试语句，应在生产代码中移除", filePath: "src/components/LoginForm.tsx", lineRange: "L42" },
      { id: "f8", severity: "suggestion", title: "可增加节流处理", description: "表单提交按钮建议加入防抖/节流逻辑，避免用户短时间内多次点击", filePath: "src/components/LoginForm.tsx" },
    ],
  };

  const aiReviewers: AIModelReviewer[] = AI_REVIEW_MODELS.map((m) => ({
    ...m,
    status: "done" as const,
    score: m.id === "gpt5" ? 88 : m.id === "gemini" ? 92 : 85,
    summary: m.id === "gpt5"
      ? "代码质量良好，建议提取公共校验逻辑并适当增强密码强度要求"
      : m.id === "gemini"
        ? "测试覆盖充分，建议补充无障碍属性以提升可访问性"
        : "整体风格一致，发现一处遗留调试代码需清理，建议增加提交防抖",
    findings: findings[m.id] || [],
  }));

  const avgScore = Math.round(aiReviewers.reduce((s, r) => s + (r.score || 0), 0) / aiReviewers.length);

  return {
    reviewers: [],
    comments: [],
    aiReviewers,
    aiReviewStatus: "done",
    overallScore: avgScore,
  };
};
