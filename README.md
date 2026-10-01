# DigitalBurj Academy

Complete Academy source for Cloudflare Workers with Static Assets, Turso/libSQL storage and Supabase email/password authentication. The original DigitalBurj brand assets, Guided and Professional learning paths, Professional Practice Workspace, learning evidence, purchase entitlements, teacher appointments, receipts and certificate workflows are included.

## Deploy from GitHub on your Chromebook

Cloudflare builds this repository in the cloud. You do not need to install Linux or Node on your Chromebook. Connect this repository at **Cloudflare → Workers & Pages → Create application → Import a repository**.

| Setting | Value |
| --- | --- |
| Repository | `shamhar07-max/DigitalBurj-Academy` |
| Worker name | `digitalburj-academy` |
| Production branch | `main` |
| Root directory | `/` |
| Build command | `npm run build:cloudflare` |
| Initial deploy command | `npx wrangler deploy` |
| Build variable | `NODE_VERSION=24` |

Keep automatic dependency installation enabled. Disable preview builds for the initial launch. The first publication exposes an uncached 503 configuration response until the private database and authentication settings are present.

After creating your intended Turso database, add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` as **build secrets**, then change the production deploy command to:

```sh
node scripts/database.mjs && npx wrangler deploy
```

That command applies the eight checksum-checked schema migrations before publishing. Keep migrations in the production deploy command, not the build or preview command. It does not reset the database.

Add the separate application **runtime secrets** under the Worker’s **Settings → Variables & Secrets**. Build secrets do not become runtime secrets. Required configuration includes the exact HTTPS Academy URL, owner email, stable session key, Turso credentials and Supabase URL/publishable key. Keep public payment disabled until the approved merchant, offers, terms, refund policies and signed notifications are configured.

**[Follow the complete GitHub and Chromebook deployment guide](docs/CLOUDFLARE_GITHUB_DEPLOYMENT.md).** It covers database setup, every runtime setting, registration email, your custom domain, owner/demo/six teacher identities and real payment activation.

The offline [session-key generator](DigitalBurj_Session_Key_Generator.html) creates a fresh key on your own computer. Download and open it locally in Chrome, then copy the value directly into your private Cloudflare runtime secret. Do not commit generated keys or populated environment files.

## Application workflow

1. View public course information, then register, confirm email and complete the student profile.
2. Enter the dedicated dashboard. Free basics and practice are available to registered students.
3. Choose a course or teaching offer. A verified payment grants only the purchased scope.
4. Follow the lesson sequence: understand, explain by text or supported voice input, build/fix, test and improve.
5. Practice in the Academy’s Professional Practice Workspace. Save learning evidence and receive scoped teacher support.
6. Complete the required assessments and review before certificate issuance and verification.

Dashboard/workspace assets and paid content pass through server-side access checks. The production upload excludes complete public course dumps. Actual third-party tool accounts, paid subscriptions, teacher meetings, email delivery and merchant activity require your own configuration.

## Development and validation

Node 24 is required; Wrangler and dependencies are pinned in the lockfile.

```sh
npm ci --include=dev
npm run build:cloudflare
npm run test:cloudflare
npm run test:cloudflare-runtime
npm run cloudflare:dry-run
```

The Cloudflare edition passed 15 HTTP database/transport checks and 62 workerd runtime checks using controlled identity and payment fixtures. The production transport, raw signed payment notifications, free/paid gates, owner appointments and session revocation are covered. Local workerd and a dry run do not certify the live account’s free CPU quota or real merchant/email readiness.

Generated `.cloudflare`, `.generated`, installed packages and the portable embedded `dist/server` bundle are intentionally excluded from Git; build commands recreate them. Original UI/course source, fonts, brand assets, migration files and validation reports are preserved.

Additional deployment options and operating instructions are in [docs](docs), including [Cloudflare](docs/CLOUDFLARE_DEPLOYMENT.md), [authentication](AUTH_SETUP.md), and the supplied Vercel/Render/Railway configurations.
