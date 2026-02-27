import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Loader2, RotateCcw, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { type TestCase, generateMockTests } from "@/data/projects";
import { Button } from "@/components/ui/button";

interface TestPanelProps {
  projectName: string;
  onAllPassed: () => void;
}

const statusIcon = (s: TestCase["status"]) => {
  switch (s) {
    case "passed": return <CheckCircle2 size={14} className="text-green-600" />;
    case "failed": return <XCircle size={14} className="text-destructive" />;
    case "running": return <Loader2 size={14} className="animate-spin text-primary" />;
    default: return <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30" />;
  }
};

const TestPanel = ({ projectName, onAllPassed }: TestPanelProps) => {
  const [tests, setTests] = useState<TestCase[]>(() => generateMockTests(projectName));
  const [running, setRunning] = useState(false);

  const passedCount = tests.filter((t) => t.status === "passed").length;
  const failedCount = tests.filter((t) => t.status === "failed").length;
  const progress = Math.round((passedCount / tests.length) * 100);

  const runTests = useCallback(() => {
    setRunning(true);
    const updated = tests.map((t) => ({ ...t, status: "pending" as const }));
    setTests(updated);

    updated.forEach((_, i) => {
      setTimeout(() => {
        setTests((prev) => prev.map((t, j) => j === i ? { ...t, status: "running" } : t));
      }, i * 800);

      setTimeout(() => {
        setTests((prev) => {
          const next = prev.map((t, j) =>
            j === i
              ? { ...t, status: (Math.random() > 0.15 ? "passed" : "failed") as TestCase["status"], duration: Math.floor(Math.random() * 500 + 100) }
              : t
          );
          if (i === updated.length - 1) {
            setRunning(false);
            if (next.every((t) => t.status === "passed")) onAllPassed();
          }
          return next;
        });
      }, i * 800 + 600);
    });
  }, [tests.length, onAllPassed]);

  const retryFailed = () => {
    setTests((prev) => prev.map((t) => t.status === "failed" ? { ...t, status: "pending" } : t));
    setRunning(true);
    const failedIndices = tests.map((t, i) => t.status === "failed" ? i : -1).filter((i) => i >= 0);

    failedIndices.forEach((idx, order) => {
      setTimeout(() => setTests((prev) => prev.map((t, j) => j === idx ? { ...t, status: "running" } : t)), order * 800);
      setTimeout(() => {
        setTests((prev) => {
          const next = prev.map((t, j) => j === idx ? { ...t, status: "passed" as const, duration: Math.floor(Math.random() * 300 + 100) } : t);
          if (order === failedIndices.length - 1) {
            setRunning(false);
            if (next.every((t) => t.status === "passed")) onAllPassed();
          }
          return next;
        });
      }, order * 800 + 600);
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">测试用例</h3>
        <Button size="sm" variant="outline" onClick={runTests} disabled={running} className="h-7 text-xs gap-1">
          <Play size={12} /> 运行全部
        </Button>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>通过率</span>
          <span>{passedCount}/{tests.length} ({progress}%)</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-1 scrollbar-hide">
        {tests.map((t) => (
          <div key={t.id} className="flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-secondary/50 transition-colors">
            {statusIcon(t.status)}
            <span className="text-xs text-foreground flex-1 truncate">{t.name}</span>
            {t.duration && t.status !== "pending" && t.status !== "running" && (
              <span className="text-[10px] text-muted-foreground">{t.duration}ms</span>
            )}
          </div>
        ))}
      </div>

      {failedCount > 0 && !running && (
        <div className="px-4 py-3 border-t border-border">
          <Button size="sm" onClick={retryFailed} className="w-full h-8 text-xs gap-1">
            <RotateCcw size={12} /> 重新修复并重试 ({failedCount} 项)
          </Button>
        </div>
      )}
    </div>
  );
};

export default TestPanel;
