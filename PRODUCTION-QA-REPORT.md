# Wish Craft — Complete Production QA Report

Baseline: `wishcraft-phase-performance-seo.zip` only.

Date: 2026-09-25

## Scope

Full production QA against the original master redesign plan and all completed phases. No new product features were introduced. Fixes were limited to correctness, consistency, privacy/SEO alignment, legacy cleanup, and release-readiness issues discovered during QA.

## 1. PASS

### Product routes / flows
- HOME — route, shell, homepage structure, CTA paths, metadata and responsive layers present.
- CREATE WISH — Birthday, Anniversary and Special Occasion creator routes present with shared creator layer.
- BIRTHDAY — recipient/sender/message/photo/template/preview/save flow remains wired to existing APIs.
- ANNIVERSARY — same preserved flow and direct-link handoff.
- THANK YOU — existing customize/share flow preserved; brand bridge corrected.
- SPECIAL OCCASION — same creator contract preserved.
- PHOTO UPLOAD/CROP — existing `/api/upload-photo` contract and crop flow preserved.
- TEMPLATE — creator template fetch paths remain present; six-page template experiences retained.
- PREVIEW — creator iframe/preview and Card Designer live preview remain present.
- CARD DESIGNER — controls, live preview, photo preview and HD export script remain wired.
- SAVE/CREATE — `/api/save-wish` remains the persistence contract.
- DIRECT `/w/:id` — canonical recipient route remains active.
- SHARED WISH — gift gate, recipient content, share, QR and expiry/not-found states remain implemented.
- SHARE — Web Share/clipboard fallback remains implemented.
- QR — `/qr.html?u=...` handoff remains used by creators and Shared Wish.
- MY WISHES — local saved IDs still resolve through `/api/wishes` and open `/w/:id`.
- ABOUT / CONTACT — unified content-page system remains active.
- 404 — server-side branded browser fallback remains active.

### Backend contracts
- Supabase `wishes` schema fields used by the server match the checked schema.
- Photo storage fields/contracts remain present.
- Expiry cleanup remains present.
- `/share/:id` remains a 301 compatibility redirect to `/w/:id`.
- Admin routes remain isolated from public wish routes.
- Vercel cron cleanup route remains configured.
- `/api/health`, `/api/ui-config`, wish, upload and admin route declarations remain present.

### Accessibility
- 20/20 HTML pages parsed successfully with one main landmark and one H1.
- No duplicate IDs detected.
- No missing static image `alt` attributes detected.
- No unlabeled form controls detected in static audit.
- No positive `tabindex` detected.
- Accessibility, responsive and motion layers are each linked once across all 20 pages.
- Reduced-motion handling remains present.

### SEO / social
- Major pages have title, description and canonical metadata.
- Open Graph and Twitter/X metadata are present on major public pages.
- `/w/:id` remains `noindex,nofollow,noarchive` and sends the same via `X-Robots-Tag`.
- `/w/` remains excluded from robots and sitemap.
- Utility/personal pages remain excluded from indexing.
- Sitemap contains public marketing/content routes only.
- No personal wish URLs were added to sitemap.

### Technical integrity
- `server.js`, `api/index.js`, all project JS files and audit scripts pass `node --check`.
- `vercel.json` parses as valid JSON.
- Static HTTP smoke test returned 200 for all 19 existing static HTML routes tested.
- `/404.html` intentionally does not exist as a static file; the server's branded 404 middleware owns unknown browser routes.
- No obvious internal static href/link target failures detected.
- No suspicious fixed widths >= 1000px detected.
- No standalone malformed `>` lines remain.
- No duplicate accessibility/responsive/motion asset links detected.

## 2. FIXED DURING THIS QA

### Branding consistency
- Privacy and Terms theme-color/legacy pink token moved back to the Phase-2 Rose identity.
- Thank You Card legacy purple/pink tokens and glassy top treatment were aligned to the Phase-2 Rose/Plum system without changing its share/customize behavior.
- Server-side public UI defaults were corrected from the legacy blue/teal/DM Sans defaults to the established Wish Craft Rose/Plum + Plus Jakarta Sans system.
- Removed an unused Cormorant font request from creator pages and replaced the affected subtitle styling with the established UI family.
- Replaced unused Bestie template font dependencies with existing Playfair Display / Dancing Script fonts.
- Repaired the Bestie Google Fonts URL after legacy font cleanup.

### SEO / crawler consistency
- Dynamic `/robots.txt` now matches the static privacy exclusions for `/my-wishes.html` and `/qr.html`.
- Template demo/placeholder pages are explicitly `noindex,nofollow,noarchive`.

### Markup / accessibility correctness
- Bestie template's pre-H1 `h3` secret-code label was converted to an ARIA level-2 heading role so the document outline no longer begins with H3.
- All pages were re-parsed after changes and passed structural checks.

## 3. STILL REMAINING / HONEST LIMITATIONS

### Real browser + Lighthouse
A true Chromium/Lighthouse run was not completed in this isolated QA environment. Earlier browser attempts timed out, and the ZIP intentionally does not contain installed `node_modules`. Therefore this report does **not** claim measured Core Web Vitals, Lighthouse scores, browser console cleanliness, or screen-reader certification.

### Live Supabase verification
The production database credentials are not included in the ZIP. Persistence, expiry, photo storage and admin behavior were verified by source/contract audit, not against the live production Supabase instance.

### External CDN availability
Google Fonts, QRCode.js and html2canvas are external dependencies. Their URLs are syntactically present and referenced correctly, but their live CDN response time was not measured in this environment.

### Experience-specific legacy styling
Some standalone surprise/template experiences intentionally retain their own immersive visual treatment, including gradients, animation and limited glass/blur surfaces. These are contained experience-specific effects rather than global shell styling. They were not randomly redesigned during QA because doing so would change the established wish experiences.

### Advanced Card Designer
The existing Card Designer remains the intentionally scoped reusable foundation: it has live preview and controls but does not include a free-form drag/rotate canvas, cloud asset library, or server-side card persistence. Those were explicitly outside the completed Card Designer phase.

## Original master-plan comparison

1. Audit — PASS
2. Brand identity — PASS
3. Design system — PASS
4. Reusable components — PASS
5. Global navbar/footer — PASS
6. Homepage — PASS
7. Creation flows — PASS
8. Professional Card Designer — PASS (scoped foundation)
9. Shared Wish — PASS
10. About / Contact / 404 / states — PASS
11. Motion system — PASS
12. Responsive/mobile — PASS
13. Accessibility — PASS by static/source audit; live assistive-tech certification remains unverified
14. Performance + SEO — PASS by source/config audit; measured Lighthouse/CWV remains unverified
15. Final production QA — PASS for static/source/route-contract QA; live production integration remains environment-limited

## Release assessment

The codebase is internally consistent and passes the available static, syntax, metadata, route-reference, accessibility and configuration checks. It is **release-candidate quality from the repository/ZIP perspective**, but this QA does not certify live production behavior because the environment could not perform a complete browser/Lighthouse/Supabase integration run.
