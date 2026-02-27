import { useState } from "react";
import ClarifyCards, { type ClarifyQuestion } from "./ClarifyCards";
import PlanCard, { type PlanStep } from "./PlanCard";
import { Loader2 } from "lucide-react";

type FlowStage = "clarifying" | "generating" | "planning" | "confirmed";

// Mock data sets keyed by simple keyword matching
const mockQuestions: ClarifyQuestion[] = [
  {
    id: "scope",
    question: "涉及哪些模块？",
    options: ["用户登录/注册", "订单系统", "后台管理", "支付模块"],
  },
  {
    id: "tech",
    question: "技术栈偏好？",
    options: ["React + TypeScript", "Vue + TypeScript", "Next.js", "不限"],
  },
  {
    id: "priority",
    question: "优先级是什么？",
    options: ["尽快上线", "质量优先", "性能优先", "可维护性优先"],
  },
];

const mockPlan: { title: string; steps: PlanStep[]; totalTime: string } = {
  title: "用户登录页表单验证修复 & 单元测试",
  steps: [
    { title: "分析现有登录表单代码结构和验证逻辑", estimatedTime: "10 min" },
    { title: "修复表单验证规则（邮箱格式、密码强度、必填项）", estimatedTime: "25 min" },
    { title: "添加表单错误提示 UI 组件", estimatedTime: "15 min" },
    { title: "编写表单验证单元测试（覆盖正常/异常场景）", estimatedTime: "30 min" },
    { title: "集成测试 & 回归验证", estimatedTime: "15 min" },
    { title: "代码审查 & 提交 PR", estimatedTime: "10 min" },
  ],
  totalTime: "约 1 小时 45 分钟",
};

interface PlanFlowProps {
  requirement: string;
  onCancel: () => void;
  onStartDev: () => void;
}

const PlanFlow = ({ requirement, onCancel, onStartDev }: PlanFlowProps) => {
  const [stage, setStage] = useState<FlowStage>("clarifying");

  const handleClarifyComplete = (_answers: Record<string, string>) => {
    setStage("generating");
    // Simulate plan generation delay
    setTimeout(() => setStage("planning"), 1500);
  };

  if (stage === "clarifying") {
    return <ClarifyCards questions={mockQuestions} onComplete={handleClarifyComplete} />;
  }

  if (stage === "generating") {
    return (
      <div className="w-full max-w-[860px] mx-auto flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
        <Loader2 size={32} className="text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">正在生成开发计划...</p>
      </div>
    );
  }

  if (stage === "planning") {
    return (
      <PlanCard
        title={mockPlan.title}
        steps={mockPlan.steps}
        totalTime={mockPlan.totalTime}
        onConfirm={() => {
          setStage("confirmed");
          onStartDev();
        }}
        onRevise={onCancel}
      />
    );
  }

  // confirmed
  return (
    <div className="w-full max-w-[860px] mx-auto flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Loader2 size={24} className="text-primary animate-spin" />
      </div>
      <p className="text-base font-medium text-foreground mb-1">开发中...</p>
      <p className="text-sm text-muted-foreground">DeepFlow 正在根据计划进行开发</p>
    </div>
  );
};

export default PlanFlow;
