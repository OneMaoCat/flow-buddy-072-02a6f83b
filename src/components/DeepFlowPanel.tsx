import { useState } from "react";
import { Sparkles } from "lucide-react";
import PromptBar from "@/components/PromptBar";

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
}

const DeepFlowPanel = ({ onSubmit }: DeepFlowPanelProps) => {
  const [promptText, setPromptText] = useState("");

  const handleChipClick = (chip: string) => {
    setPromptText(chip);
  };

  const handleSubmit = (data: { text: string; isPlanMode: boolean }) => {
    onSubmit(data);
    setPromptText("");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 h-full">
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
        <PromptBar onSubmit={handleSubmit} defaultText={promptText} />
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
  );
};

export default DeepFlowPanel;
