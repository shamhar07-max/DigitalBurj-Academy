# DigitalBurj Academy: Cloudflare deployment

This edition runs the complete Academy on Cloudflare Workers with Static Assets, Turso/libSQL storage, Supabase Auth and a separately configured email service. It preserves the existing courses, Professional Practice Workspace, registration, owner/teacher/demo appointments, payment entitlement checks, receipts and certificate workflows. No GitHub push is needed.

The Cloudflare-specific transport uses the HTTP-only libSQL SDK. Original migrations and SQLite tables are preserved. Dashboard assets pass through the same registration gate as API requests. Complete course dumps are excluded from the static upload. `wrangler.toml` points to the new production adapter, not the previous Sites entry point.

## 1. Install the package locally

Unzip the archive and open a terminal in `DigitalBurj-Academy`. Install Node 24, then run:

```sh
npm ci --include=dev
npm run build
npm run test:cloudflare
npm run test:cloudflare-runtime
npx wrangler deploy --dry-run --outdir .cloudflare/bundled
```

The dry run builds the real Worker and asset manifest without publishing. The dependency lock pins Wrangler. The runtime test uses actual Cloudflare workerd with native asset routing and a SQLite-backed HTTP database fixture; its identity and merchant replies are test fixtures.

`npm run build` generates both the portable server and the Cloudflare Worker/assets required by `wrangler.toml`. `npm run build:cloudflare` is an equivalent explicit command; `npm run build:portable` builds only the portable server. Cloudflare's Git integration can use the default `npm run build` followed by `npx wrangler deploy`.

## 2. Connect Cloudflare securely

Use your existing Cloudflare account and Workers Free. Do not enable a paid subscription to follow this guide. Authorize Wrangler with only the scopes needed to inspect your account, publish Worker scripts and attach the Academy domain:

```sh
npx wrangler login --device --browser=false --scopes account:read user:read workers_scripts:write workers_routes:write zone:read
```

Wrangler prints Cloudflare's verification URL and a short user code. Open that exact URL in your own browser, enter the code if required, and review/approve the request. Passwords and API tokens stay out of the chat. The device flow also works when the deployment workspace is remote: its CLI polls Cloudflare for authorization and does not require a localhost callback or a shared browser session. A request expires after the period printed by Wrangler.

After authorization:

```sh
npx wrangler whoami
```

If more than one Cloudflare account is listed, select the account that owns the Academy and set its `account_id` in `wrangler.toml`. Do not choose another account merely because it is first in the list. Wrangler stores its login credentials outside this source folder; never add those files to the deployment ZIP.

## 3. Prepare the database and sign-in service

Create a Turso Free database, preferably near your intended students, and obtain its database URL and write-capable token. Keep an existing production database if you already have one; do not reset or seed it with test data. Create or choose the intended Supabase project for email/password authentication.

Copy `.env.cloudflare.example` to `.env.cloudflare`. Enter real values privately:

| Variable | Required value |
| --- | --- |
| `ACADEMY_PUBLIC_URL` | Exact HTTPS origin, preferably `https://academy.digitalburj.com` |
| `ACADEMY_OWNER_EMAIL` | The owner's real email; it must be verified in Supabase |
| `ACADEMY_SESSION_KEY` | 64 lowercase hexadecimal characters; preserve it between releases |
| `TURSO_DATABASE_URL` | Your hosted `libsql://` or HTTPS database URL |
| `TURSO_AUTH_TOKEN` | A write-capable token for that same database |
| `SUPABASE_URL` | Your project's HTTPS Supabase URL |
| `SUPABASE_PUBLISHABLE_KEY` | Its publishable key, not a service-role key |
| `ACADEMY_AUTO_MIGRATE` | `false` |
| `ACADEMY_PAYMENT_PUBLIC` | `false` until merchant setup and offers have been reviewed |

Generate your session key on your own computer with `npm run session:key` and save it privately. Never commit or upload the populated environment file as source.

Validate and apply the eight immutable schema migrations using Node, before starting the Worker:

```sh
node --env-file=.env.cloudflare scripts/check-config.mjs
node --env-file=.env.cloudflare scripts/database.mjs
node --env-file=.env.cloudflare scripts/database.mjs --check
```

The migration ledger checks SHA-256 digests and rejects divergent migration history. Cloudflare does not run migrations from incoming student requests.

## 4. Configure email verification and password recovery

In Supabase Authentication URL Configuration, set Site URL to `ACADEMY_PUBLIC_URL`. Add these redirect URLs for that same origin:

```text
https://academy.digitalburj.com/auth/confirm
https://academy.digitalburj.com/reset-password
```

Keep confirmation enabled. Configure custom SMTP for public students: Supabase's default email service is restricted and is not sufficient for open registration. Resend Free can be used with an owned, verified sending domain. Its SMTP server is `smtp.resend.com`, port `465`, username `resend`, password your Resend API key. Set your real sender address in Supabase. Domain verification and DNS changes must be made only in the intended domain.

Use these links in the respective Supabase email templates:

```html
<!-- Confirm signup -->
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=email">Confirm my email</a>
<!-- Reset password -->
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=recovery">Reset my password</a>
```

No Cloudflare secret named `SUPABASE_SERVICE_ROLE_KEY` is required. Free email quotas still apply. Configure and verify the actual mail delivery before opening registration to paying students.

## 5. Publish and add the private application settings

