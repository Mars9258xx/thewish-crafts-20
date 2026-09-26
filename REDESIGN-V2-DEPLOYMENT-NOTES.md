# Wish Craft — Unified Redesign V2 Deployment Notes

1. Deploy the contents of this ZIP using the existing Vercel/server deployment setup.
2. Keep the existing environment variables and Supabase configuration unchanged.
3. Do not remove the `public/assets/brand/` files; the Phase-2 logo is referenced by the global shell and recipient experiences.
4. Keep `server.js`, `api/`, `supabase-schema.sql`, and existing storage configuration intact.
5. After deployment, perform a real-device smoke test on:
   - `/`
   - `/birthday.html`
   - `/anniversary.html`
   - `/purpose.html`
   - `/birthday-card.html`
   - `/qr.html`
   - a newly created `/w/:id`
   - `/my-wishes.html`
6. Verify one complete photo-upload flow and one share/QR flow with real Supabase credentials.
7. Run Lighthouse on the deployed origin for mobile and desktop.
