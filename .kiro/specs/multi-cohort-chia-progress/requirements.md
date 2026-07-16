# Requirements Document

## Introduction

The Multi-Cohort Chia Progress System separates the Chia Guardian progress into two distinct components: global engagement (25%) and per-cohort deliverables (75%). This allows users participating in multiple cohorts to maintain a unified engagement score across all cohorts while tracking deliverables independently for each cohort. The system provides a cohort switcher in the Main Hub, enabling users to view their progress history across all participated cohorts.

## Glossary

- **Chia_Guardian**: A gamified progress indicator displayed as a growing plant sprite that reflects a user's overall workshop participation progress (0-100%)
- **Engagement**: User activities including bookmarks, notes, prompts, and AI generations that contribute to the global 25% portion of Chia Guardian growth
- **Deliverables**: Workshop day submissions (3 total per cohort) that contribute to the per-cohort 75% portion of Chia Guardian growth
- **Cohort**: A time-bound group of workshop participants progressing through the 3-day curriculum together
- **Global_Engagement_Calculator**: The component responsible for computing the user's engagement percentage across all cohorts
- **Cohort_Deliverables_Calculator**: The component responsible for computing the user's deliverable percentage for a specific cohort
- **Cohort_Switcher**: A dropdown UI component in the Main Hub allowing users to switch between their participated cohorts
- **Progress_API**: The `/api/workshops/progress` endpoint that fetches progress data for the Chia Guardian display
- **Portfolio_View**: The component displaying the user's Chia Guardian, deliverables, and engagement items within a cohort context
- **Hub_View**: The main hub page displaying the aggregated Chia Guardian with cohort switching capability

## Requirements

### Requirement 1: Global Engagement Calculation

**User Story:** As a workshop participant, I want my engagement items (bookmarks, notes, prompts, generations) to count globally across all cohorts, so that my engagement effort is recognized regardless of which cohort I created the item in.

#### Acceptance Criteria

1. WHEN the Global_Engagement_Calculator computes engagement percentage, THE Global_Engagement_Calculator SHALL aggregate all approved engagement items across all cohorts for the user
2. WHEN an engagement item is created, THE System SHALL store the cohort_id for tracking purposes but not use it for percentage calculation
3. THE Global_Engagement_Calculator SHALL apply the following point values: bookmark = 1%, note = 1%, generation = 2%, prompt = 3%
4. THE Global_Engagement_Calculator SHALL cap the total engagement percentage at 25%
5. WHEN the same engagement percentage is displayed in different cohorts, THE System SHALL show identical values across the Portfolio_View of all cohorts and the Hub_View

### Requirement 2: Per-Cohort Deliverables Calculation

**User Story:** As a workshop participant, I want my deliverables progress to be tracked independently for each cohort, so that joining a new cohort gives me a fresh start on the deliverables portion.

#### Acceptance Criteria

1. WHEN the Cohort_Deliverables_Calculator computes deliverable percentage for a cohort, THE Cohort_Deliverables_Calculator SHALL only count approved deliverables from that specific cohort
2. THE Cohort_Deliverables_Calculator SHALL assign 25% for each approved deliverable, up to a maximum of 75% for 3 deliverables
3. WHEN a user joins a new cohort, THE Cohort_Deliverables_Calculator SHALL return 0% deliverable progress for that cohort initially
4. THE Cohort_Deliverables_Calculator SHALL NOT include deliverables from other cohorts in the calculation

### Requirement 3: Combined Chia Guardian Display in Portfolio

**User Story:** As a workshop participant viewing my portfolio, I want to see my Chia Guardian reflecting both my cohort-specific deliverables and my global engagement, so that I understand my total progress in the current cohort context.

#### Acceptance Criteria

1. WHEN the Portfolio_View displays the Chia_Guardian, THE Portfolio_View SHALL combine the cohort-specific deliverable percentage (0-75%) with the global engagement percentage (0-25%)
2. THE Portfolio_View SHALL display separate progress bars for deliverables and engagement with distinct colors
3. THE Portfolio_View SHALL display the combined total percentage (0-100%) as the Chia_Guardian growth stage
4. WHEN a user has 2 approved deliverables in the current cohort and 20% global engagement, THE Portfolio_View SHALL display 70% total progress (50% + 20%)

### Requirement 4: Main Hub Cohort Switcher

**User Story:** As a workshop participant who has joined multiple cohorts, I want to switch between cohorts in the Main Hub to view my progress history, so that I can track my journey across all cohorts I've participated in.

#### Acceptance Criteria

1. WHEN a user has participated in multiple cohorts, THE Hub_View SHALL display a Cohort_Switcher dropdown near the Chia_Guardian
2. THE Cohort_Switcher SHALL list all cohorts the user has participated in, ordered by start date descending
3. WHEN the user selects a cohort from the Cohort_Switcher, THE Hub_View SHALL update the Chia_Guardian to show that cohort's deliverables combined with global engagement
4. WHEN the Hub_View loads initially, THE Hub_View SHALL display the most recent active cohort by default
5. IF the user has participated in only one cohort, THEN THE Hub_View SHALL hide the Cohort_Switcher dropdown

### Requirement 5: Progress API Enhancement

**User Story:** As a developer, I want the Progress API to return cohort-aware data with global engagement, so that frontend components can correctly calculate and display the multi-cohort progress.

#### Acceptance Criteria

1. WHEN the Progress_API receives a request without a cohort parameter, THE Progress_API SHALL return data for the most recent active cohort
2. WHEN the Progress_API receives a request with a cohort_id parameter, THE Progress_API SHALL return deliverable progress for that specific cohort
3. THE Progress_API SHALL always return engagement data aggregated globally across all cohorts
4. THE Progress_API SHALL return a list of all cohorts the user has participated in with their respective deliverable progress
5. WHEN the user has no cohort participation, THE Progress_API SHALL return empty progress rows and empty engagements array

### Requirement 6: Backward Compatibility

**User Story:** As a system administrator, I want the new multi-cohort system to work with existing data without requiring database migrations, so that current users are not disrupted.

#### Acceptance Criteria

1. THE System SHALL NOT require changes to the workshop_engagement table schema
2. THE System SHALL NOT require changes to the workshop_progress table schema
3. WHEN processing existing engagement records with cohort_id values, THE Global_Engagement_Calculator SHALL include them in global calculations
4. WHEN processing existing deliverable records, THE Cohort_Deliverables_Calculator SHALL correctly associate them with their respective cohorts via workshop_day_id

### Requirement 7: TreasureMap Chia Display Update

**User Story:** As a workshop participant viewing the treasure map, I want the Chia Guardian displayed on the map to reflect the same global engagement and current cohort deliverables, so that my progress is consistent across all views.

#### Acceptance Criteria

1. WHEN the TreasureMap displays the Chia_Guardian, THE TreasureMap SHALL use the same calculation as the Portfolio_View (cohort deliverables + global engagement)
2. THE TreasureMap SHALL display the combined percentage label next to the Chia_Guardian sprite
3. THE TreasureMap dashboard panel SHALL show separate bars for deliverables and engagement percentages

### Requirement 8: Admin Review Workflow Preservation

**User Story:** As an administrator reviewing engagement items, I want the approval workflow to remain unchanged, so that my existing review process continues to work.

#### Acceptance Criteria

1. WHEN an administrator approves an engagement item, THE System SHALL update only the status field without affecting cohort associations
2. THE System SHALL continue to display engagement items grouped by cohort in the admin review interface
3. WHEN an engagement item is approved, THE Global_Engagement_Calculator SHALL immediately include it in the user's global engagement percentage
