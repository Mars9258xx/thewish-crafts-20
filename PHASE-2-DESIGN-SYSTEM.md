# Wish Craft — Phase 2: Brand Identity & Design System

## Direction

Wish Craft should feel like a **beautiful little place made for celebrating people**.

The visual balance is:

**cute + elegant + warm + premium + modern**

The system deliberately moves away from the current mix of purple/pink gradients, many unrelated fonts, and page-specific styling.

## Brand idea

The core visual metaphor is a **personal message inside a greeting card**, with a small celebratory sparkle.

The new mark combines:
- a folded greeting-card envelope
- a subtle sparkle
- warm rose/plum color
- a soft paper-like background

Assets:
- `public/assets/brand/wishcraft-logo.svg`
- `public/assets/brand/wishcraft-mark.svg`

## Color system

### Core
- Rose: #E76F8E
- Deep Rose: #D95E7F
- Plum: #A85C86
- Deep Plum: #3A2630
- Warm Gold: #D89A57

### Surfaces
- Background: #FFFCFC
- Soft Rose Surface: #FFF7F8
- Soft Plum Surface: #FAF7FA
- White: #FFFFFF

### Text
- Primary: #2D2026
- Strong: #3A2630
- Muted: #786A71
- Subtle: #9A8C92

### Semantic
Success, warning, error and info each have dedicated foreground/background tokens.

## Typography

The website will standardize around three roles:

1. **Plus Jakarta Sans** — navigation, UI, forms, body
2. **Playfair Display** — emotional/display headings
3. **Dancing Script** — optional accent for special wish moments only

Important: the script font is not a general UI font. It should remain rare so it feels special.

## Shape language

Cards and surfaces use:
- small radius for compact controls
- medium radius for inputs/buttons
- large radius for cards
- extra-large radius for emotional hero/premium surfaces
- pill only for compact tags/chips

## Shadow language

Shadows are soft and warm, not black/heavy.

Use:
- XS for controls
- SM for cards
- MD for floating panels
- LG only for hero/major overlays

## Motion language

Three speeds:
- Fast: micro feedback
- Normal: UI transitions
- Slow: emotional reveals

Motion uses transforms and opacity first.

Occasion-specific motion will be added later:
- Birthday: confetti/balloon/sparkle
- Anniversary: glow/soft hearts
- Thank You: warm sparkle
- General: paper/card movement

All motion must respect `prefers-reduced-motion`.

## Implementation rule

Phase 2 only establishes the visual foundation. Existing pages should not yet be globally rewritten.

Phase 3 will consume these tokens to build reusable UI primitives and the shared site shell.
