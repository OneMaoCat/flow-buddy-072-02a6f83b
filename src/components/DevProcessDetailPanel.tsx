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
                      <img
                        src={mockPreviewImg}
                        alt={`步骤 ${i + 1}: ${s.description}`}
                        className="w-full h-48 object-cover object-top"
                      />
                      <div className="absolute inset-0 bg-background/20" />
                      <div
                        className="absolute z-10"
                        style={{ left: `${s.indicatorX}%`, top: `${s.indicatorY}%`, transform: "translate(-50%, -50%)" }}
                      >
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

/* ── Review Issue Decision Card Carousel ── */
type IssueDecision = "ai-fix" | "skip" | "manual" | "other";
const decisionOptions: { value: IssueDecision; label: string; icon: React.ReactNode }[] = [
  { value: "ai-fix", label: "同意 AI 修复", icon: <Wrench size={11} /> },
  { value: "skip", label: "跳过", icon: <SkipForward size={11} /> },
  { value: "manual", label: "手动处理", icon: <Hand size={11} /> },
];

const severityStyles: Record<FindingSeverity, { label: string; className: string }> = {
  critical: { label: "严重", className: "text-destructive bg-destructive/10 border-destructive/20" },
  warning: { label: "警告", className: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
  suggestion: { label: "建议", className: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  praise: { label: "优秀", className: "text-green-500 bg-green-500/10 border-green-500/20" },
};

interface IssueCarouselProps {
  issues: AIReviewFinding[];
  decisions: Record<string, IssueDecision>;
  otherTexts: Record<string, string>;
  onDecide: (id: string, decision: IssueDecision) => void;
  onOtherText: (id: string, text: string) => void;
}

const ReviewIssueCarousel = ({ issues, decisions, otherTexts, onDecide, onOtherText }: IssueCarouselProps) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const current = issues[currentIdx];
  const total = issues.length;
  const resolvedCount = issues.filter(i => decisions[i.id]).length;

  // AI suggested fix text per issue (mock)
  const suggestedFixes: Record<string, string> = {
    f3: "将密码最低要求提升至 8 位 + 大小写字母 + 数字，并增加特殊字符可选提示",
    f7: "移除 LoginForm.tsx 第 42 行的 console.log 语句",
    f2: "将 emailRegex 提取到 src/utils/validators.ts 并导出为常量",
    f5: "为 FormErrorTip 组件添加 role='alert' 和 aria-live='polite'",
    f8: "为提交按钮增加 300ms 防抖处理，使用 lodash.debounce",
  };

  return (
    <div className="text-xs space-y-2">
      <p className="text-foreground font-medium">
        {resolvedCount}/{total} 个问题已处理
      </p>
      {/* Slide indicator */}
      <div className="flex items-center gap-1">
        {issues.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIdx(i)}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              i === currentIdx ? "bg-primary w-6" : decisions[issues[i].id] ? "bg-primary/40 w-3" : "bg-border w-3"
            )}
          />
        ))}
        <span className="ml-auto text-[10px] text-muted-foreground">{currentIdx + 1} / {total}</span>
      </div>

      {/* Card */}
      <div className="rounded-md border border-border overflow-hidden bg-card">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
          <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border shrink-0", severityStyles[current.severity].className)}>
            {severityStyles[current.severity].label}
          </span>
          <span className="text-foreground font-medium truncate">{current.title}</span>
        </div>
        <div className="px-3 py-2 space-y-2">
          <p className="text-muted-foreground">{current.description}</p>
          {current.filePath && (
            <p className="text-[10px] text-muted-foreground/50 font-mono">
              {current.filePath}{current.lineRange ? ` · ${current.lineRange}` : ""}
            </p>
          )}
          {suggestedFixes[current.id] && (
            <div className="rounded-md bg-primary/5 border border-primary/10 px-3 py-2">
              <p className="text-[10px] text-primary font-medium mb-0.5">💡 AI 建议修复</p>
              <p className="text-muted-foreground">{suggestedFixes[current.id]}</p>
            </div>
          )}
          {/* Decision options */}
          <div className="flex flex-col gap-1 pt-1">
            {decisionOptions.map(opt => {
              const selected = decisions[current.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onDecide(current.id, opt.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-150 border flex items-center gap-2",
                    selected
                      ? "bg-primary/10 border-primary text-foreground font-medium"
                      : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {opt.icon}
                  {opt.label}
                  {selected && <CheckCircle2 size={11} className="text-primary ml-auto" />}
                </button>
              );
            })}
            {/* Other option */}
            <button
              onClick={() => onDecide(current.id, "other")}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-150 border flex items-center gap-2",
                decisions[current.id] === "other"
                  ? "bg-primary/10 border-primary text-foreground font-medium"
                  : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Pencil size={11} />
              其他
              {decisions[current.id] === "other" && <CheckCircle2 size={11} className="text-primary ml-auto" />}
            </button>
            {decisions[current.id] === "other" && (
              <textarea
                value={otherTexts[current.id] || ""}
                onChange={e => onOtherText(current.id, e.target.value)}
                placeholder="请输入您的处理方案..."
                className="w-full mt-1 px-3 py-2 rounded-lg text-xs border border-border bg-background text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                rows={2}
              />
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentIdx(i => i - 1)}
          disabled={currentIdx === 0}
          className="gap-1 text-xs h-7"
        >
          <ChevronLeft size={12} /> 上一个
        </Button>
        {currentIdx < total - 1 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIdx(i => i + 1)}
            className="gap-1 text-xs h-7"
          >
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
}

const DevProcessDetailPanel = ({ result, onClose }: DevProcessDetailPanelProps) => {
  const totalAdds = result.files.reduce((s, f) => s + f.additions, 0);
  const totalDels = result.files.reduce((s, f) => s + f.deletions, 0);
  const passedTests = result.tests.filter((t) => t.passed).length;
  const branchName = `feature/req-${result.id.slice(0, 8)}`;

  // Review data (stable across renders)
  const review = useMemo(() => buildMockAIReview(), []);

  // Extract actionable issues (critical + warning)
  const actionableIssues = useMemo(() => {
    const all: AIReviewFinding[] = [];
    review.aiReviewers?.forEach(r => {
      r.findings?.forEach(f => {
        if (f.severity === "critical" || f.severity === "warning") all.push(f);
      });
    });
    return all;
  }, [review]);

  // Interactive state
  const [issueDecisions, setIssueDecisions] = useState<Record<string, IssueDecision>>({});
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [mergeApproved, setMergeApproved] = useState(false);

  const allIssuesResolved = actionableIssues.length === 0 || actionableIssues.every(i => issueDecisions[i.id]);

  const handleDecide = (id: string, decision: IssueDecision) => {
    setIssueDecisions(prev => ({ ...prev, [id]: decision }));
  };

  type Section = {
    icon: React.ReactNode;
    title: string;
    content: React.ReactNode;
    status: "done" | "pending" | "active";
    visible: boolean;
  };

  const sections: Section[] = [
    {
      icon: <GitBranch size={14} />,
      title: "拉取分支",
      status: "done",
      visible: true,
      content: (
        <div className="text-xs text-muted-foreground">
          <p>创建开发分支 <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[11px]">{branchName}</code></p>
          <p className="mt-1">基于 <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[11px]">main</code> 分支拉取，确保代码基线最新。</p>
        </div>
      ),
    },
    {
      icon: <Search size={14} />,
      title: "分析需求",
      status: "done",
      visible: true,
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
      icon: <Sparkles size={14} />,
      title: "制定方案",
      status: "done",
      visible: true,
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
      icon: <Code2 size={14} />,
      title: "编写代码",
      status: "done",
      visible: true,
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
      icon: <Pencil size={14} />,
      title: "修改代码",
      status: "done",
      visible: true,
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
                  <div
                    key={li}
                    className={
                      line.type === "add" ? "text-green-500"
                        : line.type === "del" ? "text-red-400 line-through"
                        : "text-muted-foreground/60"
                    }
                  >
                    {line.type === "add" ? "+ " : line.type === "del" ? "- " : "  "}
                    {line.content}
                  </div>
                ))}
                {f.lines.length > 6 && (
                  <div className="text-muted-foreground/40 mt-1">... 还有 {f.lines.length - 6} 行</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <TestTube2 size={14} />,
      title: "运行测试",
      status: "done",
      visible: true,
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
      icon: <MonitorPlay size={14} />,
      title: "UI 测试",
      status: "done",
      visible: true,
      content: <UITestProcessLog />,
    },
    {
      icon: <Shield size={14} />,
      title: "AI Code Review",
      status: "done",
      visible: true,
      content: (() => {
        return (
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
        );
      })(),
    },
    // ── 问题处理 (Review Issue Resolution) ──
    ...(actionableIssues.length > 0 ? [{
      icon: <AlertTriangle size={14} />,
      title: "问题处理",
      status: (allIssuesResolved ? "done" : "active") as Section["status"],
      visible: true,
      content: (
        <ReviewIssueCarousel
          issues={actionableIssues}
          decisions={issueDecisions}
          otherTexts={otherTexts}
          onDecide={handleDecide}
          onOtherText={(id, text) => setOtherTexts(prev => ({ ...prev, [id]: text }))}
        />
      ),
    }] : []),
    // ── 人工验收 (Human Acceptance Gate) ──
    {
      icon: <UserCheck size={14} />,
      title: "人工验收",
      status: mergeApproved ? "done" : allIssuesResolved ? "active" : "pending",
      visible: true,
      content: (
        <div className="text-xs text-muted-foreground space-y-3">
          {!allIssuesResolved ? (
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <Clock size={12} />
              <span>请先处理上方 Code Review 中的问题</span>
            </div>
          ) : !mergeApproved ? (
            <>
              <div className="space-y-2">
                <p className="text-foreground font-medium">请确认以下验收项：</p>
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
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-foreground font-medium">确认将分支合并到主分支？</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setMergeApproved(true)}
                  className="gap-1.5 text-xs h-8"
                >
                  <GitMerge size={12} />
                  确认合并主分支
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 size={12} />
              <span className="font-medium">已确认合并，正在执行后续流程...</span>
            </div>
          )}
        </div>
      ),
    },
    // ── 合并主分支 (Merge to Main) ──
    {
      icon: <GitMerge size={14} />,
      title: "合并主分支",
      status: mergeApproved ? "done" : "pending",
      visible: mergeApproved,
      content: (
        <div className="text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2">
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[11px]">{branchName}</code>
            <ArrowRight size={10} className="text-muted-foreground/50" />
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[11px]">main</code>
          </div>
          {/* Mock conflict resolution */}
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
    // ── 全流程回归测试 (Full Regression Testing) ──
    {
      icon: <ShieldCheck size={14} />,
      title: "全流程回归测试",
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
        <button
          onClick={onClose}
          className="p-1 rounded-md text-muted-foreground hover:bg-secondary transition-colors"
        >
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
