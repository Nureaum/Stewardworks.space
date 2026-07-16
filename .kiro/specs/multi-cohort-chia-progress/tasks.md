# Implementation Plan: Multi-Cohort Chia Progress System

## Overview

This implementation separates the Chia Guardian progress into global engagement (25%) and per-cohort deliverables (75%). The system allows users with multiple cohorts to maintain unified engagement across all cohorts while tracking deliverables independently per cohort. A cohort switcher in the Main Hub enables viewing progress history across all participated cohorts.

## Tasks

- [x] 1. Create calculation utilities for global engagement and cohort deliverables
  - [x] 1.1 Create Global Engagement Calculator function
    - Create `src/lib/progress/calculateGlobalEngagement.ts`
    - Implement point value formula: bookmark = 1%, note = 1%, generation = 2%, prompt = 3%
    - Cap total at 25%
    - Accept array of engagement items and return percentage
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 1.2 Write property tests for Global Engagement Calculator
    - **Property 1: Global Engagement Aggregation** - verify all approved items counted regardless of cohort
    - **Property 2: Engagement Point Formula** - verify correct point values applied
    - **Property 3: Engagement Cap** - verify cap at 25%
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

  - [x] 1.3 Create Cohort Deliverables Calculator function
    - Create `src/lib/progress/calculateCohortDeliverables.ts`
    - Implement formula: 25% per approved deliverable, max 75%
    - Accept array of progress rows and cohort_id, return percentage
    - Filter deliverables by cohort via workshop_day_id relationship
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 1.4 Write property tests for Cohort Deliverables Calculator
    - **Property 4: Cohort-Isolated Deliverables** - verify only cohort-specific deliverables counted
    - **Property 5: Deliverable Percentage Formula** - verify min(N × 25, 75)
    - **Validates: Requirements 2.1, 2.2, 2.4**

  - [x] 1.5 Create Combined Progress Calculator function
    - Create `src/lib/progress/calculateCombinedProgress.ts`
    - Add cohort deliverables (0-75) + global engagement (0-25)
    - Implement Chia growth stage selection based on combined percentage
    - _Requirements: 3.1, 3.3_

  - [ ]* 1.6 Write property tests for Combined Progress Calculator
    - **Property 6: Combined Progress Calculation** - verify deliverables + engagement sum
    - **Property 7: Chia Stage Selection** - verify stage thresholds (0, 1-24, 25-49, 50-74, 75-99, 100)
    - **Validates: Requirements 3.1, 3.3**

- [x] 2. Checkpoint - Ensure calculation utilities pass all tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Enhance Progress API endpoint
  - [x] 3.1 Update Progress API types and response interface
    - Update `src/app/api/workshops/progress/route.ts`
    - Add `ProgressAPIResponse` interface with globalEngagement, cohortProgress array, selectedCohortId
    - Add `CohortProgress` type for per-cohort deliverable data
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 3.2 Implement user cohort list query
    - Query `workshop_registrations` to get all cohorts user has participated in
    - Order by `start_date` descending (most recent first)
    - Handle case where user has no cohort participation
    - _Requirements: 4.2, 5.5_

  - [ ]* 3.3 Write property test for cohort list ordering
    - **Property 8: Cohort List Ordering** - verify descending start_date order
    - **Validates: Requirements 4.2**

  - [x] 3.4 Implement global engagement aggregation in API
    - Query all approved engagement items without cohort filter
    - Use Global Engagement Calculator to compute percentage
    - Include in response regardless of cohort_id parameter
    - _Requirements: 1.1, 5.3, 6.3_

  - [x] 3.5 Implement per-cohort deliverables query in API
    - Join workshop_progress with workshop_days to filter by cohort_id
    - Calculate deliverable percentage for each cohort
    - Return array of cohort progress objects
    - _Requirements: 2.1, 5.2, 5.4, 6.4_

  - [ ]* 3.6 Write property tests for API cohort parameter handling
    - **Property 9: API Cohort Parameter Handling** - verify correct deliverables per cohort with global engagement
    - **Property 10: Backward Compatibility** - verify deliverable association via workshop_day_id
    - **Validates: Requirements 5.2, 5.3, 6.4**

  - [x] 3.7 Implement cohort_id parameter handling
    - If cohort_id provided, set as selectedCohortId
    - If cohort_id not provided, default to most recent active cohort
    - If cohort_id invalid, fallback to most recent cohort
    - _Requirements: 5.1, 5.2_

