# CohortForm Manual Test

## Component Overview
The CohortForm component is an admin form for creating and editing workshop cohorts. It supports both create and edit modes based on whether `initialData` is provided.

## Test Setup

### Test Page Location
Create a test page at: `src/app/test-cohort-form/page.tsx`

### Test Page Code
```tsx
'use client'

import { useState } from 'react'
import CohortForm from '@/components/workshops/admin/CohortForm'
import { Cohort, CreateCohortParams, UpdateCohortParams } from '@/types/workshops'

export default function TestCohortFormPage() {
  const [mode, setMode] = useState<'create' | 'edit'>('create')

  // Mock existing cohort data for edit mode
  const mockCohort: Cohort = {
    id: 'test-cohort-id',
    name: 'Spring 2024 Cohort',
    description: 'A comprehensive 3-day workshop series for Spring 2024',
    start_date: '2024-04-01T09:00:00Z',
    registration_opens_at: '2024-03-01T00:00:00Z',
    registration_closes_at: '2024-03-25T23:59:59Z',
    capacity: 30,
    status: 'open',
    created_by: 'user-id',
    created_at: '2024-02-15T10:00:00Z',
    updated_by: 'user-id',
    updated_at: '2024-02-20T14:30:00Z'
  }

  const handleSubmit = async (data: CreateCohortParams | UpdateCohortParams) => {
    console.log('Form submitted with data:', data)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert('Form submitted successfully! Check console for data.')
  }

  const handleCancel = () => {
    console.log('Form cancelled')
    alert('Form cancelled')
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setMode('create')}
            className={`px-4 py-2 rounded-lg font-bold ${
              mode === 'create' 
                ? 'bg-steward-green text-white' 
                : 'bg-white text-gray-600'
            }`}
          >
            Test Create Mode
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`px-4 py-2 rounded-lg font-bold ${
              mode === 'edit' 
                ? 'bg-steward-green text-white' 
                : 'bg-white text-gray-600'
            }`}
          >
            Test Edit Mode
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-6">
          {mode === 'create' ? 'Create Cohort' : 'Edit Cohort'}
        </h1>

        <CohortForm
          initialData={mode === 'edit' ? mockCohort : undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
```

## Manual Test Cases

### Test Case 1: Create Mode - Basic Form Validation
1. Navigate to `/test-cohort-form`
2. Ensure "Test Create Mode" is selected
3. Click "Create Cohort" without filling any fields
4. **Expected:** Browser validation should require the "Cohort Name" and "Start Date" fields

### Test Case 2: Create Mode - Successful Submission
1. Fill in the form:
   - Cohort Name: "Test Cohort 2024"
   - Description: "A test cohort"
   - Start Date: Select a future date/time
   - Status: "Draft"
2. Click "Create Cohort"
3. **Expected:** 
   - Form shows "Saving..." on submit button
   - Success toast appears
   - Console logs the submitted data
   - Alert shows "Form submitted successfully!"

### Test Case 3: Create Mode - Optional Fields
1. Fill only required fields (Name, Start Date)
2. Leave all optional fields empty
3. Submit the form
4. **Expected:** Form submits successfully with null values for optional fields

### Test Case 4: Create Mode - Registration Window Validation
1. Fill in:
   - Cohort Name: "Test Cohort"
   - Start Date: "2024-04-01 09:00"
   - Registration Opens At: "2024-03-15 09:00"
   - Registration Closes At: "2024-03-10 09:00" (earlier than opens)
2. Submit the form
3. **Expected:** Error message: "Registration close date must be after open date"

### Test Case 5: Create Mode - Capacity Input
1. Fill required fields
2. Set Capacity to "25"
3. Submit the form
4. **Expected:** Submitted data includes capacity as integer 25

### Test Case 6: Edit Mode - Pre-populated Fields
1. Click "Test Edit Mode" button
2. **Expected:** All form fields should be pre-populated with mock data:
   - Name: "Spring 2024 Cohort"
   - Description visible
   - Dates formatted correctly in datetime-local inputs
   - Capacity: "30"
   - Status: "Open"
   - Audit information section visible showing created/updated dates

### Test Case 7: Edit Mode - Update Submission
1. In edit mode, change the cohort name to "Spring 2024 Cohort - Updated"
2. Submit the form
3. **Expected:** 
   - Console shows data includes the cohort id
   - Toast shows "Cohort updated successfully!"

### Test Case 8: Cancel Button
1. Fill in some fields
2. Click "Cancel" button
3. **Expected:** 
   - Console logs "Form cancelled"
   - Alert shows "Form cancelled"

### Test Case 9: Status Dropdown
1. Open the Status dropdown
2. **Expected:** Four options visible:
   - Draft
   - Open
   - Closed
   - Completed
3. Select each option and verify it's reflected in the form

### Test Case 10: Date Formatting
1. In edit mode, verify dates are properly formatted
2. **Expected:** 
   - Dates appear in local time zone
   - Format matches datetime-local input (YYYY-MM-DDTHH:mm)

## Visual Verification

### Styling Checks
- Form has rounded corners with shadow
- Consistent spacing between fields
- Labels are uppercase with wide tracking
- Input fields have gray background with focus states
- Submit button is green with hover effect
- Cancel button is white with gray border
- Audit section (edit mode) has distinct background

### Responsive Design
1. Test on desktop (1200px+)
2. Test on tablet (768px)
3. Test on mobile (375px)
4. **Expected:** Registration window fields stack vertically on mobile

## Cleanup
After testing, delete the test page: `src/app/test-cohort-form/page.tsx`

## Notes
- The component uses `react-hot-toast` for notifications
- Form validation includes both client-side (required fields) and custom validation (date logic)
- Datetime inputs use the native `datetime-local` type for better UX
- Component follows project styling conventions with TailwindCSS
