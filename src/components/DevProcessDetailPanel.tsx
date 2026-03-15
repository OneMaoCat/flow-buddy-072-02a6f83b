import { useState, useMemo } from "react";
import {
  X, GitBranch, Search, Sparkles, Code2, Pencil, TestTube2, Shield,
  CheckCircle2, FileCode2, MonitorPlay, MousePointerClick, Type, Eye,
  ArrowRight, Loader2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  UserCheck, GitMerge, ShieldCheck, Clock, AlertTriangle, Wrench, SkipForward, Hand
} from "lucide-react";
import type { DevCompleteResult } from "@/components/DevCompleteCard";
import { buildMockAIReview, type FindingSeverity, type AIReviewFinding } from "@/data/reviewTypes";
import { buildMockUITestSteps, type UITestStep } from "@/components/UITestReplay";
import mockPreviewImg from "@/assets/mock-preview.jpg";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const actionIcons: Record<UITestStep["action"], React.ReactNode> = {
  click: <MousePointerClick size={11} />,
  type: <Type size={11} />,
  verify: <Eye size={11} />,
  navigate: <ArrowRight size={11} />,
  wait: <Loader2 size={11} />,
};
const actionLabels: Record<UITestStep["action"], string> = {
  click: "点击", type: "输入", verify: "验证", navigate: "导航", wait: "等待",
};

