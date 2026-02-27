

## Plan: Plan 模式交互流程（纯前端 Mock）

用户在 Plan 模式下发送需求后，进入一个多步骤交互流程：需求澄清问答卡片 → 生成 Plan → 用户确认 → 开始开发。全部使用 Mock 数据，不接入后端。

### 交互流程

```text
[输入需求 + Plan模式] → [显示澄清问题卡片(多选/单选)] → [用户回答] → [生成Plan卡片] → [确认/修改] → [开始开发]
```

### 实现步骤

**1. 创建 PlanFlow 组件 (`src/components/PlanFlow.tsx`)**
- 管理流程状态机：`idle` → `clarifying` → `planning` → `confirmed`
- **澄清阶段**：渲染 2-3 张问题卡片（卡片式布局，每张卡片一个问题 + 多个选项按钮），用户点击选项回答
- **Plan 阶段**：渲染 Plan 卡片，展示步骤列表（带序号和预估时间），底部有"确认开始"和"修改需求"两个按钮
- **确认阶段**：显示"开发中..."状态提示
- Mock 数据硬编码在组件内，根据不同需求关键词匹配不同问题集

**2. 修改 PromptBar (`src/components/PromptBar.tsx`)**
- 添加 `onSubmit` 回调 prop，传递 `{ text, isPlanMode }` 给父组件
- 管理输入框文本状态，发送后清空

**3. 修改 Index 页面 (`src/pages/Index.tsx`)**
- 添加 `planFlowActive` 状态，当 Plan 模式发送需求时激活
- Plan 流程激活后，隐藏欢迎区/QuickActions/RecommendationCards，显示 PlanFlow 组件
- PlanFlow 完成或取消后恢复首页

**4. 创建澄清问题卡片组件 (`src/components/ClarifyCards.tsx`)**
- 卡片样式：白色背景、圆角、轻阴影、问题标题 + 选项按钮组
- 选项按钮支持单选高亮
- 底部"下一步"按钮，所有问题回答后可点击

**5. 创建 Plan 展示卡片组件 (`src/components/PlanCard.tsx`)**
- 展示 Plan 标题、步骤列表（序号 + 描述 + 预估时间）、总预估时间
- 底部操作按钮："确认开始开发" + "返回修改"

### 技术细节

- 所有数据为前端 Mock，不接入 AI 或后端
- 使用已有的 Card 组件和 Button 组件保持设计一致性
- 动画使用 Tailwind 的 `animate-in` / `fade-in` 过渡效果
- 问题卡片水平排列（桌面端最多3列），移动端单列堆叠

