import { useState } from "react";
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import mockPreviewImg from "@/assets/mock-preview.jpg";

const devices = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { id: "tablet", label: "Tablet", icon: Tablet, width: "768px" },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: "375px" },
] as const;

const PreviewPanel = () => {
  const [device, setDevice] = useState<string>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const currentDevice = devices.find((d) => d.id === device)!;

  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* Browser-like header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card shrink-0">
        <div className="flex gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-orange-400/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
        </div>
        <div className="flex-1 mx-1 px-3 py-1 rounded-md bg-muted text-xs font-mono text-muted-foreground truncate">
          localhost:5173/
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {devices.map((d) => (
            <button
              key={d.id}
              onClick={() => setDevice(d.id)}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                device === d.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
              title={d.label}
            >
              <d.icon size={13} />
            </button>
          ))}
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors ml-0.5"
            title="刷新"
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={() => window.open(window.location.href, "_blank")}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
            title="新窗口打开"
          >
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 flex items-start justify-center overflow-auto">
        <div
          key={refreshKey}
          className="bg-background transition-all duration-300 h-full overflow-auto"
          style={{ width: currentDevice.width, maxWidth: "100%" }}
        >
          <img
            src={mockPreviewImg}
            alt="实时预览"
            className="w-full h-auto object-cover object-top"
          />
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
