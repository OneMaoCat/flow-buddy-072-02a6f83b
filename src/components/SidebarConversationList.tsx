import { Check, Circle, Loader2, MessageSquare, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/data/conversations";

interface SidebarConversationListProps {
  conversations: Conversation[];
  deployedIds: Set<string>;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

const getConversationStatus = (conv: Conversation, deployedIds: Set<string>) => {
  if (conv.devInProgress) return "progress" as const;
  const hasTasks = conv.tasks.length > 0;
  if (!hasTasks) return null;
  if (conv.tasks.some((t) => !deployedIds.has(t.id))) return "pending" as const;
  return "deployed" as const;
};

const StatusIndicator = ({ status }: { status: "progress" | "pending" | "deployed" | null }) => {
  if (!status) return null;
  if (status === "progress") return <Loader2 size={12} className="animate-spin text-primary shrink-0" />;
  if (status === "pending") return <Circle size={8} className="text-orange-500 fill-orange-500 shrink-0" />;
  return <Check size={12} className="text-emerald-500 shrink-0" />;
};

const SidebarConversationList = ({
  conversations,
  deployedIds,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: SidebarConversationListProps) => {
  return (
    <div className="flex flex-col gap-0.5">

      {conversations.map((conv) => {
        const status = getConversationStatus(conv, deployedIds);
        const isActive = activeConversationId === conv.id;

        return (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left",
              isActive
                ? "bg-secondary text-foreground font-medium"
                : "text-sidebar-foreground hover:bg-secondary/50"
            )}
          >
            <MessageSquare size={12} className="shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">{conv.title}</span>
            <StatusIndicator status={status} />
          </button>
        );
      })}
    </div>
  );
};

export default SidebarConversationList;
