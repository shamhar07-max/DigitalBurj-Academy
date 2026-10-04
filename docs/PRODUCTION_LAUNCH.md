# DigitalBurj Academy operating guide

The updated Academy includes protected registration, the original Professional Practice Workspace, saved learning plans, actual activity records, teacher scheduling and an INR Razorpay integration. **This standalone release opens sign-in publicly while protecting all learning; paid enrolment is paused until the owner configures it.** No merchant credentials, prices or staff email addresses have been invented.

## Open the administrator setup

Sign in using the existing verified Academy owner account, complete your profile if required and select **Launch & team**. That account is the administrator. Opening this area creates one administrator entry, one full-learning demo slot and six teacher slots. Reopening it does not create duplicate slots.

### 1. Enter the business details

Save your real business display name, support email and HTTPS purchase terms URL. Enter the total checkout price when publishing an offer. The on-screen receipt is a payment acknowledgement; use your existing commercial invoicing process for a tax invoice where applicable.

### 2. Connect the real merchant

Enter your Razorpay key ID, key secret and webhook secret in **Launch & team → Connect Razorpay**. Do not send secrets in chat or commit them to the source. The server verifies the merchant credentials with an authenticated, read-only provider request. Credentials are encrypted in the database with the deployment's session key and never returned to the browser. Back up that server key securely before rotating it; losing it requires reconnecting the merchant.

Test keys can be saved to check the connection but do not open student purchases. The production key must belong to your live merchant account.

Configure automatic capture in the merchant dashboard. Add the displayed HTTPS webhook URL with the same webhook secret and these events:

- `payment.captured`
- `order.paid`
- `refund.processed`
- `payment.dispute.created`
- `payment.dispute.under_review`
- `payment.dispute.lost`

Allow public entry and signed webhook callbacks on your chosen host. Confirm the notification endpoint is reachable, then set `ACADEMY_PAYMENT_PUBLIC` to `true`. It defaults to `false`; entering live keys alone does not enable purchases. Public entry does not grant course, staff or personal-record access. Follow `docs/DEPLOYMENT.md` for domain, database and identity setup.

### 3. Publish your actual offers

Add each real course offer with its unique ID, title, total INR price, included courses, access duration, terms and refund policy. Confirm your approval of those actual details before selecting **Live**. The server stores prices in integer paise and preserves the exact purchase scope and terms with each order.

A dedicated teacher offer contains one named included course, eight weeks of teaching, 24 private classes of two hours and at most three classes per week. Course access must cover the agreed period. Purchasing this bundle also requires a currently qualified teacher appointed to that course.

Before inviting paying customers, complete an actual live transaction using your own merchant's supported payment method. Check capture, the stored receipt, the precise course access and an actual merchant-dashboard refund. The included automated checks use controlled provider responses and make no live charge.

### 4. Appoint the people

Supply the real demo learner's name and sign-in email and each of the six teachers' names, sign-in emails and course assignments. Set an access expiry within one year. Record each teacher's qualifications and confirm that you checked the supporting evidence.

Each person signs in with their own verified identity and completes registration. Only that matching email can claim the reserved access. No shared password or fabricated login is created. Appointment forms do not send an email. Each person uses the public account page but cannot open courses until registration and their scoped access are complete.

| Account | Learning access | Operational access |
| --- | --- | --- |
| Administrator | All courses and programmes | Merchant, offers, appointments, learner administration and teacher package assignment |
| Demo learner | All 129 guided courses, all 48 professional programmes and practice tools until expiry | Their own records; no other learner's data or administrator controls |
| Each teacher | Assigned courses and related professional practice until expiry | Assigned teaching packages, class availability, meeting links, attendance and cancellation |
| Registered unpaid learner | Free foundations, relevant free professional practice and built-in tools | Their own drafts, plan, activity and support requests |
| Purchaser | Free learning plus the active purchased course scope | Their owned receipts and, if purchased, their teacher package |

Withdrawing an appointment revokes only that appointment's access. A separate valid purchase is unaffected. Teacher appointments do not appoint certificate assessors; reviewer and verifier responsibilities are recorded separately and assessment remains independent.

## Deliver the teaching bundle

