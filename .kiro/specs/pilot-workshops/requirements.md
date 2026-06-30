# Requirements Document: Pilot Workshops

## Introduction

The Pilot Workshops feature provides a structured 3-day workshop series delivered through cohorts. Participants register for specific cohorts, progress through workshop days sequentially by submitting deliverables, and unlock subsequent days upon completion. Administrators manage cohort scheduling, capacity, workshop content, and deliverable review. The system enforces two-gate access: registration gate (must register for cohort) and progress gate (must complete each day to unlock the next).

## Glossary

- **Participant**: A user with the default `participant` role who can register for cohorts and submit deliverables
- **Admin**: A user with `admin` or `super_admin` role who can create and manage workshop content
- **Cohort**: A scheduled instance of the 3-day workshop series with defined start date and capacity
- **Workshop_Day**: One day of content within a cohort (Day 1, 2, or 3), containing lesson content and deliverable requirements
- **Deliverable**: The required submission output for each workshop day
- **Registration**: The enrollment record connecting a participant to a specific cohort
- **Progress_Row**: A per-user, per-day record tracking unlock status and deliverable completion
- **Unlock**: Making a workshop day accessible to a participant
- **System**: The Pilot Workshops application
- **Content_Body**: Rich text lesson content for a workshop day
- **Deliverable_Instructions**: Text description of what participants must submit
- **Submission**: A participant's deliverable submission for a specific workshop day
- **Review**: Admin evaluation of a submitted deliverable (approve or reject)
- **Workshop_Dashboard**: The participant-facing interface showing all workshop days and progress
- **Registrant_List**: The admin-facing list of all participants registered for a cohort

## Requirements

### Requirement 1: Cohort Creation and Management

**User Story:** As an Admin, I want to create and configure workshop cohorts, so that I can schedule multiple workshop series with defined start dates and capacity limits.

#### Acceptance Criteria

1. THE System SHALL allow an Admin to create a new cohort with name, start_date, and optional capacity
2. THE System SHALL allow an Admin to set optional registration_opens_at and registration_closes_at timestamps for a cohort
3. THE System SHALL enforce that cohort status values are restricted to 'draft', 'open', 'closed', or 'completed'
4. THE System SHALL initialize new cohorts with status 'draft'
5. THE System SHALL record created_by, created_at, updated_by, and updated_at for each cohort modification
6. THE System SHALL allow an Admin to update cohort details including name, start_date, capacity, and status
7. THE System SHALL prevent deletion of cohorts that have existing registrations (on delete restrict)

### Requirement 2: Workshop Day Content Creation

**User Story:** As an Admin, I want to create content for each workshop day, so that participants receive structured lesson materials and clear deliverable instructions.

#### Acceptance Criteria

1. THE System SHALL allow an Admin to create three workshop days per cohort (day_number 1, 2, 3)
2. THE System SHALL enforce unique day_number values per cohort (no duplicate Day 1s)
3. WHEN creating a workshop_day, THE System SHALL require title, content_body, and deliverable_instructions
4. THE System SHALL initialize deliverable_type as 'pending_confirmation' for new workshop days
5. THE System SHALL initialize requires_admin_approval as true for new workshop days
6. THE System SHALL allow an Admin to attach media to workshop days (videos, PDFs, images, external links)
7. THE System SHALL maintain sort_order for media attachments within each workshop day
8. THE System SHALL cascade delete workshop days and their media when a cohort is deleted

### Requirement 3: Cohort Visibility and Registration Eligibility

**User Story:** As a Participant, I want to see available cohorts and understand registration requirements, so that I can choose and register for an appropriate workshop session.

#### Acceptance Criteria

1. WHILE cohort status is 'open', THE System SHALL display the cohort on the public-facing Pilot Workshops page
2. WHILE cohort status is 'draft', THE System SHALL hide the cohort from the public-facing page
3. WHEN a cohort has registration_opens_at set and current time is before registration_opens_at, THE System SHALL display the cohort as "Registration opens on [date]"
4. WHEN a cohort has registration_closes_at set and current time is after registration_closes_at, THE System SHALL prevent new registrations
5. WHEN a cohort has capacity set and registered participant count equals capacity, THE System SHALL display "Waitlist" instead of "Register"
6. WHEN a Participant is already registered for a cohort, THE System SHALL display "You're registered" instead of "Register"

### Requirement 4: Participant Registration

**User Story:** As a Participant, I want to register for a specific cohort, so that I can access workshop content when the cohort starts.

#### Acceptance Criteria

