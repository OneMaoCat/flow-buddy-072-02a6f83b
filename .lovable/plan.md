

# 验收报告：AI 驱动的问题 Q&A 决策面板

## 问题

当前有问题时（critical findings、测试失败、warnings），只有一个笼统的"打回修改"按钮。用户不知道 AI 打算怎么修、修哪些，也无法对每个问题单独做决策。这不符合"AI 驱动、人最小力气介入"的原则。

## 方案

当验收报告中存在问题（critical/warning findings、测试失败）时，在底部操作区替换为 **AI 生成的问题决策面板**——把所有问题提炼为结构化 Q&A，每个问题给出 2-3 个选项，用户只需点选即可。

### 交互流程

```text
┌─────────────────────────────────────────┐
│  🚨 AI 验收结论：发现 2 个需要您决策的问题  │
├─────────────────────────────────────────┤
│                                         │
│  问题 1/2  [严重]                        │
│  "LoginForm 第 42 行残留 console.log"     │
│  AI 建议：移除该调试语句                   │
│                                         │
│  ○ 同意 AI 修复（自动移除）     ← 推荐     │
│  ○ 保留不修改（标记为已知）                │
│  ○ 我来手动处理                          │
│                                         │
│  问题 2/2  [警告]                        │
│  "密码强度阈值偏低，仅要求 8 位"           │
│  AI 建议：增加特殊字符可选支持             │
│                                         │
│  ○ 同意 AI 修复                  ← 推荐   │
│  ○ 暂不处理，后续迭代                     │
│  ○ 我来手动处理                          │
│                                         │
├─────────────────────────────────────────┤
│  [确认并让 AI 执行修复]  (2/2 已选择)      │
└─────────────────────────────────────────┘
```

用户点选完所有问题后，一键确认，AI 根据选择自动修复 / 跳过。

### 改动细节

#### 1. 新增类型 `AcceptanceIssue`（在 DevCompleteCard.tsx 中）

```ts
interface AcceptanceIssue {
  id: string;
  severity: "critical" | "warning" | "test_fail";
  title: string;
  description: string;
  filePath?: string;
  lineRange?: string;
  aiSuggestion: string;  // AI 建议的修复方案
  options: { label: string; value: string; recommended?: boolean }[];
}
```

#### 2. 新增组件 `AcceptanceQA`（在 DevCompleteDetailPanel.tsx 内部）

- 从 `allFindings`（critical + warning）和失败测试中自动构建 `AcceptanceIssue[]`
- 每个问题渲染为卡片，含：severity badge、标题、AI 建议、radio 选项组
- 底部显示进度（如 "1/3 已选择"），全部选完后启用确认按钮
- 确认按钮文字根据选择动态变化："让 AI 修复 2 项并发布" / "跳过所有问题并发布"

#### 3. 修改验收报告底部操作区

- **无问题时**：保持现有的"确认发布"按钮
- **有问题时**：替换为 `AcceptanceQA` 组件，不再显示独立的"打回修改"按钮
- verdict banner 中的快捷按钮也同步更新为"查看下方问题决策"锚点跳转

#### 4. onReject 回调扩展

`onReject` 改为接收决策结果 `(id: string, decisions?: Record<string, string>)`，让上层知道每个问题的用户决策。

### 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/DevCompleteDetailPanel.tsx` | 新增 AcceptanceQA 组件，重写底部操作区逻辑 |
| `src/components/DevCompleteCard.tsx` | 新增 AcceptanceIssue 类型导出 |
| `src/pages/ProjectWorkspace.tsx` | onReject 回调签名适配 |

