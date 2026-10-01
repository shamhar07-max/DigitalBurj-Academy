# Server environment reference

Enter these in the selected host's environment settings. The .env.example and host-specific templates contain blank placeholders. Only PUBLIC_URL and the Supabase project URL are public information; keep all credentials in server settings.

| Variable | Required | Value / purpose |
| --- | --- | --- |
| NODE_ENV | Yes | production on cloud hosts; development for loopback local development |
| ACADEMY_PUBLIC_URL | Yes | Actual HTTPS origin, with no path, query or fragment |
| ACADEMY_OWNER_EMAIL | Yes | Real administrator's sign-in email |
| ACADEMY_SESSION_KEY | Yes | 64 lowercase hex characters from npm run session:key; keep stable |
| TURSO_DATABASE_URL | Yes | Hosted libsql:// or HTTPS database URL |
| TURSO_AUTH_TOKEN | Yes | Valid write-capable token for that database |
| SUPABASE_URL | Yes | https://YOUR-PROJECT.supabase.co |
| SUPABASE_PUBLISHABLE_KEY | Yes | Project publishable key for server email/password requests |
| ACADEMY_AUTO_MIGRATE | Recommended | true for initial Render/Railway startup; false for Vercel/manual migrations |
| ACADEMY_PAYMENT_PUBLIC | Yes | false during setup; true after merchant/public webhook readiness |
| ACADEMY_TRUST_PROXY | Render/Railway | 1 for one trusted platform proxy; 0 locally. Count trusted hops from the right |
| PORT | Automatic | Render/Railway provide it; default local port 3000 |
| ACADEMY_LIVE_PRODUCTS | Optional | JSON offer array; default []; prefer the owner's Launch & team form |
| ACADEMY_BUSINESS | Optional | JSON business record; prefer the owner form |
| RAZORPAY_KEY_ID | Razorpay | Merchant's live key ID |
| RAZORPAY_KEY_SECRET | Razorpay | Key secret, server-only |
| RAZORPAY_WEBHOOK_SECRET | Razorpay | Same secret as configured webhook, at least 16 characters |
| STRIPE_SECRET_KEY | Stripe | Secret API key |
| STRIPE_PUBLISHABLE_KEY | Stripe | Corresponding public checkout key |
| STRIPE_WEBHOOK_SECRET | Stripe | Signing secret for /api/payments/webhook |
| GUMROAD_ACCESS_TOKEN | Gumroad | Seller's API access token |
| GUMROAD_SELLER_ID | Gumroad | Actual seller ID |
| GUMROAD_WEBHOOK_SECRET | Gumroad | Secret matching the configured notification URL |
| BINANCE_PAY_KEY | Binance Pay | Merchant API certificate/key identifier |
| BINANCE_PAY_SECRET | Binance Pay | Merchant API signing secret |
| BINANCE_PAY_MERCHANT_ID | Binance Pay | Actual merchant identifier |
| BINANCE_PAY_PUBLIC_KEY | Binance Pay | Provider PEM verification public key |
| BINANCE_PAY_CERTIFICATE_SN | Binance Pay | Exact notification signing certificate identifier |
| NOWPAYMENTS_API_KEY | NOWPayments | Merchant API key |
| NOWPAYMENTS_IPN_SECRET | NOWPayments | IPN signature secret |
| ACADEMY_CRYPTO_ASSETS | NOWPayments | JSON list of actual supported currency IDs and display labels; default [] |

ACADEMY_PLATFORM_AUTH is disabled by the portable runtime even if supplied. Do not rely on Sites identity headers. RAZORPAY_VERIFIED is calculated from the connection check and should not be manually set.

## Optional-provider offer fields

Every paid offer needs a unique ID, title, Live status, positive integer amount in minor currency units, currency, included course IDs, durationDays, an owner reviewApproval, HTTPS termsUrl and an actual refundPolicy. Providers are explicitly listed as razorpay, stripe, gumroad, binance or crypto. No prices or currency conversions are invented.

| Adapter | Extra offer settings | Public notification |
| --- | --- | --- |
| Razorpay | INR currency, providers includes razorpay | /api/payments/razorpay |
| Stripe | Actual Stripe priceId matching amount/currency, providers includes stripe | /api/payments/webhook |
| Gumroad | Actual gumroadProductId and HTTPS gumroadUrl, USD currency, providers includes gumroad | /api/payments/gumroad?hook=YOUR_WEBHOOK_SECRET |
| Binance Pay | Merchant-supported quote, providers includes binance | /api/payments/binance |
| NOWPayments | Configured accepted ACADEMY_CRYPTO_ASSETS, providers includes crypto | /api/payments/crypto |

Treat the Gumroad notification URL as secret because it contains its hook value. These adapters require eligible approved commercial accounts and correctly configured provider notifications. The Academy does not grant merchant approval or guarantee a payment method for an Indian seller.

The standard Launch & team offer form publishes INR Razorpay offers. For additional provider offers, put your approved offer JSON in ACADEMY_LIVE_PRODUCTS before using that form, or extend the commercial form deliberately. Once the owner saves offers, the database's commercial_products setting takes precedence over the environment offer list. This prevents a redeploy silently overwriting approved live pricing.

## Local development

Use NODE_ENV=development and ACADEMY_PUBLIC_URL=http://127.0.0.1:3000. A TURSO_DATABASE_URL=file:./academy-development.db is accepted only outside production. Supabase email verification still applies; add exact local auth/confirm and reset-password URLs to a dedicated development identity project. Keep PAYMENT_PUBLIC=false and use isolated development data.

## Host presets

- .env.vercel.example: manual migration default, proxy 0; Vercel's native ingress IP is handled by its function.
- .env.render.example: automatic initial migration, one platform proxy.
- .env.railway.example: automatic initial migration, one platform proxy.

Never upload a filled .env file in the ZIP or publish it as a static file.
