import { useState, useRef, useCallback } from "react";
import {
  ChevronDown, ChevronRight, FileCode, Plus, MessageSquare, Send, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DiffFile, DiffComment, DiffLine } from "@/data/diffMock";

interface GitDiffViewerProps {
  files: DiffFile[];
}

// ---------- File Header ----------
const DiffFileHeader = ({
  file, collapsed, onToggle,
}: { file: DiffFile; collapsed: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center gap-2 px-3 py-2 bg-muted/60 border-b border-border hover:bg-muted/80 transition-colors sticky top-0 z-10"
  >
    {collapsed ? <ChevronRight size={14} className="text-muted-foreground shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
    <FileCode size={14} className="text-muted-foreground shrink-0" />
    <span className="text-xs font-mono font-medium text-foreground truncate">{file.path}</span>
    <span className="ml-auto flex items-center gap-2 shrink-0">
      <span className="text-[11px] font-mono text-green-600">+{file.additions}</span>
      <span className="text-[11px] font-mono text-red-500">-{file.deletions}</span>
    </span>
  </button>
);

// ---------- Inline Comment ----------
const InlineComment = ({ comment }: { comment: DiffComment }) => (
  <tr>
    <td colSpan={4} className="p-0">
      <div className="mx-3 my-1.5 rounded-lg border border-border bg-card p-2.5 flex items-start gap-2">
        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0", comment.color)}>
          {comment.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-foreground">{comment.author}</span>
            <span className="text-[10px] text-muted-foreground">{comment.createdAt}</span>
          </div>
          <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{comment.content}</p>
        </div>
      </div>
    </td>
  </tr>
);

// ---------- Comment Input ----------
const CommentInput = ({ onSubmit, onCancel }: { onSubmit: (text: string) => void; onCancel: () => void }) => {
  const [text, setText] = useState("");
  return (
    <tr>
      <td colSpan={4} className="p-0">
        <div className="mx-3 my-1.5 rounded-lg border border-primary/30 bg-card p-2.5 space-y-2">
          <Textarea
            placeholder="添加评论..."
            value={text}
            onChange={e => setText(e.target.value)}
            className="min-h-[50px] text-xs"
            autoFocus
          />
          <div className="flex items-center gap-2 justify-end">
            <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2" onClick={onCancel}>
              <X size={10} className="mr-1" /> 取消
            </Button>
            <Button
              size="sm"
              className="h-6 text-[11px] px-2 gap-1"
              disabled={!text.trim()}
              onClick={() => { onSubmit(text); setText(""); }}
            >
              <Send size={10} /> 提交
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
};

// ---------- Diff Line Row ----------
const DiffLineRow = ({
  line, index, commentingLine, onStartComment,
}: {
  line: DiffLine;
  index: number;
  commentingLine: number | null;
  onStartComment: (idx: number) => void;
}) => {
  const bgClass =
    line.type === "add" ? "bg-emerald-500/10" :
    line.type === "del" ? "bg-red-500/10" : "";

  const prefixClass =
    line.type === "add" ? "text-green-600" :
    line.type === "del" ? "text-red-500" : "text-muted-foreground";

  const prefix = line.type === "add" ? "+" : line.type === "del" ? "-" : " ";

  return (
    <tr className={cn("group hover:brightness-95 transition-all", bgClass)}>
      <td className="w-[14px] text-center relative">
        <button
          onClick={() => onStartComment(index)}
          className="absolute inset-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary"
          title="添加评论"
        >
          <Plus size={10} />
        </button>
      </td>
      <td className="w-[42px] text-right pr-1.5 select-none font-mono text-[11px] text-muted-foreground/60 border-r border-border/50">
        {line.oldLine ?? ""}
      </td>
      <td className="w-[42px] text-right pr-1.5 select-none font-mono text-[11px] text-muted-foreground/60 border-r border-border/50">
        {line.newLine ?? ""}
      </td>
      <td className="pl-2 pr-3">
        <span className={cn("font-mono text-[12px] whitespace-pre", prefixClass)}>
          {prefix} {line.content}
        </span>
      </td>
    </tr>
  );
};

// ---------- Single File Diff Block ----------
const DiffFileBlock = ({ file }: { file: DiffFile }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [commentingLine, setCommentingLine] = useState<number | null>(null);
  const [localComments, setLocalComments] = useState<DiffComment[]>(file.comments);

  const handleSubmitComment = useCallback((lineIndex: number, text: string) => {
    setLocalComments(prev => [...prev, {
      id: `new-${Date.now()}`,
      author: "我",
      avatar: "我",
      color: "bg-blue-500",
      content: text,
      createdAt: "刚刚",
      lineIndex,
    }]);
    setCommentingLine(null);
  }, []);

  // Build a map of comments by line index
  const commentsByLine = new Map<number, DiffComment[]>();
  for (const c of localComments) {
    const arr = commentsByLine.get(c.lineIndex) || [];
    arr.push(c);
    commentsByLine.set(c.lineIndex, arr);
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden mb-3">
      <DiffFileHeader file={file} collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {file.lines.map((line, i) => (
                <DiffLineGroup
                  key={i}
                  line={line}
                  index={i}
                  commentingLine={commentingLine}
                  onStartComment={setCommentingLine}
                  comments={commentsByLine.get(i)}
                  onSubmitComment={handleSubmitComment}
                  onCancelComment={() => setCommentingLine(null)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Line + its comments + optional comment input
const DiffLineGroup = ({
  line, index, commentingLine, onStartComment, comments, onSubmitComment, onCancelComment,
}: {
  line: DiffLine;
  index: number;
  commentingLine: number | null;
  onStartComment: (idx: number) => void;
  comments?: DiffComment[];
  onSubmitComment: (lineIndex: number, text: string) => void;
  onCancelComment: () => void;
}) => (
  <>
    <DiffLineRow line={line} index={index} commentingLine={commentingLine} onStartComment={onStartComment} />
    {comments?.map(c => <InlineComment key={c.id} comment={c} />)}
    {commentingLine === index && (
      <CommentInput
        onSubmit={(text) => onSubmitComment(index, text)}
        onCancel={onCancelComment}
      />
    )}
  </>
);

// ---------- Main Component ----------
const GitDiffViewer = ({ files }: GitDiffViewerProps) => {
  const totalAdditions = files.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = files.reduce((s, f) => s + f.deletions, 0);
  const totalComments = files.reduce((s, f) => s + f.comments.length, 0);

  const fileRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const scrollToFile = (path: string) => {
    fileRefs.current.get(path)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Summary bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/30 shrink-0 flex-wrap">
        <span className="text-xs font-medium text-foreground">{files.length} 个文件变更</span>
        <span className="text-[11px] font-mono text-green-600">+{totalAdditions}</span>
        <span className="text-[11px] font-mono text-red-500">-{totalDeletions}</span>
        {totalComments > 0 && (
          <Badge variant="outline" className="text-[10px] gap-1 px-1.5">
            <MessageSquare size={10} /> {totalComments} 条评论
          </Badge>
        )}
      </div>

      {/* File navigation */}
      <div className="px-4 py-2 border-b border-border bg-muted/20 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          {files.map(f => (
            <button
              key={f.path}
              onClick={() => scrollToFile(f.path)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap"
            >
              <FileCode size={11} />
              {f.path.split("/").pop()}
              <span className="text-green-600 ml-1">+{f.additions}</span>
              <span className="text-red-500">-{f.deletions}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Diff content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-0">
          {files.map(f => (
            <div key={f.path} ref={el => { if (el) fileRefs.current.set(f.path, el); }}>
              <DiffFileBlock file={f} />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default GitDiffViewer;
