# Wish Craft — Production Performance, SEO & Social Sharing Pass

Baseline: latest Accessibility ZIP only.

## Implemented

### Performance
- Deferred non-critical first-party JavaScript on public pages (`shell.js`, `a11y.js`, `motion.js`, creator-shared/home scripts where applicable).
- Deferred ad configuration/scripts without changing creator inline execution order.
- Consolidated legacy `DM Sans` references to the established `Plus Jakarta Sans` UI family where safe, reducing unnecessary font-family requests.
- Preserved `Dancing Script` only where the existing experience actually uses the handwritten visual language.
- Kept `font-display=swap` on Google Fonts requests.
- Existing important recipient memory images remain eager because they are part of the shared-wish reveal/LCP experience; creator preview images use lazy loading where appropriate.
- Added long-lived immutable caching for versioned static assets, favicon and OG image through `vercel.json`.
- Added a one-day cache policy for the web manifest.
- Removed duplicate doctype artifacts found in legacy pages.
- Repaired malformed legacy metadata in Privacy, Terms and QR pages.
- Did not remove reusable CSS/JS architecture simply because some components are not used on every route; shared design-system files remain available for the component system.

### SEO
- Normalized unique page titles and descriptions on all major public routes.
- Normalized canonical URLs to the production origin.
- Added consistent `robots` directives.
- Marked `my-wishes.html` and `qr.html` as `noindex,nofollow,noarchive` because they are utility/personal-state pages rather than search landing pages.
- Template demo pages containing placeholder tokens are also noindex.
- Added WebSite JSON-LD structured data to the homepage.
- Normalized static and dynamic sitemap contents.
- Removed utility/private-state pages from the sitemap.
- Kept `/admin/`, `/api/`, and `/w/` out of crawl discovery.

### Social Sharing
- Standardized Open Graph title, description, URL, image, dimensions and image alt metadata on major public pages.
- Standardized Twitter/X `summary_large_image` metadata.
- Added dynamic social metadata to `/w/:id` while keeping the route `noindex,nofollow,noarchive`.
- Dynamic `/w/:id` social preview deliberately uses generic copy and the shared Wish Craft OG image rather than exposing the private message/content in metadata.
- Canonical share behavior remains `/w/:id`; `/share/:id` remains the legacy redirect.

## Privacy / private wish protection

Recipient wish URLs remain excluded from search indexing:
- `X-Robots-Tag: noindex, nofollow, noarchive` on dynamic `/w/:id` responses.
- `robots.txt` disallows `/w/`.
- `/w/` is not present in the sitemap.
- `/share/:id` is a legacy redirect to `/w/:id`, not a separate indexable experience.

Social previews still work because `/w/:id` receives Open Graph/Twitter metadata while retaining the noindex directives.

## Technical verification

- 20 HTML routes/files audited.
- HTML metadata audit: PASS.
- No malformed `<meta <link...>` artifacts remain.
- Duplicate legacy doctype artifacts removed.
- Canonical/description/social metadata audit: PASS for indexable major routes.
- Noindex utility/template audit: PASS.
- Static sitemap does not contain `/w/`: PASS.
- robots.txt contains `/w/` disallow: PASS.
- Dynamic sitemap list matches the public sitemap intent: PASS.
- `server.js` syntax: PASS.
- All project JavaScript syntax checks: PASS.
- Cache headers present in `vercel.json`: PASS.
- Duplicate CSS links per page: PASS.
- Existing backend route names/contracts were not changed.

## Environment limitation

The ZIP does not contain installed `node_modules`, so a full production browser/Lighthouse run and a live Supabase-backed `/w/:id` integration test cannot be truthfully claimed from this offline build environment. Static/source-level verification and JavaScript syntax verification were completed successfully.
