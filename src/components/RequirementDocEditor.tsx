import { useState, useRef, useCallback } from "react";
import {
  FileText,
  Users,
  GitBranch,
  Workflow,
  ChevronRight,
  ImagePlus,
  UserPlus,
  X,
  Plus,
  Trash2,
  MessageCircle,
  ArrowLeft,
  MoreHorizontal,
  AtSign,
  Hash,
  GripVertical,
  Share2,
  Clock,
  CheckCircle2,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type {
  RequirementDocData,
  UserScenario,
  ChangePoint,
  FlowStep,
} from "./RequirementDoc";

/* ─── Types ─── */
interface Reviewer {
  id: string;
  name: string;
  avatar: string;
  email: string;
  status: "pending" | "approved" | "commented";
}

interface DocComment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
  resolved: boolean;
  section?: "background" | "scenarios" | "flowSteps" | "changePoints";
  suggestion?: string;
}

/* ─── Mock Data ─── */
const mockReviewers: Reviewer[] = [
  { id: "r1", name: "张三", avatar: "张", email: "zhang@example.com", status: "approved" },
  { id: "r2", name: "李四", avatar: "李", email: "li@example.com", status: "commented" },
];

const mockComments: DocComment[] = [
  { id: "cm1", author: "张三", avatar: "张", content: "邮箱验证规则建议增加对企业邮箱的支持", time: "10 分钟前", resolved: false, section: "background", suggestion: "当前系统的用户登录页面在表单验证方面存在若干问题，包括邮箱格式校验缺失、密码强度提示不明确、必填项未做前端拦截等。这些问题导致用户体验不佳，同时也增加了后端无效请求的处理压力。本次需求旨在全面修复登录表单验证逻辑，补充对企业邮箱格式的支持，并补充对应的单元测试以防止回归。" },
  { id: "cm2", author: "李四", avatar: "李", content: "流程图中缺少「忘记密码」的分支路径", time: "25 分钟前", resolved: false, section: "flowSteps", suggestion: "新增「忘记密码」步骤" },
  { id: "cm3", author: "张三", avatar: "张", content: "密码强度校验的正则已确认", time: "1 小时前", resolved: true },
  { id: "cm4", author: "李四", avatar: "李", content: "表单错误提示的文案已对齐设计稿", time: "2 小时前", resolved: true },
];

/* ─── Change type config ─── */
const changeTypeConfig = {
  add: { label: "新增", dot: "bg-emerald-500" },
  modify: { label: "修改", dot: "bg-amber-500" },
  delete: { label: "删除", dot: "bg-red-500" },
};

const reviewStatusConfig = {
  pending: { label: "待评审", className: "text-muted-foreground" },
  approved: { label: "已通过", className: "text-emerald-600" },
  commented: { label: "已评论", className: "text-amber-600" },
};

/* ─── Block-style editable text ─── */
const DocBlock = ({
  children,
  className,
  onAddImage,
}: {
  children: React.ReactNode;
  className?: string;
  onAddImage?: () => void;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn("group relative py-0.5", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Block actions - show on hover */}
      {hovered && (
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-0.5 rounded hover:bg-accent text-muted-foreground/40 hover:text-muted-foreground transition-colors">
            <Plus size={14} />
          </button>
          <button className="p-0.5 rounded hover:bg-accent text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-grab">
            <GripVertical size={14} />
          </button>
        </div>
      )}
      {children}
    </div>
  );
};

/* ─── Inline text area (doc-like) ─── */
const DocInput = ({
  value,
  onChange,
  placeholder,
  className,
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
}) => {
  const Tag = multiline ? "textarea" : "input";
  return (
    <Tag
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange(e.target.value)
      }
      placeholder={placeholder}
      rows={multiline ? 4 : undefined}
      className={cn(
        "w-full bg-transparent outline-none placeholder:text-muted-foreground/40 text-foreground",
        "border-none resize-none",
        multiline && "min-h-[80px]",
        className
      )}
    />
  );
};

