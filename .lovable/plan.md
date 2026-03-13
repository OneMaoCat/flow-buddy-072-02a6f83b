

# 开发完成后增加 Code Review 环节

## 问题

当前流程：开发完成 → 直接「发布到测试环境」或「打回修改」。缺少 Code Review 步骤，无法让团队成员参与审查和体验。

## 方案

将流程改为：**开发完成 → 发起 Code Review → 审查通过后才能发布到测试环境**

### 状态流转

```text
开发完成 → 待审查(Code Review) → 审查通过 → 发布到测试环境
                                ↘ 打回修改 → 重新开发
```

### 具体改动

**1. DevCompleteCard 卡片操作按钮调整**
- 主按钮从「确认无误，发布到测试环境」改为「发起 Code Review」
- 点击后状态变为「审查中」，卡片显示审查状态 Badge

**2. 新增 CodeReviewPanel 组件**
- 在 DevCompleteDetailPanel 中新增「审查」Tab（放在预览和变更之间）
- 审查 Tab 内容：
  - **审查人列表**：显示被邀请的团队成员头像+姓名，每人有「通过/待审」状态
  - **邀请审查人**：从团队成员中选择（复用 mock 人员数据：吴承霖、邱翔、李泽龙、张东杰）
  - **评论区**：支持对整体或具体文件留下评论
  - **审查结论**：当所有审查人通过后，解锁「发布到测试环境」按钮

**3. 状态管理扩展（ProjectWorkspace）**
- 新增 `reviewingIds: Set<string>` 跟踪进入审查的任务
- 新增 `reviewStatus: Map<string, ReviewInfo>` 存储每个任务的审查人和评论
- `onDeploy` 按钮仅在审查通过后可用

**4. 操作栏按状态切换显示**
- **未审查**：「发起 Code Review」+「打回修改」
- **审查中**：显示审查进度（如 2/3 已通过），「发布到测试环境」按钮 disabled
- **审查通过**：「发布到测试环境」按钮可用 + 绿色「审查已通过」Badge

**5. SidebarTaskList 状态扩展**
- 新增「审查中」分组，显示在「待验收」和「已发布」之间

### 涉及文件
- `src/components/DevCompleteDetailPanel.tsx` — 增加审查 Tab 和操作栏状态
- `src/components/DevCompleteCard.tsx` — 卡片状态 Badge（审查中/已通过）
- `src/pages/ProjectWorkspace.tsx` — 审查状态管理、回调
- `src/data/conversations.ts` — 任务状态增加 `reviewing` 值

