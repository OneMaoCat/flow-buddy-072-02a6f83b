

# BlockResolver 增加自定义回复 + 关联对话任务

## 分析

用户提出两个需求：
1. **自定义回复**：当前 BlockResolver 只有预设选项（选择题、勾选、确认/拒绝），缺少用户自由输入补充说明的能力。用户可能需要解释为什么选某个方案、补充 AI 没问到的信息。
2. **关联对话任务**：阻塞应关联到发起该需求的聊天对话，让用户能快速跳转到上下文了解来龙去脉。

## 改动方案

### 1. BlockResolver 增加自定义回复输入（`BlockResolver.tsx`）

- 在选项区域下方、确认按钮上方，增加一个可展开的「补充说明」文本框
- 默认折叠，点击「+ 添加补充说明」展开 Textarea
- 用户输入的内容会拼接到 `buildResolution()` 的结果中
- 同时支持「跳过选项，直接自定义回复」模式：当用户在 Textarea 中输入内容时，即使未选择预设选项也可解除阻塞（`canResolve` 逻辑调整）

### 2. Requirement 增加来源对话关联（`devExecutionMock.ts`）

- `Requirement` 增加 `conversationId?: string` 字段，记录该需求来自哪个对话
- Mock 数据中为需求绑定对应的 `conv-*` ID

### 3. DetailPanel 阻塞区域显示关联对话入口（`DevExecution.tsx`）

- BlockResolver 上方或头部区域增加「查看原始对话」链接
- 点击后通过已有的 `onSelectConversation` + `navigate` 跳转到对应聊天对话

### 4. 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/BlockResolver.tsx` | 增加自定义回复 Textarea、调整 canResolve 逻辑 |
| `src/data/devExecutionMock.ts` | Requirement 增加 `conversationId`，mock 数据绑定 |
| `src/pages/DevExecution.tsx` | 传递 conversationId 到 BlockResolver，增加对话跳转入口 |

