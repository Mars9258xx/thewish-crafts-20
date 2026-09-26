# Wish Craft — Simple Design Guide

The website now uses one stylesheet: `public/assets/css/site.css`.

## Change the brand colors
Open `public/assets/css/site.css` and edit only the variables at the top:

- `--wc-cream` — page background
- `--wc-pink` — main buttons and brand color
- `--wc-pink-dark` — hover/strong accent
- `--wc-plum` — main text
- `--wc-muted` — secondary text
- `--wc-blush` — soft cards/selected states
- `--wc-lav` — lavender atmosphere

## Change the logo
The professional logo files are:

- `public/assets/brand/wishcraft-mark.svg` — icon/mark
- `public/assets/brand/wishcraft-logo.svg` — full logo

The header automatically uses the mark + text `Wish Craft`.

## Change the background
The soft reference-style background is created in `site.css` with `body::before`, `body::after`, and the four `.wc-atmosphere-orb` elements.

Do not add a large image background unless it is really needed. The CSS version is lighter and works on every page.

## Change animations
Main background movement is controlled by:

- `@keyframes wcBgFloat`
- `@keyframes wcOrb`
- `@keyframes wcCardFloat`
- `@keyframes wcTwinkle`

Keep these slow. Wish Craft should feel calm, not noisy.

## Page structure
- Home: `public/index.html`
- Birthday creator: `public/birthday.html`
- Anniversary creator: `public/anniversary.html`
- Special/Purpose creator: `public/purpose.html`
- Thank-you card: `public/thank-you-card.html`
- Card designer: `public/birthday-card.html`
- Saved wishes: `public/my-wishes.html`
- QR/share page: `public/qr.html`
- About: `public/about.html`
- Contact: `public/contact.html`
- Legal: `public/privacy.html`, `public/terms.html`
- Recipient templates: `public/templates/`

## JavaScript
Keep business logic in the existing small files:

- `shell.js` — header, footer, sound and mobile menu
- `home.js` — homepage reveal
- `creator-shared.js` — creator-page accessibility helpers
- `card-designer.js` — card editor

The old multi-layer CSS and motion/release-patch files were removed from the deployed package to keep the project easier to understand and edit.
