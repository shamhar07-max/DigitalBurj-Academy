# DigitalBurj Academy: Chromebook → GitHub → Cloudflare

Use your Chromebook browser for the complete upload and deployment workflow. You do not need to enable Linux or install Node locally. Cloudflare builds the source in its own environment. This guide deploys the Academy from `shamhar07-max/DigitalBurj-Academy`. The original `DigitalBurjFinalMain` repository is separate.

## 1. Source is already in GitHub

The complete source is published at https://github.com/shamhar07-max/DigitalBurj-Academy on `main`. The application files are at the repository root. No ZIP or upload-batch folders are needed for Cloudflare to build this repository. The earlier browser upload kit remains an independent offline delivery option.

## 2. Open your intended Cloudflare account

Continue in your Chromebook browser. No local Node installation, Linux setup or Wrangler login is needed. Connect this repository to the intended Cloudflare account in the next step.

## 3. Connect the repository to Cloudflare Workers

Open https://dash.cloudflare.com. Choose the intended account and keep Workers Free unless you decide otherwise. Go to Workers & Pages → Create application → Import a repository → Get started. Connect GitHub and authorize access to the intended repository. Select `DigitalBurj-Academy`.

If you already created the intended Academy Worker, select that Worker → Settings → Builds → Connect instead. Do not create an unrelated second Worker.

Use these settings for the first publication:

| Setting | Value |
| --- | --- |
| Worker name | `digitalburj-academy` — matches `wrangler.toml` |
| Production branch | `main` |
| Root directory | `/` — package.json and wrangler.toml at repository root |
| Build command | `npm run build:cloudflare` |
| Deploy command initially | `npx wrangler deploy` |
| Build variable | `NODE_VERSION` = `24` |
| Non-production branch builds | Disabled for this first launch |

Keep automatic dependency installation enabled. Cloudflare installs dependencies from the package and lockfile, builds the Worker and uploads its static assets. Its Git integration handles deployment authentication; no local Wrangler login is needed.

Select Deploy. Save the actual `https://digitalburj-academy.<your-subdomain>.workers.dev` address Cloudflare provides. At this point an uncached 503 configuration response is expected: the code is published, but the private database and authentication configuration is not present yet.

## 4. Set up Turso and Supabase

Create or choose the intended Turso database at https://turso.tech. Obtain its hosted `libsql://` or HTTPS database URL and a token with write access for that database. If you already have a production database, keep it; do not reset it or populate it with demo fixtures.

Create or choose the intended Supabase project at https://supabase.com/dashboard. Keep email/password authentication and email confirmation enabled. Copy the project URL and its publishable key from the Connect dialog or Settings → API Keys. This application does not need a Supabase service-role key.

## 5. Run database setup in Cloudflare's deployment environment

Open your Worker → Settings → Builds (or Build) → Build Variables and Secrets. Add:

| Name | Value | Type |
| --- | --- | --- |
| `NODE_VERSION` | `24` | Build variable |
| `TURSO_DATABASE_URL` | Your hosted database URL | Build secret |
| `TURSO_AUTH_TOKEN` | The write-capable token | Build secret |

Change the production deploy command to:

```sh
node scripts/database.mjs && npx wrangler deploy
```

Keep the build command as `npm run build:cloudflare`. Save the settings and retry the latest main-branch build, or trigger a fresh main-branch deployment. The Node migration command creates the eight original schema migrations and checks their history. It uses only the Turso URL and token, prints no tokens, and does not reset the database. On subsequent deployments, it applies only unapplied migrations. If the migration command fails, the deployment command does not run.

The migration command is in the PRODUCTION DEPLOY command, not in the build command or preview command. Keep previews disabled until you have a separate staging configuration. Do not run several migration deployments simultaneously.

## 6. Add the separate runtime secrets

Build variables do not become Worker runtime settings. Open your Worker → Settings → Variables & Secrets. Add every following item as a Secret, including the non-sensitive configuration values, then save/deploy the settings. This avoids regular Wrangler deployments clearing dashboard-only plaintext variables.

| Name | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `ACADEMY_PUBLIC_URL` | Exact HTTPS Academy address from step 3, with no path |
| `ACADEMY_OWNER_EMAIL` | Your actual owner's email |
| `ACADEMY_SESSION_KEY` | A fresh 64-character lowercase hexadecimal key |
| `TURSO_DATABASE_URL` | Same hosted database URL used for migrations |
| `TURSO_AUTH_TOKEN` | Same write-capable database token |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `ACADEMY_AUTO_MIGRATE` | `false` |
| `ACADEMY_PAYMENT_PUBLIC` | `false` |
| `ACADEMY_TRUST_PROXY` | `0` |
| `ACADEMY_LIVE_PRODUCTS` | `[]` |
| `ACADEMY_BUSINESS` | `{}` |

For the session key, download and open `DigitalBurj_Session_Key_Generator.html` from this repository locally in Chrome. Press Generate key and copy it directly into `ACADEMY_SESSION_KEY`. The page creates the key on your Chromebook, sends nothing to a service, and does not store it. Save the key privately and preserve it between releases. Do not paste keys, tokens or populated environment files into GitHub, chat, or screenshots.

