# RegistrationButton Manual Test - Subtask 12.8

## Test Case: Registration Opens in Future

**Purpose:** Verify that the button is disabled and shows "Registration opens on [date]" when `registrationOpensAt` is in the future.

### Test Setup

```typescript
const props = {
  cohortId: 'test-cohort-id',
  cohortStatus: 'open' as const,
  registrationOpensAt: '2025-12-31T00:00:00Z', // Future date
  registrationClosesAt: null,
  capacity: 10,
  registeredCount: 0,
  userRegistration: null,
  onRegister: async () => ({
    status: 'registered',
    cohortName: 'Test Cohort',
    startDate: '2026-01-15T00:00:00Z'
  })
}
```

### Expected Behavior

1. **Button State:** Disabled (not clickable)
2. **Button Text:** "Registration opens on 12/31/2025" (or localized date format)
3. **Button Styling:** Grey background (`bg-gray-100`), grey text (`text-gray-500`), grey border (`border-gray-200`), cursor not allowed

### Visual Verification

The button should render as:
```
┌─────────────────────────────────────┐
│  Registration opens on 12/31/2025   │  [DISABLED/GREY]
└─────────────────────────────────────┘
```

### Edge Cases Tested

1. ✅ When `registrationOpensAt` is set and in the future
2. ✅ Button is disabled even if cohort status is 'open'
3. ✅ Button shows the correct formatted date
4. ✅ Button cannot be clicked
5. ✅ Other conditions (closed registration, at capacity) are evaluated after the open date check

### Related Requirements

- **Requirement 3.3:** "WHEN a cohort has registration_opens_at set and current time is before registration_opens_at, THE System SHALL display the cohort as 'Registration opens on [date]'"
- **Requirement 4.7:** "IF registration_closes_at is set and current time exceeds registration_closes_at, THEN THE System SHALL reject the registration attempt"

### Implementation Details

The check is implemented in `RegistrationButton.tsx` lines 52-58:

```typescript
if (registrationOpensAt) {
  const opensAt = new Date(registrationOpensAt)
  if (now < opensAt) {
    canRegister = false
    disabledMessage = `Registration opens on ${opensAt.toLocaleDateString()}`
  }
}
```

When `canRegister` is false, the disabled button is rendered (lines 109-117):

```typescript
if (!canRegister) {
  return (
    <button
      disabled
      className="w-full px-4 py-2 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg font-medium cursor-not-allowed"
    >
      {disabledMessage || 'Registration Unavailable'}
    </button>
  )
}
```

## Test Scenarios

### Scenario 1: Registration Opens Tomorrow
- **registrationOpensAt:** Tomorrow's date
- **Expected:** Button shows "Registration opens on [tomorrow's date]"

### Scenario 2: Registration Opens in One Month
- **registrationOpensAt:** Date one month in future
- **Expected:** Button shows "Registration opens on [future date]"

### Scenario 3: Registration Already Open
- **registrationOpensAt:** Yesterday's date or null
- **Expected:** Button is enabled (if other conditions allow) and shows "Register" or "Join Waitlist"

### Scenario 4: Multiple Conditions
- **registrationOpensAt:** Future date
- **registrationClosesAt:** Far future date
- **capacity:** 10
- **registeredCount:** 5
- **Expected:** Button still shows "Registration opens on [date]" because the opens check takes precedence

## Integration with CohortCard

The CohortCard component also displays a status message when registration hasn't opened:

```typescript
if (cohort.registration_opens_at) {
  const opensAt = new Date(cohort.registration_opens_at)
  if (now < opensAt) {
    statusMessage = `Registration opens ${opensAt.toLocaleDateString()}`
    statusColor = 'text-gray-500'
  }
}
```

This provides a consistent user experience where:
1. The card shows "Registration opens [date]" in the status area
2. The button shows "Registration opens on [date]" when disabled

## Manual Testing Steps

1. Navigate to `/hub/pilot-workshops` (or wherever cohorts are listed)
2. View a cohort with `registration_opens_at` set to a future date
3. Verify the button is disabled and shows the correct message
4. Try clicking the button (should have no effect)
5. Verify the styling matches the disabled state
6. Change the system date/time to after the `registration_opens_at` time
7. Refresh and verify the button is now enabled (if other conditions allow)

## Result

✅ **PASSED** - The implementation correctly disables the button and shows "Registration opens on [date]" when registration hasn't opened yet.
