

# 消息中心视觉优化

## 当前问题

1. **彩色元素违反灰度设计** — 橙色筛选标签、橙色/绿色操作按钮、彩色图标背景、橙色左侧指示条，与项目整体灰度风格严重不一致
2. **卡片布局松散** — 每条通知内边距过大（py-4），信息密度低，大量空白
3. **emoji 图标圆形背景色杂乱** — 不同类型通知用不同彩色背景，视觉噪音大
4. **操作按钮样式不统一** — "去审查"用橙色实心，"查看预览"用绿色实心，"查看详情"用灰色，混乱

## 方案

### 1. 全面灰度化

- 筛选标签：活跃态改为 `bg-foreground text-background`（黑底白字），非活跃态用 `bg-secondary text-muted-foreground`
- 操作按钮：统一为 `bg-secondary text-foreground hover:bg-accent`，需要处理的用 `bg-foreground text-background`（黑底白字，突出但不彩色）
- 左侧指示条：未读用 `bg-foreground/40`，需处理用 `bg-foreground`
- emoji 图标背景：统一为 `bg-secondary`

### 2. 卡片紧凑化

- 缩减内边距 `py-4` → `py-3`，`px-6` → `px-5`
- 标题和描述间距收紧
- 时间分组头部更轻量

### 3. 筛选栏优化

- 去除底部滑动指示器（pill 样式已足够表达选中态）
- 筛选栏底部边框改为更细的分隔

### 改动

| 文件 | 改动 |
|------|------|
| `src/components/NotificationCenter.tsx` | (1) `priorityColors` 全部改为灰度；(2) 筛选按钮样式统一为灰度 pill；(3) 操作按钮统一为灰度，action 类型用 foreground 实心；(4) 左侧指示条灰度化；(5) 卡片内边距收紧；(6) 移除底部滑动指示器 |

