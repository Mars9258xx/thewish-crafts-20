# Wish Craft — Accessibility Phase Report

Baseline: `wishcraft-phase-responsive-mobile.zip` only.

## Scope

A complete accessibility pass was applied across the 20-page frontend surface, including creator flows, Card Designer, Shared Wish templates, content pages, QR utility, My Wishes, legal pages, and admin UI.

## Improvements implemented

### Semantic structure
- Added a consistent `<main id="main-content">` landmark where legacy pages/templates did not have one.
- Kept global shell header/footer outside the main landmark.
- Normalized major heading hierarchy and removed the accidental multiple-H1 case in the Bestie template.
- Added semantic navigation for mobile shell and Shared Wish action tools.
- Added progress/list semantics to creator wizard indicators.
- Added progressbar semantics to six-page surprise experiences.

### Keyboard navigation + focus
- Added a visible Skip to main content link on every page.
- Added consistent `:focus-visible` treatment without changing the established brand system.
- Added 44px minimum interactive touch targets where appropriate.
- Mobile drawer now moves focus into the drawer, traps Tab focus while open, closes on Escape, and restores focus to the trigger.
- Photo crop dialogs receive focus, trap Tab focus, close on Escape, and restore focus after closing.
- Creator preview transitions move focus to the relevant Edit control instead of leaving keyboard users inside hidden content.
- Removed the legacy `user-scalable=no` viewport restriction.

### Forms and labels
- Associated creator labels with Recipient, Sender, Message, Photo and related controls.
- Added accessible naming to Card Designer controls and admin inputs.
- Added accessible name/state handling for range controls.
- Added fieldset/legend semantics to Card Designer theme, alignment and sticker selectors.
- Selector buttons expose `aria-pressed` state.

### Dialogs and drawers
- Photo crop dialog has `aria-modal`, labelled title/description, focus management, Escape handling, and a keyboard trap.
- Shared Wish gift opening is now a real modal interaction for assistive technology: labelled, described, focus-contained, and inert-background protected until opened.
- Mobile navigation has an explicit navigation landmark and focus management.

### Images
- Audited all static `<img>` elements for missing alt attributes.
- Added meaningful preview/logo/photo alt text where appropriate.
- Added a server-side fallback alt for recipient HTML images that arrive without an alt attribute.

### Error/loading/status meaning
- Added a shared live-region utility for asynchronous status announcements.
- Preserved existing loading, success, empty and error states while making dynamic regions announceable.
- My Wishes/admin dynamic regions now expose polite live updates.
- Creator wizard step changes announce the current step.
- Existing alert-based validation/error flows remain functional; invalid fields retain their visual error treatment.

### Color contrast
- Kept the Rose/Plum identity but introduced a slightly deeper Rose action surface (`#B84F6D`) for white-text primary controls where the previous Rose surface was too light for normal-size text.
- Focus indicators use a high-visibility Rose/Plum outline.
- Added a `prefers-contrast: more` refinement.

### Reduced motion
- Preserved and strengthened `prefers-reduced-motion` handling across the accessibility layer.
- Six-page surprise navigation now uses instant scrolling when reduced motion is requested.
- Shared Wish reveal already had reduced-motion support; the accessibility pass keeps that behavior intact.

## Verification

- 20/20 HTML pages include exactly one accessibility CSS link.
- 20/20 HTML pages include exactly one accessibility JS layer.
- 20/20 HTML pages include the responsive layer exactly once.
- Static audit: no missing main landmark, no missing H1, no multiple-H1 cases, no missing static image alt, no unlabeled form controls, no empty buttons, and no duplicate IDs detected.
- Heading hierarchy audit: no remaining heading-level jumps on the 20-page frontend.
- No positive `tabindex` values detected.
- No remaining `user-scalable=no` viewport restriction.
- JavaScript syntax checks passed for all project JS files and `server.js`.
- Local HTTP smoke check returned HTTP 200 for the audited static routes.
- `/w/:id`, `/share/:id`, Supabase persistence, photo proxy/storage, expiry, and creator save contracts were not rewritten.

## Environment limitation

A Chromium headless DOM smoke run was attempted, but the local environment timed out while loading pages (likely due the browser/runtime environment and external assets). Therefore this phase does **not** claim a successful real-browser screen-reader or pixel-level accessibility certification. The static DOM/source audit and local HTTP route checks completed successfully.

## Visual identity

No new visual redesign was introduced. The Phase-2 logo, Rose/Plum palette, typography, premium backgrounds, motion language, responsive system, Card Designer, and Shared Wish experience remain the baseline.
