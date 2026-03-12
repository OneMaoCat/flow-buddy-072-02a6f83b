import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ClarifyCards, { type ClarifyQuestion } from "./ClarifyCards";
import RequirementDoc, { type RequirementDocData } from "./RequirementDoc";
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

const buildMockDoc = (requirement: string): RequirementDocData => ({
  title: requirement.length > 30 ? requirement.slice(0, 30) + "…" : requirement,
  background:
    "当前系统的用户登录页面在表单验证方面存在若干问题，包括邮箱格式校验缺失、密码强度提示不明确、必填项未做前端拦截等。这些问题导致用户体验不佳，同时也增加了后端无效请求的处理压力。本次需求旨在全面修复登录表单验证逻辑，并补充对应的单元测试以防止回归。",
  scenarios: [
    {
      id: "s1",
      actor: "普通用户",
      action: "在登录页输入不合法的邮箱格式后点击登录",
      expectedResult: "表单即时显示「请输入有效的邮箱地址」错误提示，阻止表单提交",
    },
    {
      id: "s2",
      actor: "普通用户",
      action: "在登录页仅填写邮箱、留空密码后点击登录",
      expectedResult: "密码输入框下方显示「密码为必填项」提示，阻止表单提交",
    },
    {
      id: "s3",
      actor: "开发人员",
      action: "运行单元测试套件",
      expectedResult: "所有验证场景（正常/异常）测试用例通过，覆盖率 ≥ 90%",
    },
  ],
  flowSteps: [
    { id: "f1", label: "用户打开登录页" },
    { id: "f2", label: "填写邮箱和密码" },
    { id: "f3", label: "点击「登录」按钮" },
    { id: "f4", label: "前端表单验证" },
    { id: "f5", label: "验证通过 → 发送请求" },
    { id: "f6", label: "验证失败 → 显示错误提示" },
  ],
  changePoints: [
    {
      id: "c1",
      module: "LoginForm 组件",
      description: "新增邮箱格式正则校验，添加密码强度检查（至少 8 位，含数字和字母）",
      type: "modify",
    },
    {
      id: "c2",
      module: "FormErrorTip 组件",
      description: "新建通用的表单行内错误提示组件，支持动态文案和动画效果",
      type: "add",
    },
    {
      id: "c3",
      module: "LoginForm.test.ts",
      description: "新增单元测试文件，覆盖邮箱/密码验证的正常与异常场景",
      type: "add",
    },
    {
      id: "c4",
      module: "旧版 alert() 验证逻辑",
      description: "移除原有的 window.alert 弹窗式验证提示，替换为行内提示",
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
}

const PlanFlow = ({ requirement, onCancel, onStartDev, onOpenDocEditor }: PlanFlowProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stage, setStage] = useState<FlowStage>("clarifying");
  const [clarifyAnswers, setClarifyAnswers] = useState<Record<string, string> | null>(null);
  const [docData, setDocData] = useState<RequirementDocData>(() => buildMockDoc(requirement));

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
            <span className="text-sm text-muted-foreground">正在生成需求文档...</span>
          </div>
        </AIBubbleWrapper>
      )}

      {/* 5. Requirement Document */}
      {stage === "planning" && (
        <AIBubbleWrapper>
          <p className="text-sm text-muted-foreground mb-3">
            根据你的需求，我生成了以下需求文档，你可以点击任意内容进行编辑：
          </p>
          <RequirementDoc
            data={docData}
            onChange={setDocData}
            onConfirm={() => {
              setStage("confirmed");
              onStartDev();
              setTimeout(() => navigate(`/project/${id}/dev`), 1000);
            }}
            onRevise={onCancel}
          />
        </AIBubbleWrapper>
      )}

      {stage === "confirmed" && (
        <>
          <UserBubble text="确认需求，开始开发！" />
          <AIBubbleWrapper>
            <div className="flex items-center gap-2 py-4">
              <Loader2 size={18} className="text-primary animate-spin" />
              <span className="text-sm text-foreground font-medium">正在根据需求文档进行开发...</span>
            </div>
          </AIBubbleWrapper>
        </>
      )}
    </div>
  );
};

export default PlanFlow;
