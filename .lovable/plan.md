

# 待处理问题置顶到输入框上方

## 问题

AcceptanceQA 决策面板目前在右侧详情面板的报告最底部，用户需要滚动才能看到。用户希望选中某个有问题的任务时，决策面板直接显示在聊天区输入框上方，第一时间处理阻塞问题。

## 方案

当用户选中一个有待处理问题的开发任务卡片时，在 PromptBar 上方（`contextSlot` 区域或独立区块）渲染 AcceptanceQA 决策面板，替代当前的任务状态条。

### 改动

| 文件 | 改动 |
|------|------|
| `src/components/DevCompleteDetailPanel.tsx` | 导出 `AcceptanceQA` 组件和 `buildAcceptanceIssues` 函数，供外部使用；详情面板底部不再渲染 AcceptanceQA（保留"确认发布"按钮和审查中状态） |
| `src/components/DevCompleteCard.tsx` | 导出 `AcceptanceIssue` 类型（已导出，确认可用） |
| `src/pages/ProjectWorkspace.tsx` | ChatArea 底部输入框区域：当 `selectedCardId` 对应的任务有待决策问题时（hasIssues && aiReviewDone && !deployed），在 PromptBar 上方渲染 AcceptanceQA 组件，传入 onConfirm/onDeployAnyway 回调 |

### 视觉效果

```text
  ┌──────────────────────────────┐
  │  聊天消息流 ...               │
  │                              │
  ├──────────────────────────────┤
  │  🤖 2 个待决策问题            │  ← 输入框上方
  │  [问题1 选项] [问题2 选项]    │
  │  [确认并让 AI 修复]           │
  ├──────────────────────────────┤
  │  📌 任务上下文条              │
  │  [＋] [输入框] [Plan] [🎤] [↑]│
  └──────────────────────────────┘
```

### 实现要点

1. 从 `DevCompleteDetailPanel.tsx` 导出 `AcceptanceQA` 和 `buildAcceptanceIssues`
2. 在 ChatArea 中，根据 selectedCard 的数据计算 `acceptanceIssues`，判断是否有问题
3. 在 PromptBar 上方（`sticky bottom-0` 区域内、PromptBar 之前）条件渲染 AcceptanceQA
4. 详情面板底部改为仅显示简要状态提示（如"请在输入框上方完成问题决策"）