/* ── UI Test Process Log with screenshots ── */
const UITestProcessLog = () => {
  const uiSteps = buildMockUITestSteps();
  const uiPassed = uiSteps.filter(s => s.passed).length;
  const [collapsedSteps, setCollapsedSteps] = useState<Set<string>>(new Set());

  return (
    <div className="text-xs text-muted-foreground space-y-2">
      <p className="text-foreground font-medium">
        {uiPassed}/{uiSteps.length} 步骤通过 · {uiSteps.reduce((s, t) => s + t.duration, 0)}ms
      </p>
      <div className="space-y-0.5">
        {uiSteps.map((s, i) => {
          const isExpanded = !collapsedSteps.has(s.id);
          return (
            <div key={s.id}>
              <button
                onClick={() => setCollapsedSteps(prev => { const next = new Set(prev); if (next.has(s.id)) next.delete(s.id); else next.add(s.id); return next; })}
                className="w-full flex items-start gap-2 py-1.5 px-1 rounded-md hover:bg-muted/50 transition-colors text-left"
              >
                <div className="mt-0.5 w-4 h-4 rounded-full bg-muted flex items-center justify-center shrink-0 text-[8px] font-bold text-muted-foreground">
                  {i + 1}
                </div>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="inline-flex items-center gap-0.5 text-muted-foreground/70 shrink-0">
                    {actionIcons[s.action]}
                    <span className="text-[10px]">{actionLabels[s.action]}</span>
                  </span>
                  <span className="truncate">{s.description}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-muted-foreground/40 tabular-nums">{s.duration}ms</span>
                  <CheckCircle2 size={11} className={s.passed ? "text-green-500" : "text-destructive"} />
                  {isExpanded ? <ChevronUp size={10} className="text-muted-foreground/40" /> : <ChevronDown size={10} className="text-muted-foreground/40" />}
                </div>
              </button>
              {isExpanded && (
                <div className="ml-6 mb-2 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="rounded-md border border-border overflow-hidden">
                    <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 border-b border-border">
                      <div className="flex gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/15" />
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/10" />
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/10" />
                      </div>
                      <div className="flex-1 mx-1 px-1.5 py-0.5 rounded bg-background/60 text-[8px] text-muted-foreground font-mono truncate">
                        localhost:5173{s.action === "navigate" ? s.target : "/login"}
                      </div>
                    </div>
                    <div className="relative">
                      <img src={mockPreviewImg} alt={`步骤 ${i + 1}: ${s.description}`} className="w-full h-48 object-cover object-top" />
                      <div className="absolute inset-0 bg-background/20" />
                      <div className="absolute z-10" style={{ left: `${s.indicatorX}%`, top: `${s.indicatorY}%`, transform: "translate(-50%, -50%)" }}>
                        <div className="w-6 h-6 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center animate-pulse">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-background/90 backdrop-blur-sm border border-border text-[9px] font-medium text-foreground shadow-sm">
                          {actionIcons[s.action]}
                          {s.description}
                          {s.value && <span className="text-muted-foreground ml-1">"{s.value}"</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Shared types ── */
export type IssueDecision = "ai-fix" | "skip" | "manual" | "other";

export const severityStyles: Record<FindingSeverity, { label: string; className: string }> = {
  critical: { label: "严重", className: "text-destructive bg-destructive/10 border-destructive/20" },
  warning: { label: "警告", className: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
  suggestion: { label: "建议", className: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  praise: { label: "优秀", className: "text-green-500 bg-green-500/10 border-green-500/20" },
};

const decisionOptions: { value: IssueDecision; label: string; icon: React.ReactNode }[] = [
  { value: "ai-fix", label: "同意 AI 修复", icon: <Wrench size={11} /> },
  { value: "skip", label: "跳过", icon: <SkipForward size={11} /> },
  { value: "manual", label: "手动处理", icon: <Hand size={11} /> },
];

// AI suggested fix text per issue (mock)
const suggestedFixes: Record<string, string> = {
  f3: "将密码最低要求提升至 8 位 + 大小写字母 + 数字，并增加特殊字符可选提示",
  f7: "移除 LoginForm.tsx 第 42 行的 console.log 语句",
  f2: "将 emailRegex 提取到 src/utils/validators.ts 并导出为常量",
  f5: "为 FormErrorTip 组件添加 role='alert' 和 aria-live='polite'",
  f8: "为提交按钮增加 300ms 防抖处理，使用 lodash.debounce",
};

/** Extract actionable issues from a review */
export const extractActionableIssues = (review: ReturnType<typeof buildMockAIReview>): AIReviewFinding[] => {
  const all: AIReviewFinding[] = [];
  review.aiReviewers?.forEach(r => {
    r.findings?.forEach(f => {
      if (f.severity === "critical" || f.severity === "warning") all.push(f);
    });
  });
  return all;
};

/* ── ProcessReviewQA — shown in chat bottom area ── */
export const ProcessReviewQA = ({
  issues,
  decisions,
  otherTexts,
  onDecide,
  onOtherText,
  onConfirmAcceptance,
  onConfirmMerge,
  allResolved,
  acceptanceConfirmed,
  mergeApproved,
}: {
  issues: AIReviewFinding[];
  decisions: Record<string, IssueDecision>;
  otherTexts: Record<string, string>;
  onDecide: (id: string, decision: IssueDecision) => void;
  onOtherText: (id: string, text: string) => void;
  onConfirmAcceptance: () => void;
  onConfirmMerge: () => void;
  allResolved: boolean;
  acceptanceConfirmed: boolean;
  mergeApproved: boolean;
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const total = issues.length;
  const current = issues[currentIdx];
  const resolvedCount = issues.filter(i => decisions[i.id]).length;

  // Phase 3: merge approved — done
  if (mergeApproved) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-green-500">
        <CheckCircle2 size={14} />
        <span className="font-medium">已确认合并，正在执行后续流程...</span>
      </div>
    );
  }

  // Phase 2b: acceptance confirmed, waiting for merge confirmation
  if (acceptanceConfirmed) {
    return (
      <div className="px-3 py-3 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle2 size={12} className="text-green-500" />
          <span className="text-foreground font-medium">人工验收通过</span>
        </div>
        <p className="text-[11px] text-muted-foreground">确认将功能分支合并到主分支？合并后将自动触发全流程回归测试。</p>
        <Button size="sm" onClick={onConfirmMerge} className="gap-1.5 text-xs h-8">
          <GitMerge size={12} />
          确认合并主分支
        </Button>
      </div>
    );
  }

  // Phase 2a: all issues resolved, waiting for acceptance
  if (allResolved) {
    return (
      <div className="px-3 py-3 space-y-3">
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle2 size={12} className="text-green-500" />
          <span className="text-foreground font-medium">全部 {total} 个问题已处理</span>
        </div>
        <div className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <UserCheck size={14} className="text-orange-500" />
            <span className="text-xs font-semibold text-foreground">人工验收</span>
          </div>
          <p className="text-[11px] text-muted-foreground">请确认功能是否符合需求、UI 是否一致、边界情况是否覆盖。验收通过后将进入合并流程。</p>
          <Button size="sm" onClick={onConfirmAcceptance} className="gap-1.5 text-xs h-8">
            <CheckCircle2 size={12} />
            验收通过，继续
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-3 py-2 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs">
        <AlertTriangle size={12} className="text-orange-500" />
        <span className="text-foreground font-medium">Code Review 问题待处理</span>
        <span className="text-muted-foreground">{resolvedCount}/{total} 已处理</span>
      </div>

      {/* Slide indicator */}
      <div className="flex items-center gap-1">
        {issues.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIdx(i)}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              i === currentIdx ? "bg-foreground w-6" : decisions[issues[i].id] ? "bg-foreground/40 w-3" : "bg-border w-3"
            )}
          />
        ))}
        <span className="ml-auto text-[10px] text-muted-foreground">{currentIdx + 1} / {total}</span>
      </div>

      {/* Card */}
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${currentIdx * 100}%)` }}>
          {issues.map((issue) => {
            const selected = decisions[issue.id];
            return (
              <div key={issue.id} className="w-full shrink-0">
                <div className="px-3 py-2.5 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border shrink-0", severityStyles[issue.severity].className)}>
                        {severityStyles[issue.severity].label}
                      </span>
                      <span className="text-xs font-medium text-foreground truncate">{issue.title}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{issue.description}</p>
                    {issue.filePath && (
                      <p className="text-[10px] text-muted-foreground/50 font-mono mt-0.5">
                        {issue.filePath}{issue.lineRange ? ` · ${issue.lineRange}` : ""}
                      </p>
                    )}
                    {suggestedFixes[issue.id] && (
                      <div className="rounded-md bg-primary/5 border border-primary/10 px-2 py-1.5 mt-1.5">
                        <p className="text-[10px] text-primary font-medium">💡 AI 建议修复</p>
                        <p className="text-[11px] text-muted-foreground">{suggestedFixes[issue.id]}</p>
                      </div>
                    )}
                  </div>
                  {selected && <CheckCircle2 size={14} className="text-foreground/50 shrink-0 mt-1" />}
                </div>

                <div className="px-3 pb-2.5 flex flex-wrap gap-1.5">
                  {decisionOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => onDecide(issue.id, opt.value)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all",
                        selected === opt.value
                          ? "border-foreground bg-foreground/10 text-foreground"
                          : "border-border bg-background text-foreground hover:border-muted-foreground/40 hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0",
                        selected === opt.value ? "border-foreground" : "border-muted-foreground/40"
                      )}>
                        {selected === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-foreground" />}
                      </div>
                      {opt.label}
                    </button>
                  ))}
                  <button
                    onClick={() => onDecide(issue.id, "other")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all",
                      selected === "other"
                        ? "border-foreground bg-foreground/10 text-foreground"
                        : "border-border bg-background text-foreground hover:border-muted-foreground/40 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0",
                      selected === "other" ? "border-foreground" : "border-muted-foreground/40"
                    )}>
                      {selected === "other" && <div className="w-1.5 h-1.5 rounded-full bg-foreground" />}
                    </div>
                    其他
                  </button>
                </div>

                {selected === "other" && (
                  <div className="px-3 pb-2.5">
                    <textarea
                      value={otherTexts[issue.id] || ""}
                      onChange={(e) => onOtherText(issue.id, e.target.value)}
                      placeholder="请描述你的处理方案…"
                      className="w-full text-[11px] text-foreground bg-muted/30 border border-border rounded-lg px-3 py-2 resize-none h-14 placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 transition-colors"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setCurrentIdx(i => i - 1)} disabled={currentIdx === 0} className="gap-1 text-xs h-7">
          <ChevronLeft size={12} /> 上一个
        </Button>
        {currentIdx < total - 1 ? (
          <Button variant="outline" size="sm" onClick={() => setCurrentIdx(i => i + 1)} className="gap-1 text-xs h-7">
            下一个 <ChevronRight size={12} />
          </Button>
        ) : (
          <span className="text-[10px] text-muted-foreground">
            {resolvedCount === total ? "✅ 全部已处理" : `还剩 ${total - resolvedCount} 个待处理`}
          </span>
        )}
      </div>
    </div>
  );
};

/* ── Main Panel ── */

interface DevProcessDetailPanelProps {
  result: DevCompleteResult;
  onClose: () => void;
  issueDecisions: Record<string, IssueDecision>;
  otherTexts: Record<string, string>;
  acceptanceConfirmed: boolean;
  mergeApproved: boolean;
  onDecide: (id: string, decision: IssueDecision) => void;
  onOtherText: (id: string, text: string) => void;
  onConfirmAcceptance: () => void;
  onConfirmMerge: () => void;
}

const DevProcessDetailPanel = ({
  result, onClose,
  issueDecisions, otherTexts, acceptanceConfirmed, mergeApproved,
  onDecide, onOtherText, onConfirmAcceptance, onConfirmMerge,
}: DevProcessDetailPanelProps) => {
  const totalAdds = result.files.reduce((s, f) => s + f.additions, 0);
  const totalDels = result.files.reduce((s, f) => s + f.deletions, 0);
  const passedTests = result.tests.filter((t) => t.passed).length;
  const branchName = `feature/req-${result.id.slice(0, 8)}`;

  const review = useMemo(() => buildMockAIReview(), []);
  const actionableIssues = useMemo(() => extractActionableIssues(review), [review]);
  const allIssuesResolved = actionableIssues.length === 0 || actionableIssues.every(i => issueDecisions[i.id]);

  type Section = {
    icon: React.ReactNode;
    title: string;
    content: React.ReactNode;
    status: "done" | "pending" | "active";
    visible: boolean;
  };

  const sections: Section[] = [
    {
      icon: <GitBranch size={14} />, title: "拉取分支", status: "done", visible: true,
      content: (
        <div className="text-xs text-muted-foreground">
          <p>创建开发分支 <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[11px]">{branchName}</code></p>
          <p className="mt-1">基于 <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[11px]">main</code> 分支拉取，确保代码基线最新。</p>
        </div>
      ),
    },
    {
      icon: <Search size={14} />, title: "分析需求", status: "done", visible: true,
      content: (
        <div className="text-xs text-muted-foreground space-y-2">
          <div>
            <p className="text-foreground font-medium mb-1">用户原始需求</p>
            <p className="bg-muted rounded-md px-3 py-2">{result.sourceContext?.userPrompt || result.requirementTitle}</p>
          </div>
          {result.sourceContext?.aiSummary && (
            <div>
              <p className="text-foreground font-medium mb-1">AI 需求理解</p>
              <p className="bg-muted rounded-md px-3 py-2">{result.sourceContext.aiSummary}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      icon: <Sparkles size={14} />, title: "制定方案", status: "done", visible: true,
      content: (
        <div className="text-xs text-muted-foreground space-y-2">
          <p>规划 {result.files.length} 个文件的修改方案：</p>
          <ul className="space-y-1">
            {result.files.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <FileCode2 size={11} className="text-muted-foreground/60 shrink-0" />
                <span className="font-mono text-[11px] text-foreground">{f.path}</span>
                <span className="text-muted-foreground/50">+{f.additions} -{f.deletions}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      icon: <Code2 size={14} />, title: "编写代码", status: "done", visible: true,
      content: (
        <div className="text-xs text-muted-foreground space-y-2">
          {result.aiChangeSummary && <p>{result.aiChangeSummary}</p>}
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-foreground/60">共 {result.files.length} 个文件</span>
            <span className="text-green-500">+{totalAdds}</span>
            <span className="text-red-400">-{totalDels}</span>
          </div>
        </div>
      ),
    },
    {
      icon: <Pencil size={14} />, title: "修改代码", status: "done", visible: true,
      content: (
        <div className="text-xs text-muted-foreground space-y-2">
          {result.files.map((f, i) => (
            <div key={i} className="rounded-md border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border-b border-border">
                <FileCode2 size={11} />
                <span className="font-mono text-[11px] text-foreground">{f.path}</span>
              </div>
              <div className="px-3 py-2 font-mono text-[11px] space-y-0.5 bg-card">
                {f.lines.slice(0, 6).map((line, li) => (
                  <div key={li} className={line.type === "add" ? "text-green-500" : line.type === "del" ? "text-red-400 line-through" : "text-muted-foreground/60"}>
                    {line.type === "add" ? "+ " : line.type === "del" ? "- " : "  "}{line.content}
                  </div>
                ))}
                {f.lines.length > 6 && <div className="text-muted-foreground/40 mt-1">... 还有 {f.lines.length - 6} 行</div>}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <TestTube2 size={14} />, title: "运行测试", status: "done", visible: true,
      content: (
        <div className="text-xs text-muted-foreground space-y-1.5">
          <p className="text-foreground font-medium">{passedTests}/{result.tests.length} 用例通过 {result.coveragePercent && `· 覆盖率 ${result.coveragePercent}%`}</p>
          {result.tests.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 size={11} className={t.passed ? "text-green-500" : "text-destructive"} />
              <span className={t.passed ? "" : "text-destructive"}>{t.name}</span>
              <span className="text-muted-foreground/40 ml-auto">{t.duration}ms</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <MonitorPlay size={14} />, title: "UI 测试", status: "done", visible: true,
      content: <UITestProcessLog />,
    },
    {
      icon: <Shield size={14} />, title: "AI Code Review", status: "done", visible: true,
      content: (
        <div className="text-xs text-muted-foreground space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-foreground">{review.overallScore}</span>
            </div>
            <div>
              <p className="text-foreground font-medium">综合评分 {review.overallScore}/100</p>
              <p className="text-[10px]">{review.aiReviewers?.length} 个 AI 模型并行审查完成</p>
            </div>
          </div>
          {review.aiReviewers?.map(reviewer => (
            <div key={reviewer.id} className="rounded-md border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
                <span>{reviewer.icon}</span>
                <span className="text-foreground font-medium">{reviewer.displayName}</span>
                <span className="ml-auto text-[10px] font-medium text-foreground/60">{reviewer.score}/100</span>
              </div>
              <div className="px-3 py-2 space-y-2">
                {reviewer.summary && <p className="text-muted-foreground">{reviewer.summary}</p>}
                {reviewer.findings && reviewer.findings.length > 0 && (
                  <div className="space-y-1.5">
                    {reviewer.findings.map(f => {
                      const style = severityStyles[f.severity];
                      return (
                        <div key={f.id} className="flex items-start gap-2">
                          <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border shrink-0 mt-0.5", style.className)}>
                            {style.label}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground font-medium">{f.title}</p>
                            <p className="text-muted-foreground">{f.description}</p>
                            {f.filePath && (
                              <p className="text-[10px] text-muted-foreground/50 font-mono mt-0.5">
                                {f.filePath}{f.lineRange ? ` · ${f.lineRange}` : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    // ── 问题处理 ──
    ...(actionableIssues.length > 0 ? [{
      icon: <AlertTriangle size={14} />,
      title: "问题处理",
      status: (allIssuesResolved ? "done" : "active") as Section["status"],
      visible: true,
      content: (
        <div className="text-xs text-muted-foreground space-y-2">
          <p className="text-foreground font-medium">
            {actionableIssues.filter(i => issueDecisions[i.id]).length}/{actionableIssues.length} 个问题已处理
          </p>
          {actionableIssues.map(issue => {
            const decision = issueDecisions[issue.id];
            const decLabel = decision === "ai-fix" ? "同意 AI 修复" : decision === "skip" ? "跳过" : decision === "manual" ? "手动处理" : decision === "other" ? "其他" : null;
            return (
              <div key={issue.id} className="flex items-center gap-2">
                <CheckCircle2 size={11} className={decision ? "text-green-500" : "text-muted-foreground/30"} />
                <span className={cn("text-[11px]", decision ? "text-foreground" : "text-muted-foreground/50")}>{issue.title}</span>
                {decLabel && <span className="text-[10px] text-muted-foreground/50 ml-auto">{decLabel}</span>}
              </div>
            );
          })}
          {!allIssuesResolved && (
            <p className="text-[10px] text-orange-500">👇 请在下方输入框区域处理各个问题</p>
          )}
        </div>
      ),
    }] : []),
    // ── 人工验收 ──
    {
      icon: <UserCheck size={14} />,
      title: "人工验收",
      status: acceptanceConfirmed ? "done" : allIssuesResolved ? "active" : "pending",
      visible: true,
      content: (
        <div className="text-xs text-muted-foreground space-y-3">
          {!allIssuesResolved ? (
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <Clock size={12} />
              <span>请先处理上方 Code Review 中的问题</span>
            </div>
          ) : !acceptanceConfirmed ? (
            <div className="space-y-2">
              <p className="text-foreground font-medium">等待人工验收</p>
              {[
                { label: "功能实现符合需求描述", checked: true },
                { label: "UI 交互与设计稿一致", checked: true },
                { label: "边界情况已覆盖", checked: true },
                { label: "Code Review 问题已处理", checked: allIssuesResolved },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 size={11} className={item.checked ? "text-green-500" : "text-muted-foreground/30"} />
                  <span className={item.checked ? "text-foreground" : "text-muted-foreground/50"}>{item.label}</span>
                </div>
              ))}
              <p className="text-[10px] text-orange-500">👇 请在下方输入框区域确认验收</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 size={12} />
              <span className="font-medium">人工验收通过</span>
            </div>
          )}
        </div>
      ),
    },
    // ── 合并主分支 ──
    {
      icon: <GitMerge size={14} />, title: "合并主分支",
      status: mergeApproved ? "done" : acceptanceConfirmed ? "active" : "pending",
      visible: acceptanceConfirmed,
      content: !mergeApproved ? (
        <div className="text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2">
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[11px]">{branchName}</code>
            <ArrowRight size={10} className="text-muted-foreground/50" />
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[11px]">main</code>
          </div>
          <p className="text-[10px] text-orange-500">👇 请在下方输入框区域确认合并</p>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2">
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[11px]">{branchName}</code>
            <ArrowRight size={10} className="text-muted-foreground/50" />
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[11px]">main</code>
          </div>
          <div className="rounded-md border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border-b border-border">
              <AlertTriangle size={11} className="text-orange-500" />
              <span className="text-foreground font-medium">合并冲突 · 1 个文件</span>
            </div>
            <div className="px-3 py-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <FileCode2 size={11} className="text-muted-foreground/60" />
                <span className="font-mono text-[11px] text-foreground">src/components/layout.tsx</span>
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-green-500 font-medium">
                  <CheckCircle2 size={10} /> 已解决
                </span>
              </div>
              <div className="px-2 py-1.5 rounded bg-card font-mono text-[10px] space-y-0.5">
                <div className="text-red-400">- {'<div className="flex gap-4">'}</div>
                <div className="text-green-500">+ {'<div className="flex gap-3 items-center">'}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <CheckCircle2 size={11} className="text-green-500" />
            <span className="text-foreground">合并完成</span>
            <span className="text-muted-foreground/40 font-mono text-[10px] ml-auto">commit: a3f7b2c</span>
          </div>
        </div>
      ),
    },
    // ── 全流程回归测试 ──
    {
      icon: <ShieldCheck size={14} />, title: "全流程回归测试",
      status: mergeApproved ? "done" : "pending",
      visible: mergeApproved,
      content: (
        <div className="text-xs text-muted-foreground space-y-2">
          <p className="text-foreground font-medium">合并后回归测试 · 全部通过</p>
          {[
            { category: "单元测试", passed: 48, total: 48, time: "3.2s" },
            { category: "集成测试", passed: 12, total: 12, time: "8.7s" },
            { category: "E2E 测试", passed: 6, total: 6, time: "24.1s" },
          ].map((cat, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 size={11} className={cat.passed === cat.total ? "text-green-500" : "text-destructive"} />
              <span className="text-foreground">{cat.category}</span>
              <span className="text-muted-foreground/50">{cat.passed}/{cat.total}</span>
              <span className="text-muted-foreground/40 ml-auto text-[10px]">{cat.time}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1 text-green-500">
            <ShieldCheck size={12} />
            <span className="font-medium">回归测试全部通过，代码已合并至主分支</span>
          </div>
        </div>
      ),
    },
  ];

  const visibleSections = sections.filter(s => s.visible);

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold text-foreground">开发过程</h3>
        <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:bg-secondary transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-auto px-4 py-4">
        {visibleSections.map((section, i) => (
          <div key={i} className="relative flex gap-3">
            {i < visibleSections.length - 1 && (
              <div className="absolute left-3 top-6 bottom-0 w-px bg-border" />
            )}
            <div className={cn(
              "relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0",
              section.status === "done" ? "bg-primary/10 text-primary"
                : section.status === "active" ? "bg-orange-500/10 text-orange-500 ring-2 ring-orange-500/20"
                : "bg-muted text-muted-foreground/40"
            )}>
              {section.icon}
            </div>
            <div className="flex-1 min-w-0 pb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-foreground">{section.title}</span>
                {section.status === "done" && <CheckCircle2 size={12} className="text-primary/60" />}
                {section.status === "active" && <Clock size={12} className="text-orange-500 animate-pulse" />}
                {section.status === "pending" && <Clock size={12} className="text-muted-foreground/30" />}
              </div>
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DevProcessDetailPanel;
