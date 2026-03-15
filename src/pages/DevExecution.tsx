import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useParams, useNavigate } from "react-router-dom";
import {
  Code2, TestTube2, Eye, Plug, Database, Palette, AlertCircle, CheckCircle2,
  Loader2, Clock, Search, ListFilter, ShieldCheck, RotateCcw,
  CheckCheck, XCircle, Table2, LayoutGrid, X, AlertTriangle,
  ChevronDown, ChevronRight, FileCode, MessageSquare, Zap, Shield,
  ExternalLink, GitBranch, Layers, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import ProjectSidebarLayout from "@/components/ProjectSidebarLayout";
import RequirementPreview from "@/components/RequirementPreview";
import SidebarConversationList from "@/components/SidebarConversationList";
import { buildMockConversations, type Conversation } from "@/data/conversations";
import { buildMockNotifications } from "@/data/notifications";
import NotificationCenter from "@/components/NotificationCenter";
import type { AppNotification } from "@/data/notifications";
import {
  createInitialRequirements, formatTime, logTemplates, generateTestsForRequirement, deriveSubStatus,
  type Requirement, type RequirementGroup, type Agent, type AgentStatus, type RequirementStatus,
  type LogEntry, type TestItemStatus, type SubStatus, type RiskLevel, type TaskType, type BlockType,
} from "@/data/devExecutionMock";
import { generateDiffForRequirement, type DiffFile } from "@/data/diffMock";
import GitDiffViewer from "@/components/GitDiffViewer";
import BlockResolver, { blockTypeMeta } from "@/components/BlockResolver";

// ---------- Icon map ----------
const agentIcons: Record<string, React.ReactNode> = {
  code: <Code2 size={14} />, test: <TestTube2 size={14} />, review: <Eye size={14} />,
  api: <Plug size={14} />, db: <Database size={14} />, ui: <Palette size={14} />,
};

const taskTypeIcons: Record<TaskType, React.ReactNode> = {
  frontend: <Palette size={12} />, backend: <Code2 size={12} />,
  database: <Database size={12} />, api: <Plug size={12} />,
  deploy: <GitBranch size={12} />, docs: <FileCode size={12} />,
};

const taskTypeLabels: Record<TaskType, string> = {
  frontend: "前端", backend: "后端", database: "数据库", api: "API", deploy: "部署", docs: "文档",
};

const riskColors: Record<RiskLevel, string> = {
  low: "text-green-600 bg-green-500/10 border-green-500/20",
  medium: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20",
  high: "text-red-600 bg-red-500/10 border-red-500/20",
};

const riskLabels: Record<RiskLevel, string> = { low: "低", medium: "中", high: "高" };

const StatusIcon = ({ status }: { status: AgentStatus }) => {
  switch (status) {
    case "done": return <CheckCircle2 size={14} className="text-green-500" />;
    case "running": return <Loader2 size={14} className="text-primary animate-spin" />;
    case "error": return <AlertCircle size={14} className="text-destructive" />;
    default: return <Clock size={14} className="text-muted-foreground" />;
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
    blocked: { label: "阻塞中", cls: "text-red-600 bg-red-500/10" },
  };
  const cfg = map[status] || map.waiting;
  return <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", cfg.cls)}>{cfg.label}</span>;
};

type FilterTab = "all" | "action" | "running" | "testing" | "review" | "accepted" | "blocked";
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

  const [{ requirements, groups }, setData] = useState(() => createInitialRequirements());
  const setRequirements = useCallback((fn: (prev: Requirement[]) => Requirement[]) => {
    setData(prev => ({ ...prev, requirements: fn(prev.requirements) }));
  }, []);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [allDone, setAllDone] = useState(false);

  // UI state
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [rejectingReq, setRejectingReq] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(groups.map(g => g.id)));

  const selectedReq = requirements.find(r => r.id === selectedReqId) || null;

  const totalAgents = requirements.reduce((s, r) => s + r.agents.length, 0);
  const doneAgents = requirements.reduce((s, r) => s + r.agents.filter(a => a.status === "done").length, 0);
  const overallProgress = totalAgents ? Math.round((doneAgents / totalAgents) * 100) : 0;

  const counts = useMemo(() => ({
    total: requirements.length,
    running: requirements.filter(r => r.status === "running").length,
    testing: requirements.filter(r => r.status === "testing").length,
    review: requirements.filter(r => r.status === "review").length,
    accepted: requirements.filter(r => r.status === "accepted").length,
    blocked: requirements.filter(r => r.status === "blocked").length,
    action: requirements.filter(r => r.status === "review" || r.status === "blocked").length,
  }), [requirements]);

  // Action required items
  const actionItems = useMemo(() =>
    requirements.filter(r => r.status === "review" || r.status === "blocked")
      .sort((a, b) => {
        if (a.status === "blocked" && b.status !== "blocked") return -1;
        if (b.status === "blocked" && a.status !== "blocked") return 1;
        return 0;
      }),
    [requirements]
  );

  const filtered = useMemo(() => {
    let list = requirements;
    if (filter === "action") list = actionItems;
    else if (filter !== "all") list = list.filter(r => r.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r => r.title.toLowerCase().includes(q) || r.submitter.name.includes(q));
    }
    return list;
  }, [requirements, filter, search, actionItems]);

  // ---- Simulation logic ----
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

  // ---- Actions ----
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

  const handleUnblock = useCallback((reqId: string, resolution?: string) => {
    setRequirements(prev => prev.map(r => {
      if (r.id !== reqId) return r;
      const resetAgents = r.agents.map(a => ({ ...a, progress: 0, status: "waiting" as AgentStatus }));
      const first = resetAgents.find(a => !a.dependsOn);
      if (first) first.status = "running" as AgentStatus;
      return { ...r, status: "running" as RequirementStatus, blockReason: undefined, blockInfo: undefined, subStatus: undefined };
    }));
    if (resolution) {
      setLogs(l => [...l, { time: formatTime(), reqId, agentName: "用户", message: `解除阻塞：${resolution}` }]);
    }
    setAllDone(false);
  }, []);

  const getReqProgress = (req: Requirement) => {
    if (req.agents.length === 0) return 0;
    return Math.round(req.agents.reduce((s, a) => s + a.progress, 0) / req.agents.length);
  };

  const toggleGroup = (gid: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid); else next.add(gid);
      return next;
    });
  };

  const filterTabs: { key: FilterTab; label: string; count: number; urgent?: boolean }[] = [
    { key: "all", label: "全部", count: counts.total },
    { key: "action", label: "需你处理", count: counts.action, urgent: counts.action > 0 },
    { key: "running", label: "执行中", count: counts.running },
    { key: "testing", label: "测试中", count: counts.testing },
    { key: "review", label: "待验收", count: counts.review },
    { key: "blocked", label: "阻塞中", count: counts.blocked },
    { key: "accepted", label: "已通过", count: counts.accepted },
  ];

  const kanbanColumns: { key: RequirementStatus; label: string; color: string }[] = [
    { key: "blocked", label: "阻塞中", color: "border-red-500/30" },
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
        showNotificationCenter ? (
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-foreground" />
            <span className="text-sm font-semibold text-foreground">消息中心</span>
            {unreadNotificationCount > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold">
                {unreadNotificationCount}
              </span>
            )}
            <div className="flex-1" />
            {unreadNotificationCount > 0 && (
              <button
                onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <CheckCheck size={12} />
                全部已读
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap relative",
                  filter === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                  tab.urgent && filter !== tab.key && "text-red-600"
                )}
              >
                {tab.label} <span className="ml-0.5 opacity-70">{tab.count}</span>
                {tab.urgent && filter !== tab.key && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
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
        )
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
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={selectedReq ? 60 : 100} minSize={35}>
            <div className="flex flex-col h-full overflow-hidden min-w-0">
              {/* Action Required Bar */}
              {actionItems.length > 0 && filter !== "action" && (
                <ActionRequiredBar
                  items={actionItems}
                  onSelect={setSelectedReqId}
                  onAccept={handleAccept}
                  onUnblock={handleUnblock}
                  onViewAll={() => setFilter("action")}
                />
              )}

              {/* Content */}
              <ScrollArea className="flex-1 min-h-0">
                {viewMode === "table" ? (
                  <TableView
                    items={filtered}
                    allItems={requirements}
                    groups={groups}
                    selectedId={selectedReqId}
                    onSelect={setSelectedReqId}
                    getProgress={getReqProgress}
                    expandedGroups={expandedGroups}
                    toggleGroup={toggleGroup}
                  />
                ) : (
                  <KanbanView
                    items={requirements}
                    groups={groups}
                    columns={kanbanColumns}
                    selectedId={selectedReqId}
                    onSelect={setSelectedReqId}
                    getProgress={getReqProgress}
                    onAccept={handleAccept}
                    onUnblock={handleUnblock}
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
          </ResizablePanel>

          {/* Right: detail panel */}
          {selectedReq && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={40} minSize={25} maxSize={65}>
                <div className="flex flex-col h-full bg-background">
                  <DetailPanel
                    req={selectedReq}
                    group={groups.find(g => g.id === selectedReq.groupId)}
                    progress={getReqProgress(selectedReq)}
                    logs={logs.filter(l => l.reqId === selectedReq.id)}
                    onClose={() => setSelectedReqId(null)}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onUnblock={handleUnblock}
                    rejectingReq={rejectingReq}
                    setRejectingReq={setRejectingReq}
                    rejectReason={rejectReason}
                    setRejectReason={setRejectReason}
                    projectId={id || ""}
                  />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      )}
    </ProjectSidebarLayout>
  );
};

