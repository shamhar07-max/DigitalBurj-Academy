# Registration and access correction

1 October 2026. This supersedes earlier notes that described anonymous Academy previews or public course/guide entry.

## Required order

1. Open Academy → sign in or register, with no Academy sidebar.
2. Use the available secure identity method. This Sites deployment uses **ChatGPT sign-in** through the platform-owned sign-in route.
3. Complete the learner profile and explicitly accept storage consent. A provider login by itself is not a completed Academy registration.
4. Enter the dashboard. Free foundation courses and practice tools are available. Paid lesson bodies still require the purchased course entitlement; staff roles are separately appointed.

Account pages have been rebuilt without a sidebar, mobile navigation or course-content scripts. Course, dashboard, guide, practice, preview and raw learning-asset URLs enforce registration on the server. Catalogue and learning APIs follow the same gate. The hosted Worker always serves connected runtime mode and never exposes `preview-data.js`, including when an old preview setting exists.

The application shell starts hidden. It opens only after a registered-session check, rechecks navigation and return from a background/browser-cache state, locks on sign-out and reloads when account identity changes. Protected HTML and data use `private, no-store` caching. Browser Back does not restore Academy navigation to a signed-out user.

The older `/courses` and `/courses.html` URLs enter the registered dashboard's course list. `/practice-library.html` enters the integrated Professional Practice Workspace. They no longer serve separate learning screens. The original prototype source is retained outside deployed assets in `content/legacy/`. Local entry files show the secure account gate, and cannot open courses or tools by themselves. The owner console uses the same hidden-until-verified shell and requires an active registered owner session, including after browser history restoration, account changes and cross-tab sign-out. Pages hide before entering browser history and recheck their session on focus.

QR credential lookup remains a separate public record lookup with no Academy sidebar, tool navigation or learning content. Signed payment callbacks and the static assets needed to display the account page remain reachable; they grant no student access.

## Identity configuration

On the existing Sites-managed deployment, `ACADEMY_PLATFORM_AUTH=sites` enables the native identity supplied by Sites dispatch. Browser sign-in starts with `/signin-with-chatgpt?return_to=...`; browser sign-out uses `/signout-with-chatgpt`. The application does not implement those platform routes or receive a ChatGPT password. Profiles, consent and roles remain in the Academy database.

This flag is specifically for the managed Sites ingress. Do not enable it on a directly reachable standalone Worker that accepts arbitrary caller headers. Other hosting uses the existing provider-verified encrypted email sessions, with `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `ACADEMY_SESSION_KEY` configured. Standalone requests cannot authenticate by submitting the platform header names. Email/password registration and recovery continue to require that external identity/email service.

The current Site's owner-private audience is preserved. Native sign-in does not expand its sharing allowlist or create paid access. Opening enrolment to a public audience is a separate sharing decision.

## Tool icons

All 39 tool entries, course recommendations and eleven workspace tabs have local SVG pictograms. Named tool mentions in guide and lesson text receive the same icon. Brand shapes use selected paths from pinned `simple-icons@16.33.0` (CC0-1.0). Tools without a mark in that package use a relevant purpose pictogram, with their name retained. These pictograms are not invented official logos or claims of a connected account. Five payment pictograms use the same implementation.

`scripts/build-icons.mjs` regenerates the selected local bundle. `content/tool-icon-provenance.json` records each source and whether it is a brand mark or purpose pictogram. No remote icon request is needed to display tools.

## Verification

`tests/access.test.mjs` exercises the compiled Worker and actual SQLite schema: anonymous direct routes, raw assets and API denial; signed-in but unregistered denial; preview bypass denial; registration consent/identity ownership; free versus paid scope; suspension; native sign-out and external-header rejection.

`tests/access-ui.test.mjs` runs the actual compiled Worker/database in a loopback browser with a clearly controlled native identity ingress fixture. It checks registration persistence, sidebar timing, unpaid-course denial, all tool icons, sign-out, browser Back, desktop/mobile layout and isolated certificate lookup. It does not seed learners into production or claim to test the external OAuth provider itself. Current results are in `access-validation.json` and `access-ui-validation.json`.

Merchant activation, real teaching/assessment appointments, subject approval and domain/DNS work remain governed by DEPLOYMENT.md and DOMAIN_SETUP.md.
