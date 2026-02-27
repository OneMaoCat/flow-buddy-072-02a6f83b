import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Menu, PanelRightOpen, PanelRightClose, Settings, UserPlus } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { mockProjects } from "@/data/projects";
import PlanFlow from "@/components/PlanFlow";
import PromptBar from "@/components/PromptBar";
import TestPanel from "@/components/TestPanel";
import PreviewPanel from "@/components/PreviewPanel";
import PublishDialog from "@/components/PublishDialog";
import MemberInvite from "@/components/MemberInvite";
import ProjectSwitcher from "@/components/ProjectSwitcher";
import ProductionStatus from "@/components/ProductionStatus";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const conversations = [
  "修复用户登录页表单验证 Bug",
  "重构订单模块支付流程",
  "搭建后台管理系统页面",
];

const ProjectWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = mockProjects.find((p) => p.id === id);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [planFlow, setPlanFlow] = useState<{ active: boolean; requirement: string }>({ active: false, requirement: "" });
  const [testsPassed, setTestsPassed] = useState(false);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);

  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false);
      setRightPanelOpen(false);
    }
  }, [isDesktop]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">项目不存在</p>
      </div>
    );
  }

  const handleSubmit = (data: { text: string; isPlanMode: boolean }) => {
    if (data.isPlanMode && data.text.trim()) {
      setPlanFlow({ active: true, requirement: data.text });
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && (
        <>
          {!isDesktop && <div className="fixed inset-0 bg-foreground/20 z-30" onClick={() => setSidebarOpen(false)} />}
          <aside className={`${isDesktop ? "relative" : "fixed left-0 top-0 h-full z-40"} w-[260px] bg-sidebar border-r border-border flex flex-col shrink-0`}>
            {/* Project Switcher */}
            <div className="px-3 py-3 border-b border-border">
              <ProjectSwitcher currentProject={project} />
            </div>

            {/* Members */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-medium">团队成员</p>
                <MemberInvite members={project.members} />
              </div>
              <div className="flex -space-x-1.5">
                {project.members.map((m) => (
                  <div
                    key={m.id}
                    className="w-7 h-7 rounded-full bg-accent border-2 border-sidebar flex items-center justify-center text-[10px] font-medium text-accent-foreground"
                    title={m.name}
                  >
                    {m.avatar}
                  </div>
                ))}
              </div>
            </div>


            {/* Conversations */}
            <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-hide">
              <p className="px-2 text-xs text-muted-foreground font-medium mb-2">对话历史</p>
              {conversations.map((c, i) => (
                <button
                  key={i}
                  className="w-full text-left px-2 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-secondary/50 transition-colors mb-0.5 truncate"
                >
                  {c}
                </button>
              ))}
            </div>
          </aside>
        </>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-12 flex items-center justify-between px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
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
                <ChatArea planFlow={planFlow} onSubmit={handleSubmit} onCancel={() => setPlanFlow({ active: false, requirement: "" })} />
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
            <ChatArea planFlow={planFlow} onSubmit={handleSubmit} onCancel={() => setPlanFlow({ active: false, requirement: "" })} />
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
}: {
  planFlow: { active: boolean; requirement: string };
  onSubmit: (data: { text: string; isPlanMode: boolean }) => void;
  onCancel: () => void;
}) => (
  <div className="flex flex-col h-full">
    <div className="flex-1 overflow-y-auto px-5 md:px-8 pt-8 pb-32 scrollbar-hide">
      {planFlow.active ? (
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
