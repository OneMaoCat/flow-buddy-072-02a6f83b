import { useState } from "react";
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

const ScoreRing = ({ score, size = 48 }: { score: number; size?: number }) => {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 85 ? "text-emerald-500" : score >= 70 ? "text-amber-500" : "text-destructive";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3} className="stroke-border" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} className={cn("transition-all duration-1000", color.replace("text-", "stroke-"))} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("text-sm font-bold", color)}>{score}</span>
      </div>
    </div>
  );
};

const FindingItem = ({ finding }: { finding: AIReviewFinding }) => {
  const cfg = severityConfig[finding.severity];
  return (
    <div className="flex items-start gap-2.5 py-2 px-3 rounded-md hover:bg-accent/30 transition-colors">
      <div className={cn("mt-0.5 shrink-0", cfg.className)}>{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{finding.title}</span>
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", `${cfg.dotClass}/10 ${cfg.className}`)}>{cfg.label}</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{finding.description}</p>
        {finding.filePath && (
          <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono flex items-center gap-1">
            <FileCode2 size={10} />
            {finding.filePath}
            {finding.lineRange && <span className="text-primary/60">{finding.lineRange}</span>}
          </p>
        )}
      </div>
    </div>
  );
};

const ModelReviewSection = ({ reviewer }: { reviewer: AIModelReviewer }) => {
  const findingCounts = {
    critical: reviewer.findings?.filter((f) => f.severity === "critical").length || 0,
    warning: reviewer.findings?.filter((f) => f.severity === "warning").length || 0,
    suggestion: reviewer.findings?.filter((f) => f.severity === "suggestion").length || 0,
    praise: reviewer.findings?.filter((f) => f.severity === "praise").length || 0,
  };

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/30 transition-colors group/model">
        <span className="text-base">{reviewer.icon}</span>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">{reviewer.displayName}</span>
            {reviewer.status === "done" && reviewer.score !== undefined && (
              <Badge className={cn(
                "text-[10px] border-0",
                reviewer.score >= 85 ? "bg-emerald-500/10 text-emerald-500"
                  : reviewer.score >= 70 ? "bg-amber-500/10 text-amber-500"
                    : "bg-destructive/10 text-destructive"
              )}>
                {reviewer.score} 分
              </Badge>
            )}
          </div>
          {reviewer.summary && (
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{reviewer.summary}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {findingCounts.critical > 0 && <span className="text-[10px] text-destructive font-medium">{findingCounts.critical} 严重</span>}
          {findingCounts.warning > 0 && <span className="text-[10px] text-amber-500 font-medium">{findingCounts.warning} 警告</span>}
          <ChevronDown size={12} className="text-muted-foreground transition-transform group-data-[state=closed]/model:-rotate-90" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-1 border-l-2 border-border/50 pl-2 mt-1 space-y-0.5">
          {reviewer.findings?.map((f) => (
            <FindingItem key={f.id} finding={f} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface CodeReviewTabProps {
  review: ReviewInfo;
  onUpdateReview: (review: ReviewInfo) => void;
}

const CodeReviewTab = ({ review }: CodeReviewTabProps) => {
  const aiReviewers = review.aiReviewers || [];
  const isRunning = review.aiReviewStatus === "running";
  const isDone = review.aiReviewStatus === "done";

  const allFindings = aiReviewers.flatMap((r) => r.findings || []);
  const criticalCount = allFindings.filter((f) => f.severity === "critical").length;
  const warningCount = allFindings.filter((f) => f.severity === "warning").length;
  const suggestionCount = allFindings.filter((f) => f.severity === "suggestion").length;
  const praiseCount = allFindings.filter((f) => f.severity === "praise").length;

  if (isRunning) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
        <Shield size={32} className="text-primary animate-pulse" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground mb-1">AI Code Review 进行中…</p>
          <p className="text-xs text-muted-foreground">多个 AI 模型正在审查代码变更</p>
        </div>
        <div className="w-full max-w-xs space-y-2 mt-2">
          {aiReviewers.map((r) => (
            <div key={r.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-card border border-border">
              <span className="text-sm">{r.icon}</span>
              <span className="text-xs text-foreground flex-1">{r.displayName}</span>
              {r.status === "done" ? (
                <CheckCircle2 size={14} className="text-emerald-500" />
              ) : r.status === "reviewing" ? (
                <Loader2 size={14} className="text-primary animate-spin" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/20" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Overview header */}
        {isDone && (
          <div className="px-4 pt-4 pb-3 border-b border-border">
            <div className="flex items-center gap-4">
              <ScoreRing score={review.overallScore || 0} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-1">
                  AI Code Review 报告
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  {aiReviewers.length} 个模型审查完成
                </p>
                <div className="flex flex-wrap gap-2">
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
          </div>
        )}

        {/* Per-model review */}
        <div className="p-4 space-y-3">
          {aiReviewers.map((r) => (
            <ModelReviewSection key={r.id} reviewer={r} />
          ))}
        </div>
      </div>

      {/* Hint */}
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
