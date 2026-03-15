

# 删除横向时间轴步骤条

## 改动

删除 overview 画布中的 **Horizontal Timeline** 区块（lines 528-561），以及相关的 `TimelineStep` 类型定义和 `statusDot` 常量、`timelineSteps` 数组。

| 文件 | 改动 |
|------|------|
| `src/components/DevCompleteDetailPanel.tsx` | 删除 `TimelineStep` 接口（~L327-333）、`statusDot` 常量（~L335-340）、`timelineSteps` 数组（~L401-408）、时间轴渲染区块（~L528-561）；清理不再使用的 icon import（`GitBranch`, `Shield`, `Eye` 如无其他引用） |

删除后，指标卡片下方直接接详情折叠区，布局更紧凑。

