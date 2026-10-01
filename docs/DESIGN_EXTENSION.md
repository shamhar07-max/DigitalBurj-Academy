> Historical V4 record. The later user correction removes manufacturing tools and introduces payment receipts. Current scope: WORKFLOW_CORRECTION.md.

# Academy extension record

Recorded 30 September 2026 from the built V4 interface. This is a scoped extension note, not a replacement design system. `PRODUCT.md`, `DESIGN.md` and `.impeccable/design.json` remain unchanged.

## Incumbent identity

The extension retains the incumbent warm ivory ground, white work surfaces, deep green ink, orange-red brand accent, accessible action red and muted green-gray text. Headings use self-hosted Plus Jakarta Sans; body and interface text use self-hosted Instrument Sans. All seven files in `content/brand-provenance.json` match their recorded SHA-256 values for repository commit `2cbd13980a623fd323ae67cec5adde83c248bb0f`. Logo pixels and font files are preserved.

The repository Academy stylesheet also supports the dark navigation rail, restrained white panels and rounded controls used here. The new screens preserve this identity without claiming pixel-for-pixel equivalence to repository pages. Ordinary panels use borders and tonal separation; the search dialog and mobile navigation use elevation to distinguish temporary layers.

## Scoped extension choices

| Area | Observed V4 behavior |
|---|---|
| Type | Page headings scale from 27 to 36px; section headings are 22px, smaller headings 17px, body text 15px. Recipe instructions use 16px with generous line spacing. |
| Shell | A 252px desktop navigation rail, white top bar and constrained work area organize task routes. At 900px and below, navigation becomes a menu and the lesson rail scrolls horizontally. At 600px, work panels and forms use one column. |
| Controls | Primary actions use the incumbent accessible action red. Buttons and fields generally use 8px corners; work panels use 16px corners. Keyboard focus is visible, and reduced-motion preferences suppress animation and transitions. |
| Learning home | The next actual recipe leads the page, with six progress segments, subsequent tasks, recorded weekly activity and an entry to the 3D studio. Empty activity remains empty. |
| Recipe and studio | Six stages organize understand, inspect, make, check, explain and package. Navigation between recipe and tool preserves local drafts. This supplements the retained 12-stage programme workspace. |
| Certificates | Sample credentials are visibly marked. Print styling targets one A4 landscape page. Local practice completion does not become an assessed credential. |

These dimensions and arrangements describe the extension only. They do not replace the incumbent workspace's component examples or breakpoint rules.

## Behavior and release boundary

The preview stores practice drafts on the current device and supports evidence exports. Its tools include an isolated HTML preview, constrained data exercises, prompt preparation, automation and access simulations, and a 3D learning blank with STL and recipe export. The 3D view is a dimensional exercise; its cost worksheet is an estimate, and it does not generate machine G-code or validate a physical object.

Connected code supplies scoped access, purchase integration, review and verification workflows, and certificate lifecycle operations. No live merchant or managed-email provider was configured for this validation. Production claims require the release gates in `VALIDATION.md`, including real registration/recovery, merchant and webhook tests, qualified assessment, assistive-technology review, broader device testing and physical print validation.

## Evidence and unmodified drift

Reviewed `dist/academy-v4.css`, representative routes and local-state behavior in `dist/academy-v4.js` and `dist/studio.js`, repository token evidence, asset provenance, `DIRECTION.md`, and `VALIDATION.md`. Inspected supplied captures `desktop.png`, `lesson-mobile.png` and `print-studio-desktop.png` in `screenshots/`. Their palette, typography, task hierarchy and responsive presentation agree with the sampled source. The validation record reports 51 Chromium browser assertions, backend checks, retained-curriculum checks, 1440px/390px route sweeps and a one-page certificate print check. This documentation pass did not rerun those suites or operate a live browser.

Pre-existing schema drift remains: `DESIGN.md` records its visual system in prose without the current normative YAML token layer, while the schema-version-2 sidecar contains extension metadata and legacy component examples. The extension also uses its own responsive shell and focus styling. No schema migration, new system-wide prohibition or defect-derived token was introduced. The pinned font families remain intentional despite generic detector advisories. Final reviewer corrections and confirmation belong to the validation record; this note does not independently certify that later pass.
