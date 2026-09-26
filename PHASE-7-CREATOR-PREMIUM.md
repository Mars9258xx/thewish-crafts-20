# Wish Craft — Phase 7: Birthday Creator + Premium Background Atmosphere

## What changed
- Upgraded the homepage background from a mostly flat/light treatment to a restrained editorial atmosphere: soft rose/plum/gold aura layers, fine paper-like dot texture, subtle vignette and section ornaments.
- Added a reusable `creator-premium.css` visual layer for the birthday creation flow.
- Birthday creator now has a more premium canvas, refined depth, subtle texture, improved panel treatment and more intentional spacing.
- Kept the Phase 2 Wish Craft logo direction.
- Existing birthday wizard JavaScript, photo cropper, template data, preview iframe, create/share behavior and backend contracts were not rewritten.
- Added reduced-motion-safe styling through the existing global system.

## Files
- `public/assets/css/home.css` — Phase 7 background atmosphere.
- `public/assets/css/creator-premium.css` — reusable creator visual layer.
- `public/birthday.html` — only linked the new visual layer and added a semantic page class.

## Design direction
The background is intentionally **not a loud gradient**. It uses:
1. warm off-white base
2. restrained rose/plum/gold radial light
3. very subtle paper/dot texture
4. soft depth around the main content
5. minimal circular ornaments

This keeps Wish Craft cute and emotional while making it feel more like a polished product rather than a simple pastel webpage.

## Preserved
- Supabase/API/server files
- birthday form fields
- template selection
- photo upload/crop flow
- preview generation
- create/share flow
- existing routes
