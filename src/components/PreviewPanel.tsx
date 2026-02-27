import { useState } from "react";
import { Monitor, Tablet, Smartphone, RefreshCw } from "lucide-react";

const devices = [
  { id: "desktop", icon: Monitor, width: "100%" },
  { id: "tablet", icon: Tablet, width: "768px" },
  { id: "mobile", icon: Smartphone, width: "375px" },
] as const;

const PreviewPanel = () => {
  const [device, setDevice] = useState<string>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const currentDevice = devices.find((d) => d.id === device)!;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">预览</h3>
        <div className="flex items-center gap-1">
          {devices.map((d) => (
            <button
              key={d.id}
              onClick={() => setDevice(d.id)}
              className={`p-1.5 rounded-md transition-colors ${device === d.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
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
      </div>

      <div className="flex-1 flex items-start justify-center p-4 bg-muted/30 overflow-auto">
        <div
          key={refreshKey}
          className="bg-card border border-border rounded-lg shadow-sm transition-all duration-300 h-full min-h-[300px]"
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

export default PreviewPanel;