1. WHEN a Participant clicks Register for an open cohort, THE System SHALL verify registration is currently allowed
2. WHEN registration is allowed and capacity is not full, THE System SHALL insert a workshop_registration with status 'registered'
3. WHEN registration is allowed but capacity is full, THE System SHALL insert a workshop_registration with status 'waitlisted'
4. THE System SHALL enforce unique constraint preventing duplicate registrations (same cohort_id and profile_id)
5. WHEN a registration is created, THE System SHALL record registered_at timestamp
6. THE System SHALL prevent registration if cohort status is not 'open'
7. IF registration_closes_at is set and current time exceeds registration_closes_at, THEN THE System SHALL reject the registration attempt

### Requirement 5: Day 1 Automatic Unlock

**User Story:** As a Participant, I want Day 1 to unlock automatically when my cohort starts, so that I can begin the workshop on the scheduled start date.

#### Acceptance Criteria

1. WHEN a registered Participant accesses the Workshop_Dashboard and cohort start_date has passed, THE System SHALL make Day 1 accessible
2. WHEN a Participant with status 'registered' first accesses Day 1 after start_date, THE System SHALL create a Progress_Row with unlocked_at set to current timestamp
3. WHEN a Participant with status 'waitlisted' accesses the Workshop_Dashboard after start_date, THE System SHALL not unlock Day 1
4. THE System SHALL compute Day 1 accessibility at read time by comparing current time to cohort start_date
5. WHEN multiple Participants are registered for the same cohort, THE System SHALL unlock Day 1 for all registered Participants simultaneously when start_date passes

### Requirement 6: Deliverable Submission

**User Story:** As a Participant, I want to submit my deliverable for each workshop day, so that I can complete the day's requirements and unlock the next day.

#### Acceptance Criteria

1. WHEN a Participant submits a deliverable, THE System SHALL create a workshop_deliverable_submission record
2. THE System SHALL record submitted_at timestamp when a submission is created
3. WHEN a submission is created, THE System SHALL update the corresponding Progress_Row setting deliverable_submitted_at and deliverable_status to 'submitted'
4. THE System SHALL support submission_text for text-based deliverables
5. THE System SHALL support file_storage_path for uploaded file deliverables
6. THE System SHALL support external_video_url for video link deliverables (YouTube, Loom)
7. THE System SHALL allow multiple submissions per workshop day per Participant (resubmission capability)
8. THE System SHALL maintain complete submission history without overwriting previous submissions

### Requirement 7: Admin Deliverable Review

**User Story:** As an Admin, I want to review and approve or reject participant deliverables, so that I can ensure quality standards before unlocking subsequent workshop days.

#### Acceptance Criteria

1. THE System SHALL display an admin-facing review screen showing all submissions with deliverable_status 'submitted'
2. WHEN an Admin approves a deliverable, THE System SHALL update Progress_Row setting deliverable_status to 'approved', reviewed_by to Admin's profile_id, and reviewed_at to current timestamp
3. WHEN an Admin rejects a deliverable, THE System SHALL update Progress_Row setting deliverable_status to 'rejected', reviewed_by to Admin's profile_id, and reviewed_at to current timestamp
4. THE System SHALL display submission_text inline for text-based submissions
5. THE System SHALL display file and video submissions as links or embedded players
6. WHEN a deliverable is rejected, THE System SHALL allow the Participant to resubmit
7. THE System SHALL group submissions by cohort and day_number for Admin review interface

### Requirement 8: Sequential Day Unlock Logic (Stub Implementation)

**User Story:** As a Participant, I want subsequent days to unlock after completing previous days, so that I progress through the workshop sequentially.

#### Acceptance Criteria

1. THE System SHALL implement a function `isDayUnlockedForUser(dayId, profileId)` that determines day accessibility
2. WHEN requires_admin_approval is false for a workshop day, THE System SHALL unlock the next day immediately when deliverable_status becomes 'submitted'
3. WHEN requires_admin_approval is true for a workshop day, THE System SHALL unlock the next day only when deliverable_status becomes 'approved'
4. THE System SHALL maintain day_number sequence enforcement (Day 2 depends on Day 1, Day 3 depends on Day 2)
5. THE System SHALL preserve stub status with TODO comment until client confirms auto-unlock vs manual approval policy

### Requirement 9: Workshop Dashboard Display

**User Story:** As a Participant, I want to see my workshop progress clearly, so that I understand which days are accessible, completed, or locked.

#### Acceptance Criteria

