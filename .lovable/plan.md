

## Plan: Flatten notifications & remove emoji icons

Two changes needed:

### 1. Remove aggregation/grouping logic in `NotificationCenter.tsx`
- Remove `aggregate()`, `AggGroup`, `getAggKey`, `NotifGroup` component, `expandedGroups` state
- Render `sorted` notifications directly as a flat list using `NotifCard`
- Keep time group headers (today/yesterday/earlier) but group by individual notifications, not aggregated groups

### 2. Remove emoji icons from `NotifCard`
- Remove the circular icon container (`w-9 h-9 rounded-full`) that displays `getNotificationIcon()`
- Adjust padding/layout accordingly since the icon column is gone

### Files to change
- **`src/components/NotificationCenter.tsx`**: Remove aggregation, flatten list, remove icon from `NotifCard`

