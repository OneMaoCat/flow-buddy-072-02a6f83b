import type { DevCompleteResult } from "@/components/DevCompleteCard";

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  tasks: DevCompleteResult[];
  devInProgress: boolean;
  currentRequirement: string;
}

export const createConversation = (requirement: string): Conversation => ({
  id: crypto.randomUUID(),
  title: requirement.slice(0, 20) || "新对话",
  createdAt: new Date(),
  tasks: [],
  devInProgress: false,
  currentRequirement: requirement,
});

export const addTaskToConversation = (
  conversations: Conversation[],
  conversationId: string,
  task: DevCompleteResult
): Conversation[] =>
  conversations.map((c) =>
    c.id === conversationId
      ? { ...c, tasks: [...c.tasks, task], devInProgress: false }
      : c
  );

export const setConversationDevInProgress = (
  conversations: Conversation[],
  conversationId: string,
  inProgress: boolean
): Conversation[] =>
  conversations.map((c) =>
    c.id === conversationId ? { ...c, devInProgress: inProgress } : c
  );

export const removeTaskFromConversation = (
  conversations: Conversation[],
  conversationId: string,
  taskId: string
): Conversation[] =>
  conversations.map((c) =>
    c.id === conversationId
      ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) }
      : c
  );