1. THE System SHALL display all three workshop days in sequential order on the Workshop_Dashboard
2. WHEN a day is unlocked, THE System SHALL display it as fully accessible with visible content
3. WHEN a day is locked, THE System SHALL display it as greyed out with explanatory text "Unlocks after Day [N] is approved"
4. WHEN a day is completed and approved, THE System SHALL allow continued access to that day's content
5. THE System SHALL use left join when querying Progress_Rows to handle missing rows without errors
6. THE System SHALL treat missing Progress_Row as equivalent to locked status
7. THE System SHALL display current deliverable_status for each day (not_submitted, submitted, approved, rejected)

### Requirement 10: Capacity and Waitlist Management

**User Story:** As an Admin, I want to manage cohort capacity and waitlisted participants, so that I can handle registration limits and manually admit waitlisted participants when space becomes available.

#### Acceptance Criteria

1. WHEN an Admin sets capacity on a cohort, THE System SHALL count existing registrations with status 'registered' before allowing new registrations
2. WHEN registered count equals or exceeds capacity, THE System SHALL automatically assign status 'waitlisted' to new registrations
3. THE System SHALL provide an Admin action to change registration status from 'waitlisted' to 'registered'
4. WHEN a waitlisted Participant is changed to registered status, THE System SHALL apply standard Day 1 unlock logic if start_date has passed
5. THE System SHALL display current registered count and capacity on the Registrant_List
6. WHEN capacity is null, THE System SHALL allow unlimited registrations

### Requirement 11: Multi-Cohort Support

**User Story:** As a Participant, I want to register for multiple cohorts simultaneously, so that I can participate in different workshop sessions if desired.

#### Acceptance Criteria

1. THE System SHALL allow a single Participant to have multiple workshop_registration records for different cohorts
2. THE System SHALL maintain separate Progress_Rows per Participant per cohort per day
3. THE System SHALL display all registered cohorts on the Participant's Workshop_Dashboard
4. THE System SHALL prevent a Participant from registering for the same cohort multiple times (unique constraint)

### Requirement 12: Cohort Lifecycle Management

**User Story:** As an Admin, I want to manage cohort lifecycle states, so that I can control visibility and prevent accidental data loss.

#### Acceptance Criteria

1. WHEN an Admin changes cohort start_date, THE System SHALL apply the new start_date to Day 1 unlock logic without migrating existing Progress_Rows
2. THE System SHALL allow an Admin to change cohort status from 'open' to 'closed' to prevent further registrations
3. THE System SHALL allow an Admin to change cohort status to 'completed' when the workshop series ends
4. THE System SHALL prevent hard deletion of cohorts by using soft delete (status change) for cohorts with registrations
5. WHEN a cohort is set to 'closed' or 'completed', THE System SHALL display existing Registrant_List without allowing new registrations

### Requirement 13: Audit Trail and Attribution

**User Story:** As an Admin, I want to see who created and modified workshop content, so that I can maintain accountability and track changes.

#### Acceptance Criteria

1. WHEN a cohort is created, THE System SHALL record created_by as the Admin's profile_id and created_at as current timestamp
2. WHEN a cohort is updated, THE System SHALL record updated_by as the Admin's profile_id and updated_at as current timestamp
3. WHEN a workshop_day is created or modified, THE System SHALL record created_by, created_at, updated_by, and updated_at
4. WHEN a deliverable is reviewed, THE System SHALL record reviewed_by as the Admin's profile_id and reviewed_at as current timestamp
5. THE System SHALL display creator and modifier names on admin interfaces by joining profile records

### Requirement 14: Registration Confirmation and Communication

**User Story:** As a Participant, I want confirmation after registering for a cohort, so that I know my registration was successful and when the cohort starts.

#### Acceptance Criteria

1. WHEN a registration is created with status 'registered', THE System SHALL display a confirmation message including cohort name and start_date
2. WHEN a registration is created with status 'waitlisted', THE System SHALL display a waitlist confirmation message explaining the participant is not yet confirmed
3. THE System SHALL display the registered cohort on the Participant's Workshop_Dashboard immediately after registration
4. WHEN a cohort has not yet started, THE System SHALL display "Starts on [start_date]" on the Workshop_Dashboard

### Requirement 15: Content Media Management

**User Story:** As an Admin, I want to attach multiple media files to workshop day content, so that I can provide rich multimedia lesson materials.

#### Acceptance Criteria

