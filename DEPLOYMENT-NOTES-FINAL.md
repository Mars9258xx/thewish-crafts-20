# Wish Craft — Final Deployment Notes

## 1. Deploy the ZIP contents
Deploy the contents of this release package as the application source. Keep the existing project structure intact.

## 2. Required environment configuration
Use the existing `.env.example` as the source of required variable names. In production, configure at minimum the Supabase URL/key and the existing application/admin settings required by the current deployment.

Do **not** commit real secrets into the repository or ZIP.

## 3. Vercel / server behavior
- `vercel.json` is valid and retains the existing API rewrite.
- Static assets under `/assets/` retain long-lived immutable caching.
- The application keeps the existing Express route contracts.
- `/w/:id` remains the canonical recipient URL.
- `/share/:id` remains the compatibility redirect.

## 4. Post-deploy smoke test
After deployment, manually verify:
1. Home loads.
2. Create a Birthday wish.
3. Create an Anniversary wish.
4. Create a Thank You card.
5. Create a Special Occasion wish.
6. Upload/crop a photo.
7. Select a template and preview.
8. Save/create a wish.
9. Open the generated `/w/:id` URL in a fresh/private browser window.
10. Open `/share/:id` and confirm it redirects to `/w/:id`.
11. Test Web Share on a supported mobile browser and clipboard fallback on desktop.
12. Generate/open QR from the share page.
13. Open My Wishes.
14. Check About, Contact, Privacy, Terms.
15. Visit a nonexistent route and confirm the branded 404 response.
16. Check `/api/health`.
17. Confirm Supabase persistence and expiry in the production project.

## 5. Privacy / indexing
Recipient wish URLs remain intentionally excluded from indexing via robots/noindex controls. Do not remove these controls unless product requirements explicitly change.

## 6. Cache note
Because `/assets/` uses immutable caching, if a future release replaces an existing asset at the same path, prefer versioned asset filenames or a cache-busting strategy rather than relying on users to hard-refresh.
