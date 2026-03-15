import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  MousePointerClick,
  Type,
  Eye,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import mockPreviewImg from "@/assets/mock-preview.jpg";

/* ── Types ── */

export interface UITestStep {
  id: string;
  action: "click" | "type" | "verify" | "navigate" | "wait";
  target: string;
  value?: string;
  description: string;
  /** Relative coordinates of the action indicator on the screenshot (0-100%) */
  indicatorX: number;
  indicatorY: number;
  passed: boolean;
  duration: number;
}

/* ── Mock test steps ── */

export const buildMockUITestSteps = (): UITestStep[] => [
  {
    id: "s1",
    action: "navigate",
    target: "/login",
    description: "打开登录页面",
    indicatorX: 50,
    indicatorY: 10,
    passed: true,
    duration: 320,
  },
  {
    id: "s2",
    action: "verify",
    target: "h1",
    value: "登录",
    description: "验证页面标题显示「登录」",
    indicatorX: 50,
    indicatorY: 22,
    passed: true,
    duration: 85,
  },
  {
    id: "s3",
    action: "click",
    target: "input[name='email']",
    description: "点击邮箱输入框",
    indicatorX: 50,
    indicatorY: 40,
    passed: true,
    duration: 120,
  },
  {
    id: "s4",
    action: "type",
    target: "input[name='email']",
    value: "test@example.com",
    description: "输入测试邮箱 test@example.com",
    indicatorX: 50,
    indicatorY: 40,
    passed: true,
    duration: 450,
  },
  {
    id: "s5",
    action: "click",
    target: "input[name='password']",
    description: "点击密码输入框",
    indicatorX: 50,
    indicatorY: 52,
    passed: true,
    duration: 95,
  },
  {
    id: "s6",
    action: "type",
    target: "input[name='password']",
    value: "Test1234",
    description: "输入密码 Test1234",
    indicatorX: 50,
    indicatorY: 52,
    passed: true,
    duration: 380,
  },
  {
    id: "s7",
    action: "click",
    target: "button[type='submit']",
    description: "点击「登录」按钮",
    indicatorX: 50,
    indicatorY: 65,
    passed: true,
    duration: 150,
  },
  {
    id: "s8",
    action: "wait",
    target: "navigation",
    description: "等待页面跳转完成",
    indicatorX: 50,
    indicatorY: 50,
    passed: true,
    duration: 1200,
  },
  {
    id: "s9",
    action: "verify",
    target: ".dashboard-header",
    description: "验证成功跳转到仪表盘页面",
    indicatorX: 30,
    indicatorY: 15,
    passed: true,
    duration: 90,
  },
  {
    id: "s10",
    action: "verify",
    target: ".user-avatar",
    description: "验证用户头像已显示",
    indicatorX: 88,
    indicatorY: 8,
    passed: true,
    duration: 60,
  },
];

/* ── Action icon mapping ── */

const actionIcon: Record<UITestStep["action"], React.ReactNode> = {
  click: <MousePointerClick size={11} />,
  type: <Type size={11} />,
  verify: <Eye size={11} />,
  navigate: <ArrowRight size={11} />,
  wait: <Loader2 size={11} />,
};

const actionLabel: Record<UITestStep["action"], string> = {
  click: "点击",
  type: "输入",
  verify: "验证",
  navigate: "导航",
  wait: "等待",
};

const actionColor: Record<UITestStep["action"], string> = {
  click: "bg-primary/15 text-primary border-primary/30",
  type: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  verify: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  navigate: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  wait: "bg-muted text-muted-foreground border-border",
};

/* ── Indicator pulse ring color ── */
const indicatorRing: Record<UITestStep["action"], string> = {
  click: "border-primary bg-primary/20",
  type: "border-amber-500 bg-amber-500/20",
  verify: "border-emerald-500 bg-emerald-500/20",
  navigate: "border-sky-500 bg-sky-500/20",
  wait: "border-muted-foreground bg-muted-foreground/20",
};

/* ── Component ── */

