# Deploy DigitalBurj Academy with no monthly hosting subscription

This package adds a Netlify Node 24 function to the complete Academy. No GitHub push is needed. All pages, course scripts, APIs, teacher operations and signed payment callbacks pass through the existing protected backend. The original brand, curriculum, features and database schema are retained.

Use Netlify Free for hosting, Turso Free for the application's libSQL database, Supabase Free for email/password identity and Resend Free for registration email delivery through Supabase SMTP. These plans can cover a small commercial launch while usage stays within their free allowances. They do not promise unlimited capacity or uninterrupted service after a quota is exhausted. A payment processor's transaction fees, domain renewal and optional external subscriptions are separate from hosting.

## 1. Prepare your computer

Install Node 24. Extract the ZIP and open a terminal in the DigitalBurj-Academy folder that contains package.json and netlify.toml.

```sh
npm ci --include=dev
npm run session:key
```

Save the generated 64-character key privately and keep it stable. It encrypts sessions and stored merchant settings.

## 2. Create and link a Netlify Free project

Sign up at https://app.netlify.com and choose the Free plan.

```sh
npx netlify-cli@latest login
npx netlify-cli@latest sites:create
```

Select your own Free team and choose an available project name. The create command automatically links this folder to the new project without connecting or modifying GitHub. For an existing project, use npx netlify-cli@latest link instead and select it by name. Copy the project's actual production address from its dashboard, for example the assigned HTTPS netlify.app address. Do not substitute the deploy-preview URL or a made-up hostname.

You may connect your existing academy.digitalburj.com in Netlify's Domain management. Add the DNS records shown by Netlify in your domain provider. Hosting the subdomain adds no Netlify domain-hosting charge; purchasing or renewing a domain is separate. You can begin with the provided netlify.app address.

## 3. Create the hosted database

Create a libSQL database in Turso's Free plan. Copy its libsql:// database URL and a write-capable database token. This application uses libSQL, not the newer Turso engine or Supabase Postgres.

Keep these values for TURSO_DATABASE_URL and TURSO_AUTH_TOKEN. Stay on the Free plan without enabling paid overages.

## 4. Set up Supabase and free registration emails

Create a Supabase Free project. Copy the project URL and publishable key from the Connect dialog. Keep email confirmation enabled.

Set Authentication > URL Configuration > Site URL to your exact Academy production origin. Add that origin followed by /auth/confirm and /reset-password as allowed Redirect URLs. For example, if you use your own domain:

```text
https://academy.digitalburj.com
https://academy.digitalburj.com/auth/confirm
https://academy.digitalburj.com/reset-password
```

For a netlify.app address, substitute that exact assigned hostname everywhere, including ACADEMY_PUBLIC_URL. All URLs must agree.

Under Authentication > Email Templates, use this Confirm signup template:

```html
<h2>Confirm your DigitalBurj Academy email</h2>
<p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=email">Confirm my email</a></p>
```

Use this Reset password template:

```html
<h2>Reset your DigitalBurj Academy password</h2>
<p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=recovery">Reset my password</a></p>
```

Create a Resend Free account, add and verify a domain you own such as digitalburj.com using the DNS records Resend supplies, and create its sending API key. In Supabase's custom SMTP settings enter Resend's SMTP details:

| Setting | Value |
| --- | --- |
| SMTP host | smtp.resend.com |
| Port | 465 |
| Username | resend |
| Password | Your Resend API key |
| Sender address | A sender on your verified domain |
| Sender name | DigitalBurj Academy |

SMTP runs from Supabase. The Academy does not connect directly to an SMTP port. Supabase's default sender is restricted to project-team addresses; configure custom SMTP before opening registration to students. Your domain must already be owned and verified for Resend to send to arbitrary students. The Resend testing domain is not a production student sender.

## 5. Set the production environment

Copy .env.netlify.example to a private file named .env.local. Fill every required value. Leave optional unused merchant keys empty. Do not share this file or put it into the public directory.

| Variable | Value |
| --- | --- |
| NODE_ENV | production |
| NODE_VERSION | 24 |
| AWS_LAMBDA_JS_RUNTIME | nodejs24.x |
| ACADEMY_PUBLIC_URL | Your exact HTTPS production origin |
| ACADEMY_OWNER_EMAIL | Your real administrator email |
| ACADEMY_SESSION_KEY | The key from step 1 |
| TURSO_DATABASE_URL | The libSQL URL |
| TURSO_AUTH_TOKEN | The write-capable database token |
| SUPABASE_URL | Your Supabase project URL |
| SUPABASE_PUBLISHABLE_KEY | Your project's publishable key |
| ACADEMY_AUTO_MIGRATE | false |
| ACADEMY_PAYMENT_PUBLIC | false |
| ACADEMY_TRUST_PROXY | 0 |
| ACADEMY_LIVE_PRODUCTS | [] |
| ACADEMY_BUSINESS | {} |

Add the same values in Netlify's project environment-variable settings for Production. Runtime variables must include Functions scope (or all scopes). Build/runtime controls must be available to Builds as well. Set AWS_LAMBDA_JS_RUNTIME using Netlify's UI, CLI or API; it is deliberately not in netlify.toml. Save tokens, session key and merchant credentials as secret values where supported. A local .env.local file alone does not configure the deployed function.

## 6. Apply migrations locally

