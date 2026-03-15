import { useState } from "react";
import { X, GitBranch, Search, Sparkles, Code2, Pencil, TestTube2, Shield, CheckCircle2, FileCode2, MonitorPlay, MousePointerClick, Type, Eye, ArrowRight, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { DevCompleteResult } from "@/components/DevCompleteCard";
import { buildMockUITestSteps, type UITestStep } from "@/components/UITestReplay";
import mockPreviewImg from "@/assets/mock-preview.jpg";
import { cn } from "@/lib/utils";

interface DevProcessDetailPanelProps {
  result: DevCompleteResult;
  onClose: () => void;
}

const DevProcessDetailPanel = ({ result, onClose }: DevProcessDetailPanelProps) => {
  const totalAdds = result.files.reduce((s, f) => s + f.additions, 0);
  const totalDels = result.files.reduce((s, f) => s + f.deletions, 0);
  const passedTests = result.tests.filter((t) => t.passed).length;
  const branchName = `feature/req-${result.id.slice(0, 8)}`;

  const sections = [
    {
      icon: <GitBranch size={14} />,
      title: "拉取分支",
      content: (
        <div className="text-xs text-muted-foreground">
          <p>创建开发分支 <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[11px]">{branchName}</code></p>
          <p className="mt-1">基于 <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[11px]">main</code> 分支拉取，确保代码基线最新。</p>
        </div>
      ),
    },
    {
      icon: <Search size={14} />,
      title: "分析需求",
      content: (
        <div className="text-xs text-muted-foreground space-y-2">
          <div>
            <p className="text-foreground font-medium mb-1">用户原始需求</p>
            <p className="bg-muted rounded-md px-3 py-2">{result.sourceContext?.userPrompt || result.requirementTitle}</p>
          </div>
          {result.sourceContext?.aiSummary && (
            <div>
              <p className="text-foreground font-medium mb-1">AI 需求理解</p>
              <p className="bg-muted rounded-md px-3 py-2">{result.sourceContext.aiSummary}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      icon: <Sparkles size={14} />,
      title: "制定方案",
      content: (
        <div className="text-xs text-muted-foreground space-y-2">
          <p>规划 {result.files.length} 个文件的修改方案：</p>
          <ul className="space-y-1">
            {result.files.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <FileCode2 size={11} className="text-muted-foreground/60 shrink-0" />
                <span className="font-mono text-[11px] text-foreground">{f.path}</span>
                <span className="text-muted-foreground/50">
                  +{f.additions} -{f.deletions}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      icon: <Code2 size={14} />,
      title: "编写代码",
      content: (
        <div className="text-xs text-muted-foreground space-y-2">
          {result.aiChangeSummary && <p>{result.aiChangeSummary}</p>}
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-foreground/60">共 {result.files.length} 个文件</span>
            <span className="text-green-500">+{totalAdds}</span>
            <span className="text-red-400">-{totalDels}</span>
          </div>
        </div>
      ),
    },
    {
      icon: <Pencil size={14} />,
      title: "修改代码",
      content: (
        <div className="text-xs text-muted-foreground space-y-2">
          {result.files.map((f, i) => (
            <div key={i} className="rounded-md border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border-b border-border">
                <FileCode2 size={11} />
                <span className="font-mono text-[11px] text-foreground">{f.path}</span>
              </div>
              <div className="px-3 py-2 font-mono text-[11px] space-y-0.5 bg-card">
                {f.lines.slice(0, 6).map((line, li) => (
                  <div
                    key={li}
                    className={
                      line.type === "add"
                        ? "text-green-500"
                        : line.type === "del"
                        ? "text-red-400 line-through"
                        : "text-muted-foreground/60"
                    }
                  >
                    {line.type === "add" ? "+ " : line.type === "del" ? "- " : "  "}
                    {line.content}
                  </div>
                ))}
                {f.lines.length > 6 && (
                  <div className="text-muted-foreground/40 mt-1">... 还有 {f.lines.length - 6} 行</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <TestTube2 size={14} />,
      title: "运行测试",
      content: (
        <div className="text-xs text-muted-foreground space-y-1.5">
          <p className="text-foreground font-medium">{passedTests}/{result.tests.length} 用例通过 {result.coveragePercent && `· 覆盖率 ${result.coveragePercent}%`}</p>
          {result.tests.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 size={11} className={t.passed ? "text-green-500" : "text-destructive"} />
              <span className={t.passed ? "" : "text-destructive"}>{t.name}</span>
              <span className="text-muted-foreground/40 ml-auto">{t.duration}ms</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <MonitorPlay size={14} />,
      title: "UI 测试",
      content: <UITestProcessLog />,
    },
    {
      icon: <Shield size={14} />,
      title: "AI Code Review",
      content: (
        <div className="text-xs text-muted-foreground">
          <p>AI 多模型审查已完成，未发现严重问题。代码风格良好，逻辑清晰，测试覆盖全面。</p>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold text-foreground">开发过程</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-muted-foreground hover:bg-secondary transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-auto px-4 py-4">
        {sections.map((section, i) => (
          <div key={i} className="relative flex gap-3">
            {/* Vertical connector line */}
            {i < sections.length - 1 && (
              <div className="absolute left-3 top-6 bottom-0 w-px bg-border" />
            )}
            {/* Icon */}
            <div className="relative z-10 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              {section.icon}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0 pb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-foreground">{section.title}</span>
                <CheckCircle2 size={12} className="text-primary/60" />
              </div>
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DevProcessDetailPanel;
