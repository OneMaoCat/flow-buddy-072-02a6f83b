

# 消息中心交互优化

## 当前问题

消息中心缺乏动效和交互反馈，整体体验生硬：
- 切换筛选 tab 时列表无过渡，内容直接跳变
- 通知卡片没有点击态和悬停深度变化
- 展开/收起历史通知无动画
- 整个通知项不可点击，只有右侧按钮可操作
- 筛选 tab 切换无滑动指示器
- 无标记已读的快捷交互（如左滑标记）

## 优化方案

### 1. 通知列表入场与切换动画
- 切换筛选 tab 时，列表项带 stagger 渐入动画（opacity + translateY）
- 空状态带缩放渐入效果

### 2. 通知卡片交互增强
- 整个卡片可点击（触发 onClickNotification），不再只依赖右侧按钮
- 悬停时卡片有轻微抬起效果（shadow + scale）
- 点击时有 active 按下反馈
- 未读通知左侧蓝色竖条指示（与 action 的橙色条区分）

### 3. 展开/收起历史动画
- 用 CSS transition 实现 max-height + opacity 的平滑展开收起
- 展开箭头图标带旋转动画

### 4. 筛选 tab 优化
- 活跃 tab 带底部滑动指示条（animated underline）
- tab 切换时指示条平滑滑动

### 5. 标记已读交互
- 点击通知后自动标记该通知为已读
- 未读圆点消失时带缩小动画

### 6. 时间分组折叠
- 时间分组 header 可点击折叠/展开该组
- 带旋转箭头和 slide 动画

## 技术方案

| 文件 | 改动 |
|------|------|
| `src/components/NotificationCenter.tsx` | 重构：卡片整体可点击、hover/active 态、stagger 入场动画、历史展开动画、时间组折叠、自动标记已读 |
| `src/index.css` | 添加 keyframes（fadeSlideIn、collapse/expand） |
| `src/pages/ProjectWorkspace.tsx` | `handleNotificationClick` 中增加自动标记已读逻辑 |

所有动画使用 CSS transition + Tailwind animate 实现，不引入额外依赖。

