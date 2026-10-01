Current extension: [STANDARD_ACADEMY.md](STANDARD_ACADEMY.md). This earlier implementation record is retained for provenance.

# DigitalBurj Academy v4 — implementation map

The rebuilt Academy preserves the repository identity and all original programme content, then adds a guided learning layer and enforceable cloud workflows. No changes were pushed to GitHub.

## Brand provenance

Reference repository: https://github.com/shamhar07-max/DigitalBurjFinalMain

Reference commit: `2cbd13980a623fd323ae67cec5adde83c248bb0f` (default branch `claude/blissful-hawking-p3i8px`, inspected 30 September 2026).

Seven brand/font assets in `content/brand-provenance.json` were compared byte-for-byte against that commit. The academy lockup, division mark, wordmark, favicon, Instrument Sans and Plus Jakarta Sans are original repository assets. The UI uses the repository's ivory `#f6f5f1`, green-black `#0f1714`, dark sidebar `#0b100e`, orange-red `#f23a1d`, accessible action red `#c9260e`, gray-green `#5d6560`, and warm border `#e4e1d9`. New screens extend the design language; they are not a pixel-identical copy of every repository page.

## Learning content

| Layer | Included content | Assessment meaning |
|---|---|---|
| Original programme library | 48 programmes, 192 missions, 576 preparation lesson units, 12 stages per mission | Preserved original practical curriculum and mentor explanations |
| Guided pathways | 9 pathways, 90 distinct project recipes, 540 ordered step instructions | New authored practice, organized in five levels |
| Levels | Beginner, Builder, Professional, Advanced, Expert practice | Describes task difficulty, not a guaranteed professional qualification |
| Recipe steps | Understand, inspect, make, check, explain, package | Each step retains written evidence; completion checks structure, not truth |
| Glossary | 30 plain-language terms | Searchable, within the dashboard |

The nine guided pathways cover digital confidence, web building, data, AI, automation, business operations, design, freelancing and production practice. Each has ten recipes and an initial 620-minute practice estimate. These are author estimates, not measured completion times. The 48 preserved programme hours are separate.

## Implemented surfaces

| Surface | Behavior |
|---|---|
| My learning | Next task, real browser progress, recent activity and tool shortcuts |
| Explore pathways | Search, five-level curriculum, prerequisites and planned pace |
| Recipe workspace | Six ordered stages, editable evidence, acceptance checks, export, cloud save and submission |
| Programme library | All 48 original programmes open their correct 12-stage workspace |
| Writing desk | Private local draft and Markdown export |
| Web studio | HTML/CSS/JavaScript editor, sandboxed live preview and HTML export |
| Data desk | CSV total/average/min/max and bounded SQL trainer |
| Prompt studio | Structured prompt builder and export; no claim of a live AI model |
| Automation lab | Fictional validation, duplicate, approval and retry simulation |
| API console | Fictional requests with ownership, validation and idempotency |
| Payment receipt | A 3D printer feeds a receipt after a signed payment event creates the record; owned-order history, print/PDF, and refund status |
| Projects & evidence | Practice portfolio, backups, conservative restore and cloud assessment status |
| Progress | Charts derived from recorded practice, without seeded fake achievements |
| Planner | Local-time session planning and ICS calendar export |
| Certificates | Branded print layout, sample watermark, issue request and public verification |
| Access & purchases | Real entitlement state; Stripe-hosted checkout only when approved products are configured |
| Staff workspace | Assigned evidence, review/verification, owner grants and appointments, certificate revocation |
| Account services | Preserved verified-email sign-in, recovery, encrypted provider tokens, secure cookies and account administration |

## Server-enforced boundaries

- Browser-supplied `oai-authenticated-user-*` headers are removed at the deployed entry point.
- Session identity is obtained through the configured Supabase project. Passwords remain with the identity provider.
- A paid recipe is delivered through `/api/academy/course/:id` only after a current entitlement or scoped staff authorization is checked.
- `preview-data.js` is excluded from the deployed asset bundle and explicitly returns 404. The source ZIP necessarily contains the authored curriculum for the owner.
- Original 48 programmes remain free practice content; paid entitlements apply to the new guided pathways. Do not assume the legacy library is paywalled.
- Saves use expected revisions. A conflicting write returns 409. Submitted and verified evidence cannot be overwritten by the learner.
- Reviews require the assigned qualified reviewer. Verification requires a different assigned qualified verifier; neither can be the learner.
- Certificate issue requires all ten pathway recipes to be Verified, current assessor qualifications and public-name consent. Public lookup reveals only the credential's intentional public fields.
- Full refunds and disputes revoke access from that purchase. A separate scholarship grant remains independent. Partial refunds retain access; dispute closure does not automatically restore it and needs an owner decision.
- Payment scope and duration are snapshotted at checkout. Signed payment events are idempotent. Price, currency and order references are checked before fulfilment.
- Preview progress, imports and role labels never create server entitlements, staff permissions or certificates.

## Production scope and limitations

This is a runnable source release and local interactive preview, with implemented deployment adapters. No live identity project, merchant account, production database, email service or qualified assessor roster is provisioned by the ZIP. No live charges or certificates were issued while building it.

It is not yet a independently reviewed global curriculum or an accredited institution. Local practice checks validate structure and specified simulation outcomes, not subject-matter mastery. The more advanced recipes are project briefs and evidence requirements rather than hundreds of hours of recorded instruction. Real code infrastructure, physical printing, independent review and repeated real-world delivery are still needed for professional competence.

The HTML workbench is a browser sandbox, not a general remote Linux environment. The SQL trainer implements a limited SELECT grammar, not a hosted database. The prompt tool does not call an AI model. No third-party desktop tool is embedded without permission or a supported integration.

The D1/Worker architecture is deployable, but global throughput, disaster recovery and concurrent user capacity have not been load-tested. The archive includes a scaling plan and rollout gates instead of claiming unmeasured capacity.

The physical manufacturing course and tool were removed following the user’s clarification. See WORKFLOW_CORRECTION.md for the current end-to-end workflow and receipt lifecycle.
