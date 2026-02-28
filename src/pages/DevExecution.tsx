import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Code2, TestTube2, Eye, Plug, Database, Palette, AlertCircle, CheckCircle2, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------- Types ----------
type AgentStatus = "waiting" | "running" | "done" | "error";
type RequirementStatus = "waiting" | "running" | "done";

interface Agent {
  id: string;
  name: string;
  icon: string;
  progress: number;
  status: AgentStatus;
  currentFile: string;
  dependsOn?: string; // agent id
}

interface Requirement {
  id: string;
  title: string;
  status: RequirementStatus;
  agents: Agent[];
}

interface LogEntry {
  time: string;
  reqId: string;
  agentName: string;
  message: string;
}

// ---------- Icon map ----------
const agentIcons: Record<string, React.ReactNode> = {
  code: <Code2 size={14} />,
  test: <TestTube2 size={14} />,
  review: <Eye size={14} />,
  api: <Plug size={14} />,
  db: <Database size={14} />,
  ui: <Palette size={14} />,
};

// ---------- Initial mock data ----------
const createInitialRequirements = (): Requirement[] => [
  {
    id: "req-1",
    title: "用户登录表单验证修复",
    status: "running",
    agents: [
      { id: "r1-code", name: "代码生成", icon: "code", progress: 0, status: "running", currentFile: "LoginForm.tsx" },
      { id: "r1-test", name: "测试编写", icon: "test", progress: 0, status: "waiting", currentFile: "form.test.ts", dependsOn: "r1-code" },
      { id: "r1-review", name: "代码审查", icon: "review", progress: 0, status: "waiting", currentFile: "等待测试完成", dependsOn: "r1-test" },
    ],
  },
  {
    id: "req-2",
    title: "创建用户认证 API",
    status: "running",
    agents: [
      { id: "r2-db", name: "Schema 设计", icon: "db", progress: 0, status: "running", currentFile: "users.sql" },
      { id: "r2-api", name: "API 开发", icon: "api", progress: 0, status: "waiting", currentFile: "auth/login", dependsOn: "r2-db" },
      { id: "r2-test", name: "接口测试", icon: "test", progress: 0, status: "waiting", currentFile: "auth.test.ts", dependsOn: "r2-api" },
    ],
  },
  {
    id: "req-3",
    title: "支付模块集成",
    status: "waiting",
    agents: [
      { id: "r3-code", name: "支付接入", icon: "api", progress: 0, status: "waiting", currentFile: "payment.ts" },
      { id: "r3-ui", name: "UI 组件", icon: "ui", progress: 0, status: "waiting", currentFile: "PaymentForm.tsx", dependsOn: "r3-code" },
      { id: "r3-test", name: "支付测试", icon: "test", progress: 0, status: "waiting", currentFile: "payment.test.ts", dependsOn: "r3-ui" },
      { id: "r3-review", name: "安全审查", icon: "review", progress: 0, status: "waiting", currentFile: "等待测试完成", dependsOn: "r3-test" },
    ],
  },
  {
    id: "req-4",
    title: "用户个人中心页面",
    status: "waiting",
    agents: [
      { id: "r4-ui", name: "UI 开发", icon: "ui", progress: 0, status: "waiting", currentFile: "Profile.tsx" },
      { id: "r4-code", name: "逻辑开发", icon: "code", progress: 0, status: "waiting", currentFile: "useProfile.ts", dependsOn: "r4-ui" },
      { id: "r4-test", name: "测试编写", icon: "test", progress: 0, status: "waiting", currentFile: "profile.test.ts", dependsOn: "r4-code" },
    ],
  },
];

// ---------- Log messages templates ----------
const logTemplates: Record<string, string[]> = {
  running: [
    "开始处理 {file}",
    "正在分析 {file} 的代码结构",
    "生成代码中: {file}",
    "正在编写 {file}",
  ],
  done: [
    "✅ 完成 {file}",
    "✅ {file} 已生成并通过基础验证",
  ],
};

const formatTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
};

// ---------- Status badge ----------
const StatusBadge = ({ status }: { status: AgentStatus | RequirementStatus }) => {
  const config: Record<string, { label: string; className: string }> = {
    waiting: { label: "等待中", className: "bg-muted text-muted-foreground border-transparent" },
    running: { label: "执行中", className: "bg-primary/10 text-primary border-primary/30 animate-pulse" },
    done: { label: "已完成", className: "bg-green-500/10 text-green-600 border-green-500/30" },
    error: { label: "出错", className: "bg-destructive/10 text-destructive border-destructive/30" },
  };
  const c = config[status];
  return <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", c.className)}>{c.label}</Badge>;
};

const StatusIcon = ({ status }: { status: AgentStatus }) => {
  switch (status) {
    case "done": return <CheckCircle2 size={14} className="text-green-500" />;
    case "running": return <Loader2 size={14} className="text-primary animate-spin" />;
    case "error": return <AlertCircle size={14} className="text-destructive" />;
    default: return <Clock size={14} className="text-muted-foreground" />;
  }
};

