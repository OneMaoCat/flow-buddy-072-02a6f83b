import { useState } from "react";
import ClarifyCards, { type ClarifyQuestion } from "./ClarifyCards";
import PlanCard, { type PlanStep } from "./PlanCard";
import { Loader2 } from "lucide-react";

type FlowStage = "clarifying" | "generating" | "planning" | "confirmed";

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

/** A single chat bubble */
const UserBubble = ({ text }: { text: string }) => (
  <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
    <div className="flex items-start gap-3 max-w-[80%] flex-row-reverse">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
        <span className="text-primary-foreground text-xs font-bold">你</span>
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-primary text-primary-foreground text-sm">
        {text}
      </div>
    </div>
  </div>
);

const AIBubbleWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
    <div className="flex items-start gap-3 max-w-[90%]">
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
        <span className="text-foreground text-xs font-bold">DF</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  </div>
);

interface PlanFlowProps {
  requirement: string;
  onCancel: () => void;
  onStartDev: () => void;
}

const PlanFlow = ({ requirement, onCancel, onStartDev }: PlanFlowProps) => {
  const [stage, setStage] = useState<FlowStage>("clarifying");
  const [clarifyAnswers, setClarifyAnswers] = useState<Record<string, string> | null>(null);

  const handleClarifyComplete = (answers: Record<string, string>) => {
    setClarifyAnswers(answers);
    setStage("generating");
    setTimeout(() => setStage("planning"), 1500);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. User's requirement */}
      <UserBubble text={requirement} />

      {/* 2. AI asks clarifying questions */}
      <AIBubbleWrapper>
        <p className="text-sm text-muted-foreground mb-3">在开始之前，我需要了解一些细节：</p>
        <ClarifyCards
          questions={mockQuestions}
          onComplete={handleClarifyComplete}
          disabled={stage !== "clarifying"}
        />
      </AIBubbleWrapper>

      {/* 3. User's answers summary (after clarify) */}
      {clarifyAnswers && (
        <UserBubble
          text={Object.entries(clarifyAnswers)
            .map(([, val]) => val)
            .join("、")}
        />
      )}

      {/* 4. Generating / Plan */}
      {stage === "generating" && (
        <AIBubbleWrapper>
          <div className="flex items-center gap-2 py-4">
            <Loader2 size={18} className="text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">正在生成开发计划...</span>
          </div>
        </AIBubbleWrapper>
      )}

      {stage === "planning" && (
        <AIBubbleWrapper>
          <p className="text-sm text-muted-foreground mb-3">根据你的需求，我制定了以下开发计划：</p>
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
        </AIBubbleWrapper>
      )}

      {stage === "confirmed" && (
        <>
          <UserBubble text="确认，开始开发吧！" />
          <AIBubbleWrapper>
            <div className="flex items-center gap-2 py-4">
              <Loader2 size={18} className="text-primary animate-spin" />
              <span className="text-sm text-foreground font-medium">正在根据计划进行开发...</span>
            </div>
          </AIBubbleWrapper>
        </>
      )}
    </div>
  );
};

export default PlanFlow;
