import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { PanelRightOpen, PanelRightClose } from "lucide-react";
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
import DevCompleteCard, { buildMockDevResult, type DevCompleteResult } from "@/components/DevCompleteCard";
import DevCompleteDetailPanel from "@/components/DevCompleteDetailPanel";
import SidebarTaskList from "@/components/SidebarTaskList";
import { requestNotificationPermission, notifyDevComplete } from "@/components/DevNotification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { RequirementDocData } from "@/components/RequirementDoc";

const ProjectWorkspace = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [planFlow, setPlanFlow] = useState<{ active: boolean; requirement: string }>({ active: false, requirement: "" });
  const [testsPassed, setTestsPassed] = useState(false);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);
  const [showDeepFlow, setShowDeepFlow] = useState(false);
  const [editingDoc, setEditingDoc] = useState<RequirementDocData | null>(null);

  // Dev complete cards in chat
  const [devCards, setDevCards] = useState<DevCompleteResult[]>([]);
  const [deployedIds, setDeployedIds] = useState<Set<string>>(new Set());
  const [devInProgress, setDevInProgress] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const selectedCard = devCards.find((c) => c.id === selectedCardId) || null;

  // Request notification permission once
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Handle devComplete param (legacy)
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

  const handleSubmit = (data: { text: string; isPlanMode: boolean }) => {
    setShowDeepFlow(false);
    if (data.isPlanMode && data.text.trim()) {
      setPlanFlow({ active: true, requirement: data.text });
    }
  };

  const handleOpenDocEditor = (docData: RequirementDocData) => {
    setEditingDoc(docData);
    setRightPanelOpen(true);
  };

  const handleCloseDocEditor = () => {
    setEditingDoc(null);
  };

  // When plan is confirmed → start simulated async dev
  const handleDevSubmitted = useCallback(() => {
    setDevInProgress(true);
    const delay = 3000 + Math.random() * 4000; // 3-7s
    setTimeout(() => {
      const result = buildMockDevResult(
        crypto.randomUUID(),
        planFlow.requirement,
        id || "demo"
      );
      setDevCards((prev) => [...prev, result]);
      setDevInProgress(false);
      notifyDevComplete(result.requirementTitle);
    }, delay);
  }, [planFlow.requirement, id]);

  const handleDeploy = (cardId: string) => {
    setDeployedIds((prev) => new Set(prev).add(cardId));
    toast.success("已发布到测试环境 🚀");
  };

  const handleReject = (cardId: string) => {
    toast("已打回修改，AI 将重新处理", { icon: "🔄" });
    // Remove card & re-trigger dev
    setDevCards((prev) => prev.filter((c) => c.id !== cardId));
    setDevInProgress(true);
    setTimeout(() => {
      const result = buildMockDevResult(cardId, planFlow.requirement || "需求修复", id || "demo");
      setDevCards((prev) => [...prev, result]);
      setDevInProgress(false);
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
  }, [scrollToCard]);

  const mainContent = showDeepFlow ? (
    <DeepFlowPanel
      onSubmit={handleSubmit}
      onSelectConversation={() => setShowDeepFlow(false)}
    />
  ) : (
    <ChatArea
      planFlow={planFlow}
      onSubmit={handleSubmit}
      onCancel={() => setPlanFlow({ active: false, requirement: "" })}
      onOpenDocEditor={handleOpenDocEditor}
      onDevSubmitted={handleDevSubmitted}
      devCards={devCards}
      deployedIds={deployedIds}
      devInProgress={devInProgress}
      onDeploy={handleDeploy}
      onReject={handleReject}
      selectedCardId={selectedCardId}
      onSelectCard={handleSelectCard}
    />
  );

  return (
    <ProjectSidebarLayout
      onDeepFlowClick={() => setShowDeepFlow(true)}
      deepFlowActive={showDeepFlow}
      taskCount={devCards.length + (devInProgress ? 1 : 0)}
      taskList={
        <SidebarTaskList
          devCards={devCards}
          deployedIds={deployedIds}
          devInProgress={devInProgress}
          currentRequirement={planFlow.requirement}
          selectedCardId={selectedCardId}
          onSelectCard={handleSelectCard}
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
                />
              ) : selectedCard ? (
                <DevCompleteDetailPanel
                  result={selectedCard}
                  onDeploy={handleDeploy}
                  onReject={handleReject}
                  onClose={() => setSelectedCardId(null)}
                  deployed={deployedIds.has(selectedCard.id)}
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
  deployedIds,
  devInProgress,
  onDeploy,
  onReject,
  selectedCardId,
  onSelectCard,
}: {
  planFlow: { active: boolean; requirement: string };
  onSubmit: (data: { text: string; isPlanMode: boolean }) => void;
  onCancel: () => void;
  onOpenDocEditor: (doc: RequirementDocData) => void;
  onDevSubmitted: () => void;
  devCards: DevCompleteResult[];
  deployedIds: Set<string>;
  devInProgress: boolean;
  onDeploy: (id: string) => void;
  onReject: (id: string) => void;
  selectedCardId: string | null;
  onSelectCard: (id: string) => void;
}) => {
  const renderCard = (card: DevCompleteResult) => (
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
          <p className="text-sm text-muted-foreground mb-2">开发已完成，请验收：</p>
          <div
            onClick={() => onSelectCard(card.id)}
            className={cn(
              "cursor-pointer rounded-xl transition-all",
              selectedCardId === card.id && "ring-2 ring-primary"
            )}
          >
            <DevCompleteCard
              result={card}
              onDeploy={onDeploy}
              onReject={onReject}
              deployed={deployedIds.has(card.id)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 md:px-8 pt-8 pb-32 scrollbar-hide">
        {planFlow.active ? (
          <div className="max-w-[800px] mx-auto flex flex-col gap-6">
            <PlanFlow
              requirement={planFlow.requirement}
              onCancel={onCancel}
              onStartDev={() => {}}
              onOpenDocEditor={onOpenDocEditor}
              onDevSubmitted={onDevSubmitted}
            />
            {devCards.map(renderCard)}
          </div>
        ) : devCards.length > 0 ? (
          <div className="max-w-[800px] mx-auto flex flex-col gap-6">
            {devCards.map(renderCard)}
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
        <PromptBar onSubmit={onSubmit} compact />
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
