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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { ReviewInfo, AIModelReviewer, AIReviewFinding, FindingSeverity } from "@/data/reviewTypes";

const severityConfig: Record<FindingSeverity, { label: string; icon: React.ReactNode; className: string; dotClass: string }> = {
  critical: { label: "严重", icon: <AlertCircle size={12} />, className: "text-destructive", dotClass: "bg-destructive" },
  warning: { label: "警告", icon: <AlertTriangle size={12} />, className: "text-amber-500", dotClass: "bg-amber-500" },
  suggestion: { label: "建议", icon: <Lightbulb size={12} />, className: "text-blue-500", dotClass: "bg-blue-500" },
  praise: { label: "优点", icon: <ThumbsUp size={12} />, className: "text-emerald-500", dotClass: "bg-emerald-500" },
};

/* ─── Score Ring ─── */
const ScoreRing = ({ score, size = 48, animate = false }: { score: number; size?: number; animate?: boolean }) => {
  const [displayed, setDisplayed] = useState(animate ? 0 : score);
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (displayed / 100) * c;
  const color = displayed >= 85 ? "text-emerald-500" : displayed >= 70 ? "text-amber-500" : "text-destructive";

  useEffect(() => {
    if (!animate) { setDisplayed(score); return; }
    let frame: number;
    let start: number | null = null;
    const duration = 800;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setDisplayed(Math.round(p * score));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score, animate]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3} className="stroke-border" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} className={cn("transition-all duration-700", color.replace("text-", "stroke-"))} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("font-bold", color, size > 40 ? "text-sm" : "text-[10px]")}>{displayed}</span>
      </div>
    </div>
  );
};

