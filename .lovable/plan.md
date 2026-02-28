

## 让部分需求直接测试通过进入待验收状态

### 问题
当前所有需求都从 `waiting/running` 开始，需要等较长时间才能看到需求进入 `review` 状态并预览结果。

### 方案
在 `createInitialRequirements()` 中，让前 2-3 个需求直接初始化为 `review` 状态（所有 Agent 已完成、测试已全部通过），这样页面加载后立即有待验收需求可以展开预览。

### 实现步骤

**1. 修改 `createInitialRequirements()`** (`src/data/devExecutionMock.ts`)
- 将前 3 个需求的状态设为 `"review"`
- 其所有 Agent 设为 `status: "done"`, `progress: 100`
- 为其生成已全部通过的 `testResult`（所有 TestItem 状态为 `"passed"`，附带随机 duration）

**2. 调整初始并发起始位置**
- 当前前 8 个需求设为 `running`，改为从第 4 个开始（跳过已完成的 3 个）
- 保持 8 个并发槽位不变

