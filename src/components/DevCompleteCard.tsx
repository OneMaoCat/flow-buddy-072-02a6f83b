import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RequirementPreview from "@/components/RequirementPreview";
import {
  FileCode2,
  Eye,
  TestTube2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Rocket,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Mock data ── */

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
  elapsed: number; // seconds
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

/* ── Sub-components ── */

const DiffView = ({ files }: { files: DiffFile[] }) => {
  const totalAdds = files.reduce((s, f) => s + f.additions, 0);
  const totalDels = files.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{files.length} 个文件变更</span>
        <span className="text-green-500">+{totalAdds}</span>
        <span className="text-destructive">-{totalDels}</span>
      </div>
      {files.map((f) => (
        <div key={f.path} className="rounded-md border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 border-b border-border">
            <FileCode2 size={12} className="text-muted-foreground" />
            <span className="text-xs font-mono text-foreground">{f.path}</span>
            <span className="ml-auto text-[10px] text-green-500">+{f.additions}</span>
            <span className="text-[10px] text-destructive">-{f.deletions}</span>
          </div>
          <div className="text-[11px] font-mono leading-5 bg-card">
            {f.lines.map((l, i) => (
              <div
                key={i}
                className={cn(
                  "px-3",
                  l.type === "add" && "bg-green-500/10 text-green-400",
                  l.type === "del" && "bg-destructive/10 text-destructive line-through",
                  l.type === "ctx" && "text-muted-foreground"
                )}
              >
                <span className="inline-block w-4 select-none opacity-50">
                  {l.type === "add" ? "+" : l.type === "del" ? "-" : " "}
                </span>
                {l.content}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const TestReport = ({ tests }: { tests: TestCase[] }) => {
  const passed = tests.filter((t) => t.passed).length;
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={passed === tests.length ? "default" : "destructive"} className="text-[10px]">
          {passed}/{tests.length} 通过
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          总耗时 {tests.reduce((s, t) => s + t.duration, 0)}ms
        </span>
      </div>
      <div className="rounded-md border border-border bg-card overflow-hidden">
        {tests.map((t, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-1.5 text-xs border-b border-border last:border-0"
          >
            {t.passed ? (
              <CheckCircle2 size={13} className="text-green-500 shrink-0" />
            ) : (
              <XCircle size={13} className="text-destructive shrink-0" />
            )}
            <span className="flex-1 text-foreground">{t.name}</span>
            <span className="text-[10px] text-muted-foreground">{t.duration}ms</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Main Card ── */

interface DevCompleteCardProps {
  result: DevCompleteResult;
  onDeploy: (id: string) => void;
  onReject: (id: string) => void;
  deployed?: boolean;
}

const DevCompleteCard = ({ result, onDeploy, onReject, deployed }: DevCompleteCardProps) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
          <CheckCircle2 size={16} className="text-green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            开发完成：{result.requirementTitle}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {result.files.length} 个文件变更 · {result.tests.length} 个测试全部通过 · 耗时{result.elapsed}s
          </p>
        </div>
        {deployed && (
          <Badge className="text-[10px] bg-green-500/15 text-green-500 border-0">已发布</Badge>
        )}
        {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <>
          <Tabs defaultValue="diff" className="border-t border-border">
            <TabsList className="mx-3 mt-2 mb-0 h-8">
              <TabsTrigger value="diff" className="text-[11px] h-6 gap-1">
                <FileCode2 size={12} /> 代码变更
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-[11px] h-6 gap-1">
                <Eye size={12} /> 产品预览
              </TabsTrigger>
              <TabsTrigger value="tests" className="text-[11px] h-6 gap-1">
                <TestTube2 size={12} /> 自测报告
              </TabsTrigger>
            </TabsList>

            <TabsContent value="diff" className="m-0 max-h-[360px] overflow-y-auto scrollbar-hide">
              <DiffView files={result.files} />
            </TabsContent>

            <TabsContent value="preview" className="m-0">
              <div className="p-3">
                <RequirementPreview
                  previewPath={result.previewPath}
                  requirementTitle={result.requirementTitle}
                  projectId={result.projectId}
                />
              </div>
            </TabsContent>

            <TabsContent value="tests" className="m-0 max-h-[360px] overflow-y-auto scrollbar-hide">
              <TestReport tests={result.tests} />
            </TabsContent>
          </Tabs>

          {/* Action bar */}
          {!deployed && (
            <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-muted/20">
              <Button
                size="sm"
                className="flex-1 gap-1.5 h-8 text-xs"
                onClick={() => onDeploy(result.id)}
              >
                <Rocket size={13} />
                确认无误，发布到测试环境
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => onReject(result.id)}
              >
                <RotateCcw size={12} />
                打回修改
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DevCompleteCard;
