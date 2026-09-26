# Wish Craft — Creator Pages Polish Pass

## Scope

This corrective pass focused only on the existing Birthday, Anniversary and Special Occasion creator pages. No new product capability or backend contract was introduced.

## Problems found

- The three creator pages were still visually closer to an earlier wizard-only layout than the final Wish Craft marketing/product system.
- They had a duplicated, page-specific footer card and designer credit instead of relying cleanly on the global shell footer.
- The pages lacked supporting product information beneath the creation flow, making the page feel unfinished after the wizard.
- Birthday, Anniversary and Purpose used slightly different/legacy accent tokens in inline CSS rather than the exact Phase-2 brand tokens.
- Birthday's subtitle was weak/incomplete (`Create a Beautiful birthday`).
- The Birthday premium layer still contained the earlier accent values.

## Fixes

- Added a shared `creator-marketing.css` layer for all three pages.
- Added polished below-the-fold sections:
  - occasion-specific introduction
  - three benefit cards
  - three-step "How it comes together" section
  - trust/experience highlights
- Removed the duplicate page-specific footer card/designer credit so the global Wish Craft footer is the single footer system.
- Updated creator-page accent values to the Phase-2 Rose/Plum system.
- Improved all three hero subtitles.
- Kept the established wizard, photo upload/crop, template selection, preview, save/create and sharing logic unchanged.
- Preserved the original Phase-2 logo.

## Verification

- Birthday: creator polish checks PASS
- Anniversary: creator polish checks PASS
- Purpose: creator polish checks PASS
- All three: exactly one H1 and one main landmark
- All three: no duplicate legacy page footer
- All three: shared creator marketing stylesheet loaded once
- Project JavaScript syntax checks PASS
- JSON config checks PASS
- Static HTML route smoke test PASS for all existing root HTML files

## Intentionally not changed

- Supabase/backend contracts
- wish persistence and expiry
- photo upload/crop behavior
- template rendering
- `/w/:id` direct wish URLs
- `/share/:id` legacy redirect
- Card Designer
- global navigation architecture
- existing recipient/shared-wish experience

## Result

The three creator pages now have a complete product-page rhythm: hero → guided creation → preview → product explanation → how it works → trust highlights → global footer. This addresses the previously unfinished-looking lower-page area without introducing unnecessary features.
