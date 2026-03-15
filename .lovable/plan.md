

## Plan: Restore Acceptance Report as Separate Tab

The previous change incorrectly merged the acceptance report content into the "dev process" tab. Need to split them back into two distinct tabs.

### Current State (wrong)
3 tabs: **预览 | 开发过程 | AI 审查** — where "开发过程" contains both dev steps AND acceptance content (verdict, deploy button, test report details)

### Target State
4 tabs: **预览 | 验收报告 | 开发过程 | AI 审查**

- **预览**: Keep as-is (preview + bottom metrics bar)
- **验收报告**: Restore the canvas-style dashboard — verdict banner, 2x2 metrics cards (score ring, test pass rate, code changes, elapsed time), timeline, and collapsible detail sections (task context, code changes, AI review findings, test report, product preview). This was the original "overview" tab content before my changes.
- **开发过程**: Pure 7-step development narrative (branch → analyze → plan → code → iterate → test → review) — remove the deploy button and acceptance QA from this tab, keep it purely informational about what the AI did
- **AI 审查**: Keep as-is (CodeReviewTab)

### Changes

**`src/components/DevCompleteDetailPanel.tsx`**:
1. Add a 4th tab "验收报告" (`overview`) to the TabsList
2. Move the verdict banner, acceptance QA, and deploy button from the "process" tab into the new "overview" tab
3. Rebuild the overview tab with the original canvas-style dashboard layout (metrics cards, timeline, collapsible report sections)
4. Strip the process tab down to pure dev steps only (no deploy/acceptance actions)
5. Default tab stays `"preview"`

