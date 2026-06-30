# WorkshopDayForm Component - Manual Test Plan

## Component Overview
The WorkshopDayForm component is an admin interface for creating and editing workshop day content, including TipTap rich text editors for content body and deliverable instructions, plus integrated media management.

## Test Prerequisites
- User must have admin or super_admin role
- A cohort must exist to create workshop days for
- Supabase connection configured
- TipTap editor dependencies installed

## Test Cases

### 18.1: Create Mode - Initial Render
**Steps:**
1. Navigate to workshop day creation page
2. Pass `cohortId` and `onSubmit`/`onCancel` callbacks
3. Do NOT pass `initialData`

**Expected Results:**
- Form renders with empty/default values
- Day number defaults to 1
- Deliverable type defaults to "Pending Confirmation"
- Requires admin approval checkbox is checked by default
- Both TipTap editors render correctly
- MediaUploader is NOT visible (only shows in edit mode)
- Cancel and "Create Workshop Day" buttons visible
- Note about media attachments being added after creation

### 18.2: Day Number Dropdown
**Steps:**
1. Click day number dropdown in create mode
2. Verify options 1, 2, and 3 are available
3. Select Day 2
4. In edit mode, verify dropdown is disabled

**Expected Results:**
- All three day numbers selectable in create mode
- Selected value updates correctly
- In edit mode, dropdown is disabled with explanation text
- Cannot change day number after creation

### 18.3: Title Input Validation
**Steps:**
1. Leave title field empty
2. Click "Create Workshop Day"
3. Enter a title
4. Submit again

**Expected Results:**
- Browser validation error on empty title (required field)
- Form validates successfully with title entered
- Title is trimmed of whitespace

### 18.4: Content Body TipTap Editor
**Steps:**
1. Click into content body editor
2. Type some text
3. Use formatting toolbar: bold, italic, headings
4. Add a link using link button
5. Upload an image (if file upload configured)
6. Verify HTML is being generated

**Expected Results:**
- Editor is fully functional
- All toolbar buttons work
- Rich text formatting applies correctly
- Links can be added/removed
- Images can be uploaded (if storage configured)
- Content updates `contentBody` state

### 18.5: Deliverable Instructions TipTap Editor
**Steps:**
1. Click into deliverable instructions editor
2. Type instructions for participants
3. Format text with bold, lists, etc.
4. Verify both editors work independently

**Expected Results:**
- Second editor works independently of first
- Both editors maintain their own state
- Formatting toolbar works for both editors
- Content updates `deliverableInstructions` state

### 18.6: Deliverable Type Dropdown
**Steps:**
1. Click deliverable type dropdown
2. Verify all 4 options available
3. Select each option and verify it updates

**Expected Results:**
- Options: Pending Confirmation, Text Submission, File Upload, Video
- Selected value updates state correctly
- Help text explains the purpose

### 18.7: Requires Admin Approval Checkbox
**Steps:**
1. Verify checkbox is checked by default
2. Uncheck the checkbox
3. Check it again
4. Read the help text

**Expected Results:**
- Checkbox defaults to checked (true)
- Can be toggled on/off
- State updates correctly
- Help text explains unlock behavior difference

### 18.8: Form Submission - Create Mode
**Steps:**
1. Fill out all fields:
   - Day number: 1
   - Title: "Introduction Day"
   - Content body: Some rich text
   - Deliverable instructions: Some instructions
   - Deliverable type: Text
   - Admin approval: checked
2. Click "Create Workshop Day"
3. Verify onSubmit callback receives correct payload

**Expected Results:**
- onSubmit called with CreateWorkshopDayParams
- Payload includes all field values
- cohort_id matches provided cohortId
- Loading state shows "Saving..."
- Button disabled during submission
- Success toast appears on success
- Error toast appears on failure

### 18.9: Form Submission - Edit Mode
**Steps:**
1. Pass `initialData` with existing workshop day
2. Modify title, content, and settings
3. Click "Update Workshop Day"
4. Verify onSubmit receives UpdateWorkshopDayParams with id

**Expected Results:**
- Form pre-populated with initialData
- Day number field is disabled
- Audit information section visible
- Created/Updated dates displayed
- onSubmit receives id field in payload
- Button text changes to "Update Workshop Day"

### 18.10: MediaUploader Integration (Edit Mode)
**Steps:**
1. In edit mode, scroll to media attachments section
2. Click "Upload File" button
3. Select a PDF or image
4. Click "Add Link" button
5. Add a video or external link
6. Drag media items to reorder
7. Delete a media item

**Expected Results:**
- Media section only visible in edit mode
- Upload button triggers file picker
- File uploads successfully to Supabase Storage
- Link form appears when "Add Link" clicked
- Links can be added with optional labels
- Media items display with appropriate icons
- Drag and drop reordering works
- Delete button shows confirmation and removes item
- All operations call appropriate server actions

### 18.11: Cancel Button
**Steps:**
1. Fill out form partially
2. Click Cancel button
3. Verify onCancel callback fired

**Expected Results:**
- Cancel button always visible
- onCancel callback executed
- No data submitted
- Button disabled during submission

### 18.12: Error Handling
**Steps:**
1. Simulate server error in onSubmit
2. Try to create duplicate day number
3. Try to submit with invalid data

**Expected Results:**
- Error message displayed in red alert box
- Error toast appears
- Form remains editable
- Submit button re-enabled after error
- Specific error messages for different scenarios

### 18.13: Loading States
**Steps:**
1. Submit form
2. Observe loading indicators
3. Try clicking buttons during submission

**Expected Results:**
- "Saving..." text appears during submission
- Buttons disabled during submission
- Form inputs remain enabled
- Cannot double-submit

### 18.14: Styling and Responsiveness
**Steps:**
1. View form on desktop
2. View form on tablet
3. View form on mobile
4. Verify all elements accessible

**Expected Results:**
- Form uses consistent design system (matching CohortForm)
- Rounded corners, proper spacing
- TipTap editors responsive
- Mobile-friendly layout
- All text readable at all sizes
- Buttons properly sized for touch targets

## Integration Test with Server Actions

### Create and Edit Workflow
**Steps:**
1. Create new workshop day via form
2. Verify day created in database
3. Navigate to edit page with created day ID
4. Modify content and settings
5. Save changes
6. Add media attachments
7. Verify all changes persisted

**Expected Results:**
- Complete create-edit-media workflow functions
- Data persists correctly
- Audit fields updated appropriately
- Media associated with correct day

## Known Limitations
- Media uploader requires API endpoint at `/api/admin/workshop-days/[dayId]/media`
- TipTap file uploads require `/api/admin/upload-media` endpoint
- Supabase Storage bucket `workshop-media` must exist
- RLS policies must allow admin access to all tables

## Component Props Reference
```typescript
interface WorkshopDayFormProps {
  cohortId: string;              // Required: UUID of cohort
  initialData?: WorkshopDay;     // Optional: For edit mode
  onSubmit: (data: CreateWorkshopDayParams | UpdateWorkshopDayParams) => Promise<void>;
  onCancel: () => void;
}
```

## Success Criteria
✅ All 18 subtasks implemented:
- 18.1: Component created with required props
- 18.2: Day number field (1-3) with validation
- 18.3: Title field (required)
- 18.4: Content body TipTap editor
- 18.5: Deliverable instructions TipTap editor
- 18.6: Deliverable type dropdown
- 18.7: Requires admin approval checkbox
- 18.8: Audit information in edit mode
- 18.9: Loading states during submission
- 18.10: MediaUploader integrated in edit mode
- Plus: Form validation, error handling, styling, responsiveness
