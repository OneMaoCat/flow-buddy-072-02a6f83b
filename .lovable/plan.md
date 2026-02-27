

## Plan: 侧边栏重构 — DeepFlow AI 入口替代对话历史

将侧边栏中的「对话历史」列表移除，替换为一个「DeepFlow AI」导航入口。点击后在主区域展示两栏内容：左栏为所有对话历史列表，右栏为新对话界面（中间输入框 + 底部引导 CTA）。

### 实现步骤

**1. 修改 `src/pages/ProjectWorkspace.tsx` 侧边栏**
- 移除侧边栏中的「对话历史」区块（lines 99-110）
- 在「预览产品」按钮下方添加「DeepFlow AI」导航按钮（带 AI 图标）
- 点击后切换主区域内容为 DeepFlow AI 视图（两栏布局）

**2. 新建 `src/components/DeepFlowPanel.tsx`**
- 两栏布局组件：
  - **左栏**：对话历史列表（搜索框 + 分组对话列表，复用现有 conversations 数据）
  - **右栏**：新对话界面 — 顶部 DF logo + 欢迎文案，中间输入框（复用 PromptBar），底部引导 CTA 按钮组（修 Bug、创建 API、开发新功能、搭建页面等，复用 QuickActions 风格）
- 点击对话历史条目可切回对话视图
- 点击 CTA 按钮自动填充输入框内容

**3. 更新 `src/pages/ProjectWorkspace.tsx` 主区域逻辑**
- 新增状态 `showDeepFlowPanel` 控制主区域显示
- 当 `showDeepFlowPanel=true` 时显示 DeepFlowPanel 替代 ChatArea
- 从 DeepFlowPanel 提交需求后自动切回 ChatArea 并激活 PlanFlow

### 技术细节
- DeepFlowPanel 两栏使用 flex 布局，左栏固定宽度 280px，右栏自适应
- CTA 按钮复用 QuickActions 的 chip 样式
- 移动端两栏改为单栏 Tab 切换

