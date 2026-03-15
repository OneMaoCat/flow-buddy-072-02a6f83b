import { useState } from "react";
import {
  MessageSquare, Palette, Package, GitMerge, Shield, XCircle,
  CheckCircle2, ChevronRight, AlertTriangle, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BlockInfo, BlockType } from "@/data/devExecutionMock";

const blockTypeMeta: Record<BlockType, { label: string; icon: React.ReactNode; color: string }> = {
  clarify: { label: "需求歧义", icon: <MessageSquare size={14} />, color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
  design: { label: "设计决策", icon: <Palette size={14} />, color: "text-violet-600 bg-violet-500/10 border-violet-500/20" },
  dependency: { label: "外部依赖", icon: <Package size={14} />, color: "text-orange-600 bg-orange-500/10 border-orange-500/20" },
  conflict: { label: "代码冲突", icon: <GitMerge size={14} />, color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20" },
  permission: { label: "权限确认", icon: <Shield size={14} />, color: "text-red-600 bg-red-500/10 border-red-500/20" },
  test_failure: { label: "测试失败", icon: <XCircle size={14} />, color: "text-rose-600 bg-rose-500/10 border-rose-500/20" },
};

interface BlockResolverProps {
  blockInfo: BlockInfo;
  onResolve: (resolution: string) => void;
}

const BlockResolver = ({ blockInfo, onResolve }: BlockResolverProps) => {
  const meta = blockTypeMeta[blockInfo.type];
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [conflictChoices, setConflictChoices] = useState<Record<number, "mine" | "ai">>({});
  const [testChoices, setTestChoices] = useState<Record<number, "ignore" | "manual" | "retry">>({});
  const [permissionChoice, setPermissionChoice] = useState<"approve" | "reject" | null>(null);

  const canResolve = (): boolean => {
    switch (blockInfo.type) {
      case "clarify":
      case "design":
        return selectedOption !== null;
      case "dependency":
        return blockInfo.missingItems ? checkedItems.size === blockInfo.missingItems.length : false;
      case "conflict":
        return blockInfo.conflictFiles ? Object.keys(conflictChoices).length === blockInfo.conflictFiles.length : false;
      case "permission":
        return permissionChoice !== null;
      case "test_failure":
        return blockInfo.failedTests ? Object.keys(testChoices).length === blockInfo.failedTests.length : false;
      default:
        return false;
    }
  };

  const buildResolution = (): string => {
    switch (blockInfo.type) {
      case "clarify":
      case "design":
        return `选择了: ${blockInfo.options?.[selectedOption!]?.label}`;
      case "dependency":
        return `已确认所有外部依赖就绪`;
      case "conflict":
        return `冲突解决: ${Object.entries(conflictChoices).map(([i, c]) => `${blockInfo.conflictFiles?.[+i]} → ${c === "mine" ? "保留我的" : "采用AI的"}`).join("; ")}`;
      case "permission":
        return permissionChoice === "approve" ? "已授权操作" : "已拒绝操作";
      case "test_failure":
        return `测试处理: ${Object.entries(testChoices).map(([i, c]) => `#${+i + 1} → ${c}`).join("; ")}`;
      default:
        return "已解除";
    }
  };

  const toggleCheck = (idx: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  return (
    <div className="border-t border-red-500/20 bg-red-500/5">
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={13} className="text-red-500" />
          <span className="text-[11px] font-semibold text-red-600">阻塞中</span>
          <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 gap-1 border", meta.color)}>
            {meta.icon}
            {meta.label}
          </Badge>
        </div>
        <p className="text-xs text-foreground/80 mb-1">⚠ {blockInfo.reason}</p>
        {blockInfo.question && (
          <p className="text-xs font-medium text-foreground mt-2 mb-2">{blockInfo.question}</p>
        )}
      </div>

      {/* Interactive area */}
      <div className="px-4 pb-2">
        {/* Clarify / Design — option cards */}
        {(blockInfo.type === "clarify" || blockInfo.type === "design") && blockInfo.options && (
          <div className="space-y-1.5">
            {blockInfo.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedOption(i)}
                className={cn(
                  "w-full text-left rounded-md border p-2.5 transition-all",
                  selectedOption === i
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                    selectedOption === i ? "border-primary" : "border-muted-foreground/30"
                  )}>
                    {selectedOption === i && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-xs font-medium">{opt.label}</span>
                </div>
                {opt.description && (
                  <p className="text-[10px] text-muted-foreground mt-1 ml-6">{opt.description}</p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Dependency — checklist */}
        {blockInfo.type === "dependency" && blockInfo.missingItems && (
          <div className="space-y-1">
            {blockInfo.missingItems.map((item, i) => (
              <button
                key={i}
                onClick={() => toggleCheck(i)}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-md border p-2.5 text-left transition-all",
                  checkedItems.has(i)
                    ? "border-green-500/40 bg-green-500/5"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                  checkedItems.has(i) ? "bg-green-600 border-green-600" : "border-muted-foreground/40"
                )}>
                  {checkedItems.has(i) && <CheckCircle2 size={10} className="text-white" />}
                </div>
                <span className={cn("text-xs", checkedItems.has(i) && "line-through text-muted-foreground")}>{item}</span>
              </button>
            ))}
          </div>
        )}

        {/* Conflict — file choices */}
        {blockInfo.type === "conflict" && blockInfo.conflictFiles && (
          <div className="space-y-1.5">
            {blockInfo.conflictFiles.map((file, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-2.5">
                <p className="text-[11px] font-mono text-foreground mb-2 truncate">{file}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConflictChoices(prev => ({ ...prev, [i]: "mine" }))}
                    className={cn(
                      "flex-1 text-[10px] py-1.5 rounded-md border text-center font-medium transition-all",
                      conflictChoices[i] === "mine"
                        ? "border-blue-500 bg-blue-500/10 text-blue-600"
                        : "border-border text-muted-foreground hover:border-blue-500/40"
                    )}
                  >
                    保留我的
                  </button>
                  <button
                    onClick={() => setConflictChoices(prev => ({ ...prev, [i]: "ai" }))}
                    className={cn(
                      "flex-1 text-[10px] py-1.5 rounded-md border text-center font-medium transition-all",
                      conflictChoices[i] === "ai"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    采用 AI 的
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Permission — approve/reject */}
        {blockInfo.type === "permission" && (
          <div className="space-y-2">
            {blockInfo.permissionAction && (
              <div className="rounded-md border border-red-500/20 bg-red-500/5 p-2.5">
                <p className="text-xs text-foreground leading-relaxed">{blockInfo.permissionAction}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPermissionChoice("approve")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-md border font-medium transition-all",
                  permissionChoice === "approve"
                    ? "border-green-500 bg-green-500/10 text-green-600"
                    : "border-border text-muted-foreground hover:border-green-500/40"
                )}
              >
                <CheckCircle2 size={12} /> 授权执行
              </button>
              <button
                onClick={() => setPermissionChoice("reject")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-md border font-medium transition-all",
                  permissionChoice === "reject"
                    ? "border-red-500 bg-red-500/10 text-red-600"
                    : "border-border text-muted-foreground hover:border-red-500/40"
                )}
              >
                <XCircle size={12} /> 拒绝操作
              </button>
            </div>
          </div>
        )}

        {/* Test failure — per-test actions */}
        {blockInfo.type === "test_failure" && blockInfo.failedTests && (
          <div className="space-y-1.5">
            {blockInfo.failedTests.map((test, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-2.5">
                <div className="flex items-start gap-1.5 mb-2">
                  <XCircle size={11} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-foreground leading-snug">{test}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {(["ignore", "manual", "retry"] as const).map(action => {
                    const labels = { ignore: "忽略", manual: "手动修复", retry: "让AI重试" };
                    return (
                      <button
                        key={action}
                        onClick={() => setTestChoices(prev => ({ ...prev, [i]: action }))}
                        className={cn(
                          "flex-1 text-[10px] py-1 rounded border text-center font-medium transition-all",
                          testChoices[i] === action
                            ? action === "ignore" ? "border-yellow-500 bg-yellow-500/10 text-yellow-600"
                              : action === "manual" ? "border-blue-500 bg-blue-500/10 text-blue-600"
                              : "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        {labels[action]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm button */}
      <div className="px-4 pb-3 pt-1">
        <Button
          size="sm"
          className="w-full gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700"
          disabled={!canResolve()}
          onClick={() => onResolve(buildResolution())}
        >
          <Zap size={12} />
          {permissionChoice === "reject" ? "确认拒绝并跳过" : "确认解除阻塞，继续执行"}
        </Button>
      </div>
    </div>
  );
};

export { blockTypeMeta };
export default BlockResolver;
