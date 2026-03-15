

# 开发执行中心详情面板 — 增加 GitLab 风格 Code Diff 页签

## 现状分析

当前 `DetailPanel`（DevExecution.tsx）有 4 个 Tab：开发过程、产品预览、测试报告、需求上下文。缺少代码变更（Diff）查看能力。虽然 `DevCompleteDetailPanel` 有简易 Diff 展示，但样式较简陋，不具备 GitLab Code Review 的核心体验：行号、展开/折叠文件、inline 评论。

## 改动方案

### 1. 新建 `src/components/GitDiffViewer.tsx` — GitLab 风格 Diff 组件

核心功能：
- **文件列表 sidebar**：左侧显示变更文件树，点击跳转到对应文件 diff
- **Unified diff 视图**：每个文件展示为一个可折叠的 diff block，带文件头（路径 + additions/deletions 统计）
- **行号显示**：左侧旧文件行号，右侧新文件行号（双列行号，仿 GitLab）
- **行级高亮**：添加行绿色背景、删除行红色背景、上下文行无色
- **Inline 评论**：点击行号旁的 `+` 按钮弹出评论输入框，评论显示在对应行下方（mock 数据）
- **文件折叠/展开**：每个文件 block 可折叠，默认展开

### 2. 扩展 Mock 数据（`devExecutionMock.ts`）

给 `Requirement` 类型增加 `diffFiles` 字段，复用 `DevCompleteCard` 中的 `DiffFile` 类型但增加行号信息：
```ts
interface DiffLine {
  type: "add" | "del" | "ctx";
  content: string;
  oldLine?: number;
  newLine?: number;
}

interface DiffFile {
  path: string;
  additions: number;
  deletions: number;
  lines: DiffLine[];
  collapsed?: boolean;
}
```

为已完成/待验收的 Requirement 自动生成 mock diff 数据。

### 3. DetailPanel 增加「代码变更」Tab（`DevExecution.tsx`）

在现有 4 个 Tab 旁新增第 5 个：
```
开发过程 | 产品预览 | 代码变更 | 测试报告 | 需求上下文
```
- 仅在 `req.status` 为 `review`、`accepted`、`done`、`testing` 时显示该 Tab
- Tab 内渲染 `GitDiffViewer` 组件

### 4. GitDiffViewer 布局细节

```text
┌─ 文件变更概览 ────────────────────────────────┐
│  3 个文件变更  +84  -12                        │
├─ src/components/LoginForm.tsx ──── +24 -8 ── ▾ │
│  3 │  3 │   const [email, setEmail] = ...      │
│  4 │    │ - // TODO: add validation             │
│    │  4 │ + const emailRegex = /^[^\s@]+.../    │
│    │  5 │ + const isValidEmail = ...            │
│  + │    │   [点击添加评论]                       │
│    ├── 💬 李泽龙: 这里建议提取为常量 ──────────│
│  5 │  6 │                                       │
├─ src/components/FormErrorTip.tsx ── +18 -0 ─ ▾ │
│ ...                                             │
└─────────────────────────────────────────────────┘
```

- 行号列宽固定，字体 mono，背景略灰
- 添加行 `bg-emerald-500/10`，删除行 `bg-red-500/10`
- 文件头 sticky，带文件图标、路径、统计、折叠按钮
- 评论气泡：圆角卡片，头像 + 姓名 + 内容，嵌在 diff 行之间

### 5. 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/GitDiffViewer.tsx` | **新建** — GitLab 风格 diff 查看器 |
| `src/data/devExecutionMock.ts` | 扩展类型，增加 mock diff 数据生成函数 |
| `src/pages/DevExecution.tsx` | DetailPanel 增加「代码变更」Tab |

