import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { PanelRightOpen, PanelRightClose, ListTodo, Loader2, Circle, Check, Shield, Bell, CheckCheck, X } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import PlanFlow from "@/components/PlanFlow";
import PromptBar from "@/components/PromptBar";
import DeepFlowPanel from "@/components/DeepFlowPanel";
import ProjectSidebarLayout from "@/components/ProjectSidebarLayout";
import RequirementDocEditor from "@/components/RequirementDocEditor";
import DevCompleteCard, { DevInProgressCard, buildMockDevResult, type DevCompleteResult } from "@/components/DevCompleteCard";
import DevCompleteDetailPanel, { AcceptanceQA, buildAcceptanceIssues } from "@/components/DevCompleteDetailPanel";
import SidebarConversationList from "@/components/SidebarConversationList";
import { requestNotificationPermission, notifyDevComplete } from "@/components/DevNotification";
import NotificationCenter from "@/components/NotificationCenter";
import { type AppNotification, buildMockNotifications } from "@/data/notifications";
import PreviewPanel from "@/components/PreviewPanel";
import DevProcessDetailPanel, { ProcessReviewQA, extractActionableIssues, type IssueDecision } from "@/components/DevProcessDetailPanel";
import { buildMockAIReview as buildProcessReview } from "@/data/reviewTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { RequirementDocData } from "@/components/RequirementDoc";
import type { ReviewInfo } from "@/data/reviewTypes";
import { createDefaultReview, isReviewApproved, buildMockAIReview, AI_REVIEW_MODELS } from "@/data/reviewTypes";
import {
  type Conversation,
  type ChatMessage,
  createConversation,
  addMessageToConversation,
  addTaskToConversation,
  setConversationDevInProgress,
  removeTaskFromConversation,
  buildMockConversations,
} from "@/data/conversations";