/* ─── Heading Block ─── */
const HeadingBlock = ({
  level,
  icon,
  children,
}: {
  level: 2 | 3;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <DocBlock className="mt-8 mb-3 first:mt-0">
    <div className="flex items-center gap-2.5">
      <span className="text-muted-foreground/50">{icon}</span>
      <h2
        className={cn(
          "font-semibold text-foreground",
          level === 2 ? "text-lg" : "text-base"
        )}
      >
        {children}
      </h2>
    </div>
    <div className="mt-2 border-b border-border/50" />
  </DocBlock>
);

/* ─── Main Editor ─── */
interface RequirementDocEditorProps {
  data: RequirementDocData;
  onChange: (data: RequirementDocData) => void;
  onClose: () => void;
}

const RequirementDocEditor = ({ data, onChange, onClose }: RequirementDocEditorProps) => {
  const [doc, setDoc] = useState<RequirementDocData>(data);
  const [images, setImages] = useState<Map<string, string[]>>(new Map());
  const [reviewers, setReviewers] = useState<Reviewer[]>(mockReviewers);
  const [comments, setComments] = useState<DocComment[]>(mockComments);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  const update = useCallback(
    (partial: Partial<RequirementDocData>) => {
      const next = { ...doc, ...partial };
      setDoc(next);
      onChange(next);
    },
    [doc, onChange]
  );

  const updateScenario = (id: string, field: keyof UserScenario, value: string) => {
    update({ scenarios: doc.scenarios.map((s) => (s.id === id ? { ...s, [field]: value } : s)) });
  };

  const addScenario = () => {
    update({
      scenarios: [...doc.scenarios, { id: `s${Date.now()}`, actor: "", action: "", expectedResult: "" }],
    });
  };

  const removeScenario = (id: string) => {
    update({ scenarios: doc.scenarios.filter((s) => s.id !== id) });
  };

  const updateChangePoint = (id: string, field: keyof ChangePoint, value: string) => {
    update({ changePoints: doc.changePoints.map((c) => (c.id === id ? { ...c, [field]: value } : c)) });
  };

  const addChangePoint = () => {
    update({
      changePoints: [...doc.changePoints, { id: `c${Date.now()}`, module: "", description: "", type: "add" as const }],
    });
  };

  const removeChangePoint = (id: string) => {
    update({ changePoints: doc.changePoints.filter((c) => c.id !== id) });
  };

  const updateFlowStep = (id: string, label: string) => {
    update({ flowSteps: doc.flowSteps.map((f) => (f.id === id ? { ...f, label } : f)) });
  };

  const addFlowStep = () => {
    update({ flowSteps: [...doc.flowSteps, { id: `f${Date.now()}`, label: "" }] });
  };

  const removeFlowStep = (id: string) => {
    update({ flowSteps: doc.flowSteps.filter((f) => f.id !== id) });
  };

  const addImage = (section: string) => {
    const current = images.get(section) || [];
    setImages(new Map(images.set(section, [...current, `img_${Date.now()}`])));
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    setReviewers([
      ...reviewers,
      {
        id: `r${Date.now()}`,
        name: inviteEmail.split("@")[0],
        avatar: inviteEmail[0].toUpperCase(),
        email: inviteEmail,
        status: "pending",
      },
    ]);
    setInviteEmail("");
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments([
      ...comments,
      {
        id: `cm${Date.now()}`,
        author: "我",
        avatar: "我",
        content: newComment,
        time: "刚刚",
        resolved: false,
      },
    ]);
    setNewComment("");
  };

  const unresolvedCount = comments.filter((c) => !c.resolved).length;

  return (
    <div className="flex h-full bg-background">
      {/* Main document area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (Feishu-style) */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <FileText size={14} className="text-primary" />
            <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
              {doc.title || "未命名文档"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Reviewers avatars */}
            <div className="flex -space-x-1.5 mr-2">
              {reviewers.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className="w-6 h-6 rounded-full bg-accent border-2 border-background flex items-center justify-center text-[9px] font-medium text-accent-foreground"
                  title={`${r.name} · ${reviewStatusConfig[r.status].label}`}
                >
                  {r.avatar}
                </div>
              ))}
              {reviewers.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] text-muted-foreground">
                  +{reviewers.length - 3}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowComments(!showComments)}
              className={cn(
                "relative flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs transition-colors",
                showComments
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <MessageCircle size={14} />
              {unresolvedCount > 0 && (
                <span className="min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center px-1">
                  {unresolvedCount}
                </span>
              )}
            </button>

            <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <Share2 size={14} />
              <span>分享</span>
            </button>
          </div>
        </div>

        {/* Document canvas */}
        <ScrollArea className="flex-1">
          <div className="max-w-[720px] mx-auto px-12 py-10">
            {/* Document title */}
            <DocBlock>
              <DocInput
                value={doc.title}
                onChange={(v) => update({ title: v })}
                placeholder="输入文档标题..."
                className="text-[28px] font-bold leading-tight tracking-tight"
              />
            </DocBlock>

            {/* Meta info */}
            <div className="flex items-center gap-4 mt-2 mb-8 text-xs text-muted-foreground/60">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                刚刚更新
              </span>
              <span>·</span>
              <span>{reviewers.length} 位评审人</span>
              <span>·</span>
              <span>{doc.scenarios.length} 个用户场景</span>
            </div>

            {/* ──── 需求背景 ──── */}
            <HeadingBlock level={2} icon={<Hash size={16} />}>
              需求背景
            </HeadingBlock>
            <DocBlock>
              <DocInput
                value={doc.background}
                onChange={(v) => update({ background: v })}
                placeholder="描述需求的背景、目标和动机..."
                multiline
                className="text-sm leading-7 text-foreground/80"
              />
            </DocBlock>
            {/* Image insert */}
            {(images.get("background") || []).map((imgId) => (
              <ImageBlock key={imgId} />
            ))}
            <AddBlockButton
              onAddText={() => {}}
              onAddImage={() => addImage("background")}
            />

            {/* ──── 用户场景 ──── */}
            <HeadingBlock level={2} icon={<Users size={16} />}>
              用户场景
            </HeadingBlock>
            <div className="space-y-3">
              {doc.scenarios.map((s, i) => (
                <DocBlock key={s.id}>
                  <div className="group/card rounded-lg border border-border/60 bg-card/50 hover:border-border hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between px-4 pt-3 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground/50">
                          #{i + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">用户场景</span>
                      </div>
                      <button
                        onClick={() => removeScenario(s.id)}
                        className="p-1 rounded hover:bg-accent text-muted-foreground/30 hover:text-destructive opacity-0 group-hover/card:opacity-100 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="px-4 pb-3 space-y-1">
                      <div className="flex items-start">
                        <span className="text-[11px] text-muted-foreground/50 w-16 pt-1.5 shrink-0 select-none">
                          角色
                        </span>
                        <DocInput
                          value={s.actor}
                          onChange={(v) => updateScenario(s.id, "actor", v)}
                          placeholder="如：普通用户、管理员"
                          className="text-sm"
                        />
                      </div>
                      <div className="flex items-start">
                        <span className="text-[11px] text-muted-foreground/50 w-16 pt-1.5 shrink-0 select-none">
                          操作
                        </span>
                        <DocInput
                          value={s.action}
                          onChange={(v) => updateScenario(s.id, "action", v)}
                          placeholder="用户执行了什么操作..."
                          className="text-sm"
                        />
                      </div>
                      <div className="flex items-start">
                        <span className="text-[11px] text-muted-foreground/50 w-16 pt-1.5 shrink-0 select-none">
                          预期
                        </span>
                        <DocInput
                          value={s.expectedResult}
                          onChange={(v) => updateScenario(s.id, "expectedResult", v)}
                          placeholder="预期得到什么结果..."
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </DocBlock>
              ))}
            </div>
            <AddBlockButton
              label="添加场景"
              onAddText={addScenario}
              onAddImage={() => addImage("scenarios")}
            />

            {/* ──── 流程图 ──── */}
            <HeadingBlock level={2} icon={<Workflow size={16} />}>
              业务流程
            </HeadingBlock>
            <DocBlock>
              <div className="rounded-lg border border-border/60 bg-card/30 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {doc.flowSteps.map((step, i) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <div className="group/step relative">
                        <DocInput
                          value={step.label}
                          onChange={(v) => updateFlowStep(step.id, v)}
                          placeholder="步骤名称"
                          className="text-sm text-center rounded-lg border border-border bg-background px-4 py-2.5 min-w-[80px] hover:border-primary/30 focus:border-primary/50 transition-colors"
                        />
                        <button
                          onClick={() => removeFlowStep(step.id)}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center opacity-0 group-hover/step:opacity-100 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all"
                        >
                          <X size={8} />
                        </button>
                      </div>
                      {i < doc.flowSteps.length - 1 && (
                        <ChevronRight
                          size={14}
                          className="text-muted-foreground/30 shrink-0"
                        />
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addFlowStep}
                    className="rounded-lg border border-dashed border-border/60 px-4 py-2.5 text-sm text-muted-foreground/40 hover:border-primary/30 hover:text-muted-foreground transition-colors"
                  >
                    + 步骤
                  </button>
                </div>
              </div>
            </DocBlock>
            {(images.get("flow") || []).map((imgId) => (
              <ImageBlock key={imgId} />
            ))}
            <AddBlockButton
              onAddText={() => {}}
              onAddImage={() => addImage("flow")}
            />

            {/* ──── 需求变更点 ──── */}
            <HeadingBlock level={2} icon={<GitBranch size={16} />}>
              变更清单
            </HeadingBlock>
            <div className="space-y-1">
              {doc.changePoints.map((cp) => {
                const cfg = changeTypeConfig[cp.type];
                return (
                  <DocBlock key={cp.id}>
                    <div className="group/cp flex items-start gap-3 py-2 px-1 rounded-md hover:bg-accent/30 transition-colors">
                      {/* Type dot + selector */}
                      <div className="flex items-center gap-2 pt-1 shrink-0">
                        <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                        <select
                          value={cp.type}
                          onChange={(e) => updateChangePoint(cp.id, "type", e.target.value)}
                          className="text-[11px] text-muted-foreground bg-transparent outline-none cursor-pointer border-none p-0"
                        >
                          <option value="add">新增</option>
                          <option value="modify">修改</option>
                          <option value="delete">删除</option>
                        </select>
                      </div>
                      <div className="flex-1 min-w-0">
                        <DocInput
                          value={cp.module}
                          onChange={(v) => updateChangePoint(cp.id, "module", v)}
                          placeholder="模块/组件名称"
                          className="text-sm font-medium"
                        />
                        <DocInput
                          value={cp.description}
                          onChange={(v) => updateChangePoint(cp.id, "description", v)}
                          placeholder="变更内容描述..."
                          className="text-xs text-muted-foreground -mt-1"
                        />
                      </div>
                      <button
                        onClick={() => removeChangePoint(cp.id)}
                        className="p-1 rounded hover:bg-accent text-muted-foreground/20 hover:text-destructive opacity-0 group-hover/cp:opacity-100 transition-all shrink-0 mt-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </DocBlock>
                );
              })}
            </div>
            <AddBlockButton
              label="添加变更"
              onAddText={addChangePoint}
              onAddImage={() => addImage("changes")}
            />

            {/* Bottom spacing */}
            <div className="h-20" />
          </div>
        </ScrollArea>
      </div>

      {/* ──── Comment sidebar ──── */}
      {showComments && (
        <div className="w-[280px] border-l border-border flex flex-col shrink-0 bg-background">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 h-12 border-b border-border">
            <span className="text-sm font-medium text-foreground">评论与评审</span>
            <button
              onClick={() => setShowComments(false)}
              className="p-1 rounded hover:bg-accent text-muted-foreground transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-5">
              {/* Invite section */}
              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  邀请评审
                </p>
                <div className="flex gap-1.5">
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    placeholder="输入邮箱..."
                    className="flex-1 h-8 px-2.5 rounded-md border border-border bg-background text-xs placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-ring"
                  />
                  <Button size="sm" className="h-8 text-xs px-3" onClick={handleInvite}>
                    邀请
                  </Button>
                </div>
                {/* Reviewer pills */}
                <div className="mt-3 space-y-1.5">
                  {reviewers.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
                    >
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[9px] font-medium text-accent-foreground shrink-0">
                        {r.avatar}
                      </div>
                      <span className="text-xs text-foreground flex-1 truncate">
                        {r.name}
                      </span>
                      <span
                        className={cn(
                          "text-[10px]",
                          reviewStatusConfig[r.status].className
                        )}
                      >
                        {reviewStatusConfig[r.status].label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Comments - grouped */}
              <div>
                {/* Unresolved group */}
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-[11px] font-medium text-muted-foreground mb-3 uppercase tracking-wider hover:text-foreground transition-colors group/trigger">
                    <ChevronDown size={12} className="transition-transform group-data-[state=closed]/trigger:-rotate-90" />
                    未解决 ({comments.filter((c) => !c.resolved).length})
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-3 mb-4">
                      {comments.filter((c) => !c.resolved).map((c) => (
                        <div key={c.id} className="rounded-lg p-3 text-sm bg-accent/30">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[9px] font-medium text-accent-foreground">
                              {c.avatar}
                            </div>
                            <span className="text-xs font-medium text-foreground">{c.author}</span>
                            <span className="text-[10px] text-muted-foreground/50 ml-auto">{c.time}</span>
                          </div>
                          <p className="text-xs text-foreground/70 leading-relaxed">{c.content}</p>
                          {/* Suggestion preview */}
                          {c.suggestion && (
                            <div className="mt-2 px-2.5 py-2 rounded-md bg-primary/5 border border-primary/10">
                              <p className="text-[10px] text-muted-foreground mb-1">建议修改：</p>
                              <p className="text-[11px] text-foreground/60 leading-relaxed line-clamp-2">{c.suggestion}</p>
                            </div>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            {c.suggestion && (
                              <button
                                onClick={() => {
                                  // Apply suggestion to doc
                                  if (c.section === "background" && c.suggestion) {
                                    update({ background: c.suggestion });
                                  } else if (c.section === "flowSteps" && c.suggestion) {
                                    update({ flowSteps: [...doc.flowSteps, { id: `f${Date.now()}`, label: c.suggestion }] });
                                  }
                                  // Auto-resolve
                                  setComments(comments.map((cm) => cm.id === c.id ? { ...cm, resolved: true } : cm));
                                }}
                                className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-medium transition-colors"
                              >
                                <Sparkles size={11} />
                                采纳
                              </button>
                            )}
                            <button
                              onClick={() => setComments(comments.map((cm) => cm.id === c.id ? { ...cm, resolved: true } : cm))}
                              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <CheckCircle2 size={11} />
                              标为已解决
                            </button>
                          </div>
                        </div>
                      ))}
                      {comments.filter((c) => !c.resolved).length === 0 && (
                        <p className="text-xs text-muted-foreground/40 text-center py-3">暂无未解决评论</p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Resolved group */}
                {comments.filter((c) => c.resolved).length > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-[11px] font-medium text-muted-foreground mb-3 uppercase tracking-wider hover:text-foreground transition-colors group/trigger">
                      <ChevronDown size={12} className="transition-transform group-data-[state=closed]/trigger:-rotate-90" />
                      已解决 ({comments.filter((c) => c.resolved).length})
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-2">
                        {comments.filter((c) => c.resolved).map((c) => (
                          <div key={c.id} className="rounded-lg p-3 text-sm bg-muted/30 opacity-60">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[9px] font-medium text-accent-foreground">
                                {c.avatar}
                              </div>
                              <span className="text-xs font-medium text-foreground">{c.author}</span>
                              <CheckCircle2 size={11} className="text-emerald-500 ml-auto" />
                            </div>
                            <p className="text-xs text-foreground/50 leading-relaxed line-through decoration-muted-foreground/30">{c.content}</p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Comment input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-1.5">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="添加评论..."
                className="flex-1 h-8 px-2.5 rounded-md border border-border bg-background text-xs placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-ring"
              />
              <Button
                size="sm"
                className="h-8 text-xs px-3"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                发送
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Add Block Button ─── */
const AddBlockButton = ({
  label,
  onAddText,
  onAddImage,
}: {
  label?: string;
  onAddText: () => void;
  onAddImage: () => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative my-2 flex items-center gap-1 group/add">
      <div className="flex-1 border-t border-transparent group-hover/add:border-border/40 transition-colors" />
      <div className="flex items-center gap-1 opacity-0 group-hover/add:opacity-100 transition-opacity">
        <button
          onClick={() => {
            if (label) {
              onAddText();
            } else {
              setOpen(!open);
            }
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent transition-colors"
        >
          <Plus size={12} />
          {label || "添加"}
        </button>
        <button
          onClick={onAddImage}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent transition-colors"
        >
          <ImagePlus size={12} />
          原型图
        </button>
      </div>
      <div className="flex-1 border-t border-transparent group-hover/add:border-border/40 transition-colors" />
    </div>
  );
};

/* ─── Image placeholder block ─── */
const ImageBlock = () => (
  <DocBlock className="my-3">
    <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center py-8 gap-2 cursor-pointer">
      <div className="w-10 h-10 rounded-lg bg-accent/50 flex items-center justify-center">
        <ImagePlus size={18} className="text-muted-foreground/40" />
      </div>
      <p className="text-xs text-muted-foreground/50">点击上传或拖拽原型图到此处</p>
    </div>
  </DocBlock>
);

export default RequirementDocEditor;
