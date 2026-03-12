import { useState, useRef } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type {
  RequirementDocData,
  UserScenario,
  ChangePoint,
  FlowStep,
} from "./RequirementDoc";

/* ─── Types ─── */
interface PrototypeImage {
  id: string;
  name: string;
  url: string; // placeholder or object URL
  section: string;
}

interface ReviewComment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
  section?: string;
}

interface Reviewer {
  id: string;
  name: string;
  avatar: string;
  email: string;
  status: "pending" | "approved" | "commented";
}

/* ─── Mock reviewers ─── */
const mockReviewers: Reviewer[] = [
  { id: "r1", name: "张三", avatar: "张", email: "zhang@example.com", status: "approved" },
  { id: "r2", name: "李四", avatar: "李", email: "li@example.com", status: "commented" },
];

const mockComments: ReviewComment[] = [
  {
    id: "cm1",
    author: "张三",
    avatar: "张",
    content: "邮箱验证规则建议增加对企业邮箱的支持",
    time: "10 分钟前",
    section: "需求背景",
  },
  {
    id: "cm2",
    author: "李四",
    avatar: "李",
    content: "流程图中缺少「忘记密码」的分支路径",
    time: "25 分钟前",
    section: "流程图",
  },
];

/* ─── Change type badge ─── */
const changeTypeConfig = {
  add: { label: "新增", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  modify: { label: "修改", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  delete: { label: "删除", className: "bg-red-500/10 text-red-600 border-red-500/20" },
};

const reviewStatusConfig = {
  pending: { label: "待评审", className: "bg-muted text-muted-foreground" },
  approved: { label: "已通过", className: "bg-emerald-500/10 text-emerald-600" },
  commented: { label: "已评论", className: "bg-amber-500/10 text-amber-600" },
};

/* ─── Section Header ─── */
const SectionHeader = ({
  icon,
  title,
  actions,
}: {
  icon: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    {actions}
  </div>
);

/* ─── Inline Editable Block ─── */
const InlineEdit = ({
  value,
  onChange,
  multiline = false,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
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
        "w-full rounded-lg border border-transparent bg-transparent px-3 py-2 text-sm text-foreground leading-relaxed",
        "hover:border-border focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-all",
        multiline && "resize-none min-h-[100px]",
        className
      )}
    />
  );
};

/* ─── Main Editor ─── */
interface RequirementDocEditorProps {
  data: RequirementDocData;
  onChange: (data: RequirementDocData) => void;
  onClose: () => void;
}

const RequirementDocEditor = ({ data, onChange, onClose }: RequirementDocEditorProps) => {
  const [doc, setDoc] = useState<RequirementDocData>(data);
  const [images, setImages] = useState<PrototypeImage[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>(mockReviewers);
  const [comments] = useState<ReviewComment[]>(mockComments);
  const [inviteEmail, setInviteEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "review">("edit");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (partial: Partial<RequirementDocData>) => {
    const next = { ...doc, ...partial };
    setDoc(next);
    onChange(next);
  };

  const updateScenario = (id: string, field: keyof UserScenario, value: string) => {
    update({ scenarios: doc.scenarios.map((s) => (s.id === id ? { ...s, [field]: value } : s)) });
  };

  const addScenario = () => {
    const newId = `s${Date.now()}`;
    update({
      scenarios: [
        ...doc.scenarios,
        { id: newId, actor: "", action: "", expectedResult: "" },
      ],
    });
  };

  const removeScenario = (id: string) => {
    update({ scenarios: doc.scenarios.filter((s) => s.id !== id) });
  };

  const updateChangePoint = (id: string, field: keyof ChangePoint, value: string) => {
    update({ changePoints: doc.changePoints.map((c) => (c.id === id ? { ...c, [field]: value } : c)) });
  };

  const addChangePoint = () => {
    const newId = `c${Date.now()}`;
    update({
      changePoints: [...doc.changePoints, { id: newId, module: "", description: "", type: "add" }],
    });
  };

  const removeChangePoint = (id: string) => {
    update({ changePoints: doc.changePoints.filter((c) => c.id !== id) });
  };

  const updateFlowStep = (id: string, label: string) => {
    update({ flowSteps: doc.flowSteps.map((f) => (f.id === id ? { ...f, label } : f)) });
  };

  const addFlowStep = () => {
    const newId = `f${Date.now()}`;
    update({ flowSteps: [...doc.flowSteps, { id: newId, label: "新步骤" }] });
  };

  const removeFlowStep = (id: string) => {
    update({ flowSteps: doc.flowSteps.filter((f) => f.id !== id) });
  };

  const handleImageUpload = (section: string) => {
    // Mock: create a placeholder image
    const newImg: PrototypeImage = {
      id: `img${Date.now()}`,
      name: `原型图_${images.length + 1}.png`,
      url: "",
      section,
    };
    setImages([...images, newImg]);
  };

  const removeImage = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    const newReviewer: Reviewer = {
      id: `r${Date.now()}`,
      name: inviteEmail.split("@")[0],
      avatar: inviteEmail[0].toUpperCase(),
      email: inviteEmail,
      status: "pending",
    };
    setReviewers([...reviewers, newReviewer]);
    setInviteEmail("");
  };

  const sectionImages = (section: string) => images.filter((img) => img.section === section);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">需求文档</p>
            <InlineEdit
              value={doc.title}
              onChange={(v) => update({ title: v })}
              className="font-semibold text-foreground -ml-3 -my-1 text-base"
            />
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Tab switch */}
          <div className="flex rounded-lg border border-border overflow-hidden mr-2">
            <button
              onClick={() => setActiveTab("edit")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === "edit"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              编辑
            </button>
            <button
              onClick={() => setActiveTab("review")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors relative",
                activeTab === "review"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              评审
              {comments.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[9px] text-destructive-foreground flex items-center justify-center font-bold">
                  {comments.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {activeTab === "edit" ? (
          <div className="p-5 space-y-6">
            {/* Background */}
            <div>
              <SectionHeader
                icon={<FileText size={14} className="text-primary" />}
                title="需求背景"
                actions={
                  <button
                    onClick={() => handleImageUpload("background")}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <ImagePlus size={12} />
                    插入原型图
                  </button>
                }
              />
              <InlineEdit
                value={doc.background}
                onChange={(v) => update({ background: v })}
                multiline
                placeholder="描述需求的背景和目标..."
              />
              {sectionImages("background").map((img) => (
                <ImagePlaceholder key={img.id} image={img} onRemove={() => removeImage(img.id)} />
              ))}
            </div>

            {/* User Scenarios */}
            <div>
              <SectionHeader
                icon={<Users size={14} className="text-primary" />}
                title="用户场景"
                actions={
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleImageUpload("scenarios")}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <ImagePlus size={12} />
                      插入原型图
                    </button>
                    <button
                      onClick={addScenario}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <Plus size={12} />
                      添加场景
                    </button>
                  </div>
                }
              />
              <div className="space-y-3">
                {doc.scenarios.map((s, i) => (
                  <div
                    key={s.id}
                    className="group rounded-lg border border-border bg-muted/20 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {i + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">用户场景</span>
                      </div>
                      <button
                        onClick={() => removeScenario(s.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary text-muted-foreground transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-12 shrink-0">角色</span>
                        <InlineEdit
                          value={s.actor}
                          onChange={(v) => updateScenario(s.id, "actor", v)}
                          placeholder="如：普通用户"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-12 shrink-0">操作</span>
                        <InlineEdit
                          value={s.action}
                          onChange={(v) => updateScenario(s.id, "action", v)}
                          placeholder="用户执行的操作..."
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-12 shrink-0">预期</span>
                        <InlineEdit
                          value={s.expectedResult}
                          onChange={(v) => updateScenario(s.id, "expectedResult", v)}
                          placeholder="预期结果..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {sectionImages("scenarios").map((img) => (
                <ImagePlaceholder key={img.id} image={img} onRemove={() => removeImage(img.id)} />
              ))}
            </div>

            {/* Flow Chart */}
            <div>
              <SectionHeader
                icon={<Workflow size={14} className="text-primary" />}
                title="流程图"
                actions={
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleImageUpload("flow")}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <ImagePlus size={12} />
                      插入原型图
                    </button>
                    <button
                      onClick={addFlowStep}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <Plus size={12} />
                      添加步骤
                    </button>
                  </div>
                }
              />
              <div className="flex flex-wrap items-center gap-1.5">
                {doc.flowSteps.map((step, i) => (
                  <div key={step.id} className="flex items-center gap-1.5">
                    <div className="group relative rounded-lg border border-border bg-muted/30 px-3 py-2">
                      <InlineEdit
                        value={step.label}
                        onChange={(v) => updateFlowStep(step.id, v)}
                        className="text-center min-w-[60px]"
                      />
                      <button
                        onClick={() => removeFlowStep(step.id)}
                        className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                    {i < doc.flowSteps.length - 1 && (
                      <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              {sectionImages("flow").map((img) => (
                <ImagePlaceholder key={img.id} image={img} onRemove={() => removeImage(img.id)} />
              ))}
            </div>

            {/* Change Points */}
            <div>
              <SectionHeader
                icon={<GitBranch size={14} className="text-primary" />}
                title="需求变更点"
                actions={
                  <button
                    onClick={addChangePoint}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <Plus size={12} />
                    添加变更
                  </button>
                }
              />
              <div className="space-y-2">
                {doc.changePoints.map((cp) => {
                  const badge = changeTypeConfig[cp.type];
                  return (
                    <div
                      key={cp.id}
                      className="group flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-4"
                    >
                      <select
                        value={cp.type}
                        onChange={(e) =>
                          updateChangePoint(cp.id, "type", e.target.value)
                        }
                        className={cn(
                          "mt-0.5 shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold bg-transparent cursor-pointer outline-none",
                          badge.className
                        )}
                      >
                        <option value="add">新增</option>
                        <option value="modify">修改</option>
                        <option value="delete">删除</option>
                      </select>
                      <div className="flex-1 min-w-0 space-y-1">
                        <InlineEdit
                          value={cp.module}
                          onChange={(v) => updateChangePoint(cp.id, "module", v)}
                          placeholder="模块名称"
                          className="font-medium"
                        />
                        <InlineEdit
                          value={cp.description}
                          onChange={(v) => updateChangePoint(cp.id, "description", v)}
                          placeholder="变更描述..."
                          className="text-muted-foreground text-xs"
                        />
                      </div>
                      <button
                        onClick={() => removeChangePoint(cp.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary text-muted-foreground transition-all shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Review Tab */
          <div className="p-5 space-y-6">
            {/* Invite Reviewers */}
            <div>
              <SectionHeader
                icon={<UserPlus size={14} className="text-primary" />}
                title="邀请评审"
              />
              <div className="flex gap-2 mb-4">
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  placeholder="输入邮箱邀请评审人..."
                  className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                />
                <Button size="sm" className="h-9" onClick={handleInvite}>
                  邀请
                </Button>
              </div>

              {/* Reviewer list */}
              <div className="space-y-2">
                {reviewers.map((r) => {
                  const status = reviewStatusConfig[r.status];
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-muted/20"
                    >
                      <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-medium text-accent-foreground shrink-0">
                        {r.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{r.email}</p>
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-medium shrink-0",
                          status.className
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comments */}
            <div>
              <SectionHeader
                icon={<MessageCircle size={14} className="text-primary" />}
                title={`评审意见 (${comments.length})`}
              />
              <div className="space-y-3">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-border bg-muted/20 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-medium text-accent-foreground">
                        {c.avatar}
                      </div>
                      <span className="text-sm font-medium text-foreground">{c.author}</span>
                      <span className="text-[11px] text-muted-foreground">{c.time}</span>
                      {c.section && (
                        <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {c.section}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{c.content}</p>
                  </div>
                ))}
              </div>

              {/* Add comment */}
              <div className="mt-4 flex gap-2">
                <input
                  placeholder="添加评审意见..."
                  className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                />
                <Button size="sm" className="h-9">
                  发送
                </Button>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
    </div>
  );
};

/* ─── Image placeholder ─── */
const ImagePlaceholder = ({
  image,
  onRemove,
}: {
  image: PrototypeImage;
  onRemove: () => void;
}) => (
  <div className="group relative mt-3 rounded-lg border border-dashed border-border bg-muted/30 p-4 flex flex-col items-center justify-center gap-2 min-h-[120px]">
    <ImagePlus size={24} className="text-muted-foreground/50" />
    <p className="text-xs text-muted-foreground">{image.name}</p>
    <p className="text-[10px] text-muted-foreground/60">点击上传或拖拽图片到此处</p>
    <button
      onClick={onRemove}
      className="absolute top-2 right-2 p-1 rounded-md hover:bg-secondary text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <X size={12} />
    </button>
  </div>
);

export default RequirementDocEditor;
