

## Plan: Add Task Manager Popover to Chat Area

### What
Add a task management icon button above the chat input area. Clicking it opens a popover/dropdown listing all tasks in the current conversation with their statuses (in-progress, pending review, deployed). Clicking a task scrolls to it and opens the detail panel.

### How

**Modify `src/pages/ProjectWorkspace.tsx` — ChatArea component:**

1. Add a `ListTodo` icon button in the chat area header (top of the chat, sticky bar or above the prompt bar area).
2. Use a `Popover` from radix to show a task list panel when clicked.
3. The popover lists all `devCards` with status indicators (same style as sidebar task items) plus an in-progress indicator if `devInProgress` is true.
4. Clicking a task in the popover calls `onSelectCard(id)` and closes the popover.

**Layout:** Add a small toolbar row at the top of the ChatArea with the task icon + count badge. The popover contains a scrollable list of tasks with status icons matching the existing `SidebarTaskList` pattern (Loader2 for in-progress, orange circle for pending, green check for deployed).

No new files needed — all changes within `ProjectWorkspace.tsx`'s ChatArea component, reusing existing UI primitives (`Popover`, `Badge`, lucide icons).

