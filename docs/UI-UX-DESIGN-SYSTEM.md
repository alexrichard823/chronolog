# Chronolog UI/UX Direction & Core Design System

Status: Approved baseline for the Chronolog UI/UX Revamp
Scope: UX-01 and UX-02 only

This document establishes the shared visual and interaction direction for the Chronolog UI/UX Revamp. It does not redesign individual product screens. Later UX tasks should consume this foundation rather than inventing page-specific visual rules.

## UX-01 — UI Direction & Design Principles

### Product feel

Chronolog should feel like a **modern private family archive**: warm, calm, trustworthy, personal, and easy to understand.

The interface should support the emotional weight of family stories without becoming decorative, nostalgic, or antique-looking. It should feel contemporary enough to be credible as a long-lived digital product while remaining welcoming to older and less technical family members.

### Reference-product lessons

Chronolog can borrow interaction lessons from products the team already finds intuitive:

- **Function Health:** calm information hierarchy, generous whitespace, clear grouping, restrained visual noise.
- **Suppco:** clean surfaces, approachable health/wellness polish, strong scanability.
- **Instagram:** familiar content browsing, simple repeated patterns, strong media presentation.
- **Facebook:** recognizable family/social navigation patterns and low learning curve for a broad age range.

These are references for usability and hierarchy, not products to visually clone. Chronolog is not a social feed and should not introduce likes, comments, engagement mechanics, public profiles, or other excluded social features.

### Core design principles

1. **Story first.** The interface should make people, stories, photographs, recordings, and meaningful events feel primary. Metadata and controls support the content rather than competing with it.
2. **Familiar before clever.** Use standard navigation, tabs, cards, forms, menus, and dialogs. Avoid novel interaction patterns that require explanation.
3. **One clear next action.** Each page should have one obvious primary action when the user's role permits it. Secondary actions should be visually quieter.
4. **Private and trustworthy.** Permission-sensitive and destructive actions must be clear. The interface must never imply access that the backend does not grant.
5. **Simple across generations.** Use readable type, generous hit areas, plain labels, visible form labels, obvious states, and predictable navigation.
6. **Connected context.** People, stories, events, media, timeline entries, and tree nodes should consistently link back to each other so the archive never feels fragmented.
7. **Quiet visual hierarchy.** Prefer spacing, typography, and grouping over heavy borders, saturated color, or excessive shadows.
8. **Warm, not antique.** Use warm neutrals and a deep evergreen primary color to give Chronolog identity without faux-paper textures, sepia effects, ornamental genealogy styling, or visual clutter.
9. **Content density by task.** Browsing views can be moderately dense; reading and editing views should be calmer and wider-spaced. Do not force the same density everywhere.
10. **Responsive by design.** Desktop and mobile should use the same information architecture, not separate products.

### Navigation philosophy

The approved family-level model remains:

- Home
- People
- Timeline
- Tree

These destinations should become persistent in UX-03 so users can jump between the main family experiences without retracing their path.

Desktop direction: persistent left-side app navigation with the family context clearly visible.

Mobile direction: compact persistent navigation, favoring a bottom-navigation pattern for the primary destinations where practical.

Contextual actions remain separate from navigation. The existing **Add** pattern should continue to offer relevant creation actions and should pre-link the current family and selected person when applicable.

Archive/media, members, settings, account controls, and other secondary destinations should remain available without overcrowding the primary navigation.

### Shared person context

Person Profile, Timeline, and Tree should continue to share a selected-person context where applicable. The URL should remain the durable source of that context when possible so browser navigation and shareable in-family links work correctly.

### Interaction patterns

- Use cards for discrete stories, people, events, media items, and summary modules.
- Use tabs only when views are closely related and switching does not change the user's larger location.
- Use dialogs for short, contained confirmation or selection tasks; use full pages for substantial creation/editing workflows.
- Put destructive actions away from primary actions and style them consistently as destructive.
- Keep permission-restricted controls hidden or disabled only as a usability layer; backend/database authorization remains authoritative.
- Prefer inline validation and status messages close to the affected form or action.
- Never rely on color alone to communicate status.

### Typography direction

Chronolog uses system fonts to remain fast, stable, and dependency-light.

- **Primary UI:** system sans-serif for navigation, controls, headings, metadata, and forms.
- **Long-form story reading:** system serif is available as a restrained editorial accent where it improves reading, but should not be used for navigation or dense interface chrome.

Type hierarchy should be obvious without oversized display text. Most screens should use restrained headings and let family content carry the visual emphasis.

### Visual density

- Default to comfortable spacing and 44px-class interactive controls.
- Avoid giant dashboard cards that show very little information.
- Avoid cramped tables/forms where a family member must precisely target small controls.
- Use whitespace to separate concepts, not to create excessive scrolling with no informational benefit.

### Desktop/mobile behavior

- Mobile is not a reduced-function version of Chronolog.
- Primary actions must remain reachable without horizontal scrolling.
- Multi-column layouts collapse to one column in a meaningful order.
- Important contextual actions remain visible rather than disappearing behind hover-only behavior.
- Tree and timeline interactions may use specialized responsive controls, but their navigation and selected-person context remain consistent with the rest of the product.

## UX-02 — Core Design System

### Color system

The implementation lives in `src/app/globals.css` and exposes semantic Tailwind colors.

| Token | Purpose |
| --- | --- |
| `background` | Warm app canvas |
| `surface` | Primary cards, dialogs, form surfaces |
| `surface-muted` | Quiet grouped areas and secondary surfaces |
| `foreground` | Primary text |
| `muted`, `muted-strong` | Secondary text and low-emphasis controls |
| `border`, `border-strong` | Standard and emphasized separators |
| `primary`, `primary-hover`, `primary-soft` | Chronolog evergreen action/brand family |
| `success`, `warning`, `danger`, `info` | Semantic feedback states |