1. The learner buys an approved teacher offer. Confirmed payment creates a package awaiting a teacher.
2. The administrator assigns a qualified course teacher and agrees the eight-week start date, within the purchased access period.
3. The teacher opens **Teacher workspace**, posts non-overlapping two-hour slots for the approved course and adds a real Google Meet, Zoom or Teams link.
4. The learner opens **My teacher**, records availability preferences and books available slots. Booking checks ownership, period, weekly allowance, total allowance and overlapping sessions.
5. After the class ends, the assigned teacher records actual attendance, learning notes and the next task. Completion cannot be recorded early.
6. A cancelled future class releases its allowance. A confirmed full refund or an authenticated dispute withdraws that order's learning access and cancels future booked classes.

Actual classrooms are supplied by your teaching team through the meeting links. The Academy does not fabricate teachers, attendance or recorded lessons.

## Explain the two learning routes

**Guided Learning:** choose a free or accessible course, then follow its next project. Understand the explanation, write or dictate your understanding, build a work product, test and improve it, reflect and submit your evidence. Ten ordered projects are grouped into five modules. Project checks prepare evidence; qualified review and separate verification determine certificate eligibility.

**Professional Practice:** choose an accessible programme and one mission. Follow BRIEF, LEARN, INVESTIGATE, TRY, BUILD, BREAK, FIX, TEST, EXPLAIN, DEFEND, SHIP and EVIDENCE. Use the tools at the relevant stage and save a cloud snapshot through **Reviews, records & payments**. Programme prerequisites outside the account's access are displayed safely and do not unlock their lesson bodies.

**My learning plan** saves the route, course or programme, weekly hours, practice days and timezone to the account. Session calendar entries and tool drafts remain device-local unless exported or explicitly cloud-saved. **My activity** lists actual saved actions, submissions, class operations and confirmed payment events. A page visit is not a completion, attendance mark or grade.

The 15-chapter Academy guide explains these controls inside the dashboard. Professional Practice and guided tools share the Academy navigation, and the original workspace's order section links to the same checkout and owned receipts.

## Payment guarantees implemented

- No raw card number or CVC is collected by Academy code. Live checkout uses the provider's protected fields; the animated input sample accepts only fictional sample digits.
- The callback signature uses the stored server order reference. The server then fetches the merchant order and payment, matching identity, reference, exact amount, currency and full captured payment.
- A return URL, browser flag, unsigned notification or an authorized-but-uncaptured payment grants no access.
- Repeated callbacks preserve one entitlement and the original receipt. Signed notifications reconcile authenticated current provider state rather than trusting an event's claimed status.
- A partial refund updates the receipt; a full refund withdraws the order's access. Late captured-payment notifications cannot restore refunded or disputed access.
- Stripe, Gumroad, Binance Pay and NOWPayments adapters remain in the source for separately configured, eligible merchant arrangements. Their availability is not assumed or promised for an Indian merchant.

## Validation and release

The source includes eight generated, schema-only migrations for 26 database tables, server tests and browser checks. Production checks run the actual server and SQLite rules with controlled native identity and Razorpay responses. Browser checks cover registration gates, course scope, merchant-secret redaction, INR pricing, plans, teacher scope, hosted checkout callbacks, receipts and all 14 original workspace sections under scoped access.

Original brand/font assets retain their recorded repository hashes. The complete ZIP is built from the same source commit as the deployed release. This portable package is delivered without a GitHub push. The original source is preserved in the archive provenance manifest.

The design review preserves the original brand fonts despite generic detector font warnings. The SVG stroke-width warning concerns a painted line, not layout animation; legacy border/shadow advisories are outside the new design scope. Older design metadata and its sidecar can be refreshed separately with Impeccable's init/document commands.

## Provider references

- [Razorpay Standard Checkout integration](https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/)
- [Fetch an order](https://razorpay.com/docs/api/orders/fetch-with-id/)
- [Fetch payments for an order](https://razorpay.com/docs/api/orders/fetch-payments/)
- [Fetch a payment](https://razorpay.com/docs/api/payments/fetch-with-id/)
- [Validate webhook signatures](https://razorpay.com/docs/webhooks/validate-test/)
- [Dispute notification events](https://razorpay.com/docs/webhooks/disputes/)
- [Fetch a dispute](https://razorpay.com/docs/api/disputes/fetch/)
