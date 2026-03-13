

# 消息中心升级 — 从"通知列表"到"可操作的研发消息中枢"

用户反馈非常精准：当前消息中心能"告诉用户发生了什么"，但还不够"告诉用户该做什么"。以下按优先级分 6 步改造。

---

## 改造一：新增「需要我处理」筛选 + 动作型消息置顶

- 筛选栏新增「需要处理」Tab，筛出 `review_requested` + `review_rejected` 类型
- 数据层给 `AppNotification` 增加 `actionRequired: boolean` 字段
- 「需要处理」的消息在"全部"视图中也置顶显示，与普通消息拉开层级

## 改造二：每条消息增加动作按钮

根据消息类型，右侧显示明确的操作入口：
- `review_requested` → "去审查"
- `review_rejected` → "查看意见"
- `deployed` → "查看预览"
- `dev_complete` → "查看详情"
- `review_approved` → "查看详情"

按钮点击复用现有 `onClickNotification`，视觉上让用户知道"点了去哪"。

## 改造三：消息优先级视觉分层

三类消息用不同视觉处理：
- **动作型**（需要处理）：左侧加橙色竖条，图标背景用橙色/红色调
- **结果型**（开发完成、审查通过）：保持当前灰色调
- **发布型**（已发布）：图标背景用绿色调

未读 + 动作型双重强调，让用户一眼抓住重点。

## 改造四：补充上下文摘要

`AppNotification` 新增 `contextSummary?: string` 字段，mock 数据中为每条消息补一句话摘要：
- "AI 已完成后端接入与回调逻辑，等待你确认实现是否符合预期"
- "审查未通过，建议补充异常兜底与缓存策略说明"

显示在描述下方，用更小字号 + 浅色，降低阅读负担但提供决策上下文。

## 改造五：时间分组

消息按「今天」「昨天」「更早」分组，插入分隔标题。用 `formatTimeAgo` 中的时间差计算归属。

## 改造六：需求包聚合（折叠）

同一个 `taskId` 或 `conversationId` 的多条消息折叠为一组，默认只显示最新一条，展开可看历史。mock 数据中为 `conv-1` 和 `conv-2` 各添加更多消息以演示聚合效果。

---

## 涉及文件

| 文件 | 改动 |
|------|------|
| `src/data/notifications.ts` | 增加 `actionRequired`、`contextSummary`、`actionLabel` 字段；补充更多 mock 数据；新增时间分组工具函数 |
| `src/components/NotificationCenter.tsx` | 全面重构：筛选栏加「需要处理」、消息卡片加动作按钮 + 优先级视觉 + 上下文摘要、时间分组渲染、需求包折叠 |

不影响 `ProjectWorkspace`、`DevExecution` 等页面的现有逻辑，所有新字段均为可选。

