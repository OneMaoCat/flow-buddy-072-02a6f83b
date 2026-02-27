

## Plan: 侧边栏添加「预览产品」入口，点击新开页面

在侧边栏对话历史上方添加一个导航按钮「预览产品」，点击后使用 `window.open` 在新浏览器标签页中打开一个独立的全屏预览页面。

### 实现步骤

**1. 创建独立预览页面 `src/pages/ProjectPreview.tsx`**
- 路由：`/project/:id/preview`
- 全屏布局，顶部工具栏包含：项目名称、设备切换按钮（桌面/平板/手机）、刷新按钮、返回按钮
- 主体区域复用 `PreviewPanel` 的设备切换逻辑，但以全屏模式展示预览占位 UI
- 无侧边栏，纯预览体验

**2. 更新路由 `src/App.tsx`**
- 新增路由 `/project/:id/preview` → `ProjectPreview`

**3. 更新侧边栏 `src/pages/ProjectWorkspace.tsx`**
- 在「对话历史」上方添加一个「预览产品」按钮（带 ExternalLink 图标）
- 点击调用 `window.open(`/project/${id}/preview`, '_blank')` 在新标签页打开

