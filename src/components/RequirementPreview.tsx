import { useState } from "react";
import { Monitor, Tablet, Smartphone, ExternalLink, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RequirementPreviewProps {
  previewPath: string;
  requirementTitle: string;
  projectId: string;
}

const devices = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: "100%", mockWidth: 1280 },
  { id: "tablet", label: "Tablet", icon: Tablet, width: "768px", mockWidth: 768 },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: "375px", mockWidth: 375 },
] as const;

const RequirementPreview = ({ previewPath, requirementTitle, projectId }: RequirementPreviewProps) => {
  const [device, setDevice] = useState<string>("desktop");
  const currentDevice = devices.find(d => d.id === device)!;

  const handleOpenExternal = () => {
    window.open(`/project/${projectId}/preview`, "_blank");
  };

  return (
    <div className="mt-3 rounded-lg border border-border bg-card/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-1.5">
          <Eye size={13} className="text-primary" />
          <span className="text-xs font-medium text-foreground">产品预览</span>
        </div>
        <div className="flex items-center gap-0.5">
          {devices.map(d => (
            <button
              key={d.id}
              onClick={(e) => { e.stopPropagation(); setDevice(d.id); }}
              className={cn(
                "p-1.5 rounded transition-colors",
                device === d.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
              title={d.label}
            >
              <d.icon size={12} />
            </button>
          ))}
        </div>
      </div>

      {/* Preview area */}
      <div className="flex items-start justify-center p-3 bg-muted/20" onClick={e => e.stopPropagation()}>
        <div
          className="bg-background border border-border rounded-md shadow-sm transition-all duration-300 h-[280px] flex flex-col"
          style={{ width: currentDevice.width, maxWidth: "100%" }}
        >
          {/* Mock browser chrome */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-muted/40 rounded-t-md">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-destructive/40" />
              <div className="w-2 h-2 rounded-full bg-orange-400/40" />
              <div className="w-2 h-2 rounded-full bg-green-400/40" />
            </div>
            <div className="flex-1 mx-2 px-2 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground truncate">
              localhost:5173{previewPath}
            </div>
          </div>

          {/* Mock content */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <currentDevice.icon size={32} strokeWidth={1} className="text-muted-foreground/50" />
            <p className="text-xs font-medium text-foreground/80">{requirementTitle}</p>
            <p className="text-[10px] text-muted-foreground">{previewPath}</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1">
              {currentDevice.mockWidth}px · {currentDevice.label} 视口
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end px-3 py-2 border-t border-border bg-muted/20">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
          onClick={(e) => { e.stopPropagation(); handleOpenExternal(); }}
        >
          <ExternalLink size={11} />
          新窗口打开完整预览
        </Button>
      </div>
    </div>
  );
};

export default RequirementPreview;
