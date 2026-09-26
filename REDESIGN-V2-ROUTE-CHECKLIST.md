# Wish Craft — Unified Redesign V2 Route Checklist

| Route | Surface | Status |
|---|---|---|
| `/` | Homepage | PASS |
| `/birthday.html` | Birthday creator | PASS |
| `/anniversary.html` | Anniversary creator | PASS |
| `/purpose.html` | Special Occasion creator | PASS |
| `/thank-you-card.html` | Thank You card | PASS |
| `/birthday-card.html` | Card Studio | PASS |
| `/my-wishes.html` | Saved wishes | PASS |
| `/qr.html` | Share / QR | PASS |
| `/about.html` | About | PASS |
| `/contact.html` | Contact | PASS |
| `/privacy.html` | Privacy | PASS |
| `/terms.html` | Terms | PASS |
| `/admin/index.html` | Admin | PASS |
| `/templates/birthday/bestfriend.html` | Recipient template | PASS |
| `/templates/birthday/boyfriend.html` | Recipient template | PASS |
| `/templates/birthday/girlfriend.html` | Recipient template | PASS |
| `/templates/birthday/bestie.html` | Recipient template | PASS |
| `/templates/anniversary/anniversary.html` | Recipient template | PASS |
| `/templates/purpose/for-boy.html` | Recipient template | PASS |
| `/templates/purpose/for-girl.html` | Recipient template | PASS |
| `/w/:id` | Dynamic shared wish | Preserved / server-owned |
| `/share/:id` | Legacy redirect | Preserved / server-owned |
| `/404` / unknown HTML route | Branded server fallback | Preserved |

## Flow checklist
- Home → Create Wish: PASS
- Birthday → recipient → sender → message/photo → template → preview → create: PASS by preserved existing JS/IDs
- Anniversary flow: PASS by preserved existing JS/IDs
- Special Occasion flow: PASS by preserved existing JS/IDs
- Photo crop modal: preserved
- Direct `/w/:id`: preserved
- Legacy `/share/:id`: preserved
- QR generation/share/download: preserved
- My Wishes local storage + API loading: preserved
- Card Studio live preview/export: preserved
- Shared Wish reveal/share/QR: preserved
