import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Code2, TestTube2, Eye, Plug, Database, Palette, AlertCircle, CheckCircle2, Loader2, Clock, ArrowLeft, Search, ChevronDown, ChevronUp, ListFilter, ShieldCheck, RotateCcw, CheckCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import ProjectSidebarLayout from "@/components/ProjectSidebarLayout";
import RequirementPreview from "@/components/RequirementPreview";
import SidebarConversationList from "@/components/SidebarConversationList";
import { buildMockConversations, type Conversation } from "@/data/conversations";
import { createInitialRequirements, formatTime, logTemplates, generateTestsForRequirement } from "@/data/devExecutionMock";
import type { Requirement, Agent, AgentStatus, RequirementStatus, LogEntry, TestItem, TestItemStatus } from "@/data/devExecutionMock";

// ---------- Icon map ----------
const agentIcons: Record<string, React.ReactNode> = {
  code: <Code2 size={14} />,
  test: <TestTube2 size={14} />,
  review: <Eye size={14} />,
  api: <Plug size={14} />,
  db: <Database size={14} />,
  ui: <Palette size={14} />,
};

// ---------- Status helpers ----------
const StatusIcon = ({ status }: { status: AgentStatus }) => {
  switch (status) {
    case "done": return <CheckCircle2 size={14} className="text-green-500" />;
    case "running": return <Loader2 size={14} className="text-primary animate-spin" />;
    case "error": return <AlertCircle size={14} className="text-destructive" />;
    default: return <Clock size={14} className="text-muted-foreground" />;
  }
};

const reqStatusIcon = (status: RequirementStatus) => {
  switch (status) {
    case "done": return <CheckCircle2 size={14} className="text-green-500" />;
    case "running": return <Loader2 size={14} className="text-primary animate-spin" />;
    case "testing": return <TestTube2 size={14} className="text-violet-500 animate-pulse" />;
    case "review": return <ShieldCheck size={14} className="text-orange-500" />;
    case "accepted": return <CheckCheck size={14} className="text-green-600" />;
    case "rejected": return <XCircle size={14} className="text-destructive" />;
    default: return <Clock size={14} className="text-muted-foreground/50" />;
  }
};

const reqStatusLabel = (status: RequirementStatus) => {
  switch (status) {
    case "testing": return <Badge variant="outline" className="text-[10px] px-1.5 border-violet-500/40 text-violet-600 bg-violet-500/10">测试中</Badge>;
    case "review": return <Badge variant="outline" className="text-[10px] px-1.5 border-orange-500/40 text-orange-600 bg-orange-500/10">待验收</Badge>;
    case "accepted": return <Badge variant="outline" className="text-[10px] px-1.5 border-green-500/40 text-green-600 bg-green-500/10">已通过</Badge>;
    case "rejected": return <Badge variant="outline" className="text-[10px] px-1.5 border-destructive/40 text-destructive bg-destructive/10">已打回</Badge>;
    default: return null;
  }
};

type FilterTab = "all" | "running" | "testing" | "done" | "waiting" | "review" | "accepted" | "rejected";

// ---------- Stat Card ----------
const StatCard = ({ label, value, active, color }: { label: string; value: number; active?: boolean; color?: string }) => (
  <div className={cn(
    "rounded-md border px-3 py-2 text-center min-w-[72px]",
    active ? "border-primary/40 bg-primary/5" : "border-border bg-card",
    color
  )}>
    <div className="text-lg font-bold font-mono leading-none">{value}</div>
    <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
  </div>
);

