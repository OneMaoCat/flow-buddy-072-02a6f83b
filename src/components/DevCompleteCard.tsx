import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  FileCode2,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Search,
  Code2,
  TestTube2,
  Sparkles,
  GitBranch,
  Pencil,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ── */

interface DiffFile {
  path: string;
  additions: number;
  deletions: number;
  lines: { type: "add" | "del" | "ctx"; content: string }[];
}

interface TestCase {
  name: string;
  passed: boolean;
  duration: number;
}

export interface DevCompleteResult {
  id: string;
  requirementTitle: string;
  previewPath: string;
  projectId: string;
  files: DiffFile[];
  tests: TestCase[];
  elapsed: number;
}

export const buildMockDevResult = (
  id: string,
  title: string,
  projectId: string
): DevCompleteResult => ({
  id,
  requirementTitle: title,
  previewPath: "/login",
  projectId,
  elapsed: Math.floor(Math.random() * 20) + 5,
  files: [
    {
      path: "src/components/LoginForm.tsx",
      additions: 24,
      deletions: 8,
      lines: [
        { type: "ctx", content: "  const [email, setEmail] = useState('');" },
        { type: "del", content: "  // TODO: add validation" },
        { type: "add", content: "  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;" },
        { type: "add", content: "  const isValidEmail = emailRegex.test(email);" },
        { type: "ctx", content: "" },
        { type: "add", content: "  const validatePassword = (pw: string) => pw.length >= 8 && /\\d/.test(pw) && /[a-zA-Z]/.test(pw);" },
        { type: "del", content: "  if (!email) alert('请输入邮箱');" },
        { type: "add", content: "  if (!isValidEmail) setError('请输入有效的邮箱地址');" },
      ],
    },
    {
      path: "src/components/FormErrorTip.tsx",
      additions: 18,
      deletions: 0,
      lines: [
        { type: "add", content: "interface FormErrorTipProps {" },
        { type: "add", content: "  message: string;" },
        { type: "add", content: "  visible: boolean;" },
        { type: "add", content: "}" },
        { type: "add", content: "" },
        { type: "add", content: "const FormErrorTip = ({ message, visible }: FormErrorTipProps) => (" },
        { type: "add", content: '  visible ? <p className="text-destructive text-xs mt-1">{message}</p> : null' },
        { type: "add", content: ");" },
      ],
    },
    {
      path: "src/components/LoginForm.test.ts",
      additions: 42,
      deletions: 0,
      lines: [
        { type: "add", content: "describe('LoginForm validation', () => {" },
        { type: "add", content: "  it('rejects invalid email format', () => { ... });" },
        { type: "add", content: "  it('requires password', () => { ... });" },
        { type: "add", content: "  it('enforces min 8 chars', () => { ... });" },
        { type: "add", content: "});" },
      ],
    },
  ],
  tests: [
    { name: "邮箱格式校验 — 缺少@符号", passed: true, duration: 12 },
    { name: "邮箱格式校验 — 空字符串", passed: true, duration: 8 },
    { name: "邮箱格式校验 — 正常邮箱", passed: true, duration: 5 },
    { name: "密码校验 — 少于8位", passed: true, duration: 10 },
    { name: "密码校验 — 纯数字", passed: true, duration: 9 },
    { name: "密码校验 — 纯字母", passed: true, duration: 7 },
    { name: "密码校验 — 合法密码", passed: true, duration: 4 },
    { name: "表单提交 — 阻止无效提交", passed: true, duration: 18 },
    { name: "错误提示组件 — 显示/隐藏", passed: true, duration: 6 },
    { name: "集成测试 — 完整登录流程", passed: true, duration: 45 },
  ],
});

/* ── 6-step process definition ── */

interface ProcessStep {
  icon: React.ReactNode;
  label: string;
  detail?: string;
}

const buildProcessSteps = (result: DevCompleteResult): ProcessStep[] => {
  const totalAdds = result.files.reduce((s, f) => s + f.additions, 0);
  const totalDels = result.files.reduce((s, f) => s + f.deletions, 0);
  const passedTests = result.tests.filter((t) => t.passed).length;
  const branchName = `feature/req-${result.id.slice(0, 8)}`;

  return [
    { icon: <GitBranch size={12} />, label: "拉取分支", detail: branchName },
    { icon: <Search size={12} />, label: "分析需求", detail: `理解「${result.requirementTitle.slice(0, 20)}${result.requirementTitle.length > 20 ? "…" : ""}」` },
    { icon: <Sparkles size={12} />, label: "制定方案", detail: `规划 ${result.files.length} 个文件的修改方案` },
    { icon: <Code2 size={12} />, label: "编写代码", detail: result.files.map((f) => f.path.split("/").pop()).join("、") },
    { icon: <Pencil size={12} />, label: "修改代码", detail: `${result.files.length} 个文件 · +${totalAdds} -${totalDels}` },
    { icon: <TestTube2 size={12} />, label: "运行测试", detail: `${passedTests}/${result.tests.length} 用例通过` },
  ];
};

