import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Code2, TestTube2, Eye, Plug, Database, Palette, AlertCircle, CheckCircle2,
  Loader2, Clock, Search, ChevronDown, ListFilter, ShieldCheck, RotateCcw,
  CheckCheck, XCircle, Table2, LayoutGrid, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import ProjectSidebarLayout from "@/components/ProjectSidebarLayout";
import RequirementPreview from "@/components/RequirementPreview";
import SidebarConversationList from "@/components/SidebarConversationList";
import { buildMockConversations, type Conversation } from "@/data/conversations";
import { buildMockNotifications } from "@/data/notifications";
import NotificationCenter from "@/components/NotificationCenter";
import type { AppNotification } from "@/data/notifications";
import {
  createInitialRequirements, formatTime, logTemplates, generateTestsForRequirement,
  type Requirement, type Agent, type AgentStatus, type RequirementStatus, type LogEntry, type TestItemStatus,
} from "@/data/devExecutionMock";

// ---------- Icon map ----------
const agentIcons: Record<string, React.ReactNode> = {
  code: <Code2 size={14} />, test: <TestTube2 size={14} />, review: <Eye size={14} />,
  api: <Plug size={14} />, db: <Database size={14} />, ui: <Palette size={14} />,
};

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
  const map: Record<string, { label: string; cls: string }> = {
    waiting: { label: "等待中", cls: "text-muted-foreground bg-muted" },
    running: { label: "执行中", cls: "text-primary bg-primary/10" },
    done: { label: "完成", cls: "text-green-600 bg-green-500/10" },
    testing: { label: "测试中", cls: "text-violet-600 bg-violet-500/10" },
    review: { label: "待验收", cls: "text-orange-600 bg-orange-500/10" },
    accepted: { label: "已通过", cls: "text-green-600 bg-green-500/10" },
    rejected: { label: "已打回", cls: "text-destructive bg-destructive/10" },
  };
  const cfg = map[status] || map.waiting;
  return <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", cfg.cls)}>{cfg.label}</span>;
};

type FilterTab = "all" | "running" | "testing" | "done" | "waiting" | "review" | "accepted" | "rejected";
type ViewMode = "table" | "kanban";

