# Wish Craft — Final Known Issues / Verification Boundaries

## No known source-level release blockers
The final static/source/route audit found no unresolved release-blocking issue in the project files.

## Environment-dependent verification boundaries
1. **Live browser pixel verification:** A full Chromium visual run was not reliable in the execution environment used for prior QA. The final release pass therefore relies on the completed responsive/accessibility/source audits and static HTTP smoke checks rather than claiming a live visual certification.
2. **Lighthouse / Core Web Vitals:** A real Lighthouse run against the deployed site was not performed in this environment. Performance improvements were verified from source/configuration, not from live CWV measurements.
3. **Live Supabase integration:** Production Supabase credentials are intentionally not bundled with the ZIP, so database writes/reads cannot be authenticated from this environment. Route contracts and schema/code consistency were verified.
4. **Third-party CDN availability:** Google Fonts and the QRCode CDN are external dependencies; their live latency/availability was not measured here.

These are verification-environment boundaries, not identified code defects.
