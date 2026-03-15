

# 待验收任务增加 AI Code Review 结果页签

## 现状

已有完整的 `CodeReviewTab` 组件和 `reviewTypes.ts` 数据模型（支持多模型并行审查、评分环、严重程度分类），但未集成到开发执行中心的 DetailPanel 中。

## 改动方案

### 1. 扩展 Requirement 类型（`devExecutionMock.ts`）

- `Requirement` 增加 `reviewInfo?: ReviewInfo` 字段
- 为 `review`、`accepted`、`done` 状态的任务自动生成 mock review 数据（调用已有的 `buildMockAIReview()`）
- `running`/`testing` 状态可生成 `aiReviewStatus: "running"` 的进行中状态

### 2. DetailPanel 增加「代码审查」Tab（`DevExecution.tsx`）

在现有 Tab 栏中增加第 6 个页签：

```
开发过程 | 产品预览 | 代码变更 | 代码审查 | 测试报告 | 需求上下文
```

- 仅在 `review`、`accepted`、`done`、`testing` 状态显示
- 渲染已有的 `CodeReviewTab` 组件，传入 `req.reviewInfo`

### 3. 涉及文件

| 文件 | 改动 |
|------|------|
| `src/data/devExecutionMock.ts` | Requirement 增加 `reviewInfo`，mock 数据生成 |
| `src/pages/DevExecution.tsx` | DetailPanel 增加代码审查 Tab，引入 CodeReviewTab |