1. THE System SHALL allow an Admin to upload PDFs to workshop_day_media with media_type 'pdf'
2. THE System SHALL allow an Admin to add video links to workshop_day_media with media_type 'video_link'
3. THE System SHALL allow an Admin to add external links to workshop_day_media with media_type 'external_link'
4. THE System SHALL allow an Admin to upload images to workshop_day_media with media_type 'image'
5. THE System SHALL store uploaded files with storage_path referencing Supabase Storage location
6. THE System SHALL maintain sort_order for media within each workshop_day
7. THE System SHALL allow an Admin to add optional label text to each media item
8. THE System SHALL cascade delete media when parent workshop_day is deleted

### Requirement 16: Row Level Security Enforcement

**User Story:** As the System, I want to enforce row-level access control, so that participants can only access their own data and admins have appropriate elevated privileges.

#### Acceptance Criteria

1. THE System SHALL enable RLS on cohorts, workshop_days, workshop_day_media, workshop_registrations, workshop_progress, and workshop_deliverable_submissions tables
2. THE System SHALL allow public select on cohorts where status is 'open'
3. THE System SHALL allow admin/super_admin select on all cohorts regardless of status
4. THE System SHALL allow admin/super_admin insert and update on cohorts and workshop_days
5. THE System SHALL allow a Participant to select their own workshop_registrations, workshop_progress, and workshop_deliverable_submissions only
6. THE System SHALL allow a Participant to insert workshop_registrations and workshop_deliverable_submissions for their own profile_id only
7. THE System SHALL prevent Participants from updating unlock_at or deliverable_status directly
8. THE System SHALL allow admin/super_admin to select all workshop_progress and workshop_deliverable_submissions records
9. THE System SHALL allow admin/super_admin to update workshop_progress for deliverable review

### Requirement 17: Error Handling and Edge Cases

**User Story:** As a Participant, I want clear error messages when operations fail, so that I understand what went wrong and how to proceed.

#### Acceptance Criteria

1. WHEN a Participant attempts to register for a cohort that is not 'open', THE System SHALL return error message "Registration is not currently open for this cohort"
2. WHEN a Participant attempts to register after registration_closes_at, THE System SHALL return error message "Registration has closed for this cohort"
3. WHEN capacity is exceeded, THE System SHALL display "You have been waitlisted" message instead of error
4. WHEN a Participant attempts duplicate registration, THE System SHALL return error message "You are already registered for this cohort"
5. WHEN a Progress_Row is missing during dashboard load, THE System SHALL treat it as locked without throwing an error
6. WHEN a cohort start_date is in the future, THE System SHALL display "Starts on [date]" without attempting to unlock Day 1
7. IF a deliverable is rejected, THEN THE System SHALL display rejection status with option to resubmit

### Requirement 18: Resubmission After Rejection

**User Story:** As a Participant, I want to resubmit my deliverable after rejection, so that I can address feedback and continue progressing through the workshop.

#### Acceptance Criteria

1. WHEN a deliverable_status is 'rejected', THE System SHALL display resubmission interface on the Workshop_Dashboard
2. WHEN a Participant resubmits after rejection, THE System SHALL create a new workshop_deliverable_submission record
3. WHEN a resubmission is created, THE System SHALL update Progress_Row deliverable_status back to 'submitted'
4. THE System SHALL preserve the original rejected submission in workshop_deliverable_submissions table
5. THE System SHALL display submission count to Admins when multiple submissions exist for one day
6. THE System SHALL display most recent submission by default in Admin review interface

### Requirement 19: Admin Rejection Feedback

**User Story:** As an Admin, I want to provide feedback when rejecting a deliverable, so that participants understand why their submission was rejected and what needs improvement.

#### Acceptance Criteria

1. THE System SHALL provide a review_note text field in the Admin review interface
2. WHEN an Admin rejects a deliverable, THE System SHALL allow entry of rejection reason in review_note
3. WHEN a deliverable is rejected with review_note, THE System SHALL display the review_note to the Participant on the Workshop_Dashboard
4. THE System SHALL store review_note in workshop_progress table
5. THE System SHALL display review_note alongside deliverable_status 'rejected'

### Requirement 20: Cohort Description and Public Information

**User Story:** As a Participant, I want to see descriptive information about each cohort, so that I can make an informed decision about which cohort to join.

#### Acceptance Criteria

1. THE System SHALL allow an Admin to add optional description rich text to a cohort
2. WHEN a cohort has description content, THE System SHALL display it on the public-facing Pilot Workshops page
3. THE System SHALL display cohort name, start_date, and registration status on the public page
4. WHEN capacity is set, THE System SHALL display remaining capacity count (e.g. "5 spots remaining")
5. THE System SHALL sort displayed cohorts by start_date ascending
