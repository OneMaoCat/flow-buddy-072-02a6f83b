import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Monitor, Tablet, Smartphone, RefreshCw, ArrowLeft } from "lucide-react";
import { mockProjects } from "@/data/projects";

const devices = [
  { id: "desktop", icon: Monitor, width: "100%" },
  { id: "tablet", icon: Tablet, width: "768px" },
  { id: "mobile", icon: Smartphone, width: "375px" },
] as const;

const ProjectPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = mockProjects.find((p) => p.id === id);
  const [device, setDevice] = useState<string>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const currentDevice = devices.find((d) => d.id === device)!;

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">项目不存在</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Toolbar */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.close()}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-sm font-medium text-foreground">{project.name}</span>
          <span className="text-xs text-muted-foreground">— 预览</span>
        </div>
        <div className="flex items-center gap-1">
          {devices.map((d) => (
            <button
              key={d.id}
              onClick={() => setDevice(d.id)}
              className={`p-1.5 rounded-md transition-colors ${
                device === d.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <d.icon size={14} />
            </button>
          ))}
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary transition-colors ml-1"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {/* Preview area */}
      <div className="flex-1 flex items-start justify-center p-6 bg-muted/30 overflow-auto">
        <div
          key={refreshKey}
          className="bg-card border border-border rounded-lg shadow-sm transition-all duration-300 h-full min-h-[400px]"
          style={{ width: currentDevice.width, maxWidth: "100%" }}
        >
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 p-8">
            <currentDevice.icon size={48} strokeWidth={1} />
            <p className="text-sm">预览区域</p>
            <p className="text-xs text-muted-foreground/60">开发完成后将在此展示产品效果</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPreview;
