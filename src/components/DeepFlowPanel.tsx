import { useState } from "react";
import { Search, MessageSquare, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import PromptBar from "@/components/PromptBar";

const conversations = [
  { id: 1, title: "修复用户登录页表单验证 Bug", time: "10 分钟前", group: "今天" },
  { id: 2, title: "重构订单模块支付流程", time: "2 小时前", group: "今天" },
  { id: 3, title: "搭建后台管理系统页面", time: "5 小时前", group: "今天" },
  { id: 4, title: "优化首页加载性能", time: "昨天", group: "昨天" },
  { id: 5, title: "添加用户权限管理模块", time: "昨天", group: "昨天" },
  { id: 6, title: "设计商品数据库表结构", time: "3 天前", group: "更早" },
];

const ctaChips = [
  "修 Bug",
  "开发新功能",
  "创建 API",
  "搭建页面",
  "写单元测试",
  "设计数据库",
  "代码审查",
  "性能优化",
];

interface DeepFlowPanelProps {
  onSubmit: (data: { text: string; isPlanMode: boolean }) => void;
  onSelectConversation?: (id: number) => void;
}

const DeepFlowPanel = ({ onSubmit, onSelectConversation }: DeepFlowPanelProps) => {
  const [search, setSearch] = useState("");
  const [promptText, setPromptText] = useState("");

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const groups = [...new Set(filtered.map((c) => c.group))];

  const handleChipClick = (chip: string) => {
    setPromptText(chip);
  };

  const handleSubmit = (data: { text: string; isPlanMode: boolean }) => {
    onSubmit(data);
    setPromptText("");
  };

  return (
    <div className="flex h-full">
      {/* Left: Conversation History */}
      <div className="w-[280px] border-r border-border flex flex-col shrink-0">
        <div className="px-3 py-3 border-b border-border">
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-secondary/50">
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索对话..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-2 py-2">
            {groups.map((group) => (
              <div key={group} className="mb-3">
                <p className="px-2 text-[11px] text-muted-foreground font-medium mb-1">{group}</p>
                {filtered
                  .filter((c) => c.group === group)
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onSelectConversation?.(c.id)}
                      className="w-full text-left px-2.5 py-2 rounded-lg text-sm text-foreground hover:bg-secondary/60 transition-colors mb-0.5 flex items-start gap-2"
                    >
                      <MessageSquare size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="truncate">{c.title}</p>
                        <p className="text-[11px] text-muted-foreground">{c.time}</p>
                      </div>
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right: New Conversation */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
          {/* Logo + Welcome */}
          <div className="flex flex-col items-center gap-3 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center">
              <Sparkles size={24} className="text-background" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">DeepFlow AI</h2>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              描述你的需求，我来帮你规划和实现
            </p>
          </div>

          {/* Input */}
          <div className="w-full max-w-[680px] mb-8">
            <PromptBar
              onSubmit={handleSubmit}
              defaultText={promptText}
            />
          </div>

          {/* CTA Chips */}
          <div className="flex flex-wrap justify-center gap-2 max-w-[600px]">
            {ctaChips.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-accent transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepFlowPanel;
