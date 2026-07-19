# Implementation Plan: Gaming Login Redesign

## Overview

Redesign the Login and Signup pages with a gaming/fantasy pixel art RPG theme. Replace the corporate split-panel layout with a full-screen CSS fantasy background, centered semi-transparent auth card with golden-themed inputs, PixelHero avatar mascot, and ornate decorative border. Extract the Agreements page to its own route unchanged. All Clerk authentication logic remains identical — this is a purely visual redesign with a signup flow restructure.

## Tasks

- [x] 1. Create shared gaming auth layout components
  - [x] 1.1 Create FantasyBackground component
    - Create `src/app/components/auth/FantasyBackground.tsx`
    - Implement CSS-only full-screen pixel art background using layered gradients (sky dusk tones, ground silhouette, pixel dot-pattern texture)
    - Use `position: fixed; inset: 0; z-index: 0` with fallback to steward-dark background-color
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Create OrnateBorder component
    - Create `src/app/components/auth/OrnateBorder.tsx`
    - Implement CSS-only decorative golden border frame with `position: fixed; inset: 0; z-index: 10; pointer-events: none`
    - Use combination of border, box-shadow, and corner pseudo-elements in steward-gold tones
    - Outer border: 3px solid steward-gold with inner glow; corner flourishes via `::before`/`::after`
    - Responsive: border width reduces to 2px and corners simplify below 640px
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 1.3 Create AuthCard component
    - Create `src/app/components/auth/AuthCard.tsx`
    - Implement centered card container with dark semi-transparent background (`bg-steward-dark/85 backdrop-blur-sm`)
    - Add golden border accent (`border-steward-gold/60`), rounded corners (`rounded-2xl`)
    - Integrate PixelHero avatar above the card with default brand configuration (form: enby, outfit: steward-gold, hat: ranger, gear: enviro)
    - Responsive: card expands to ~95% width on mobile, avatar shrinks to 70px below 640px
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4_

  - [x] 1.4 Create GamingAuthLayout wrapper component
    - Create `src/app/components/auth/GamingAuthLayout.tsx`
    - Compose FantasyBackground (z-0), OrnateBorder (z-10), and centered content area (z-20)
    - Apply `min-h-screen`, `font-exo`, `overflow-y-auto` for mobile scroll support
    - Flex container to vertically and horizontally center children
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 6.1, 6.2, 11.4_

- [x] 2. Refactor Login page with gaming theme
  - [x] 2.1 Replace login page split-panel layout with GamingAuthLayout
    - Modify `src/app/login/page.tsx`
    - Remove the left green branded panel (`bg-steward-green`) and the right white form panel (`bg-steward-offwhite`)
    - Remove the mobile header green bar
    - Wrap entire page content in `<GamingAuthLayout>` with `<AuthCard>` containing the form
    - Add StewardWorks branding text (white/golden, font-exo) at top of card
    - Keep ALL Clerk authentication logic (useSignIn, handleLogin, handleMagicLink, handleForgotPassword, handleResetPassword) completely unchanged
    - _Requirements: 2.1, 2.3, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 2.2 Apply golden-themed styling to login form inputs and buttons
    - Restyle all input fields: dark background (`bg-steward-dark/60`), golden borders (`border-steward-gold/40`), golden placeholder text, golden focus ring
    - Restyle primary button: `bg-steward-gold text-steward-dark` with hover to `bg-steward-orange`
    - Restyle magic link button: transparent with `border-steward-gold/60 text-steward-gold`
    - Restyle error message containers for dark theme: red/yellow variants with reduced opacity backgrounds
    - Restyle "Forgot Password?" link and "Don't have an account?" link with golden text
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 2.3 Write unit tests for Login page gaming theme
    - Verify GamingAuthLayout renders on login page (no split-panel elements)
    - Verify golden-themed input classes are applied
    - Verify Clerk signIn.create is called with correct params on form submit
    - Verify magic link flow triggers prepareFirstFactor correctly
    - Verify error states render in dark-theme styled containers
    - _Requirements: 2.1, 5.1, 8.1, 8.2, 8.5_

