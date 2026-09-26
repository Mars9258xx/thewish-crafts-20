# Wish Craft V19

Production-focused Wish Craft release.

## V19 changes
- 1:1 photo crop/output with a single high-quality WebP encode (adaptive quality, target under ~950 KB when possible).
- Abandoned/orphan photo cleanup without deleting referenced live photos.
- Expired wishes are deleted only after their Storage photo is successfully removed; failures are retained for retry.
- Admin login uses an HttpOnly session cookie; the admin key is not stored in `sessionStorage`.
- Admin dashboard can safely manage Wish Craft data: delete wishes, inspect/delete only unreferenced photo objects, export wish records, view daily traffic/errors, and change operational settings.
- Live/referenced storage photos cannot be directly deleted from the Storage panel; delete the owning wish instead.
- Daily traffic/error aggregates are stored in Supabase and a Telegram daily report is attempted during 23:00–23:59 in `TELEGRAM_TIMEZONE`.
- Contact page contains a deployment-safe support address placeholder replacement; change it to your real mailbox before launch if needed.

## Supabase
Run the complete `supabase-schema.sql` against the existing project. It is additive for the existing Wish Craft tables and adds `admin_daily_metrics` for monitoring.

## Environment
Copy `.env.example` to your deployment environment and set real values. In particular:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `ADMIN_PANEL_KEY`
- `CRON_SECRET`
- `SITE_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_CHAT_IDS`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_TIMEZONE`

Never put Supabase service/secret keys or the admin key in frontend files.

## Deploying on Vercel
This project runs as a single Express app wrapped in one serverless function (`api/index.js`), routed by `vercel.json`.

1. Push this project to a GitHub repo and import it in Vercel ("Other" framework preset — no build command needed).
2. In **Project → Settings → Environment Variables**, add every variable from `.env.example` with real values (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `ADMIN_PANEL_KEY`, `CRON_SECRET`, `SITE_URL=https://thewishcrafts.vercel.app`, etc.). The admin panel will not work until `ADMIN_PANEL_KEY` is set here.
3. Set `TELEGRAM_BOT_IN_SERVER=false` — Vercel functions are serverless, so the Telegram long-polling loop cannot run inside them. Run `npm run bot` as a separate always-on service instead (Render/Railway/VPS), or skip Telegram entirely.
4. `vercel.json` already schedules a daily cron hit to `/api/cron/cleanup` (expired wishes / orphan photo cleanup), since the in-process `setInterval` jobs also don't survive serverless cold starts. Vercel's free (Hobby) plan allows cron jobs to run once a day; upgrade to Pro for more frequent runs.
5. Deploy. Test `/admin` login, `/api/health`, and creating a wish end-to-end before pointing your real domain at it.
