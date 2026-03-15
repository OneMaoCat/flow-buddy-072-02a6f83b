import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Search,
  Code2,
  Sparkles,
  AlertTriangle,
  ThumbsUp,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DevCompleteResult } from "@/components/DevCompleteCard";
import type { ReviewInfo } from "@/data/reviewTypes";
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

  // Collect critical/warning findings for overview
  const keyFindings = (reviewInfo?.aiReviewers || [])
    .flatMap((r) => (r.findings || []).filter((f) => f.severity === "critical" || f.severity === "warning"))
    .slice(0, 5);

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

  // Build timeline steps
  const timelineSteps: TimelineStep[] = [
    {
      icon: <GitBranch size={13} />,
      label: "拉取分支 & 分析需求",
      detail: "自动创建开发分支，解析需求文档",
      status: "done",
    },
    {
      icon: <Code2 size={13} />,
      label: "编写代码",
      detail: `${result.files.length} 个文件变更，+${totalAdds} -${totalDels} 行`,
      status: "done",
    },
    {
      icon: <TestTube2 size={13} />,
      label: "运行测试",
      detail: allTestsPassed
        ? `全部 ${result.tests.length} 项测试通过`
        : `${passedTests}/${result.tests.length} 项通过，${result.tests.length - passedTests} 项失败`,
      status: allTestsPassed ? "done" : "error",
    },
    {
      icon: <Shield size={13} />,
      label: "AI Code Review",
      detail: aiReviewDone
        ? `综合评分 ${reviewInfo?.overallScore ?? "-"} 分${hasCritical ? "，发现严重问题" : hasWarning ? "，有警告项" : "，质量良好"}`
        : aiReviewRunning
        ? "审查进行中…"
        : "等待审查",
      status: aiReviewDone
        ? hasCritical
          ? "error"
          : hasWarning
          ? "warning"
          : "done"
        : aiReviewRunning
        ? "running"
        : "running",
    },
    {
      icon: <Eye size={13} />,
      label: "等待验收",
      detail: deployed ? "已发布到测试环境" : approved ? "审查已通过，可发布" : "请查看结果并决定",
      status: deployed ? "done" : "running",
    },
  ];

  // Default tab: overview
  const defaultTab = "overview";

  return (
    <div className="flex flex-col h-full bg-background">
      <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border shrink-0">
          <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {result.requirementTitle}
            </p>
          </div>
          <TabsList className="h-8">
            <TabsTrigger value="overview" className="text-xs gap-1 h-7 px-2.5">
              <LayoutDashboard size={12} /> 概览
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs gap-1 h-7 px-2.5">
              <Eye size={12} /> 预览
            </TabsTrigger>
            <TabsTrigger value="review" className="text-xs gap-1 h-7 px-2.5">
              <Shield size={12} /> AI 审查
            </TabsTrigger>
            <TabsTrigger value="diff" className="text-xs gap-1 h-7 px-2.5">
              <FileCode2 size={12} /> 变更
            </TabsTrigger>
            <TabsTrigger value="tests" className="text-xs gap-1 h-7 px-2.5">
              <TestTube2 size={12} /> 测试
            </TabsTrigger>
          </TabsList>
          {statusBadge}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <X size={14} />
          </button>
        </div>

        {/* Overview Timeline */}
        <TabsContent value="overview" className="flex-1 min-h-0 m-0 overflow-y-auto scrollbar-hide">
          <div className="p-4 space-y-5">
            {/* Summary metrics row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <div className={cn(
                  "text-2xl font-bold",
                  aiReviewDone
                    ? (reviewInfo?.overallScore ?? 0) >= 80
                      ? "text-emerald-500"
                      : (reviewInfo?.overallScore ?? 0) >= 60
                      ? "text-amber-500"
                      : "text-destructive"
                    : "text-muted-foreground"
                )}>
                  {aiReviewDone ? reviewInfo?.overallScore ?? "-" : "—"}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">AI 评分</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <div className={cn(
                  "text-2xl font-bold",
                  allTestsPassed ? "text-emerald-500" : "text-destructive"
                )}>
                  {passedTests}/{result.tests.length}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">测试通过</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <div className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
                  <span className="text-emerald-500">+{totalAdds}</span>
                  <span className="text-destructive text-lg">-{totalDels}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{result.files.length} 文件变更</div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-0">
              <div className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                <Clock size={12} />
                开发时间线 · 耗时 {result.elapsed}s
              </div>
              <div className="relative">
                {timelineSteps.map((step, i) => (
                  <div key={i} className="flex gap-3 relative">
                    {/* Vertical line */}
                    {i < timelineSteps.length - 1 && (
                      <div className="absolute left-[9px] top-[22px] w-px h-[calc(100%-10px)] bg-border" />
                    )}
                    {/* Dot */}
                    <div className={cn(
                      "w-[19px] h-[19px] rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      step.status === "done" && "bg-emerald-500/15",
                      step.status === "running" && "bg-primary/15",
                      step.status === "warning" && "bg-amber-500/15",
                      step.status === "error" && "bg-destructive/15",
                    )}>
                      <div className={cn("w-2 h-2 rounded-full", statusDot[step.status])} />
                    </div>
                    {/* Content */}
                    <div className="pb-4 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">{step.icon}</span>
                        <span className="text-xs font-medium text-foreground">{step.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key findings (if any) */}
            {keyFindings.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  关键发现
                </div>
                <div className="space-y-1.5">
                  {keyFindings.map((f) => (
                    <div
                      key={f.id}
                      className={cn(
                        "flex items-start gap-2 px-3 py-2 rounded-md text-xs",
                        f.severity === "critical"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {f.severity === "critical" ? <XCircle size={13} className="shrink-0 mt-0.5" /> : <AlertTriangle size={13} className="shrink-0 mt-0.5" />}
                      <div className="min-w-0">
                        <span className="font-medium">{f.title}</span>
                        {f.filePath && (
                          <span className="ml-1.5 text-[10px] opacity-70 font-mono">{f.filePath}{f.lineRange ? `:${f.lineRange}` : ""}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All clear message */}
            {aiReviewDone && keyFindings.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-3 rounded-md bg-emerald-500/10 text-emerald-500 text-xs">
                <ThumbsUp size={14} />
                <span>审查通过，未发现严重问题，可以放心发布。</span>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview" className="flex-1 min-h-0 m-0">
          <RequirementPreview
            previewPath={result.previewPath}
            requirementTitle={result.requirementTitle}
            projectId={result.projectId}
            fullscreen
          />
        </TabsContent>

        {/* AI Review */}
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

        {/* Diff */}
        <TabsContent value="diff" className="flex-1 min-h-0 m-0 overflow-y-auto scrollbar-hide">
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{result.files.length} 个文件变更</span>
              <span className="text-emerald-500">+{totalAdds}</span>
              <span className="text-destructive">-{totalDels}</span>
            </div>
            {result.files.map((f) => (
              <div key={f.path} className="rounded-md border border-border overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 border-b border-border">
                  <FileCode2 size={12} className="text-muted-foreground" />
                  <span className="text-xs font-mono text-foreground">{f.path}</span>
                  <span className="ml-auto text-[10px] text-emerald-500">+{f.additions}</span>
                  <span className="text-[10px] text-destructive">-{f.deletions}</span>
                </div>
                <div className="text-[11px] font-mono leading-5 bg-card">
                  {f.lines.map((l, i) => (
                    <div
                      key={i}
                      className={cn(
                        "px-3",
                        l.type === "add" && "bg-emerald-500/10 text-emerald-400",
                        l.type === "del" && "bg-destructive/10 text-destructive line-through",
                        l.type === "ctx" && "text-muted-foreground"
                      )}
                    >
                      <span className="inline-block w-4 select-none opacity-50">
                        {l.type === "add" ? "+" : l.type === "del" ? "-" : " "}
                      </span>
                      {l.content}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Tests */}
        <TabsContent value="tests" className="flex-1 min-h-0 m-0 overflow-y-auto scrollbar-hide">
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={allTestsPassed ? "default" : "destructive"}
                className="text-[10px]"
              >
                {passedTests}/{result.tests.length} 通过
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                总耗时 {result.tests.reduce((s, t) => s + t.duration, 0)}ms
              </span>
            </div>
            <div className="rounded-md border border-border bg-card overflow-hidden">
              {result.tests.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 text-xs border-b border-border last:border-0"
                >
                  {t.passed ? (
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle size={14} className="text-destructive shrink-0" />
                  )}
                  <span className="flex-1 text-foreground">{t.name}</span>
                  <span className="text-[10px] text-muted-foreground">{t.duration}ms</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action bar */}
      {!deployed && !readOnly && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-muted/20">
          {approved ? (
            <>
              <Button
                size="sm"
                className="flex-1 gap-1.5 h-9 text-xs"
                onClick={() => onDeploy(result.id)}
              >
                <Rocket size={13} />
                发布到测试环境
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1"
                onClick={() => onReject(result.id)}
              >
                <RotateCcw size={12} />
                打回修改
              </Button>
            </>
          ) : aiReviewDone ? (
            <>
              <Button
                size="sm"
                className="flex-1 gap-1.5 h-9 text-xs"
                disabled={hasCritical}
                onClick={() => onDeploy(result.id)}
              >
                <Rocket size={13} />
                {hasCritical ? "有严重问题，建议修改" : "发布到测试环境"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1"
                onClick={() => onReject(result.id)}
              >
                <RotateCcw size={12} />
                打回修改
              </Button>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 py-1">
              <Shield size={14} className="text-primary animate-pulse" />
              <span className="text-xs text-muted-foreground">AI 正在审查代码…</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DevCompleteDetailPanel;
