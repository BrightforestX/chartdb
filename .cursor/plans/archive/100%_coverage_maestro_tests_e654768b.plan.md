# 100% Coverage Maestro Tests Plan

## Overview
Add Maestro E2E tests with Wireweave spec for flow_card, stepper, data_table, chip, bottom_nav components.

## Wireweave Spec Mapping
- **flow_card** → Card component (data-testid="flow-card")
- **stepper** → Tabs component (data-testid="stepper")
- **data_table** → Table component (data-testid="data-table")
- **chip** → Badge component (data-testid="chip")
- **bottom_nav** → Sidebar component (data-testid="bottom-nav")

## Todos

- [x] Create Wireweave spec in tools/utilities/wireweave
- [x] Add data-testid to Card (flow_card)
- [x] Add data-testid to Table (data_table)
- [x] Add data-testid to Tabs (stepper)
- [x] Add data-testid to Badge (chip)
- [x] Add data-testid to Sidebar (bottom_nav)
- [x] Create Maestro flows for templates page
- [x] Create Maestro flows for editor page
- [x] Add maestro config and CI integration
