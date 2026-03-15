import { useState, useEffect } from "react";
import { Plus, Mic, ArrowUp, ListChecks } from "lucide-react";

interface PromptBarProps {
  onSubmit?: (data: { text: string; isPlanMode: boolean }) => void;
  defaultText?: string;
  compact?: boolean;
  contextSlot?: React.ReactNode;
}

const PromptBar = ({ onSubmit, defaultText, compact }: PromptBarProps) => {
  const [planMode, setPlanMode] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (defaultText) setText(defaultText);
  }, [defaultText]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSubmit?.({ text: text.trim(), isPlanMode: planMode });
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`w-full mx-auto ${compact ? "" : "max-w-[860px]"}`}>
      <div className="flex items-center gap-2 border-2 border-prompt-border rounded-[18px] bg-prompt px-3 py-2 shadow-sm focus-within:border-primary/40 focus-within:shadow-md transition-all">
        <button className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground">
          <Plus size={20} />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="帮我修复用户登录页的表单验证 bug，并添加单元测试"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none h-10"
        />
        <button
          onClick={() => setPlanMode(!planMode)}
          className={`shrink-0 h-8 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium transition-all duration-200 border ${
            planMode
              ? "bg-foreground text-background border-foreground"
              : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
          }`}
        >
          <ListChecks size={14} />
          Plan
        </button>
        <button className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground">
          <Mic size={18} />
        </button>
        <button
          onClick={handleSend}
          className="shrink-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <ArrowUp size={18} />
        </button>
      </div>
    </div>
  );
};

export default PromptBar;
