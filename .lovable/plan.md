

# 开发完成自动打开右侧详情面板

## 现状

当任务开发完成时（`setTimeout` 回调），系统只是将任务卡片添加到对话中并发送通知，但不会自动打开右侧详情面板。用户需要手动点击任务卡片才能查看结果。

## 改动方案

在 `src/pages/ProjectWorkspace.tsx` 中，两处任务完成的回调（`handleSubmit` 和 `handleDevSubmitted`）里，任务创建后自动执行：

1. `setSelectedCardId(result.id)` — 选中新完成的卡片
2. `setRightPanelOpen(true)` — 打开右侧面板
3. `setEditingDoc(null)` — 关闭可能打开的文档编辑器
4. `setDetailReadOnly(false)` — 确保可操作

涉及修改约 4 行代码，分别加在 `handleSubmit` 的 `setTimeout` 回调（约 L137）和 `handleDevSubmitted` 的 `setTimeout` 回调（约 L248）中 `notifyDevComplete` 之后。

### 涉及文件

| 文件 | 改动 |
|------|------|
| `src/pages/ProjectWorkspace.tsx` | 两处任务完成回调中增加自动选中+展开逻辑 |

