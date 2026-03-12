
# Fix: Reduce top whitespace on Dev Execution Center

## Problem
The page has a nearly empty top header bar (h-12 from ProjectSidebarLayout) followed by the filter/search toolbar, creating unnecessary vertical whitespace.

## Solution
Move the filter tabs and search/view-toggle controls into the `headerRight` area of `ProjectSidebarLayout`'s top bar, and remove the separate stats bar below it. This consolidates the two rows into one.

### Changes

**`src/pages/DevExecution.tsx`**:
1. Move the filter tabs (`全部`, `执行中`, `测试中`, etc.) into the `headerRight` prop of `ProjectSidebarLayout`, along with the search input and view toggle buttons.
2. Move the progress stats (e.g. `0/37 通过 · 8 进行中 9%`) to the right side of the same header row.
3. Remove the standalone stats bar (`<div className="shrink-0 px-4 pt-3 pb-2 ...">`) from the main content area, so the kanban/table content starts immediately below the header.

This merges the two top rows into a single compact header, reclaiming ~40px of vertical space.
