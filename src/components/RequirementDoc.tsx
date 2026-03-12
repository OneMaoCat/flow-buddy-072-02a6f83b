import { useState, useRef, useEffect } from "react";
import {
  FileText,
  Users,
  GitBranch,
  Pencil,
  Check,
  X,
  ChevronRight,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
export interface FlowStep {
  id: string;
  label: string;
}

export interface ChangePoint {
  id: string;
  module: string;
  description: string;
  type: "add" | "modify" | "delete";
}

export interface UserScenario {
  id: string;
  actor: string;
  action: string;
  expectedResult: string;
}

export interface RequirementDocData {
  title: string;
  background: string;
  scenarios: UserScenario[];
  flowSteps: FlowStep[];
  changePoints: ChangePoint[];
}

/* ─── Editable text block ─── */
const EditableText = ({
  value,
  onChange,
  multiline = false,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  className?: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <span
        className={cn(
          "group/edit inline cursor-pointer rounded px-1 -mx-1 hover:bg-accent transition-colors",
          className
        )}
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        {value}
        <Pencil
          size={11}
          className="inline ml-1.5 opacity-0 group-hover/edit:opacity-60 transition-opacity text-muted-foreground"
        />
      </span>
    );
  }

  const save = () => {
    onChange(draft);
    setEditing(false);
  };
  const cancel = () => setEditing(false);

  const common =
    "w-full rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring";

  return (
    <span className="inline-flex items-center gap-1">
      {multiline ? (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              save();
            }
            if (e.key === "Escape") cancel();
          }}
          rows={3}
          className={cn(common, "resize-none")}
        />
      ) : (
        <input
          ref={ref as React.RefObject<HTMLInputElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          className={common}
        />
      )}
      <button
        onClick={save}
        className="p-1 rounded hover:bg-accent text-primary transition-colors"
      >
        <Check size={13} />
      </button>
      <button
        onClick={cancel}
        className="p-1 rounded hover:bg-accent text-muted-foreground transition-colors"
      >
        <X size={13} />
      </button>
    </span>
  );
};

/* ─── Section wrapper ─── */
const Section = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="mb-5 last:mb-0">
    <div className="flex items-center gap-2 mb-2.5">
      {icon}
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
    </div>
    <div className="pl-6">{children}</div>
  </div>
);

/* ─── Change type badge ─── */
const changeTypeConfig = {
  add: { label: "新增", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  modify: { label: "修改", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  delete: { label: "删除", className: "bg-red-500/10 text-red-600 border-red-500/20" },
};

/* ─── Main Component ─── */
interface RequirementDocProps {
  data: RequirementDocData;
  onChange?: (data: RequirementDocData) => void;
  onConfirm?: () => void;
  onRevise?: () => void;
  onOpenEditor?: () => void;
}

const RequirementDoc = ({ data, onChange, onConfirm, onRevise, onOpenEditor }: RequirementDocProps) => {
  const [doc, setDoc] = useState<RequirementDocData>(data);

  const update = (partial: Partial<RequirementDocData>) => {
    const next = { ...doc, ...partial };
    setDoc(next);
    onChange?.(next);
  };

  const updateScenario = (id: string, field: keyof UserScenario, value: string) => {
    update({
      scenarios: doc.scenarios.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    });
  };

  const updateChangePoint = (id: string, field: keyof ChangePoint, value: string) => {
    update({
      changePoints: doc.changePoints.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    });
  };

  const updateFlowStep = (id: string, label: string) => {
    update({
      flowSteps: doc.flowSteps.map((f) =>
        f.id === id ? { ...f, label } : f
      ),
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 mb-1">
          <FileText size={16} className="text-primary" />
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            需求文档
          </span>
        </div>
        <h3 className="text-base font-bold text-foreground">
          <EditableText
            value={doc.title}
            onChange={(v) => update({ title: v })}
          />
        </h3>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {/* Background */}
        <Section
          icon={<FileText size={14} className="text-primary shrink-0" />}
          title="需求背景"
        >
          <div className="text-sm text-foreground/80 leading-relaxed">
            <EditableText
              value={doc.background}
              onChange={(v) => update({ background: v })}
              multiline
            />
          </div>
        </Section>

        {/* User Scenarios */}
        <Section
          icon={<Users size={14} className="text-primary shrink-0" />}
          title="用户场景"
        >
          <div className="space-y-3">
            {doc.scenarios.map((s, i) => (
              <div
                key={s.id}
                className="rounded-lg border border-border bg-muted/20 px-4 py-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">场景</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs mr-1.5">角色：</span>
                    <EditableText
                      value={s.actor}
                      onChange={(v) => updateScenario(s.id, "actor", v)}
                    />
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs mr-1.5">操作：</span>
                    <EditableText
                      value={s.action}
                      onChange={(v) => updateScenario(s.id, "action", v)}
                    />
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs mr-1.5">预期结果：</span>
                    <EditableText
                      value={s.expectedResult}
                      onChange={(v) => updateScenario(s.id, "expectedResult", v)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Flow Chart */}
        <Section
          icon={<Workflow size={14} className="text-primary shrink-0" />}
          title="流程图"
        >
          <div className="flex flex-wrap items-center gap-1">
            {doc.flowSteps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-1">
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
                  <EditableText
                    value={step.label}
                    onChange={(v) => updateFlowStep(step.id, v)}
                  />
                </div>
                {i < doc.flowSteps.length - 1 && (
                  <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Change Points */}
        <Section
          icon={<GitBranch size={14} className="text-primary shrink-0" />}
          title="需求变更点"
        >
          <div className="space-y-2">
            {doc.changePoints.map((cp) => {
              const badge = changeTypeConfig[cp.type];
              return (
                <div
                  key={cp.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3"
                >
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
                      badge.className
                    )}
                  >
                    {badge.label}
                  </span>
                  <div className="text-sm min-w-0">
                    <div className="font-medium text-foreground">
                      <EditableText
                        value={cp.module}
                        onChange={(v) => updateChangePoint(cp.id, "module", v)}
                      />
                    </div>
                    <div className="text-muted-foreground text-xs mt-0.5">
                      <EditableText
                        value={cp.description}
                        onChange={(v) => updateChangePoint(cp.id, "description", v)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      {/* Footer actions */}
      {(onConfirm || onRevise) && (
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-muted/20">
          {onRevise && (
            <button
              onClick={onRevise}
              className="h-8 px-4 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              重新生成
            </button>
          )}
          {onConfirm && (
            <button
              onClick={onConfirm}
              className="h-8 px-5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              确认需求，开始开发
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RequirementDoc;
