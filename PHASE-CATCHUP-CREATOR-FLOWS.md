# Wish Craft — Creator Flow Catch-up Phase

## Purpose
Bring Birthday, Anniversary and Special Occasion into one reusable visual creator system while preserving their existing form, template, photo, persistence and direct-link behavior.

## What changed
- Added `public/assets/css/creator-shared.css` as the shared presentation layer for creator pages.
- Added `public/assets/js/creator-shared.js` for non-invasive creator UX/accessibility polish.
- Applied the shared layer to Birthday, Anniversary and Special Occasion (`purpose.html`).
- Added consistent Phase-2 rose theme-color metadata and repaired description metadata on these creator pages.
- Removed the accidental standalone metadata `>` on the affected creator pages.
- Added shared step labels/ARIA labels without taking ownership of the existing wizard logic.
- Thank You Card received the shared creator asset bridge and brand theme metadata; its existing card/customize/share logic was intentionally left intact.

## Preserved contracts
- `/api/upload-photo`
- `/api/save-wish`
- template fetching
- photo crop/zoom logic
- `/w/:id` canonical direct links
- QR/share handoff
- Supabase persistence and existing server behavior

## Deliberate limitation
This phase does **not** introduce the full professional Card Designer yet. That remains the next major product phase, as required by the master roadmap.
