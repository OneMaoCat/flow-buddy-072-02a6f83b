import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  ThumbsUp,
  ChevronDown,
  Loader2,
  FileCode2,
  Shield,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewInfo, AIModelReviewer, AIReviewFinding, FindingSeverity } from "@/data/reviewTypes";

const severityConfig: Record<FindingSeverity, { label: string; icon: React.ReactNode; className: string; barClass: string }> = {
  critical: { label: "严重", icon: <AlertCircle size={11} />, className: "text-foreground", barClass: "bg-foreground" },
  warning: { label: "警告", icon: <AlertTriangle size={11} />, className: "text-foreground/70", barClass: "bg-foreground/50" },
  suggestion: { label: "建议", icon: <Lightbulb size={11} />, className: "text-muted-foreground", barClass: "bg-muted-foreground/60" },
  praise: { label: "优点", icon: <ThumbsUp size={11} />, className: "text-foreground/40", barClass: "bg-foreground/20" },
};

/* ─── Animated Score Ring ─── */
const ScoreRing = ({ score, size = 48, strokeWidth = 3 }: { score: number; size?: number; strokeWidth?: number }) => {
  const [displayed, setDisplayed] = useState(0);
  const r = (size - strokeWidth * 2) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (displayed / 100) * c;

  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 900;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setDisplayed(Math.round(ease * score));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={strokeWidth} className="stroke-border" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          className="stroke-foreground/50 transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("font-bold text-foreground tabular-nums", size >= 56 ? "text-base" : size >= 40 ? "text-sm" : "text-[10px]")}>{displayed}</span>
      </div>
    </div>
  );
};

/* ─── Finding Row ─── */
const FindingRow = ({ finding }: { finding: AIReviewFinding }) => {
  const cfg = severityConfig[finding.severity];
  return (
    <div className="flex items-stretch gap-0 group">
      <div className={cn("w-0.5 shrink-0 rounded-full my-0.5", cfg.barClass)} />
      <div className="flex-1 min-w-0 pl-3 py-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn("shrink-0", cfg.className)}>{cfg.icon}</span>
          <span className="text-[11px] font-semibold text-foreground">{finding.title}</span>
          <Badge variant="outline" className={cn("text-[8px] h-3.5 px-1 border-border font-medium", cfg.className)}>
            {cfg.label}
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{finding.description}</p>
        {finding.filePath && (
          <p className="text-[9px] text-muted-foreground/50 mt-1 font-mono flex items-center gap-1">
            <FileCode2 size={8} />
            {finding.filePath}
            {finding.lineRange && <span className="text-foreground/30">{finding.lineRange}</span>}
          </p>
        )}
      </div>
    </div>
  );
};

/* ─── Running: Model Progress Card ─── */
const RunningModelCard = ({ reviewer, index }: { reviewer: AIModelReviewer; index: number }) => {
  const progress = reviewer.progress ?? (reviewer.status === "done" ? 100 : reviewer.status === "reviewing" ? 50 : 0);
  const statusLabel = reviewer.status === "done" ? "完成" : reviewer.status === "reviewing" ? "分析中…" : "等待中";

  return (
    <div
      className={cn(
        "flex-1 min-w-0 rounded-xl border bg-card p-4 flex flex-col items-center gap-3 transition-all duration-500",
        "animate-fade-in",
        reviewer.status === "reviewing" && "border-foreground/15 shadow-[0_0_20px_-5px_hsl(var(--foreground)/0.06)]",
        reviewer.status === "done" && "border-foreground/10",
        reviewer.status === "pending" && "opacity-50"
      )}
      style={{ animationDelay: `${index * 120}ms`, animationFillMode: "backwards" }}
    >
      <span className="text-2xl">{reviewer.icon}</span>
      <span className="text-xs font-semibold text-foreground tracking-tight">{reviewer.displayName}</span>

      {reviewer.status === "done" && reviewer.score !== undefined ? (
        <ScoreRing score={reviewer.score} size={44} />
      ) : (
        <div className="w-full space-y-1.5 px-2">
          <div className="w-full h-1 rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 bg-foreground/30",
                reviewer.status === "reviewing" && "animate-pulse"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center tabular-nums">{progress}%</p>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {reviewer.status === "done" ? (
          <CheckCircle2 size={11} className="text-foreground/30" />
        ) : reviewer.status === "reviewing" ? (
          <Loader2 size={11} className="text-foreground/40 animate-spin" />
        ) : (
          <div className="w-2.5 h-2.5 rounded-full border border-muted-foreground/20" />
        )}
        <span className="text-[10px] text-muted-foreground">{statusLabel}</span>
      </div>
    </div>
  );
};

