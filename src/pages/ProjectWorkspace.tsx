import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { PanelRightOpen, PanelRightClose, ListTodo, Loader2, Circle, Check, Users } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import PlanFlow from "@/components/PlanFlow";
import PromptBar from "@/components/PromptBar";
import DeepFlowPanel from "@/components/DeepFlowPanel";
import TestPanel from "@/components/TestPanel";
import PreviewPanel from "@/components/PreviewPanel";
import PublishDialog from "@/components/PublishDialog";
import ProductionStatus from "@/components/ProductionStatus";
import ProjectSidebarLayout from "@/components/ProjectSidebarLayout";
import RequirementDocEditor from "@/components/RequirementDocEditor";
import DevCompleteCard, { DevInProgressCard, buildMockDevResult, type DevCompleteResult } from "@/components/DevCompleteCard";
import DevCompleteDetailPanel from "@/components/DevCompleteDetailPanel";
import SidebarConversationList from "@/components/SidebarConversationList";
import { requestNotificationPermission, notifyDevComplete } from "@/components/DevNotification";
import SidebarNotificationList from "@/components/SidebarNotificationList";
import { type AppNotification, buildMockNotifications } from "@/data/notifications";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { RequirementDocData } from "@/components/RequirementDoc";
import type { ReviewInfo } from "@/data/reviewTypes";
import { createDefaultReview, isReviewApproved } from "@/data/reviewTypes";
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
  const [testsPassed, setTestsPassed] = useState(false);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);
  const [showDeepFlow, setShowDeepFlow] = useState(true);
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
    // Mock: task-2 is in review with one approval
    m.set("task-2", {
      reviewers: [
        { id: "u1", name: "吴承霖", status: "approved" },
        { id: "u2", name: "邱翔", status: "pending" },
      ],
      comments: [
        { id: "c1", author: "吴承霖", text: "支付逻辑看起来没问题，LGTM", timestamp: Date.now() - 300_000 },
      ],
    });
    return m;
  });
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [planFlow, setPlanFlow] = useState<{ active: boolean; requirement: string }>({ active: false, requirement: "" });

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;
  const devCards = activeConversation?.tasks || [];
  const chatMessages = activeConversation?.messages || [];
  const devInProgress = activeConversation?.devInProgress || false;
  const selectedCard = devCards.find((c) => c.id === selectedCardId) || null;

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
      setTestsPassed(true);
      setRightPanelOpen(true);
      setShowDeepFlow(false);
      setPlanFlow({ active: false, requirement: "" });
      searchParams.delete("devComplete");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleNewConversation = useCallback(() => {
    setShowDeepFlow(true);
    setSelectedCardId(null);
    setEditingDoc(null);
  }, []);

  const handleSelectConversation = useCallback((convId: string) => {
    setActiveConversationId(convId);
    setSelectedCardId(null);
    setShowDeepFlow(false);
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
    }, delay);
  }, [activeConversationId, planFlow.requirement, id]);

  const handleRequestReview = (cardId: string) => {
    setReviewingIds((prev) => new Set(prev).add(cardId));
    setReviewStatus((prev) => {
      const next = new Map(prev);
      next.set(cardId, createDefaultReview());
      return next;
    });
    toast.success("已发起 Code Review，等待团队审查");
  };

  const handleUpdateReview = (cardId: string, review: ReviewInfo) => {
    setReviewStatus((prev) => {
      const next = new Map(prev);
      next.set(cardId, review);
      return next;
    });
    if (isReviewApproved(review)) {
      toast.success("所有审查人已通过，可以发布到测试环境 🎉");
    }
  };

  const handleDeploy = (cardId: string) => {
    setDeployedIds((prev) => new Set(prev).add(cardId));
    toast.success("已发布到测试环境 🚀");
  };

  const handleReject = (cardId: string) => {
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
    toast("已打回修改，AI 将重新处理", { icon: "🔄" });
    const convId = activeConversationId;
    setConversations((prev) => {
      const updated = removeTaskFromConversation(prev, convId, cardId);
      return setConversationDevInProgress(updated, convId, true);
    });
    setTimeout(() => {
      const result = buildMockDevResult(cardId, planFlow.requirement || "需求修复", id || "demo");
      setConversations((prev) => addTaskToConversation(prev, convId, result));
      notifyDevComplete(result.requirementTitle);
    }, 3000 + Math.random() * 3000);
  };

  const scrollToCard = useCallback((cardId: string) => {
    setTimeout(() => {
      const el = document.querySelector(`[data-card-id="${cardId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, []);

  const handleSelectCard = useCallback((cardId: string) => {
    setSelectedCardId(cardId);
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

  const mainContent = showDeepFlow ? (
    <DeepFlowPanel onSubmit={handleSubmit} />
  ) : (
    <ChatArea
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
      onViewInProgressDetail={() => setRightPanelOpen(true)}
    />
  );

  return (
    <ProjectSidebarLayout
      onDeepFlowClick={() => { setShowDeepFlow(true); setActiveConversationId(null); setSelectedCardId(null); setRightPanelOpen(false); }}
      deepFlowActive={showDeepFlow}
      taskCount={totalTaskCount}
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
        <>
          <PublishDialog testsPassed={testsPassed} previewConfirmed={previewConfirmed} />
          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
          >
            {rightPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        </>
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
                  onClose={() => setSelectedCardId(null)}
                  deployed={deployedIds.has(selectedCard.id)}
                  reviewing={reviewingIds.has(selectedCard.id)}
                  reviewInfo={reviewStatus.get(selectedCard.id)}
                  onUpdateReview={handleUpdateReview}
                />
              ) : (
                <RightPanel
                  projectName=""
                  onTestsPassed={() => setTestsPassed(true)}
                  onPreviewConfirm={() => setPreviewConfirmed(true)}
                  previewConfirmed={previewConfirmed}
                />
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
  onViewInProgressDetail,
}: {
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
  onReject: (id: string) => void;
  selectedCardId: string | null;
  onSelectCard: (id: string) => void;
  onViewInProgressDetail: () => void;
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
        <div className="flex items-start gap-3 max-w-[90%]">
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
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border p-3">
        <div className="flex items-center gap-2">
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
                            ? <Users size={12} className="text-amber-500 shrink-0" />
                            : <Circle size={10} className="text-orange-500 fill-orange-500 shrink-0" />
                        }
                        <span className="truncate flex-1">{card.requirementTitle}</span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium",
                          deployed ? "text-emerald-600 bg-emerald-500/10"
                            : reviewing ? "text-amber-600 bg-amber-500/10"
                            : "text-orange-600 bg-orange-500/10"
                        )}>
                          {deployed ? "已发布" : reviewing ? "审查中" : "待审查"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
          <div className="flex-1">
            <PromptBar onSubmit={onSubmit} compact />
          </div>
        </div>
      </div>
    </div>
  );
};

/* Right panel sub-component */
const RightPanel = ({
  projectName,
  onTestsPassed,
  onPreviewConfirm,
  previewConfirmed,
}: {
  projectName: string;
  onTestsPassed: () => void;
  onPreviewConfirm: () => void;
  previewConfirmed: boolean;
}) => (
  <Tabs defaultValue="preview" className="flex flex-col h-full">
    <TabsList className="mx-4 mt-3 mb-0">
      <TabsTrigger value="preview" className="text-xs">预览</TabsTrigger>
      <TabsTrigger value="tests" className="text-xs">测试</TabsTrigger>
      <TabsTrigger value="status" className="text-xs">运行状态</TabsTrigger>
    </TabsList>
    <TabsContent value="preview" className="flex-1 min-h-0 m-0">
      <PreviewPanel />
      {!previewConfirmed && (
        <div className="px-4 pb-3">
          <button
            onClick={onPreviewConfirm}
            className="w-full h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            确认预览效果
          </button>
        </div>
      )}
    </TabsContent>
    <TabsContent value="tests" className="flex-1 min-h-0 m-0">
      <TestPanel projectName={projectName} onAllPassed={onTestsPassed} />
    </TabsContent>
    <TabsContent value="status" className="flex-1 min-h-0 m-0">
      <ProductionStatus />
    </TabsContent>
  </Tabs>
);

export default ProjectWorkspace;
