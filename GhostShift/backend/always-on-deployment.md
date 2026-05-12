# GhostShift Always-On Server Plan

GhostShift needs an always-on backend for account dashboards, Stripe Checkout Sessions, subscription state, and extension configuration.

## What must stay online

- `GET /api/health`
- `GET /api/extension-config`
- `POST /api/create-checkout-session`
- Static dashboard pages
- Future Stripe webhook endpoint

## Recommended production setup

Use any always-on Node host that supports environment variables and health checks:

- Render web service
- Fly.io machine
- Railway service
- DigitalOcean app or droplet
- AWS Lightsail or ECS
- A VPS with Docker Compose

For the most control, use the Docker files in this folder and keep the container running with `restart: unless-stopped`.

## Local always-on style test

```powershell
$env:STRIPE_SECRET_KEY="sk_test_your_key_here"
$env:STRIPE_PRICE_PLUS="price_plus_id"
$env:STRIPE_PRICE_FAMILY="price_family_id"
node .\GhostShift\backend\server.mjs
```

Open:

`http://localhost:8787/dashboard.html`

Health check:

`http://localhost:8787/api/health`

Extension config:

`http://localhost:8787/api/extension-config`

## Production requirements before real users

- Real database for user accounts and subscription records.
- Stripe webhook endpoint for subscription updates.
- HTTPS domain.
- Monitoring that checks `/api/health` every 1 to 5 minutes.
- Backups for account database.
- Privacy policy and terms pages.
- Store review disclosures for the extension and mobile apps.
