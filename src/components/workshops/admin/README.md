# Workshop Admin Components

This directory contains admin-specific components for the Pilot Workshops feature.

## Components

### CohortForm

**File:** `CohortForm.tsx`

**Purpose:** Admin form for creating and editing workshop cohorts.

**Features:**
- Supports both create and edit modes via `initialData` prop
- Form validation for required fields and date logic
- Registration window validation (opens_at, closes_at)
- Capacity management (optional)
- Status management (draft, open, closed, completed)
- Audit trail display in edit mode
- Toast notifications for success/error feedback
- Responsive design with mobile support

**Props:** See `CohortFormProps` in `@/types/workshops`

**Usage:**

```tsx
import { CohortForm } from '@/components/workshops/admin'

// Create mode
<CohortForm
  onSubmit={handleCreateCohort}
  onCancel={handleCancel}
/>

// Edit mode
<CohortForm
  initialData={existingCohort}
  onSubmit={handleUpdateCohort}
  onCancel={handleCancel}
/>
```

**Form Fields:**
- **Cohort Name*** (required): Text input for cohort name
- **Description**: Textarea for cohort description (visible to participants)
- **Start Date*** (required): datetime-local input for when Day 1 unlocks
- **Registration Opens At**: Optional datetime-local for registration start
- **Registration Closes At**: Optional datetime-local for registration end
- **Capacity**: Optional number input for max participants (triggers waitlist when full)
- **Status**: Select dropdown (draft, open, closed, completed)

**Validation Rules:**
1. Name and Start Date are required
2. Registration close date must be after open date
3. Registration must close before cohort starts
4. Capacity must be a positive integer if provided

**Styling:**
- Follows project TailwindCSS conventions
- Uses `steward-green` for primary actions
- Rounded corners (2rem on container, xl on inputs)
- Consistent spacing and typography
- Responsive grid layout for registration window fields

**Testing:**
See `CohortForm.manual-test.md` for comprehensive testing instructions.

## Directory Structure

```
workshops/admin/
├── CohortForm.tsx                      # Cohort create/edit form
├── CohortForm.manual-test.md          # Cohort testing documentation
├── WorkshopDayForm.tsx                # Workshop day create/edit form
├── WorkshopDayForm.manual-test.md     # Workshop day testing documentation
├── MediaUploader.tsx                  # Media attachment management
├── DeliverableReviewCard.tsx          # Deliverable review component
├── RegistrantList.tsx                 # Registration management component
├── RegistrantList.manual-test.md      # Registration testing documentation
├── README.md                           # This file
└── index.ts                            # Barrel export
```

### WorkshopDayForm

**File:** `WorkshopDayForm.tsx`

**Purpose:** Admin form for creating and editing workshop day content with integrated TipTap rich text editors.

**Features:**
- Create or edit workshop days (Day 1, 2, or 3)
- Rich text editor for content body (lesson content)
- Rich text editor for deliverable instructions
- Deliverable type selection (text, file, video, pending_confirmation)
- Admin approval requirement toggle
- Integrated MediaUploader in edit mode
- Day number locked after creation (prevents duplicate days)
- Validation and error handling
- Audit trail display in edit mode

**Props:** See `WorkshopDayFormProps` in `@/types/workshops`

**Usage:**

```tsx
import { WorkshopDayForm } from '@/components/workshops/admin'

// Create mode
<WorkshopDayForm
  cohortId="cohort-uuid"
  onSubmit={handleCreateDay}
  onCancel={handleCancel}
/>

// Edit mode
<WorkshopDayForm
  cohortId="cohort-uuid"
  initialData={existingDay}
  onSubmit={handleUpdateDay}
  onCancel={handleCancel}
/>
```

**Form Fields:**
- **Day Number*** (required): Select 1, 2, or 3 (disabled in edit mode)
- **Day Title*** (required): Text input for day name
- **Content Body**: TipTap rich text editor for lesson content
- **Deliverable Instructions**: TipTap rich text editor for submission requirements
- **Deliverable Type**: Select (text, file, video, pending_confirmation)
- **Requires Admin Approval**: Checkbox (affects unlock behavior)

**Validation Rules:**
1. Day number must be 1, 2, or 3
2. Title is required
3. Content and instructions are optional but recommended
4. Day number cannot be changed after creation

**Testing:**
See `WorkshopDayForm.manual-test.md` for comprehensive testing instructions.

