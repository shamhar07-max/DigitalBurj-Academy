# Scale and operations plan

This release uses a Worker, D1 relational storage, managed identity and provider-owned checkout. It does not claim a tested user capacity. Expand based on measured load and operational need.

## Data and permissions

The database contains 24 tables. Profiles and sessions provide identity continuity; entitlements and order snapshots provide access; recipe_work stores versioned evidence; academy_awards stores issued credentials; audit records sensitive decisions. The original snapshot, submission, staff, credential and request tables are retained.

The trusted entry point removes identity headers and resolves a verified session. API routes authorize resource ownership and staff assignments independently. The catalogue is public metadata; paid lesson bodies are private. Preview assets are not shipped in the production bundle.

| Role | Intended scope |
|---|---|
| Learner | Own access, drafts, submissions, private records and issued certificates |
| Mentor | Read learning content within appointed scope; cannot approve or verify submissions |
| Reviewer | Read assigned evidence and record an assessment within qualified scope |
| Verifier | Independently verify assigned evidence and review decisions |
| Owner | Configure products, appoint staff, grant access, assign reviewers, inspect records and revoke awards |

Staff appointments carry one role and a scoped domain list per account. Use separate reviewer and verifier accounts. New guided pathway appointments and legacy programme appointments share the staff table; replacing an appointment also replaces its scope. Review the full scope before editing an existing appointment.

## Before a paid pilot

1. Approve the curriculum with named subject reviewers. Country-sensitive career programmes need local professional review.
2. Publish real terms, privacy information, refund terms, support contact and assessment appeal procedures.
3. Exercise registration, recovery, sign-out, account suspension and cross-account record isolation on the deployed domain.
4. Complete the configured providers’ test-event matrices and replay delivery after a deliberate endpoint failure.
5. Test a full reviewer/verifier cycle and certificate revocation with separate accounts.
6. Restore a backup into a separate database and reconcile known learner records.
7. Check retention requirements and define deletion handling for private learning evidence.

## Measure before increasing cohort size

Load-test 100, 500 and 1,000 concurrent synthetic sessions as separate stages. These numbers are test targets, not a capacity claim. Measure p50/p95/p99 response time, database queries per save, write conflicts, failed submissions, cold starts and webhook backlog. Run bursts at lesson transitions and after scheduled sessions, not only steady traffic.

Set service objectives appropriate to your real customer contract. Track error rate and queue age. Alert on failing payment reconciliation, unusual authorization denial rates, stale submitted work and expired assessor qualifications. Give every alert an owner and recovery action.

## Growth architecture

- Store large evidence files in private object storage using signed uploads, malware scanning, size/type limits and controlled download links. This build accepts bounded JSON evidence and local file metadata, not unrestricted cloud file uploads.
- Move heavy or untrusted execution to isolated workers/containers with CPU, memory, network and execution-time limits. Never execute arbitrary learner code in the Academy API process.
- Add queues for email, grading jobs and large exports with stable job IDs, bounded retry and dead-letter handling.
- Keep payments idempotent and authoritative; introduce an outbox if delivery crosses additional services.
- Introduce organizations, seat allocations and tenant keys only with explicit membership checks on every query. This release is a single Academy, not a multi-tenant enterprise LMS.
- Add video delivery, captions and transcoding through a supported media service. No video hosting or live classroom service is fabricated here.
- Add model-backed tutoring through a server-side adapter with spend caps, data controls, source grounding and evaluation. The included prompt studio is an offline preparation tool.
- Add structured localization, translated content review, mobile/PWA offline synchronization and conflict resolution as separate, testable releases.

## Incident practice

Keep backups and production secrets outside the source archive. Rotate secrets after a confirmed exposure. For a payment incident, stop new checkout creation, retain signed event logs and reconcile provider orders before granting or revoking access. For an assessment dispute, preserve the submitted revision, reviewer evidence and verification record; record any revocation reason instead of deleting the history.
