# Wish Craft — Final Polish / Release Changelog

## Release
**Final production polish pass — September 2026**

### Scope
This pass used the latest QA-passed ZIP as the only baseline. No new product features or backend contracts were introduced.

### Visual polish completed
- Preserved the original Phase-2 Wish Craft logo and established rose/plum/gold identity.
- Removed remaining customer-facing legacy neon-pink / teal utility styling from the QR/share page.
- Removed the duplicate QR-page brand block so the global shell is the single source of navigation/brand presentation.
- Unified QR/share page surfaces, buttons, typography, and backgrounds with the established Wish Craft visual language.
- Aligned Privacy Policy and Terms pages with the canonical Phase-2 typography, color tokens, surface treatment, and spacing.
- Polished the admin surface palette to sit closer to the product brand without changing admin behavior.
- Corrected malformed Google Fonts URL parameters on creator pages.
- Rechecked customer-facing legacy font/color tokens after the polish pass.
- Kept experience-specific visual treatments intact where they are intentional parts of a wish/template experience; no broad visual rewrite was performed.

### Functionality preserved
- Creation flows and form behavior.
- Photo upload/crop handling.
- Template selection and preview behavior.
- Card Designer behavior and export flow.
- Direct `/w/:id` recipient experience.
- Legacy `/share/:id` redirect.
- QR/share actions.
- My Wishes.
- Supabase field/route contracts.
- Expiry and photo lifecycle logic.
- Admin routes and settings.

### Verification
- 20 HTML pages audited.
- 0 static structural issues in final audit.
- 0 duplicate IDs detected.
- 0 missing image `alt` attributes detected.
- 0 broken local HTML links detected.
- 20/20 pages contain exactly one `a11y.css`, `responsive.css`, `motion.css`, `a11y.js`, `shell.js`, and `motion.js` reference.
- `server.js` syntax check passed.
- All project JavaScript syntax checks passed.
- `vercel.json` and `package.json` parsed successfully.
- No suspicious fixed widths >= 1000px found.
- No standalone `>` artifact lines found.
- Static HTTP smoke test returned HTTP 200 for all 20 existing HTML routes.
- Dynamic Express/Supabase/Lighthouse/browser verification remains environment-dependent and is documented in the known-issues file.
