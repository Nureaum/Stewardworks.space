# Technical Design Document

## Overview

This document describes the technical design for redesigning the Login and Signup pages of StewardWorks with a gaming/fantasy pixel art RPG theme. The existing corporate split-panel layout will be replaced with a full-screen fantasy background, centered semi-transparent auth card, PixelHero avatar mascot, ornate decorative border, and golden-themed form inputs. The Agreements page retains its current styling unchanged. The signup flow is restructured so users land on the gaming-themed form first, then navigate to the agreements page via a dedicated button.

#[[file:src/app/login/page.tsx]]
#[[file:src/app/signup/page.tsx]]
#[[file:src/app/hub/workforce-pathways/components/PixelHero.tsx]]
#[[file:tailwind.config.js]]

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  Gaming Auth Layout                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │            Ornate Border (CSS)                     │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │       Fantasy Background (full-screen)       │  │  │
│  │  │                                             │  │  │
│  │  │         ┌─────────────────────┐             │  │  │
│  │  │         │   PixelHero Avatar  │             │  │  │
│  │  │         └─────────────────────┘             │  │  │
│  │  │         ┌─────────────────────┐             │  │  │
│  │  │         │                     │             │  │  │
│  │  │         │  Auth Card (dark    │             │  │  │
│  │  │         │  semi-transparent)  │             │  │  │
│  │  │         │                     │             │  │  │
│  │  │         │  [Golden Inputs]    │             │  │  │
│  │  │         │  [Action Buttons]   │             │  │  │
│  │  │         │                     │             │  │  │
│  │  │         └─────────────────────┘             │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
src/app/
├── login/
│   └── page.tsx              (refactored — gaming theme applied)
├── signup/
│   └── page.tsx              (refactored — gaming theme, flow restructured)
├── agreements/
│   └── page.tsx              (NEW — extracted from signup, unchanged styling)
└── components/
    └── auth/
        ├── GamingAuthLayout.tsx    (NEW — shared layout wrapper)
        ├── FantasyBackground.tsx   (NEW — full-screen background)
        ├── OrnateBorder.tsx        (NEW — decorative CSS border frame)
        └── AuthCard.tsx            (NEW — centered card container)
```

### Data Flow

```
Login Page:
  User → GamingAuthLayout → AuthCard → Clerk useSignIn → /hub

Signup Page:
  User → GamingAuthLayout → AuthCard (form fields)
       → "Accept Terms" button → /agreements (new route)
       → User accepts terms → redirect back to /signup?termsAccepted=true
       → "Create Account" enabled → Clerk useSignUp → email verification

Agreements Page:
  /agreements → unchanged TermsContent + scroll + checkbox + signature
             → on accept → router.push('/signup?termsAccepted=true')
```

## Components and Interfaces

### GamingAuthLayout

**Location:** `src/app/components/auth/GamingAuthLayout.tsx`

A shared layout wrapper used by both Login and Signup pages. Composes the full-screen fantasy background, ornate border frame, and centers child content.

```tsx
interface GamingAuthLayoutProps {
  children: React.ReactNode;
}