The first deployment can be made before its secrets exist. During that interval it returns a private, uncached 503 configuration message and exposes no courses:

```sh
npm run cloudflare:deploy
```

Upload only the allowlisted application settings from your private environment file:

```sh
npm run cloudflare:secrets
```

The helper validates configuration, creates a temporary file with restrictive permissions, invokes Wrangler's bulk secret uploader, and removes the temporary file. It never uploads your shell environment wholesale or includes Cloudflare deployment credentials. It skips empty optional provider settings. Runtime values are Cloudflare secrets rather than readable configuration defaults.

If you prefer the dashboard, add these values under the Worker's Settings > Variables and Secrets; use encrypted secrets for tokens, merchant secrets and the session key. `ACADEMY_PUBLIC_URL` must exactly match the public URL students will use.

Changing the public origin also requires updating Supabase Site URL, redirect allowlist, merchant webhooks and any configured certificate verification links. Do not use a temporary address as the canonical origin after switching to your domain.

## 6. Connect academy.digitalburj.com

Worker Custom Domains require an active Cloudflare zone for `digitalburj.com`. Your domain may remain registered with its existing registrar. If its authoritative DNS is elsewhere, moving nameservers requires checking and preserving the complete existing DNS records, including mail records. Do not change the main website or other records blindly.

Once the intended zone is active, add this to `wrangler.toml`:

```toml
[[routes]]
pattern = "academy.digitalburj.com"
custom_domain = true
```

Deploy again. Cloudflare provisions the Worker hostname and HTTPS certificate. After the custom domain is working, set `workers_dev = false` and redeploy if you want only the commercial domain exposed. Never delete an existing CNAME or overwrite another live service without reviewing its purpose.

## 7. Verify registration and launch access

Open `/healthz` on the canonical origin; expect `{"status":"ready"}`. From a signed-out browser, verify `/dashboard`, `/workspace.html`, lesson scripts and course APIs remain inaccessible. `/register` and `/sign-in` must load without the Academy sidebar.

Register and verify the owner's email, finish the Academy profile and consent, then use the operations page to initialize appointments. Assign the real demo email and the six real teacher emails, scope, expiry and checked qualifications. Every person uses their own verified identity; no shared or preset passwords are installed.

Register a separate student. Confirm free basics and practice are available, an unpaid course is blocked, learning plans persist and owner operations are denied. Confirm an actual recovery email returns to the correct Academy page. Local automated fixtures do not replace these live checks.

## 8. Connect real payments and teaching

Configure only merchant providers for which you have eligible, approved commercial accounts. For the India launch, Razorpay uses `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`. Configure the signed webhook at:

```text
https://academy.digitalburj.com/api/payments/razorpay
```

Publish the actual reviewed INR offer, purchased-course scope, duration, business details, terms and refund policy through owner operations. Keep public payments disabled until these are ready. Change `ACADEMY_PAYMENT_PUBLIC` to `true` through secrets and verify readiness. The animated receipt is shown only after server-side payment verification; it does not itself unlock a course.

Real card entry belongs in the payment provider's hosted checkout. The Academy receives order/payment references and signed notifications, not card numbers or CVV. The visual card lesson is a fictional practice preview. Cloudflare's free-service agreement contains a restriction on credit-card collection/processing on free-hosted properties; do not turn the preview into a card-collection form. Payment processing still carries the gateway's applicable fees.

Verify the first payment notification against the merchant's own record and check that only the purchased course opens. Any actual charge, refund or transaction requires the merchant/customer's explicit action. Verify refunds/disputes revoke access. Add teacher availability and actual meeting links, then test assigned-course access, booking, attendance, evidence review, assessment and issued-certificate verification. Do not issue an actual certificate for test activity.

## 9. Free capacity and production monitoring

Published Workers Free limits include 100,000 requests/day and 10 ms CPU per invocation. All routes in this edition run the Worker first to preserve strict access control, including protected static assets. Those invocations count toward the request allowance. Static assets are delivered through the native binding to avoid repeatedly decoding the embedded asset bundle. This edition's dry run checks bundle/configuration compatibility; local workerd cannot certify compliance with live free-plan CPU or account quotas.

Before enrolling many students, inspect live Worker metrics for CPU, errors, cold starts, database calls and request volume on registration, dashboard, lessons, professional content and payment notification paths. External network wait is separate from CPU execution. Heavy authenticated responses may need optimization or a paid plan; no automatic upgrade is authorized by this guide. Free quota exhaustion can interrupt access, and free service is not a guaranteed-availability contract.

Turso, Supabase and your email provider also have separate free limits. Domain registration/renewal, gateway transaction fees, AI APIs, commercial tool subscriptions and substantial video hosting are separate expenses. Linking Canva, Claude or another tool does not include its paid subscription.

## References checked on 1 October 2026

- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Static asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
- [Wrangler login and device authorization](https://developers.cloudflare.com/workers/wrangler/commands/general/)
- [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Turso integration](https://developers.cloudflare.com/workers/databases/third-party-integrations/turso/)
- [Cloudflare subscription agreement](https://www.cloudflare.com/terms/)
- [Supabase pricing](https://supabase.com/pricing)
- [Resend pricing](https://resend.com/pricing)

Remote publication, DNS changes, email delivery and live payments are pending until the correct account and private environment are connected. The ZIP includes source, built artifacts and local validation; it contains no production credentials.