/* ── DevProcessLog: completed steps ── */

const DevProcessLog = ({ result }: { result: DevCompleteResult }) => {
  const steps = buildProcessSteps(result);

  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-2.5 py-1">
          <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
            {step.icon}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-foreground">{step.label}</span>
            {step.detail && (
              <span className="text-xs text-muted-foreground ml-1.5">{step.detail}</span>
            )}
          </div>
          <CheckCircle2 size={12} className="text-primary/60 shrink-0 mt-0.5" />
        </div>
      ))}
    </div>
  );
};

/* ── DevInProgressCard: 6-step animated live generation ── */

export const DevInProgressCard = ({
  requirement,
  onViewDetail,
}: {
  requirement: string;
  onViewDetail?: () => void;
}) => {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const branchName = `feature/req-${Date.now().toString(36).slice(-6)}`;

  const steps: ProcessStep[] = [
    { icon: <GitBranch size={12} />, label: "拉取分支", detail: branchName },
    { icon: <Search size={12} />, label: "分析需求", detail: `理解「${requirement.slice(0, 20)}${requirement.length > 20 ? "…" : ""}」` },
    { icon: <Sparkles size={12} />, label: "制定方案", detail: "规划实现路径与文件变更…" },
    { icon: <Code2 size={12} />, label: "编写代码", detail: "正在生成代码…" },
    { icon: <Pencil size={12} />, label: "修改代码", detail: "处理文件变更中…" },
    { icon: <TestTube2 size={12} />, label: "运行测试", detail: "待执行" },
  ];

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    const delays = [800, 1800, 3200, 4800, 6200, 7400];
    delays.forEach((delay, i) => {
      timers.push(setTimeout(() => setVisibleSteps(i + 1), delay));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex flex-col gap-0">
        {steps.map((step, i) => {
          if (i >= visibleSteps) return null;
          const isLast = i === visibleSteps - 1;
          const isCompleted = !isLast;
          return (
            <div key={i} className="flex items-start gap-2.5 py-1 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <div className={cn(
                "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                isLast ? "bg-primary/15 text-primary" : "bg-primary/10 text-primary"
              )}>
                {isLast ? <Loader2 size={12} className="animate-spin" /> : step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-foreground">{step.label}</span>
                <span className="text-xs text-muted-foreground ml-1.5">{step.detail}</span>
              </div>
              {isCompleted && <CheckCircle2 size={12} className="text-primary/60 shrink-0 mt-0.5" />}
            </div>
          );
        })}
        {steps.slice(visibleSteps).map((step, i) => (
          <div key={`upcoming-${i}`} className="flex items-start gap-2.5 py-1 opacity-30">
            <div className="mt-0.5 w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
              {step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
              <span className="text-xs text-muted-foreground/60 ml-1.5">{step.detail}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <Loader2 size={12} className="animate-spin text-primary" />
          <span className="text-[11px] text-muted-foreground">AI 正在开发中…</span>
        </div>
        {onViewDetail && (
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetail(); }}
            className="flex items-center gap-1 text-xs text-primary font-medium hover:text-primary/80 transition-colors"
          >
            <span>查看详情</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

/* ── Main Card: Compact completion card ── */

interface DevCompleteCardProps {
  result: DevCompleteResult;
  onDeploy: (id: string) => void;
  onReject: (id: string) => void;
  deployed?: boolean;
  reviewing?: boolean;
  reviewApproved?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

const DevCompleteCard = ({ result, deployed, reviewing, reviewApproved, selected, onClick }: DevCompleteCardProps) => {
  const totalAdds = result.files.reduce((s, f) => s + f.additions, 0);
  const totalDels = result.files.reduce((s, f) => s + f.deletions, 0);
  const passedTests = result.tests.filter((t) => t.passed).length;

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500 transition-all",
        selected ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-muted-foreground/30",
        onClick && "cursor-pointer"
      )}
    >
      <div className="px-4 pt-3 pb-2">
        <DevProcessLog result={result} />
      </div>
      <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border bg-muted/30">
        <div className="w-6 h-6 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
          <CheckCircle2 size={14} className="text-green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground">开发完成</p>
          <p className="text-[10px] text-muted-foreground">
            {result.files.length} 文件 · <span className="text-green-500">+{totalAdds}</span> <span className="text-destructive">-{totalDels}</span> · {passedTests}/{result.tests.length} 测试通过 · {result.elapsed}s
          </p>
        </div>
        {deployed ? (
          <Badge className="text-[10px] bg-green-500/15 text-green-500 border-0">已发布</Badge>
        ) : reviewApproved ? (
          <Badge className="text-[10px] bg-green-500/15 text-green-500 border-0">审查通过</Badge>
        ) : reviewing ? (
          <Badge className="text-[10px] bg-amber-500/15 text-amber-600 border-0 gap-1">
            <Users size={10} /> 审查中
          </Badge>
        ) : null}
        <div className="flex items-center gap-1 text-xs text-primary font-medium shrink-0">
          <span>查看详情</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
};

export default DevCompleteCard;
