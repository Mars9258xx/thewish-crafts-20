# Wish Craft — Phase 8: Direct Wish Links

## What changed
- Removed the `share.html` intermediate recipient gateway from the public frontend.
- New wishes now use the direct recipient URL: `/w/:id`.
- Birthday, Anniversary, and Purpose creators send the QR/share flow the direct wish URL.
- Existing `/share/:id` links remain backward compatible and now 301 redirect to `/w/:id`.
- Backend persistence, expiry, photo handling, and recipient rendering remain intact.

## User journey
Create wish → save → direct `/w/:id` → recipient sees the wish immediately.

## Important
The `/w/:id` route remains the canonical recipient experience. The old `share.html` file is intentionally removed.
