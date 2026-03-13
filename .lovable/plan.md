

# 两层结合：开发过程展示增强

## 现状
- **DevInProgressCard**: 仅展示 3 个简化步骤（分析需求→制定方案→编写代码），无文件级细节
- **DevCompleteCard**: 完成后展示 5 个步骤的静态摘要，点击打开右侧详情面板

## 方案

### 第一层：卡片内展示关键里程碑（实时逐步出现）

将 `DevInProgressCard` 的步骤扩展为更贴近真实开发流程的里程碑，每个里程碑逐条动画出现，附带简要描述：

```text
✓ 拉取分支        feature/req-login-form
✓ 分析需求        理解「用户登录表单验证修复」
⟳ 编写代码        LoginForm.tsx, FormErrorTip.tsx   ← 当前步骤带 spinner
  修改代码        3 个文件变更中…
  运行测试        待执行
```

每个步骤完成后打勾，当前步骤显示 spinner。步骤之间有随机延迟模拟真实节奏。

### 第二层：Detail 按钮 → 右侧面板查看完整日志

卡片右下角或底部增加一个「查看详情 →」入口（进行中和完成后都可点击），打开右侧详情面板，展示：
- 每个步骤的具体文件级操作日志（时间戳 + agent 名 + 操作描述）
- 代码 diff、测试结果等（已有功能）

### 具体改动

**`src/components/DevCompleteCard.tsx`**:
1. `DevInProgressCard` 步骤改为 6 步：拉取分支 → 分析需求 → 制定方案 → 编写代码 → 修改代码 → 运行测试
2. 每步增加文件/分支名等具体 detail 信息
3. 进行中卡片底部增加「查看详情 →」可点击区域
4. 新增 `onViewDetail` 回调 prop

**`src/pages/ProjectWorkspace.tsx`**:
1. 进行中卡片也支持点击「查看详情」打开右侧面板
2. 面板展示当前已完成步骤的日志流

**`buildProcessSteps` 函数**:
1. 在现有 5 步前增加「拉取分支」步骤，完成后卡片也展示完整 6 步

