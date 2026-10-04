# Deploy DigitalBurj Academy

This ZIP runs the complete Academy independently on Vercel, Render or Railway. The Netlify extension is described in [NETLIFY_FREE_DEPLOYMENT.md](NETLIFY_FREE_DEPLOYMENT.md), including commercial Free-plan limits and its Node function. Choose one production host. Use a hosted Turso/libSQL database for Academy records and Supabase Auth for verified email/password identities. The application uses the same durable database on all supported hosts; it does not rely on a server's temporary filesystem.

The ZIP includes the editable source, built application, package lock, eight migrations, host configurations and tests. Runtime secrets, real customer data and user passwords are not included. This creates a fresh deployment; it does not automatically transfer accounts or records from the earlier hosted Site.

## 1. Unzip and prepare

Open the extracted DigitalBurj-Academy folder. Use Node 24.

```sh
npm ci --include=dev
cp .env.example .env
npm run session:key
```

Copy the generated 64-character key into ACADEMY_SESSION_KEY. Keep the key stable and back it up securely: it encrypts server sessions and saved merchant credentials. Edit your private .env file locally or enter the values directly in your host's secret/environment settings. Do not upload .env with the source.

The full variable reference is [ENVIRONMENT.md](ENVIRONMENT.md). The three host-specific .env templates contain the same supported variables with the appropriate migration defaults.

## 2. Create persistent storage

Create a hosted Turso/libSQL database. Copy its libsql:// URL into TURSO_DATABASE_URL and its write-capable database token into TURSO_AUTH_TOKEN. Select a database region suitable for your students and hosting region.

Run schema setup with these private values available:

```sh
npm run build
npm run db:migrate
npm run db:check
```

The migration command creates 26 application tables and one migration ledger. It applies migrations atomically, records checksums and safely does nothing when the same release is reapplied. Changing an applied migration is rejected. Use the next generated migration for schema changes.

Do not enter a PostgreSQL connection string in TURSO_DATABASE_URL. Supabase supplies identity in this package; the Academy's application tables use SQLite-compatible libSQL.

Production local-file databases are rejected, including Vercel's temporary storage. A local file is supported only for development and the persistence tests.

## 3. Configure verified email sign-in

Create a Supabase project. Enter its project URL and publishable key in SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY. Keep email confirmation enabled. Configure your SMTP sender for real student emails.

Set Supabase's Site URL to the same HTTPS origin as ACADEMY_PUBLIC_URL, for example your own academy domain. Add these exact Redirect URLs:

- YOUR_HTTPS_ORIGIN/auth/confirm
- YOUR_HTTPS_ORIGIN/reset-password

Replace YOUR_HTTPS_ORIGIN with your actual domain. Update them when changing domains. For a separate staging environment, use a separate database and identity project, and its own exact domain.

This application exchanges the confirmation token on the server and stores an encrypted session in a Secure, HttpOnly cookie. Set these two Supabase email templates; the default fragment-token email template does not establish this application's cookie.

**Confirm signup**:

```html
<h2>Confirm your DigitalBurj Academy email</h2>
<p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=email">Confirm my email</a></p>
```

**Reset password**:

```html
<h2>Reset your DigitalBurj Academy password</h2>
<p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=recovery">Reset my password</a></p>
```

The server verifies the identity with Supabase before granting a session. A token or email provided by the browser is not accepted as proof of identity. ChatGPT platform identity headers are disabled in the portable server.

## 4. Choose the host

| Setting | Vercel | Render | Railway |
| --- | --- | --- | --- |
| Configuration | vercel.json | render.yaml | railway.toml + Dockerfile |
| Runtime | Node 24 function | Node 24 web service | Node 24 Docker container |
| Install | npm ci --include=dev | npm ci --include=dev | Docker build performs installation |
| Build | npm run build | npm run build | Docker build performs build |
| Start | api/academy-entry.mjs | npm start | npm start |
| Health endpoint | /healthz | /healthz | /healthz |
| Database | Hosted Turso/libSQL | Hosted Turso/libSQL | Hosted Turso/libSQL |
| Migration mode | Run db:migrate before deploying; AUTO_MIGRATE=false | AUTO_MIGRATE=true or explicit migration | AUTO_MIGRATE=true or explicit migration |

