

# 侧边栏任务追踪列表

## 概述

在项目侧边栏中增加「开发任务」区域，展示当前所有异步开发任务的状态（开发中 / 待验收 / 已发布）。点击任务项可定位到聊天区对应卡片并打开右侧详情面板。

## 改动清单

### 1. 新建 `src/components/SidebarTaskList.tsx` — 任务列表组件

接收 `devCards`、`deployedIds`、`devInProgress` 等状态，渲染分组列表：

- **开发中**（devInProgress 时显示，带脉冲动画圆点）
- **待验收**（devCards 中未 deploy 的，橙色圆点）
- **已发布**（deployedIds 中的，绿色勾）

每项显示：需求标题（truncate）+ 状态标签。点击触发 `onSelectCard(id)` 回调。

### 2. 修改 `src/components/ProjectSidebarLayout.tsx` — 传入任务数据

- Props 增加 `taskList?: React.ReactNode`
- 在导航项和设置之间插入任务列表区域，带「开发任务」标题和任务计数 Badge
- 区域可折叠（Collapsible），默认展开

### 3. 修改 `src/pages/ProjectWorkspace.tsx` — 连接数据

- 将 `SidebarTaskList` 作为 `taskList` prop 传给 `ProjectSidebarLayout`
- 点击任务项时：设置 `selectedCardId`、清除 `editingDoc`、打开右侧面板
- 聊天区自动滚动到对应卡片（通过 ref + scrollIntoView）

### 4. 聊天区卡片滚动定位

- 每个 DevCompleteCard 包裹一个带 `data-card-id` 的 div
- `onSelectCard` 时用 `querySelector + scrollIntoView({ behavior: 'smooth' })` 定位

## 侧边栏布局

```text
┌─ 项目切换器 ──────────┐
├─ DeepFlow AI          │
├─ 预览产品             │
├─ 开发执行中心          │
├───────────────────────┤
│ 开发任务 (3)          │
│  ● 登录表单验证  开发中 │
│  ◉ 支付流程重构  待验收 │
│  ✓ 权限模块测试  已发布 │
├───────────────────────┤
│ 设置                  │
└───────────────────────┘
```

