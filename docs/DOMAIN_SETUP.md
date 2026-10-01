# academy.digitalburj.com

Added to the existing Sites project on 1 October 2026. Status at registration: **pending**, certificate initializing. The domain does not route to this Academy until these records are set and verification succeeds.

| Type | Full DNS name | Value |
|---|---|---|
| CNAME | academy.digitalburj.com | custom-domains.chatgpt.site. |
| TXT | _openai-site-verification.academy.digitalburj.com | openai-site-verification=IFdjeGUkR4eucCs9tmo4UEKLfLuJFhKe_6dT0fIAxwI |
| TXT | _cf-custom-hostname.academy.digitalburj.com | 13c30f02-3daa-4549-82ee-f5bc7c19e7d2 |

Use the exact names and values returned above in the authoritative DNS zone for digitalburj.com. Remove a conflicting record only after checking what it currently serves. When domain verification and TLS become active, test `/sign-in`, `/register`, `/auth/confirm`, `/dashboard`, payment return routes and public certificate lookup on that hostname. Configure identity and merchant callback URLs for the same HTTPS origin.

The current working preview URL is https://digitalburj-academy.loadbyton569388.chatgpt.site. Its owner-private sharing policy has been preserved.
