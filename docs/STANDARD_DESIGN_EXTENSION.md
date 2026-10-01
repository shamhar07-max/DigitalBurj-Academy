# Standard Academy design extension

Recorded 1 October 2026 from the finished `dist/` source and supplied validation/review records. This is an ordinary extension of the established DigitalBurj Academy. `PRODUCT.md`, `DESIGN.md` and `.impeccable/design.json` are preserved. The surface authority is `.impeccable/surfaces/standard-academy.md`; no replacement identity or new brand commitment is introduced.

## Preserved identity and source tokens

The extension uses the exact repository marks and self-hosted fonts: Plus Jakarta Sans for headings and Instrument Sans for body and interface text. `content/brand-provenance.json` pins repository commit `2cbd13980a623fd323ae67cec5adde83c248bb0f`; `VALIDATION.md` reports all seven recorded logo/font files matching their SHA-256 values. Existing opaque logo backgrounds remain intact.

The shared shell in `dist/academy-v4.css` supplies these implemented values. `academy-standard.css` adds scoped presentation rather than redefining the root palette.

| Source token | Value | Observed use |
|---|---|---|
| `--bg`, `--paper` | `#f6f5f1`, `#fff` | Ivory ground and white work surfaces |
| `--ink`, `--navy` | `#0f1714`, `#0b100e` | Primary text, teaching demo and dark navigation |
| `--slate`, `--muted` | `#3b4541`, `#5d6560` | Supporting instructions and metadata |
| `--red`, `--action` | `#f23a1d`, `#c9260e` | Repository accent and accessible primary actions |
| `--line`, `--soft` | `#e4e1d9`, `#eeece5` | Dividers and secondary tonal surfaces |
| `--ok`, `--warn` | `#1e7a52`, `#a85f0a` | Success and warning states |
| `--radius` | `16px` | Shared panels and recipe sheets |
| `--ease` | `cubic-bezier(.22,.8,.24,1)` | Scoped teaching and payment motion |

Body text remains 15px with 1.6 line height. Shared page headings use `clamp(27px,2.45vw,36px)`; section and smaller headings use 22px and 17px. The public heading uses `clamp(40px,4.5vw,66px)`, 1.08 line height and -.04em tracking, with a 46px mobile override. Lesson concepts use 17px/1.75 and a 66ch measure; worked examples use 16px. These are observed surface choices, not new global type tokens.

## Components, layout and motion

| Pattern | Finished implementation |
|---|---|
| Actions and fields | Shared buttons have 8px corners, 43px minimum height and 10px × 17px padding; primary actions use action red with white text and a darker hover. Fields use 8px corners and 11px × 12px padding. Keyboard focus is a 3px action-red outline with 4px offset. |
| Course-first shell | A 252px desktop rail, white 76px top bar and constrained work area prioritize My courses, Browse courses, Practice workspace, My teacher, My work & assessment and Certificates. Tools and contextual links retain the original Professional Practice Workspace. |
| Catalogue and progress | Search, subject and free/paid filters precede course cards. Cards use 12px corners, illustrated covers, white bodies and visible actions. The dashboard leads with the next actual project and two free foundations; future projects and learning stages remain gated. |
| Teaching content | Six ordered stages cover understand, explain, build, test/fix, reflect and submission. Numbered concept graphics retain accessible descriptions and captions. The storefront example has six explicit pressed-state controls and is labelled separate from course progress. Optional dictation is explicitly started and its editable transcript must be reviewed. |
| Checkout | Package review, protected provider fields and receipt/access steps are distinct. Provider selection exposes selected and unavailable states. Stripe fields receive action red and 8px corners; the provider frame uses its own system font. Live Academy code reacts to method/completion without receiving raw PAN or CVC. The separate fictional card sample is labelled, stores/sends no sample input and grants no access. |
| Practice tools | Eleven included tools and 28 external entries share searchable category/price filtering. External subscriptions are explicitly separate. Added design, board, budget, JSON and contrast tools use labelled forms, computed outputs, scoped device drafts and export controls; exercises retain their fictional/practice labels. |
| Certificate | The incumbent ivory certificate paper (`#fffdf8`) gains a fine inset border, restrained red rule, QR verification link and Code 128 identifier for issued records. Unissued samples state that no credential or verification record exists. Layout targets A4 landscape printing. |

