

# 将发布按钮和右侧面板按钮移入对话区内部

用户希望把顶部 header 中的「发布」和「右侧抽屉展开/收起」按钮移到对话区内部，和当前任务上下文更紧密关联。

---

## 改造方案

### 1. 从顶部 headerRight 移除这两个按钮

当前 `headerRight` 在非 DeepFlow、非消息中心时渲染 `PublishDialog` + 面板切换按钮。改造后，对话页也不再在 headerRight 中放这两个按钮，即 `headerRight` 在对话页同样返回 `undefined`。

### 2. 在对话区底部操作栏中集成

将这两个按钮移到 `ChatArea` 组件底部输入栏（`PromptBar` 所在的 sticky 区域）的右侧：

```text
┌───────────────────────────────────────────────┐
│ [任务列表] [────── PromptBar ──────] [发布] [⊞]│
└───────────────────────────────────────────────┘
```

- **发布按钮**：放在 PromptBar 右侧，只在有已完成任务（`devCards.length > 0`）时显示，否则隐藏
- **面板切换按钮**：放在发布按钮右侧，只在有可展示内容时显示（有 devCards 或 devInProgress）

### 3. 需要向 ChatArea 传递的新 props

- `testsPassed`, `previewConfirmed` → 给 `PublishDialog`
- `rightPanelOpen`, `onToggleRightPanel` → 给面板切换按钮

### 4. headerRight 逻辑简化

- 消息中心页面：保持现有消息中心标题栏
- DeepFlow 页面：`undefined`（已有）
- 对话页面：也变为 `undefined`（不再在顶部放按钮）

---

## 涉及文件

| 文件 | 改动 |
|------|------|
| `src/pages/ProjectWorkspace.tsx` | headerRight 对话页分支改为 `undefined`；ChatArea 新增 props 并在底部栏渲染发布和面板切换按钮 |

不涉及其他文件修改，改动集中在一个文件内。

