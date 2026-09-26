# Wish Craft — Final Route & Flow Checklist

Status legend: **PASS** = verified by source/static/route-contract checks in this release environment.

| Route / Flow | Status | Verification |
|---|---|---|
| `/` Home | PASS | Static route smoke + HTML/a11y/asset audit |
| `/birthday.html` | PASS | Static route smoke + creator asset audit |
| `/anniversary.html` | PASS | Static route smoke + creator asset audit |
| `/thank-you-card.html` | PASS | Static route smoke + designer/source audit |
| `/purpose.html` | PASS | Static route smoke + creator asset audit |
| Photo upload | PASS | Existing `/api/upload-photo` contract preserved; JS/source audit |
| Photo crop | PASS | Existing crop flow and accessibility hooks preserved |
| Template selection | PASS | Creator/card-designer source audit |
| Preview | PASS | Creator/card-designer source audit |
| `/birthday-card.html` Card Designer | PASS | Static route smoke + JS syntax + source audit |
| Save/Create | PASS | `/api/save-wish` contract preserved |
| Direct `/w/:id` | PASS | Server route preserved; noindex/privacy controls preserved |
| Shared Wish reveal | PASS | `/w/:id` enhancement path preserved |
| `/share/:id` | PASS | Legacy 301 redirect path preserved |
| Share actions | PASS | Web Share + clipboard fallback source preserved |
| `/qr.html` | PASS | Static route smoke + final visual consistency polish |
| `/my-wishes.html` | PASS | Static route smoke + source audit |
| `/about.html` | PASS | Static route smoke + content-page audit |
| `/contact.html` | PASS | Static route smoke + content-page audit |
| 404 | PASS | Server-owned branded fallback remains intentional; no `/404.html` required |
| `/privacy.html` | PASS | Static route smoke + final token polish |
| `/terms.html` | PASS | Static route smoke + final token polish |
| Birthday templates | PASS | Static route smoke + metadata/a11y/source audit |
| Anniversary template | PASS | Static route smoke + metadata/a11y/source audit |
| Purpose templates | PASS | Static route smoke + metadata/a11y/source audit |
| `/admin` | PASS | Static route smoke + admin palette-only polish |
| `/api/generate-wish` | PASS | Route contract/source preserved |
| `/api/generate-quick-wish` | PASS | Route contract/source preserved |
| `/api/wish-photo` | PASS | Route contract/source preserved |
| `/api/wishes` | PASS | Route contract/source preserved |
| `/api/wish/:id` | PASS | Route contract/source preserved |
| `/api/health` | PASS | Route remains present |
| `/robots.txt` | PASS | Public/private path policy preserved |
| `/sitemap.xml` | PASS | Public marketing routes preserved |

## Backend contract checklist
- Supabase schema/code field mapping: preserved.
- Wish expiry behavior: preserved.
- Photo validation/storage/cleanup: preserved.
- Direct wish URLs: preserved.
- Legacy share redirect: preserved.
- Admin session/settings routes: preserved.
