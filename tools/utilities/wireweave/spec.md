# Wireweave Test ID Spec

Standard data-testid attributes for Maestro and E2E testing.

## Component Mapping

| Component | data-testid | Usage |
|-----------|-------------|-------|
| flow_card | `flow-card` | Card containers for flow/content display |
| stepper | `stepper` | Step indicators, tab-based wizards |
| data_table | `data-table` | Table components for tabular data |
| chip | `chip` | Badge/tag components |
| bottom_nav | `bottom-nav` | Bottom navigation, sidebar nav |

## Selector Format

Maestro uses `id` for data-testid. Format: `id="flow-card"` or `testId="flow-card"`.

For web: `[data-testid="flow-card"]`

## Usage in Components

```tsx
// Card as flow_card
<Card data-testid="flow-card">

// Tabs as stepper
<Tabs data-testid="stepper">

// Table as data_table
<Table data-testid="data-table">

// Badge as chip
<Badge data-testid="chip">

// Sidebar as bottom_nav
<Sidebar data-testid="bottom-nav">
```