/* ─── Finding Item ─── */
const FindingItem = ({ finding }: { finding: AIReviewFinding }) => {
  const cfg = severityConfig[finding.severity];
  return (
    <div className="flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-accent/30 transition-colors">
      <div className={cn("mt-0.5 shrink-0", cfg.className)}>{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-foreground">{finding.title}</span>
          <span className={cn("text-[9px] px-1 py-0.5 rounded-full font-medium", `${cfg.dotClass}/10 ${cfg.className}`)}>{cfg.label}</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{finding.description}</p>
        {finding.filePath && (
          <p className="text-[9px] text-muted-foreground/60 mt-0.5 font-mono flex items-center gap-1">
            <FileCode2 size={9} />
            {finding.filePath}
            {finding.lineRange && <span className="text-primary/60">{finding.lineRange}</span>}
          </p>
        )}
      </div>
    </div>
  );
};

/* ─── Progress Bar ─── */
const ReviewProgress = ({ progress, status }: { progress: number; status: string }) => (
  <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
    <div
      className={cn(
        "h-full rounded-full transition-all duration-500",
        status === "done" ? "bg-emerald-500" : "bg-primary",
        status === "reviewing" && "animate-pulse"
      )}
      style={{ width: `${progress}%` }}
    />
  </div>
);

/* ─── Severity Distribution Bar ─── */
const SeverityBar = ({ findings }: { findings: AIReviewFinding[] }) => {
  const total = findings.length || 1;
  const counts = {
    critical: findings.filter(f => f.severity === "critical").length,
    warning: findings.filter(f => f.severity === "warning").length,
    suggestion: findings.filter(f => f.severity === "suggestion").length,
    praise: findings.filter(f => f.severity === "praise").length,
  };
  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
      {counts.critical > 0 && <div className="bg-destructive transition-all duration-500" style={{ width: `${(counts.critical / total) * 100}%` }} />}
      {counts.warning > 0 && <div className="bg-amber-500 transition-all duration-500" style={{ width: `${(counts.warning / total) * 100}%` }} />}
      {counts.suggestion > 0 && <div className="bg-blue-500 transition-all duration-500" style={{ width: `${(counts.suggestion / total) * 100}%` }} />}
      {counts.praise > 0 && <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${(counts.praise / total) * 100}%` }} />}
    </div>
  );
};

/* ─── Running: Model Card ─── */
const RunningModelCard = ({ reviewer, index }: { reviewer: AIModelReviewer; index: number }) => {
  const progress = reviewer.progress ?? (reviewer.status === "done" ? 100 : reviewer.status === "reviewing" ? 50 : 0);
  const statusLabel = reviewer.status === "done" ? "完成" : reviewer.status === "reviewing" ? "审查中…" : "等待中";

  return (
    <div
      className={cn(
        "flex-1 min-w-0 rounded-xl border bg-card p-4 flex flex-col items-center gap-3 transition-all duration-500",
        "animate-fade-in",
        reviewer.status === "reviewing" && "border-primary/40 shadow-[0_0_12px_-3px_hsl(var(--primary)/0.3)]",
        reviewer.status === "done" && "border-emerald-500/30",
        reviewer.status === "pending" && "opacity-60"
      )}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
    >
      <span className="text-2xl">{reviewer.icon}</span>
      <span className="text-xs font-semibold text-foreground">{reviewer.displayName}</span>

      {reviewer.status === "done" && reviewer.score !== undefined ? (
        <ScoreRing score={reviewer.score} size={44} animate />
      ) : (
        <div className="w-full space-y-1.5">
          <ReviewProgress progress={progress} status={reviewer.status} />
          <p className="text-[10px] text-muted-foreground text-center">{progress}%</p>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {reviewer.status === "done" ? (
          <CheckCircle2 size={12} className="text-emerald-500" />
        ) : reviewer.status === "reviewing" ? (
          <Loader2 size={12} className="text-primary animate-spin" />
        ) : (
          <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/20" />
        )}
        <span className="text-[10px] text-muted-foreground">{statusLabel}</span>
      </div>
    </div>
  );
};

/* ─── Done: Model Report Card ─── */
const DoneModelCard = ({ reviewer, index }: { reviewer: AIModelReviewer; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const findings = reviewer.findings || [];
  const criticalCount = findings.filter(f => f.severity === "critical").length;
  const defaultVisible = 4;

  return (
    <div
      className={cn(
        "w-full rounded-xl border bg-card transition-all duration-500 overflow-hidden",
        "animate-fade-in",
        criticalCount > 0 ? "border-destructive/20" : "border-border"
      )}
      style={{ animationDelay: `${index * 120}ms`, animationFillMode: "backwards" }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-border/50">
        <span className="text-xl">{reviewer.icon}</span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground">{reviewer.displayName}</span>
          {reviewer.summary && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{reviewer.summary}</p>
          )}
        </div>
        {reviewer.score !== undefined && (
          <ScoreRing score={reviewer.score} size={40} animate />
        )}
      </div>

      {/* Findings */}
      <div className="px-3 py-2 space-y-0.5">
        {findings.slice(0, expanded ? findings.length : defaultVisible).map(f => (
          <FindingItem key={f.id} finding={f} />
        ))}
      </div>

      {/* Expand toggle */}
      {findings.length > defaultVisible && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 py-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors border-t border-border/50"
        >
          {expanded ? "收起" : `查看全部 ${findings.length} 条发现`}
          <ChevronDown size={10} className={cn("transition-transform duration-200", expanded && "rotate-180")} />
        </button>
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
      <div className="flex flex-col h-full p-4 gap-4">
        <div className="flex items-center gap-2 justify-center">
          <Shield size={18} className="text-primary animate-pulse" />
          <p className="text-sm font-semibold text-foreground">AI Code Review 并行审查中…</p>
        </div>
        <p className="text-[11px] text-muted-foreground text-center">多个 AI 模型正在同时审查代码变更</p>

        {/* Parallel cards */}
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
        {/* Overview */}
        {isDone && (
          <div className="px-4 pt-4 pb-3 border-b border-border space-y-3">
            <div className="flex items-center gap-4">
              <ScoreRing score={review.overallScore || 0} size={52} animate />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">AI Code Review 报告</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{aiReviewers.length} 个模型并行审查完成</p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {criticalCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-destructive">
                      <AlertCircle size={10} /> {criticalCount} 严重
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500">
                      <AlertTriangle size={10} /> {warningCount} 警告
                    </span>
                  )}
                  {suggestionCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-blue-500">
                      <Lightbulb size={10} /> {suggestionCount} 建议
                    </span>
                  )}
                  {praiseCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-500">
                      <ThumbsUp size={10} /> {praiseCount} 优点
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Severity distribution */}
            <SeverityBar findings={allFindings} />
          </div>
        )}

        {/* Three-column report cards */}
        <div className="p-4 space-y-3">
          {aiReviewers.map((r, i) => (
            <DoneModelCard key={r.id} reviewer={r} index={i} />
          ))}
        </div>
      </div>

      {/* Bottom hint */}
      {isDone && criticalCount > 0 && (
        <div className="px-4 py-3 border-t border-border bg-destructive/5">
          <p className="text-[11px] text-destructive/80 text-center">
            发现 {criticalCount} 个严重问题，建议在输入框中描述修改意见后重新开发
          </p>
        </div>
      )}
      {isDone && criticalCount === 0 && (
        <div className="px-4 py-3 border-t border-border bg-emerald-500/5">
          <p className="text-[11px] text-emerald-600 text-center">
            代码审查通过，可直接发布到测试环境
          </p>
        </div>
      )}
    </div>
  );
};

export default CodeReviewTab;