/* ─── Done: Model Report Card ─── */
const DoneModelCard = ({ reviewer, index }: { reviewer: AIModelReviewer; index: number }) => {
  const [expanded, setExpanded] = useState(index === 0); // first model expanded by default
  const findings = reviewer.findings || [];
  const criticalCount = findings.filter(f => f.severity === "critical").length;
  const warningCount = findings.filter(f => f.severity === "warning").length;

  return (
    <div
      className={cn(
        "w-full rounded-xl border transition-all duration-500 overflow-hidden",
        "animate-fade-in",
        criticalCount > 0 ? "border-foreground/15" : "border-border"
      )}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
    >
      {/* Header — clickable to toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
      >
        <span className="text-lg shrink-0">{reviewer.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-foreground">{reviewer.displayName}</span>
            {/* Inline severity counts */}
            <div className="flex items-center gap-1.5">
              {criticalCount > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-foreground/10 text-foreground font-medium">
                  {criticalCount} 严重
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-foreground/5 text-foreground/60 font-medium">
                  {warningCount} 警告
                </span>
              )}
            </div>
          </div>
          {reviewer.summary && (
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{reviewer.summary}</p>
          )}
        </div>
        {reviewer.score !== undefined && (
          <ScoreRing score={reviewer.score} size={36} strokeWidth={2.5} />
        )}
        <ChevronRight size={14} className={cn(
          "text-muted-foreground/40 transition-transform duration-200 shrink-0",
          expanded && "rotate-90"
        )} />
      </button>

      {/* Findings — collapsible */}
      {expanded && findings.length > 0 && (
        <div className="border-t border-border/50 px-4 py-2 space-y-0">
          {findings
            .sort((a, b) => {
              const order: FindingSeverity[] = ["critical", "warning", "suggestion", "praise"];
              return order.indexOf(a.severity) - order.indexOf(b.severity);
            })
            .map(f => (
              <FindingRow key={f.id} finding={f} />
            ))}
        </div>
      )}

      {/* Collapsed summary */}
      {!expanded && findings.length > 0 && (
        <div className="border-t border-border/30 px-4 py-1.5">
          <p className="text-[9px] text-muted-foreground/60">{findings.length} 条发现</p>
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─── */
interface CodeReviewTabProps {
  review: ReviewInfo;
  onUpdateReview: (review: ReviewInfo) => void;
}

const CodeReviewTab = ({ review }: CodeReviewTabProps) => {
  const aiReviewers = review.aiReviewers || [];
  const isRunning = review.aiReviewStatus === "running";
  const isDone = review.aiReviewStatus === "done";

  const allFindings = aiReviewers.flatMap(r => r.findings || []);
  const criticalCount = allFindings.filter(f => f.severity === "critical").length;
  const warningCount = allFindings.filter(f => f.severity === "warning").length;
  const suggestionCount = allFindings.filter(f => f.severity === "suggestion").length;
  const praiseCount = allFindings.filter(f => f.severity === "praise").length;

  /* ── Running State ── */
  if (isRunning) {
    return (
      <div className="flex flex-col h-full p-5 gap-5">
        <div className="text-center space-y-1">
          <div className="flex items-center gap-2 justify-center">
            <Shield size={16} className="text-foreground/40 animate-pulse" />
            <p className="text-sm font-semibold text-foreground">AI Code Review</p>
          </div>
          <p className="text-[11px] text-muted-foreground">多个 AI 模型正在并行审查代码变更…</p>
        </div>
        <div className="flex gap-3 flex-1 min-h-0">
          {aiReviewers.map((r, i) => (
            <RunningModelCard key={r.id} reviewer={r} index={i} />
          ))}
        </div>
      </div>
    );
  }

  /* ── Done State ── */
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* ── Overview Header ── */}
        {isDone && (
          <div className="px-5 pt-5 pb-4 space-y-4">
            {/* Score + Title Row */}
            <div className="flex items-center gap-4">
              <ScoreRing score={review.overallScore || 0} size={56} strokeWidth={3} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">AI Code Review 报告</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {aiReviewers.length} 个模型并行审查完成
                </p>
              </div>
            </div>

            {/* Stats Strip */}
            <div className="flex items-center gap-3 flex-wrap">
              {criticalCount > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-medium text-foreground bg-foreground/[0.06] px-2 py-1 rounded-md">
                  <AlertCircle size={10} /> {criticalCount} 严重
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-medium text-foreground/70 bg-foreground/[0.04] px-2 py-1 rounded-md">
                  <AlertTriangle size={10} /> {warningCount} 警告
                </div>
              )}
              {suggestionCount > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                  <Lightbulb size={10} /> {suggestionCount} 建议
                </div>
              )}
              {praiseCount > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-medium text-foreground/40 bg-secondary/50 px-2 py-1 rounded-md">
                  <ThumbsUp size={10} /> {praiseCount} 优点
                </div>
              )}
            </div>

            {/* Severity Distribution — minimal dots */}
            <div className="flex gap-0.5 h-1">
              {allFindings
                .sort((a, b) => {
                  const order: FindingSeverity[] = ["critical", "warning", "suggestion", "praise"];
                  return order.indexOf(a.severity) - order.indexOf(b.severity);
                })
                .map((f, i) => (
                  <div
                    key={f.id}
                    className={cn("flex-1 rounded-full transition-all duration-500", severityConfig[f.severity].barClass)}
                    style={{ animationDelay: `${i * 50}ms` }}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Separator */}
        {isDone && <div className="mx-5 border-t border-border" />}

        {/* ── Model Report Cards ── */}
        <div className="p-5 space-y-3">
          {aiReviewers.map((r, i) => (
            <DoneModelCard key={r.id} reviewer={r} index={i} />
          ))}
        </div>
      </div>

      {/* ── Bottom Status Bar ── */}
      {isDone && (
        <div className="px-5 py-3 border-t border-border">
          <p className="text-[11px] text-muted-foreground text-center">
            {criticalCount > 0
              ? `发现 ${criticalCount} 个严重问题，建议在输入框中描述修改意见后重新开发`
              : "代码审查通过，可直接发布到测试环境"
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default CodeReviewTab;
