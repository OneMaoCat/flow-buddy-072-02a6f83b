import { useState } from "react";
import { CheckCircle2, Circle, Loader2, FileText, TestTube2, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConfirmTestCase {
  id: string;
  name: string;
  category: "unit" | "integration" | "e2e";
}

interface RequirementConfirmCardProps {
  requirement: string;
  testCases: ConfirmTestCase[];
  onConfirm: () => void;
  onEdit?: () => void;
  generating?: boolean;
}

const categoryLabel: Record<ConfirmTestCase["category"], string> = {
  unit: "单元测试",
  integration: "集成测试",
  e2e: "E2E 测试",
};

const categoryColor: Record<ConfirmTestCase["category"], string> = {
  unit: "bg-blue-500/10 text-blue-600",
  integration: "bg-amber-500/10 text-amber-600",
  e2e: "bg-emerald-500/10 text-emerald-600",
};

export const generateMockTestCases = (requirement: string): ConfirmTestCase[] => {
  const base = requirement.slice(0, 20);
  return [
    { id: "tc-1", name: `验证${base}的基础输入校验逻辑`, category: "unit" },
    { id: "tc-2", name: `验证${base}的边界条件处理`, category: "unit" },
    { id: "tc-3", name: `验证${base}的异常错误处理`, category: "unit" },
    { id: "tc-4", name: `${base}与后端 API 的数据交互`, category: "integration" },
    { id: "tc-5", name: `${base}的状态管理与组件联动`, category: "integration" },
    { id: "tc-6", name: `${base}的完整用户流程`, category: "e2e" },
  ];
};

const RequirementConfirmCard = ({
  requirement,
  testCases,
  onConfirm,
  onEdit,
  generating,
}: RequirementConfirmCardProps) => {
  const [expanded, setExpanded] = useState(true);

  const grouped = testCases.reduce(
    (acc, tc) => {
      acc[tc.category] = acc[tc.category] || [];
      acc[tc.category].push(tc);
      return acc;
    },
    {} as Record<string, ConfirmTestCase[]>
  );

  if (generating) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-in fade-in duration-300">
        <div className="flex items-center gap-2">
          <Loader2 size={16} className="animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">正在分析需求并生成测试用例…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
        <FileText size={15} className="text-primary shrink-0" />
        <span className="text-sm font-semibold text-foreground">需求确认 & 测试用例</span>
      </div>

      {/* Requirement summary */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs text-muted-foreground mb-1">需求摘要</p>
        <p className="text-sm text-foreground leading-relaxed">{requirement}</p>
      </div>

      {/* Test cases */}
      <div className="px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2 w-full"
        >
          <TestTube2 size={13} className="text-primary" />
          <span>AI 生成的测试用例</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
            {testCases.length}
          </span>
          <div className="flex-1" />
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {(["unit", "integration", "e2e"] as const).map((cat) => {
              const items = grouped[cat];
              if (!items?.length) return null;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${categoryColor[cat]}`}>
                      {categoryLabel[cat]}
                    </span>
                  </div>
                  <div className="space-y-1 pl-1">
                    {items.map((tc) => (
                      <div key={tc.id} className="flex items-center gap-2 py-1">
                        <Circle size={8} className="text-muted-foreground/40 shrink-0" />
                        <span className="text-xs text-foreground/80">{tc.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-muted/20">
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit} className="h-8 text-xs gap-1">
            <Pencil size={12} />
            修改需求
          </Button>
        )}
        <div className="flex-1" />
        <Button size="sm" onClick={onConfirm} className="h-8 text-xs gap-1">
          <CheckCircle2 size={12} />
          确认并开始开发
        </Button>
      </div>
    </div>
  );
};

export default RequirementConfirmCard;
