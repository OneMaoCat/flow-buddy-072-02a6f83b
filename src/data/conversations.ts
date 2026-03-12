import type { DevCompleteResult } from "@/components/DevCompleteCard";
import { buildMockDevResult } from "@/components/DevCompleteCard";

export interface ChatMessage {
  id: string;
  text: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  messages: ChatMessage[];
  tasks: DevCompleteResult[];
  devInProgress: boolean;
  currentRequirement: string;
}

export const createConversation = (requirement: string): Conversation => ({
  id: crypto.randomUUID(),
  title: requirement.slice(0, 20) || "新对话",
  createdAt: new Date(),
  messages: [{ id: crypto.randomUUID(), text: requirement, timestamp: Date.now() }],
  tasks: [],
  devInProgress: false,
  currentRequirement: requirement,
});

export const addMessageToConversation = (
  conversations: Conversation[],
  conversationId: string,
  text: string
): Conversation[] =>
  conversations.map((c) =>
    c.id === conversationId
      ? { ...c, messages: [...c.messages, { id: crypto.randomUUID(), text, timestamp: Date.now() }], currentRequirement: text }
      : c
  );

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

/* ── Mock data ── */
const mockProjectId = "proj-1";

export const buildMockConversations = (): { conversations: Conversation[]; deployedIds: Set<string> } => {
  const task1 = buildMockDevResult("task-1", "表单校验逻辑重构", mockProjectId);
  const task2 = buildMockDevResult("task-2", "支付接口对接", mockProjectId);
  const task3 = buildMockDevResult("task-3", "订单状态流转", mockProjectId);

  const conversations: Conversation[] = [
    {
      id: "conv-1",
      title: "修复登录表单验证 Bug",
      createdAt: new Date(Date.now() - 600_000),
      tasks: [task1],
      devInProgress: true,
      currentRequirement: "修复登录表单验证 Bug，增加邮箱和密码格式校验",
    },
    {
      id: "conv-2",
      title: "支付流程重构",
      createdAt: new Date(Date.now() - 7200_000),
      tasks: [task2, task3],
      devInProgress: false,
      currentRequirement: "重构订单模块支付流程，支持微信和支付宝",
    },
    {
      id: "conv-3",
      title: "权限模块优化",
      createdAt: new Date(Date.now() - 86400_000),
      tasks: [],
      devInProgress: false,
      currentRequirement: "优化用户权限管理模块，支持角色分配",
    },
  ];

  const deployedIds = new Set(["task-3"]);

  return { conversations, deployedIds };
};