const UITestReplay = ({ steps: propSteps }: { steps?: UITestStep[] }) => {
  const steps = propSteps || buildMockUITestSteps();
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stepListRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const passedCount = steps.filter((s) => s.passed).length;
  const totalDuration = steps.reduce((s, t) => s + t.duration, 0);

  // Auto-play
  useEffect(() => {
    if (!playing) return;
    if (currentStep >= steps.length - 1) {
      setPlaying(false);
      setCompleted(true);
      return;
    }
    timerRef.current = setTimeout(() => {
      setCurrentStep((p) => p + 1);
    }, Math.min(step.duration * 2, 1500));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, currentStep, steps.length, step.duration]);

  // Scroll active step into view
  useEffect(() => {
    const el = stepListRef.current?.querySelector(`[data-step="${currentStep}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentStep]);

  const handleReset = () => {
    setCurrentStep(0);
    setPlaying(false);
    setCompleted(false);
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((p) => p - 1);
      setCompleted(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((p) => p + 1);
    } else {
      setCompleted(true);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] h-5 gap-1 border-emerald-500/30 text-emerald-500">
            <Eye size={10} />
            UI 自动化测试
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {passedCount}/{steps.length} 步骤通过 · {totalDuration}ms
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
            title="重置"
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => setPlaying(!playing)}
            className={cn(
              "p-1 rounded transition-colors",
              playing
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            {playing ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <button
            onClick={handleNext}
            disabled={currentStep === steps.length - 1 && completed}
            className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30"
          >
            <ChevronRight size={13} />
          </button>
          <span className="text-[10px] text-muted-foreground ml-1 tabular-nums">
            {currentStep + 1}/{steps.length}
          </span>
        </div>
      </div>

      {/* Screenshot area with action indicator */}
      <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30">
        {/* Mock browser chrome */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 border-b border-border">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive/40" />
            <div className="w-2 h-2 rounded-full bg-amber-500/40" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
          </div>
          <div className="flex-1 mx-2 px-2 py-0.5 rounded bg-background/60 text-[9px] text-muted-foreground font-mono truncate">
            localhost:5173{step?.action === "navigate" ? step.target : "/login"}
          </div>
        </div>

        {/* Screenshot + overlay */}
        <div className="relative aspect-video">
          <img
            src={mockPreviewImg}
            alt="UI Test Screenshot"
            className="w-full h-full object-cover"
          />

          {/* Dark overlay to focus attention */}
          <div className="absolute inset-0 bg-background/30" />

          {/* Action indicator */}
          {step && (
            <div
              className="absolute z-10 transition-all duration-500 ease-out"
              style={{
                left: `${step.indicatorX}%`,
                top: `${step.indicatorY}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Pulse ring */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center animate-pulse",
                  indicatorRing[step.action]
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center",
                    indicatorRing[step.action]
                  )}
                >
                  {step.action === "click" && (
                    <MousePointerClick size={8} className="text-primary" />
                  )}
                </div>
              </div>

              {/* Action label tooltip */}
              <div
                className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap",
                  "px-2 py-1 rounded-md text-[9px] font-medium shadow-lg",
                  "bg-background/95 backdrop-blur-sm border border-border text-foreground"
                )}
              >
                <span className={cn("inline-flex items-center gap-1")}>
                  {actionIcon[step.action]}
                  {step.description}
                </span>
              </div>
            </div>
          )}

          {/* Completed overlay */}
          {completed && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center animate-in fade-in duration-300">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                </div>
                <span className="text-xs font-medium text-foreground">全部测试步骤通过</span>
                <button
                  onClick={handleReset}
                  className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <RotateCcw size={10} /> 重新播放
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step list */}
      <div
        ref={stepListRef}
        className="max-h-[140px] overflow-y-auto scrollbar-hide rounded-md border border-border"
      >
        {steps.map((s, i) => {
          const isActive = i === currentStep;
          const isDone = i < currentStep || completed;
          return (
            <button
              key={s.id}
              data-step={i}
              onClick={() => {
                setCurrentStep(i);
                setPlaying(false);
                setCompleted(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs border-b border-border last:border-0 transition-colors",
                isActive && "bg-primary/5",
                !isActive && "hover:bg-muted/30"
              )}
            >
              {/* Step number / status */}
              <div
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[8px] font-bold",
                  isDone && s.passed
                    ? "bg-emerald-500/15 text-emerald-500"
                    : isDone && !s.passed
                      ? "bg-destructive/15 text-destructive"
                      : isActive
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                )}
              >
                {isDone ? (
                  s.passed ? (
                    <CheckCircle2 size={10} />
                  ) : (
                    "✗"
                  )
                ) : (
                  i + 1
                )}
              </div>

              {/* Action badge */}
              <Badge
                variant="outline"
                className={cn(
                  "text-[8px] h-3.5 px-1 shrink-0 border",
                  actionColor[s.action]
                )}
              >
                {actionLabel[s.action]}
              </Badge>

              {/* Description */}
              <span
                className={cn(
                  "flex-1 min-w-0 truncate",
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {s.description}
              </span>

              {/* Duration */}
              <span className="text-[9px] text-muted-foreground tabular-nums shrink-0">
                {s.duration}ms
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default UITestReplay;
