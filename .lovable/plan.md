

# 测试报告优化

## 当前问题

代码测试标签页信息过于简陋：只有一条进度条 + 平铺的用例列表（图标 + 名称 + 耗时），缺乏分组、覆盖率、错误详情等关键信息，看起来像是一个半成品。

## 方案

### 1. 代码测试 — 增加摘要仪表盘 + 分组 + 失败详情

在用例列表上方增加一个紧凑的摘要区：

```text
┌─────────────────────────────────────────────┐
│  ✅ 5/5 通过  ⏱ 1.2s  📊 覆盖率 92%         │
│  ████████████████████░░ 100%                │
└─────────────────────────────────────────────┘
```

用例列表按文件路径分组（从 test name 中提取），每组显示为可折叠的文件节点。失败用例展开后显示错误信息和 AI 修复建议。

### 2. UI 测试 — 增加摘要头部

UITestReplay 本身已经不错，但在验收报告的测试报告 section 内缺少与代码测试一致的摘要行。增加一行统计头（步骤数 + 通过数 + 总耗时）保持风格统一。

### 3. 数据层补充

- `DevCompleteResult` 的 `tests` 数组中每个 test case 增加可选字段：`filePath`、`errorMessage`、`aiSuggestion`
- 新增 mock 覆盖率数据（`coveragePercent`）到 result

### 改动

| 文件 | 改动 |
|------|------|
| `src/components/DevCompleteCard.tsx` | `TestCase` 类型增加 `filePath?`、`errorMessage?`、`aiSuggestion?` 字段；`DevCompleteResult` 增加 `coveragePercent?` |
| `src/components/DevCompleteDetailPanel.tsx` | 重写代码测试 tab：(1) 摘要仪表条（通过率环 + 覆盖率 + 总耗时）；(2) 用例按 filePath 分组为可折叠文件树；(3) 失败用例展开显示 errorMessage + aiSuggestion；(4) UI 测试 tab 头部增加统计摘要行 |
| `src/data/devExecutionMock.ts` | mock 数据补充新字段（filePath、errorMessage、coveragePercent） |