- [x] 4. Checkpoint - Ensure Progress API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Cohort Switcher component
  - [x] 5.1 Create CohortSwitcher component
    - Create component in `src/components/hub/CohortSwitcher.tsx`
    - Accept cohorts array, selectedId, and onSelect callback props
    - Render as styled dropdown showing cohort name and deliverable percentage
    - Return null if cohorts array has 0 or 1 items
    - _Requirements: 4.1, 4.5_

  - [ ]* 5.2 Write unit tests for CohortSwitcher
    - Test renders dropdown when multiple cohorts
    - Test returns null when single cohort
    - Test calls onSelect with correct cohort_id
    - _Requirements: 4.1, 4.5_

- [x] 6. Update Hub page and CozyHubRoom for multi-cohort support
  - [x] 6.1 Update Hub page to fetch enhanced progress data
    - Modify `src/app/hub/page.tsx` to call updated Progress API
    - Store cohort progress array, selected cohort, and global engagement in state
    - Pass multi-cohort data to CozyHubRoom component
    - _Requirements: 4.1, 4.4_

  - [x] 6.2 Update CozyHubRoom props and state
    - Update `src/components/hub/CozyHubRoom.tsx` interface
    - Add props: cohortProgress, globalEngagement, selectedCohortId, onCohortChange
    - Integrate CohortSwitcher near Chia Guardian display
    - _Requirements: 4.1, 4.3_

  - [x] 6.3 Implement cohort selection handling in CozyHubRoom
    - Update Chia Guardian display when cohort selection changes
    - Calculate combined progress from selected cohort deliverables + global engagement
    - _Requirements: 4.3_

  - [ ]* 6.4 Write integration tests for Hub cohort switching
    - Test initial load shows most recent active cohort
    - Test cohort switch updates Chia Guardian display
    - Test global engagement remains constant across cohort switches
    - _Requirements: 4.3, 4.4, 1.5_

- [x] 7. Checkpoint - Ensure Hub integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Update Portfolio component for multi-cohort display
  - [x] 8.1 Update Portfolio progress calculation
    - Verify `src/components/workshops/journey/Portfolio.tsx` uses global engagement
    - Ensure separate progress bars for deliverables (0-75%) and engagement (0-25%)
    - Display combined total percentage (0-100%) for Chia stage
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 8.2 Write unit tests for Portfolio progress display
    - Test displays correct combined percentage
    - Test separate bars for deliverables and engagement
    - Test engagement is global (same across cohorts)
    - _Requirements: 3.1, 3.2_

- [x] 9. Update TreasureMap component for consistent Chia display
  - [x] 9.1 Update TreasureMap Chia Guardian calculation
    - Verify `src/components/workshops/journey/TreasureMap.tsx` uses same calculation as Portfolio
    - Ensure combined percentage label displays next to Chia sprite
    - Update dashboard panel to show separate deliverable and engagement bars
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 9.2 Write unit tests for TreasureMap Chia display
    - Test displays combined percentage matching Portfolio calculation
    - Test dashboard panel shows separate bars
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 10. Verify admin workflow and backward compatibility
  - [x] 10.1 Verify admin review workflow unchanged
    - Check `src/app/actions/workshops/engagement.ts` approval logic
    - Ensure approval updates only status field without affecting cohort associations
    - Verify admin review interface still groups by cohort
    - _Requirements: 8.1, 8.2_

  - [ ]* 10.2 Write property test for approval updates
    - **Property 11: Approval Updates Global Calculation** - verify approved item immediately included in global engagement
    - **Validates: Requirements 8.3**

  - [x] 10.3 Verify backward compatibility with existing data
    - Confirm no schema changes needed to workshop_engagement table
    - Confirm no schema changes needed to workshop_progress table
    - Test existing engagement records with cohort_id included in global calculations
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 11. Final checkpoint - Run full test suite
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- No database schema changes are required - all changes are in application code
- The design uses TypeScript throughout, matching the existing Next.js project structure

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2", "1.4", "1.5"] },
    { "id": 2, "tasks": ["1.6", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.4", "3.5", "5.1"] },
    { "id": 4, "tasks": ["3.3", "3.6", "3.7", "5.2"] },
    { "id": 5, "tasks": ["6.1", "8.1", "9.1", "10.1"] },
    { "id": 6, "tasks": ["6.2", "8.2", "9.2", "10.2", "10.3"] },
    { "id": 7, "tasks": ["6.3"] },
    { "id": 8, "tasks": ["6.4"] }
  ]
}
```