export default function GamingAuthLayout({ children }: GamingAuthLayoutProps) {
  return (
    <div className="relative min-h-screen font-exo overflow-y-auto">
      <FantasyBackground />
      <OrnateBorder />
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center py-8 px-4">
        {children}
      </div>
    </div>
  );
}
```

**Responsibilities:**
- Renders `FantasyBackground` as the base layer (z-0)
- Renders `OrnateBorder` as the decorative frame layer (z-10)
- Centers children vertically and horizontally within the viewport
- Applies `overflow-y-auto` for mobile scroll support
- Sets `min-h-screen` and `font-exo`

### FantasyBackground

**Location:** `src/app/components/auth/FantasyBackground.tsx`

A full-screen CSS-based pixel art background layer depicting a warm-toned village/nature scene.

```tsx
export default function FantasyBackground() {
  return <div className="fantasy-bg" />;
}
```

**Implementation approach:**
- Uses a CSS gradient/pattern composition to evoke a pixel art landscape
- Layers multiple CSS gradients: sky gradient (warm dusk tones), ground silhouette, and dot-pattern for pixel texture
- `position: fixed; inset: 0; z-index: 0`
- Fallback: single background-color of `steward-dark` if gradients fail to render
- No external image assets required — pure CSS

**Key styles:**
```css
.fantasy-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background:
    repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px),
    repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px),
    linear-gradient(180deg, #1a1035 0%, #2d1b4e 25%, #4a2c6e 40%, #8b4513 65%, #2E5534 85%, #1a2e1a 100%);
}
```

### OrnateBorder

**Location:** `src/app/components/auth/OrnateBorder.tsx`

A decorative CSS-only border frame rendered at the viewport edges using borders, box-shadows, and corner pseudo-elements in golden tones.

```tsx
export default function OrnateBorder() {
  return (
    <div className="ornate-border">
      <div className="corner corner-tl" />
      <div className="corner corner-tr" />
      <div className="corner corner-bl" />
      <div className="corner corner-br" />
    </div>
  );
}
```

**Implementation approach:**
- `position: fixed; inset: 0; z-index: 10; pointer-events: none`
- Uses a combination of `border`, `box-shadow`, and corner pseudo-elements
- Outer border: 3px solid steward-gold with inner glow
- Corner flourishes: CSS diamond shapes using `::before`/`::after` on corner divs
- Responsive: border width reduces to 2px and corner elements hide below 640px

### AuthCard

**Location:** `src/app/components/auth/AuthCard.tsx`

A centered card container with dark semi-transparent background, golden border accent, and optional PixelHero avatar above.

```tsx
interface AuthCardProps {
  children: React.ReactNode;
  showAvatar?: boolean;
  avatarConfig?: {
    form?: string;
    skin?: string;
    outfit?: string;
    hairStyle?: string;
    hairColor?: string;
    hatType?: string;
    hatColor?: string;
    gear?: string;
  };
}

const DEFAULT_AVATAR = {
  form: 'enby',
  skin: '#e8b07a',
  outfit: '#A27532',
  hairStyle: 'swoop',
  hairColor: '#3a2a1a',
  hatType: 'ranger',
  hatColor: '#10285e',
  gear: 'enviro',
};

export default function AuthCard({ children, showAvatar = true, avatarConfig }: AuthCardProps) {
  const config = { ...DEFAULT_AVATAR, ...avatarConfig };
  return (
    <div className="flex flex-col items-center w-full max-w-[440px]">
      {showAvatar && (
        <div className="w-[100px] h-[100px] sm:w-[80px] sm:h-[80px] mb-[-16px] z-30">
          <PixelHero {...config} />
        </div>
      )}
      <div className="w-full bg-steward-dark/85 backdrop-blur-sm border border-steward-gold/60 rounded-2xl shadow-2xl p-8 md:p-10">
        {children}
      </div>
    </div>
  );
}
```

**Responsive behavior:**
- Mobile (< 640px): card expands to ~95% width with `mx-2`, avatar shrinks to 70px
- Tablet (640–1024px): centered at max 440px, avatar at 90px
- Desktop (> 1024px): centered at max 440px, avatar at 100px

### Login Page (Refactored)

**Location:** `src/app/login/page.tsx`

**Changes from current:**
1. Remove the split-panel layout (left green panel + right white panel)
2. Wrap entire page content in `<GamingAuthLayout>`
3. Replace the white form container with `<AuthCard>`
4. Restyle all inputs with golden-themed classes
5. Restyle buttons with golden-themed classes
6. Keep all Clerk authentication logic (useSignIn, magic link, forgot password) completely unchanged
7. Update branding text to use white/golden colors against dark card background

**Input styling (golden theme):**
```
className="w-full pl-12 pr-4 py-4 rounded-xl bg-steward-dark/60 border border-steward-gold/40
           focus:border-steward-orange focus:ring-2 focus:ring-steward-gold/30
           text-white placeholder:text-steward-gold/50 font-bold outline-none transition-all"
```

**Primary button styling:**
```
className="w-full bg-steward-gold text-steward-dark py-4 rounded-xl font-black uppercase
           tracking-[0.2em] hover:bg-steward-orange transition-colors shadow-lg shadow-steward-gold/20"
