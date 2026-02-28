import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Menu, PanelRightOpen, PanelRightClose, ExternalLink, Sparkles, Settings, Pin, PinOff, Cpu } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { mockProjects } from "@/data/projects";
import PlanFlow from "@/components/PlanFlow";
import PromptBar from "@/components/PromptBar";
import DeepFlowPanel from "@/components/DeepFlowPanel";
import TestPanel from "@/components/TestPanel";
import PreviewPanel from "@/components/PreviewPanel";
import PublishDialog from "@/components/PublishDialog";
import ProjectSwitcher from "@/components/ProjectSwitcher";
import ProductionStatus from "@/components/ProductionStatus";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProjectWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const project = mockProjects.find((p) => p.id === id);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarPinned, setSidebarPinned] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [planFlow, setPlanFlow] = useState<{ active: boolean; requirement: string }>({ active: false, requirement: "" });
  const [testsPassed, setTestsPassed] = useState(false);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);
  const [showDeepFlow, setShowDeepFlow] = useState(false);
  const [devCompleteMessage, setDevCompleteMessage] = useState(false);

  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false);
      setSidebarPinned(false);
      setRightPanelOpen(false);
    }
  }, [isDesktop]);

  // Handle devComplete param
  useEffect(() => {
    if (searchParams.get("devComplete") === "true") {
      setDevCompleteMessage(true);
      setTestsPassed(true);
      setRightPanelOpen(true);
      setShowDeepFlow(false);
      setPlanFlow({ active: false, requirement: "" });
      // clean up URL
      searchParams.delete("devComplete");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">项目不存在</p>
      </div>
    );
  }

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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && (
        <>
          {(!isDesktop || !sidebarPinned) && (
            <div className="fixed inset-0 bg-foreground/20 z-30" onClick={() => setSidebarOpen(false)} />
          )}
          <aside className={`${isDesktop && sidebarPinned ? "relative" : "fixed left-0 top-0 h-full z-40"} w-[260px] bg-sidebar border-r border-border flex flex-col shrink-0`}>
            {/* Project Switcher */}
            <div className="px-3 py-3 border-b border-border flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <ProjectSwitcher currentProject={project} />
              </div>
              {isDesktop && (
                <button
                  onClick={() => {
                    setSidebarPinned(!sidebarPinned);
                    if (sidebarPinned) setSidebarOpen(false);
                  }}
                  className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground shrink-0"
                  title={sidebarPinned ? "取消固定" : "固定侧边栏"}
                >
                  {sidebarPinned ? <Pin size={14} /> : <PinOff size={14} />}
                </button>
              )}
            </div>

            {/* DeepFlow AI Entry */}
            <div className="px-3 py-2 border-b border-border">
              <button
                onClick={() => setShowDeepFlow(true)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${
                  showDeepFlow
                    ? "bg-secondary text-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-secondary/50"
                }`}
              >
                <Sparkles size={14} className="shrink-0" />
                <span>DeepFlow AI</span>
              </button>
            </div>

            {/* Preview entry */}
            <div className="px-3 py-1">
              <button
                onClick={() => window.open(`/project/${id}/preview`, '_blank')}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-secondary/50 transition-colors"
              >
                <ExternalLink size={14} className="text-muted-foreground shrink-0" />
                <span>预览产品</span>
              </button>
            </div>

            {/* Dev Execution entry */}
            <div className="px-3 py-1 flex-1">
              <button
                onClick={() => navigate(`/project/${id}/dev`)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-secondary/50 transition-colors"
              >
                <Cpu size={14} className="text-muted-foreground shrink-0" />
                <span>开发执行中心</span>
              </button>
            </div>

            {/* Settings */}
            <div className="px-3 py-2 border-t border-border">
              <button
                onClick={() => navigate(`/project/${id}/settings`)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-secondary/50 transition-colors"
              >
                <Settings size={14} className="text-muted-foreground shrink-0" />
                <span>设置</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-12 flex items-center justify-between px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {(!sidebarOpen || !sidebarPinned) && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <Menu size={16} />
              </button>
            )}
            <span className="text-sm font-medium text-foreground">{project.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <PublishDialog testsPassed={testsPassed} previewConfirmed={previewConfirmed} />
            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
            >
              {rightPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            </button>
          </div>
        </header>

        {/* Content with resizable panels */}
        <div className="flex-1 min-h-0">
          {rightPanelOpen && isDesktop ? (
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={60} minSize={40}>
                {mainContent}
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={40} minSize={25}>
                <RightPanel
                  projectName={project.name}
                  onTestsPassed={() => setTestsPassed(true)}
                  onPreviewConfirm={() => setPreviewConfirmed(true)}
                  previewConfirmed={previewConfirmed}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            mainContent
          )}
        </div>
      </div>
    </div>
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
      <div className="max-w-[800px] mx-auto">
        <PromptBar onSubmit={onSubmit} />
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

const useIsDesktop = () => {
  const [d, setD] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const h = () => setD(window.innerWidth >= 1024);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return d;
};

export default ProjectWorkspace;
