import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import RequirementPreview from "@/components/RequirementPreview";
import CodeReviewTab from "@/components/CodeReviewTab";
import UITestReplay from "@/components/UITestReplay";
import {
  FileCode2,
  Eye,
  TestTube2,
  CheckCircle2,
  XCircle,
  Rocket,
  RotateCcw,
  X,
  Shield,
  LayoutDashboard,
  
  Code2,
  AlertTriangle,
  Clock,
  MessageSquareText,
  Sparkles,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DevCompleteResult, AcceptanceIssue } from "@/components/DevCompleteCard";
import type { ReviewInfo, FindingSeverity } from "@/data/reviewTypes";
import { isReviewApproved } from "@/data/reviewTypes";

interface DevCompleteDetailPanelProps {
  result: DevCompleteResult;
  onDeploy: (id: string) => void;
  onReject: (id: string, decisions?: Record<string, string>) => void;
  onRequestReview: (id: string) => void;
  onClose: () => void;
  deployed?: boolean;
  reviewing?: boolean;
  reviewInfo?: ReviewInfo;
  onUpdateReview?: (id: string, review: ReviewInfo) => void;
  readOnly?: boolean;
}

/* ── Section wrapper — narrative style ── */
const ReportSection = ({
  title,
  icon,
  children,
  defaultOpen = true,
  inlineSummary,
  status = "ok",
}: {
  number?: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  inlineSummary?: React.ReactNode;
  status?: "ok" | "warning" | "error" | "pending";
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const statusIcon = status === "ok" ? (
    <CheckCircle2 size={14} className="text-emerald-500" />
  ) : status === "warning" ? (
    <AlertTriangle size={14} className="text-amber-500" />
  ) : status === "error" ? (
    <XCircle size={14} className="text-destructive" />
  ) : null;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 py-3 hover:opacity-80 transition-opacity text-left group"
      >
        <span className="text-muted-foreground shrink-0">{icon}</span>
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="flex-1" />
        {!open && inlineSummary && (
          <span className="text-xs text-muted-foreground">{inlineSummary}</span>
        )}
        {statusIcon && <span className="shrink-0">{statusIcon}</span>}
        <ChevronDown size={14} className={cn(
          "text-muted-foreground transition-transform duration-200 shrink-0",
          open && "rotate-180"
        )} />
      </button>
      {open && <div className="pb-5 pl-8">{children}</div>}
      <div className="h-px bg-border" />
    </div>
  );
};

/* ── Severity styling ── */
const severityConfig: Record<FindingSeverity, { bg: string; text: string; label: string }> = {
  critical: { bg: "bg-destructive/10", text: "text-destructive", label: "严重" },
  warning: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", label: "警告" },
  suggestion: { bg: "bg-primary/10", text: "text-primary", label: "建议" },
  praise: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "优秀" },
};

/* ── Build acceptance issues from findings + failed tests ── */
export const buildAcceptanceIssues = (
  allFindings: Array<{ id: string; severity: string; title: string; description: string; filePath?: string; lineRange?: string; reviewer: string }>,
  failedTests: Array<{ name: string; duration: number }>
): AcceptanceIssue[] => {
  const issues: AcceptanceIssue[] = [];

  // From critical/warning findings
  allFindings
    .filter((f) => f.severity === "critical" || f.severity === "warning")
    .forEach((f) => {
      const isCritical = f.severity === "critical";
      issues.push({
        id: f.id,
        severity: isCritical ? "critical" : "warning",
        title: f.title,
        description: f.description,
        filePath: f.filePath,
        lineRange: f.lineRange,
        aiSuggestion: isCritical
          ? `AI 建议立即修复此问题以确保代码质量`
          : `AI 建议关注此项，可选择修复或后续迭代处理`,
        options: [
          { label: "同意 AI 自动修复", value: "ai_fix", recommended: true },
          { label: "暂不处理，后续迭代", value: "skip" },
          { label: "我来手动处理", value: "manual" },
        ],
      });
    });

  // From failed tests
  failedTests.forEach((t, i) => {
    issues.push({
      id: `test-fail-${i}`,
      severity: "test_fail",
      title: `测试未通过：${t.name}`,
      description: `该测试用例执行失败（耗时 ${t.duration}ms），可能影响功能正确性`,
      aiSuggestion: "AI 建议修复代码使测试通过",
      options: [
        { label: "让 AI 修复代码", value: "ai_fix", recommended: true },
        { label: "跳过此测试（标记为已知）", value: "skip" },
        { label: "我来手动修复", value: "manual" },
      ],
    });
  });

  return issues;
};