- [x] 3. Extract Agreements page to its own route
  - [x] 3.1 Create the standalone Agreements page
    - Create `src/app/agreements/page.tsx`
    - Move the `TermsContent` component from `src/app/signup/page.tsx` into the new page (or import it)
    - Retain the existing white-card design: `bg-steward-offwhite` page, `bg-white rounded-3xl shadow-xl` card, `steward-blue` headings
    - Retain scroll-to-bottom requirement, checkbox, signature input, and "Accept & Continue" button
    - On acceptance: store signature and timestamp in sessionStorage, then `router.push('/signup?termsAccepted=true')`
    - Do NOT apply any gaming-themed styling (no FantasyBackground, OrnateBorder, golden inputs)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 9.3_

  - [ ]* 3.2 Write unit tests for Agreements page isolation
    - Verify no gaming-themed components (FantasyBackground, OrnateBorder, AuthCard) are rendered
    - Verify white-card steward-blue styling is present
    - Verify scroll-to-bottom requirement enables checkbox
    - Verify acceptance stores signature in sessionStorage and navigates to `/signup?termsAccepted=true`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 4. Checkpoint - Ensure components and agreements page work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Refactor Signup page with gaming theme and restructured flow
  - [x] 5.1 Replace signup page layout and restructure terms flow
    - Modify `src/app/signup/page.tsx`
    - Remove the inline `TermsContent` component and the two-step (`terms` / `signup`) flow
    - Remove the split-panel layout (left green panel, right white panel, mobile header)
    - Wrap page in `<GamingAuthLayout>` with `<AuthCard>` containing the form
    - Display all form fields immediately on load: first name, last name, phone, email, password, confirm password
    - Add "Accept Terms & Conditions" button that saves form data to sessionStorage and navigates to `/agreements`
    - Read `?termsAccepted=true` URL param on mount to enable/disable "Create Account" button
    - Restore form field values from sessionStorage on mount
    - Clear sessionStorage data after successful account creation
    - Keep ALL Clerk signUp logic (useSignUp, create, prepareEmailAddressVerification) unchanged
    - _Requirements: 2.2, 2.4, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 5.2 Apply golden-themed styling to signup form inputs and buttons
    - Apply same golden input styling as login page (dark bg, golden borders, golden placeholders, golden focus)
    - Style "Accept Terms & Conditions" button as a secondary golden action
    - Style "Create Account" button as primary golden action with disabled state styling
    - Add StewardWorks branding text at top of card
    - Style error messages for dark card background (`text-red-400`, dark-theme containers)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3_

  - [ ]* 5.3 Write property test for form data persistence (Property 3)
    - **Property 3: Form Data Persistence**
    - For any combination of form field values (firstName, lastName, phone, email, password, confirmPassword), saving to sessionStorage and restoring must produce identical values
    - Test that JSON serialization/deserialization round-trip preserves all field data
    - **Validates: Requirements 9.6**

  - [ ]* 5.4 Write property test for terms acceptance gate (Property 2)
    - **Property 2: Terms Acceptance Gate**
    - The "Create Account" button disabled state must equal `!termsAccepted`
    - `termsAccepted` is false by default and only true when URL contains `termsAccepted=true` AND sessionStorage contains a valid `terms_signature`
    - Form submission must be blocked when `termsAccepted` is false regardless of form validity
    - **Validates: Requirements 9.3, 9.4, 9.5**

  - [ ]* 5.5 Write unit tests for signup flow
    - Verify form fields render immediately (no terms step blocking)
    - Verify "Accept Terms" navigates to `/agreements` and saves form data to sessionStorage
    - Verify "Create Account" is disabled when termsAccepted is false
    - Verify "Create Account" is enabled when URL has `termsAccepted=true` and signature exists
    - Verify Clerk signUp.create is called with correct params including unsafeMetadata
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 6. Checkpoint - Ensure signup flow and golden styling work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Responsive behavior and visual polish
  - [x] 7.1 Implement responsive adjustments for mobile viewports
    - Verify AuthCard expands to near-full width with padding below 640px
    - Verify PixelHero avatar reduces to 60-80px on mobile
    - Verify OrnateBorder simplifies (thinner border, hidden corners) on mobile
    - Verify Fantasy Background remains visible behind card on all screen sizes
    - Verify pages scroll on mobile when content exceeds viewport height
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 3.6, 6.5_

  - [ ]* 7.2 Write property test for responsive accessibility (Property 5)
    - **Property 5: Responsive Accessibility**
    - All form inputs must have associated labels or aria-labels regardless of viewport width
    - Tab order through form fields must be logical (top-to-bottom, left-to-right) at any width
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

  - [ ]* 7.3 Write property test for agreements page isolation (Property 4)
    - **Property 4: Agreements Page Isolation**
    - The Agreements page DOM must never contain elements with gaming-theme classes (fantasy-bg, ornate-border, bg-steward-dark/85, border-steward-gold)
    - The Agreements page must always contain white-card steward-blue themed elements
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6**

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All Clerk authentication logic (useSignIn, useSignUp, magic link, forgot password) remains completely unchanged — this is a purely visual redesign with flow restructure
- The PixelHero component already exists at `src/app/hub/workforce-pathways/components/PixelHero.tsx` and is imported directly
- Golden color tokens (`steward-gold`, `steward-orange`, `steward-dark`) are already defined in `tailwind.config.js`
- The `font-exo` class is already configured in the project

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["1.4", "3.1"] },
    { "id": 2, "tasks": ["2.1", "5.1"] },
    { "id": 3, "tasks": ["2.2", "5.2", "3.2"] },
    { "id": 4, "tasks": ["2.3", "5.3", "5.4", "5.5"] },
    { "id": 5, "tasks": ["7.1"] },
    { "id": 6, "tasks": ["7.2", "7.3"] }
  ]
}
```
