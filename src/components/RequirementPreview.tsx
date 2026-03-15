import { useState } from "react";
import { Monitor, Tablet, Smartphone, ExternalLink, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import mockPreviewImg from "@/assets/mock-preview.jpg";

interface RequirementPreviewProps {
  previewPath: string;
  requirementTitle: string;
  projectId: string;
  fullscreen?: boolean;
}

const devices = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: "100%", mockWidth: 1280 },
  { id: "tablet", label: "Tablet", icon: Tablet, width: "768px", mockWidth: 768 },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: "375px", mockWidth: 375 },
] as const;

const RequirementPreview = ({ previewPath, requirementTitle, projectId, fullscreen = false }: RequirementPreviewProps) => {
  const [device, setDevice] = useState<string>("desktop");
  const currentDevice = devices.find(d => d.id === device)!;

  const handleOpenExternal = () => {
    window.open(`/project/${projectId}/preview`, "_blank");
  };

  return (
    <div className={cn(
      "rounded-lg border border-border bg-card/50 overflow-hidden flex flex-col",
      fullscreen ? "h-full" : "mt-3"
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex gap-1 shrink-0">
          <div className="w-2 h-2 rounded-full bg-destructive/40" />
          <div className="w-2 h-2 rounded-full bg-orange-400/40" />
          <div className="w-2 h-2 rounded-full bg-green-400/40" />
        </div>
        <div className="flex-1 mx-1 px-2 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground truncate">
          localhost:5173{previewPath}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
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
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground ml-1"
            onClick={(e) => { e.stopPropagation(); handleOpenExternal(); }}
          >
            <ExternalLink size={11} />
          </Button>
        </div>
      </div>

      {/* Preview area */}
      <div className={cn(
        "flex items-start justify-center bg-muted/20 overflow-auto flex-1",
        fullscreen ? "p-0" : "p-3"
      )} onClick={e => e.stopPropagation()}>
        <div
          className={cn(
            "bg-background shadow-sm transition-all duration-300 flex flex-col overflow-hidden",
            fullscreen ? "h-full rounded-none border-0" : "h-[480px] rounded-md border border-border"
          )}
          style={{ width: currentDevice.width, maxWidth: "100%" }}
        >

          {/* Mock screenshot */}
          <div className="flex-1 overflow-auto">
            <img
              src={mockPreviewImg}
              alt={requirementTitle}
              className="w-full h-auto object-cover object-top"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementPreview;
