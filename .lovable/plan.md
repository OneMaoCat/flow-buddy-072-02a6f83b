

# 开发执行中心改版 — 从"任务看板"升级为"AI 研发执行中枢"

这份反馈非常系统，核心判断准确：当前设计更像传统 Jira/Trello，还不是 AI 驱动的执行中枢。以下是按优先级排列的改版计划。

---

## 改版一：需求包 + 子任务两层结构（解决问题 6 + 1）

**现状**：37 个任务平铺，用户迷失在碎片化卡片里。

**改法**：
- 数据层新增 `RequirementGroup` 概念，按 `categories` 前缀（用户模块、支付模块等）自动归组
- 每个 Group 包含：原始需求描述、AI 拆解理由、子任务列表
- 看板视图：一级展示需求包卡片（折叠态显示子任务进度摘要），点击展开子任务
- 卡片上显示「来源对话」链接 + AI 理解摘要，打通聊天区上下文

**涉及文件**：
- `src/data/devExecutionMock.ts` — 新增 `RequirementGroup` 类型，mock 数据按模块分组，每组增加 `sourceDescription`（原始需求）和 `aiSummary`（AI 理解摘要）
- `src/pages/DevExecution.tsx` — KanbanView 改为两层：需求包列表 → 展开子任务

---

## 改版二：「需你处理」专区（解决问题 5 + 建议 2）

**现状**：所有任务等权展示，用户不知道哪里需要介入。

**改法**：
- 顶部新增醒目的「需你处理」横条/区域，默认折叠但有红点计数
- 聚合所有需要人工决策的事项：待验收、测试失败待确认、需求待澄清、AI 阻塞
- 每项显示：任务标题 + 阻塞原因 + 操作按钮（通过/打回/确认）
- 优先级排序：阻塞 > 待验收 > 待确认

**涉及文件**：
- `src/pages/DevExecution.tsx` — 新增 `ActionRequiredBar` 组件，渲染在看板/表格上方
- `src/data/devExecutionMock.ts` — 部分需求增加 `blockReason` 字段模拟阻塞场景

---

## 改版三：卡片信息增强 — 从"状态卡"变"决策卡"（解决问题 3 + 4）

**现状**：卡片只有标题 + 进度条 + 提交人。

**改法**：

看板卡片增加：
- **二级状态标签**：如「编码中」「单元测试」「等待确认」（解决问题 2）
- **风险标签**：高/中/低，基于测试通过率和重试次数自动计算
- **测试摘要**：`12/15 passed` 直接显示在卡片上
- **预览缩略图/链接**：待验收卡片直接露出「预览」按钮
- **任务类型图标**：前端/后端/数据库/API，基于 agents 的 icon 推断

待验收卡片特别强化：
- 变更摘要（N 个文件，+X/-Y 行）
- 测试通过率 badge
- 预览 + 通过/打回按钮直接在卡片上，无需点进详情

**涉及文件**：
- `src/data/devExecutionMock.ts` — Requirement 增加 `subStatus`、`riskLevel`、`taskType` 字段
- `src/pages/DevExecution.tsx` — KanbanView 卡片重新设计，TableView 增加风险/类型列

---

## 改版四：AI 执行透明度（解决问题 2 + 建议 5）

**现状**：只有「执行中」，不知道 AI 在做什么。

**改法**：
- 新增 `subStatus` 字段，运行中的任务实时显示当前阶段：需求解析 → 方案生成 → 编码中 → 修复中
- 卡片上用小文字显示当前阶段，如 `编码中 · LoginForm.tsx`
- 详情面板的时间线增加阶段分隔线，更清晰地展示 AI 工作流程

**涉及文件**：
- `src/data/devExecutionMock.ts` — 模拟逻辑中根据 agent 进度自动设置 subStatus
- `src/pages/DevExecution.tsx` — 卡片和详情面板展示 subStatus

---

## 改版五：详情面板增加「需求来源链路」Tab（解决问题 1）

**现状**：详情面板只有开发过程/预览/测试。

**改法**：
- 新增「需求上下文」Tab，展示：
  - 用户原话（来源对话摘要）
  - AI 理解摘要
  - AI 拆解依据（为什么拆成这些子任务）
  - 所属需求包
- 建立用户对 AI 执行结果的信任链路

**涉及文件**：
- `src/pages/DevExecution.tsx` — DetailPanel 新增 TabsTrigger + TabsContent
- `src/data/devExecutionMock.ts` — Requirement/RequirementGroup 增加 `sourceContext` 字段

---

## 技术要点

- 所有改动集中在 `DevExecution.tsx` 和 `devExecutionMock.ts` 两个文件
- 不影响 ProjectWorkspace 聊天区已有的验收流程
- Mock 数据结构向后兼容，新增字段均为可选
- 分步实施：先做改版一（两层结构）和改版二（需你处理），再做三四五