// ---------- Component ----------
const DevExecution = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState<Requirement[]>(createInitialRequirements);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // compute totals
  const totalAgents = requirements.reduce((s, r) => s + r.agents.length, 0);
  const doneAgents = requirements.reduce((s, r) => s + r.agents.filter(a => a.status === "done").length, 0);
  const overallProgress = totalAgents ? Math.round((doneAgents / totalAgents) * 100) : 0;
  const runningCount = requirements.filter(r => r.status === "running").length;
  const doneCount = requirements.filter(r => r.status === "done").length;

  // auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // simulation tick
  useEffect(() => {
    const interval = setInterval(() => {
      setRequirements(prev => {
        const next = prev.map(req => ({ ...req, agents: req.agents.map(a => ({ ...a })) }));
        const newLogs: LogEntry[] = [];

        // activate waiting reqs if we have capacity (max 2 running)
        const runningReqs = next.filter(r => r.status === "running").length;
        if (runningReqs < 2) {
          const waitingReq = next.find(r => r.status === "waiting");
          if (waitingReq) {
            waitingReq.status = "running";
            const firstAgent = waitingReq.agents.find(a => !a.dependsOn);
            if (firstAgent) {
              firstAgent.status = "running";
              newLogs.push({ time: formatTime(), reqId: waitingReq.id, agentName: firstAgent.name, message: `开始处理 ${firstAgent.currentFile}` });
            }
          }
        }

        for (const req of next) {
          if (req.status !== "running") continue;

          for (const agent of req.agents) {
            // check dependency
            if (agent.dependsOn && agent.status === "waiting") {
              const dep = req.agents.find(a => a.id === agent.dependsOn);
              if (dep && dep.status === "done") {
                agent.status = "running";
                newLogs.push({ time: formatTime(), reqId: req.id, agentName: agent.name, message: `开始处理 ${agent.currentFile}` });
              }
            }

            if (agent.status === "running") {
              const increment = Math.floor(Math.random() * 12) + 3;
              agent.progress = Math.min(100, agent.progress + increment);

              if (agent.progress >= 100) {
                agent.status = "done";
                agent.progress = 100;
                const tpl = logTemplates.done[Math.floor(Math.random() * logTemplates.done.length)];
                newLogs.push({ time: formatTime(), reqId: req.id, agentName: agent.name, message: tpl.replace("{file}", agent.currentFile) });
              } else if (Math.random() < 0.3) {
                const tpl = logTemplates.running[Math.floor(Math.random() * logTemplates.running.length)];
                newLogs.push({ time: formatTime(), reqId: req.id, agentName: agent.name, message: tpl.replace("{file}", agent.currentFile) });
              }
            }
          }

          // check if all agents done
          if (req.agents.every(a => a.status === "done")) {
            req.status = "done";
          }
        }

        if (newLogs.length > 0) {
          setLogs(l => [...l, ...newLogs].slice(-100));
        }

        return next;
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const getReqProgress = (req: Requirement) => {
    if (req.agents.length === 0) return 0;
    return Math.round(req.agents.reduce((s, a) => s + a.progress, 0) / req.agents.length);
  };

  const reqTitleMap: Record<string, string> = {};
  requirements.forEach(r => { reqTitleMap[r.id] = r.title; });

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-5 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/project/${id}`)}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-sm font-semibold">开发执行中心</h1>
            <p className="text-xs text-muted-foreground">
              {doneCount}/{requirements.length} 需求完成 · {runningCount} 进行中
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 min-w-[200px]">
          <Progress value={overallProgress} className="h-2 flex-1" />
          <span className="text-xs font-mono text-muted-foreground w-10 text-right">{overallProgress}%</span>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Requirements list */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-3">
            {requirements.map((req, idx) => (
              <Collapsible key={req.id} defaultOpen={req.status === "running"}>
                <div className={cn(
                  "rounded-lg border bg-card",
                  req.status === "running" && "border-primary/30",
                  req.status === "done" && "border-green-500/20 opacity-80",
                )}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="text-xs font-mono text-muted-foreground w-6">#{idx + 1}</span>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{req.title}</span>
                          <StatusBadge status={req.status} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-32">
                        <Progress value={getReqProgress(req)} className="h-1.5 flex-1" />
                        <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{getReqProgress(req)}%</span>
                      </div>
                      <ChevronDown size={14} className="text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-3 space-y-2 border-t border-border pt-3">
                      {req.agents.map(agent => (
                        <div key={agent.id} className="flex items-center gap-3 py-1.5">
                          <StatusIcon status={agent.status} />
                          <span className="text-muted-foreground">{agentIcons[agent.icon]}</span>
                          <span className="text-xs font-medium w-20 shrink-0">{agent.name}</span>
                          <div className="flex-1 min-w-0">
                            <Progress
                              value={agent.progress}
                              className={cn("h-1.5", agent.status === "waiting" && "opacity-30")}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
                            {agent.status === "waiting" ? "—" : `${agent.progress}%`}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                            {agent.currentFile}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>

        {/* Logs */}
        <div className="h-48 border-t border-border flex flex-col shrink-0">
          <div className="px-4 py-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">实时日志</span>
          </div>
          <ScrollArea className="flex-1 px-4">
            <div className="py-2 space-y-1">
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] font-mono leading-relaxed">
                  <span className="text-muted-foreground shrink-0">[{log.time}]</span>
                  <span className="text-primary/70 shrink-0">{reqTitleMap[log.reqId]?.slice(0, 6)}…</span>
                  <span className="text-foreground/70 shrink-0">{log.agentName}</span>
                  <span className="text-muted-foreground">{log.message}</span>
                </div>
              ))}
              <div ref={logEndRef} />
              {logs.length === 0 && (
                <div className="flex items-center gap-2 py-4 justify-center">
                  <Loader2 size={14} className="text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground">正在初始化智能体...</span>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default DevExecution;
