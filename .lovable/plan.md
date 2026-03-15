

## Analysis

Current right panel structure (DevCompleteDetailPanel) has 3 tabs: **验收报告 | 预览 | AI 审查**, defaulting to "验收报告". The user wants:

1. **Default to Preview** — when opening the detail panel, show the live preview first (not the report)
2. **Dev process as a toggleable overlay/section** — a button in the preview view to expand and see the detailed development process (each step with specifics of what was done)
3. **Merge acceptance report into the preview context** — preview is the primary view, with report info accessible alongside it

## Proposed Redesign

Restructure the right panel into a **Preview-first** layout:

```text
┌──────────────────────────────────────────┐
│ [Title]                    [Preview] [x] │  ← header, Preview is default
├──────────────────────────────────────────┤
│  ┌─ Browser Chrome ─────────────────┐    │
│  │ ● ● ●  localhost:5173/login  📱  │    │
│  ├───────────────────────────────────┤    │
│  │                                   │    │
│  │        Mock Preview Image         │    │
│  │                                   │    │
│  └───────────────────────────────────┘    │
│                                          │
│  ┌─ Bottom Bar ─────────────────────┐    │
│  │ ✓ 92分  10/10通过  3文件  12s    │    │
│  │        [查看开发过程]  [发布]     │    │
│  └───────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

Clicking **"查看开发过程"** slides up a detailed process panel (or switches to a tab) showing:
- 7-step process with expanded details per step (not just one-line summaries)
- Each step shows: what was analyzed, what files were created/modified, what tests ran, review findings

### Tab restructure

Change tabs from `验收报告 | 预览 | AI 审查` to:

**`预览 | 开发过程 | AI 审查`**

- **预览** (default): Full preview with bottom metrics bar + deploy button
- **开发过程**: Detailed step-by-step narrative of the 7 dev steps, with expandable details for each (files touched, code reasoning, test results, review findings — essentially merging the old acceptance report content into a process-oriented view)
- **AI 审查**: Keep as-is (detailed CodeReviewTab)

### Changes

**`src/components/DevCompleteDetailPanel.tsx`**:
1. Change `activeTab` default from `"overview"` to `"preview"`
2. Rename tab labels: `验收报告` → `开发过程`, move preview to first position
3. Redesign the "preview" tab to be the primary view: full-height RequirementPreview + bottom metrics/deploy bar
4. Restructure the old "overview" tab into a "开发过程" (dev process) tab that narrates the 7 steps with expandable detail sections (reusing existing ReportSection components but organized by process step rather than category)

**`src/components/DevCompleteCard.tsx`**: No changes needed — the compact card already shows the 7-step summary.