// ==================== ACTION REQUIRED BAR ====================
const ActionRequiredBar = ({
  items, onSelect, onAccept, onUnblock, onViewAll,
}: {
  items: Requirement[];
  onSelect: (id: string) => void;
  onAccept: (id: string) => void;
  onUnblock: (id: string, resolution?: string) => void;
  onViewAll: () => void;
}) => {
  const blockedCount = items.filter(r => r.status === "blocked").length;
  const reviewCount = items.filter(r => r.status === "review").length;

  return (
    <div className="shrink-0 border-b border-red-500/20 bg-red-500/5 px-4 py-1.5">
      <div className="flex items-center gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <AlertTriangle size={13} className="text-red-500" />
          <span className="text-[11px] font-semibold text-red-600">需你处理</span>
          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">{items.length}</Badge>
        </div>
        <div className="w-px h-4 bg-red-500/20 shrink-0" />
        {items.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border/60 bg-card text-left shrink-0 hover:shadow-sm transition-all text-[11px] min-w-0"
          >
            {item.status === "blocked" ? (
              <>
                <AlertTriangle size={11} className="text-red-500 shrink-0" />
                {item.blockInfo && (
                  <span className={cn("text-[9px] px-1 py-0.5 rounded shrink-0", blockTypeMeta[item.blockInfo.type].color)}>
                    {blockTypeMeta[item.blockInfo.type].label}
                  </span>
                )}
              </>
            ) : (
              <ShieldCheck size={11} className="text-orange-500 shrink-0" />
            )}
            <span className="truncate max-w-[100px] font-medium">{item.title}</span>
            {item.status === "blocked" ? (
              <span onClick={e => { e.stopPropagation(); onUnblock(item.id); }}
                className="text-[10px] text-green-600 hover:underline shrink-0 cursor-pointer">解除</span>
            ) : (
              <span onClick={e => { e.stopPropagation(); onAccept(item.id); }}
                className="text-[10px] text-green-600 hover:underline shrink-0 cursor-pointer">通过</span>
            )}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={onViewAll} className="text-[10px] text-primary hover:underline shrink-0">查看全部 →</button>
      </div>
    </div>
  );
};

// ==================== TABLE VIEW ====================
const TableView = ({
  items, allItems, groups, selectedId, onSelect, getProgress, expandedGroups, toggleGroup,
}: {
  items: Requirement[];
  allItems: Requirement[];
  groups: RequirementGroup[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  getProgress: (r: Requirement) => number;
  expandedGroups: Set<string>;
  toggleGroup: (gid: string) => void;
}) => {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <ListFilter size={16} className="mr-2" /> 无匹配需求
      </div>
    );
  }

  // Group items
  const groupedItems = groups.map(g => ({
    group: g,
    reqs: items.filter(r => r.groupId === g.id),
  })).filter(g => g.reqs.length > 0);

  return (
    <div className="px-4 py-1">
      {/* Table header */}
      <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
        <span className="w-6"></span>
        <span className="w-16">状态</span>
        <span className="flex-1">任务名称</span>
        <span className="w-14">类型</span>
        <span className="w-10">风险</span>
        <span className="w-20">提交人</span>
        <span className="w-24">进度</span>
      </div>
      {groupedItems.map(({ group, reqs }) => {
        const isExpanded = expandedGroups.has(group.id);
        const groupProgress = Math.round(reqs.reduce((s, r) => s + getProgress(r), 0) / reqs.length);
        const doneCount = reqs.filter(r => r.status === "accepted").length;

        return (
          <div key={group.id}>
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center gap-2 px-2 py-2 text-left hover:bg-muted/50 rounded-md transition-colors"
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <Layers size={12} className="text-primary" />
              <span className="text-xs font-semibold">{group.name}</span>
              <span className="text-[10px] text-muted-foreground">{doneCount}/{reqs.length} 完成</span>
              <div className="flex-1" />
              <Progress value={groupProgress} className="h-1 w-20" />
              <span className="text-[10px] font-mono text-muted-foreground">{groupProgress}%</span>
            </button>

            {/* Group items */}
            {isExpanded && reqs.map((req) => {
              const progress = getProgress(req);
              const sub = deriveSubStatus(req);
              return (
                <button
                  key={req.id}
                  onClick={() => onSelect(req.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-2 pl-8 text-left transition-colors rounded-md",
                    selectedId === req.id ? "bg-secondary" : "hover:bg-muted/50",
                    req.status === "accepted" && selectedId !== req.id && "opacity-60"
                  )}
                >
                  <span className="w-16 shrink-0 flex items-center gap-1">
                    {reqStatusLabel(req.status)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium truncate block">{req.title}</span>
                    {sub && <span className="text-[10px] text-muted-foreground">{sub}{req.agents.find(a => a.status === "running") ? ` · ${req.agents.find(a => a.status === "running")!.currentFile}` : ""}</span>}
                  </div>
                  <span className="w-14 shrink-0 flex items-center gap-1 text-[10px] text-muted-foreground">
                    {taskTypeIcons[req.taskType]}
                    {taskTypeLabels[req.taskType]}
                  </span>
                  <span className={cn("w-10 shrink-0 text-[10px] px-1 py-0.5 rounded border text-center", riskColors[req.riskLevel])}>
                    {riskLabels[req.riskLevel]}
                  </span>
                  <div className="w-20 shrink-0 flex items-center gap-1.5">
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0", req.submitter.color)}>
                      {req.submitter.avatar}
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate">{req.submitter.name}</span>
                  </div>
                  <div className="flex items-center gap-1 w-24 shrink-0">
                    <Progress value={progress} className="h-1 flex-1" />
                    <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">{progress}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// ==================== KANBAN VIEW ====================
const KanbanView = ({
  items, groups, columns, selectedId, onSelect, getProgress, onAccept, onUnblock,
}: {
  items: Requirement[];
  groups: RequirementGroup[];
  columns: { key: RequirementStatus; label: string; color: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  getProgress: (r: Requirement) => number;
  onAccept: (id: string) => void;
  onUnblock: (id: string, resolution?: string) => void;
}) => (
  <div className="flex gap-3 px-4 py-3 h-full min-w-0 overflow-x-auto">
    {columns.map(col => {
      const colItems = items.filter(r => r.status === col.key);
      return (
        <div key={col.key} className={cn("flex flex-col w-72 shrink-0 rounded-lg border bg-muted/20", col.color)}>
          <div className="px-3 py-2 border-b border-border flex items-center gap-2">
            {col.key === "blocked" && <AlertTriangle size={12} className="text-red-500" />}
            <span className="text-xs font-semibold">{col.label}</span>
            <Badge variant="secondary" className="text-[10px] h-4 min-w-4 px-1">{colItems.length}</Badge>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-2 space-y-2">
              {colItems.map(req => {
                const progress = getProgress(req);
                const sub = deriveSubStatus(req);
                const testPassed = req.testResult?.tests.filter(t => t.status === "passed").length;
                const testTotal = req.testResult?.tests.length;
                const group = groups.find(g => g.id === req.groupId);

                return (
                  <button
                    key={req.id}
                    onClick={() => onSelect(req.id)}
                    className={cn(
                      "w-full rounded-md border bg-card p-3 text-left transition-all hover:shadow-sm",
                      selectedId === req.id ? "border-primary ring-1 ring-primary/20" : "border-border",
                      req.status === "blocked" && "border-red-500/30"
                    )}
                  >
                    {/* Title + Type */}
                    <div className="flex items-start gap-1.5 mb-1.5">
                      <p className="text-xs font-medium flex-1 min-w-0 leading-snug">{req.title}</p>
                      <span className={cn("text-[9px] px-1 py-0.5 rounded border shrink-0", riskColors[req.riskLevel])}>
                        {riskLabels[req.riskLevel]}风险
                      </span>
                    </div>

                    {/* Sub-status / AI transparency */}
                    {sub && (
                      <div className="flex items-center gap-1 mb-1.5">
                        {req.status === "running" && <Loader2 size={10} className="animate-spin text-primary" />}
                        {req.status === "blocked" && <AlertTriangle size={10} className="text-red-500" />}
                        <span className="text-[10px] text-muted-foreground truncate">
                          {sub}
                          {req.agents.find(a => a.status === "running") ? ` · ${req.agents.find(a => a.status === "running")!.currentFile}` : ""}
                        </span>
                      </div>
                    )}

                    {/* Block reason with type badge */}
                    {req.blockInfo ? (
                      <div className="text-[10px] text-red-500 bg-red-500/5 rounded px-1.5 py-1 mb-1.5">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className={cn("text-[9px] px-1 py-0.5 rounded", blockTypeMeta[req.blockInfo.type].color)}>
                            {blockTypeMeta[req.blockInfo.type].label}
                          </span>
                        </div>
                        <span className="truncate block">⚠ {req.blockInfo.reason}</span>
                      </div>
                    ) : req.blockReason && (
                      <div className="text-[10px] text-red-500 bg-red-500/5 rounded px-1.5 py-1 mb-1.5 truncate">
                        ⚠ {req.blockReason}
                      </div>
                    )}

                    {/* Group tag */}
                    {group && (
                      <div className="flex items-center gap-1 mb-1.5">
                        <Layers size={9} className="text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground">{group.name}</span>
                      </div>
                    )}

                    {/* Type + test summary */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        {taskTypeIcons[req.taskType]}
                        {taskTypeLabels[req.taskType]}
                      </span>
                      {testTotal && testTotal > 0 && (
                        <span className={cn("text-[10px] font-mono", testPassed === testTotal ? "text-green-600" : "text-orange-500")}>
                          {testPassed}/{testTotal} 通过
                        </span>
                      )}
                      {req.changedFiles && req.status === "review" && (
                        <span className="text-[10px] text-muted-foreground">
                          {req.changedFiles} 文件 +{req.linesAdded}/-{req.linesRemoved}
                        </span>
                      )}
                    </div>

                    {/* Submitter + progress */}
                    <div className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0", req.submitter.color)}>
                        {req.submitter.avatar}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{req.submitter.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{formatRelativeTime(req.submittedAt)}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Progress value={progress} className="h-1 flex-1" />
                      <span className="text-[10px] font-mono text-muted-foreground">{progress}%</span>
                    </div>

                    {/* Quick actions for review/blocked cards */}
                    {(req.status === "review" || req.status === "blocked") && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
                        {req.previewPath && req.status === "review" && (
                          <Button size="sm" variant="outline" className="h-5 text-[10px] px-1.5 gap-1 flex-1"
                            onClick={e => { e.stopPropagation(); onSelect(req.id); }}>
                            <Eye size={10} /> 预览
                          </Button>
                        )}
                        {req.status === "review" && (
                          <Button size="sm" className="h-5 text-[10px] px-1.5 gap-1 flex-1 bg-green-600 hover:bg-green-700"
                            onClick={e => { e.stopPropagation(); onAccept(req.id); }}>
                            <CheckCircle2 size={10} /> 通过
                          </Button>
                        )}
                        {req.status === "blocked" && (
                          <Button size="sm" className="h-5 text-[10px] px-2 gap-1 flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={e => { e.stopPropagation(); onUnblock(req.id); }}>
                            <Zap size={10} /> 解除阻塞
                          </Button>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
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
  req, group, progress, logs, onClose, onAccept, onReject, onUnblock,
  rejectingReq, setRejectingReq, rejectReason, setRejectReason, projectId,
}: {
  req: Requirement;
  group?: RequirementGroup;
  progress: number;
  logs: LogEntry[];
  onClose: () => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onUnblock: (id: string) => void;
  rejectingReq: string | null;
  setRejectingReq: (id: string | null) => void;
  rejectReason: string;
  setRejectReason: (v: string) => void;
  projectId: string;
}) => {
  const isRejecting = rejectingReq === req.id;
  const logsEndRef = useRef<HTMLDivElement>(null);
  const sub = deriveSubStatus(req);

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0", req.submitter.color)}>
          {req.submitter.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{req.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-muted-foreground">{req.submitter.name} · {formatRelativeTime(req.submittedAt)}</span>
            <span className={cn("text-[9px] px-1 py-0.5 rounded border", riskColors[req.riskLevel])}>{riskLabels[req.riskLevel]}风险</span>
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">{taskTypeIcons[req.taskType]}{taskTypeLabels[req.taskType]}</span>
          </div>
        </div>
        {reqStatusLabel(req.status)}
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
          <X size={14} />
        </button>
      </div>

      {/* Sub-status banner */}
      {sub && (
        <div className={cn(
          "px-4 py-1.5 text-[11px] flex items-center gap-2 border-b",
          req.status === "blocked" ? "bg-red-500/5 border-red-500/20 text-red-600" : "bg-primary/5 border-primary/20 text-primary"
        )}>
          {req.status === "running" && <Loader2 size={10} className="animate-spin" />}
          {req.status === "blocked" && <AlertTriangle size={10} />}
          当前阶段：{sub}
          {req.agents.find(a => a.status === "running") && (
            <span className="text-muted-foreground">· {req.agents.find(a => a.status === "running")!.currentFile}</span>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-2 mb-0">
          <TabsTrigger value="timeline" className="text-xs gap-1.5">
            <Clock size={12} /> 开发过程
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-xs gap-1.5">
            <Eye size={12} /> 产品预览
          </TabsTrigger>
          {["review", "accepted", "done", "testing"].includes(req.status) && (
            <TabsTrigger value="diff" className="text-xs gap-1.5">
              <GitBranch size={12} /> 代码变更
            </TabsTrigger>
          )}
          <TabsTrigger value="tests" className="text-xs gap-1.5">
            <TestTube2 size={12} /> 测试报告
          </TabsTrigger>
          <TabsTrigger value="context" className="text-xs gap-1.5">
            <MessageSquare size={12} /> 需求上下文
          </TabsTrigger>
        </TabsList>

        {/* Timeline */}
        <TabsContent value="timeline" className="flex-1 min-h-0 m-0 overflow-y-auto">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="text-xs font-mono font-bold">{progress}%</span>
            </div>

            <div className="space-y-1">
              {req.agents.map((agent) => (
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

        {/* Code Diff */}
        {["review", "accepted", "done", "testing"].includes(req.status) && (
          <TabsContent value="diff" className="flex-1 min-h-0 m-0">
            <GitDiffViewer files={generateDiffForRequirement(req)} />
          </TabsContent>
        )}
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

        {/* 改版五：需求上下文 Tab */}
        <TabsContent value="context" className="flex-1 min-h-0 m-0 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Source group */}
            {group && (
              <div className="rounded-md border border-border bg-muted/20 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Layers size={14} className="text-primary" />
                  <span className="text-xs font-semibold">所属需求包</span>
                </div>
                <p className="text-sm font-medium">{group.name}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{group.requirements.length} 个子任务</p>
              </div>
            )}

            {/* User prompt */}
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={14} className="text-blue-500" />
                <span className="text-xs font-semibold">用户原始需求</span>
              </div>
              <div className="bg-muted/40 rounded-md p-2.5 text-xs text-foreground leading-relaxed">
                "{req.sourceContext.userPrompt}"
              </div>
            </div>

            {/* AI understanding */}
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-yellow-500" />
                <span className="text-xs font-semibold">AI 理解摘要</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{req.sourceContext.aiSummary}</p>
            </div>

            {/* AI reasoning */}
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-violet-500" />
                <span className="text-xs font-semibold">AI 拆解依据</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{req.sourceContext.aiReasoning}</p>
            </div>

            {/* Change summary */}
            {req.changedFiles && (
              <div className="rounded-md border border-border p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileCode size={14} className="text-emerald-500" />
                  <span className="text-xs font-semibold">变更摘要</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{req.changedFiles} 个文件</span>
                  <span className="text-green-600">+{req.linesAdded}</span>
                  <span className="text-red-500">-{req.linesRemoved}</span>
                </div>
              </div>
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

      {/* Blocked action bar */}
      {req.status === "blocked" && (
        <div className="shrink-0 border-t border-red-500/20 px-4 py-3 bg-red-500/5">
          <div className="text-[11px] text-red-500 mb-2">⚠ 阻塞原因：{req.blockReason}</div>
          <Button size="sm" className="w-full gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => onUnblock(req.id)}>
            <Zap size={12} /> 确认解除阻塞，继续执行
          </Button>
        </div>
      )}
    </>
  );
};

export default DevExecution;