### Vercel

1. Use the extracted folder as the project root. Keep vercel.json and the api directory. Framework Preset is Other; build and installation commands are already configured.
2. Set all required environment variables for Production. Set ACADEMY_PUBLIC_URL to the final HTTPS origin, NODE_ENV=production and ACADEMY_AUTO_MIGRATE=false.
3. Apply db:migrate using this release and your production database connection before deploying.
4. Deploy from the local folder with the Vercel CLI, or import your own repository. This package requires no GitHub push from this conversation.

```sh
npx vercel
npx vercel --prod
```

Use Vercel's prompts to link the correct project. If the assigned domain changes, update ACADEMY_PUBLIC_URL and Supabase's URLs, then redeploy.

**Important:** public is intentionally empty. All requests, including course JavaScript and dashboard HTML, go through the authenticated application. Do not set dist as the static output directory and do not replace the catch-all rewrite with an index.html SPA rewrite. Leave production Deployment Protection off for public registration and signed provider callbacks; Academy permissions still protect content.

The Web Request function preserves raw webhook bytes. The reserved __academy_path query field is internal to the configured rewrite; do not use it in your own links.

### Render

1. Create a **Web Service**, not a Static Site. Use Node runtime or the supplied Dockerfile.
2. Use render.yaml as a Blueprint when supplying your own repository, or copy its settings into the dashboard.
3. Set the private required environment values, ACADEMY_AUTO_MIGRATE=true and ACADEMY_TRUST_PROXY=1 for the platform proxy.
4. Build with npm ci --include=dev && npm run build; start with npm start.
5. Set the final generated HTTPS origin or your custom domain in ACADEMY_PUBLIC_URL. Health checks use /healthz.

Render runs safely repeatable migrations at startup when AUTO_MIGRATE is true. For a larger deployment, run the migration once before the rollout and set it false. The remote database preserves records across restarts and rebuilds.

### Railway

1. Create a service in your own Railway project. Use the extracted folder with the Railway CLI, or provide your own repository.
2. railway.toml selects the supplied Dockerfile, npm start and /healthz.
3. Enter all required variables, including ACADEMY_AUTO_MIGRATE=true and ACADEMY_TRUST_PROXY=1.
4. Generate a public HTTPS domain, set ACADEMY_PUBLIC_URL to it and configure the same URLs in Supabase.

```sh
railway login
railway init
railway up
```

For an existing project, use railway link instead of railway init. Select the correct service before deploying. Railway supplies PORT; the server listens on 0.0.0.0. No local storage volume is required because the Academy uses the remote database.

## 5. Register the administrator and team

Set ACADEMY_OWNER_EMAIL to your real owner sign-in address **before anyone registers**. Register that email, confirm it and complete the learner profile. The verified matching account becomes the administrator.

Open Launch & team. It prepares one administrator entry, one demo appointment and six teacher appointments. Enter the real names, exact sign-in emails, expiry dates, course assignments and checked teacher qualifications. Each person registers with their own email and claims only that appointment.

The demo receives all 129 guided courses, 48 professional programmes and practice tools. It has no administrator access or other learners' records. Teachers receive only assigned course and teaching operations access. Reviewers and certificate verifiers are separately appointed; a teacher is not automatically an assessor.

Shared default passwords and fabricated identities are not installed. See [PRODUCTION_LAUNCH.md](PRODUCTION_LAUNCH.md) for teaching operations.

## 6. Add real payment settings and offers

Keep ACADEMY_PAYMENT_PUBLIC=false during setup. Paid enrolment opens after your merchant and real product terms are ready. Free registered learning remains available.

For an Indian INR merchant, configure Razorpay with RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET in your host, or use the encrypted connection form in Launch & team. Environment-only credentials are verified by a read-only provider request on application startup; no charge is created. Test credentials do not open live purchases. A saved dashboard connection takes precedence over environment keys.

In Razorpay, configure automatic capture and this publicly reachable HTTPS webhook:

