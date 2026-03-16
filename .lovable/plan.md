

## Plan: Sidebar Task Click Stays In-Page on Dev Execution Center

### Problem
Currently, clicking a task in the sidebar's "任务列表" while on the Dev Execution page navigates the user back to the ProjectWorkspace (`/project/:id`), causing context loss. The user should stay on the current page and see the task detail in the right panel.

### Approach
Make the sidebar task click behavior **context-aware**: on the Dev Execution page, clicking a task opens its detail panel in-place (reusing the existing `ResizablePanelGroup` + `DevCompleteDetailPanel`); on the ProjectWorkspace, it continues to scroll to the chat card as before.

### Changes

**1. `src/pages/DevExecution.tsx`**
- Change the `onSelectConversation` callback in the sidebar's `SidebarConversationList` to find the matching requirement by conversation/task title and set `selectedReqId` instead of navigating away.
- When a conversation has tasks, map the first task to a requirement ID and select it in the detail panel.

**2. `src/components/SidebarConversationList.tsx`**
- No structural changes needed — the `onSelectConversation` callback is already externally provided, so the DevExecution page just needs to supply a different handler.

### Technical Detail

In `DevExecution.tsx`, the current sidebar handler is:
```tsx
onSelectConversation={(cid) => {
  setActiveConversationId(cid);
  navigate(`/project/${id}`);
}}
```

This will change to:
```tsx
onSelectConversation={(cid) => {
  setActiveConversationId(cid);
  // Find matching requirement by conversation task data
  const conv = conversations.find(c => c.id === cid);
  if (conv && conv.tasks.length > 0) {
    const matchedReq = requirements.find(r =>
      conv.tasks.some(t => r.title.includes(t.requirementTitle) || t.requirementTitle.includes(r.title))
    );
    if (matchedReq) {
      setSelectedReqId(matchedReq.id);
      return;
    }
  }
  // Fallback: select first requirement if no match
  if (requirements.length > 0) {
    setSelectedReqId(requirements[0].id);
  }
}}
```

This ensures the user stays on the Dev Execution page with the relevant task detail panel opened on the right side, fully reusing the existing `DevCompleteDetailPanel` / `DetailPanel` infrastructure.

