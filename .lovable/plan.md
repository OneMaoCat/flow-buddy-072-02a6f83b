# 需求平台 + 异步开发 + 消息卡片验收

## 已完成

### 1. DevCompleteCard — 聊天区验收卡片 ✅
- 代码变更 Tab（文件列表 + diff 视图）
- 产品预览 Tab（复用 RequirementPreview）
- 自测报告 Tab（测试用例列表 + 通过率）
- 操作栏（发起 Code Review / 打回修改）

### 2. PlanFlow 改造 ✅
- 确认需求后不再跳转 /dev 页面
- 触发 onDevSubmitted 回调启动异步模拟

### 3. ProjectWorkspace 状态管理 ✅
- devCards 数组管理已完成的开发结果
- 异步模拟 3-7s 后推送 DevCompleteCard 到聊天区
- 发布/打回操作 + toast 反馈

### 4. DevNotification 浏览器通知 ✅
- Notification API 权限请求
- 后台标签页系统通知 + sonner toast

### 5. 侧边栏任务追踪列表 ✅
- SidebarTaskList 组件：按状态分组（开发中/待审查/审查中/已发布）
- ProjectSidebarLayout 增加 taskList/taskCount props，Collapsible 区域
- ProjectWorkspace 连接数据，点击任务项定位卡片+打开详情面板
- 聊天区卡片增加 data-card-id，支持 scrollIntoView 定位

### 6. 两层结合 — 开发过程展示增强 ✅
- DevInProgressCard 6 步里程碑（拉取分支→分析需求→制定方案→编写代码→修改代码→运行测试）
- 每步带具体 detail 信息（分支名、文件名等）
- 进行中/完成后均可点击「查看详情」打开右侧面板

### 7. Code Review 审查流程 ✅
- 开发完成后主按钮改为「发起 Code Review」
- 审查 Tab：审查人列表（通过/待审状态）、邀请审查人、评论区
- 状态流转：开发完成 → 审查中 → 审查通过 → 发布到测试环境
- 操作栏按状态切换（未审查/审查中/审查通过/已发布）
- SidebarTaskList 增加「审查中」分组

### 8. 开发执行中心改版 — AI 研发执行中枢 ✅
- **改版一**：需求包 + 子任务两层结构（RequirementGroup 按模块分组，表格视图可折叠展开）
- **改版二**：「需你处理」专区（ActionRequiredBar 顶部横条，聚合阻塞 + 待验收，红点提示）
- **改版三**：决策卡片增强（二级状态标签、风险等级、测试摘要、类型图标、变更摘要、快捷操作按钮）
- **改版四**：AI 执行透明度（subStatus 实时显示当前阶段如「编码中 · LoginForm.tsx」）
- **改版五**：详情面板「需求上下文」Tab（用户原话、AI 理解摘要、AI 拆解依据、所属需求包）
- 新增 blocked 状态 + blockReason 阻塞管理
- 看板新增阻塞列，卡片内嵌快捷通过/解除阻塞按钮
