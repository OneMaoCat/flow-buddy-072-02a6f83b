# 需求平台 + 异步开发 + 消息卡片验收

## 已完成

### 1. DevCompleteCard — 聊天区验收卡片 ✅
- 代码变更 Tab（文件列表 + diff 视图）
- 产品预览 Tab（复用 RequirementPreview）
- 自测报告 Tab（测试用例列表 + 通过率）
- 操作栏（发布到测试环境 / 打回修改）

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
- SidebarTaskList 组件：按状态分组（开发中/待验收/已发布）
- ProjectSidebarLayout 增加 taskList/taskCount props，Collapsible 区域
- ProjectWorkspace 连接数据，点击任务项定位卡片+打开详情面板
- 聊天区卡片增加 data-card-id，支持 scrollIntoView 定位