The public content width is 1280px with 40px side padding; its desktop hero uses two columns and a 70px gap. At 1150px, padding reduces and checkout becomes one column. At 900px, the shared rail becomes an explicit mobile menu, the lesson rail scrolls horizontally and public navigation links hide. At 600px, public sections, course/dashboard grids and extra tools stack; catalogue search spans two filter columns. The concept graphic becomes a semantic two-column list with 14px labels and a readable caption. The sample card precedes the form, stays sticky at 66px, and compacts to 295px × 166px so focused CVC feedback remains visible.

Ordinary work surfaces use borders and tonal separation. The storefront demo uses soft shadows (`0 14px 30px -18px #18271c40`, reduced to `0 12px 24px -16px #18271c40` at 900px). The sample card uses perspective and a .45s transform transition; concept nodes reveal over .5s with .12s sequencing. The shared reduced-motion rule suppresses animations, transitions and smooth scrolling, and the extension explicitly disables concept/card motion. Demo progression is user-controlled.

## Review evidence and release scope

Compared `DESIGN.md`, the incumbent sidecar, `PRODUCT.md`, the direction contract and historical `docs/DESIGN_EXTENSION.md` with `dist/academy-standard.css/js`, `courses.html`, `storefront.js`, `checkout.js`, `studio-extra.js`, the shared shell/styles and font definitions. No build, test suite, browser session or new visual QA was run for this documentation pass.

`docs/STANDARD_FINISH_REVIEW.md` retains all five review contract sections and reports **disposition: ship** for the four scored corrections: 14px mobile concept labels, visible sticky mobile card feedback, soft demo elevation and -.04em public heading tracking. The independent initial review inspected all 14 desktop-1440/mobile-390 captures in `.impeccable/review/standard/`; its correction pass inspected the four refreshed captures. Unchanged findings retain their initial scope. This is not a new whole-surface review or production certification.

`docs/standard-ui-validation.json` records 48 checks with no errors; `docs/standard-server-validation.json` records 126 checks using actual D1/SQLite rules and controlled provider fixtures. `docs/STANDARD_ACADEMY.md` records 18 courses, 180 projects and 1,080 stage instructions, plus the eight-week individual-teaching package: 24 two-hour classes, three per week, 48 hours total. Teacher and issued-certificate captures are explicitly controlled fixtures. QR decoding and print visibility are recorded validation, not live issuance.

The deployed edition remains owner-private. Public operation still requires working identity/email, approved products and merchant testing, real appointed teaching/assessment staff and verified DNS. Provider configuration, real bookings, paid entitlements, completed assessments and production credentials are not inferred from the preview.

## Pre-existing documentation drift

`DESIGN.md` is an incumbent prose record without normative YAML token frontmatter. Its mission-only layout and 12-stage narrative describe the retained professional workspace; they do not fully describe the newer public catalogue or six-stage course journey. Its historical “no decorative hero” phrase has not been converted into an unasked prohibition on the task-demonstrating catalogue surface.

The schema-version-2 sidecar still documents `dist/styles.css` component examples, including legacy property names (`--text`, `--surface`, `--accent`), ochre focus styling and a 760px mobile breakpoint. The newer Academy shell uses `--ink`, `--paper`, `--action`, red focus styling and 900px/600px adaptations. Its synthesized OKLCH ramps are presentation strips, not implemented palette tokens. The historical V4 extension note also records earlier scope; current tool and release facts are in `STANDARD_ACADEMY.md`. These known coverage/schema differences remain reported rather than migrated or repaired.
