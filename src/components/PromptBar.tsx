import { Plus, Mic, ArrowUp } from "lucide-react";

const PromptBar = () => {
  return (
    <div className="w-full max-w-[860px] mx-auto">
      <div className="flex items-center gap-2 border-2 border-prompt-border rounded-[18px] bg-prompt px-3 py-2 shadow-sm focus-within:border-primary/40 focus-within:shadow-md transition-all">
        <button className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground">
          <Plus size={20} />
        </button>
        <input
          type="text"
          placeholder="总结罗振宇 2026 跨年演讲金句，生成一组图片"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none h-10"
        />
        <button className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground">
          <Mic size={18} />
        </button>
        <button className="shrink-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity">
          <ArrowUp size={18} />
        </button>
      </div>
    </div>
  );
};

export default PromptBar;