Do not add arbitrary hex colors in page files when a semantic token already fits the purpose.

The approved UX-03 follow-up uses the white `surface` color for all major boxed content: summaries, filters, directories, profiles, content details, settings, and form groups. Use `Card` or `bg-surface` on those containers so the warm page canvas remains visible around them. Reserve muted surfaces for small supporting elements and keep semantic feedback colors for alerts.

### Typography

- UI font: system sans-serif.
- Story-reading font: system serif via `font-serif` or `.ui-story-copy`.
- Body copy should normally remain 16px-class text with comfortable line height.
- Metadata and helper text may use smaller text but should remain readable.

### Spacing

Use Tailwind's spacing scale consistently. Preferred common gaps/padding:

- 4 / 8px: tight icon or metadata relationships.
- 12 / 16px: controls, compact cards, grouped text.
- 24px: standard card and section padding.
- 32px: larger section separation.
- 48px+: major page regions only.

Avoid one-off spacing values unless a component genuinely requires them.

### Borders and radii

- Inputs and buttons: medium radius.
- Cards: large radius.
- Large dialogs/high-emphasis surfaces: extra-large radius.
- Pills/badges: fully rounded.
- Borders should usually be one pixel and low contrast.

### Shadows

Shadows are intentionally restrained:

- `shadow-xs`: subtle card lift.
- `shadow-sm`: elevated control/popover use.
- `shadow-md`: dialogs or genuinely elevated overlays.

Do not use deep drop shadows as general decoration.

### Page widths

Reusable page containers:

- `.ui-page-narrow` / `PageContainer width="narrow"`: forms, reading, settings.
- `.ui-page` / default `PageContainer`: most application pages.
- `.ui-page-wide` / `PageContainer width="wide"`: tree, timeline, archive grids, richer dashboards.

These define content bounds only. UX-05 will standardize page headers and page-level structure.

### Buttons

Use the shared `Button` and `ButtonLink` components in `src/components/ui.tsx`.

Variants:

- `primary`: the one main action on a page/section.
- `secondary`: normal alternate actions.
- `ghost`: low-emphasis navigation or tertiary actions.
- `danger`: destructive actions only.

Sizes:

- `sm`: compact secondary controls.
- `md`: default.
- `lg`: high-emphasis primary actions where additional prominence is justified.

Avoid multiple primary buttons competing in the same action group.

### Cards

Use `Card` for reusable content/surface grouping. Standard cards are white with a quiet border and minimal shadow. The `muted` variant is for low-emphasis grouped content, not for every other card in a grid.

### Form controls

Use `Input`, `Select`, `Textarea`, and `Field` from `src/components/ui.tsx`.

Rules:

- Always show a visible label.
- Use hint text only when it helps a user succeed.
- Show errors next to the affected field where possible.
- Preserve plain-language error copy.
- Keep controls large enough for touch use.

### Badges

Use `Badge` for compact metadata or state labels such as roles, draft/status markers, or uncertainty indicators.

Available variants:

- neutral
- primary
- success
- warning
- danger

Badges should not replace explanatory text when the meaning would be unclear.

### Dialogs

`.ui-dialog` defines the shared visual surface for native or accessible dialog implementations. Dialog behavior should be implemented only when a workflow needs it; this task intentionally does not add a global modal framework.

Dialogs should:

- have a clear title,
- explain consequences before destructive actions,
- provide an obvious cancel path,
- trap/focus correctly when interactive behavior is implemented,
- never contain a long multi-step form better suited to a page.

### Icons

Chronolog does not add an icon-library dependency in UX-02. This avoids unnecessary package churn before the actual navigation/components require a final icon set.

Shared icon sizing classes are available:

- `.ui-icon-sm`
- `.ui-icon-md`
- `.ui-icon-lg`

When UX-03 selects the navigation icon set, icons should use consistent stroke weight and be paired with text labels where ambiguity is possible.

### Reusable implementation

Core primitives live in:

- `src/app/globals.css` — semantic design tokens and shared component styles.
- `src/components/ui.tsx` — Button, ButtonLink, Card, Badge, Input, Select, Textarea, Field, PageContainer, Divider.

Later revamp tasks should reuse these primitives and extend them only when a recurring product pattern is proven. Do not build a second parallel design system inside feature folders.

## Accessibility baseline

The design system establishes the following baseline for all later revamp work:

- visible focus rings,
- touch-friendly control heights,
- semantic success/warning/danger colors with text/icon reinforcement,
- readable contrast,
- visible form labels,
- reduced-motion support,
- responsive page padding,
- no hover-only critical actions.

UX-15 remains the dedicated accessibility/usability pass and should validate the completed interface end to end.

## Task boundaries

UX-01 and UX-02 do **not** redesign the dashboard, navigation shell, people directory, profile, timeline, tree, archive, or forms. Those are later tasks in the UI/UX Revamp backlog.

The intended sequencing is:

1. UX-01 establishes the direction.
2. UX-02 creates the reusable visual foundation.
3. UX-03 onward applies that foundation to real product screens.

## Acceptance

### UX-01 is complete when

- Navigation philosophy is explicit.
- Visual tone and reference-product lessons are explicit.
- Desktop/mobile behavior is explicit.
- Primary interaction patterns are explicit.
- The direction preserves PRD functionality, privacy, roles, and connected family-history behavior.

### UX-02 is complete when

- Shared semantic colors, typography, spacing guidance, borders, radii, shadows, and page widths are defined.
- Buttons, cards, form controls, badges, dialog styling, and icon sizing have shared rules.
- Reusable React primitives exist for the core recurring controls/surfaces.
- Future pages can be redesigned without inventing page-specific visual systems.
