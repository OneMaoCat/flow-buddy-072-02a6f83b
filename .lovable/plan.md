

## Plan: Add Human Acceptance Gate & Code Review Issue Resolution Cards

### Overview

After AI Code Review completes, the development process timeline needs two interactive stages before merging:

1. **Code Review 问题决策卡片** — If the review found issues (critical/warning), present each issue as a card with AI-suggested fix options, asking the user to decide (similar to existing `ClarifyCards` carousel pattern)
2. **人工验收确认** — A gate where the user must explicitly confirm "合并主分支" before proceeding to merge and regression testing

### Changes

#### 1. `src/components/DevProcessDetailPanel.tsx`

Add state to track the workflow progression:
- `reviewDecisions`: Record of user decisions for each review finding
- `mergeApproved`: boolean flag, only true after user clicks confirm

Add three new sections after "AI Code Review":

**Section: 问题处理 (Review Issue Resolution)**
- Extract `critical` and `warning` findings from the review
- Render each as a decision card with options: "同意 AI 修复", "跳过", "手动处理"
- Use a carousel/card UI similar to `ClarifyCards` (slide indicator, prev/next navigation)
- Each card shows: severity badge, issue title, description, file path, and AI-suggested fix
- Track selections in local state

**Section: 人工验收 (Human Acceptance Gate)**
- Show a checklist summary: feature requirements met, UI consistency, edge cases
- Display a prominent "确认合并到主分支" button (disabled until review issues are all resolved)
- When clicked, sets `mergeApproved = true` and reveals the next sections
- Before approval: show status as "等待确认"

**Section: 合并主分支 (Merge to Main)** — only renders when `mergeApproved`
- Show branch merge info, possible conflict resolution log
- Mock merge commit hash

**Section: 全流程回归测试 (Regression Testing)** — only renders when `mergeApproved`
- Unit/integration/E2E test results summary

#### 2. Timeline rendering update

Modify the sections rendering to support conditional visibility — the merge and regression sections only appear after the user confirms. Sections awaiting user action show a pulsing/pending icon instead of the green checkmark.

#### 3. New imports

Add `UserCheck`, `GitMerge`, `ShieldCheck`, `Clock` from lucide-react.

### Flow

```text
... → AI Code Review → 问题处理 (card carousel) → 人工验收 (confirm button) → 合并主分支 → 全流程回归测试
```

All changes are in `DevProcessDetailPanel.tsx`, keeping mock data inline consistent with existing patterns.

