# RegistrantList Component - Manual Testing Guide

## Overview
The `RegistrantList` component displays all registrations for a workshop cohort with participant details, status filtering, search functionality, and waitlist management capabilities.

## Props
- `cohortId` (string, required): The UUID of the cohort to display registrations for
- `capacity` (number | null, optional): The cohort's capacity limit

## Features Implemented
✅ Fetches registrations using `getRegistrations` server action
✅ Displays participant name, email, registration date, and status
✅ Shows registered count and capacity in header
✅ Status filtering (All, Registered, Waitlisted, Cancelled)
✅ Search by name or email
✅ "Move to Registered" action for waitlisted participants
✅ Confirmation modal before status changes
✅ Capacity warning when moving from waitlist would exceed capacity
✅ Loading and error states
✅ Responsive table layout
✅ Toast notifications for success/error

## Usage Example

```tsx
import { RegistrantList } from '@/components/workshops/admin'

export default function RegistrationManagementPage({ params }: { params: { cohortId: string } }) {
  // Optionally fetch cohort data to get capacity
  const cohort = await getCohortById(params.cohortId)
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-black mb-8">Cohort Registrations</h1>
      <RegistrantList 
        cohortId={params.cohortId} 
        capacity={cohort.capacity}
      />
    </div>
  )
}
```

## Manual Testing Checklist

### Basic Display
- [ ] Component loads without errors
- [ ] Registrations are fetched and displayed
- [ ] Participant names and emails are shown correctly
- [ ] Registration dates are formatted properly
- [ ] Status badges display correct colors (green=registered, yellow=waitlisted, gray=cancelled)

### Header Stats
- [ ] Registered count displays correctly
- [ ] Capacity shows when provided
- [ ] Waitlisted count appears when there are waitlisted participants

### Filtering
- [ ] Status filter dropdown works
- [ ] Selecting "Registered" shows only registered participants
- [ ] Selecting "Waitlisted" shows only waitlisted participants
- [ ] Selecting "Cancelled" shows only cancelled participants
- [ ] Selecting "All Status" shows all participants

### Search
- [ ] Search by participant name works
- [ ] Search by email works
- [ ] Search is case-insensitive
- [ ] Empty results show "No registrations match your filters"

### Waitlist to Registered Action
- [ ] "Move to Registered" button only appears for waitlisted participants
- [ ] Clicking button opens confirmation modal
- [ ] Modal displays participant name
- [ ] Modal shows capacity warning if at/over capacity
- [ ] Confirming updates status successfully
- [ ] Success toast appears
- [ ] Table refreshes with updated data
- [ ] Canceling modal closes without changes

### Error Handling
- [ ] Network errors show error state
- [ ] Retry button reloads data
- [ ] Error toasts appear for failed actions
- [ ] Loading state shows during data fetch

### Responsive Design
- [ ] Table is scrollable on mobile
- [ ] Search and filter stack vertically on small screens
- [ ] Buttons are appropriately sized on mobile

### Admin Access
- [ ] Non-admin users cannot access (handled by server action)
- [ ] Error message shows if not authenticated

## Expected Data Structure

The component expects registrations in this format:
```typescript
interface Registrant {
  id: string
  cohort_id: string
  profile_id: string
  registered_at: string
  status: 'registered' | 'waitlisted' | 'cancelled'
  participant_name: string
  participant_email: string
}
```

## Server Actions Required
- `getRegistrations(cohortId: string)` - Fetches all registrations for a cohort
- `updateRegistrationStatus({ registrationId, newStatus })` - Updates registration status

## Dependencies
- `lucide-react` - Icons
- `react-hot-toast` - Toast notifications
- `@/app/actions/workshops/admin-reviews` - Server actions

## Styling
Uses Tailwind CSS with Steward Works custom colors:
- `steward-dark` - Primary text
- `steward-green` - Primary action buttons
- Rounded corners: `rounded-[2rem]` for cards, `rounded-xl` for buttons/inputs

## Notes
- Component is client-side rendered (`'use client'`)
- Server actions are imported dynamically to avoid build issues
- Handles null capacity gracefully (unlimited registrations)
- Day 1 auto-unlock mentioned in confirmation modal (handled by server action)
