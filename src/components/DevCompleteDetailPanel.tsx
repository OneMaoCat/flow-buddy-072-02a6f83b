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
  Users,
  GitPullRequest,
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
}

const DevCompleteDetailPanel = ({
  result,
  onDeploy,
  onReject,
  onRequestReview,
  onClose,
  deployed,
  reviewing,
  reviewInfo,
  onUpdateReview,
}: DevCompleteDetailPanelProps) => {
  const totalAdds = result.files.reduce((s, f) => s + f.additions, 0);
  const totalDels = result.files.reduce((s, f) => s + f.deletions, 0);
  const passedTests = result.tests.filter((t) => t.passed).length;
  const approved = reviewInfo ? isReviewApproved(reviewInfo) : false;

  const statusBadge = deployed ? (
    <Badge className="text-[10px] bg-green-500/15 text-green-500 border-0">已发布</Badge>
  ) : approved ? (
    <Badge className="text-[10px] bg-green-500/15 text-green-500 border-0">审查通过</Badge>
  ) : reviewing ? (
    <Badge className="text-[10px] bg-amber-500/15 text-amber-600 border-0">审查中</Badge>
  ) : null;

  return (
    <div className="flex flex-col h-full bg-background">
      <Tabs defaultValue={reviewing ? "review" : "preview"} className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border shrink-0">
          <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
            <CheckCircle2 size={14} className="text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {result.requirementTitle}
            </p>
          </div>
          <TabsList className="h-8">
            <TabsTrigger value="preview" className="text-xs gap-1 h-7 px-2.5">
              <Eye size={12} /> 预览
            </TabsTrigger>
            {(reviewing || approved || deployed) && (
              <TabsTrigger value="review" className="text-xs gap-1 h-7 px-2.5">
                <Users size={12} /> 审查
              </TabsTrigger>
            )}
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

        {/* Preview */}
        <TabsContent value="preview" className="flex-1 min-h-0 m-0">
          <RequirementPreview
            previewPath={result.previewPath}
            requirementTitle={result.requirementTitle}
            projectId={result.projectId}
            fullscreen
          />
        </TabsContent>

        {/* Review */}
        <TabsContent value="review" className="flex-1 min-h-0 m-0">
          {reviewInfo && onUpdateReview ? (
            <CodeReviewTab
              review={reviewInfo}
              onUpdateReview={(updated) => onUpdateReview(result.id, updated)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              尚未发起审查
            </div>
          )}
        </TabsContent>

        {/* Diff */}
        <TabsContent value="diff" className="flex-1 min-h-0 m-0 overflow-y-auto scrollbar-hide">
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{result.files.length} 个文件变更</span>
              <span className="text-green-500">+{totalAdds}</span>
              <span className="text-destructive">-{totalDels}</span>
            </div>
            {result.files.map((f) => (
              <div key={f.path} className="rounded-md border border-border overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 border-b border-border">
                  <FileCode2 size={12} className="text-muted-foreground" />
                  <span className="text-xs font-mono text-foreground">{f.path}</span>
                  <span className="ml-auto text-[10px] text-green-500">+{f.additions}</span>
                  <span className="text-[10px] text-destructive">-{f.deletions}</span>
                </div>
                <div className="text-[11px] font-mono leading-5 bg-card">
                  {f.lines.map((l, i) => (
                    <div
                      key={i}
                      className={cn(
                        "px-3",
                        l.type === "add" && "bg-green-500/10 text-green-400",
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
                variant={passedTests === result.tests.length ? "default" : "destructive"}
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
                    <CheckCircle2 size={14} className="text-green-500 shrink-0" />
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

      {/* Action bar — state-dependent */}
      {!deployed && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-muted/20">
          {!reviewing ? (
            <>
              <Button
                size="sm"
                className="flex-1 gap-1.5 h-9 text-xs"
                onClick={() => onRequestReview(result.id)}
              >
                <GitPullRequest size={13} />
                发起 Code Review
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
          ) : approved ? (
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
          ) : (
            <>
              <Button
                size="sm"
                className="flex-1 gap-1.5 h-9 text-xs"
                disabled
              >
                <Rocket size={13} />
                发布到测试环境
              </Button>
              <span className="text-[10px] text-muted-foreground">
                {reviewInfo
                  ? `${reviewInfo.reviewers.filter((r) => r.status === "approved").length}/${reviewInfo.reviewers.length} 已通过`
                  : "等待审查"}
              </span>
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
          )}
        </div>
      )}
    </div>
  );
};

export default DevCompleteDetailPanel;
