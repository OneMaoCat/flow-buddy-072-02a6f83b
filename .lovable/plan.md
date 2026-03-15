

# 优化阻塞任务交互 — 分类型阻塞 + 交互式解除

## 现状

当前阻塞任务只有一个简单的 `blockReason` 字符串和一个"解除阻塞"按钮，用户无法了解阻塞类型，也没有针对性的解除方式。

## 改动方案

### 1. 扩展数据模型（`devExecutionMock.ts`）

新增 `BlockType` 和 `BlockInfo` 类型：

```ts
type BlockType = "clarify" | "design" | "dependency" | "conflict" | "permission" | "test_failure";

interface BlockOption { label: string; description?: string; }

interface BlockInfo {
  type: BlockType;
  reason: string;
  question?: string;           // AI 提出的具体问题
  options?: BlockOption[];      // 选择题选项（clarify / design）
  conflictFiles?: string[];    // 冲突文件列表（conflict）
  missingItems?: string[];     // 缺失项（dependency）
  failedTests?: string[];      // 失败测试（test_failure）
  permissionAction?: string;   // 需确认的操作（permission）
}
```

替换原有的 `blockReason?: string` 为 `blockInfo?: BlockInfo`，为每种阻塞类型生成对应的 mock 数据。

### 2. 新建 `BlockResolver` 组件（`src/components/BlockResolver.tsx`）

根据 `blockInfo.type` 渲染不同的交互式解除 UI：

| 类型 | 图标 | 交互方式 |
|------|------|----------|
| `clarify` 需求歧义 | MessageSquare | AI 提问 + 选项按钮，选中后解除 |
| `design` 设计决策 | Palette | 方案卡片（2-3个），带描述，选择后解除 |
| `dependency` 外部依赖 | Package | 缺失项清单 + 勾选确认 / 文本输入 |
| `conflict` 代码冲突 | GitMerge | 冲突文件列表，每个文件可选「保留我的/采用AI的」|
| `permission` 权限确认 | Shield | 操作描述 + 确认/拒绝按钮 |
| `test_failure` 测试失败 | XCircle | 失败测试列表 + 选「忽略/手动修复/让AI重试」 |

每种类型的 UI 卡片：
- 顶部：类型标签 + 图标 + 阻塞原因
- 中部：交互区域（选项/清单/确认框）
- 底部：确认解除按钮（仅在用户完成交互后可点击）

### 3. 集成到 DetailPanel（`DevExecution.tsx`）

- 替换底部简单的阻塞 action bar 为 `BlockResolver` 组件
- `handleUnblock` 回调增加 `resolution` 参数（记录用户的选择）
- ActionRequiredBar 中阻塞项显示阻塞类型标签
- 看板卡片的阻塞原因区域显示类型图标

### 4. 涉及文件

| 文件 | 改动 |
|------|------|
| `src/data/devExecutionMock.ts` | 新增 BlockType/BlockInfo 类型，替换 blockReason，生成分类 mock 数据 |
| `src/components/BlockResolver.tsx` | **新建** — 6 种阻塞类型的交互式解除组件 |
| `src/pages/DevExecution.tsx` | 集成 BlockResolver，更新阻塞展示和解除逻辑 |

