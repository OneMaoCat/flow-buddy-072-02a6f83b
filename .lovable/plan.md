

# 侧边栏对话 + 任务树结构重构

## 核心思路

将侧边栏从「扁平任务列表」改为「对话列表 → 对话下挂任务」的树形结构。每个对话是一次需求开发会话，对话下展示该会话产生的开发任务。

## 数据模型变更

```text
Conversation {
  id: string
  title: string          // 取自第一条需求文本
  createdAt: Date
  tasks: DevCompleteResult[]   // 该对话产生的开发任务
  devInProgress: boolean       // 是否有正在进行的开发
  currentRequirement: string   // 当前需求文本
}
```

在 `ProjectWorkspace` 中用 `conversations` 数组替代当前的 `devCards` + `planFlow` 扁平状态。每次用户提交新需求时，如果是新对话则创建 `Conversation`，开发完成的卡片挂到当前对话下。

## 侧边栏布局

```text
┌─ 项目切换器 ──────────┐
├─ DeepFlow AI          │
├─ 开发执行中心          │
├───────────────────────┤
│ 对话历史               │
│ ▼ 修复登录表单验证      │
│    ● 表单校验逻辑  开发中│
│ ▼ 支付流程重构          │
│    ◉ 支付接口对接  待验收│
│    ✓ 订单状态流转  已发布│
│ ▶ 权限模块优化（无任务） │
├───────────────────────┤
│ 设置                  │
└───────────────────────┘
```

## 改动清单

### 1. 新增对话数据模型 `src/data/conversations.ts`
- 定义 `Conversation` 类型
- 提供 `createConversation`、`addTaskToConversation` 等辅助函数

### 2. 重构 `SidebarTaskList.tsx` → `SidebarConversationList.tsx`
- 渲染对话列表，每项可展开/折叠
- 展开后显示该对话下的任务（复用现有 TaskItem 样式）
- 点击对话项切换到该对话；点击任务项定位卡片+打开详情面板
- 当前活跃对话高亮
- 支持「+ 新对话」按钮

### 3. 修改 `ProjectWorkspace.tsx`
- 引入 `conversations` 状态数组，替代扁平的 `devCards`
- `activeConversationId` 追踪当前对话
- 提交需求时创建或复用对话，开发完成后将卡片挂到对应对话
- 切换对话时，聊天区只显示该对话的内容
- 将 `SidebarConversationList` 传给 `ProjectSidebarLayout`

### 4. 修改 `ProjectSidebarLayout.tsx`
- `taskList` prop 不变（传入新的 `SidebarConversationList`）
- 区域标题从「开发任务」改为「对话历史」

### 5. 移除 DeepFlowPanel 内嵌对话列表的重复
- DeepFlowPanel 的左侧对话列表数据改为从外部传入，与侧边栏共享同一数据源
- 或者简化 DeepFlowPanel 为纯「新建对话」入口，去掉内嵌的对话历史面板

## 交互逻辑

- **新建对话**：点击侧边栏「+ 新对话」或从 DeepFlow AI 入口开始
- **切换对话**：点击侧边栏对话项，聊天区切换到该对话的消息流
- **任务归属**：每个开发任务自动归属到当前活跃对话
- **对话标题**：取第一条需求的前 20 个字符