const ProjectWorkspace = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [showDeepFlow, setShowDeepFlow] = useState(true);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [editingDoc, setEditingDoc] = useState<RequirementDocData | null>(null);

  // Conversation-based state — init with mock data
  const [mockData] = useState(() => buildMockConversations());
  const [conversations, setConversations] = useState<Conversation[]>(mockData.conversations);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => buildMockNotifications());
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [deployedIds, setDeployedIds] = useState<Set<string>>(mockData.deployedIds);
  const [reviewingIds, setReviewingIds] = useState<Set<string>>(new Set(["task-2"]));
  const [reviewStatus, setReviewStatus] = useState<Map<string, ReviewInfo>>(() => {
    const m = new Map<string, ReviewInfo>();
    // Mock: task-2 has completed AI review
    m.set("task-2", buildMockAIReview());
    return m;
  });
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [processCardId, setProcessCardId] = useState<string | null>(null);
  const [detailReadOnly, setDetailReadOnly] = useState(false);

  // Process panel shared state
  const [processIssueDecisions, setProcessIssueDecisions] = useState<Record<string, IssueDecision>>({});
  const [processOtherTexts, setProcessOtherTexts] = useState<Record<string, string>>({});
  const [processAcceptanceConfirmed, setProcessAcceptanceConfirmed] = useState(false);
  const [processMergeApproved, setProcessMergeApproved] = useState(false);

  const processReview = useMemo(() => buildProcessReview(), []);
  const processActionableIssues = useMemo(() => extractActionableIssues(processReview), [processReview]);
  const processAllResolved = processActionableIssues.length === 0 || processActionableIssues.every(i => processIssueDecisions[i.id]);

  const handleProcessDecide = useCallback((id: string, decision: IssueDecision) => {
    setProcessIssueDecisions(prev => ({ ...prev, [id]: decision }));
  }, []);
  const handleProcessOtherText = useCallback((id: string, text: string) => {
    setProcessOtherTexts(prev => ({ ...prev, [id]: text }));
  }, []);
  const handleProcessAcceptance = useCallback(() => {
    setProcessAcceptanceConfirmed(true);
    toast.success("人工验收通过，请确认合并主分支");
  }, []);
  const handleProcessMerge = useCallback(() => {
    setProcessMergeApproved(true);
    toast.success("已确认合并主分支，正在执行回归测试...");
  }, []);
  const [planFlow, setPlanFlow] = useState<{ active: boolean; requirement: string }>({ active: false, requirement: "" });

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;
  const devCards = activeConversation?.tasks || [];
  const chatMessages = activeConversation?.messages || [];
  const devInProgress = activeConversation?.devInProgress || false;
  const selectedCard = devCards.find((c) => c.id === selectedCardId)
    || conversations.flatMap((c) => c.tasks).find((c) => c.id === selectedCardId)
    || null;
  const processCard = devCards.find((c) => c.id === processCardId)
    || conversations.flatMap((c) => c.tasks).find((c) => c.id === processCardId)
    || null;

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const totalTaskCount = conversations.reduce(
    (sum, c) => sum + c.tasks.length + (c.devInProgress ? 1 : 0),
    0
  );

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (searchParams.get("devComplete") === "true") {
      setRightPanelOpen(true);
      setShowDeepFlow(false);
      setPlanFlow({ active: false, requirement: "" });
      searchParams.delete("devComplete");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleNewConversation = useCallback(() => {
    setShowDeepFlow(true);
    setShowNotificationCenter(false);
    setSelectedCardId(null);
    setEditingDoc(null);
  }, []);

  const handleSelectConversation = useCallback((convId: string) => {
    setActiveConversationId(convId);
    setSelectedCardId(null);
    setShowDeepFlow(false);
    setShowNotificationCenter(false);
    setEditingDoc(null);
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      setPlanFlow({ active: true, requirement: conv.currentRequirement });
    }
  }, [conversations]);

  const handleSubmit = (data: { text: string; isPlanMode: boolean }) => {
    if (!data.text.trim()) return;
    setShowDeepFlow(false);

    let convId = activeConversationId;
    if (!convId) {
      const newConv = createConversation(data.text);
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      convId = newConv.id;
    } else {
      setConversations((prev) => addMessageToConversation(prev, convId!, data.text));
    }

    if (data.isPlanMode) {
      setPlanFlow({ active: true, requirement: data.text });
    } else {
      setPlanFlow({ active: false, requirement: data.text });
      setConversations((prev) =>
        setConversationDevInProgress(prev, convId!, true)
      );
      setRightPanelOpen(true);
      const capturedConvId = convId;
      const delay = 3000 + Math.random() * 4000;
      setTimeout(() => {
        const result = buildMockDevResult(
          crypto.randomUUID(),
          data.text,
          id || "demo"
        );
        setConversations((prev) => addTaskToConversation(prev, capturedConvId, result));
        notifyDevComplete(result.requirementTitle);
        setSelectedCardId(result.id);
        setEditingDoc(null);
        setRightPanelOpen(true);
        // Auto-trigger AI Code Review
        startAIReview(result.id);
      }, delay);
    }
  };

  const handleOpenDocEditor = (docData: RequirementDocData) => {
    setEditingDoc(docData);
    setRightPanelOpen(true);
  };

  const handleCloseDocEditor = () => {
    setEditingDoc(null);
  };

  const startAIReview = useCallback((cardId: string) => {
    setReviewingIds((prev) => new Set(prev).add(cardId));
    const initialReview = createDefaultReview();
    initialReview.aiReviewStatus = "running";
    initialReview.aiReviewers = AI_REVIEW_MODELS.map((m) => ({ ...m, status: "pending" as const }));
    setReviewStatus((prev) => {
      const next = new Map(prev);
      next.set(cardId, initialReview);
      return next;
    });
    toast.success("AI Code Review 已启动，多个模型正在审查代码…");

    // Parallel progress simulation — each model starts at slightly different times
    // but runs concurrently with independent progress
    AI_REVIEW_MODELS.forEach((model, i) => {
      const startDelay = 300 + i * 400; // staggered start, but close together
      const reviewDuration = 2000 + Math.random() * 2000; // each model takes different time

      // Start reviewing
      setTimeout(() => {
        setReviewStatus((prev) => {
          const current = prev.get(cardId);
          if (!current) return prev;
          const next = new Map(prev);
          const updatedReviewers = (current.aiReviewers || []).map((r) =>
            r.id === model.id ? { ...r, status: "reviewing" as const, progress: 0 } : r
          );
          next.set(cardId, { ...current, aiReviewers: updatedReviewers });
          return next;
        });

        // Progress ticks
        const tickCount = 5;
        const tickInterval = reviewDuration / tickCount;
        for (let t = 1; t <= tickCount; t++) {
          setTimeout(() => {
            setReviewStatus((prev) => {
              const current = prev.get(cardId);
              if (!current) return prev;
              const next = new Map(prev);
              const updatedReviewers = (current.aiReviewers || []).map((r) =>
                r.id === model.id ? { ...r, progress: Math.min(Math.round((t / tickCount) * 90), 90) } : r
              );
              next.set(cardId, { ...current, aiReviewers: updatedReviewers });
              return next;
            });
          }, tickInterval * t);
        }

        // Complete this model
        setTimeout(() => {
          setReviewStatus((prev) => {
            const current = prev.get(cardId);
            if (!current) return prev;
            const finalReview = buildMockAIReview();
            const next = new Map(prev);
            const thisModelFinal = finalReview.aiReviewers?.find((r) => r.id === model.id);
            const updatedReviewers = (current.aiReviewers || []).map((r) =>
              r.id === model.id && thisModelFinal
                ? { ...thisModelFinal, status: "done" as const, progress: 100 }
                : r
            );
            const allDone = updatedReviewers.every((r) => r.status === "done");
            const result = {
              ...current,
              aiReviewers: updatedReviewers,
              aiReviewStatus: allDone ? ("done" as const) : ("running" as const),
              ...(allDone ? { overallScore: finalReview.overallScore } : {}),
            };
            next.set(cardId, result);
            if (allDone) {
              toast.success(`AI Code Review 完成，综合评分 ${finalReview.overallScore} 分`);
            }
            return next;
          });
        }, reviewDuration);
      }, startDelay);
    });
  }, []);

  const handleDevSubmitted = useCallback(() => {
    if (!activeConversationId) return;
    setConversations((prev) =>
      setConversationDevInProgress(prev, activeConversationId, true)
    );
    const delay = 3000 + Math.random() * 4000;
    const convId = activeConversationId;
    const requirement = planFlow.requirement;
    setTimeout(() => {
      const result = buildMockDevResult(
        crypto.randomUUID(),
        requirement,
        id || "demo"
      );
      setConversations((prev) => addTaskToConversation(prev, convId, result));
      notifyDevComplete(result.requirementTitle);
      setSelectedCardId(result.id);
      setEditingDoc(null);
      setRightPanelOpen(true);
      startAIReview(result.id);
    }, delay);
  }, [activeConversationId, planFlow.requirement, id, startAIReview]);

  const handleRequestReview = (cardId: string) => {
    startAIReview(cardId);
  };

  const handleUpdateReview = (cardId: string, review: ReviewInfo) => {
    setReviewStatus((prev) => {
      const next = new Map(prev);
      next.set(cardId, review);
      return next;
    });
    if (isReviewApproved(review)) {
      toast.success("AI 审查通过，可以发布到测试环境 🎉");
    }
  };

  const handleDeploy = (cardId: string) => {
    setDeployedIds((prev) => new Set(prev).add(cardId));
    toast.success("已发布到测试环境 🚀");
  };

  const handleReject = (cardId: string, decisions?: Record<string, string>) => {
    if (!activeConversationId) return;
    // Clean up review state
    setReviewingIds((prev) => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
    setReviewStatus((prev) => {
      const next = new Map(prev);
      next.delete(cardId);
      return next;
    });

    const aiFixCount = decisions ? Object.values(decisions).filter((v) => v === "ai_fix").length : 0;
    const skipCount = decisions ? Object.values(decisions).filter((v) => v === "skip").length : 0;
    const manualCount = decisions ? Object.values(decisions).filter((v) => v === "manual").length : 0;

    if (decisions && aiFixCount > 0) {
      toast(`AI 将自动修复 ${aiFixCount} 项问题${skipCount > 0 ? `，跳过 ${skipCount} 项` : ""}`, { icon: "🤖" });
    } else if (decisions && skipCount > 0 && aiFixCount === 0) {
      toast("已跳过所有问题", { icon: "✅" });
    } else {
      toast("已打回修改，AI 将重新处理", { icon: "🔄" });
    }

    const convId = activeConversationId;
    setConversations((prev) => {
      const updated = removeTaskFromConversation(prev, convId, cardId);
      return setConversationDevInProgress(updated, convId, true);
    });
    setTimeout(() => {
      const result = buildMockDevResult(cardId, planFlow.requirement || "需求修复", id || "demo");
      setConversations((prev) => addTaskToConversation(prev, convId, result));
      notifyDevComplete(result.requirementTitle);
      startAIReview(result.id);
    }, 3000 + Math.random() * 3000);
  };

  const handleNotificationClick = useCallback((notif: AppNotification) => {
    setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
    // Show task detail in right panel directly — don't navigate to private conversations
    if (notif.taskId) {
      setSelectedCardId(notif.taskId);
      setRightPanelOpen(true);
      setEditingDoc(null);
      setDetailReadOnly(true);
    }
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const scrollToCard = useCallback((cardId: string) => {
    setTimeout(() => {
      const el = document.querySelector(`[data-card-id="${cardId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, []);

  const handleSelectCard = useCallback((cardId: string) => {
    setSelectedCardId(cardId);
    setDetailReadOnly(false);
    setEditingDoc(null);
    setRightPanelOpen(true);
    scrollToCard(cardId);
    for (const conv of conversations) {
      if (conv.tasks.some((t) => t.id === cardId)) {
        setActiveConversationId(conv.id);
        break;
      }
    }
  }, [scrollToCard, conversations]);

  const mainContent = showNotificationCenter ? (
    <NotificationCenter
      notifications={notifications}
      onClickNotification={handleNotificationClick}
      onMarkAllRead={handleMarkAllRead}
      onClose={() => setShowNotificationCenter(false)}
    />
  ) : showDeepFlow ? (
    <DeepFlowPanel onSubmit={handleSubmit} />
  ) : (
    <ChatArea
      projectId={id || ""}
      planFlow={planFlow}
      onSubmit={handleSubmit}
      onCancel={() => setPlanFlow({ active: false, requirement: "" })}
      onOpenDocEditor={handleOpenDocEditor}
      onDevSubmitted={handleDevSubmitted}
      devCards={devCards}
      chatMessages={chatMessages}
      deployedIds={deployedIds}
      reviewingIds={reviewingIds}
      reviewStatus={reviewStatus}
      devInProgress={devInProgress}
      onDeploy={handleDeploy}
      onReject={handleReject}
      selectedCardId={selectedCardId}
      onSelectCard={handleSelectCard}
      onClearCard={() => setSelectedCardId(null)}
      onViewInProgressDetail={() => setRightPanelOpen(true)}
      onViewProcess={(cardId: string) => { setProcessCardId(cardId); setSelectedCardId(null); setRightPanelOpen(true); }}
      rightPanelOpen={rightPanelOpen}
      onToggleRightPanel={() => setRightPanelOpen(!rightPanelOpen)}
      processCardId={processCardId}
      processIssueDecisions={processIssueDecisions}
      processOtherTexts={processOtherTexts}
      processAcceptanceConfirmed={processAcceptanceConfirmed}
      processMergeApproved={processMergeApproved}
      processActionableIssues={processActionableIssues}
      processAllResolved={processAllResolved}
      onProcessDecide={handleProcessDecide}
      onProcessOtherText={handleProcessOtherText}
      onProcessAcceptance={handleProcessAcceptance}
      onProcessMerge={handleProcessMerge}
    />
  );

  return (
    <ProjectSidebarLayout
      onDeepFlowClick={() => { setShowDeepFlow(true); setShowNotificationCenter(false); setActiveConversationId(null); setSelectedCardId(null); setRightPanelOpen(false); }}
      deepFlowActive={showDeepFlow && !showNotificationCenter}
      taskCount={totalTaskCount}
      unreadNotificationCount={unreadNotificationCount}
      onNotificationCenterClick={() => { setShowNotificationCenter(true); setShowDeepFlow(false); }}
      notificationCenterActive={showNotificationCenter}
      taskList={
        <SidebarConversationList
          conversations={conversations}
          deployedIds={deployedIds}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />
      }
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
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <CheckCheck size={12} />
                全部已读
              </button>
            )}
          </div>
        ) : undefined
      }
    >
      {({ isDesktop }) => (
        rightPanelOpen && isDesktop ? (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={editingDoc ? 35 : 40} minSize={25}>
              {mainContent}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={editingDoc || selectedCard ? 65 : 60} minSize={30}>
              {editingDoc ? (
                <RequirementDocEditor
                  data={editingDoc}
                  onChange={(updated) => setEditingDoc(updated)}
                  onClose={handleCloseDocEditor}
                  onConfirm={() => {
                    handleCloseDocEditor();
                    handleDevSubmitted();
                  }}
                />
              ) : selectedCard ? (
                <DevCompleteDetailPanel
                  result={selectedCard}
                  onDeploy={handleDeploy}
                  onReject={handleReject}
                  onRequestReview={handleRequestReview}
                  onClose={() => { setSelectedCardId(null); setDetailReadOnly(false); setRightPanelOpen(false); }}
                  readOnly={detailReadOnly}
                  deployed={deployedIds.has(selectedCard.id)}
                  reviewing={reviewingIds.has(selectedCard.id)}
                  reviewInfo={reviewStatus.get(selectedCard.id)}
                  onUpdateReview={handleUpdateReview}
                />
              ) : processCard ? (
                <DevProcessDetailPanel
                  result={processCard}
                  onClose={() => { setProcessCardId(null); setRightPanelOpen(false); }}
                  issueDecisions={processIssueDecisions}
                  otherTexts={processOtherTexts}
                  acceptanceConfirmed={processAcceptanceConfirmed}
                  mergeApproved={processMergeApproved}
                  onDecide={handleProcessDecide}
                  onOtherText={handleProcessOtherText}
                  onConfirmAcceptance={handleProcessAcceptance}
                  onConfirmMerge={handleProcessMerge}
                />
              ) : (
                <PreviewPanel />
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : mainContent
      )}
    </ProjectSidebarLayout>
  );
};

/* Chat area sub-component */
const ChatArea = ({
  projectId,
  planFlow,
  onSubmit,
  onCancel,
  onOpenDocEditor,
  onDevSubmitted,
  devCards,
  chatMessages,
  deployedIds,
  reviewingIds,
  reviewStatus,
  devInProgress,
  onDeploy,
  onReject,
  selectedCardId,
  onSelectCard,
  onClearCard,
  onViewInProgressDetail,
  onViewProcess,
  rightPanelOpen,
  onToggleRightPanel,
  processCardId,
  processIssueDecisions,
  processOtherTexts,
  processAcceptanceConfirmed,
  processMergeApproved,
  processActionableIssues,
  processAllResolved,
  onProcessDecide,
  onProcessOtherText,
  onProcessAcceptance,
  onProcessMerge,
}: {
  projectId: string;
  planFlow: { active: boolean; requirement: string };
  onSubmit: (data: { text: string; isPlanMode: boolean }) => void;
  onCancel: () => void;
  onOpenDocEditor: (doc: RequirementDocData) => void;
  onDevSubmitted: () => void;
  devCards: DevCompleteResult[];
  chatMessages: ChatMessage[];
  deployedIds: Set<string>;
  reviewingIds: Set<string>;
  reviewStatus: Map<string, ReviewInfo>;
  devInProgress: boolean;
  onDeploy: (id: string) => void;
  onReject: (id: string, decisions?: Record<string, string>) => void;
  selectedCardId: string | null;
  onSelectCard: (id: string) => void;
  onClearCard: () => void;
  onViewInProgressDetail: () => void;
  onViewProcess: (cardId: string) => void;
  rightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  processCardId: string | null;
  processIssueDecisions: Record<string, IssueDecision>;
  processOtherTexts: Record<string, string>;
  processAcceptanceConfirmed: boolean;
  processMergeApproved: boolean;
  processActionableIssues: import("@/data/reviewTypes").AIReviewFinding[];
  processAllResolved: boolean;
  onProcessDecide: (id: string, decision: IssueDecision) => void;
  onProcessOtherText: (id: string, text: string) => void;
  onProcessAcceptance: () => void;
  onProcessMerge: () => void;
}) => {
  const renderUserMessage = (msg: ChatMessage) => (
    <div key={msg.id} className="flex justify-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-primary text-primary-foreground text-sm">
        {msg.text}
      </div>
      <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 text-xs font-medium text-foreground">
        我
      </div>
    </div>
  );

  const renderCard = (card: DevCompleteResult) => {
    const isReviewing = reviewingIds.has(card.id);
    const review = reviewStatus.get(card.id);
    const reviewApproved = review ? isReviewApproved(review) : false;
    return (
      <div
        key={card.id}
        data-card-id={card.id}
        className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        <div className="flex items-start gap-3 w-full">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <span className="text-foreground text-xs font-bold">DF</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mb-2">开发已完成，点击查看详情：</p>
            <DevCompleteCard
              result={card}
              onDeploy={onDeploy}
              onReject={onReject}
              deployed={deployedIds.has(card.id)}
              reviewing={isReviewing}
              reviewApproved={reviewApproved}
              selected={selectedCardId === card.id}
              onClick={() => onSelectCard(card.id)}
              onViewProcess={() => onViewProcess(card.id)}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderInProgress = () => (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start gap-3 max-w-[90%]">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
          <span className="text-foreground text-xs font-bold">DF</span>
        </div>
        <div className="flex-1 min-w-0">
          <DevInProgressCard
            requirement={planFlow.requirement || "新需求"}
            onViewDetail={onViewInProgressDetail}
            onPreview={() => window.open(`/project/${projectId}/preview`, "_blank")}
          />
        </div>
      </div>
    </div>
  );

  const taskCount = devCards.length + (devInProgress ? 1 : 0);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const renderTimeline = () => {
    const items: React.ReactNode[] = [];
    const msgCount = chatMessages.length;
    const cardCount = devCards.length;
    const max = Math.max(msgCount, cardCount);
    for (let i = 0; i < max; i++) {
      if (i < msgCount) items.push(renderUserMessage(chatMessages[i]));
      if (i < cardCount) items.push(renderCard(devCards[i]));
    }
    if (devInProgress) items.push(<div key="in-progress">{renderInProgress()}</div>);
    return items;
  };

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 md:px-8 pt-8 pb-32 scrollbar-hide">
        {planFlow.active ? (
          <div className="max-w-[800px] mx-auto flex flex-col gap-6">
            {chatMessages.length > 0 && renderUserMessage(chatMessages[chatMessages.length - 1])}
            <PlanFlow
              requirement={planFlow.requirement}
              onCancel={onCancel}
              onStartDev={() => {}}
              onOpenDocEditor={onOpenDocEditor}
              onDevSubmitted={onDevSubmitted}
            />
            {devCards.map(renderCard)}
            {devInProgress && renderInProgress()}
          </div>
        ) : chatMessages.length > 0 || devCards.length > 0 ? (
          <div className="max-w-[800px] mx-auto flex flex-col gap-6">
            {renderTimeline()}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-foreground text-sm font-bold">DF</span>
            </div>
            <p className="text-sm">输入需求开始开发</p>
          </div>
        )}
      </div>
      {(() => {
        // Check if ProcessReviewQA should be shown (process panel open with unresolved issues)
        let processQAPanel: React.ReactNode = null;
        if (processCardId && processActionableIssues.length > 0 && !processMergeApproved) {
          processQAPanel = (
            <ProcessReviewQA
              issues={processActionableIssues}
              decisions={processIssueDecisions}
              otherTexts={processOtherTexts}
              onDecide={onProcessDecide}
              onOtherText={onProcessOtherText}
              onConfirmAcceptance={onProcessAcceptance}
              onConfirmMerge={onProcessMerge}
              allResolved={processAllResolved}
              acceptanceConfirmed={processAcceptanceConfirmed}
              mergeApproved={processMergeApproved}
            />
          );
        }

        // Check if AcceptanceQA should be shown
        let qaPanel: React.ReactNode = null;
        if (!processQAPanel && selectedCardId) {
          const card = devCards.find(c => c.id === selectedCardId);
          if (card && !deployedIds.has(card.id)) {
            const review = reviewStatus.get(card.id);
            if (review?.aiReviewStatus === "done") {
              const allFindings = (review.aiReviewers || []).flatMap(
                (r) => (r.findings || []).map((f) => ({ ...f, reviewer: r.displayName }))
              );
              const failedTests = card.tests.filter((t) => !t.passed);
              const issues = buildAcceptanceIssues(allFindings, failedTests);
              if (issues.length > 0) {
                qaPanel = (
                  <AcceptanceQA
                    issues={issues}
                    onConfirm={(decisions) => onReject(card.id, decisions)}
                    onDeployAnyway={() => onDeploy(card.id)}
                  />
                );
              }
            }
          }
        }
        const showQA = !!qaPanel || !!processQAPanel;

        return (
          <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border">
            {processQAPanel ? (
              <div className="p-3">
                {processQAPanel}
              </div>
            ) : showQA ? (
              <div className="p-3">
                {qaPanel}
              </div>
            ) : (
              /* Normal mode: task list + PromptBar */
              <div className="p-3 flex items-center gap-2">
                {taskCount > 0 && (
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                        <ListTodo size={18} />
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                          {taskCount}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" side="top" className="w-72 p-2">
                      <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">当前对话任务</p>
                      <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto">
                        {devInProgress && (
                          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground opacity-70">
                            <Loader2 size={12} className="animate-spin text-primary shrink-0" />
                            <span className="truncate flex-1">{planFlow.requirement || "新任务"}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0 font-medium">开发中</span>
                          </div>
                        )}
                        {devCards.map((card) => {
                          const deployed = deployedIds.has(card.id);
                          const reviewing = reviewingIds.has(card.id) && !deployed;
                          return (
                            <button
                              key={card.id}
                              onClick={() => { onSelectCard(card.id); setPopoverOpen(false); }}
                              className={cn(
                                "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left",
                                selectedCardId === card.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"
                              )}
                            >
                              {deployed
                                ? <Check size={12} className="text-emerald-500 shrink-0" />
                                : reviewing
                                  ? <Shield size={12} className="text-primary shrink-0" />
                                  : <Circle size={10} className="text-orange-500 fill-orange-500 shrink-0" />
                              }
                              <span className="truncate flex-1">{card.requirementTitle}</span>
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium",
                                deployed ? "text-emerald-600 bg-emerald-500/10"
                                  : reviewing ? "text-primary bg-primary/10"
                                  : "text-orange-600 bg-orange-500/10"
                              )}>
                                {deployed ? "已发布" : reviewing ? "AI 审查中" : "待审查"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                <div className="flex-1">
                  <PromptBar
                    onSubmit={onSubmit}
                    compact
                    contextSlot={selectedCardId ? (() => {
                      const card = devCards.find(c => c.id === selectedCardId);
                      if (!card) return null;
                      const deployed = deployedIds.has(card.id);
                      const reviewing = reviewingIds.has(card.id) && !deployed;
                      const review = reviewStatus.get(card.id);
                      const reviewDone = review?.aiReviewStatus === "done";
                      const statusLabel = deployed ? "已发布" : reviewing ? (reviewDone ? "审查完成" : "AI 审查中") : "待审查";
                      const statusIcon = deployed
                        ? <Check size={12} className="text-emerald-500" />
                        : reviewing
                          ? (reviewDone ? <Shield size={12} className="text-emerald-500" /> : <Shield size={12} className="text-primary animate-pulse" />)
                          : <Circle size={10} className="text-amber-500 fill-amber-500" />;
                      return (
                        <div className="flex items-center gap-2 px-3 py-1.5 animate-fade-in">
                          <div className="w-[3px] self-stretch rounded-full bg-primary shrink-0" />
                          <div className="flex-1 min-w-0 flex items-center gap-1.5">
                            {statusIcon}
                            <span className="text-[11px] font-medium text-foreground/80 truncate">{card.requirementTitle}</span>
                            <span className="text-[10px] text-muted-foreground/60">·</span>
                            <span className="text-[10px] text-muted-foreground shrink-0">{statusLabel}</span>
                          </div>
                          <button
                            onClick={() => onClearCard()}
                            className="shrink-0 p-0.5 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })() : undefined}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};


export default ProjectWorkspace;
