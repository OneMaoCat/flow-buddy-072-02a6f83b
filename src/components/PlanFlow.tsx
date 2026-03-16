import { useState } from "react";
import { useParams } from "react-router-dom";
import ClarifyCards, { type ClarifyQuestion } from "./ClarifyCards";
import RequirementDoc, { type RequirementDocData } from "./RequirementDoc";
import RequirementConfirmCard, { generateMockTestCases, type ConfirmTestCase } from "./RequirementConfirmCard";
import { Loader2 } from "lucide-react";

type FlowStage = "clarifying" | "generating" | "planning" | "generating_tests" | "confirming_tests" | "confirmed";

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

const buildMockDoc = (requirement: string): RequirementDocData => ({
  title: requirement.length > 30 ? requirement.slice(0, 30) + "…" : requirement,
  background:
    "当前系统的用户登录页面在表单验证方面存在若干问题，包括邮箱格式校验缺失、密码强度提示不明确、必填项未做前端拦截等。这些问题导致用户体验不佳，同时也增加了后端无效请求的处理压力。本次需求旨在全面修复登录表单验证逻辑，并补充对应的单元测试以防止回归。",
  adjustments: [
    {
      id: "a1",
      title: "增强邮箱格式校验",
      description: "在前端登录表单中新增正则校验，支持常见邮箱和企业邮箱格式，校验失败时即时显示行内错误提示。",
    },
    {
      id: "a2",
      title: "强化密码强度检查",
      description: "要求密码至少 8 位，包含数字和字母，并在输入时实时显示强度指示条（弱/中/强）。",
    },
    {
      id: "a3",
      title: "补充必填项拦截与单元测试",
      description: "对所有必填字段增加前端拦截，移除旧版 alert 弹窗提示，替换为行内错误组件。同时补充对应的单元测试，覆盖率 ≥ 90%。",
    },
  ],
  technicalItems: [
    {
      id: "t1",
      file: "src/components/LoginForm.tsx",
      description: "新增邮箱格式正则校验，添加密码强度检查逻辑",
      type: "modify",
    },
    {
      id: "t2",
      file: "src/components/FormErrorTip.tsx",
      description: "新建通用表单行内错误提示组件，支持动态文案和动画效果",
      type: "add",
    },
    {
      id: "t3",
      file: "src/components/__tests__/LoginForm.test.ts",
      description: "新增单元测试文件，覆盖邮箱/密码验证的正常与异常场景",
      type: "add",
    },
    {
      id: "t4",
      file: "src/utils/validators.ts",
      description: "抽取邮箱和密码校验函数为独立工具模块，便于复用和测试",
      type: "add",
    },
    {
      id: "t5",
      file: "src/components/LoginForm.legacy.tsx",
      description: "移除原有 window.alert 弹窗式验证提示代码",
      type: "delete",
    },
  ],
});

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
  onOpenDocEditor?: (doc: RequirementDocData) => void;
  onDevSubmitted?: () => void;
}

const PlanFlow = ({ requirement, onCancel, onStartDev, onOpenDocEditor, onDevSubmitted }: PlanFlowProps) => {
  const { id } = useParams();
  const [stage, setStage] = useState<FlowStage>("clarifying");
  const [clarifyAnswers, setClarifyAnswers] = useState<Record<string, string> | null>(null);
  const [docData, setDocData] = useState<RequirementDocData>(() => buildMockDoc(requirement));
  const [testCases, setTestCases] = useState<ConfirmTestCase[]>([]);

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

      {/* 4. Generating spinner */}
      {stage === "generating" && (
        <AIBubbleWrapper>
          <div className="flex items-center gap-2 py-4">
            <Loader2 size={18} className="text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">正在生成 Plan...</span>
          </div>
        </AIBubbleWrapper>
      )}

      {/* 5. Plan Document */}
      {stage === "planning" && (
        <AIBubbleWrapper>
          <p className="text-sm text-muted-foreground mb-3">
            根据你的需求，我生成了以下 Plan，你可以点击任意内容进行编辑：
          </p>
          <RequirementDoc
            data={docData}
            onChange={setDocData}
            onOpenEditor={() => onOpenDocEditor?.(docData)}
            onConfirm={() => {
              setStage("confirmed");
              onStartDev();
              onDevSubmitted?.();
            }}
            onRevise={onCancel}
          />
        </AIBubbleWrapper>
      )}

      {stage === "confirmed" && (
        <>
          <UserBubble text="确认 Plan，开始开发！" />
          <AIBubbleWrapper>
            <div className="flex items-center gap-2 py-4">
              <Loader2 size={18} className="text-primary animate-spin" />
              <span className="text-sm text-foreground font-medium">已提交开发，AI 正在处理中…</span>
            </div>
          </AIBubbleWrapper>
        </>
      )}
    </div>
  );
};

export default PlanFlow;
