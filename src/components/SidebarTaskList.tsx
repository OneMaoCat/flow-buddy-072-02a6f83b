import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DevCompleteResult } from "@/components/DevCompleteCard";

interface SidebarTaskListProps {
  devCards: DevCompleteResult[];
  deployedIds: Set<string>;
  devInProgress: boolean;
  currentRequirement: string;
  selectedCardId: string | null;
  onSelectCard: (id: string) => void;
}

const SidebarTaskList = ({
  devCards,
  deployedIds,
  devInProgress,
  currentRequirement,
  selectedCardId,
  onSelectCard,
}: SidebarTaskListProps) => {
  const pendingCards = devCards.filter((c) => !deployedIds.has(c.id));
  const deployedCards = devCards.filter((c) => deployedIds.has(c.id));
  const hasAny = devInProgress || devCards.length > 0;

  if (!hasAny) return null;

  return (
    <div className="flex flex-col gap-0.5">
      {/* In progress */}
      {devInProgress && (
        <TaskItem
          label={currentRequirement || "新任务"}
          status="progress"
          active={false}
        />
      )}

      {/* Pending review */}
      {pendingCards.map((card) => (
        <TaskItem
          key={card.id}
          label={card.requirementTitle}
          status="pending"
          active={selectedCardId === card.id}
          onClick={() => onSelectCard(card.id)}
        />
      ))}

      {/* Deployed */}
      {deployedCards.map((card) => (
        <TaskItem
          key={card.id}
          label={card.requirementTitle}
          status="deployed"
          active={selectedCardId === card.id}
          onClick={() => onSelectCard(card.id)}
        />
      ))}
    </div>
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
  const statusConfig = {
    progress: {
      icon: <Loader2 size={12} className="animate-spin text-primary" />,
      badge: "开发中",
      badgeClass: "text-primary bg-primary/10",
    },
    pending: {
      icon: <Circle size={10} className="text-orange-500 fill-orange-500" />,
      badge: "待验收",
      badgeClass: "text-orange-600 bg-orange-500/10",
    },
    deployed: {
      icon: <Check size={12} className="text-emerald-500" />,
      badge: "已发布",
      badgeClass: "text-emerald-600 bg-emerald-500/10",
    },
  };

  const cfg = statusConfig[status];

  return (
    <button
      onClick={onClick}
      disabled={status === "progress"}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left",
        active
          ? "bg-secondary text-foreground"
          : "text-sidebar-foreground hover:bg-secondary/50",
        status === "progress" && "opacity-70 cursor-default"
      )}
    >
      <span className="shrink-0 w-4 flex items-center justify-center">{cfg.icon}</span>
      <span className="flex-1 truncate">{label}</span>
      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium", cfg.badgeClass)}>
        {cfg.badge}
      </span>
    </button>
  );
};

export default SidebarTaskList;
