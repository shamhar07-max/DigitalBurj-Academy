# Academy workspace, guide and accounts

Update: 30 September 2026.

## One Academy interface

The original Professional Practice Workspace now uses the same brand assets, fonts, colors, sidebar, header, mobile navigation, account links and footer as the guided Academy. A shared `academy-shell.js` owns navigation and account chrome. A workspace switcher connects guided project tools and professional practice without nesting an application in an iframe.

All 48 programmes, 192 missions, 576 original lesson units, twelve stages, specialist engines, mentorship, evidence packs and service workflows remain intact. The original engine keeps its existing storage format and account namespace. Its fourteen internal sections live in a labelled Workspace sections menu. The selected section, mission and stage are preserved in the URL so refresh returns to the same context. New connected practice profiles start from the account's selected professional programme; existing saved practice is retained.

The programme library, specialist-tool links, home page and shared navigation lead into the integrated workspace. Guided recipes and professional missions retain their distinct assessment records; neither is silently counted as completion of the other.

## Learner guide

Open `index.html#guide`. Twelve chapters explain:

1. The first thirty minutes and the two practice formats.
2. Registration, email confirmation, sign-in, profiles and recovery.
3. Where each dashboard area belongs in the learning workflow.
4. Choosing a pathway and a sustainable pace.
5. Completing the six guided-project steps.
6. Using the original twelve-stage Professional Practice Workspace.
7. Tool inputs, simulations, drafts and evidence.
8. Access, secure checkout, payment confirmation and animated receipts.
9. Roles, purchase scope, private Site access and learner privacy.
10. Qualified assessment, independent verification and certificates.
11. Local saves, cloud saves, exports, restore and cross-device limits.
12. Troubleshooting, accessibility and useful support requests.

Each chapter has direct links to the relevant working screen, a chapter menu and previous/next controls. Guide chapters are included in Academy search. The guide can open before authentication in connected mode using the public catalogue.

## Account pages

`/register`, `/sign-in`, `/forgot-password`, `/reset-password`, `/auth/confirm`, `/onboarding` and `/account` share the Academy design. The forms are connected to the existing account API rather than a simulated authentication flow. Registration adds password confirmation, visibility controls, consent, readable feedback and clear email-confirmation instructions. Onboarding seeds a professional starting programme and weekly pace. Sign-out and password changes use the real account routes.

The UI requires both an identity configuration and secure sessions before enabling account submission. Unavailable services preserve a visible form and offer a preview/guide route. Confirmation tokens are removed from the URL before verification, and server-provided navigation destinations are limited to known internal routes.

The published Site remains a private practice preview. Supabase identity, email delivery and live merchant services have not been configured in this update. Mocked UI checks do not establish a real external account or payment. Server authorization remains authoritative for accounts, staff roles, purchases and evidence.

## Verification

- Full existing server, identity, curriculum, mentorship and original engine suites passed.
- 57 additional real-browser checks cover shared navigation, guide chapters, original-workspace section/stage refresh, account setup blocking, signup validation and submission, rejected/successful login, profile setup, recovery, confirmation, password updates, account-scoped practice initialization and signed-out guide access.
- The account flow tests use controlled local API fixtures; production provider tests remain a release gate.
- Desktop 1440px and mobile 390px layouts were reviewed for the workspace, guide, registration and sign-in pages. Tested screens have no page-level horizontal overflow.
- Existing recipe and payment UI suites remain part of the release validation.

Run `npm run test:integration-ui` with Playwright/Chromium installed. Set `ACADEMY_CHROMIUM` when using an existing Chromium executable.

No GitHub repository writes were made. Publication uses only this Academy's managed Sites source repository and preserves its private audience.