```sh
node --env-file=.env.local scripts/check-config.mjs
npm run build
node --env-file=.env.local scripts/database.mjs
node --env-file=.env.local scripts/database.mjs --check
```

The last command must report ready. It verifies eight schema migrations. Netlify functions check the schema at startup; automatic migrations remain off. The hosted database persists accounts and purchases between function invocations and deployments.

## 7. Deploy the backend and interface together

Keep netlify.toml unchanged. Build command is npm run build, publish directory is public, functions directory is netlify/functions, and runtime is Node 24. public is intentionally empty: protected interface assets are bundled into the function. Do not select dist as the publish directory or add a static index.html rewrite.

```sh
npx netlify-cli@latest deploy --prod --context production
```

The current CLI builds and uploads functions as well as static output. A drag-and-drop static ZIP upload does not deploy this backend. Only the public directory and built function are uploaded; local secret files are outside the publish directory and are not function imports or included files.

New projects may start private. In the Netlify dashboard set the production project's visibility to public when you are ready to accept students and signed merchant callbacks. The registration page and provider callbacks must be reachable without a Netlify platform login. Academy roles, verified registration and purchases still protect learning content.

## 8. Activate owner and staff

Open YOUR_ORIGIN/healthz and confirm it reports {"status":"ready"}. Then open YOUR_ORIGIN/register and register the exact ACADEMY_OWNER_EMAIL. Confirm the email and complete the learner profile. This account becomes the administrator.

Open Launch & team, complete the demo and six teacher appointments with real emails, names, course scope, expiry and checked qualifications. Each person registers with their own verified email. These are accounts inside the Academy; the six teachers do not need paid Netlify team seats.

## 9. Configure actual sales

Keep ACADEMY_PAYMENT_PUBLIC=false until the live merchant, approved offers and callback have been checked. Configure real Razorpay keys and webhook secret, or another eligible supported provider, following DEPLOYMENT.md and ENVIRONMENT.md. For Razorpay the callback is YOUR_ORIGIN/api/payments/razorpay. Use the same configured origin and webhook secret in the merchant dashboard.

Publish your real prices and terms in Launch & team. After merchant verification, change ACADEMY_PAYMENT_PUBLIC to true in Netlify and deploy again. A confirmed captured payment grants only purchased course access. A confirmed full refund or dispute withdraws it. Payment fees are charged by the provider per transaction even when your hosting subscription is $0.

## 10. Check the end-to-end workflow and watch allowances

Check registration email and recovery, private-browser dashboard/workspace gating, free learner practice, purchased course scope, saved progress, teacher booking and receipts. Check signed payment notifications and an actual merchant transaction/refund before selling to students. No live purchase or remote deployment was performed when preparing this ZIP.

Free plan facts checked on 1 October 2026:

| Service | Free allowance / material limit |
| --- | --- |
| Netlify | Commercial projects permitted; 300 credits per month shared by production deploys, bandwidth, requests and compute. A production deploy uses 15 credits. Exhausted allowance pauses projects until renewal or upgrade, rather than creating a Free-plan overage bill. Some Free public projects display Netlify's platform badge. |
| Turso | $0/month; currently 5 GB storage, 500 million rows read and 10 million rows written per month. Stay within limits and keep paid overages disabled. |
| Supabase | $0/month; 50,000 included monthly active Auth users; free projects can pause after a week of inactivity. |
| Resend | $0/month; 3,000 transactional emails per month, at most 100 per day. |

The host's request/bandwidth/compute budget must be checked against actual Academy traffic. A visitor downloads multiple files and makes multiple API calls; credits are not a student count. Protected assets are deliberately served through the function, so their delivery contributes to usage. Do not promise unlimited enrolments or a fixed free capacity from these provider quotas alone. All free services have independent limits; exhausting one can interrupt registration or learning.

If you later need higher sustained capacity, paid plans or another compatible deployment may be necessary. Render's Free service can run this package but sleeps after 15 idle minutes and Render explicitly advises against production use. Vercel Hobby restricts commercial use. Cloudflare Workers Free is another possible host, but requires its own tested adapter and has a 10 ms CPU limit per invocation; that platform is not configured by this Netlify extension.

## Validation of this extension

Run node tests/netlify.test.mjs and npm run test:portable after installation and build. The Netlify test exercises raw request preservation, platform client IP, secure/no-store responses and the real compiled application's registration/profile/permissions with a local persistent libSQL database. Identity responses are controlled fixtures. Baseline full Academy reports remain in docs. Additional bundle-validation results, when available, are recorded in netlify-validation.json. Your actual Netlify project, credentials, email delivery and live merchant must be checked after deployment.

Official references:

- https://www.netlify.com/blog/introducing-netlify-free-plan/ (commercial permission; current quotas are on the pricing page)
- https://www.netlify.com/pricing/
- https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/
- https://docs.netlify.com/manage/accounts-and-billing/billing/resume-paused-projects/
- https://docs.netlify.com/build/functions/api/
- https://docs.netlify.com/build/functions/configuration/
- https://cli.netlify.com/commands/deploy/
- https://turso.tech/pricing
- https://supabase.com/pricing
- https://supabase.com/docs/guides/auth/auth-smtp
- https://resend.com/pricing
- https://resend.com/docs/send-with-smtp
- https://render.com/docs/free
- https://vercel.com/docs/plans/hobby
- https://developers.cloudflare.com/workers/platform/pricing/