```

**Secondary button (magic link) styling:**
```
className="w-full bg-transparent border-2 border-steward-gold/60 text-steward-gold py-3
           rounded-xl font-bold uppercase tracking-widest hover:bg-steward-gold/10 transition-colors"
```

### Signup Page (Refactored)

**Location:** `src/app/signup/page.tsx`

**Flow restructuring:**
1. Remove the inline TermsContent and two-step flow
2. Page always shows the account creation form immediately (no terms step)
3. Add state tracking for terms acceptance via URL parameter: `?termsAccepted=true`
4. Add "Accept Terms & Conditions" button that navigates to `/agreements`
5. "Create Account" button is disabled until `termsAccepted` state is true
6. Form field values persist across the terms navigation using `sessionStorage`

**State management for terms:**
```tsx
const [termsAccepted, setTermsAccepted] = useState(false);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('termsAccepted') === 'true') {
    setTermsAccepted(true);
  }
}, []);

const handleTermsNavigation = () => {
  sessionStorage.setItem('signup_form', JSON.stringify({
    firstName, lastName, phone, email, password, confirmPassword
  }));
  router.push('/agreements');
};

useEffect(() => {
  const saved = sessionStorage.getItem('signup_form');
  if (saved) {
    const data = JSON.parse(saved);
    setFirstName(data.firstName || '');
    setLastName(data.lastName || '');
    setPhone(data.phone || '');
    setEmail(data.email || '');
    setPassword(data.password || '');
    setConfirmPassword(data.confirmPassword || '');
  }
}, []);
```

**Visual changes:** Same as Login — wrapped in GamingAuthLayout + AuthCard + golden inputs.

### Agreements Page (New)

**Location:** `src/app/agreements/page.tsx`

**Purpose:** Extracted from the current signup page's "terms" step. Renders the existing `TermsContent` component with the same white-card, steward-blue styling, scroll requirement, checkbox, and signature input.

**No gaming theme applied.** Retains:
- White card (`bg-white rounded-3xl shadow-xl`)
- `steward-blue` headings and accent colors
- `bg-steward-offwhite` page background
- Scroll-to-bottom requirement before checkbox activates
- Checkbox for acknowledging terms
- Signature text input field
- "Accept & Continue" button

**On acceptance:**
```tsx
const handleAcceptTerms = () => {
  if (!termsAccepted || !signature.trim()) { /* show error */ return; }
  sessionStorage.setItem('terms_signature', signature.trim());
  sessionStorage.setItem('terms_accepted_at', new Date().toISOString());
  router.push('/signup?termsAccepted=true');
};
```

## Data Models

### Session Storage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `signup_form` | JSON string | Persists form field values during terms navigation round-trip |
| `terms_signature` | string | User's typed signature from Agreements page |
| `terms_accepted_at` | ISO datetime string | Timestamp of terms acceptance |

### URL Parameters

| Route | Parameter | Purpose |
|-------|-----------|---------|
| `/signup` | `termsAccepted=true` | Signals that user completed terms acceptance |
| `/login` | `email` | Pre-fills email field (existing behavior) |
| `/login` | `verified=true` | Shows cross-browser verification hint (existing behavior) |

### Clerk Metadata (unchanged)

The signup submission continues to pass the same `unsafeMetadata` to Clerk:
```tsx
unsafeMetadata: {
  phone,
  terms_accepted: true,
  terms_accepted_at: sessionStorage.getItem('terms_accepted_at'),
  terms_signature: sessionStorage.getItem('terms_signature'),
}
```

## Error Handling

### Form Validation Errors
- All existing client-side validation (email format, password length, password match) preserved unchanged
- Error messages displayed in `text-red-400` against the dark card background (replacing current `text-red-500` for contrast)
- Error containers use `bg-red-500/10 border border-red-400/30 rounded-xl` styling

### Authentication Errors
- Clerk error mapping (INVALID_CREDENTIALS, EMAIL_NOT_CONFIRMED, ACCOUNT_NOT_FOUND) preserved unchanged
- Error message card styling updated to dark theme variants:
  - Invalid credentials: `bg-red-500/10 border-red-400/30`
  - Email not verified: `bg-yellow-500/10 border-yellow-400/30`
  - Account not found: `bg-red-500/10 border-red-400/30`

### Terms Navigation Errors
- If `sessionStorage` is unavailable (private browsing edge case), form fields reset gracefully with empty values
- If user arrives at `/signup?termsAccepted=true` without valid sessionStorage signature data, "Create Account" remains disabled and a toast/message prompts re-acceptance

### Session Cleanup
- Existing stale session cleanup logic via `signOut()` on mount preserved unchanged
- `sessionStorage` signup data cleared after successful account creation

## Testing Strategy

### Unit Tests
- `AuthCard` renders with and without avatar
- `OrnateBorder` renders without throwing
- `FantasyBackground` renders without throwing
- `GamingAuthLayout` renders children correctly

### Integration Tests
- Login flow: fill email + password → submit → verify Clerk `signIn.create` called with correct params
- Magic link flow: fill email → click magic link → verify `prepareFirstFactor` called
- Signup flow: fill form → navigate to agreements → accept → return → submit → verify `signUp.create` called
- Terms gate: verify "Create Account" disabled when `termsAccepted` is false
- Form persistence: fill form fields → navigate away → return → verify fields restored from sessionStorage

### Visual/Responsive Tests
- Verify layout renders correctly at 375px, 768px, and 1440px widths
- Verify ornate border scales appropriately
- Verify avatar resizes at mobile breakpoint
- Verify auth card scrolls when content exceeds viewport height

### Accessibility Tests
- All inputs have associated labels or aria-labels
- Color contrast ratios meet WCAG AA (golden text on dark backgrounds ≥ 4.5:1)
- Focus indicators visible on all interactive elements
- Tab order logical through form fields

## Correctness Properties

### Property 1: Authentication Preservation
All Clerk authentication flows (password login, magic link, forgot password, signup with email verification) must produce identical API calls and state transitions as the current implementation. The redesign is purely visual — no authentication logic changes.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 9.7**

### Property 2: Terms Acceptance Gate
The "Create Account" button on the signup page must remain disabled (non-submittable) until the user has navigated to the Agreements page and completed acceptance (checkbox + signature). `termsAccepted` must be false by default and only true after returning from `/agreements` with the acceptance flag.

**Validates: Requirements 9.3, 9.4, 9.5**

### Property 3: Form Data Persistence
All signup form field values entered before navigating to the Agreements page must be fully restored when the user returns. No data loss during the terms acceptance round-trip.

**Validates: Requirements 9.6**

### Property 4: Agreements Page Isolation
The Agreements page must not render any gaming-themed components (FantasyBackground, OrnateBorder, AuthCard, golden-themed inputs). It must retain its current white-card, steward-blue design.

**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6**

### Property 5: Responsive Accessibility
All form inputs must remain accessible (keyboard-navigable, properly labeled) on viewports from 320px to 2560px wide. The Auth card content must remain scrollable when it exceeds viewport height on mobile.

**Validates: Requirements 11.1, 11.2, 11.3, 11.4**

### Property 6: Visual Consistency with Existing Gaming Screens
The golden color palette, font choices, and pixel art aesthetic must be consistent with the existing workforce-pathways ArcadeTheme section, reusing the same Tailwind color tokens (`steward-gold`, `steward-orange`, `steward-dark`) already defined in `tailwind.config.js`.

**Validates: Requirements 1.3, 3.3, 3.4, 5.1, 5.2, 5.3, 5.4, 6.3**

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/app/components/auth/GamingAuthLayout.tsx` | CREATE | Shared layout with background + border + centering |
| `src/app/components/auth/FantasyBackground.tsx` | CREATE | CSS-based full-screen pixel art background |
| `src/app/components/auth/OrnateBorder.tsx` | CREATE | CSS-only decorative golden border frame |
| `src/app/components/auth/AuthCard.tsx` | CREATE | Centered dark card with golden border + PixelHero |
| `src/app/login/page.tsx` | MODIFY | Replace split-panel with GamingAuthLayout + golden inputs |
| `src/app/signup/page.tsx` | MODIFY | Remove inline terms, restructure flow, apply gaming theme |
| `src/app/agreements/page.tsx` | CREATE | Extracted terms page (unchanged styling) |
