import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertCircle,
  Lightbulb,
  ThumbsUp,
  Clock,
  MessageSquareText,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  GitBranch,
  Search,
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
    <CheckCircle2 size={14} className="text-foreground/40" />
  ) : status === "warning" ? (
    <AlertTriangle size={14} className="text-foreground/50" />
  ) : status === "error" ? (
    <XCircle size={14} className="text-foreground/60" />
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

/* ── Severity styling — grayscale (matching CodeReviewTab) ── */
const severityConfig: Record<FindingSeverity, { bg: string; text: string; label: string; barClass: string; icon: React.ReactNode }> = {
  critical: { bg: "bg-foreground/10", text: "text-foreground", label: "严重", barClass: "bg-foreground", icon: <AlertCircle size={11} /> },
  warning: { bg: "bg-foreground/5", text: "text-foreground/70", label: "警告", barClass: "bg-foreground/50", icon: <AlertTriangle size={11} /> },
  suggestion: { bg: "bg-muted", text: "text-muted-foreground", label: "建议", barClass: "bg-muted-foreground/60", icon: <Lightbulb size={11} /> },
  praise: { bg: "bg-muted", text: "text-foreground/60", label: "优点", barClass: "bg-foreground/20", icon: <ThumbsUp size={11} /> },
};

/* ── Build acceptance issues from findings + failed tests ── */
export const buildAcceptanceIssues = (
  allFindings: Array<{ id: string; severity: string; title: string; description: string; filePath?: string; lineRange?: string; reviewer: string }>,
  failedTests: Array<{ name: string; duration: number }>
): AcceptanceIssue[] => {
  const issues: AcceptanceIssue[] = [];

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
          { label: "其他", value: "other", allowCustom: true },
        ],
      });
    });

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
        { label: "其他", value: "other", allowCustom: true },
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
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const total = issues.length;
  const current = issues[currentIdx];
  const isLast = currentIdx === total - 1;
  const allAnswered = issues.every((issue) => {
    const d = decisions[issue.id];
    if (!d) return false;
    if (d === "other" && !customTexts[issue.id]?.trim()) return false;
    return true;
  });
  const aiFixCount = Object.values(decisions).filter((v) => v === "ai_fix").length;
  const skipCount = Object.values(decisions).filter((v) => v === "skip").length;

  const sevCfg: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    critical: { bg: "bg-foreground/10", text: "text-foreground", label: "严重", icon: <XCircle size={12} /> },
    warning: { bg: "bg-foreground/5", text: "text-foreground/70", label: "警告", icon: <AlertTriangle size={12} /> },
    test_fail: { bg: "bg-foreground/10", text: "text-foreground", label: "测试失败", icon: <TestTube2 size={12} /> },
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
                ? "bg-foreground w-6"
                : decisions[issues[i].id]
                ? "bg-foreground/40 w-3"
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
                      <Sparkles size={10} className="text-foreground/50 shrink-0" />
                      <span className="text-[11px] text-foreground/60">{issue.aiSuggestion}</span>
                    </div>
                  </div>
                  {selected && <CheckCircle2 size={14} className="text-foreground/50 shrink-0 mt-1" />}
                </div>

                <div className="px-3 pb-2.5 flex flex-wrap gap-1.5">
                  {issue.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDecisions((prev) => ({ ...prev, [issue.id]: opt.value }))}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all",
                        selected === opt.value
                          ? "border-foreground bg-foreground/10 text-foreground"
                          : "border-border bg-background text-foreground hover:border-muted-foreground/40 hover:bg-muted/50",
                        opt.recommended && !selected && "ring-1 ring-foreground/20"
                      )}
                    >
                      <div className={cn(
                        "w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0",
                        selected === opt.value ? "border-foreground" : "border-muted-foreground/40"
                      )}>
                        {selected === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-foreground" />}
                      </div>
                      {opt.label}
                      {opt.recommended && !selected && (
                        <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-foreground/30 text-foreground/60 ml-0.5">推荐</Badge>
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom text input when "其他" is selected */}
                {selected === "other" && (
                  <div className="px-3 pb-2.5">
                    <textarea
                      value={customTexts[issue.id] || ""}
                      onChange={(e) => setCustomTexts((prev) => ({ ...prev, [issue.id]: e.target.value }))}
                      placeholder="请描述你的处理方案…"
                      maxLength={500}
                      className="w-full text-[11px] text-foreground bg-muted/30 border border-border rounded-lg px-3 py-2 resize-none h-16 placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 transition-colors"
                    />
                  </div>
                )}
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
              onClick={() => {
                const merged = { ...decisions };
                Object.entries(customTexts).forEach(([id, text]) => {
                  if (merged[id] === "other" && text.trim()) {
                    merged[id] = `other:${text.trim()}`;
                  }
                });
                onConfirm(merged);
              }}
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


/* ── Test Report Section — Dashboard + Grouped + Failure Details ── */
const TestReportSection = ({
  result,
  passedTests,
  allTestsPassed,
  testPassRate,
}: {
  result: DevCompleteResult;
  passedTests: number;
  allTestsPassed: boolean;
  testPassRate: number;
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedFailures, setExpandedFailures] = useState<Record<number, boolean>>({});
  const totalDuration = result.tests.reduce((s, t) => s + t.duration, 0);
  const failedCount = result.tests.length - passedTests;
  const coverage = result.coveragePercent ?? null;

  const groups = result.tests.reduce((acc, t) => {
    const path = t.filePath || "其他";
    if (!acc[path]) acc[path] = [];
    acc[path].push(t);
    return acc;
  }, {} as Record<string, typeof result.tests>);
  const groupEntries = Object.entries(groups);

  const toggleGroup = (path: string) =>
    setExpandedGroups((prev) => ({ ...prev, [path]: !prev[path] }));

  return (
    <ReportSection
      title="6. 运行测试"
      icon={<TestTube2 size={15} />}
      defaultOpen={true}
      inlineSummary={<span>{passedTests}/{result.tests.length} 通过{coverage !== null ? ` · 覆盖率 ${coverage}%` : ""}</span>}
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
            {/* ── Summary Dashboard ── */}
            <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 flex items-center gap-0 text-xs">
              {/* Pass rate ring */}
              <div className="flex items-center gap-2 pr-4">
                <div className="relative w-[30px] h-[30px] shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-border" />
                    <circle
                      cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
                      strokeDasharray={`${(testPassRate / 100) * 97.4} 97.4`}
                      strokeLinecap="round"
                      className="stroke-foreground transition-all duration-500"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground">
                    {testPassRate}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-[13px] leading-none text-foreground">
                    {passedTests}/{result.tests.length}
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    {allTestsPassed ? "全部通过" : `${failedCount} 个失败`}
                  </span>
                </div>
              </div>

              <div className="w-px h-6 bg-border shrink-0" />

              <div className="flex items-center gap-1.5 px-4">
                <Clock size={12} className="text-muted-foreground" />
                <span className="font-semibold text-foreground">{(totalDuration / 1000).toFixed(1)}s</span>
                <span className="text-muted-foreground">耗时</span>
              </div>

              {coverage !== null && (
                <>
                  <div className="w-px h-6 bg-border shrink-0" />
                  <div className="flex items-center gap-1.5 px-4">
                    <Shield size={12} className="text-muted-foreground" />
                    <span className="font-semibold text-foreground">
                      {coverage}%
                    </span>
                    <span className="text-muted-foreground">覆盖率</span>
                  </div>
                </>
              )}
            </div>

            {/* ── Grouped Test List ── */}
            <div className="rounded-md border border-border overflow-hidden">
              {groupEntries.map(([filePath, tests], gi) => {
                const groupPassed = tests.filter((t) => t.passed).length;
                const groupAllPassed = groupPassed === tests.length;
                const isOpen = expandedGroups[filePath] !== false;
                const fileName = filePath.split("/").pop() || filePath;

                return (
                  <div key={filePath}>
                    {gi > 0 && <div className="h-px bg-border" />}
                    <button
                      onClick={() => toggleGroup(filePath)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/30 transition-colors"
                    >
                      <ChevronDown size={12} className={cn("text-muted-foreground transition-transform shrink-0", !isOpen && "-rotate-90")} />
                      <FileCode2 size={12} className="text-muted-foreground shrink-0" />
                      <span className="font-mono text-foreground truncate flex-1 text-left" title={filePath}>{fileName}</span>
                      <span className={cn("text-[10px] font-medium shrink-0", groupAllPassed ? "text-foreground/50" : "text-foreground font-semibold")}>
                        {groupPassed}/{tests.length}
                      </span>
                    </button>
                    {isOpen && tests.map((t, ti) => {
                      const globalIdx = result.tests.indexOf(t);
                      const isFailExpanded = expandedFailures[globalIdx];
                      return (
                        <div key={ti}>
                          <div
                            className={cn(
                              "flex items-center gap-2 px-3 pl-8 py-1.5 text-xs border-t border-border/50",
                              !t.passed && "cursor-pointer hover:bg-muted/30"
                            )}
                            onClick={() => {
                              if (!t.passed) setExpandedFailures((prev) => ({ ...prev, [globalIdx]: !prev[globalIdx] }));
                            }}
                          >
                            {t.passed ? (
                              <CheckCircle2 size={12} className="text-foreground/30 shrink-0" />
                            ) : (
                              <XCircle size={12} className="text-foreground/60 shrink-0" />
                            )}
                            <span className={cn("flex-1 text-foreground", !t.passed && "font-medium")}>{t.name}</span>
                            <span className="text-[10px] text-muted-foreground">{t.duration}ms</span>
                            {!t.passed && (
                              <ChevronDown size={10} className={cn("text-muted-foreground transition-transform", isFailExpanded && "rotate-180")} />
                            )}
                          </div>
                          {!t.passed && isFailExpanded && (
                            <div className="pl-8 pr-3 pb-2 space-y-1.5">
                              {t.errorMessage && (
                                <div className="rounded bg-muted/50 border border-border px-2.5 py-2 font-mono text-[10px] text-foreground/70 leading-relaxed whitespace-pre-wrap">
                                  {t.errorMessage}
                                </div>
                              )}
                              {t.aiSuggestion && (
                                <div className="flex items-start gap-1.5 text-[11px]">
                                  <Sparkles size={11} className="text-muted-foreground shrink-0 mt-0.5" />
                                  <span className="text-muted-foreground leading-relaxed">{t.aiSuggestion}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ui-test" className="mt-0">
          <div className="flex items-center gap-3 mb-3 px-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Eye size={12} />
              <span className="font-medium text-foreground">8 步骤</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-foreground/40" />
              <span>全部通过</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <Clock size={12} />
              <span>3.2s</span>
            </div>
          </div>
          <UITestReplay />
        </TabsContent>
      </Tabs>
    </ReportSection>
  );
};

/* ── Collapsible Reviewer Card (matching CodeReviewTab style) ── */
import type { AIModelReviewer } from "@/data/reviewTypes";

const ReviewerCard = ({ reviewer, defaultOpen, criticalCount, warningCount }: {
  reviewer: AIModelReviewer;
  defaultOpen: boolean;
  criticalCount: number;
  warningCount: number;
}) => {
  const [expanded, setExpanded] = useState(defaultOpen);
  const findings = reviewer.findings || [];

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden",
      criticalCount > 0 ? "border-foreground/15" : "border-border"
    )}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-muted/30 transition-colors text-left"
      >
        <span className="text-base shrink-0">{reviewer.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-foreground">{reviewer.displayName}</span>
            {criticalCount > 0 && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-foreground/10 text-foreground font-medium">{criticalCount} 严重</span>
            )}
            {warningCount > 0 && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-foreground/5 text-foreground/60 font-medium">{warningCount} 警告</span>
            )}
          </div>
          {reviewer.summary && (
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{reviewer.summary}</p>
          )}
        </div>
        <span className="text-sm font-bold text-foreground tabular-nums">{reviewer.score}</span>
        <ChevronRight size={12} className={cn(
          "text-muted-foreground/40 transition-transform duration-200 shrink-0",
          expanded && "rotate-90"
        )} />
      </button>

      {expanded && findings.length > 0 && (
        <div className="border-t border-border/50 px-3.5 py-1.5 space-y-0">
          {findings
            .sort((a, b) => {
              const order: FindingSeverity[] = ["critical", "warning", "suggestion", "praise"];
              return order.indexOf(a.severity) - order.indexOf(b.severity);
            })
            .map(f => {
              const cfg = severityConfig[f.severity];
              return (
                <div key={f.id} className="flex items-stretch gap-0">
                  <div className={cn("w-0.5 shrink-0 rounded-full my-0.5", cfg.barClass)} />
                  <div className="flex-1 min-w-0 pl-2.5 py-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn("shrink-0", cfg.text)}>{cfg.icon}</span>
                      <span className="text-[11px] font-medium text-foreground">{f.title}</span>
                      <Badge variant="outline" className={cn("text-[8px] h-3.5 px-1 border-border font-medium", cfg.text)}>{cfg.label}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{f.description}</p>
                    {f.filePath && (
                      <p className="text-[9px] text-muted-foreground/50 mt-0.5 font-mono flex items-center gap-1">
                        <FileCode2 size={8} />
                        {f.filePath}{f.lineRange ? ` ${f.lineRange}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {!expanded && findings.length > 0 && (
        <div className="border-t border-border/30 px-3.5 py-1">
          <p className="text-[9px] text-muted-foreground/60">{findings.length} 条发现</p>
        </div>
      )}
    </div>
  );
};



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
  const [activeTab, setActiveTab] = useState("preview");

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
    if (hasCritical) return { emoji: "⚠", text: `发现 ${allFindings.filter(f => f.severity === "critical").length} 个严重问题，建议修复后再发布`, type: "error" as const };
    if (!allTestsPassed) return { emoji: "⚠", text: `${result.tests.length - passedTests} 个测试未通过，建议检查后再发布`, type: "warning" as const };
    if (hasWarning) return { emoji: "✓", text: `审查通过（评分 ${reviewInfo?.overallScore}），有 ${allFindings.filter(f => f.severity === "warning").length} 项警告建议关注`, type: "ok" as const };
    return { emoji: "✓", text: `审查通过，综合评分 ${reviewInfo?.overallScore} 分，可以放心发布`, type: "ok" as const };
  };
  const verdict = getVerdict();

  const statusBadge = deployed ? (
    <Badge variant="outline" className="text-[10px] border-foreground/20 text-foreground/60">已发布</Badge>
  ) : approved ? (
    <Badge variant="outline" className="text-[10px] border-foreground/20 text-foreground/60">审查通过</Badge>
  ) : aiReviewRunning ? (
    <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">AI 审查中</Badge>
  ) : aiReviewDone && hasCritical ? (
    <Badge variant="outline" className="text-[10px] border-foreground/30 text-foreground/70">有严重问题</Badge>
  ) : aiReviewDone ? (
    <Badge variant="outline" className="text-[10px] border-foreground/20 text-foreground/60">
      {reviewInfo?.overallScore} 分
    </Badge>
  ) : null;


  const testPassRate = result.tests.length > 0 ? Math.round((passedTests / result.tests.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border shrink-0">
          <div className="w-7 h-7 rounded-full bg-foreground/5 flex items-center justify-center shrink-0">
            <CheckCircle2 size={14} className="text-foreground/40" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{result.requirementTitle}</p>
          </div>
          <TabsList className="h-8">
            <TabsTrigger value="preview" className="text-xs gap-1 h-7 px-2.5">
              <Eye size={12} /> 预览
            </TabsTrigger>
            <TabsTrigger value="overview" className="text-xs gap-1 h-7 px-2.5">
              <LayoutDashboard size={12} /> 验收报告
            </TabsTrigger>
            <TabsTrigger value="process" className="text-xs gap-1 h-7 px-2.5">
              <GitBranch size={12} /> 开发过程
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

        {/* ═══════════ DEV PROCESS — 7-step narrative ═══════════ */}
        <TabsContent value="process" className="flex-1 min-h-0 m-0 overflow-y-auto scrollbar-hide">
          <div className="px-5 py-5 space-y-1">

            {/* ── Step 1: 拉取分支 ── */}
            <ReportSection
              title="1. 拉取分支"
              icon={<GitBranch size={15} />}
              defaultOpen={true}
              inlineSummary="feature/login-form-validation"
              status="ok"
            >
              <div className="space-y-2 text-sm text-foreground">
                <p>从 <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">main</code> 分支创建开发分支 <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">feature/{result.id.slice(0, 8)}</code></p>
                <p className="text-xs text-muted-foreground">基于最新 commit 拉取，确保无合并冲突</p>
              </div>
            </ReportSection>

            {/* ── Step 2: 分析需求 ── */}
            <ReportSection
              title="2. 分析需求"
              icon={<Search size={15} />}
              defaultOpen={true}
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

            {/* ── Step 3: 制定方案 ── */}
            <ReportSection
              title="3. 制定方案"
              icon={<Lightbulb size={15} />}
              defaultOpen={true}
              inlineSummary={`${result.files.length} 个文件变更计划`}
              status="ok"
            >
              <div className="space-y-2 text-sm">
                {result.aiChangeSummary && (
                  <p className="text-foreground leading-relaxed">{result.aiChangeSummary}</p>
                )}
                <div className="text-xs text-muted-foreground">
                  计划修改 {result.files.length} 个文件，预估新增 +{totalAdds} 行，删除 -{totalDels} 行
                </div>
              </div>
            </ReportSection>

            {/* ── Step 4: 编写代码 ── */}
            <ReportSection
              title="4. 编写代码"
              icon={<Code2 size={15} />}
              defaultOpen={true}
              inlineSummary={<span>{result.files.length} 个文件 · <span className="text-foreground/50">+{totalAdds}</span> <span className="text-foreground/40">-{totalDels}</span></span>}
              status="ok"
            >
              <div className="space-y-3">
                <div className="rounded-md border border-border overflow-hidden">
                  {result.files.map((f) => (
                    <div key={f.path} className="flex items-center gap-2 px-3 py-2 text-xs border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <FileCode2 size={12} className="text-muted-foreground shrink-0" />
                      <span className="font-mono text-foreground flex-1 min-w-0 truncate">{f.path}</span>
                      <span className="text-foreground/50 text-[10px] font-mono">+{f.additions}</span>
                      <span className="text-foreground/40 text-[10px] font-mono">-{f.deletions}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ReportSection>

            {/* ── Step 5: 修改代码 (iterations) ── */}
            <ReportSection
              title="5. 迭代修复"
              icon={<RotateCcw size={15} />}
              defaultOpen={true}
              inlineSummary="自动修复完成"
              status="ok"
            >
              <div className="text-sm text-foreground space-y-2">
                <p>根据 lint 检查和类型检查结果，自动修复了代码风格问题和类型错误。</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CheckCircle2 size={11} /> ESLint 通过</span>
                  <span className="flex items-center gap-1"><CheckCircle2 size={11} /> TypeScript 编译通过</span>
                </div>
              </div>
            </ReportSection>

            {/* ── Step 6: 运行测试 ── */}
            <TestReportSection
              result={result}
              passedTests={passedTests}
              allTestsPassed={allTestsPassed}
              testPassRate={testPassRate}
            />

            {/* ── Step 7: AI Code Review ── */}
            <ReportSection
              title="7. AI Code Review"
              icon={<Shield size={15} />}
              defaultOpen={true}
              inlineSummary={
                aiReviewDone
                  ? <span>{reviewInfo?.overallScore} 分 · {hasCritical ? `${allFindings.filter(f => f.severity === "critical").length} 个严重问题` : hasWarning ? `${allFindings.filter(f => f.severity === "warning").length} 项警告` : "无问题"}</span>
                  : <span className="text-muted-foreground">审查中…</span>
              }
              status={!aiReviewDone ? "pending" : hasCritical ? "error" : hasWarning ? "warning" : "ok"}
            >
              {!aiReviewDone ? (
                <div className="flex items-center gap-2 py-2">
                  <Shield size={14} className="text-muted-foreground animate-pulse" />
                  <span className="text-sm text-muted-foreground">AI 正在审查代码…</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* AI Verdict */}
                  <div className={cn(
                    "rounded-lg border px-3 py-2.5 flex items-center gap-3",
                    verdict.type === "error" && "bg-foreground/[0.03] border-foreground/15",
                    verdict.type === "warning" && "bg-foreground/[0.02] border-foreground/10",
                    verdict.type === "ok" && "bg-muted/30 border-border",
                  )}>
                    <span className="text-sm font-bold shrink-0 text-foreground/60">{verdict.emoji}</span>
                    <p className="text-xs text-foreground flex-1">{verdict.text}</p>
                  </div>

                  {(reviewInfo?.aiReviewers || []).map((r) => {
                    const findings = r.findings || [];
                    const rCritical = findings.filter(f => f.severity === "critical").length;
                    const rWarning = findings.filter(f => f.severity === "warning").length;
                    return (
                      <ReviewerCard key={r.id} reviewer={r} defaultOpen={true} criticalCount={rCritical} warningCount={rWarning} />
                    );
                  })}
                </div>
              )}
            </ReportSection>

          </div>
        </TabsContent>

        {/* ═══════════ ACCEPTANCE REPORT (验收报告) ═══════════ */}
        <TabsContent value="overview" className="flex-1 min-h-0 m-0 overflow-y-auto scrollbar-hide">
          <div className="px-5 py-5 space-y-5">
            {/* Verdict Banner */}
            <div className={cn(
              "rounded-lg border px-4 py-3 flex items-center gap-3",
              verdict.type === "error" && "bg-foreground/[0.03] border-foreground/15",
              verdict.type === "warning" && "bg-foreground/[0.02] border-foreground/10",
              verdict.type === "ok" && "bg-muted/30 border-border",
              verdict.type === "pending" && "bg-muted/20 border-border",
            )}>
              <span className="text-lg font-bold shrink-0 text-foreground/60">{verdict.emoji}</span>
              <p className="text-sm text-foreground flex-1">{verdict.text}</p>
              {aiReviewDone && hasIssues && (
                <Badge variant="outline" className="text-[10px] border-foreground/20 text-foreground/60 shrink-0">
                  {acceptanceIssues.length} 个待决策
                </Badge>
              )}
            </div>

            {/* 2x2 Metrics Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Score */}
              <div className="rounded-lg border border-border bg-card/50 px-4 py-3 flex items-center gap-3">
                <div className="relative w-[34px] h-[34px] shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-border" />
                    <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
                      strokeDasharray={`${((reviewInfo?.overallScore ?? 0) / 100) * 97.4} 97.4`}
                      strokeLinecap="round"
                      className="stroke-foreground/60 transition-all duration-700"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                    {aiReviewDone ? reviewInfo?.overallScore : "–"}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">综合评分</div>
                  <div className="text-sm font-semibold text-foreground">{aiReviewDone ? `${reviewInfo?.overallScore} 分` : "审查中"}</div>
                </div>
              </div>
              {/* Test Pass Rate */}
              <div className="rounded-lg border border-border bg-card/50 px-4 py-3 flex items-center gap-3">
                <TestTube2 size={20} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground">测试通过率</div>
                  <div className="text-sm font-semibold text-foreground">{testPassRate}% <span className="text-xs font-normal text-muted-foreground">({passedTests}/{result.tests.length})</span></div>
                </div>
              </div>
              {/* Code Changes */}
              <div className="rounded-lg border border-border bg-card/50 px-4 py-3 flex items-center gap-3">
                <Code2 size={20} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground">代码变更</div>
                  <div className="text-sm font-semibold text-foreground">{result.files.length} 文件 <span className="text-xs font-normal text-foreground/50">+{totalAdds} -{totalDels}</span></div>
                </div>
              </div>
              {/* Elapsed Time */}
              <div className="rounded-lg border border-border bg-card/50 px-4 py-3 flex items-center gap-3">
                <Clock size={20} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground">执行耗时</div>
                  <div className="text-sm font-semibold text-foreground">{result.elapsed}s</div>
                </div>
              </div>
            </div>

            {/* AI Review Findings Summary */}
            {aiReviewDone && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI 审查发现</div>
                {(reviewInfo?.aiReviewers || []).map((r) => {
                  const findings = r.findings || [];
                  const rCritical = findings.filter(f => f.severity === "critical").length;
                  const rWarning = findings.filter(f => f.severity === "warning").length;
                  return (
                    <ReviewerCard key={r.id} reviewer={r} defaultOpen={rCritical > 0 || rWarning > 0} criticalCount={rCritical} warningCount={rWarning} />
                  );
                })}
              </div>
            )}

            {/* Test Summary */}
            <ReportSection
              title="测试报告"
              icon={<TestTube2 size={15} />}
              defaultOpen={!allTestsPassed}
              inlineSummary={<span>{passedTests}/{result.tests.length} 通过</span>}
              status={allTestsPassed ? "ok" : "error"}
            >
              <div className="rounded-md border border-border overflow-hidden">
                {result.tests.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs border-b border-border/50 last:border-0">
                    {t.passed ? (
                      <CheckCircle2 size={12} className="text-foreground/30 shrink-0" />
                    ) : (
                      <XCircle size={12} className="text-foreground/60 shrink-0" />
                    )}
                    <span className={cn("flex-1 text-foreground", !t.passed && "font-medium")}>{t.name}</span>
                    <span className="text-[10px] text-muted-foreground">{t.duration}ms</span>
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* Deploy / Acceptance QA */}
            {!deployed && !readOnly && (
              <div id="acceptance-qa-section" className="pt-2 pb-2">
                {aiReviewDone ? (
                  !hasIssues ? (
                    <Button
                      size="sm"
                      className="w-full gap-1.5 h-10 text-sm"
                      onClick={() => onDeploy(result.id)}
                    >
                      <Rocket size={14} />
                      确认发布到测试环境
                    </Button>
                  ) : null
                ) : (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Shield size={14} className="text-muted-foreground animate-pulse" />
                    <span className="text-xs text-muted-foreground">AI 正在审查，完成后即可操作</span>
                  </div>
                )}
              </div>
            )}
            {deployed && (
              <div className="flex items-center justify-center gap-2 py-2">
                <Badge variant="outline" className="text-[10px] border-foreground/20 text-foreground/60">已发布到测试环境</Badge>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══════════ PREVIEW (default) ═══════════ */}
        <TabsContent value="preview" className="flex-1 min-h-0 m-0 flex flex-col">
          <div className="flex-1 min-h-0">
            <RequirementPreview
              previewPath={result.previewPath}
              requirementTitle={result.requirementTitle}
              projectId={result.projectId}
              fullscreen
            />
          </div>
          {/* Bottom metrics bar */}
          <div className="shrink-0 border-t border-border bg-card/80 backdrop-blur-sm px-4 py-2.5 flex items-center gap-0 text-xs">
            {/* Score ring */}
            <div className="flex items-center gap-2 pr-4">
              <div className="relative w-[28px] h-[28px] shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-border" />
                  <circle
                    cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
                    strokeDasharray={`${((reviewInfo?.overallScore ?? 0) / 100) * 97.4} 97.4`}
                    strokeLinecap="round"
                    className="stroke-foreground/60 transition-all duration-700"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground">
                  {aiReviewDone ? reviewInfo?.overallScore : "–"}
                </span>
              </div>
              <span className="text-muted-foreground">分</span>
            </div>
            <div className="w-px h-5 bg-border shrink-0" />
            <div className="flex items-center gap-1.5 px-3">
              <TestTube2 size={12} className="text-muted-foreground" />
              <span className="font-semibold text-foreground">{passedTests}/{result.tests.length}</span>
              <span className="text-muted-foreground">通过</span>
            </div>
            <div className="w-px h-5 bg-border shrink-0" />
            <div className="flex items-center gap-1.5 px-3">
              <Code2 size={12} className="text-muted-foreground" />
              <span className="font-semibold text-foreground">{result.files.length}</span>
              <span className="text-muted-foreground">文件</span>
            </div>
            <div className="w-px h-5 bg-border shrink-0" />
            <div className="flex items-center gap-1.5 px-3">
              <Clock size={12} className="text-muted-foreground" />
              <span className="font-semibold text-foreground">{result.elapsed}s</span>
            </div>
            <span className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 mr-2"
              onClick={() => setActiveTab("process")}
            >
              <LayoutDashboard size={12} />
              查看开发过程
            </Button>
            {!deployed && !readOnly && aiReviewDone && !hasIssues && (
              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => onDeploy(result.id)}>
                <Rocket size={12} /> 发布
              </Button>
            )}
            {!deployed && !readOnly && aiReviewDone && hasIssues && (
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setActiveTab("process")}>
                <AlertTriangle size={10} />
                {acceptanceIssues.length} 个待决策
              </Button>
            )}
            {deployed && (
              <Badge variant="outline" className="text-[10px] border-foreground/20 text-foreground/60">已发布</Badge>
            )}
          </div>
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