const formatRelativeTime = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}小时前`;
  return `${Math.floor(hrs / 24)}天前`;
};

// ---------- Component ----------
const DevExecution = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mockData] = useState(() => buildMockConversations());
  const [conversations] = useState<Conversation[]>(mockData.conversations);
  const [deployedIds] = useState<Set<string>>(mockData.deployedIds);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => buildMockNotifications());
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;
  const totalTaskCount = conversations.reduce((sum, c) => sum + c.tasks.length + (c.devInProgress ? 1 : 0), 0);

  const [requirements, setRequirements] = useState<Requirement[]>(createInitialRequirements);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [allDone, setAllDone] = useState(false);
  const startTimeRef = useRef(Date.now());

  // UI state
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [rejectingReq, setRejectingReq] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const selectedReq = requirements.find(r => r.id === selectedReqId) || null;

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

  const filtered = useMemo(() => {
    let list = requirements;
    if (filter !== "all") list = list.filter(r => r.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r => r.title.toLowerCase().includes(q) || r.submitter.name.includes(q));
    }
    return list;
  }, [requirements, filter, search]);

  // ---- Simulation logic (kept from original) ----
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

  useEffect(() => {
    const testingReqs = requirements.filter(r => r.status === "testing" && r.testResult);
    if (testingReqs.length === 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const req of testingReqs) {
      const tr = req.testResult!;
      const pendingTests = tr.tests.filter(t => t.status === "pending");
      if (pendingTests.length === 0) continue;
      pendingTests.forEach((test, i) => {
        timers.push(setTimeout(() => {
          setRequirements(prev => prev.map(r => {
            if (r.id !== req.id || !r.testResult) return r;
            return { ...r, testResult: { ...r.testResult!, tests: r.testResult!.tests.map(t => t.id === test.id ? { ...t, status: "running" as TestItemStatus } : t) } };
          }));
        }, i * 500));
        timers.push(setTimeout(() => {
          setRequirements(prev => prev.map(r => {
            if (r.id !== req.id || !r.testResult) return r;
            const isRetry = r.testResult!.retryCount > 0;
            const shouldFail = !isRetry && Math.random() < 0.15;
            const newTests = r.testResult!.tests.map(t =>
              t.id === test.id ? { ...t, status: (shouldFail ? "failed" : "passed") as TestItemStatus, duration: Math.floor(Math.random() * 400 + 80) } : t
            );
            const allTestsDone = newTests.every(t => t.status === "passed" || t.status === "failed");
            const allPassed = newTests.every(t => t.status === "passed");
            const hasFailed = newTests.some(t => t.status === "failed");
            if (allTestsDone) {
              if (allPassed) {
                setLogs(l => [...l, { time: formatTime(), reqId: r.id, agentName: "AI 测试", message: `✅ 全部 ${newTests.length} 个测试通过，进入待验收` }]);
                return { ...r, status: "review" as RequirementStatus, testResult: { ...r.testResult!, tests: newTests } };
              } else if (hasFailed && r.testResult!.retryCount < 3) {
                setLogs(l => [...l, { time: formatTime(), reqId: r.id, agentName: "AI 测试", message: `❌ 测试失败，自动修复重试中...` }]);
                setTimeout(() => {
                  setRequirements(prev2 => prev2.map(r2 => {
                    if (r2.id !== req.id || !r2.testResult) return r2;
                    return { ...r2, testResult: { tests: r2.testResult!.tests.map(t => t.status === "failed" ? { ...t, status: "pending" as TestItemStatus, duration: undefined } : t), retryCount: r2.testResult!.retryCount + 1, isRetrying: true } };
                  }));
                }, 1500);
                return { ...r, testResult: { ...r.testResult!, tests: newTests, isRetrying: true } };
              } else {
                setLogs(l => [...l, { time: formatTime(), reqId: r.id, agentName: "AI 测试", message: `⚠️ 达最大重试次数，进入待验收` }]);
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

  useEffect(() => {
    if (requirements.length > 0 && requirements.every(r => r.status !== "running" && r.status !== "waiting" && r.status !== "done" && r.status !== "testing") && !allDone) {
      setAllDone(true);
    }
  }, [requirements, allDone]);

  useEffect(() => {
    if (allDone) return;
    const interval = setInterval(() => {
      setRequirements(prev => {
        const next = prev.map(req => ({ ...req, agents: req.agents.map(a => ({ ...a })) }));
        const newLogs: LogEntry[] = [];
        const runningReqs = next.filter(r => r.status === "running").length;
        const slotsAvailable = 8 - runningReqs;
        if (slotsAvailable > 0) {
          const waitingReqs = next.filter(r => r.status === "waiting");
          for (let i = 0; i < Math.min(slotsAvailable, waitingReqs.length); i++) {
            waitingReqs[i].status = "running";
            const firstAgent = waitingReqs[i].agents.find(a => !a.dependsOn);
            if (firstAgent) { firstAgent.status = "running"; newLogs.push({ time: formatTime(), reqId: waitingReqs[i].id, agentName: firstAgent.name, message: `开始处理 ${firstAgent.currentFile}` }); }
          }
        }
        for (const req of next) {
          if (req.status !== "running") continue;
          for (const agent of req.agents) {
            if (agent.dependsOn && agent.status === "waiting") {
              const dep = req.agents.find(a => a.id === agent.dependsOn);
              if (dep && dep.status === "done") { agent.status = "running"; newLogs.push({ time: formatTime(), reqId: req.id, agentName: agent.name, message: `开始处理 ${agent.currentFile}` }); }
            }
            if (agent.status === "running") {
              const increment = Math.floor(Math.random() * 12) + 3;
              agent.progress = Math.min(100, agent.progress + increment);
              if (agent.progress >= 100) { agent.status = "done"; agent.progress = 100; const tpl = logTemplates.done[Math.floor(Math.random() * logTemplates.done.length)]; newLogs.push({ time: formatTime(), reqId: req.id, agentName: agent.name, message: tpl.replace("{file}", agent.currentFile) }); }
              else if (Math.random() < 0.15) { const tpl = logTemplates.running[Math.floor(Math.random() * logTemplates.running.length)]; newLogs.push({ time: formatTime(), reqId: req.id, agentName: agent.name, message: tpl.replace("{file}", agent.currentFile) }); }
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

  // ---- Review actions ----
  const handleAccept = useCallback((reqId: string) => {
    setRequirements(prev => prev.map(r => r.id === reqId ? { ...r, status: "accepted" as RequirementStatus } : r));
    setLogs(l => [...l, { time: formatTime(), reqId, agentName: "验收", message: "✅ 需求已通过验收" }]);
  }, []);

  const handleReject = useCallback((reqId: string) => {
    if (!rejectReason.trim()) return;
    setRequirements(prev => prev.map(r => {
      if (r.id !== reqId) return r;
      const resetAgents = r.agents.map(a => ({ ...a, progress: 0, status: "waiting" as AgentStatus }));
      const first = resetAgents.find(a => !a.dependsOn);
      if (first) first.status = "running" as AgentStatus;
      return { ...r, status: "running" as RequirementStatus, rejectReason: rejectReason.trim(), agents: resetAgents };
    }));
    setRejectingReq(null);
    setRejectReason("");
    setAllDone(false);
  }, [rejectReason]);

  const handleAcceptAll = useCallback(() => {
    setRequirements(prev => prev.map(r => r.status === "review" ? { ...r, status: "accepted" as RequirementStatus } : r));
  }, []);

  const getReqProgress = (req: Requirement) => {
    if (req.agents.length === 0) return 0;
    return Math.round(req.agents.reduce((s, a) => s + a.progress, 0) / req.agents.length);
  };

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "全部", count: counts.total },
    { key: "running", label: "执行中", count: counts.running },
    { key: "testing", label: "测试中", count: counts.testing },
    { key: "review", label: "待验收", count: counts.review },
    { key: "accepted", label: "已通过", count: counts.accepted },
    { key: "rejected", label: "已打回", count: counts.rejected },
    { key: "waiting", label: "等待中", count: counts.waiting },
  ];

  // Kanban columns
  const kanbanColumns: { key: RequirementStatus; label: string; color: string }[] = [
    { key: "running", label: "执行中", color: "border-primary/30" },
    { key: "testing", label: "测试中", color: "border-violet-500/30" },
    { key: "review", label: "待验收", color: "border-orange-500/30" },
    { key: "accepted", label: "已通过", color: "border-green-500/30" },
  ];

  return (
    <ProjectSidebarLayout
      onDeepFlowClick={() => navigate(`/project/${id}`)}
      taskList={
        <SidebarConversationList
          conversations={conversations}
          deployedIds={deployedIds}
          activeConversationId={activeConversationId}
          onSelectConversation={(cid) => { setActiveConversationId(cid); navigate(`/project/${id}`); }}
          onNewConversation={() => navigate(`/project/${id}`)}
        />
      }
      taskCount={totalTaskCount}
      unreadNotificationCount={unreadNotificationCount}
      onNotificationCenterClick={() => setShowNotificationCenter(true)}
      notificationCenterActive={showNotificationCenter}
      headerRight={
        !showNotificationCenter ? (
          <div className="flex items-center gap-2">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap",
                  filter === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {tab.label} <span className="ml-0.5 opacity-70">{tab.count}</span>
              </button>
            ))}
            <div className="w-px h-4 bg-border mx-1" />
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="搜索..." value={search} onChange={e => setSearch(e.target.value)} className="h-6 pl-6 text-[11px] w-32" />
            </div>
            <button onClick={() => setViewMode("table")} className={cn("p-1 rounded-md transition-colors", viewMode === "table" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted")}>
              <Table2 size={13} />
            </button>
            <button onClick={() => setViewMode("kanban")} className={cn("p-1 rounded-md transition-colors", viewMode === "kanban" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted")}>
              <LayoutGrid size={13} />
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <p className="text-[11px] text-muted-foreground whitespace-nowrap">{counts.accepted}/{counts.total} 通过 · {counts.running} 进行中</p>
            <Progress value={overallProgress} className="h-1.5 w-16" />
            <span className="text-[11px] font-mono text-muted-foreground">{overallProgress}%</span>
          </div>
        ) : undefined
      }
    >
      {() => showNotificationCenter ? (
        <NotificationCenter
          notifications={notifications}
          onClickNotification={(notif) => {
            setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
          }}
          onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
          onClose={() => setShowNotificationCenter(false)}
        />
      ) : (
        <div className="flex h-full overflow-hidden">
          {/* Left: task list */}
          <div className={cn("flex flex-col h-full overflow-hidden min-w-0", selectedReq ? "flex-1" : "flex-1")}>
            

            {/* Content */}
            <ScrollArea className="flex-1 min-h-0">
              {viewMode === "table" ? (
                <TableView
                  items={filtered}
                  allItems={requirements}
                  selectedId={selectedReqId}
                  onSelect={setSelectedReqId}
                  getProgress={getReqProgress}
                />
              ) : (
                <KanbanView
                  items={requirements}
                  columns={kanbanColumns}
                  selectedId={selectedReqId}
                  onSelect={setSelectedReqId}
                  getProgress={getReqProgress}
                />
              )}
            </ScrollArea>

            {/* Bottom action bar */}
            {counts.review > 0 && (
              <div className="shrink-0 border-t border-border bg-muted/30 px-4 py-2 flex items-center gap-3">
                <span className="text-xs text-orange-600 font-medium">{counts.review} 个待验收</span>
                <div className="flex-1" />
                <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700 h-7 text-xs" onClick={handleAcceptAll}>
                  <CheckCheck size={12} /> 一键全部通过
                </Button>
              </div>
            )}
          </div>

          {/* Right: detail panel */}
          {selectedReq && (
            <div className="w-[420px] border-l border-border flex flex-col h-full bg-background shrink-0">
            <DetailPanel
                req={selectedReq}
                progress={getReqProgress(selectedReq)}
                logs={logs.filter(l => l.reqId === selectedReq.id)}
                onClose={() => setSelectedReqId(null)}
                onAccept={handleAccept}
                onReject={handleReject}
                rejectingReq={rejectingReq}
                setRejectingReq={setRejectingReq}
                rejectReason={rejectReason}
                setRejectReason={setRejectReason}
                projectId={id || ""}
              />
            </div>
          )}
        </div>
      )}
    </ProjectSidebarLayout>
  );
};

// ==================== TABLE VIEW ====================
const TableView = ({
  items, allItems, selectedId, onSelect, getProgress,
}: {
  items: Requirement[];
  allItems: Requirement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  getProgress: (r: Requirement) => number;
}) => {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <ListFilter size={16} className="mr-2" /> 无匹配需求
      </div>
    );
  }

  return (
    <div className="px-4 py-1">
      {/* Table header */}
      <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
        <span className="w-8 text-right">#</span>
        <span className="w-16">状态</span>
        <span className="flex-1">任务名称</span>
        <span className="w-20">提交人</span>
        <span className="w-20 text-right">提交时间</span>
        <span className="w-24">进度</span>
      </div>
      {items.map((req) => {
        const progress = getProgress(req);
        const globalIdx = allItems.indexOf(req);
        return (
          <button
            key={req.id}
            onClick={() => onSelect(req.id)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-2 text-left transition-colors rounded-md",
              selectedId === req.id ? "bg-secondary" : "hover:bg-muted/50",
              req.status === "accepted" && selectedId !== req.id && "opacity-60"
            )}
          >
            <span className="text-[10px] font-mono text-muted-foreground w-8 text-right shrink-0">#{globalIdx + 1}</span>
            <span className="w-16 shrink-0">{reqStatusLabel(req.status)}</span>
            <span className="text-xs font-medium truncate flex-1 min-w-0">{req.title}</span>
            <div className="w-20 shrink-0 flex items-center gap-1.5">
              <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0", req.submitter.color)}>
                {req.submitter.avatar}
              </div>
              <span className="text-[11px] text-muted-foreground truncate">{req.submitter.name}</span>
            </div>
            <span className="text-[10px] text-muted-foreground w-20 text-right shrink-0">{formatRelativeTime(req.submittedAt)}</span>
            <div className="flex items-center gap-1 w-24 shrink-0">
              <Progress value={progress} className="h-1 flex-1" />
              <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">{progress}%</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ==================== KANBAN VIEW ====================
const KanbanView = ({
  items, columns, selectedId, onSelect, getProgress,
}: {
  items: Requirement[];
  columns: { key: RequirementStatus; label: string; color: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  getProgress: (r: Requirement) => number;
}) => (
  <div className="flex gap-3 px-4 py-3 h-full min-w-0 overflow-x-auto">
    {columns.map(col => {
      const colItems = items.filter(r => r.status === col.key);
      return (
        <div key={col.key} className={cn("flex flex-col w-64 shrink-0 rounded-lg border bg-muted/20", col.color)}>
          <div className="px-3 py-2 border-b border-border flex items-center gap-2">
            <span className="text-xs font-semibold">{col.label}</span>
            <Badge variant="secondary" className="text-[10px] h-4 min-w-4 px-1">{colItems.length}</Badge>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-2 space-y-2">
              {colItems.map(req => (
                <button
                  key={req.id}
                  onClick={() => onSelect(req.id)}
                  className={cn(
                    "w-full rounded-md border bg-card p-3 text-left transition-all hover:shadow-sm",
                    selectedId === req.id ? "border-primary ring-1 ring-primary/20" : "border-border"
                  )}
                >
                  <p className="text-xs font-medium truncate mb-2">{req.title}</p>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0", req.submitter.color)}>
                      {req.submitter.avatar}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{req.submitter.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{formatRelativeTime(req.submittedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Progress value={getProgress(req)} className="h-1 flex-1" />
                    <span className="text-[10px] font-mono text-muted-foreground">{getProgress(req)}%</span>
                  </div>
                </button>
              ))}
              {colItems.length === 0 && (
                <p className="text-[11px] text-muted-foreground text-center py-4">暂无任务</p>
              )}
            </div>
          </ScrollArea>
        </div>
      );
    })}
  </div>
);

// ==================== DETAIL PANEL ====================
const DetailPanel = ({
  req, progress, logs, onClose, onAccept, onReject,
  rejectingReq, setRejectingReq, rejectReason, setRejectReason, projectId,
}: {
  req: Requirement;
  progress: number;
  logs: LogEntry[];
  onClose: () => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  rejectingReq: string | null;
  setRejectingReq: (id: string | null) => void;
  rejectReason: string;
  setRejectReason: (v: string) => void;
  projectId: string;
}) => {
  const isRejecting = rejectingReq === req.id;
  const logsEndRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0", req.submitter.color)}>
          {req.submitter.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{req.title}</p>
          <p className="text-[11px] text-muted-foreground">{req.submitter.name} · {formatRelativeTime(req.submittedAt)}</p>
        </div>
        {reqStatusLabel(req.status)}
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
          <X size={14} />
        </button>
      </div>

      {/* Tabs: Timeline + Acceptance */}
      <Tabs defaultValue="timeline" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-2 mb-0">
          <TabsTrigger value="timeline" className="text-xs gap-1.5">
            <Clock size={12} /> 开发过程
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-xs gap-1.5">
            <Eye size={12} /> 产品预览
          </TabsTrigger>
          <TabsTrigger value="tests" className="text-xs gap-1.5">
            <TestTube2 size={12} /> 测试报告
          </TabsTrigger>
        </TabsList>

        {/* Timeline */}
        <TabsContent value="timeline" className="flex-1 min-h-0 m-0 overflow-y-auto">
          <div className="p-4 space-y-3">
            {/* Overall progress */}
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="text-xs font-mono font-bold">{progress}%</span>
            </div>

            {/* Agent timeline */}
            <div className="space-y-1">
              {req.agents.map((agent, i) => (
                <div key={agent.id} className="flex items-center gap-2 py-1.5 pl-2 border-l-2 border-primary/20 ml-2">
                  <StatusIcon status={agent.status} />
                  <span className="text-muted-foreground">{agentIcons[agent.icon]}</span>
                  <span className="text-[11px] font-medium w-20 shrink-0">{agent.name}</span>
                  <Progress value={agent.progress} className={cn("h-1 flex-1", agent.status === "waiting" && "opacity-30")} />
                  <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
                    {agent.status === "waiting" ? "—" : `${agent.progress}%`}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{agent.currentFile}</span>
                </div>
              ))}
            </div>

            {/* Development logs */}
            {logs.length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="text-[11px] font-semibold text-muted-foreground mb-2">开发日志</p>
                <div className="space-y-0.5 max-h-[300px] overflow-y-auto rounded-md bg-muted/30 p-2">
                  {logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] py-0.5">
                      <span className="text-muted-foreground font-mono shrink-0 w-14">{log.time}</span>
                      <span className="text-primary/80 font-medium shrink-0 w-16 truncate">{log.agentName}</span>
                      <span className="text-foreground/80 break-all">{log.message}</span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            )}

            {/* Test result summary in timeline */}
            {req.testResult && (
              <div className="pt-3 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <TestTube2 size={14} className="text-violet-500" />
                  <span className="text-xs font-semibold">AI 测试</span>
                  {req.status === "testing" && <Loader2 size={12} className="animate-spin text-violet-500" />}
                  {req.testResult.tests.every(t => t.status === "passed") && req.status !== "testing" && (
                    <Badge variant="outline" className="text-[10px] px-1.5 border-green-500/40 text-green-600 bg-green-500/10">全部通过</Badge>
                  )}
                </div>
                <div className="space-y-0.5">
                  {req.testResult.tests.map(t => (
                    <div key={t.id} className="flex items-center gap-2 py-1 px-1.5 rounded text-[11px]">
                      {t.status === "passed" && <CheckCircle2 size={12} className="text-green-500 shrink-0" />}
                      {t.status === "failed" && <XCircle size={12} className="text-destructive shrink-0" />}
                      {t.status === "running" && <Loader2 size={12} className="animate-spin text-violet-500 shrink-0" />}
                      {t.status === "pending" && <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                      <span className="flex-1 truncate">{t.name}</span>
                      {t.duration && <span className="text-[10px] text-muted-foreground">{t.duration}ms</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reject reason */}
            {req.rejectReason && (
              <div className="p-2 rounded-md bg-destructive/5 border border-destructive/20 text-xs text-destructive">
                <span className="font-medium">打回原因：</span>{req.rejectReason}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview" className="flex-1 min-h-0 m-0">
          {req.previewPath ? (
            <RequirementPreview
              previewPath={req.previewPath}
              requirementTitle={req.title}
              projectId={projectId}
              fullscreen
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">暂无预览</div>
          )}
        </TabsContent>

        {/* Tests */}
        <TabsContent value="tests" className="flex-1 min-h-0 m-0 overflow-y-auto">
          <div className="p-4">
            {req.testResult ? (
              <div className="space-y-2">
                {(() => {
                  const passed = req.testResult!.tests.filter(t => t.status === "passed").length;
                  const total = req.testResult!.tests.length;
                  return (
                    <div className="flex items-center gap-2">
                      <Badge variant={passed === total ? "default" : "destructive"} className="text-[10px]">{passed}/{total} 通过</Badge>
                      <span className="text-[10px] text-muted-foreground">总耗时 {req.testResult!.tests.reduce((s, t) => s + (t.duration || 0), 0)}ms</span>
                    </div>
                  );
                })()}
                <div className="rounded-md border border-border bg-card overflow-hidden">
                  {req.testResult!.tests.map(t => (
                    <div key={t.id} className="flex items-center gap-2 px-3 py-2 text-xs border-b border-border last:border-0">
                      {t.status === "passed" ? <CheckCircle2 size={14} className="text-green-500 shrink-0" /> : t.status === "failed" ? <XCircle size={14} className="text-destructive shrink-0" /> : t.status === "running" ? <Loader2 size={14} className="animate-spin text-violet-500 shrink-0" /> : <Clock size={14} className="text-muted-foreground shrink-0" />}
                      <span className="flex-1 text-foreground">{t.name}</span>
                      {t.duration && <span className="text-[10px] text-muted-foreground">{t.duration}ms</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">测试尚未开始</div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Action bar */}
      {req.status === "review" && (
        <div className="shrink-0 border-t border-border px-4 py-3">
          {!isRejecting ? (
            <div className="flex items-center gap-2">
              <Button size="sm" className="flex-1 gap-1.5 h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => onAccept(req.id)}>
                <CheckCircle2 size={12} /> 通过验收
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => { setRejectingReq(req.id); setRejectReason(""); }}>
                <RotateCcw size={12} /> 打回
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea placeholder="请填写打回原因..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="min-h-[60px] text-xs" autoFocus />
              <div className="flex items-center gap-2">
                <Button size="sm" variant="destructive" className="gap-1.5 h-7 text-xs" disabled={!rejectReason.trim()} onClick={() => onReject(req.id)}>
                  <RotateCcw size={12} /> 确认打回
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setRejectingReq(null); setRejectReason(""); }}>取消</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default DevExecution;
