# Validation record

Validated locally on 1 October 2026. The Academy is published as a private Sites preview. Native Sites sign-in is enabled for the existing private audience. No external email identity service or live payment service was configured or charged.

| Check group | Result |
|---|---|
| Brand provenance | Seven assets/font files match the reference repository bytes |
| New curriculum | 129 courses, 1,290 unique recipes, five levels and six stages each |
| Standard workflow | 126 assertions passed for catalogue protection, immutable purchase terms, provider matching, failed/partial payment denial, qualified teacher assignment, booking quotas/overlap/ownership and refund cancellation |
| Standard browser journey | 48 assertions passed for registered catalogue, free/paid dashboard, dictated-text editing, eleven tools, 39-entry directory, secure checkout fixture, booking/cancellation, QR pixel decoding and print visibility |
| New server lifecycle | 120 assertions passed for access, expiry, ownership, CSRF, revision conflicts, review separation, certificate lifecycle, payments/refunds, entry-point identity spoofing and private practice mode |
| Receipt lifecycle | 29 assertions passed for private order lookup, signed confirmation, immutable receipts, replay and refund reconciliation |
| Preserved API | 39 assertions passed |
| Account security | 14 assertions passed |
| Guided mentor behavior | 25 assertions passed, including exact binary asset serving |
| Original curriculum/DOM | 48 programmes, 192 missions, 576 lesson units, 2,304 stage screens and 14 routes checked |
| Original engines | 181 non-HTML missions checked with positive cases and controlled failure probes |
| File intake | Type, signature, hash and size checks passed |
| Real browser preview | 50 assertions passed; no unhandled JavaScript exceptions |
| Academy integration UI | 57 assertions passed for registration gating, shared navigation, all 13 guide chapters, professional workspace continuity and account UI flows with controlled API fixtures |
| Registration enforcement | 114 assertions passed against the compiled Worker and SQLite for anonymous/direct/preview denial, native identity plus required profile/consent, legacy entry routing, owner console protection, free access, paid course denial and logout |
| Registration browser journey | 55 assertions passed against the compiled Worker for native registration, consent, sidebar removal, legacy entry routing, unpacked file denial, owner role switching, cross-tab sign-out and browser Back, all tool icons and mobile layout; the platform identity handoff is a controlled fixture |
| Payment UI | 15 assertions passed with controlled registered identity/order responses, including pending-to-paid transition, receipt display, print styling and reduced motion |
| Responsive rendering | Desktop 1440px and mobile 390px; no page overflow across the tested route sweep |
| Animated receipt | Sample and confirmed-record layouts checked at desktop and mobile widths; manufacturing tool removed |
| Printed certificate | One A4 landscape page; sample label retained, no clipped footer |

## Browser flow covered

Empty-step blocking; ordered advancement through all six recipe stages; acceptance and consent checks; downloadable JSON evidence; completion retained across reload; 129 searchable courses; all 48 original programmes; HTML preview and iframe isolation; CSV totals and invalid-data errors; SQL result rows; prompt preparation; automation simulation; API ownership denial; removal of manufacturing entry points; pathway selection; receipt animation and sample labelling; closed purchase state; sample certificate marking; learning-session creation; glossary and global search; staff access denial; legacy programme deep links; responsive routes; and mobile navigation. Mocked connected responses verify public certificate lookup without authenticated bootstrap, and receipt transitions without representing a real payment. Direct file opening was checked to keep the Academy locked without a verified registered session.

Screenshots and the machine-readable summary are in `docs/screenshots/` and `docs/browser-validation.json` and `docs/integration-ui-validation.json`. Screenshot data is local practice data used to exercise the product; it is not pre-seeded into a new user's dashboard.

## Reproduce

```bash
npm ci
npm run build
npm test
```

Browser checks require Playwright and its Chromium browser:

```bash
npm install --no-save playwright
npx playwright install chromium
npm run test:browser
npm run test:payment-ui
npm run test:integration-ui
npm run test:standard-ui
npm run test:access-ui
```

An existing Chromium executable can be selected with `ACADEMY_CHROMIUM=/absolute/path/to/chromium`. No browser binaries or node_modules are included in the ZIP.

## Remaining release gates

Live native sign-in completion through the platform; external email/password registration and delivery if that method is enabled; real recovery links; deployed origin/cookie behavior; test-mode merchant checkout and webhook delivery; a full real staff assessment cycle; content review by qualified subject experts; accessibility review with assistive technology; cross-browser/device validation beyond the tested Chromium widths; load/capacity testing; and backup/restore drills. The tests demonstrate the implemented workflows within their test scope, not a guarantee of production readiness or accreditation.

The standard suite uses controlled API fixtures for merchant/teacher/issued-record screens. The actual rendered QR was decoded from PNG pixels to verify its exact target; Code 128 bars and print visibility were checked. Test records are explicitly named and never seeded into production. Current screenshots are also in `.impeccable/review/standard/`.

The generic design detector issued two font advisories; both required exact repository font families were retained. Public launch remains pending a sharing decision, merchant integration tests and approved products, actual teaching/assessment staff, DNS/TLS verification and broader accessibility/load/backup validation. Native registration is enabled; an optional email identity service requires its own setup. Private publication success is deployment verification, not proof that those external services are connected.

## Registration correction

The current release enforces registration for all learning pages, tool assets, catalogue and personal APIs, including direct and preview URLs. See ACCESS_REGISTRATION_FIX.md and the current machine-readable access-validation.json/access-ui-validation.json results. Account pages contain no Academy sidebar. Controlled browser fixtures explicitly identify registered users; anonymous course/guide preview is denied. The native registration browser test uses the actual compiled Worker and database, with a controlled platform identity handoff. Live platform sign-in and merchant delivery still require the separate release checks described above.