### MediaUploader

**File:** `MediaUploader.tsx`

**Purpose:** Component for managing media attachments on workshop days (PDFs, images, video links, external links).

**Features:**
- Upload files (PDFs, images) to Supabase Storage
- Add external links (videos, resources)
- Drag-and-drop reordering of media items
- Delete media with confirmation
- Visual indicators for media type (file, image, video, link icons)
- Optional labels for each media item
- Real-time updates via server actions

**Props:**
- `workshopDayId: string` - UUID of the workshop day

**Usage:**

```tsx
import { MediaUploader } from '@/components/workshops/admin'

<MediaUploader workshopDayId="day-uuid" />
```

**Features:**
- Automatically loads existing media on mount
- Upload button for PDFs and images
- Add Link button for video links and external resources
- Drag handles for reordering
- Delete button with confirmation
- Sortable media list with visual feedback

**Note:** MediaUploader is automatically included in WorkshopDayForm edit mode. Only use standalone if needed for custom layouts.

### RegistrantList

**File:** `RegistrantList.tsx`

**Purpose:** Admin component for viewing and managing cohort registrations with waitlist management.

**Features:**
- Displays all registrations for a cohort
- Shows registered count vs capacity
- Search by participant name or email
- Filter by registration status (all, registered, waitlisted, cancelled)
- "Move to Registered" action for waitlisted participants
- Confirmation modal with capacity warnings
- Responsive table layout
- Real-time status updates
- Toast notifications

**Props:**
- `cohortId: string` - UUID of the cohort (required)
- `capacity?: number | null` - Cohort capacity limit (optional)

**Usage:**

```tsx
import { RegistrantList } from '@/components/workshops/admin'

<RegistrantList 
  cohortId="cohort-uuid"
  capacity={50}
/>
```

**Features:**
- Automatic data loading on mount
- Search filters name and email (case-insensitive)
- Status filter dropdown (all, registered, waitlisted, cancelled)
- Action button only visible for waitlisted participants
- Confirmation modal before status changes
- Capacity warning if moving from waitlist would exceed limit
- Loading skeleton and error states
- Responsive table with horizontal scroll on mobile

**Testing:**
See `RegistrantList.manual-test.md` for comprehensive testing instructions.

### DeliverableReviewCard

**File:** `DeliverableReviewCard.tsx`

**Purpose:** Admin component for reviewing and approving/rejecting participant deliverable submissions.

**Features:**
- Display submission content (text, file, video)
- Approve/reject actions with feedback
- Visual status indicators
- File previews (images, PDFs)
- Video embedding (YouTube)
- Submission metadata display

**Props:** See `DeliverableReviewCardProps` in `@/types/workshops`

**Note:** This component is used in the admin review dashboard to process participant submissions.

## Integration Notes

- All admin components require admin/super_admin role enforcement at the page level
- Form submissions should call server actions defined in `src/app/actions/workshops/`
- Error handling uses both local error state and react-hot-toast notifications
- Date handling converts between ISO 8601 (database) and datetime-local (input) formats
- TipTap editors require RichTextEditor component from `@/components/admin/RichTextEditor`
- MediaUploader requires API endpoint at `/api/admin/workshop-days/[dayId]/media`
- File uploads require Supabase Storage bucket named `workshop-media`

## Server Actions Used

**CohortForm:**
- `createCohort(data)` - Creates a new cohort
- `updateCohort(cohortId, data)` - Updates existing cohort

**WorkshopDayForm:**
- `createWorkshopDay(cohortId, data)` - Creates a new workshop day
- `updateWorkshopDay(dayId, data)` - Updates existing workshop day

**MediaUploader:**
- `uploadDayMedia(dayId, file, mediaType, label?)` - Uploads file to storage
- `addExternalMedia(dayId, url, mediaType, label?)` - Adds external link
- `deleteDayMedia(mediaId)` - Deletes media and file
- `updateMediaSortOrder(dayId, mediaItems)` - Reorders media

**RegistrantList:**
- `getRegistrations(cohortId)` - Fetches all registrations for a cohort
- `updateRegistrationStatus({ registrationId, newStatus })` - Updates registration status

**DeliverableReviewCard:**
- `reviewDeliverable(progressId, status, reviewNote?)` - Approves or rejects deliverable

All server actions are defined in `src/app/actions/workshops/` directory.
