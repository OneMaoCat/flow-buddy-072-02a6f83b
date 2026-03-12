import { useState } from "react";
import { Check, Circle, Loader2, MessageSquare, Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/data/conversations";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SidebarConversationListProps {
  conversations: Conversation[];
  deployedIds: Set<string>;
  activeConversationId: string | null;
  selectedCardId: string | null;
  onSelectConversation: (id: string) => void;
  onSelectCard: (id: string) => void;
  onNewConversation: () => void;
}

const SidebarConversationList = ({
  conversations,
  deployedIds,
  activeConversationId,
  selectedCardId,
  onSelectConversation,
  onSelectCard,
  onNewConversation,
}: SidebarConversationListProps) => {
  if (conversations.length === 0) {
    return (
      <div className="px-2 py-2">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-secondary/50 transition-colors"
        >
          <Plus size={12} />
          <span>新建对话</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={onNewConversation}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-secondary/50 transition-colors mb-1"
      >
        <Plus size={12} />
        <span>新建对话</span>
      </button>

      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          deployedIds={deployedIds}
          isActive={activeConversationId === conv.id}
          selectedCardId={selectedCardId}
          onSelect={() => onSelectConversation(conv.id)}
          onSelectCard={onSelectCard}
        />
      ))}
    </div>
  );
};

const ConversationItem = ({
  conversation,
  deployedIds,
  isActive,
  selectedCardId,
  onSelect,
  onSelectCard,
}: {
  conversation: Conversation;
  deployedIds: Set<string>;
  isActive: boolean;
  selectedCardId: string | null;
  onSelect: () => void;
  onSelectCard: (id: string) => void;
}) => {
  const hasTasks = conversation.tasks.length > 0 || conversation.devInProgress;

  if (!hasTasks) {
    return (
      <button
        onClick={onSelect}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left",
          isActive ? "bg-secondary text-foreground font-medium" : "text-sidebar-foreground hover:bg-secondary/50"
        )}
      >
        <MessageSquare size={12} className="shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate">{conversation.title}</span>
      </button>
    );
  }

  return (
    <Collapsible defaultOpen={isActive}>
      <CollapsibleTrigger asChild>
        <button
          onClick={onSelect}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left group",
            isActive ? "bg-secondary text-foreground font-medium" : "text-sidebar-foreground hover:bg-secondary/50"
          )}
        >
          <ChevronRight size={10} className="shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
          <span className="flex-1 truncate">{conversation.title}</span>
          {conversation.tasks.length > 0 && (
            <span className="text-[10px] text-muted-foreground shrink-0">{conversation.tasks.length}</span>
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-4 flex flex-col gap-0.5 mt-0.5">
          {conversation.devInProgress && (
            <TaskItem
              label={conversation.currentRequirement || "新任务"}
              status="progress"
              active={false}
            />
          )}
          {conversation.tasks
            .filter((t) => !deployedIds.has(t.id))
            .map((task) => (
              <TaskItem
                key={task.id}
                label={task.requirementTitle}
                status="pending"
                active={selectedCardId === task.id}
                onClick={() => onSelectCard(task.id)}
              />
            ))}
          {conversation.tasks
            .filter((t) => deployedIds.has(t.id))
            .map((task) => (
              <TaskItem
                key={task.id}
                label={task.requirementTitle}
                status="deployed"
                active={selectedCardId === task.id}
                onClick={() => onSelectCard(task.id)}
              />
            ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const TaskItem = ({
  label,
  status,
  active,
  onClick,
}: {
  label: string;
  status: "progress" | "pending" | "deployed";
  active: boolean;
  onClick?: () => void;
}) => {
  const cfg = {
    progress: {
      icon: <Loader2 size={10} className="animate-spin text-primary" />,
      badge: "开发中",
      badgeClass: "text-primary bg-primary/10",
    },
    pending: {
      icon: <Circle size={8} className="text-orange-500 fill-orange-500" />,
      badge: "待验收",
      badgeClass: "text-orange-600 bg-orange-500/10",
    },
    deployed: {
      icon: <Check size={10} className="text-emerald-500" />,
      badge: "已发布",
      badgeClass: "text-emerald-600 bg-emerald-500/10",
    },
  }[status];

  return (
    <button
      onClick={onClick}
      disabled={status === "progress"}
      className={cn(
        "w-full flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-colors text-left",
        active ? "bg-secondary text-foreground" : "text-sidebar-foreground hover:bg-secondary/50",
        status === "progress" && "opacity-70 cursor-default"
      )}
    >
      <span className="shrink-0 w-3 flex items-center justify-center">{cfg.icon}</span>
      <span className="flex-1 truncate">{label}</span>
      <span className={cn("text-[9px] px-1 py-0.5 rounded-full shrink-0 font-medium", cfg.badgeClass)}>
        {cfg.badge}
      </span>
    </button>
  );
};

export default SidebarConversationList;
