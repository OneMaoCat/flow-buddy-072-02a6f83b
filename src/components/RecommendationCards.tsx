import { useState } from "react";
import { GitBranch, Bug, Server, Database, Shield, TestTube, Code2, Layers, Terminal, Send } from "lucide-react";

const tabs = ["最佳实践", "推荐指令", "我的指令"];

type Card = { title: string; meta: string; icon: React.ElementType; gradient: string };

const tabCards: Record<number, Card[]> = {
  0: [
    { title: "微服务架构搭建模板", meta: "架构 · 2,841 · 18,302", icon: Layers, gradient: "from-foreground/5 to-foreground/10" },
    { title: "CI/CD 流水线配置", meta: "DevOps · 1,672 · 12,455", icon: GitBranch, gradient: "from-foreground/8 to-foreground/3" },
    { title: "React 组件最佳实践", meta: "前端 · 3,104 · 21,087", icon: Code2, gradient: "from-foreground/3 to-foreground/8" },
    { title: "数据库索引优化指南", meta: "数据库 · 1,293 · 9,761", icon: Database, gradient: "from-foreground/6 to-foreground/2" },
    { title: "API 安全防护方案", meta: "安全 · 987 · 7,342", icon: Shield, gradient: "from-foreground/4 to-foreground/9" },
    { title: "单元测试覆盖率提升", meta: "测试 · 1,456 · 10,218", icon: TestTube, gradient: "from-foreground/7 to-foreground/3" },
  ],
  1: [
    { title: "修复登录页表单验证 Bug", meta: "Bug修复 · 1,204 · 8,932", icon: Bug, gradient: "from-foreground/5 to-foreground/10" },
    { title: "生成 RESTful API 接口", meta: "后端 · 2,341 · 15,109", icon: Server, gradient: "from-foreground/8 to-foreground/3" },
    { title: "重构用户权限模块", meta: "重构 · 892 · 6,633", icon: Layers, gradient: "from-foreground/3 to-foreground/8" },
    { title: "添加 Redis 缓存层", meta: "性能 · 1,567 · 9,871", icon: Database, gradient: "from-foreground/6 to-foreground/2" },
    { title: "编写 E2E 自动化测试", meta: "测试 · 723 · 5,402", icon: TestTube, gradient: "from-foreground/4 to-foreground/9" },
    { title: "Docker 容器化部署", meta: "部署 · 1,845 · 13,276", icon: Terminal, gradient: "from-foreground/7 to-foreground/3" },
  ],
  2: [
    { title: "订单模块性能优化", meta: "上次编辑 2小时前", icon: Send, gradient: "from-foreground/5 to-foreground/10" },
    { title: "用户中心页面重构", meta: "上次编辑 昨天", icon: Code2, gradient: "from-foreground/8 to-foreground/3" },
    { title: "支付回调接口调试", meta: "上次编辑 3天前", icon: Bug, gradient: "from-foreground/3 to-foreground/8" },
    { title: "消息推送服务搭建", meta: "上次编辑 上周", icon: Server, gradient: "from-foreground/6 to-foreground/2" },
  ],
};

const RecommendationCards = () => {
  const [activeTab, setActiveTab] = useState(0);
  const currentCards = tabCards[activeTab] || [];

  return (
    <div className="w-full max-w-[860px] mx-auto">
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${i === activeTab
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Cards scroll */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
        {currentCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={`${activeTab}-${i}`}
              className="shrink-0 w-[220px] rounded-[14px] border border-border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group overflow-hidden"
            >
              <div className={`h-[130px] bg-gradient-to-br ${card.gradient} flex items-center justify-center relative`}>
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                  backgroundSize: '20px 20px'
                }} />
                <div className="w-14 h-14 rounded-2xl bg-background border border-border flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
                  <Icon size={24} className="text-foreground" />
                </div>
              </div>
              <div className="p-3.5">
                <p className="text-sm font-medium text-foreground mb-1.5 group-hover:text-foreground/80 transition-colors line-clamp-2">
                  {card.title}
                </p>
                <p className="text-xs text-muted-foreground">{card.meta}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationCards;
