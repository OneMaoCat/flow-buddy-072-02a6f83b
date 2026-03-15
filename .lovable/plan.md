

# 测试报告拆分：代码测试 + UI 测试双 Tab

## 问题

UITestReplay 当前放在"产品预览"Section 里，和预览混在一起。逻辑上它属于测试，应该和代码测试并列展示在测试报告 Section 中。

## 方案

将 Section 5（测试报告）内部分为两个子 Tab：**代码测试** 和 **UI 测试**。UITestReplay 从 Section 6 移入 Section 5。Section 6 恢复为纯"产品预览"。

### 改动

| 文件 | 改动 |
|------|------|
| `src/components/DevCompleteDetailPanel.tsx` | Section 5 内部加 `Tabs`（代码测试 / UI 测试），代码测试 Tab 放现有用例列表，UI 测试 Tab 放 `UITestReplay`；Section 6 标题改回"产品预览"，移除 UITestReplay |

### 视觉效果

```text
  测试报告                    ✓ 10/10
  ┌─────────────────────────────┐
  │ [代码测试]  [UI 测试]        │  ← 子Tab
  ├─────────────────────────────┤
  │  ✓ 登录验证       120ms     │
  │  ✓ 表单校验       85ms      │
  │  ...                        │
  └─────────────────────────────┘
  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

  产品预览                    [展开]
  （纯预览，无测试内容）
```

单文件改动，引入已有的 `Tabs` 组件做子切换。

