import { useState, useEffect, useSyncExternalStore } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Menu, Sparkles, Settings, Pin, PinOff, Cpu, ChevronDown } from "lucide-react";
import { projectStore } from "@/data/projectStore";
import ProjectSwitcher from "@/components/ProjectSwitcher";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const useIsDesktop = () => {
  const [d, setD] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const h = () => setD(window.innerWidth >= 1024);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return d;
};

interface ProjectSidebarLayoutProps {
  children: (props: {
    sidebarOpen: boolean;
    sidebarPinned: boolean;
    isDesktop: boolean;
    setSidebarOpen: (v: boolean) => void;
  }) => React.ReactNode;
  onDeepFlowClick?: () => void;
  deepFlowActive?: boolean;
  headerRight?: React.ReactNode;
  taskList?: React.ReactNode;
  taskCount?: number;
}

const ProjectSidebarLayout = ({
  children,
  onDeepFlowClick,
  deepFlowActive = false,
  headerRight,
  taskList,
  taskCount = 0,
}: ProjectSidebarLayoutProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const projects = useSyncExternalStore(projectStore.subscribe, projectStore.getAll);
  const project = projects.find((p) => p.id === id);
  const isDesktop = useIsDesktop();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarPinned, setSidebarPinned] = useState(true);

  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false);
      setSidebarPinned(false);
    }
  }, [isDesktop]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">项目不存在</p>
      </div>
    );
  }

  const isDevPage = location.pathname.includes("/dev");

  const navItems = [
    ...(onDeepFlowClick
      ? [{ label: "DeepFlow AI", icon: <Sparkles size={14} className="shrink-0" />, onClick: onDeepFlowClick, active: deepFlowActive, separator: true }]
      : []),
    { label: "开发执行中心", icon: <Cpu size={14} className="text-muted-foreground shrink-0" />, onClick: () => navigate(`/project/${id}/dev`), active: isDevPage },
  ];

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

            {/* Nav items */}
            <div className="flex flex-col">
              {navItems.map((item, i) => (
                <div key={i} className={`px-3 ${item.separator ? "py-2 border-b border-border" : "py-1"}`}>
                  <button
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${
                      item.active
                        ? "bg-secondary text-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Task list */}
            {taskList && (
              <Collapsible defaultOpen className="border-t border-border">
                <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group">
                  <span className="flex items-center gap-1.5">
                    对话历史
                    {taskCount > 0 && (
                      <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                        {taskCount}
                      </span>
                    )}
                  </span>
                  <ChevronDown size={12} className="transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-3 pb-2">
                    {taskList}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Spacer */}
            <div className="flex-1" />

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
            
          </div>
          {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
        </header>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {children({ sidebarOpen, sidebarPinned, isDesktop, setSidebarOpen })}
        </div>
      </div>
    </div>
  );
};

export default ProjectSidebarLayout;
