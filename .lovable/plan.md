

## Plan: Simplify Sidebar Conversations — Remove Task Tree, Add Status Indicator

### What
Remove the expandable task tree under each conversation in the sidebar. Keep only the conversation title as a flat list item, but add a small status indicator showing the aggregate state of that conversation's tasks (developing / pending review / all deployed).

### How

**Modify `src/components/SidebarConversationList.tsx`:**

1. **Remove** `ConversationItem` with `Collapsible` tree and `TaskItem` component entirely.
2. **Replace** with a flat button per conversation showing:
   - `MessageSquare` icon
   - Conversation title (truncated)
   - A small status badge/icon on the right side:
     - **Spinning Loader2** (pulse) — if `devInProgress` is true (developing)
     - **Orange dot** — if there are tasks not yet deployed (pending review)
     - **Green check** — if all tasks are deployed
     - No indicator if conversation has no tasks
3. Remove unused imports (`Collapsible`, `CollapsibleContent`, `CollapsibleTrigger`, `ChevronRight`).
4. Remove `onSelectCard` and `selectedCardId` from props (no longer needed here).

**Modify `src/pages/ProjectWorkspace.tsx`:**
- Remove `selectedCardId` and `onSelectCard` props passed to `SidebarConversationList`.

### Status priority logic
```
if (conv.devInProgress) → "开发中" (spinner)
else if (conv.tasks.some(t => !deployedIds.has(t.id))) → "待验收" (orange)
else if (conv.tasks.length > 0 && all deployed) → "已完成" (green)
else → no indicator
```

