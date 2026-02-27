import { Activity, AlertTriangle, CheckCircle2, Clock, Globe, RefreshCw, Users, Zap } from "lucide-react";
import { useState } from "react";

const uptimeData = [98, 100, 100, 99, 100, 100, 100, 97, 100, 100, 100, 100, 100, 100, 99, 100, 100, 100, 100, 100, 100, 100, 98, 100, 100, 100, 100, 100, 100, 100];

const recentEvents = [
  { type: "deploy", message: "v2.1.3 部署成功", time: "2小时前", status: "success" as const },
  { type: "alert", message: "API 响应时间短暂升高", time: "5小时前", status: "warning" as const },
  { type: "deploy", message: "v2.1.2 部署成功", time: "1天前", status: "success" as const },
  { type: "deploy", message: "v2.1.1 部署成功", time: "2天前", status: "success" as const },
];

const ProductionStatus = () => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-foreground">系统运行正常</span>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Uptime bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">30天可用性</span>
          <span className="text-xs font-semibold text-foreground">99.9%</span>
        </div>
        <div className="flex gap-[2px]">
          {uptimeData.map((val, i) => (
            <div
              key={i}
              className={`flex-1 h-5 rounded-sm ${val === 100 ? "bg-emerald-500/80" : val >= 98 ? "bg-amber-400/80" : "bg-destructive/60"}`}
              title={`第${i + 1}天: ${val}%`}
            />
          ))}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard icon={<Zap size={14} />} label="今日请求" value="12,847" trend="+12%" />
        <MetricCard icon={<AlertTriangle size={14} />} label="错误率" value="0.02%" trend="-0.01%" good />
        <MetricCard icon={<Clock size={14} />} label="平均响应" value="128ms" trend="-15ms" good />
        <MetricCard icon={<Users size={14} />} label="活跃用户" value="1,203" trend="+8%" />
      </div>

      {/* Real-time */}
      <div className="rounded-lg border border-border p-3">
        <div className="flex items-center gap-2 mb-2">
          <Activity size={14} className="text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">实时流量</span>
        </div>
        <div className="flex items-end gap-[3px] h-12">
          {Array.from({ length: 24 }, (_, i) => {
            const h = 20 + Math.random() * 80;
            return (
              <div
                key={i}
                className="flex-1 bg-primary/20 rounded-t-sm"
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">0:00</span>
          <span className="text-[10px] text-muted-foreground">12:00</span>
          <span className="text-[10px] text-muted-foreground">现在</span>
        </div>
      </div>

      {/* Recent events */}
      <div>
        <p className="text-xs font-medium text-foreground mb-2">近期事件</p>
        <div className="space-y-2">
          {recentEvents.map((event, i) => (
            <div key={i} className="flex items-start gap-2">
              {event.status === "success" ? (
                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground">{event.message}</p>
                <p className="text-[10px] text-muted-foreground">{event.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Link */}
      <div className="flex items-center gap-2 rounded-lg border border-border p-3">
        <Globe size={14} className="text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-foreground truncate">app.example.com</p>
          <p className="text-[10px] text-muted-foreground">线上地址</p>
        </div>
        <button className="text-[10px] text-primary font-medium hover:underline">访问</button>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, label, value, trend, good }: { icon: React.ReactNode; label: string; value: string; trend: string; good?: boolean }) => (
  <div className="rounded-lg border border-border p-2.5">
    <div className="flex items-center gap-1.5 mb-1">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
    <p className="text-sm font-semibold text-foreground">{value}</p>
    <p className={`text-[10px] ${trend.startsWith("-") && good ? "text-emerald-500" : trend.startsWith("+") ? "text-emerald-500" : "text-muted-foreground"}`}>
      {trend}
    </p>
  </div>
);

export default ProductionStatus;