```text
YOUR_HTTPS_ORIGIN/api/payments/razorpay
```

Select payment.captured, order.paid, refund.processed, payment.dispute.created, payment.dispute.under_review and payment.dispute.lost. Use the same webhook secret.

Publish your actual approved INR offers in Launch & team. Enter the total price in rupees in the form; the server stores integer paise. Select the exact included courses, access duration, actual terms and refund policy. Teacher offers require qualified assigned staff and contain eight weeks, 24 two-hour classes and at most three classes per week.

After verifying the public notification endpoint and merchant settings, set ACADEMY_PAYMENT_PUBLIC=true and restart/redeploy. Complete a real transaction and refund through your own merchant before inviting paying students. Access is granted only for confirmed captured payments and withdrawn for a confirmed full refund or dispute.

Stripe, Gumroad, Binance Pay and NOWPayments adapters are also retained; their variables and webhook paths are in ENVIRONMENT.md. Only configured providers supported by the actual approved offer appear. Card brands, Google Pay and UPI availability are controlled by the eligible merchant and hosted checkout. External wallet subscriptions and approval are not created by this ZIP.

## 7. Verify the deployed workflow

1. Open /healthz: it should report ready.
2. Open dashboard, workspace and a paid course in a private browser: account entry should open with no course sidebar.
3. Register a real learner, confirm their email and complete the profile: only free courses open.
4. Save a learning plan and reload: the plan should return.
5. Confirm owner, demo and teacher scopes with the actual corresponding verified accounts.
6. Buy one actual approved offer, verify its captured merchant payment, receipt and exact course access.
7. Book and deliver a teacher class with real meeting details; attendance is recorded after the class.
8. Test purchase withdrawal with a real refund. A page visit or browser checkout return must not grant access.
9. Review and independently verify eligible learning evidence; check the issued certificate QR and revocation.

Browser speech input depends on browser support and microphone permission over HTTPS. External tools open their own services; students may need their own tool subscriptions. The built-in notebook, project board, design desk, inspectors and learning workflows are included.

## Operations

Keep the database token and session key in host secret settings. Use your database provider's backup/restore controls; preserve the session key with a protected backup. Use a separate staging database and merchant configuration. Apply migrations from the intended release before a rollout. Roll back application code only to a release compatible with the already-applied schema; the runtime rejects migration-history drift.

Use host monitoring and /healthz. Provider webhooks must be publicly reachable while learning stays authenticated. App responses are private/no-store, including on Vercel's CDN. Local preview uses the same protected runtime; it cannot bypass registration.

### Troubleshooting

| Symptom | Check |
| --- | --- |
| Server configuration message | Required env names and valid HTTPS origin; restart after changing env |
| Database readiness fails | Turso URL, active write token, db:migrate and migration checksums |
| Account unavailable | Supabase project URL, publishable key, session key and provider connectivity |
| Email confirms but dashboard stays locked | Exact email templates above, redirect allowlist and completed learner profile |
| Unexpected redirect to another domain | ACADEMY_PUBLIC_URL must match the real production domain |
| No paid checkout appears | PAYMENT_PUBLIC=true, verified live merchant and approved offer with supported provider |
| Webhook fails | Public host entry, exact webhook path/secret and original raw request body |
| Staff stays pending | Matching confirmed email, registration, expiry and appointment scope |

### Validation scope

The package is tested with its real compiled application, real local libSQL/SQLite persistence and actual Node HTTP transport. Identity and payment-provider responses in automated tests are controlled fixtures. Your cloud deployment, SMTP delivery, merchant approval and live transactions need your real accounts and environment values; no live charge or remote deployment was performed for this ZIP.

Provider references checked during packaging:

- [Vercel Node.js runtime](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel rewrites](https://vercel.com/docs/routing/rewrites)
- [Render Node service](https://render.com/docs/deploy-node-express-app)
- [Render Blueprint](https://render.com/docs/blueprint-spec)
- [Railway configuration](https://docs.railway.com/config-as-code/reference)
- [libSQL client](https://tursodatabase.github.io/libsql-client-ts/)
- [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
