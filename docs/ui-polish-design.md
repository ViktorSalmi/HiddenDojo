# UI Polish Design

Date: 2026-04-02

## Goal

Polish the existing UI and UX without changing the app structure, routing, or business flows.

The app should feel:

- cleaner
- more intentional
- easier to scan
- more responsive in hover, focus, loading, and empty states

## Scope

This polish pass includes:

- visual tokens in global styles
- sidebar readability and active states
- topbar and page header rhythm
- stat cards
- buttons
- form controls
- modals
- tables
- filter chips
- empty and error states

This polish pass does not include:

- new features
- information architecture changes
- route changes
- data model changes
- major component rewrites

## Approach

Use the current UI as the base and improve it in place.

Changes should be systematic:

1. Refine shared tokens and surface styling in global styles.
2. Improve shared layout components.
3. Upgrade repeated UI patterns such as cards, buttons, fields, and tables.
4. Apply the improved visual language to the dashboard views.

## Design Direction

- Keep the warm dojo palette and dark sidebar.
- Increase contrast and clarity where the UI currently feels too flat.
- Make interaction states more obvious but still restrained.
- Use more spacing and softer surface separation instead of adding more heavy borders.
- Keep the interface practical and admin-like, but slightly more premium.

## Success Criteria

- Better contrast and readability across the dashboard
- Clear pointer, hover, focus, and active states
- More consistent button and field styling
- Tables feel lighter and easier to scan
- No regression in current flows
- `npm test`, `npm run lint`, and `npm run build` still pass
