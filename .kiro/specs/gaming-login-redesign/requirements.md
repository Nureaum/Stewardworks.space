# Requirements Document

## Introduction

Redesign the login and signup pages of StewardWorks with a gaming/fantasy theme inspired by pixel art RPG aesthetics. The current corporate split-panel layout will be replaced with a full-screen fantasy background, a centered semi-transparent card, and a pixel art avatar character using the existing PixelHero component. Only the Login page and the Signup page receive the gaming theme — the existing Terms & Agreements page retains its current styling (white card, steward-blue themed, scroll requirement, checkbox, signature). The signup flow is restructured so the user lands directly on the gaming-themed signup form, with an "Accept Terms & Conditions" button that navigates to the unchanged agreements page. The "Create Account" button remains disabled until terms are accepted.

## Glossary

- **Login_Page**: The page at `/login` where returning users authenticate via password or magic link using Clerk
- **Signup_Page**: The page at `/signup` where new users fill out the account creation form and accept terms before submitting
- **Agreements_Page**: The existing terms and conditions page that retains its current white-card, steward-blue themed design with scroll requirement, checkbox, and signature input
- **Fantasy_Background**: A full-screen pixel art background image depicting a village/nature scene in a gaming RPG style
- **Auth_Card**: A centered semi-transparent card overlaying the background that contains the authentication form fields
- **PixelHero_Avatar**: The existing SVG-based pixel art character component located at `src/app/hub/workforce-pathways/components/PixelHero.tsx`
- **Ornate_Border**: A decorative frame element rendered around the viewport edges to evoke a fantasy game UI
- **Golden_Theme**: A warm color palette using steward-gold (#A27532), steward-orange (#DB9B2F), and steward-dark (#21282E) tones for inputs, borders, and accents — matching the existing gaming screens in the workforce pathways section

## Requirements

### Requirement 1: Full-Screen Fantasy Background

**User Story:** As a user, I want to see a full-screen pixel art fantasy background when visiting the login or signup pages, so that the platform feels immersive and game-themed.

#### Acceptance Criteria

1. WHEN the Login_Page loads, THE Fantasy_Background SHALL cover the entire viewport behind all other content
2. WHEN the Signup_Page loads, THE Fantasy_Background SHALL cover the entire viewport behind all other content
3. THE Fantasy_Background SHALL use a CSS-based or image-based pixel art style depicting a nature/village scene with warm tones
4. WHILE the viewport is resized, THE Fantasy_Background SHALL maintain full coverage without distortion using `object-cover` or `background-size: cover` behavior

### Requirement 2: Remove Split-Panel Layout

**User Story:** As a user, I want a single unified full-screen view instead of the corporate split-panel design, so that the gaming theme is consistent across the entire page.

#### Acceptance Criteria

1. WHEN the Login_Page renders, THE Login_Page SHALL display a single full-screen layout without a left branding panel or right form panel separation
2. WHEN the Signup_Page renders, THE Signup_Page SHALL display a single full-screen layout without a left branding panel or right form panel separation
3. THE Login_Page SHALL remove the green branded left panel and the white form right panel
4. THE Signup_Page SHALL remove the green branded left panel and the white form right panel

### Requirement 3: Centered Auth Card with Fantasy Styling

**User Story:** As a user, I want the login and signup forms displayed in a centered card with a warm fantasy game aesthetic, so that the form feels integrated with the gaming theme.

#### Acceptance Criteria

1. THE Auth_Card SHALL be horizontally and vertically centered over the Fantasy_Background on the Login_Page
2. THE Auth_Card SHALL be horizontally and vertically centered over the Fantasy_Background on the Signup_Page
3. THE Auth_Card SHALL have a semi-transparent dark background using steward-dark (#21282E) with reduced opacity
4. THE Auth_Card SHALL have a visible border using the Golden_Theme accent color (steward-gold or steward-orange)
5. THE Auth_Card SHALL have rounded corners consistent with a card UI pattern
6. WHILE the viewport width is below 640px, THE Auth_Card SHALL expand to near-full width with appropriate padding

### Requirement 4: PixelHero Avatar Display

**User Story:** As a user, I want to see a pixel art avatar character near the login/signup form, so that the gaming personality of the platform is immediately visible.

#### Acceptance Criteria

1. WHEN the Login_Page renders, THE Login_Page SHALL display a PixelHero_Avatar above or adjacent to the Auth_Card
2. WHEN the Signup_Page renders, THE Signup_Page SHALL display a PixelHero_Avatar above or adjacent to the Auth_Card
3. THE PixelHero_Avatar SHALL use a fixed default character configuration (form, skin, outfit, hair, hat, gear) that represents the platform brand
4. THE PixelHero_Avatar SHALL be sized appropriately to serve as a visual mascot without overwhelming the form (approximately 80-120px)

### Requirement 5: Golden-Themed Form Inputs

**User Story:** As a user, I want form inputs styled with warm golden tones, so that the form fields match the fantasy game aesthetic.

#### Acceptance Criteria

1. THE Auth_Card input fields SHALL use a dark background with golden-toned borders from the Golden_Theme
2. THE Auth_Card input fields SHALL display placeholder text in a muted golden or warm tone
3. WHEN an input field receives focus, THE Auth_Card input field SHALL highlight with a brighter golden border or glow effect
4. THE Auth_Card primary action buttons SHALL use steward-gold or steward-orange as the background color with contrasting text
5. THE Auth_Card secondary actions (magic link button, links) SHALL use golden or warm-toned text styling

### Requirement 6: Ornate Decorative Border

**User Story:** As a user, I want a decorative ornate border frame around the page edges, so that the screen feels like a game interface window.

#### Acceptance Criteria

1. WHEN the Login_Page renders, THE Ornate_Border SHALL display a decorative frame around the viewport edges
2. WHEN the Signup_Page renders, THE Ornate_Border SHALL display a decorative frame around the viewport edges
3. THE Ornate_Border SHALL use golden or warm tones consistent with the Golden_Theme
4. THE Ornate_Border SHALL use CSS-based styling (borders, gradients, or pseudo-elements) rather than image assets
5. WHILE the viewport width is below 640px, THE Ornate_Border SHALL reduce in size or simplify to avoid consuming excessive screen space on mobile

### Requirement 7: Branding and Logo Placement

**User Story:** As a user, I want to see the StewardWorks branding within the game-themed card, so that I know which platform I am logging into.

#### Acceptance Criteria

1. THE Auth_Card SHALL display the StewardWorks logo or text branding at the top of the card
2. THE Auth_Card branding text SHALL use the font-exo family consistent with the rest of the application
3. THE Auth_Card branding SHALL use white or golden text colors that contrast well against the dark card background

### Requirement 8: Preserve Login Authentication Functionality

**User Story:** As a user, I want all existing login flows to work exactly as before, so that I can still authenticate without issues.

#### Acceptance Criteria

1. THE Login_Page SHALL retain password-based login via Clerk useSignIn hook
2. THE Login_Page SHALL retain magic link login functionality
3. THE Login_Page SHALL retain forgot password flow (email entry, code verification, password reset)
4. THE Login_Page SHALL retain the "Don't have an account? Register" navigation link
5. THE Login_Page SHALL retain error message display for invalid credentials, unverified email, and account-not-found states

### Requirement 9: Signup Flow with Terms Acceptance Navigation

**User Story:** As a user, I want the signup page to show all form fields upfront with an "Accept Terms & Conditions" button that takes me to the agreements page, so that I can review terms and then return to complete registration.

#### Acceptance Criteria

1. WHEN the Signup_Page loads, THE Signup_Page SHALL display the account creation form with first name, last name, phone, email, password, and confirm password fields
2. THE Signup_Page SHALL display an "Accept Terms & Conditions" button or link above the "Create Account" button within the Auth_Card
3. WHEN the user activates the "Accept Terms & Conditions" button, THE Signup_Page SHALL navigate the user to the Agreements_Page
4. WHILE the user has not completed the terms acceptance on the Agreements_Page, THE Signup_Page SHALL keep the "Create Account" button in a disabled state
5. WHEN the user returns from the Agreements_Page after accepting terms, THE Signup_Page SHALL enable the "Create Account" button
6. WHEN the user returns from the Agreements_Page after accepting terms, THE Signup_Page SHALL preserve all previously entered form field values
7. THE Signup_Page SHALL retain email verification link delivery after successful account creation via Clerk useSignUp hook

### Requirement 10: Agreements Page Remains Unchanged

**User Story:** As a user, I want the terms and agreements page to look the same as it currently does, so that the legal content is presented in a clear, familiar format.

#### Acceptance Criteria

1. THE Agreements_Page SHALL retain its current white-card design with steward-blue themed headings
2. THE Agreements_Page SHALL retain the scroll-to-bottom requirement before the checkbox becomes active
3. THE Agreements_Page SHALL retain the checkbox for acknowledging terms
4. THE Agreements_Page SHALL retain the signature input field
5. THE Agreements_Page SHALL retain the accept button that confirms agreement
6. THE Agreements_Page SHALL NOT receive any gaming-themed styling, Fantasy_Background, Ornate_Border, or Golden_Theme modifications

### Requirement 11: Responsive Behavior

**User Story:** As a user on a mobile device, I want the gaming-themed login and signup pages to remain usable and visually appealing, so that the experience works on all screen sizes.

#### Acceptance Criteria

1. WHILE the viewport width is below 640px, THE Auth_Card SHALL use nearly full viewport width with horizontal padding
2. WHILE the viewport width is below 640px, THE PixelHero_Avatar SHALL reduce in size to approximately 60-80px
3. WHILE the viewport width is below 640px, THE Fantasy_Background SHALL remain visible behind the Auth_Card
4. THE Login_Page and Signup_Page SHALL remain scrollable on mobile if content exceeds viewport height
