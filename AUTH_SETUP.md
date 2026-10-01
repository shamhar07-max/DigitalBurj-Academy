# DigitalBurj account services

The existing private Site audience is preserved. Registration does not grant Site access, ownership, staff roles or credentials.

## Deployed implementation

Cloudflare Worker serves the frontend and backend. D1 stores learner profiles, draft snapshots, evidence submissions, reviews, staff appointments, credentials, support records and orders. Supabase Auth is the managed email/password identity boundary. Passwords are sent directly from the Worker to Auth and never stored in D1. Provider access/refresh tokens are encrypted using the Sites secret ACADEMY_SESSION_KEY. Browser sessions use random HttpOnly Secure SameSite=Lax cookies; only their SHA-256 hashes are stored. Sessions expire after seven days. Provider identity is verified server-side. Profile roles supplied by learners have no effect.

## Identity activation still required

No Supabase project existed at implementation time. Provisioning requires the user's organization selection and explicit cost confirmation through the Supabase connector. Email registration and login remain clearly disabled until connected. The owner can bootstrap Admin through the existing authenticated private Site session.

Once provisioned, enter the project URL and sb_publishable_ key in /admin. Enable Email provider with Confirm email enabled. Add the production Site origin and /auth/confirm and /reset-password to allowed redirects. Set Site URL to the production origin. Configure an email delivery provider suitable for actual learner addresses. Configure confirmation template URL to {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email and recovery template URL to {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery. This integration uses server token-hash verification, not browser URL access tokens. Configure Supabase password minimum to 12 characters and appropriate abuse controls. Test real registration, inbox delivery, confirmation, login, refresh, recovery, change password and logout before enrolling learners. Automated provider tests use mocked responses and do not prove live delivery.

## Staff

Add the existing five staff later through Admin. Each appointment requires account email, owner-checked qualification evidence, allowed programmes, role and qualification review date. The matching confirmed account accepts its appointment by saving its learning profile. A reviewer and verifier must be different people for each submission, even if both have both roles. Appointments do not send email. Existing account holders save their profile again to accept a new or updated appointment.

## Release checks and limits

npm test covers existing services, curriculum navigation, teaching flows and mocked managed identity. Browser visual rendering has not been verified in this Worker-only workspace. Live auth, email delivery and payments remain dependent on external provisioning and configuration. The academy issues its own evidence-based credentials; this is not external accreditation. Existing payment operations remain blocked until real payment keys and approved products are configured.
