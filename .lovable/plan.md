

## Plan: 添加项目空间概念与完整开发流程

在现有的 AI 对话界面基础上，增加"项目"概念，每个项目对应一个产品的完整代码空间。用户可以在项目内进行需求开发，系统自动生成测试用例、自检、展示预览，最终由人确认发布。

### 整体架构

```text
首页(项目列表)
  └── /project/:id (项目工作区)
        ├── 侧边栏：项目信息 + 成员 + 对话历史
        ├── 主区域：AI 对话 + Plan 流程（复用现有）
        ├── 右侧面板：预览 / 测试结果 / 发布状态
        └── 底部：输入框（复用 PromptBar）
```

### 实现步骤

**1. 创建项目数据模型与 Mock 数据 (`src/data/projects.ts`)**
- 定义 `Project` 类型：id、name、description、members、status、createdAt、techStack
- 定义 `ProjectMember` 类型：id、name、avatar、role（owner/editor/viewer）
- 定义 `TestCase` 类型：id、name、status（pending/running/passed/failed）、duration
- Mock 2-3 个示例项目数据

**2. 创建项目列表页 (`src/pages/Projects.tsx`)**
- 卡片网格展示所有项目（名称、描述、成员头像组、状态标签、技术栈标签）
- 顶部搜索栏 + "新建项目"按钮
- 点击项目卡片进入项目工作区

**3. 创建项目工作区页面 (`src/pages/ProjectWorkspace.tsx`)**
- 复用现有侧边栏（调整为项目上下文：项目名、成员列表、对话历史）
- 主区域复用现有 PlanFlow 对话流程
- 右侧可展开面板：预览窗口 + 测试结果面板 + 发布按钮

**4. 创建成员邀请组件 (`src/components/MemberInvite.tsx`)**
- Dialog 弹窗：输入邮箱 + 选择角色（owner/editor/viewer）
- 当前成员列表展示（头像 + 名称 + 角色 + 移除按钮）

**5. 创建测试结果面板 (`src/components/TestPanel.tsx`)**
- 自动生成的测试用例列表（用例名 + 状态图标：通过/失败/运行中）
- 整体通过率进度条
- 失败用例自动重试按钮 + "重新生成并修复"按钮
- Mock 数据模拟测试运行过程（逐条从 pending → running → passed/failed）

**6. 创建预览面板 (`src/components/PreviewPanel.tsx`)**
- 模拟 iframe 预览区域（显示占位 UI）
- 设备切换按钮（桌面/平板/手机）
- 刷新按钮

**7. 创建发布确认组件 (`src/components/PublishDialog.tsx`)**
- 发布前检查清单（测试通过率、代码审查状态、预览确认）
- 所有检查通过后才能点击"发布到线上"
- 发布中 → 发布成功状态展示

**8. 更新路由 (`src/App.tsx`)**
- `/` → 项目列表页
- `/project/:id` → 项目工作区

**9. 更新侧边栏 (`src/components/DeepFlowSidebar.tsx`)**
- 在项目工作区中，顶部显示项目名称 + 返回按钮
- 成员区域显示项目成员头像组 + 邀请按钮
- 对话列表改为项目内的对话历史

### 开发流程交互

```text
[用户在项目内发需求] → [Plan 流程(复用)] → [确认Plan]
  → [AI 开发中...] → [自动生成测试用例]
  → [逐条运行测试(动画)] → [失败则自动修复重试]
  → [全部通过 → 展示预览] → [用户确认 → 发布Dialog]
  → [发布到线上]
```

### 技术细节

- 所有数据为前端 Mock，不接入后端
- 测试运行用 `setTimeout` 模拟逐条执行动画
- 预览面板为静态占位 UI
- 项目工作区使用 `react-resizable-panels`（已安装）实现左中右三栏布局
- 复用现有 Card/Button/Dialog/Progress 组件

