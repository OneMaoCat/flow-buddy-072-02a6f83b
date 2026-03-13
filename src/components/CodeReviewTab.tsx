import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Circle,
  XCircle,
  UserPlus,
  Send,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewInfo, Reviewer, ReviewComment } from "@/data/reviewTypes";
import { TEAM_MEMBERS, isReviewApproved } from "@/data/reviewTypes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CodeReviewTabProps {
  review: ReviewInfo;
  onUpdateReview: (review: ReviewInfo) => void;
}

const CodeReviewTab = ({ review, onUpdateReview }: CodeReviewTabProps) => {
  const [commentText, setCommentText] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const approved = isReviewApproved(review);
  const approvedCount = review.reviewers.filter((r) => r.status === "approved").length;
  const totalCount = review.reviewers.length;

  const addReviewer = (member: Reviewer) => {
    if (review.reviewers.some((r) => r.id === member.id)) return;
    onUpdateReview({
      ...review,
      reviewers: [...review.reviewers, { ...member, status: "pending" }],
    });
    setInviteOpen(false);
  };

  const removeReviewer = (id: string) => {
    onUpdateReview({
      ...review,
      reviewers: review.reviewers.filter((r) => r.id !== id),
    });
  };

  const mockApprove = (id: string) => {
    onUpdateReview({
      ...review,
      reviewers: review.reviewers.map((r) =>
        r.id === id ? { ...r, status: "approved" as const } : r
      ),
    });
  };

  const approveAll = () => {
    onUpdateReview({
      ...review,
      reviewers: review.reviewers.map((r) => ({ ...r, status: "approved" as const })),
    });
  };

  const requestChanges = () => {
    onUpdateReview({
      ...review,
      reviewers: review.reviewers.map((r) =>
        r.status === "pending" ? { ...r, status: "rejected" as const } : r
      ),
    });
  };

  const addComment = () => {
    if (!commentText.trim()) return;
    const comment: ReviewComment = {
      id: crypto.randomUUID(),
      author: "我",
      text: commentText.trim(),
      timestamp: Date.now(),
    };
    onUpdateReview({
      ...review,
      comments: [...review.comments, comment],
    });
    setCommentText("");
  };

  const availableMembers = TEAM_MEMBERS.filter(
    (m) => !review.reviewers.some((r) => r.id === m.id)
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-hide">
        {/* Status summary */}
        <div className="flex items-center gap-2">
          <Badge
            variant={approved ? "default" : "secondary"}
            className={cn(
              "text-[10px]",
              approved && "bg-green-500/15 text-green-500 border-0"
            )}
          >
            {approved
              ? "审查已通过 ✓"
              : `${approvedCount}/${totalCount} 已通过`}
          </Badge>
          {!approved && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock size={10} /> 等待审查中
            </span>
          )}
        </div>

        {/* Reviewer list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">审查人</p>
            <Popover open={inviteOpen} onOpenChange={setInviteOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2">
                  <UserPlus size={12} /> 邀请
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-1.5">
                {availableMembers.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">已邀请所有成员</p>
                ) : (
                  availableMembers.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => addReviewer(m)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs hover:bg-secondary transition-colors text-left"
                    >
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-foreground">
                        {m.name[0]}
                      </div>
                      {m.name}
                    </button>
                  ))
                )}
              </PopoverContent>
            </Popover>
          </div>

          <div className="rounded-md border border-border bg-card overflow-hidden">
            {review.reviewers.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2.5 px-3 py-2 border-b border-border last:border-0"
              >
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-foreground shrink-0">
                  {r.name[0]}
                </div>
                <span className="text-xs text-foreground flex-1">{r.name}</span>
                {r.status === "approved" ? (
                  <Badge className="text-[10px] bg-green-500/15 text-green-500 border-0 gap-1">
                    <CheckCircle2 size={10} /> 已通过
                  </Badge>
                ) : r.status === "rejected" ? (
                  <Badge className="text-[10px] bg-destructive/15 text-destructive border-0 gap-1">
                    <XCircle size={10} /> 已拒绝
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Circle size={8} className="text-muted-foreground" /> 待审
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">评论</p>
          {review.comments.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center">暂无评论</p>
          ) : (
            <div className="space-y-2">
              {review.comments.map((c) => (
                <div key={c.id} className="rounded-md border border-border p-2.5 bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-foreground">
                      {c.author[0]}
                    </div>
                    <span className="text-xs font-medium text-foreground">{c.author}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {new Date(c.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 pl-7">{c.text}</p>
                  {c.filePath && (
                    <p className="text-[10px] text-muted-foreground pl-7 mt-1 font-mono">{c.filePath}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar: approve + comment */}
      <div className="border-t border-border bg-muted/20">
        {/* Approve / Request Changes buttons */}
        {!approved && (
          <div className="flex items-center gap-2 px-3 pt-3">
            <Button
              size="sm"
              className="flex-1 gap-1.5 h-9 text-xs"
              onClick={approveAll}
            >
              <CheckCircle2 size={13} />
              审查通过
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs gap-1"
              onClick={requestChanges}
            >
              <XCircle size={12} />
              需要修改
            </Button>
          </div>
        )}

        {/* Comment input */}
        <div className="p-3">
          <div className="flex gap-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="添加审查评论…"
              className="min-h-[60px] text-xs resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addComment();
              }}
            />
            <Button
              size="sm"
              className="h-auto px-3"
              onClick={addComment}
              disabled={!commentText.trim()}
            >
              <Send size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeReviewTab;