// ---------- Component ----------
const DevExecution = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // Shared conversation sidebar state
  const [mockData] = useState(() => buildMockConversations());
  const [conversations] = useState<Conversation[]>(mockData.conversations);
  const [deployedIds] = useState<Set<string>>(mockData.deployedIds);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const totalTaskCount = conversations.reduce(
    (sum, c) => sum + c.tasks.length + (c.devInProgress ? 1 : 0),
    0
  );

  const [requirements, setRequirements] = useState<Requirement[]>(createInitialRequirements);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const [allDone, setAllDone] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef(Date.now());

  // UI state
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [expandedReq, setExpandedReq] = useState<string | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [rejectingReq, setRejectingReq] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Computed stats
  const totalAgents = requirements.reduce((s, r) => s + r.agents.length, 0);
  const doneAgents = requirements.reduce((s, r) => s + r.agents.filter(a => a.status === "done").length, 0);
  const overallProgress = totalAgents ? Math.round((doneAgents / totalAgents) * 100) : 0;

  const counts = useMemo(() => ({
    total: requirements.length,
    running: requirements.filter(r => r.status === "running").length,
    done: requirements.filter(r => r.status === "done").length,
    testing: requirements.filter(r => r.status === "testing").length,
    waiting: requirements.filter(r => r.status === "waiting").length,
    review: requirements.filter(r => r.status === "review").length,
    accepted: requirements.filter(r => r.status === "accepted").length,
    rejected: requirements.filter(r => r.status === "rejected").length,
  }), [requirements]);

  // Dev done = no waiting/running/done left (all are review/accepted/rejected)
  const devPhaseComplete = counts.waiting === 0 && counts.running === 0 && counts.done === 0 && counts.testing === 0 && counts.total > 0;
  const allAccepted = counts.accepted === counts.total && counts.total > 0;

  // Filtered list
  const filtered = useMemo(() => {
    let list = requirements;
    if (filter !== "all") list = list.filter(r => r.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r => r.title.toLowerCase().includes(q));
    }
    return list;
  }, [requirements, filter, search]);

  // When a requirement's agents all finish → auto-transition to "testing" (not directly "review")
  useEffect(() => {
    setRequirements(prev => {
      const hasChange = prev.some(r => r.status === "done");
      if (!hasChange) return prev;
      return prev.map(r => {
        if (r.status !== "done") return r;
        const tests = generateTestsForRequirement(r);
        return { ...r, status: "testing" as RequirementStatus, testResult: { tests, retryCount: 0, isRetrying: false } };
      });
    });
  }, [requirements.filter(r => r.status === "done").length]);

  // Testing simulation: run tests one by one, then transition to review or retry
  useEffect(() => {
    const testingReqs = requirements.filter(r => r.status === "testing" && r.testResult);
    if (testingReqs.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const req of testingReqs) {
      const tr = req.testResult!;
      const pendingTests = tr.tests.filter(t => t.status === "pending");
      if (pendingTests.length === 0) continue;

      pendingTests.forEach((test, i) => {
        // Set to running
        timers.push(setTimeout(() => {
          setRequirements(prev => prev.map(r => {
            if (r.id !== req.id || !r.testResult) return r;
            return { ...r, testResult: { ...r.testResult!, tests: r.testResult!.tests.map(t => t.id === test.id ? { ...t, status: "running" as TestItemStatus } : t) } };
          }));
        }, i * 500));

        // Set to passed/failed
        timers.push(setTimeout(() => {
          setRequirements(prev => prev.map(r => {
            if (r.id !== req.id || !r.testResult) return r;
            const isRetry = r.testResult!.retryCount > 0;
            const shouldFail = !isRetry && Math.random() < 0.15;
            const newTests = r.testResult!.tests.map(t =>
              t.id === test.id ? { ...t, status: (shouldFail ? "failed" : "passed") as TestItemStatus, duration: Math.floor(Math.random() * 400 + 80) } : t
            );
            const allDone = newTests.every(t => t.status === "passed" || t.status === "failed");
            const allPassed = newTests.every(t => t.status === "passed");
            const hasFailed = newTests.some(t => t.status === "failed");

            if (allDone) {
              if (allPassed) {
                // All passed → move to review
                setLogs(l => [...l, { time: formatTime(), reqId: r.id, agentName: "AI 测试", message: `✅ 全部 ${newTests.length} 个测试通过，进入待验收` }]);
                return { ...r, status: "review" as RequirementStatus, testResult: { ...r.testResult!, tests: newTests } };
              } else if (hasFailed && r.testResult!.retryCount < 3) {
                // Has failures → schedule auto-retry
                setLogs(l => [...l, { time: formatTime(), reqId: r.id, agentName: "AI 测试", message: `❌ ${newTests.filter(t => t.status === "failed").length} 个测试失败，自动修复重试中...` }]);
                // After a delay, reset failed tests to pending for retry
                setTimeout(() => {
                  setRequirements(prev2 => prev2.map(r2 => {
                    if (r2.id !== req.id || !r2.testResult) return r2;
                    return {
                      ...r2,
                      testResult: {
                        tests: r2.testResult!.tests.map(t => t.status === "failed" ? { ...t, status: "pending" as TestItemStatus, duration: undefined } : t),
                        retryCount: r2.testResult!.retryCount + 1,
                        isRetrying: true,
                      }
                    };
                  }));
                }, 1500);
                return { ...r, testResult: { ...r.testResult!, tests: newTests, isRetrying: true } };
              } else {
                // Max retries exceeded → move to review anyway
                setLogs(l => [...l, { time: formatTime(), reqId: r.id, agentName: "AI 测试", message: `⚠️ 测试未全部通过，但已达最大重试次数，进入待验收` }]);
                return { ...r, status: "review" as RequirementStatus, testResult: { ...r.testResult!, tests: newTests } };
              }
            }
            return { ...r, testResult: { ...r.testResult!, tests: newTests } };
          }));
        }, i * 500 + 350));
      });
    }

    return () => timers.forEach(t => clearTimeout(t));
  }, [requirements.filter(r => r.status === "testing").length, requirements.map(r => r.testResult?.tests.filter(t => t.status === "pending").length).join(",")]);

  // Detect all dev done
  useEffect(() => {
    if (requirements.length > 0 && requirements.every(r => r.status !== "running" && r.status !== "waiting" && r.status !== "done" && r.status !== "testing") && !allDone) {
      setAllDone(true);
      setElapsedSeconds(Math.round((Date.now() - startTimeRef.current) / 1000));
    }
  }, [requirements, allDone]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsOpen) logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, logsOpen]);

  // Simulation tick (concurrency up to 8)
  useEffect(() => {
    if (allDone) return;
    const interval = setInterval(() => {
      setRequirements(prev => {
        const next = prev.map(req => ({ ...req, agents: req.agents.map(a => ({ ...a })) }));
        const newLogs: LogEntry[] = [];

        // Activate waiting reqs up to 8 concurrent
        const runningReqs = next.filter(r => r.status === "running").length;
        const slotsAvailable = 8 - runningReqs;
        if (slotsAvailable > 0) {
          const waitingReqs = next.filter(r => r.status === "waiting");
          for (let i = 0; i < Math.min(slotsAvailable, waitingReqs.length); i++) {
            waitingReqs[i].status = "running";
            const firstAgent = waitingReqs[i].agents.find(a => !a.dependsOn);
            if (firstAgent) {
              firstAgent.status = "running";
              newLogs.push({ time: formatTime(), reqId: waitingReqs[i].id, agentName: firstAgent.name, message: `开始处理 ${firstAgent.currentFile}` });
            }
          }
        }

        for (const req of next) {
          if (req.status !== "running") continue;
          for (const agent of req.agents) {
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
              } else if (Math.random() < 0.15) {
                const tpl = logTemplates.running[Math.floor(Math.random() * logTemplates.running.length)];
                newLogs.push({ time: formatTime(), reqId: req.id, agentName: agent.name, message: tpl.replace("{file}", agent.currentFile) });
              }
            }
          }
          if (req.agents.every(a => a.status === "done")) req.status = "done";
        }

        if (newLogs.length > 0) setLogs(l => [...l, ...newLogs].slice(-200));
        return next;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [allDone]);

  // ---------- Review actions ----------
  const handleAccept = useCallback((reqId: string) => {
    setRequirements(prev => prev.map(r => r.id === reqId ? { ...r, status: "accepted" as RequirementStatus } : r));
    setLogs(l => [...l, { time: formatTime(), reqId, agentName: "验收", message: "✅ 需求已通过验收" }]);
  }, []);

  const handleReject = useCallback((reqId: string) => {
    if (!rejectReason.trim()) return;
    setRequirements(prev => prev.map(r => {
      if (r.id !== reqId) return r;
      // Reset agents to re-run
      const resetAgents = r.agents.map(a => ({ ...a, progress: 0, status: "waiting" as AgentStatus }));
      const first = resetAgents.find(a => !a.dependsOn);
      if (first) first.status = "running" as AgentStatus;
      return { ...r, status: "running" as RequirementStatus, rejectReason: rejectReason.trim(), agents: resetAgents };
    }));
    setLogs(l => [...l, { time: formatTime(), reqId, agentName: "验收", message: `❌ 需求已打回: ${rejectReason.trim()}` }]);
    setRejectingReq(null);
    setRejectReason("");
    setAllDone(false);
  }, [rejectReason]);

  const handleAcceptAll = useCallback(() => {
    setRequirements(prev => prev.map(r => r.status === "review" ? { ...r, status: "accepted" as RequirementStatus } : r));
    setLogs(l => [...l, { time: formatTime(), reqId: "all", agentName: "验收", message: "✅ 所有待验收需求已批量通过" }]);
  }, []);

  const getReqProgress = (req: Requirement) => {
    if (req.agents.length === 0) return 0;
    return Math.round(req.agents.reduce((s, a) => s + a.progress, 0) / req.agents.length);
  };

  const reqTitleMap: Record<string, string> = {};
  requirements.forEach(r => { reqTitleMap[r.id] = r.title; });

  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "全部", count: counts.total },
    { key: "running", label: "执行中", count: counts.running },
    { key: "testing", label: "测试中", count: counts.testing },
    { key: "review", label: "待验收", count: counts.review },
    { key: "accepted", label: "已通过", count: counts.accepted },
    { key: "rejected", label: "已打回", count: counts.rejected },
    { key: "waiting", label: "等待中", count: counts.waiting },
  ];

  return (
    <ProjectSidebarLayout
      onDeepFlowClick={() => { navigate(`/project/${id}`); }}
      taskList={
        <SidebarConversationList
          conversations={conversations}
          deployedIds={deployedIds}
          activeConversationId={activeConversationId}
          selectedCardId={selectedCardId}
          onSelectConversation={(cid) => {
            setActiveConversationId(cid);
            setSelectedCardId(null);
          }}
          onSelectCard={(cardId) => {
            setSelectedCardId(cardId);
            // Find parent conversation
            for (const conv of conversations) {
              if (conv.tasks.some((t) => t.id === cardId)) {
                setActiveConversationId(conv.id);
                break;
              }
            }
            navigate(`/project/${id}`);
          }}
          onNewConversation={() => navigate(`/project/${id}`)}
        />
      }
      taskCount={totalTaskCount}
      headerRight={
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="text-right mr-2">
            <p className="text-xs text-muted-foreground">
              {counts.accepted}/{counts.total} 验收通过 · {counts.running} 进行中
            </p>
          </div>
          <Progress value={overallProgress} className="h-2 flex-1" />
          <span className="text-xs font-mono text-muted-foreground w-10 text-right">{overallProgress}%</span>
        </div>
      }
    >
      {() => (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Stats bar */}
          <div className="shrink-0 px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <StatCard label="总需求" value={counts.total} />
              <StatCard label="执行中" value={counts.running} active={counts.running > 0} />
              <StatCard label="测试中" value={counts.testing} color={counts.testing > 0 ? "border-violet-500/30 bg-violet-500/5" : ""} />
              <StatCard label="待验收" value={counts.review} color={counts.review > 0 ? "border-orange-500/30 bg-orange-500/5" : ""} />
              <StatCard label="已通过" value={counts.accepted} color={counts.accepted > 0 ? "border-green-500/30 bg-green-500/5" : ""} />
              <StatCard label="已打回" value={counts.rejected} color={counts.rejected > 0 ? "border-destructive/30 bg-destructive/5" : ""} />
              <StatCard label="等待中" value={counts.waiting} />
              <div className="flex-1 min-w-[120px] max-w-[240px] ml-auto">
                <div className="text-[10px] text-muted-foreground mb-1 text-right">总体进度</div>
                <div className="flex items-center gap-2">
                  <Progress value={overallProgress} className="h-2 flex-1" />
                  <span className="text-sm font-mono font-bold">{overallProgress}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter + Search */}
          <div className="shrink-0 px-4 py-2 flex items-center gap-2 border-b border-border">
            <div className="flex items-center gap-1 overflow-x-auto">
              {filterTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                    filter === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {tab.label} <span className="ml-1 opacity-70">{tab.count}</span>
                </button>
              ))}
            </div>
            <div className="relative ml-auto max-w-[200px]">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索需求..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-7 pl-7 text-xs"
              />
            </div>
          </div>

          {/* Compact requirement rows */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 py-2">
              {filtered.length === 0 && (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  <ListFilter size={16} className="mr-2" />
                  无匹配需求
                </div>
              )}
              {filtered.map((req) => {
                const progress = getReqProgress(req);
                const isExpanded = expandedReq === req.id;
                const globalIdx = requirements.indexOf(req);
                const isReview = req.status === "review";
                const isRejecting = rejectingReq === req.id;
                return (
                  <div key={req.id} className={cn(req.status === "accepted" && !isExpanded && "opacity-60")}>
                    {/* Row */}
                    <button
                      onClick={() => setExpandedReq(isExpanded ? null : req.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors hover:bg-muted/50",
                        isExpanded && "bg-muted/50",
                        req.status === "running" && "bg-primary/[0.03]",
                        req.status === "testing" && "bg-violet-500/[0.03]",
                        isReview && "bg-orange-500/[0.03]"
                      )}
                    >
                      <span className="text-[10px] font-mono text-muted-foreground w-8 shrink-0 text-right">#{globalIdx + 1}</span>
                      {reqStatusIcon(req.status)}
                      <span className="text-xs font-medium truncate flex-1 min-w-0">{req.title}</span>
                      {reqStatusLabel(req.status)}
                      <div className="flex items-center gap-1.5 w-28 shrink-0">
                        <Progress value={progress} className="h-1 flex-1" />
                        <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">{progress}%</span>
                      </div>
                      <ChevronDown size={12} className={cn(
                        "text-muted-foreground transition-transform shrink-0",
                        isExpanded && "rotate-180"
                      )} />
                    </button>

                    {/* Expanded agent details */}
                    {isExpanded && (
                      <div className="ml-10 mr-2 mb-2 mt-1 border-l-2 border-primary/20 pl-3 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                        {req.agents.map(agent => (
                          <div key={agent.id} className="flex items-center gap-2 py-1">
                            <StatusIcon status={agent.status} />
                            <span className="text-muted-foreground">{agentIcons[agent.icon]}</span>
                            <span className="text-[11px] font-medium w-16 shrink-0">{agent.name}</span>
                            <Progress
                              value={agent.progress}
                              className={cn("h-1 flex-1", agent.status === "waiting" && "opacity-30")}
                            />
                            <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">
                              {agent.status === "waiting" ? "—" : `${agent.progress}%`}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                              {agent.currentFile}
                            </span>
                          </div>
                        ))}

                        {/* AI Testing Agent section */}
                        {(req.status === "testing" || req.testResult) && req.testResult && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex items-center gap-2 mb-2">
                              <TestTube2 size={14} className="text-violet-500" />
                              <span className="text-xs font-semibold">AI 测试 Agent</span>
                              {req.status === "testing" && <Loader2 size={12} className="animate-spin text-violet-500" />}
                              {req.status !== "testing" && req.testResult.tests.every(t => t.status === "passed") && (
                                <Badge variant="outline" className="text-[10px] px-1.5 border-green-500/40 text-green-600 bg-green-500/10">全部通过</Badge>
                              )}
                            </div>
                            {/* Pass rate bar */}
                            {(() => {
                              const passed = req.testResult.tests.filter(t => t.status === "passed").length;
                              const total = req.testResult.tests.length;
                              const pct = Math.round((passed / total) * 100);
                              return (
                                <div className="mb-2">
                                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                                    <span>通过率</span>
                                    <span>{passed}/{total} ({pct}%)</span>
                                  </div>
                                  <Progress value={pct} className="h-1.5" />
                                </div>
                              );
                            })()}
                            {/* Test case list */}
                            <div className="space-y-0.5 max-h-[160px] overflow-y-auto">
                              {req.testResult.tests.map(t => (
                                <div key={t.id} className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-muted/50 transition-colors">
                                  {t.status === "passed" && <CheckCircle2 size={12} className="text-green-500 shrink-0" />}
                                  {t.status === "failed" && <XCircle size={12} className="text-destructive shrink-0" />}
                                  {t.status === "running" && <Loader2 size={12} className="animate-spin text-violet-500 shrink-0" />}
                                  {t.status === "pending" && <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                                  <span className="text-[11px] flex-1 truncate">{t.name}</span>
                                  {t.duration && <span className="text-[10px] text-muted-foreground">{t.duration}ms</span>}
                                </div>
                              ))}
                            </div>
                            {/* Retry indicator */}
                            {req.testResult.isRetrying && req.status === "testing" && (
                              <div className="mt-2 p-2 rounded-md bg-violet-500/5 border border-violet-500/20 flex items-center gap-2">
                                <RotateCcw size={12} className="text-violet-500 animate-spin" />
                                <span className="text-[11px] text-violet-600">AI 正在自动修复并重试（第 {req.testResult.retryCount} 次）...</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Reject reason display */}
                        {req.rejectReason && (
                          <div className="mt-2 p-2 rounded-md bg-destructive/5 border border-destructive/20 text-xs text-destructive">
                            <span className="font-medium">打回原因：</span>{req.rejectReason}
                          </div>
                        )}

                        {/* Product preview for review status */}
                        {isReview && req.previewPath && (
                          <RequirementPreview
                            previewPath={req.previewPath}
                            requirementTitle={req.title}
                            projectId={id || ""}
                          />
                        )}

                        {/* Review actions */}
                        {isReview && (
                          <div className="mt-3 pt-3 border-t border-border">
                            {!isRejecting ? (
                              <div className="flex items-center gap-2">
                                <Button size="sm" className="gap-1.5 h-7 text-xs bg-green-600 hover:bg-green-700" onClick={(e) => { e.stopPropagation(); handleAccept(req.id); }}>
                                  <CheckCircle2 size={12} /> 通过
                                </Button>
                                <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs border-destructive/40 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setRejectingReq(req.id); setRejectReason(""); }}>
                                  <XCircle size={12} /> 打回
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2" onClick={e => e.stopPropagation()}>
                                <Textarea
                                  placeholder="请填写打回原因..."
                                  value={rejectReason}
                                  onChange={e => setRejectReason(e.target.value)}
                                  className="min-h-[60px] text-xs"
                                  autoFocus
                                />
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="destructive" className="gap-1.5 h-7 text-xs" disabled={!rejectReason.trim()} onClick={() => handleReject(req.id)}>
                                    <RotateCcw size={12} /> 确认打回
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setRejectingReq(null); setRejectReason(""); }}>
                                    取消
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Bottom review action bar */}
          {(counts.review > 0 || allAccepted) && (
            <div className="shrink-0 border-t border-border bg-muted/30 px-4 py-3 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3">
                <div className="flex-1 text-xs text-muted-foreground">
                  {counts.review > 0 && <span className="text-orange-600 font-medium">{counts.review} 个待验收</span>}
                  {counts.accepted > 0 && <span className="ml-2">· {counts.accepted} 已通过</span>}
                  {counts.rejected > 0 && <span className="ml-2 text-destructive">· {counts.rejected} 已打回</span>}
                </div>
                {counts.review > 0 && (
                  <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700" onClick={handleAcceptAll}>
                    <CheckCheck size={14} /> 一键全部通过
                  </Button>
                )}
                {allAccepted && (
                  <Button size="sm" className="gap-1.5" onClick={() => navigate(`/project/${id}?devComplete=true`)}>
                    <ArrowLeft size={14} /> 返回工作区发布
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Collapsible Logs */}
          <div className="shrink-0 border-t border-border">
            <button
              onClick={() => setLogsOpen(o => !o)}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted/30 transition-colors"
            >
              <span className="text-xs font-medium text-muted-foreground">实时日志</span>
              {lastLog && !logsOpen && (
                <span className="flex-1 text-[11px] font-mono text-muted-foreground truncate text-left">
                  [{lastLog.time}] {lastLog.agentName} — {lastLog.message}
                </span>
              )}
              {!lastLog && !logsOpen && (
                <span className="flex-1 text-[11px] text-muted-foreground text-left flex items-center gap-1">
                  <Loader2 size={10} className="animate-spin" /> 初始化中...
                </span>
              )}
              <Badge variant="outline" className="text-[10px] px-1.5">{logs.length}</Badge>
              {logsOpen ? <ChevronDown size={12} className="text-muted-foreground" /> : <ChevronUp size={12} className="text-muted-foreground" />}
            </button>
            {logsOpen && (
              <ScrollArea className="h-40 px-4 border-t border-border">
                <div className="py-2 space-y-0.5">
                  {logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] font-mono leading-relaxed">
                      <span className="text-muted-foreground shrink-0">[{log.time}]</span>
                      <span className="text-primary/70 shrink-0">{reqTitleMap[log.reqId]?.slice(0, 6)}…</span>
                      <span className="text-foreground/70 shrink-0">{log.agentName}</span>
                      <span className="text-muted-foreground">{log.message}</span>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      )}
    </ProjectSidebarLayout>
  );
};

export default DevExecution;
