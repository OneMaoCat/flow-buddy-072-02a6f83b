import { useState, useRef, useEffect } from "react";
import {
  FileText,
  Code2,
  Pencil,
  Check,
  X,
  Lightbulb,
  FolderCode,
  TestTube2,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
export interface AdjustmentItem {
  id: string;
  title: string;
  description: string;
}

export interface TechnicalItem {
  id: string;
  file: string;
  description: string;
  type: "add" | "modify" | "delete";
}

export interface PlanTestCase {
  id: string;
  name: string;
  category: "unit" | "integration" | "e2e";
}

export interface RequirementDocData {
  title: string;
  background: string;
  adjustments: AdjustmentItem[];
  technicalItems: TechnicalItem[];
  testCases?: PlanTestCase[];
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

  const updateAdjustment = (id: string, field: keyof AdjustmentItem, value: string) => {
    update({
      adjustments: doc.adjustments.map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    });
  };

  const updateTechnicalItem = (id: string, field: keyof TechnicalItem, value: string) => {
    update({
      technicalItems: doc.technicalItems.map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      ),
    });
  };

  const updateTestCase = (id: string, field: keyof PlanTestCase, value: string) => {
    update({
      testCases: (doc.testCases || []).map((tc) =>
        tc.id === id ? { ...tc, [field]: value } : tc
      ),
    });
  };

  const testCategoryLabel: Record<string, string> = { unit: "单元测试", integration: "集成测试", e2e: "E2E 测试" };
  const testCategoryColor: Record<string, string> = {
    unit: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    integration: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    e2e: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500",
        onOpenEditor && "cursor-pointer hover:border-primary/30 hover:shadow-md transition-all"
      )}
      onClick={() => onOpenEditor?.()}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 mb-1">
          <FileText size={16} className="text-primary" />
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Plan
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

        {/* Adjustment Plan */}
        <Section
          icon={<Lightbulb size={14} className="text-primary shrink-0" />}
          title="调整方案"
        >
          <div className="space-y-3">
            {doc.adjustments.map((a, i) => (
              <div
                key={a.id}
                className="rounded-lg border border-border bg-muted/20 px-4 py-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    <EditableText
                      value={a.title}
                      onChange={(v) => updateAdjustment(a.id, "title", v)}
                    />
                  </span>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed pl-7">
                  <EditableText
                    value={a.description}
                    onChange={(v) => updateAdjustment(a.id, "description", v)}
                    multiline
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Technical Plan */}
        <Section
          icon={<FolderCode size={14} className="text-primary shrink-0" />}
          title="技术方案（涉及文件）"
        >
          <div className="space-y-2">
            {doc.technicalItems.map((t) => {
              const badge = changeTypeConfig[t.type];
              return (
                <div
                  key={t.id}
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
                    <div className="font-medium text-foreground font-mono text-xs">
                      <EditableText
                        value={t.file}
                        onChange={(v) => updateTechnicalItem(t.id, "file", v)}
                      />
                    </div>
                    <div className="text-muted-foreground text-xs mt-0.5">
                      <EditableText
                        value={t.description}
                        onChange={(v) => updateTechnicalItem(t.id, "description", v)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Test Cases */}
        {doc.testCases && doc.testCases.length > 0 && (
          <Section
            icon={<TestTube2 size={14} className="text-primary shrink-0" />}
            title="测试用例"
          >
            <div className="space-y-2">
              {doc.testCases.map((tc) => {
                const catColor = testCategoryColor[tc.category] || "";
                const catLabel = testCategoryLabel[tc.category] || tc.category;
                return (
                  <div
                    key={tc.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-2.5"
                  >
                    <span
                      className={cn(
                        "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
                        catColor
                      )}
                    >
                      {catLabel}
                    </span>
                    <div className="text-sm text-foreground/80 min-w-0 flex-1">
                      <EditableText
                        value={tc.name}
                        onChange={(v) => updateTestCase(tc.id, "name", v)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}
      </div>

      {/* Footer actions */}
      {(onConfirm || onRevise) && (
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-muted/20">
          {onRevise && (
            <button
              onClick={(e) => { e.stopPropagation(); onRevise(); }}
              className="h-8 px-4 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              重新生成
            </button>
          )}
          {onConfirm && (
            <button
              onClick={(e) => { e.stopPropagation(); onConfirm(); }}
              className="h-8 px-5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              确认 Plan，开始开发
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RequirementDoc;
