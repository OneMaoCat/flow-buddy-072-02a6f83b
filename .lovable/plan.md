

## 计划：开发执行中心侧边栏任务点击跳转到对话区

### 问题
当前在开发执行中心点击侧边栏任务时，会在当前页面打开右侧详情面板。但更合理的交互是：点击任务名称后跳转回项目工作区（对话区），因为任务是通过 DeepFlow AI 对话发起的，用户需要回到原始对话上下文查看。

### 改动

**`src/pages/DevExecution.tsx`（第 375-385 行）**

将 `onSelectConversation` 回调改回导航到项目工作区：

```tsx
onSelectConversation={(cid) => {
  setActiveConversationId(cid);
  navigate(`/project/${id}`);
}}
```

恢复原始导航行为——点击侧边栏任务跳转回 DeepFlow AI 对话工作区，符合「DeepFlow AI 发起任务 → 开发执行中心监控进度 → 点击回到原始对话」的工作流。