## 7. Configure registration and recovery email

In Supabase Authentication → URL Configuration, set Site URL to the exact `ACADEMY_PUBLIC_URL`. Add these redirect addresses, replacing YOUR-ACADEMY-ADDRESS with your actual hostname:

```text
https://YOUR-ACADEMY-ADDRESS/auth/confirm
https://YOUR-ACADEMY-ADDRESS/reset-password
```

Configure custom SMTP for public student registration. Supabase's default email service is intended for tests with members of your project team, not open student registration. With Resend, verify a sending domain you own, obtain an API key and configure SMTP host `smtp.resend.com`, port `465`, username `resend`, and the API key as the SMTP password. Set your real verified sender address.

Set the link in the Supabase Confirm signup email template to:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=email">Confirm my email</a>
```

Set the link in the Reset password template to:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=recovery">Reset my password</a>
```

Keep confirmation enabled. Test actual confirmation and recovery delivery before inviting students.

## 8. Check live readiness

Visit your canonical Academy address followed by `/healthz`. Expect:

```json
{"status":"ready"}
```

Check `/register` and `/sign-in` in a signed-out browser; neither should show the Academy sidebar. Dashboard, workspace, protected lesson scripts and course APIs must remain gated. Register a separate student, verify email and finish their profile. Confirm free basics/practice work and unpaid courses stay locked.

Register using `ACADEMY_OWNER_EMAIL`, verify the email and finish the profile and consent. Use owner operations to initialize appointments and assign your demo identity and six teachers with actual verified emails, course scope, expiry and checked qualifications. Each uses their own password; this package does not create shared default passwords.

## 9. Attach academy.digitalburj.com

The `digitalburj.com` zone must be active in Cloudflare. If DNS currently resides elsewhere, preserve the main website, mail and other existing records when moving nameservers. Review any existing record on the Academy hostname before changing it.

In GitHub, edit `wrangler.toml` and add:

```toml
[[routes]]
pattern = "academy.digitalburj.com"
custom_domain = true
```

Commit to main. Cloudflare builds and deploys the change, provisions the hostname and its HTTPS certificate. Update the runtime secret `ACADEMY_PUBLIC_URL` to `https://academy.digitalburj.com`, then update Supabase Site URL, both redirects and configured payment webhooks. Once the domain works, you can set `workers_dev = false` in wrangler.toml and commit if you want only the custom domain exposed.

## 10. Enable commercial payment and teaching

Follow `docs/CLOUDFLARE_DEPLOYMENT.md` and the Academy's production guide for merchant setup. Add real provider keys ONLY as runtime secrets. Publish actual reviewed INR offers, purchased-course scope, duration, business details, terms and refund policies through owner operations. Keep `ACADEMY_PAYMENT_PUBLIC=false` until those are ready.

For Razorpay, configure the signed webhook at `https://academy.digitalburj.com/api/payments/razorpay` and set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. Set the payment flag to `true` only after readiness checks. Real card entry belongs to the provider's hosted checkout. Check signed payment notifications, purchased-only access, animated receipts and access revocation on refunds/disputes. A live charge or refund is an explicit merchant/customer action, not an automatic deployment step.

Add actual teacher availability and meeting links; test booking, attendance and assessments before offering a paid mentorship timetable. No real teachers, transactions or certificates are fabricated by deployment.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Missing package.json or build script | All three upload batches were merged at the correct root. A ZIP file alone is not source for the build. |
| Worker name mismatch | Cloudflare Worker name and wrangler.toml `name` both say `digitalburj-academy`. |
| Node version error | Build variable NODE_VERSION is 24. |
| Database setup failed | Build secrets contain the correct Turso URL and a write token; inspect migration history without resetting existing data. |
| Deployment succeeds but site returns 503 | Runtime secrets are set in Variables & Secrets, not only in the separate build settings, and database migrations succeeded. |
| Registration email refused or absent | Custom SMTP, verified sender/domain, email template, redirects and provider quotas. |
| Worker URL redirects elsewhere | ACADEMY_PUBLIC_URL is the canonical origin. Use that URL or update it consistently. |
| Later deployment loses settings | Store application configuration as runtime Secrets; plaintext variables may be replaced by wrangler.toml configuration. |

This kit preserves the already-tested Cloudflare Academy source. Its upload batches have been reconstructed and built locally. GitHub upload, Cloudflare publication, live CPU/quota profiling, actual email delivery and merchant verification remain your account-specific launch steps. Free provider quotas, domain costs and gateway transaction fees still apply; the kit does not enable a paid Workers subscription.

## Official references checked 1 October 2026

- https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- https://developers.cloudflare.com/workers/ci-cd/builds/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/workers/ci-cd/builds/build-image/
- https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/
- https://developers.cloudflare.com/workers/wrangler/commands/workers/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/auth/auth-smtp
- https://resend.com/docs/send-with-supabase-smtp
