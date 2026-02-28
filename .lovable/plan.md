

## Plan: 开发完成后返回工作区通知用户确认效果

当所有需求开发完成后，DevExecution 页面展示完成状态，并引导用户返回工作区确认效果和发布。

### 实现步骤

**1. 修改 `src/pages/DevExecution.tsx`**
- 检测所有需求 `status === "done"` 时，停止模拟 interval
- 在需求列表上方展示「开发完成」横幅卡片：
  - 显示完成统计（需求数、Agent 数、总耗时）
  - 提供「返回工作区确认效果」主按钮，点击后 navigate 回 `/project/:id`
  - 附带提示文案："所有需求已开发完成，请预览确认效果后发布到线上"
- 完成横幅使用绿色主题 + CheckCircle2 图标 + 从底部滑入动画

**2. 修改 `src/pages/ProjectWorkspace.tsx`**
- 新增 URL 参数检测 `?devComplete=true`
- 当检测到该参数时，在聊天区展示一条 AI 消息气泡："所有需求已开发完成！请在右侧预览面板确认效果，确认无误后即可发布到线上。"
- 自动打开右侧面板并切换到预览 tab
- 自动将 `testsPassed` 设为 true（模拟测试已在开发阶段通过）

**3. 流程串联**
- DevExecution 完成横幅的按钮 navigate 到 `/project/:id?devComplete=true`
- 工作区收到参数后展示通知，用户确认预览 → 点击「确认预览效果」→ 发布按钮全部 check 通过 → 可发布

