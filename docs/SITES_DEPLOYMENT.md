# Private Sites deployment

This new Site imports the completed Academy ZIP. It has its own Sites project identity, with no changes to the GitHub repository. The old project recorded in the source ZIP was unavailable in the selected account; the user approved a new private Academy Site.

The hosted application sets `ACADEMY_MODE=preview` explicitly until identity and merchant services are configured. The existing practice banner, local drafts, curriculum, tools, sample receipt animation and exports work as in the supplied local preview. API account permissions and administration remain protected; practice completion cannot issue a live certificate. No accounts, staff qualifications, products or payment records are invented.

Sites provides the Worker and D1 binding. To activate the connected Academy, configure the managed identity and merchant settings described in DEPLOYMENT.md, appoint qualified assessors, complete the release checks, set `ACADEMY_MODE=connected`, and redeploy. Connected mode refuses `/preview-data.js` and protects lesson bodies through the existing entitlement API.

Keep this Site private while practice mode exposes the full authored practice curriculum. The session encryption key must be 64 lowercase hexadecimal characters, matching the existing authentication implementation.

The Academy integration update adds a shared Professional Practice Workspace, a twelve-chapter guide and branded register/sign-in/recovery/profile pages. See ACADEMY_INTEGRATION.md. Account forms remain disabled until managed identity and secure sessions are configured.
