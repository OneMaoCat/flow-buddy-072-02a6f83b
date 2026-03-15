

# 引用条样式修复 — 仿聊天回复引用

## 问题

当前引用条用了 `rounded-t-xl bg-muted/60 border border-b-0`，看起来是一个独立的卡片浮在输入框上方，而不是消息应用中常见的"回复引用"样式。

## 目标样式

参考 Telegram / 微信 / Slack 的回复引用：一条紧贴输入框内部顶端的窄条，左侧带色条，右侧有关闭按钮，整体嵌在输入框容器内而非外部。

```text
┌──────────────────────────────────────────────┐
│ ┃ 修复登录表单验证 Bug · AI 审查中        ×  │  ← 引用条（在输入框内部）
│                                              │
│ ＋  请输入你的需求...        Plan 🎤  ⬆     │  ← 输入区
└──────────────────────────────────────────────┘
```

## 改动方案（仅 `src/pages/ProjectWorkspace.tsx`）

1. **将引用条移入输入框容器内**：从 `sticky bottom-0` 区域的独立 div 移入 PromptBar 的 border 容器内部，使其成为输入框的一部分
2. **样式改为内嵌引用**：
   - 移除外部 border、rounded-t-xl、bg-muted/60
   - 改为输入框内顶部的一条窄横条：`px-3 py-1.5`，左侧 3px 实色竖线（`border-l-[3px] border-primary`），背景透明或极浅
   - 内容一行：任务标题 + 状态标签，右端 × 关闭按钮
3. **PromptBar 组件改造**：增加 `contextSlot` prop（ReactNode），在输入框 border 容器内、input 上方渲染该插槽
4. **关闭交互**：点击 × 调用 `onSelectCard(null)` 清除选中

