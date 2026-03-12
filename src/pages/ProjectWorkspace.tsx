import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProjectWorkspace = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [planFlow, setPlanFlow] = useState<{ active: boolean; requirement: string }>({ active: false, requirement: "" });
  const [testsPassed, setTestsPassed] = useState(false);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);
  const [showDeepFlow, setShowDeepFlow] = useState(false);
  const [devCompleteMessage, setDevCompleteMessage] = useState(false);

  // Handle devComplete param
  useEffect(() => {
    if (searchParams.get("devComplete") === "true") {
      setDevCompleteMessage(true);
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

  const mainContent = showDeepFlow ? (
    <DeepFlowPanel
      onSubmit={handleSubmit}
      onSelectConversation={() => setShowDeepFlow(false)}
    />
  ) : (
    <ChatArea planFlow={planFlow} onSubmit={handleSubmit} onCancel={() => setPlanFlow({ active: false, requirement: "" })} devCompleteMessage={devCompleteMessage} />
  );

  return (
    <ProjectSidebarLayout
      onDeepFlowClick={() => setShowDeepFlow(true)}
      deepFlowActive={showDeepFlow}
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
            <ResizablePanel defaultSize={40} minSize={30}>
              {mainContent}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={60} minSize={30}>
              <RightPanel
                projectName=""
                onTestsPassed={() => setTestsPassed(true)}
                onPreviewConfirm={() => setPreviewConfirmed(true)}
                previewConfirmed={previewConfirmed}
              />
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
  devCompleteMessage,
}: {
  planFlow: { active: boolean; requirement: string };
  onSubmit: (data: { text: string; isPlanMode: boolean }) => void;
  onCancel: () => void;
  devCompleteMessage: boolean;
}) => (
  <div className="flex flex-col h-full">
    <div className="flex-1 overflow-y-auto px-5 md:px-8 pt-8 pb-32 scrollbar-hide">
      {devCompleteMessage ? (
        <div className="max-w-[800px] mx-auto">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-primary text-xs font-bold">AI</span>
            </div>
            <div className="rounded-lg bg-secondary/50 border border-border px-4 py-3 text-sm text-foreground leading-relaxed">
              <p>🎉 <strong>所有需求已开发完成！</strong></p>
              <p className="mt-1.5 text-muted-foreground text-xs">
                请在右侧预览面板确认效果，确认无误后即可点击「发布」按钮发布到线上。
              </p>
            </div>
          </div>
        </div>
      ) : planFlow.active ? (
        <div className="max-w-[800px] mx-auto">
          <PlanFlow requirement={planFlow.requirement} onCancel={onCancel} onStartDev={() => {}} />
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
    <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border p-3">
      <div className="mx-auto px-1">
        <PromptBar onSubmit={onSubmit} compact />
      </div>
    </div>
  </div>
);

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
