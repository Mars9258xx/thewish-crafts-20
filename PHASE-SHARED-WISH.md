# Wish Craft — Shared Wish / Recipient Experience

## Phase goal
Transform the canonical `/w/:id` recipient route into a premium digital-gift experience without changing the stored wish HTML, Supabase schema, persistence, expiry logic, photo storage, QR flow, or creator save flow.

## Implemented
- Canonical `/w/:id` remains unchanged as the recipient URL.
- Existing saved wish HTML is preserved and enhanced at response time.
- Occasion-aware reveal mood for birthday/friend, anniversary/love, gratitude/thank-you, and general occasions.
- Full-screen anticipation gate with the original Phase-2 Wish Craft logo.
- Accessible gift-opening interaction with keyboard support.
- Premium gift reveal overlay and reduced-motion fallback.
- Recipient name personalization in the opening and closing experience.
- Existing wish content, including sender/message/template output, remains the source of truth.
- Uploaded recipient photo is preserved; if the saved wish does not already render the photo, a dedicated memory-photo section is added.
- Closing emotional section.
- Share action using Web Share API with clipboard fallback.
- QR action routes to the existing `/qr.html?u=...` flow using the canonical direct URL.
- Mobile-first controls and responsive desktop presentation.
- Accessibility semantics, visible focus, keyboard interaction, and `prefers-reduced-motion` handling.
- Premium 404 and expired-wish states.
- Recipient route remains `noindex,nofollow,noarchive`.
- Backend/Supabase contracts were not rewritten.

## Verification performed
- `node --check server.js` passes.
- Existing `/w/:id` route and `/share/:id` legacy redirect remain present.
- Existing `/api/wish/:id` and photo proxy remain untouched.
- Existing creator save routes remain untouched.
- No `share.html` gateway was reintroduced.

## Intentionally not changed
- Supabase schema
- Wish persistence
- Expiry/cleanup rules
- Photo upload/storage/delete contracts
- Creator flows
- Card Designer
- QR page implementation

## Next planned phase
About / Contact / 404 / loading / empty / success / error state consistency across the rest of the website, followed by motion, mobile, accessibility, performance/SEO and final QA.
