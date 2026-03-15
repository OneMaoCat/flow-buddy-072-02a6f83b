

# Code Review 可读性与并行感优化

## 现状问题

当前 `CodeReviewTab` 的 "running" 状态是一个垂直列表，模型依次从 pending → reviewing → done，视觉上是串行的。完成后的报告也是纵向堆叠的 Collapsible，缺乏并行审查的直觉。

## 改动方案

### 1. Running 状态：并行卡片布局

将 running 状态从垂直列表改为 **三列并排卡片**，每个模型一张卡片，各自独立显示进度：

```text
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  🧠 GPT-5   │  │  💎 Gemini  │  │  🎭 Claude  │
│             │  │             │  │             │
│  ████░░ 60% │  │  ██░░░░ 30% │  │  pending... │
│             │  │             │  │             │
│  scanning.. │  │  analyzing  │  │  waiting    │
└─────────────┘  └─────────────┘  └─────────────┘
```

- 每张卡片有独立的进度条动画（reviewing 时脉冲）
- 完成时卡片翻转/渐变显示分数
- 卡片之间视觉独立，体现"同时在审"

### 2. Done 状态：三列报告卡片

完成后保持三列布局，每个模型一张卡片，包含：
- 顶部：模型图标 + 名称 + 分数环
- 中部：一句话总结
- 底部：findings 列表（按严重程度排列，带颜色标记）
- 卡片可展开查看完整 findings

### 3. 顶部综合概览

保留综合评分环，增加统计条（横向进度条显示各严重程度占比），让数据一目了然。

### 4. 入场动画

- 三张卡片 stagger 入场（延迟 100ms）
- reviewing 时卡片边框有呼吸光效
- 完成时分数数字 count-up 动画

## 技术细节

| 文件 | 改动 |
|------|------|
| `src/components/CodeReviewTab.tsx` | 重写 running 和 done 状态的布局为三列并排卡片；增加进度动画、呼吸光效、stagger 入场 |
| `src/pages/ProjectWorkspace.tsx` | `startAIReview` 中为每个模型增加独立的进度百分比 state，体现并行推进 |
| `src/data/reviewTypes.ts` | `AIModelReviewer` 增加可选 `progress?: number` 字段 |

