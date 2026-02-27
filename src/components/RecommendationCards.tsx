import { useState } from "react";

const tabs = ["最佳实践", "推荐指令", "我的指令"];

const cards = [
  { title: "AI 智能周报生成器", meta: "文档 · 1,204 · 8,932", color: "bg-primary/10" },
  { title: "数据看板一键搭建", meta: "仪表盘 · 892 · 16,633", color: "bg-accent" },
  { title: "会议纪要自动整理", meta: "文档 · 2,341 · 12,109", color: "bg-secondary" },
  { title: "产品竞品分析模板", meta: "图片 · 844 · 16,633", color: "bg-primary/5" },
  { title: "营销文案批量生成", meta: "文案 · 1,567 · 9,871", color: "bg-accent" },
  { title: "用户调研问卷设计", meta: "表格 · 723 · 5,402", color: "bg-secondary" },
];

const RecommendationCards = () => {
  const [activeTab, setActiveTab] = useState(0);

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
        {cards.map((card, i) => (
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
