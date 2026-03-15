import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import RequirementPreview from "@/components/RequirementPreview";
import CodeReviewTab from "@/components/CodeReviewTab";
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
  GitBranch,
  Code2,
  AlertTriangle,
  Clock,
  MessageSquareText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DevCompleteResult, AcceptanceIssue } from "@/components/DevCompleteCard";
import type { ReviewInfo, FindingSeverity } from "@/data/reviewTypes";
import { isReviewApproved } from "@/data/reviewTypes";

interface DevCompleteDetailPanelProps {
  result: DevCompleteResult;
  onDeploy: (id: string) => void;
  onReject: (id: string) => void;
  onRequestReview: (id: string) => void;
  onClose: () => void;
  deployed?: boolean;
  reviewing?: boolean;
  reviewInfo?: ReviewInfo;
  onUpdateReview?: (id: string, review: ReviewInfo) => void;
  readOnly?: boolean;
}

/* ── Section wrapper ── */
const ReportSection = ({
  number,
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  number: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
          {number}
        </span>
        <span className="text-muted-foreground shrink-0">{icon}</span>
        <span className="text-xs font-semibold text-foreground flex-1">{title}</span>
        {open ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
      </button>
      {open && <div className="px-4 py-3 border-t border-border">{children}</div>}
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

/* ── Timeline Step ── */
interface TimelineStep {
  icon: React.ReactNode;
  label: string;
  detail: string;
  status: "done" | "running" | "warning" | "error";
}

const statusDot: Record<TimelineStep["status"], string> = {
  done: "bg-emerald-500",
  running: "bg-primary animate-pulse",
  warning: "bg-amber-500",
  error: "bg-destructive",
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

        {/* ═══════════ OVERVIEW — Full AI Acceptance Report ═══════════ */}
        <TabsContent value="overview" className="flex-1 min-h-0 m-0 overflow-y-auto scrollbar-hide">
          <div className="p-4 space-y-4">

            {/* ── AI Verdict Banner ── */}
            <div className={cn(
              "rounded-lg p-4 flex items-start gap-3",
              verdict.type === "error" && "bg-destructive/10 border border-destructive/20",
              verdict.type === "warning" && "bg-amber-500/10 border border-amber-500/20",
              verdict.type === "ok" && "bg-emerald-500/10 border border-emerald-500/20",
              verdict.type === "pending" && "bg-muted border border-border",
            )}>
              <span className="text-2xl shrink-0">{verdict.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">AI 验收结论</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{verdict.text}</p>
              </div>
              {/* Quick action in verdict */}
              {!deployed && !readOnly && aiReviewDone && !hasCritical && (
                <Button size="sm" className="h-8 text-xs gap-1 shrink-0" onClick={() => onDeploy(result.id)}>
                  <Rocket size={12} /> 发布
                </Button>
              )}
              {!deployed && !readOnly && aiReviewDone && hasCritical && (
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1 shrink-0" onClick={() => onReject(result.id)}>
                  <RotateCcw size={12} /> 打回修改
                </Button>
              )}
            </div>

            {/* ── Section 1: Task Background ── */}
            <ReportSection number={1} title="任务背景" icon={<MessageSquareText size={13} />}>
              <div className="space-y-2.5">
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">原始需求</div>
                  <p className="text-xs text-foreground leading-relaxed bg-muted/30 rounded-md px-3 py-2">
                    {result.sourceContext?.userPrompt || result.requirementTitle}
                  </p>
                </div>
                {result.sourceContext?.aiSummary && (
                  <div>
                    <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Sparkles size={10} /> AI 理解摘要
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{result.sourceContext.aiSummary}</p>
                  </div>
                )}
              </div>
            </ReportSection>

            {/* ── Section 2: Dev Process Timeline ── */}
            <ReportSection number={2} title={`开发过程 · 耗时 ${result.elapsed}s`} icon={<Clock size={13} />}>
              <div className="relative">
                {timelineSteps.map((step, i) => (
                  <div key={i} className="flex gap-3 relative">
                    {i < timelineSteps.length - 1 && (
                      <div className="absolute left-[9px] top-[22px] w-px h-[calc(100%-10px)] bg-border" />
                    )}
                    <div className={cn(
                      "w-[19px] h-[19px] rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      step.status === "done" && "bg-emerald-500/15",
                      step.status === "running" && "bg-primary/15",
                      step.status === "warning" && "bg-amber-500/15",
                      step.status === "error" && "bg-destructive/15",
                    )}>
                      <div className={cn("w-2 h-2 rounded-full", statusDot[step.status])} />
                    </div>
                    <div className="pb-3 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">{step.icon}</span>
                        <span className="text-xs font-medium text-foreground">{step.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* ── Section 3: Code Change Summary ── */}
            <ReportSection number={3} title="代码变更" icon={<Code2 size={13} />}>
              <div className="space-y-3">
                {/* AI summary */}
                {result.aiChangeSummary && (
                  <p className="text-xs text-foreground leading-relaxed">{result.aiChangeSummary}</p>
                )}
                {/* File list */}
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
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>{result.files.length} 个文件</span>
                  <span className="text-emerald-500 font-medium">+{totalAdds} 行新增</span>
                  <span className="text-destructive font-medium">-{totalDels} 行删除</span>
                </div>
              </div>
            </ReportSection>

            {/* ── Section 4: AI Code Review ── */}
            <ReportSection number={4} title="AI Code Review" icon={<Shield size={13} />}>
              {!aiReviewDone ? (
                <div className="flex items-center gap-2 py-2">
                  <Shield size={14} className="text-primary animate-pulse" />
                  <span className="text-xs text-muted-foreground">AI 正在审查代码…</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Score + model summaries */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full border-[3px] border-primary flex items-center justify-center shrink-0">
                      <span className={cn(
                        "text-lg font-bold",
                        (reviewInfo?.overallScore ?? 0) >= 80 ? "text-emerald-500" : (reviewInfo?.overallScore ?? 0) >= 60 ? "text-amber-500" : "text-destructive"
                      )}>
                        {reviewInfo?.overallScore}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {(reviewInfo?.aiReviewers || []).map((r) => (
                        <div key={r.id} className="flex items-center gap-2">
                          <span className="text-sm">{r.icon}</span>
                          <span className="text-[11px] font-medium text-foreground w-24 shrink-0">{r.displayName}</span>
                          <span className={cn(
                            "text-[11px] font-bold",
                            (r.score ?? 0) >= 80 ? "text-emerald-500" : (r.score ?? 0) >= 60 ? "text-amber-500" : "text-destructive"
                          )}>
                            {r.score}分
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate flex-1">{r.summary}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* All findings grouped by severity */}
                  {allFindings.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">全部发现 ({allFindings.length})</div>
                      {allFindings
                        .sort((a, b) => {
                          const order: FindingSeverity[] = ["critical", "warning", "suggestion", "praise"];
                          return order.indexOf(a.severity) - order.indexOf(b.severity);
                        })
                        .map((f) => {
                          const cfg = severityConfig[f.severity];
                          return (
                            <div key={f.id} className={cn("flex items-start gap-2 px-3 py-2 rounded-md text-xs", cfg.bg)}>
                              {f.severity === "critical" ? <XCircle size={13} className={cn("shrink-0 mt-0.5", cfg.text)} />
                                : f.severity === "warning" ? <AlertTriangle size={13} className={cn("shrink-0 mt-0.5", cfg.text)} />
                                : f.severity === "praise" ? <CheckCircle2 size={13} className={cn("shrink-0 mt-0.5", cfg.text)} />
                                : <Sparkles size={13} className={cn("shrink-0 mt-0.5", cfg.text)} />}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge variant="outline" className={cn("text-[9px] h-4 px-1 border-0", cfg.bg, cfg.text)}>{cfg.label}</Badge>
                                  <span className="font-medium text-foreground">{f.title}</span>
                                  {f.filePath && (
                                    <span className="text-[10px] opacity-60 font-mono">{f.filePath}{f.lineRange ? `:${f.lineRange}` : ""}</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{f.description}</p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </ReportSection>

            {/* ── Section 5: Test Report ── */}
            <ReportSection number={5} title="测试报告" icon={<TestTube2 size={13} />}>
              <div className="space-y-3">
                {/* Pass rate bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Progress
                      value={testPassRate}
                      className={cn("h-2", allTestsPassed ? "[&>div]:bg-emerald-500" : "[&>div]:bg-destructive")}
                    />
                  </div>
                  <span className={cn(
                    "text-xs font-bold shrink-0",
                    allTestsPassed ? "text-emerald-500" : "text-destructive"
                  )}>
                    {testPassRate}% ({passedTests}/{result.tests.length})
                  </span>
                </div>
                {/* Test cases */}
                <div className="rounded-md border border-border overflow-hidden">
                  {result.tests.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs border-b border-border last:border-0">
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
                <div className="text-[10px] text-muted-foreground">
                  总耗时 {result.tests.reduce((s, t) => s + t.duration, 0)}ms
                </div>
              </div>
            </ReportSection>

            {/* ── Section 6: Product Preview ── */}
            <ReportSection number={6} title="产品预览" icon={<Eye size={13} />} defaultOpen={true}>
              <div className="space-y-2">
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

            {/* ── Bottom action bar (in scroll) ── */}
            {!deployed && !readOnly && (
              <div className="flex items-center gap-2 pt-2 pb-2">
                {aiReviewDone ? (
                  <>
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 h-10 text-sm"
                      disabled={hasCritical}
                      onClick={() => onDeploy(result.id)}
                    >
                      <Rocket size={14} />
                      {hasCritical ? "有严重问题，建议修改" : "确认发布到测试环境"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 text-sm gap-1"
                      onClick={() => onReject(result.id)}
                    >
                      <RotateCcw size={13} />
                      打回修改
                    </Button>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 py-2">
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