/* ── AcceptanceQA Component — Carousel Mode ── */
export const AcceptanceQA = ({
  issues,
  onConfirm,
  onDeployAnyway,
}: {
  issues: AcceptanceIssue[];
  onConfirm: (decisions: Record<string, string>) => void;
  onDeployAnyway?: () => void;
}) => {
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const total = issues.length;
  const current = issues[currentIdx];
  const isLast = currentIdx === total - 1;
  const allAnswered = Object.keys(decisions).length === total;
  const aiFixCount = Object.values(decisions).filter((v) => v === "ai_fix").length;
  const skipCount = Object.values(decisions).filter((v) => v === "skip").length;

  const sevCfg: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    critical: { bg: "bg-destructive/10", text: "text-destructive", label: "严重", icon: <XCircle size={12} /> },
    warning: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", label: "警告", icon: <AlertTriangle size={12} /> },
    test_fail: { bg: "bg-destructive/10", text: "text-destructive", label: "测试失败", icon: <TestTube2 size={12} /> },
  };

  const getButtonText = () => {
    if (!allAnswered) return `确认并提交`;
    if (aiFixCount > 0 && skipCount > 0) return `让 AI 修复 ${aiFixCount} 项，跳过 ${skipCount} 项`;
    if (aiFixCount > 0) return `确认并让 AI 修复 ${aiFixCount} 项`;
    if (skipCount === total) return "跳过所有问题并发布";
    return "确认处理方案";
  };

  return (
    <div className="w-full">
      {/* Progress dots + counter */}
      <div className="flex items-center gap-1.5 px-1 pb-2">
        {issues.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIdx(i)}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              i === currentIdx
                ? "bg-primary w-6"
                : decisions[issues[i].id]
                ? "bg-primary/40 w-3"
                : "bg-border w-3"
            )}
          />
        ))}
        <span className="ml-auto text-[10px] text-muted-foreground">
          {currentIdx + 1} / {total}
        </span>
      </div>

      {/* Sliding cards */}
      <div className="overflow-hidden rounded-lg border border-border">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIdx * 100}%)` }}
        >
          {issues.map((issue) => {
            const cfg = sevCfg[issue.severity];
            const selected = decisions[issue.id];
            return (
              <div key={issue.id} className="w-full shrink-0">
                {/* Issue header */}
                <div className="px-3 py-2.5 flex items-start gap-2">
                  <div className={cn("mt-0.5 shrink-0", cfg.text)}>{cfg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 border-0", cfg.bg, cfg.text)}>
                        {cfg.label}
                      </Badge>
                      {issue.filePath && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {issue.filePath}{issue.lineRange ? `:${issue.lineRange}` : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-foreground mt-1">{issue.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{issue.description}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Sparkles size={10} className="text-primary shrink-0" />
                      <span className="text-[11px] text-primary">{issue.aiSuggestion}</span>
                    </div>
                  </div>
                  {selected && <CheckCircle2 size={14} className="text-primary shrink-0 mt-1" />}
                </div>

                {/* Options */}
                <div className="px-3 pb-2.5 flex flex-wrap gap-1.5">
                  {issue.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDecisions((prev) => ({ ...prev, [issue.id]: opt.value }))}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all",
                        selected === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-foreground hover:border-muted-foreground/40 hover:bg-muted/50",
                        opt.recommended && !selected && "ring-1 ring-primary/20"
                      )}
                    >
                      <div className={cn(
                        "w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0",
                        selected === opt.value ? "border-primary" : "border-muted-foreground/40"
                      )}>
                        {selected === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </div>
                      {opt.label}
                      {opt.recommended && !selected && (
                        <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-primary/30 text-primary ml-0.5">推荐</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentIdx((i) => i - 1)}
          disabled={currentIdx === 0}
          className="gap-1 text-xs h-8"
        >
          <ChevronDown size={14} className="rotate-90" />
          上一个
        </Button>

        {isLast ? (
          <div className="flex items-center gap-2">
            {onDeployAnyway && allAnswered && skipCount === total && (
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={onDeployAnyway}>
                直接发布
              </Button>
            )}
            <Button
              size="sm"
              disabled={!allAnswered}
              onClick={() => onConfirm(decisions)}
              className="gap-1.5 text-xs h-8"
            >
              <Rocket size={14} />
              {getButtonText()}
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (decisions[current.id]) setCurrentIdx((i) => i + 1);
            }}
            disabled={!decisions[current.id]}
            className="gap-1 text-xs h-8"
          >
            下一个
            <ChevronDown size={14} className="-rotate-90" />
          </Button>
        )}
      </div>
    </div>
  );
};




/* ── Main Component ── */
const DevCompleteDetailPanel = ({
  result,
  onDeploy,
  onReject,
  onClose,
  deployed,
  reviewing,
  reviewInfo,
  onUpdateReview,
  readOnly,
}: DevCompleteDetailPanelProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  const totalAdds = result.files.reduce((s, f) => s + f.additions, 0);
  const totalDels = result.files.reduce((s, f) => s + f.deletions, 0);
  const passedTests = result.tests.filter((t) => t.passed).length;
  const allTestsPassed = passedTests === result.tests.length;
  const approved = reviewInfo ? isReviewApproved(reviewInfo) : false;
  const aiReviewDone = reviewInfo?.aiReviewStatus === "done";
  const aiReviewRunning = reviewInfo?.aiReviewStatus === "running";
  const hasCritical = (reviewInfo?.aiReviewers || []).some(
    (r) => r.findings?.some((f) => f.severity === "critical")
  );
  const hasWarning = (reviewInfo?.aiReviewers || []).some(
    (r) => r.findings?.some((f) => f.severity === "warning")
  );

  const allFindings = (reviewInfo?.aiReviewers || []).flatMap(
    (r) => (r.findings || []).map((f) => ({ ...f, reviewer: r.displayName }))
  );
  const failedTests = result.tests.filter((t) => !t.passed);
  const acceptanceIssues = aiReviewDone ? buildAcceptanceIssues(allFindings, failedTests) : [];
  const hasIssues = acceptanceIssues.length > 0;

  // AI verdict
  const getVerdict = () => {
    if (!aiReviewDone) return { emoji: "⏳", text: "AI 正在审查代码，请稍候…", type: "pending" as const };
    if (hasCritical) return { emoji: "🚨", text: `发现 ${allFindings.filter(f => f.severity === "critical").length} 个严重问题，建议修复后再发布`, type: "error" as const };
    if (!allTestsPassed) return { emoji: "⚠️", text: `${result.tests.length - passedTests} 个测试未通过，建议检查后再发布`, type: "warning" as const };
    if (hasWarning) return { emoji: "✅", text: `审查通过（评分 ${reviewInfo?.overallScore}），有 ${allFindings.filter(f => f.severity === "warning").length} 项警告建议关注`, type: "ok" as const };
    return { emoji: "✅", text: `审查通过，综合评分 ${reviewInfo?.overallScore} 分，可以放心发布`, type: "ok" as const };
  };
  const verdict = getVerdict();

  const statusBadge = deployed ? (
    <Badge className="text-[10px] bg-emerald-500/15 text-emerald-500 border-0">已发布</Badge>
  ) : approved ? (
    <Badge className="text-[10px] bg-emerald-500/15 text-emerald-500 border-0">审查通过</Badge>
  ) : aiReviewRunning ? (
    <Badge className="text-[10px] bg-primary/15 text-primary border-0">AI 审查中</Badge>
  ) : aiReviewDone && hasCritical ? (
    <Badge className="text-[10px] bg-destructive/15 text-destructive border-0">有严重问题</Badge>
  ) : aiReviewDone ? (
    <Badge className="text-[10px] bg-emerald-500/15 text-emerald-500 border-0">
      {reviewInfo?.overallScore} 分
    </Badge>
  ) : null;

  // Timeline steps
  const timelineSteps: TimelineStep[] = [
    { icon: <GitBranch size={13} />, label: "拉取分支 & 分析需求", detail: "自动创建开发分支，解析需求文档", status: "done" },
    { icon: <Code2 size={13} />, label: "编写代码", detail: `${result.files.length} 个文件变更，+${totalAdds} -${totalDels} 行`, status: "done" },
    { icon: <TestTube2 size={13} />, label: "运行测试", detail: allTestsPassed ? `全部 ${result.tests.length} 项测试通过` : `${passedTests}/${result.tests.length} 项通过`, status: allTestsPassed ? "done" : "error" },
    { icon: <Shield size={13} />, label: "AI Code Review", detail: aiReviewDone ? `综合评分 ${reviewInfo?.overallScore ?? "-"} 分` : aiReviewRunning ? "审查进行中…" : "等待审查", status: aiReviewDone ? (hasCritical ? "error" : hasWarning ? "warning" : "done") : "running" },
    { icon: <Eye size={13} />, label: "等待验收", detail: deployed ? "已发布" : "请查看报告并决定", status: deployed ? "done" : "running" },
  ];

  const testPassRate = result.tests.length > 0 ? Math.round((passedTests / result.tests.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border shrink-0">
          <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{result.requirementTitle}</p>
          </div>
          <TabsList className="h-8">
            <TabsTrigger value="overview" className="text-xs gap-1 h-7 px-2.5">
              <LayoutDashboard size={12} /> 验收报告
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs gap-1 h-7 px-2.5">
              <Eye size={12} /> 预览
            </TabsTrigger>
            <TabsTrigger value="review" className="text-xs gap-1 h-7 px-2.5">
              <Shield size={12} /> AI 审查
            </TabsTrigger>
          </TabsList>
          {statusBadge}
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
            <X size={14} />
          </button>
        </div>

        {/* ═══════════ OVERVIEW — Canvas-style AI Acceptance Report ═══════════ */}
        <TabsContent value="overview" className="flex-1 min-h-0 m-0 overflow-y-auto scrollbar-hide">
          <div className="px-5 py-5 space-y-6">

            {/* ── AI Verdict Banner (compact) ── */}
            <div className={cn(
              "rounded-xl px-4 py-3.5 flex items-center gap-3",
              verdict.type === "error" && "bg-destructive/8 border border-destructive/15",
              verdict.type === "warning" && "bg-amber-500/8 border border-amber-500/15",
              verdict.type === "ok" && "bg-emerald-500/8 border border-emerald-500/15",
              verdict.type === "pending" && "bg-muted/50 border border-border",
            )}>
              <span className="text-2xl shrink-0">{verdict.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">AI 验收结论</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{verdict.text}</p>
              </div>
              {!deployed && !readOnly && aiReviewDone && !hasIssues && (
                <Button size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={() => onDeploy(result.id)}>
                  <Rocket size={12} /> 发布
                </Button>
              )}
              {!deployed && !readOnly && aiReviewDone && hasIssues && (
                <Badge variant="outline" className="text-[10px] h-5 px-2 border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0 gap-1">
                  <AlertTriangle size={10} />
                  {acceptanceIssues.length} 个待决策
                </Badge>
              )}
            </div>

            {/* ── Metric Cards — 2x2 Grid ── */}
            <div className="grid grid-cols-2 gap-3">
              {/* Score */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col items-center justify-center gap-1.5">
                <div className="relative w-14 h-14">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="2.5" className="stroke-border" />
                    <circle
                      cx="18" cy="18" r="15.5" fill="none" strokeWidth="2.5"
                      strokeDasharray={`${((reviewInfo?.overallScore ?? 0) / 100) * 97.4} 97.4`}
                      strokeLinecap="round"
                      className={cn(
                        "transition-all duration-700",
                        (reviewInfo?.overallScore ?? 0) >= 80 ? "stroke-emerald-500" : (reviewInfo?.overallScore ?? 0) >= 60 ? "stroke-amber-500" : "stroke-destructive"
                      )}
                    />
                  </svg>
                  <span className={cn(
                    "absolute inset-0 flex items-center justify-center text-base font-bold",
                    (reviewInfo?.overallScore ?? 0) >= 80 ? "text-emerald-500" : (reviewInfo?.overallScore ?? 0) >= 60 ? "text-amber-500" : "text-destructive"
                  )}>
                    {aiReviewDone ? reviewInfo?.overallScore : "–"}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">综合评分</span>
              </div>

              {/* Test pass rate */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col items-center justify-center gap-1.5">
                <span className={cn(
                  "text-2xl font-bold leading-none",
                  allTestsPassed ? "text-emerald-500" : "text-destructive"
                )}>
                  {passedTests}/{result.tests.length}
                </span>
                <Progress
                  value={testPassRate}
                  className={cn("h-1.5 w-full max-w-[80px]", allTestsPassed ? "[&>div]:bg-emerald-500" : "[&>div]:bg-destructive")}
                />
                <span className="text-[11px] text-muted-foreground font-medium">测试通过</span>
              </div>

              {/* Code changes */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col items-center justify-center gap-1.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-emerald-500 leading-none">+{totalAdds}</span>
                  <span className="text-lg font-bold text-destructive leading-none">-{totalDels}</span>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">{result.files.length} 个文件变更</span>
              </div>

              {/* Duration */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col items-center justify-center gap-1.5">
                <span className="text-2xl font-bold text-foreground leading-none">{result.elapsed}s</span>
                <span className="text-[11px] text-muted-foreground font-medium">执行耗时</span>
              </div>
            </div>

            {/* ── Horizontal Timeline ── */}
            <div className="rounded-xl border border-border bg-muted/10 px-4 py-4">
              <div className="flex items-center">
                {timelineSteps.map((step, i) => (
                  <div key={i} className="flex items-center flex-1 min-w-0 last:flex-none group">
                    <div className="flex flex-col items-center gap-1.5 relative">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors",
                        step.status === "done" && "border-emerald-500 bg-emerald-500/10",
                        step.status === "running" && "border-primary bg-primary/10",
                        step.status === "warning" && "border-amber-500 bg-amber-500/10",
                        step.status === "error" && "border-destructive bg-destructive/10",
                      )}>
                        <div className={cn("w-2 h-2 rounded-full", statusDot[step.status])} />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">{step.label.split(" & ")[0].split("·")[0].trim()}</span>
                      {/* Hover tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                          <p className="text-xs font-medium text-foreground">{step.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{step.detail}</p>
                        </div>
                      </div>
                    </div>
                    {i < timelineSteps.length - 1 && (
                      <div className={cn(
                        "flex-1 h-px mx-1.5",
                        step.status === "done" ? "bg-emerald-500/40" : "bg-border"
                      )} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Detail Sections (collapsible cards) ── */}
            <div className="space-y-3">
              {/* Task Background */}
              <ReportSection
                title="任务背景"
                icon={<MessageSquareText size={15} />}
                defaultOpen={false}
                inlineSummary={<span className="truncate max-w-[200px] inline-block">{result.requirementTitle}</span>}
                status="ok"
              >
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">原始需求</div>
                    <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-md px-3 py-2.5">
                      {result.sourceContext?.userPrompt || result.requirementTitle}
                    </p>
                  </div>
                  {result.sourceContext?.aiSummary && (
                    <div>
                      <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Sparkles size={11} /> AI 理解摘要
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{result.sourceContext.aiSummary}</p>
                    </div>
                  )}
                </div>
              </ReportSection>

              {/* Code Changes */}
              <ReportSection
                title="代码变更"
                icon={<Code2 size={15} />}
                defaultOpen={false}
                inlineSummary={<span>{result.files.length} 个文件 · <span className="text-emerald-500">+{totalAdds}</span> <span className="text-destructive">-{totalDels}</span></span>}
                status="ok"
              >
                <div className="space-y-3">
                  {result.aiChangeSummary && (
                    <p className="text-sm text-foreground leading-relaxed">{result.aiChangeSummary}</p>
                  )}
                  <div className="rounded-md border border-border overflow-hidden">
                    {result.files.map((f) => (
                      <div key={f.path} className="flex items-center gap-2 px-3 py-2 text-xs border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <FileCode2 size={12} className="text-muted-foreground shrink-0" />
                        <span className="font-mono text-foreground flex-1 min-w-0 truncate">{f.path}</span>
                        <span className="text-emerald-500 text-[10px] font-mono">+{f.additions}</span>
                        <span className="text-destructive text-[10px] font-mono">-{f.deletions}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ReportSection>

              {/* AI Code Review Findings */}
              <ReportSection
                title="AI Code Review"
                icon={<Shield size={15} />}
                defaultOpen={hasCritical || hasWarning || !aiReviewDone}
                inlineSummary={
                  aiReviewDone
                    ? <span>{reviewInfo?.overallScore} 分 · {hasCritical ? `${allFindings.filter(f => f.severity === "critical").length} 个严重问题` : hasWarning ? `${allFindings.filter(f => f.severity === "warning").length} 项警告` : "无问题"}</span>
                    : <span className="text-primary">审查中…</span>
                }
                status={!aiReviewDone ? "pending" : hasCritical ? "error" : hasWarning ? "warning" : "ok"}
              >
                {!aiReviewDone ? (
                  <div className="flex items-center gap-2 py-2">
                    <Shield size={14} className="text-primary animate-pulse" />
                    <span className="text-sm text-muted-foreground">AI 正在审查代码…</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Reviewer scores */}
                    <div className="flex gap-3">
                      {(reviewInfo?.aiReviewers || []).map((r) => (
                        <div key={r.id} className="flex-1 rounded-lg border border-border bg-muted/15 p-3 text-center">
                          <span className="text-base">{r.icon}</span>
                          <div className={cn(
                            "text-lg font-bold mt-1",
                            (r.score ?? 0) >= 80 ? "text-emerald-500" : (r.score ?? 0) >= 60 ? "text-amber-500" : "text-destructive"
                          )}>
                            {r.score}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{r.displayName}</div>
                        </div>
                      ))}
                    </div>
                    {/* Findings as cards */}
                    {allFindings.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">发现项 ({allFindings.length})</div>
                        {allFindings
                          .sort((a, b) => {
                            const order: FindingSeverity[] = ["critical", "warning", "suggestion", "praise"];
                            return order.indexOf(a.severity) - order.indexOf(b.severity);
                          })
                          .map((f) => {
                            const cfg = severityConfig[f.severity];
                            return (
                              <div key={f.id} className="flex items-stretch rounded-lg border border-border overflow-hidden">
                                <div className={cn(
                                  "w-1 shrink-0",
                                  f.severity === "critical" ? "bg-destructive" : f.severity === "warning" ? "bg-amber-500" : f.severity === "praise" ? "bg-emerald-500" : "bg-primary"
                                )} />
                                <div className="flex-1 px-3 py-2.5 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 border-0", cfg.bg, cfg.text)}>{cfg.label}</Badge>
                                    <span className="text-xs font-medium text-foreground">{f.title}</span>
                                    {f.filePath && (
                                      <span className="text-[10px] opacity-50 font-mono">{f.filePath}{f.lineRange ? `:${f.lineRange}` : ""}</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{f.description}</p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </ReportSection>

              {/* Test Report */}
              <ReportSection
                title="测试报告"
                icon={<TestTube2 size={15} />}
                defaultOpen={!allTestsPassed}
                inlineSummary={<span>{passedTests}/{result.tests.length} 通过</span>}
                status={allTestsPassed ? "ok" : "error"}
              >
                <Tabs defaultValue="code-test" className="w-full">
                  <TabsList className="h-7 mb-3">
                    <TabsTrigger value="code-test" className="text-[11px] h-6 px-2.5 gap-1">
                      <TestTube2 size={11} /> 代码测试
                    </TabsTrigger>
                    <TabsTrigger value="ui-test" className="text-[11px] h-6 px-2.5 gap-1">
                      <Eye size={11} /> UI 测试
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="code-test" className="mt-0">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Progress
                            value={testPassRate}
                            className={cn("h-2", allTestsPassed ? "[&>div]:bg-emerald-500" : "[&>div]:bg-destructive")}
                          />
                        </div>
                        <span className={cn(
                          "text-sm font-bold shrink-0",
                          allTestsPassed ? "text-emerald-500" : "text-destructive"
                        )}>
                          {testPassRate}% ({passedTests}/{result.tests.length})
                        </span>
                      </div>
                      <div className="rounded-md border border-border overflow-hidden">
                        {result.tests.map((t, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 text-xs border-b border-border last:border-0">
                            {t.passed ? (
                              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                            ) : (
                              <XCircle size={13} className="text-destructive shrink-0" />
                            )}
                            <span className={cn("flex-1 text-foreground", !t.passed && "text-destructive font-medium")}>{t.name}</span>
                            <span className="text-[10px] text-muted-foreground">{t.duration}ms</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        总耗时 {result.tests.reduce((s, t) => s + t.duration, 0)}ms
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="ui-test" className="mt-0">
                    <UITestReplay />
                  </TabsContent>
                </Tabs>
              </ReportSection>

              {/* Product Preview */}
              <ReportSection
                title="产品预览"
                icon={<Eye size={15} />}
                defaultOpen={false}
                inlineSummary="点击查看"
              >
                <div className="space-y-3">
                  <RequirementPreview
                    previewPath={result.previewPath}
                    requirementTitle={result.requirementTitle}
                    projectId={result.projectId}
                  />
                  <button
                    onClick={() => setActiveTab("preview")}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink size={11} />
                    <span>打开全屏预览</span>
                  </button>
                </div>
              </ReportSection>
            </div>

            {/* ── Bottom: Deploy or status hint ── */}
            {!deployed && !readOnly && (
              <div id="acceptance-qa-section" className="pt-2 pb-2">
                {aiReviewDone ? (
                  hasIssues ? (
                    <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-amber-500/5 border border-amber-500/15">
                      <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                      <span className="text-xs text-muted-foreground">请在输入框上方完成问题决策后继续</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full gap-1.5 h-10 text-sm"
                      onClick={() => onDeploy(result.id)}
                    >
                      <Rocket size={14} />
                      确认发布到测试环境
                    </Button>
                  )
                ) : (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Shield size={14} className="text-primary animate-pulse" />
                    <span className="text-xs text-muted-foreground">AI 正在审查，完成后即可操作</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══════════ PREVIEW ═══════════ */}
        <TabsContent value="preview" className="flex-1 min-h-0 m-0">
          <RequirementPreview
            previewPath={result.previewPath}
            requirementTitle={result.requirementTitle}
            projectId={result.projectId}
            fullscreen
          />
        </TabsContent>

        {/* ═══════════ AI REVIEW (detailed) ═══════════ */}
        <TabsContent value="review" className="flex-1 min-h-0 m-0">
          {reviewInfo && onUpdateReview ? (
            <CodeReviewTab
              review={reviewInfo}
              onUpdateReview={(updated) => onUpdateReview(result.id, updated)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              AI 审查即将开始…
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DevCompleteDetailPanel;
