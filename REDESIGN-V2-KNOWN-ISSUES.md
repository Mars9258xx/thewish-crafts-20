# Wish Craft — Unified Redesign V2 Known Issues

## No source-level release blockers found
No broken static links, duplicate IDs, missing image alt attributes, or audited legacy brand tokens remain.

## Environment-dependent checks
1. Live Chromium visual sweep could not complete in the execution environment.
2. Lighthouse/Core Web Vitals were not measured against a deployed origin.
3. Live Supabase credentials were not available for authenticated integration testing.
4. External CDN latency was not measured.

These are verification limitations, not identified application defects.
