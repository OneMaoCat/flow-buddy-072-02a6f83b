import { useState } from "react";

const tabs = ["最佳实践", "推荐指令", "我的指令"];

type Card = { title: string; meta: string; color: string };

const tabCards: Record<number, Card[]> = {
  0: [
    { title: "微服务架构搭建模板", meta: "架构 · 2,841 · 18,302", color: "bg-primary/10" },
    { title: "CI/CD 流水线配置", meta: "DevOps · 1,672 · 12,455", color: "bg-accent" },
    { title: "React 组件最佳实践", meta: "前端 · 3,104 · 21,087", color: "bg-secondary" },
    { title: "数据库索引优化指南", meta: "数据库 · 1,293 · 9,761", color: "bg-primary/5" },
    { title: "API 安全防护方案", meta: "安全 · 987 · 7,342", color: "bg-accent" },
    { title: "单元测试覆盖率提升", meta: "测试 · 1,456 · 10,218", color: "bg-secondary" },
  ],
  1: [
    { title: "修复登录页表单验证 Bug", meta: "Bug修复 · 1,204 · 8,932", color: "bg-primary/10" },
    { title: "生成 RESTful API 接口", meta: "后端 · 2,341 · 15,109", color: "bg-accent" },
    { title: "重构用户权限模块", meta: "重构 · 892 · 6,633", color: "bg-secondary" },
    { title: "添加 Redis 缓存层", meta: "性能 · 1,567 · 9,871", color: "bg-primary/5" },
    { title: "编写 E2E 自动化测试", meta: "测试 · 723 · 5,402", color: "bg-accent" },
    { title: "Docker 容器化部署", meta: "部署 · 1,845 · 13,276", color: "bg-secondary" },
  ],
  2: [
    { title: "订单模块性能优化", meta: "我的 · 上次编辑 2小时前", color: "bg-primary/10" },
    { title: "用户中心页面重构", meta: "我的 · 上次编辑 昨天", color: "bg-accent" },
    { title: "支付回调接口调试", meta: "我的 · 上次编辑 3天前", color: "bg-secondary" },
    { title: "消息推送服务搭建", meta: "我的 · 上次编辑 上周", color: "bg-primary/5" },
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
        {currentCards.map((card, i) => (
          <div
            key={i}
            className="shrink-0 w-[220px] rounded-[14px] border border-border bg-card hover:shadow-md transition-shadow cursor-pointer group overflow-hidden"
          >
            <div className={`h-[130px] ${card.color} flex items-center justify-center`}>
              <div className="w-16 h-16 rounded-xl bg-background/60 flex items-center justify-center text-muted-foreground text-2xl font-bold">
                {card.title[0]}
              </div>
            </div>
            <div className="p-3.5">
              <p className="text-sm font-medium text-foreground mb-1.5 group-hover:text-primary transition-colors">
                {card.title}
              </p>
              <p className="text-xs text-muted-foreground">{card.meta}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationCards;
