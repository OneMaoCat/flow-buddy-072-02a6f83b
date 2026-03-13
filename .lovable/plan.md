

# 消息中心改为独立 Tab 页面

## 问题

当前消息中心作为侧边栏的 Collapsible 折叠区域，空间有限，体验不佳。应该改为侧边栏中的一个导航入口，点击后在主内容区以完整列表/视图形式展示通知。

## 方案

### 1. 侧边栏：消息中心变为导航项

在侧边栏 nav 区域增加「消息中心」导航按钮（Bell 图标 + 未读 badge），与「DeepFlow AI」「开发执行中心」同级。移除当前 Collapsible 通知区域。

### 2. 新建 NotificationCenter 页面组件

点击后主内容区切换为通知列表视图，包含：
- 顶部筛选栏：全部 / 未读 / 按类型筛选（开发完成、审查邀请、审查通过等）
- 通知列表：卡片式布局，每条通知显示图标、标题、描述、时间、已读状态
- 批量操作：全部标为已读
- 点击单条通知 → 跳转到对应对话并定位任务卡片（复用现有逻辑）

### 3. 涉及文件

- **新建 `src/components/NotificationCenter.tsx`** — 完整通知列表页面
- **修改 `src/components/ProjectSidebarLayout.tsx`** — 移除 Collapsible 通知区，navItems 中添加消息中心入口
- **修改 `src/pages/ProjectWorkspace.tsx`** — 增加 `showNotificationCenter` 状态，点击时主区域展示 NotificationCenter；点击通知后切回对话视图

